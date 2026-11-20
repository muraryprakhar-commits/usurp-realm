#!/usr/bin/env python3
"""Plays a solo (bots) match of The Usurper headless, fast-forwarded, and checks the end screen offers
'Invite friends', which opens a private room. Run from the repo root:  python3 tests/test_usurper_invite.py"""
import functools, http.server, os, threading, unittest
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class SoloInvite(unittest.TestCase):
    def test_solo_end_offers_invite(self):
        class Quiet(http.server.SimpleHTTPRequestHandler):
            def log_message(self, *a): pass
        srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=ROOT))
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        try:
            with sync_playwright() as p:
                b = p.chromium.launch()
                pg = b.new_page(viewport={'width': 390, 'height': 844})
                errors = []
                pg.on('pageerror', lambda e: errors.append(str(e)))
                pg.route('**/api/**', lambda r: r.fulfill(status=204, body=''))   # no play counts from tests
                pg.goto(f'http://127.0.0.1:{srv.server_port}/games/the-usurper.html')
                pg.wait_for_function('window.__us', timeout=20000)   # test hook, exposed on localhost only
                pg.evaluate('__us.playSolo()')
                self.assertEqual(pg.evaluate('__us.ff(1500)'), 'end')
                pg.wait_for_selector('[data-invite]', timeout=8000)
                self.assertIn('Better with friends', pg.text_content('.us-invite'))
                pg.click('[data-invite]')
                pg.wait_for_function("document.body.textContent.includes('Opening a room') || location.hash.startsWith('#room=')", timeout=8000)
                self.assertEqual(errors, [])
                b.close()
        finally:
            srv.shutdown(); srv.server_close()


if __name__ == '__main__':
    unittest.main(verbosity=1)
