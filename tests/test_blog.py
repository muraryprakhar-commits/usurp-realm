#!/usr/bin/env python3
"""Checks the built /blog/ pages: structured data, meta, links to the games, sitemap entries, wording rules, and that
each page renders at phone width without errors or sideways scrolling.
Run from the repo root after `python3 tools/build.py`:  python3 tests/test_blog.py
The rendering test needs Playwright with Chromium."""
import functools, html, http.server, json, os, re, sys, threading, unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import blog as BLOG  # noqa: E402

GAME_SLUG = {'morris': 'games/nine-mens-morris.html', 'tafl': 'games/viking-chess.html', 'usurper': 'games/the-usurper.html'}


def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read()


def ld(doc):
    m = re.search(r'<script type="application/ld\+json">(.*?)</script>', doc, re.S)
    return json.loads(m.group(1).replace('<\\/', '</'))


def text(doc):
    main = doc.split('<main>', 1)[1].split('</main>', 1)[0]
    return html.unescape(re.sub(r'<[^>]+>', ' ', re.sub(r'<svg.*?</svg>', ' ', main, flags=re.S)))


class BlogBuild(unittest.TestCase):
    def test_five_posts_built(self):
        self.assertEqual(len(BLOG.POSTS), 5)
        for q in BLOG.POSTS:
            self.assertTrue(os.path.exists(os.path.join(ROOT, q['slug'])), q['slug'])

    def test_article_structured_data(self):
        for q in BLOG.POSTS:
            g = ld(read(q['slug']))['@graph']
            art = next(x for x in g if x['@type'] == 'Article')
            for k in ('headline', 'description', 'datePublished', 'author', 'publisher', 'image', 'mainEntityOfPage'):
                self.assertTrue(art.get(k), f'{q["slug"]} Article.{k}')
            self.assertLessEqual(len(art['headline']), 110, 'Google truncates long headlines')
            self.assertTrue(any(x['@type'] == 'BreadcrumbList' for x in g))

    def test_meta_description_and_canonical(self):
        for q in BLOG.POSTS:
            doc = read(q['slug'])
            m = re.search(r'<meta name="description" content="([^"]+)"', doc)
            self.assertTrue(m, q['slug'])
            self.assertTrue(70 <= len(html.unescape(m.group(1))) <= 170, f'{q["slug"]}: description length {len(m.group(1))}')
            self.assertIn(f'<link rel="canonical" href="https://usurp.games/{q["slug"]}">', doc)

    def test_each_post_links_to_its_game(self):
        for q in BLOG.POSTS:
            self.assertIn(f'href="/{GAME_SLUG[q["game"]]}"', read(q['slug']).split('<main>', 1)[1], q['slug'])

    def test_internal_links_resolve(self):
        for rel in ['blog/index.html'] + [q['slug'] for q in BLOG.POSTS]:
            main = read(rel).split('<main>', 1)[1].split('</main>', 1)[0]
            for href in re.findall(r'href="(/[^"#?]*)', main):
                path = href.lstrip('/') or 'index.html'
                if path.endswith('/'):
                    path += 'index.html'
                self.assertTrue(os.path.exists(os.path.join(ROOT, path)), f'{rel} links to missing {href}')

    def test_no_placeholders_left(self):
        for q in BLOG.POSTS:
            self.assertNotIn('{{', read(q['slug']), q['slug'])

    def test_wording_rules(self):
        for q in BLOG.POSTS:
            t = text(read(q['slug']))
            self.assertNotIn('—', t, f'{q["slug"]}: em dash')
            self.assertGreaterEqual(len(t.split()), 450, f'{q["slug"]}: too thin to be useful')

    def test_linked_from_hub_footer_and_sitemap(self):
        self.assertIn('href="/blog/"', read('games/index.html').split('<main>', 1)[1].split('</main>', 1)[0])
        self.assertIn('href="/blog/">Blog</a>', read('index.html').split('<footer', 1)[1])
        sm = read('sitemap.xml')
        for rel in ['blog/'] + [q['slug'] for q in BLOG.POSTS]:
            self.assertIn(f'<loc>https://usurp.games/{rel}</loc>', sm)


class BlogRender(unittest.TestCase):
    def test_phone_width_renders_cleanly(self):
        from playwright.sync_api import sync_playwright

        class Quiet(http.server.SimpleHTTPRequestHandler):
            def log_message(self, *a): pass
        srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=ROOT))
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        try:
            with sync_playwright() as p:
                b = p.chromium.launch()
                for rel in ['blog/'] + [q['slug'] for q in BLOG.POSTS]:
                    for w in (390, 1280):
                        pg = b.new_page(viewport={'width': w, 'height': 900})
                        errors = []
                        pg.on('pageerror', lambda e: errors.append(str(e)))
                        pg.route('**/*clarity*', lambda r: r.abort())   # no analytics from tests
                        pg.route('**/_vercel/**', lambda r: r.abort())
                        pg.goto(f'http://127.0.0.1:{srv.server_port}/{rel}')
                        self.assertEqual(errors, [], rel)
                        self.assertLessEqual(pg.evaluate('document.documentElement.scrollWidth'), w, f'{rel} at {w}px')
                        pg.close()
                b.close()
        finally:
            srv.shutdown(); srv.server_close()


if __name__ == '__main__':
    unittest.main(verbosity=1)
