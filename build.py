#!/usr/bin/env python3
"""Builds the static pages: index.html (RU), ro/index.html, en/index.html.

Run after editing src/template.html, src/partials/* or src/i18n/*.json:
    python3 build.py
"""
import json, re, pathlib

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / 'src'
LANGS = {'ru': ('', ''), 'ro': ('ro/', '../'), 'en': ('en/', '../')}  # lang: (output dir, base path)
COMMON = {
    'phone_tel': '+37360001009',
    'phone_display': '+373 60 001 009',
    'email': 'bmlogisticplus@gmail.com',
}

def render(tpl, data):
    tpl = re.sub(r'\{\{>(\w+)\}\}', lambda m: (SRC / 'partials' / f'{m.group(1)}.svg').read_text(encoding='utf-8'), tpl)
    def sub(m):
        k = m.group(1)
        if k not in data:
            raise KeyError(f'missing key: {k}')
        return data[k]
    return re.sub(r'\{\{(\w+)\}\}', sub, tpl)

def main():
    tpl = (SRC / 'template.html').read_text(encoding='utf-8')
    keys = None
    for lang, (outdir, base) in LANGS.items():
        t = json.loads((SRC / 'i18n' / f'{lang}.json').read_text(encoding='utf-8'))
        if keys is None:
            keys = set(t)
        elif set(t) != keys:
            raise SystemExit(f'{lang}.json keys differ: {sorted(keys ^ set(t))}')
        data = dict(COMMON, **t)
        data.update(lang=lang, base=base, path='/' + outdir)
        for l2, (d2, _) in LANGS.items():
            data[f'href_{l2}'] = base + d2 + 'index.html'
            data[f'cur_{l2}'] = 'aria-current="page"' if l2 == lang else ''
        out = ROOT / outdir / 'index.html'
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(render(tpl, data), encoding='utf-8')
        print('built', out.relative_to(ROOT))

if __name__ == '__main__':
    main()
