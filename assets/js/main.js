(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Year
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // ----- Mobile menu -----
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('nav');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (burger) {
    burger.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); setCall(false); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  }

  // ----- Call popover -----
  var call = document.getElementById('call');
  var callBtn = call && call.querySelector('.call-btn');
  function setCall(open) {
    if (!call) return;
    call.classList.toggle('open', open);
    callBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (callBtn) {
    callBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !call.classList.contains('open');
      setCall(open); setMenu(false);
      if (open) { var n = call.querySelector('.call-num'); if (n) n.focus({ preventScroll: true }); }
    });
    document.addEventListener('click', function (e) { if (!call.contains(e.target)) setCall(false); });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { setCall(false); setMenu(false); }
  });

  // ----- Reveal on scroll -----
  var revealEls = [].slice.call(document.querySelectorAll('.reveal, #steps'));
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  // ----- Split-flap title -----
  var flip = document.getElementById('flip');
  if (flip) {
    var rows = (flip.getAttribute('data-words') || '').split('|');
    var abc = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯABCDEFGHIJKLMNOPRSTUVWXYZ0123456789';
    var cols = [];
    flip.textContent = '';
    var idx = 0;
    rows.forEach(function (word) {
      var row = document.createElement('span');
      row.className = 'flip-row'; row.setAttribute('aria-hidden', 'true');
      word.split('').forEach(function (ch) {
        var tile = document.createElement('span');
        tile.className = 'flap' + (ch === ' ' ? ' gap' : '');
        if (ch !== ' ') {
          var col = document.createElement('span');
          col.className = 'flap-col';
          col.dataset.ch = ch; col.dataset.i = idx++;
          tile.appendChild(col); cols.push(col);
        }
        row.appendChild(tile);
      });
      flip.appendChild(row);
    });
    var cycle = 0;
    var spin = function () {
      cycle++;
      cols.forEach(function (col) {
        var i = +col.dataset.i, n = 6 + (i % 4) + Math.floor(i / 2);
        var html = '';
        for (var k = 0; k < n; k++) html += '<span class="flap-ch">' + abc[Math.floor(Math.random() * abc.length)] + '</span>';
        html += '<span class="flap-ch">' + col.dataset.ch + '</span>';
        col.innerHTML = html;
        col.className = 'flap-col ' + (cycle % 2 ? 'a' : 'b');
        col.style.animationDuration = (0.8 + i * 0.12).toFixed(2) + 's';
        col.style.animationTimingFunction = 'steps(' + n + ', end)';
      });
    };
    if (reduce) {
      cols.forEach(function (c) { c.innerHTML = '<span class="flap-ch">' + c.dataset.ch + '</span>'; });
    } else {
      spin(); setInterval(spin, 9000);
    }
  }

  // ----- Booking form -----
  var form = document.getElementById('bform');
  if (!form) return;
  var sent = document.getElementById('sent');
  var err = document.getElementById('form-error');
  var carInput = form.querySelector('input[name="car"]');
  [].forEach.call(form.querySelectorAll('.pill'), function (p, _, all) {
    p.addEventListener('click', function () {
      [].forEach.call(form.querySelectorAll('.pill'), function (q) { q.setAttribute('aria-pressed', q === p ? 'true' : 'false'); });
      carInput.value = p.getAttribute('data-car');
    });
  });
  var rt = document.getElementById('roundtrip');
  var ret = document.getElementById('return');
  rt.addEventListener('change', function () {
    ret.classList.toggle('show', rt.checked);
    [].forEach.call(ret.querySelectorAll('input'), function (i) { i.required = rt.checked; });
  });
  // no past dates
  var today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  var iso = today.toISOString().slice(0, 10);
  [].forEach.call(form.querySelectorAll('input[type="date"]'), function (d) { d.min = iso; });

  var submit = form.querySelector('button[type="submit"]');
  var label = submit.textContent;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.hidden = true;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = typeof v === 'string' ? v.trim() : v; });
    data.roundtrip = rt.checked;
    submit.disabled = true; submit.textContent = submit.getAttribute('data-sending');
    fetch(window.MG.api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.ok) throw new Error(j.error || r.status); }); })
      .then(function () {
        form.hidden = true; sent.classList.add('show'); sent.focus({ preventScroll: true });
        sent.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      })
      .catch(function () { err.hidden = false; })
      .then(function () { submit.disabled = false; submit.textContent = label; });
  });
  document.getElementById('again').addEventListener('click', function () {
    form.reset(); rt.dispatchEvent(new Event('change'));
    [].forEach.call(form.querySelectorAll('.pill'), function (q) { q.setAttribute('aria-pressed', q.getAttribute('data-car') === 'S-Class' ? 'true' : 'false'); });
    carInput.value = 'S-Class';
    sent.classList.remove('show'); form.hidden = false;
  });
})();
