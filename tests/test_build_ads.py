#!/usr/bin/env python3
"""Checks that AdSense switches on from the one ADS setting in tools/build.py, and is fully off without it.
Builds a throwaway copy of the site twice (placeholder publisher ID, then empty) and inspects the output.
Run from the repo root:  python3 tests/test_build_ads.py"""
import os, re, shutil, subprocess, sys, tempfile, unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = 'ca-pub-0000000000000000'     # placeholder only, not a real account
SLOT = '1234567890'
GUIDE, GAME, HOME = 'lion-coat-of-arms.html', 'games/archery.html', 'index.html'
NO_ADS = ['crest.html', 'games/embed.html']   # the designer/checkout and the embeddable games never carry ads


def build(client, slot):
    tmp = tempfile.mkdtemp(prefix='usurp-ads-')
    site = os.path.join(tmp, 'site')
    shutil.copytree(ROOT, site, ignore=shutil.ignore_patterns('.git', 'node_modules'))
    bp = os.path.join(site, 'tools', 'build.py')
    with open(bp, encoding='utf-8') as f:
        src = f.read()
    new, n = re.subn(r"^ADS = \{'client': '[^']*', 'slot': '[^']*'", f"ADS = {{'client': '{client}', 'slot': '{slot}'", src, flags=re.M)
    assert n == 1, 'ADS line not found in tools/build.py'
    with open(bp, 'w', encoding='utf-8') as f:
        f.write(new)
    subprocess.run([sys.executable, bp], cwd=site, check=True, capture_output=True)
    return site


def read(site, rel):
    with open(os.path.join(site, rel), encoding='utf-8') as f:
        return f.read()


class AdsConfig(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.on = build(PUB, SLOT)
        cls.id_only = build(PUB, '')
        cls.off = build('', '')

    @classmethod
    def tearDownClass(cls):
        for s in (cls.on, cls.id_only, cls.off):
            shutil.rmtree(os.path.dirname(s), ignore_errors=True)

    def test_ads_txt_written_with_publisher_id(self):
        self.assertEqual(read(self.on, 'ads.txt'), 'google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0\n')
        self.assertEqual(read(self.id_only, 'ads.txt'), 'google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0\n')

    def test_ads_txt_removed_when_off(self):
        self.assertFalse(os.path.exists(os.path.join(self.off, 'ads.txt')))

    def test_site_verification_meta_on_home_guides_and_games(self):
        tag = f'<meta name="google-adsense-account" content="{PUB}">'
        for rel in (HOME, GUIDE, GAME, 'games/index.html'):
            self.assertIn(tag, read(self.on, rel), rel)
            self.assertIn(tag, read(self.id_only, rel), rel)
            self.assertNotIn('google-adsense-account', read(self.off, rel), rel)

    def test_slots_switch_on_with_id_and_unit(self):
        cfg = f'window.USURP_ADS={{"client":"{PUB}","slot":"{SLOT}"}}'
        self.assertIn(cfg, read(self.on, GUIDE))
        self.assertIn('/ads.js', read(self.on, GUIDE))
        self.assertIn(cfg, read(self.on, GAME))
        self.assertIn('data-ad-slot', read(self.on, GUIDE))   # the house slot that ads.js fills

    def test_id_without_unit_keeps_house_content(self):
        # With only the publisher ID the site is verifiable (meta + ads.txt) but no display units load yet.
        self.assertNotIn('/ads.js', read(self.id_only, GUIDE))
        self.assertIn('data-ad-slot', read(self.id_only, GUIDE))

    def test_off_means_no_network_code(self):
        for rel in (HOME, GUIDE, GAME):
            html = read(self.off, rel)
            self.assertNotIn('ca-pub-', html, rel)
            self.assertNotIn('/ads.js', html, rel)
            self.assertNotIn('pagead2.googlesyndication', html, rel)

    def test_no_ads_on_studio_or_embeds(self):
        for rel in NO_ADS:
            html = read(self.on, rel)
            self.assertNotIn('/ads.js', html, rel)
            self.assertNotIn(SLOT, html, rel)

    def test_committed_site_matches_ads_off(self):
        # What is deployed today must be the "off" build, so no stray ads.txt or publisher ID is live.
        self.assertFalse(os.path.exists(os.path.join(ROOT, 'ads.txt')))
        for rel in (HOME, GUIDE, GAME):
            self.assertNotIn('ca-pub-', read(ROOT, rel), rel)


if __name__ == '__main__':
    unittest.main(verbosity=1)
