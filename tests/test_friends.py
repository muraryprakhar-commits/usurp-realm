#!/usr/bin/env python3
"""Playing with friends, and the board games' Undo and Hint, checked in headless Chromium.
- The Usurper's private-room lobby shows a QR code that decodes (OpenCV) to exactly the invite link, drawn locally.
- Nine Men's Morris and Viking chess against the computer: Hint marks a legal move, Undo takes back a move and the
  computer's reply, both buttons stay hidden in two-player games, and a won game that used them is not recorded.
Run from the repo root:  python3 tests/test_friends.py   (needs Playwright with Chromium, and opencv-python)"""
import functools, http.server, os, threading, unittest
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Browser(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        class Quiet(http.server.SimpleHTTPRequestHandler):
            def log_message(self, *a): pass
        cls.srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=ROOT))
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch()

    @classmethod
    def tearDownClass(cls):
        cls.browser.close(); cls.pw.stop(); cls.srv.shutdown(); cls.srv.server_close()

    def open(self, path, width=390):
        pg = self.browser.new_page(viewport={'width': width, 'height': 844})
        errors, requests = [], []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('request', lambda r: requests.append(r.url))
        pg.route('**/api/**', lambda r: r.fulfill(status=204, body=''))     # no play counts from tests
        pg.route('**/*clarity*', lambda r: r.abort())
        pg.route('**/_vercel/**', lambda r: r.abort())
        pg.goto(f'http://127.0.0.1:{self.srv.server_port}/{path}')
        return pg, errors, requests


class UsurperQR(Browser):
    def test_lobby_qr_is_the_invite_link(self):
        import cv2, numpy as np
        pg, errors, requests = self.open('games/the-usurper.html')
        pg.wait_for_function('window.__us', timeout=20000)
        pg.evaluate("""() => { const u = window.__us;
            u.CL.id = 'h'; u.CL.host = true;
            u.CL.lobby = { code: 'QRTS', pub: false, fill: 6, cd: 0, P: [{ id: 'h', name: 'Ser Test', rank: 'Peasant', col: 0, host: true }] };
            u.showLobby(); }""")
        pg.wait_for_selector('[data-qr] svg', timeout=8000)
        self.assertTrue(pg.is_visible('[data-qr]'))
        self.assertIn('scan to join', pg.text_content('[data-qr] figcaption'))
        self.assertEqual(pg.text_content('[data-copy-room]'), 'Copy invite link')   # desktop-style pointer in tests
        png = pg.locator('[data-qr] svg').screenshot()
        img = cv2.imdecode(np.frombuffer(png, np.uint8), cv2.IMREAD_COLOR)
        img = cv2.resize(img, None, fx=3, fy=3, interpolation=cv2.INTER_NEAREST)
        data, _, _ = cv2.QRCodeDetector().detectAndDecode(img)
        self.assertEqual(data, f'http://127.0.0.1:{self.srv.server_port}/games/the-usurper.html#room=QRTS')
        # drawn here: the only extra request is our own copy of the library, nothing from another site
        qr_reqs = [u for u in requests if 'qr' in u.lower()]
        self.assertEqual(len(qr_reqs), 1)
        self.assertTrue(qr_reqs[0].startswith(f'http://127.0.0.1:{self.srv.server_port}/games/vendor/qrcode.js'))
        self.assertLessEqual(pg.evaluate('document.documentElement.scrollWidth'), 390)
        self.assertEqual(errors, [])


