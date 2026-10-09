// Cloudflare Pages Function: POST /api/booking
// Sends a booking request to Telegram.
// Required environment variables (Cloudflare Pages → Settings → Environment variables):
//   TELEGRAM_BOT_TOKEN — token from @BotFather
//   TELEGRAM_CHAT_ID   — chat or group id that receives the requests

const LIMITS = { car: 20, from: 200, to: 200, date: 10, time: 5, pax: 2, flight: 20, name: 100, phone: 30, comment: 1000, returnDate: 10, returnTime: 5, lang: 2 };
const REQUIRED = ['from', 'to', 'date', 'time', 'name', 'phone'];

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

export async function onRequestPost({ request, env }) {
  let data;
  try { data = await request.json(); } catch { return json({ ok: false, error: 'bad_json' }, 400); }
  if (!data || typeof data !== 'object') return json({ ok: false, error: 'bad_body' }, 400);

  // Honeypot: real visitors never fill this field.
  if (data.company) return json({ ok: true });

  const clean = {};
  for (const [k, max] of Object.entries(LIMITS)) {
    const v = data[k] == null ? '' : String(data[k]).trim();
    if (v.length > max) return json({ ok: false, error: `too_long_${k}` }, 400);
    clean[k] = v;
  }
  for (const k of REQUIRED) if (!clean[k]) return json({ ok: false, error: `missing_${k}` }, 400);
  if (!/^[+\d\s()\-]{6,30}$/.test(clean.phone)) return json({ ok: false, error: 'bad_phone' }, 400);
  const roundtrip = data.roundtrip === true;

  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return json({ ok: false, error: 'not_configured' }, 500);

  const lines = [
    '<b>🚘 Новая заявка — Mercury Group</b>',
    '',
    `<b>Автомобиль:</b> ${esc(clean.car || '—')}`,
    `<b>Откуда:</b> ${esc(clean.from)}`,
    `<b>Куда:</b> ${esc(clean.to)}`,
    `<b>Дата и время:</b> ${esc(clean.date)} ${esc(clean.time)}`,
    `<b>Пассажиры:</b> ${esc(clean.pax || '1')}`,
  ];
  if (clean.flight) lines.push(`<b>Рейс:</b> ${esc(clean.flight)}`);
  if (roundtrip) lines.push(`<b>Обратно:</b> ${esc(clean.returnDate || '—')} ${esc(clean.returnTime || '')}`);
  lines.push('', `<b>Имя:</b> ${esc(clean.name)}`, `<b>Телефон:</b> ${esc(clean.phone)}`);
  if (clean.comment) lines.push(`<b>Комментарий:</b> ${esc(clean.comment)}`);
  lines.push('', `<i>Язык сайта: ${esc(clean.lang || 'ru').toUpperCase()}</i>`);

  const tg = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: lines.join('\n'), parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  if (!tg.ok) return json({ ok: false, error: 'telegram_failed' }, 502);
  return json({ ok: true });
}

export const onRequest = () => json({ ok: false, error: 'method_not_allowed' }, 405);
