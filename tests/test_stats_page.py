#!/usr/bin/env python3
"""Renders /stats.html in headless Chromium against fixed /api/stats answers and checks what it shows.
Needs Playwright:  pip install playwright --break-system-packages && python3 -m playwright install chromium
Run from the repo root:  python3 tests/test_stats_page.py"""
import functools, http.server, json, os, threading, unittest
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAMES = ['archery', 'joust', 'castle', 'duel', 'siege', 'tafl', 'morris', 'usurper']


def weeks(counts_by_index):
    starts = ['2026-11-09', '2026-11-02', '2026-10-26', '2026-10-19']
    return [{'week': f'2026-W{46 - i}', 'start': s, 'counts': counts_by_index.get(i, {})} for i, s in enumerate(starts)]


CASES = {
    'counts': {'ok': True, 'connected': True, 'store': 'blob', 'games': GAMES, 'updated': '2026-11-11T10:00:00Z',
               'all': {'joust': {'play': 15, 'finish': 6}, 'tafl': {'play': 5, 'finish': 0}},
               'weeks': weeks({0: {'joust': {'play': 3, 'finish': 1}}, 1: {'joust': {'play': 2, 'finish': 0}, 'tafl': {'play': 5, 'finish': 0}}})},
    'empty': {'ok': True, 'connected': True, 'store': 'blob', 'games': GAMES, 'updated': '2026-11-11T10:00:00Z', 'all': {}, 'weeks': weeks({})},
    'estimated': {'ok': True, 'connected': True, 'store': 'blob', 'games': GAMES, 'updated': '2026-11-11T10:00:00Z',
                  'budget': {'weeklyWrites': 200, 'sampleFrom': 120, 'sample': 10}, 'all': {'joust': {'play': 300, 'finish': 0}},
                  'weeks': [dict(w, approx=(i == 0), capped=(i == 1)) for i, w in enumerate(weeks({0: {'joust': {'play': 150, 'finish': 0}}, 1: {'joust': {'play': 150, 'finish': 0}}}))]},
    'off': {'ok': True, 'connected': False, 'games': GAMES, 'weeks': [], 'all': {}},
    'down': {'ok': False, 'connected': True, 'error': 'counter_unreachable'},
}


class StatsPage(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        class Quiet(http.server.SimpleHTTPRequestHandler):
            def log_message(self, *a): pass
        handler = functools.partial(Quiet, directory=ROOT)
        cls.srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch()

    @classmethod
    def tearDownClass(cls):
        cls.browser.close(); cls.pw.stop(); cls.srv.shutdown(); cls.srv.server_close()

    def open(self, case, width=1280):
        page = self.browser.new_page(viewport={'width': width, 'height': 900})
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        body = json.dumps(CASES[case])
        page.route('**/api/stats', lambda r: r.fulfill(status=502 if case == 'down' else 200, content_type='application/json', body=body))
        page.goto(f'http://127.0.0.1:{self.srv.server_port}/stats.html')
        page.wait_for_function("document.querySelector('[data-sub]').textContent.indexOf('Loading')<0")
        self.assertEqual(errors, [])
        return page

    def test_renders_stored_counts(self):
        page = self.open('counts')
        rows = page.eval_on_selector_all('table:not(.wk) tbody tr', 'rs=>rs.map(r=>[...r.cells].map(c=>c.textContent))')
        self.assertEqual(rows[0], ['The Joust', '3', '2', '5', '15', '6 (40%)'])
        self.assertEqual(rows[1], ['Viking Chess (Hnefatafl)', '0', '5', '5', '5', '0 (0%)'])
        self.assertEqual(rows[-1], ['All games', '3', '7', '10', '20', '6'])
        self.assertEqual(page.locator('[data-empty]').count(), 0)
        self.assertIn('This week started 9 Nov', page.text_content('[data-sub]'))

    def test_estimated_weeks_are_marked(self):
        page = self.open('estimated')
        dates = page.eval_on_selector_all('table.wk tbody tr td:first-child', 'cs=>cs.map(c=>c.textContent)')
        self.assertEqual(dates[:3], ['9 Nov ≈', '2 Nov *', '26 Oct'])
        self.assertIn('counts 1 play in 10', page.text_content('[data-budget]'))
        self.assertEqual(self.open('counts').locator('[data-budget]').count(), 0)

    def test_empty_but_connected(self):
        page = self.open('empty')
        self.assertIn('No plays recorded yet', page.text_content('[data-empty]'))

    def test_not_connected(self):
        page = self.open('off')
        self.assertIn('no storage is connected', page.text_content('[data-sub]'))
        self.assertIn('Vercel Blob', page.text_content('[data-out]'))

    def test_unreachable(self):
        page = self.open('down')
        self.assertIn('could not be reached', page.text_content('[data-sub]'))

    def test_phone_width_has_no_page_scroll(self):
        page = self.open('counts', width=390)
        self.assertLessEqual(page.evaluate('document.documentElement.scrollWidth'), 390)


if __name__ == '__main__':
    unittest.main(verbosity=1)