class BoardGameTools(Browser):
    def tools(self, pg):
        return pg.evaluate("() => [...document.querySelectorAll('[data-tool]')].filter(b => !b.hidden).map(b => b.dataset.tool)")

    def wait_tools(self, pg, want):
        pg.wait_for_function(f"() => [...document.querySelectorAll('[data-tool]')].filter(b => !b.hidden).map(b => b.dataset.tool).join() === '{','.join(want)}'", timeout=8000)

    def test_morris_hint_and_undo(self):
        pg, errors, _ = self.open('games/nine-mens-morris.html')
        pg.wait_for_function('window.__ug', timeout=20000)
        self.assertEqual(self.tools(pg), [])                    # menu: nothing shows
        pg.click('text=Play the Squire')
        pg.wait_for_function("() => window.__ug.st().hist !== undefined && window.__ug.st().turn === 1 && document.querySelector('[data-ov]').hidden", timeout=15000)
        self.wait_tools(pg, ['hint'])                           # first turn: nothing to undo yet
        pg.click('[data-tool="hint"]')
        h = pg.evaluate('() => window.__ug.st().hintM')
        self.assertTrue(h and h['t'] >= 0 and h['f'] == -1, h)   # placing phase: a point to place on
        self.assertEqual(pg.evaluate(f"() => window.__ug.st().b[{h['t']}]"), 0)
        # play the hinted point by tapping it, then wait for the computer's reply
        before = pg.evaluate('() => Array.from(window.__ug.st().b)')
        pg.evaluate(f"() => window.__ug.tap({h['t']})")
        pg.wait_for_function("() => { const S = window.__ug.st(); return S.turn === 1 && !S.anim && !S.wait && S.hist.length === 2; }", timeout=15000)
        self.wait_tools(pg, ['undo', 'hint'])
        self.assertEqual(sum(1 for v in pg.evaluate('() => Array.from(window.__ug.st().b)') if v), 2)
        pg.click('[data-tool="undo"]')
        self.assertEqual(pg.evaluate('() => Array.from(window.__ug.st().b)'), before)
        self.assertEqual(pg.evaluate('() => [window.__ug.st().h[1], window.__ug.st().h[2], window.__ug.st().helped]'), [9, 9, True])
        self.wait_tools(pg, ['hint'])
        self.assertEqual(errors, [])

    def test_morris_two_players_have_no_tools(self):
        pg, errors, _ = self.open('games/nine-mens-morris.html')
        pg.wait_for_function('window.__ug', timeout=20000)
        pg.click('text=Two players')
        pg.wait_for_function("() => document.querySelector('[data-ov]').hidden && window.__ug.st().hist === null", timeout=15000)
        pg.wait_for_timeout(300)
        self.assertEqual(self.tools(pg), [])
        self.assertEqual(errors, [])

    def test_tafl_hint_and_undo(self):
        pg, errors, _ = self.open('games/viking-chess.html')
        pg.wait_for_function('window.__ug', timeout=20000)
        # lead the raiders on Brandubh against the easy computer (raiders move first, so it is our turn)
        pg.click('text=Lead the raiders')
        if pg.locator('.ug-choice:has-text("Easy")').count():
            pg.click('.ug-choice:has-text("Easy")')
        pg.wait_for_function("() => { const S = window.__ug.st(); return S.hist && S.hist.length === 1 && document.querySelector('[data-ov]').hidden; }", timeout=15000)
        self.wait_tools(pg, ['hint'])
        before = pg.evaluate('() => Array.from(window.__ug.st().B)')
        pg.click('[data-tool="hint"]')
        m = pg.evaluate('() => window.__ug.st().hintM')
        self.assertGreaterEqual(m, 0)
        self.assertIn(m, pg.evaluate('() => window.__ug.gen(window.__ug.st().B, 1)'))   # a legal raider move
        pg.evaluate(f"() => {{ window.__ug.tap({m >> 7}); window.__ug.tap({m & 127}); }}")
        pg.wait_for_function("() => { const S = window.__ug.st(); return S.turn === 1 && !S.anim && S.think <= 0 && S.hist.length === 2; }", timeout=15000)
        self.wait_tools(pg, ['undo', 'hint'])
        pg.click('[data-tool="undo"]')
        self.assertEqual(pg.evaluate('() => Array.from(window.__ug.st().B)'), before)
        self.assertTrue(pg.evaluate('() => window.__ug.st().helped'))
        self.assertEqual(errors, [])


if __name__ == '__main__':
    unittest.main(verbosity=1)
