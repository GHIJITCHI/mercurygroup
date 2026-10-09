# Mercury Group — сайт

Одностраничный сайт VIP-трансферов на трёх языках: русский (`/`), румынский (`/ro/`), английский (`/en/`).
Статический HTML/CSS/JS без зависимостей и без сборки на сервере, плюс одна Cloudflare Pages Function для отправки заявок в Telegram.

## Структура

```
index.html, ro/index.html, en/index.html   готовые страницы (генерируются build.py)
assets/css/style.css                       стили и анимации
assets/js/main.js                          меню, кнопка «Позвонить», табло, форма
assets/favicon.svg
functions/api/booking.js                   POST /api/booking → Telegram
src/template.html                          общий шаблон страницы
src/i18n/{ru,ro,en}.json                   тексты на трёх языках
src/partials/*.svg                         карта, глобус, рисунки автомобилей
build.py                                   сборка страниц из шаблона и переводов
```

## Как поменять тексты

1. Отредактируйте нужный файл в `src/i18n/` (ключи во всех трёх файлах должны совпадать).
2. Телефон и e-mail меняются в `build.py` (словарь `COMMON`).
3. Выполните `python3 build.py` и закоммитьте изменённые `index.html`, `ro/index.html`, `en/index.html`.

## Публикация на Cloudflare Pages

1. Cloudflare → Workers & Pages → Create → Pages → Connect to Git → выберите репозиторий `mercurygroup`.
2. Framework preset: **None**. Build command: оставить пустым. Build output directory: `/`.
3. После первого деплоя: Settings → Environment variables → добавьте
   - `TELEGRAM_BOT_TOKEN` — токен бота от @BotFather;
   - `TELEGRAM_CHAT_ID` — id чата или группы, куда приходят заявки
     (добавьте бота в группу, напишите в ней сообщение и откройте `https://api.telegram.org/bot<TOKEN>/getUpdates`, чтобы увидеть id).
4. Перезапустите деплой. Подключите домен в Custom domains.

Каждый push в `main` автоматически обновляет сайт.
