#!/usr/bin/env python3
"""Pings IndexNow (Bing, Yandex, Seznam, Naver, Yep) with every URL in sitemap.xml.
Run after a deploy: python3 tools/indexnow.py   No account needed; the key file at the site root proves ownership."""
import json, os, re, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
key = open(os.path.join(ROOT, 'tools', 'indexnow-key')).read().strip()
urls = re.findall(r'<loc>([^<]+)</loc>', open(os.path.join(ROOT, 'sitemap.xml')).read())
body = json.dumps({'host': 'usurp.games', 'key': key, 'keyLocation': f'https://usurp.games/{key}.txt', 'urlList': urls}).encode()
req = urllib.request.Request('https://api.indexnow.org/indexnow', data=body, headers={'Content-Type': 'application/json; charset=utf-8'})
with urllib.request.urlopen(req, timeout=30) as r:
    print('IndexNow', r.status, len(urls), 'urls')
