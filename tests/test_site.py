#!/usr/bin/env python3
"""Site-wide checks on the HTML in the repo (built pages and hand-written ones):
- every internal link and asset (href/src starting with /, outside scripts) points at a file that exists
- every image has alt text and intrinsic width/height (no layout shift while it loads)
- every game keeps its ways to bring a friend: the share row on its page, and a Challenge a friend or invite button in
  its JavaScript.
Run from the repo root:  python3 tests/test_site.py"""
import glob, json, os, re, unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = ('node_modules/', 'content/', 'tests/', 'tools/', '.git/')
DYNAMIC = ('/api/', '/_vercel/', '/c/')   # served by functions or Vercel, not files


def pages():
    out = []
    for f in glob.glob(os.path.join(ROOT, '**', '*.html'), recursive=True):
        rel = os.path.relpath(f, ROOT)
        if not rel.startswith(SKIP_DIRS):
            out.append(rel)
    return sorted(out)


def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read()


def redirects():
    with open(os.path.join(ROOT, 'vercel.json')) as f:
        cfg = json.load(f)
    return {r['source'] for r in cfg.get('redirects', [])} | {r['source'] for r in cfg.get('rewrites', [])}


class Site(unittest.TestCase):
    def test_internal_links_resolve(self):
        routes, missing = redirects(), []
        for rel in pages():
            doc = re.sub(r'<script\b.*?</script>', '', read(rel), flags=re.S)
            for u in re.findall(r'(?:href|src)="(/[^"#?]*)', doc):
                if u.startswith(DYNAMIC) or u in routes:
                    continue
                p = u.lstrip('/') or 'index.html'
                if p.endswith('/'):
                    p += 'index.html'
                if not (os.path.exists(os.path.join(ROOT, p)) or os.path.exists(os.path.join(ROOT, p + '.html'))):
                    missing.append(f'{rel} -> {u}')
        self.assertEqual(missing, [])

    def test_images_have_alt_and_size(self):
        bad = []
        for rel in pages():
            for tag in re.findall(r'<img\b[^>]*>', re.sub(r'<script\b.*?</script>', '', read(rel), flags=re.S)):
                if ' alt=' not in tag or ' width=' not in tag or ' height=' not in tag:
                    bad.append(f'{rel}: {tag[:90]}')
        self.assertEqual(bad, [])

    def test_every_game_can_bring_a_friend(self):
        games = {'archery': 'archery', 'joust': 'joust', 'castle-defense': 'castle', 'sword-duel': 'duel',
                 'trebuchet-game': 'trebuchet', 'viking-chess': 'tafl', 'nine-mens-morris': 'morris', 'the-usurper': 'usurper'}
        for page, js in games.items():
            self.assertIn('class="gm-share"', read(f'games/{page}.html'), page)
            src = read(f'games/{js}.js')
            self.assertTrue('Challenge a friend' in src or 'data-invite' in src, f'{js}.js has no share or invite button')


if __name__ == '__main__':
    unittest.main(verbosity=1)
