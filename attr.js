/* Usurp campaign attribution.
   Reads the marketing fields on the landing URL (utm_source, utm_medium, utm_campaign, utm_term, utm_content,
   utm_id, ref, and ad click IDs such as gclid, gbraid, wbraid, gad_source, gad_campaignid, msclkid, fbclid,
   ttclid, twclid, li_fat_id), works out the channel (paid search, organic search, social, AI, email, QR, referral,
   direct), keeps a first touch and a last touch in this browser, tags the Clarity session with them, and hands
   them to the Crest Studio checkout as Dodo metadata so every sale shows where the buyer came from.
   Does nothing when this browser turned analytics off at /privacy.html#analytics. */
(function (w, d) {
  if (w.UG_NOTRACK) { w.UG_ATTR = { first: null, last: null, now: null, checkout: function () { return {}; } }; return; }

  var FIRST = 'ug-attr-first', LAST = 'ug-attr-last', DAYS = 90;
  var UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'ref'];
  var CLICK = ['gclid', 'gbraid', 'wbraid', 'gad_source', 'gad_campaignid', 'msclkid', 'fbclid', 'ttclid', 'twclid', 'li_fat_id'];
  var cut = function (v, n) { return String(v == null ? '' : v).replace(/[\u0000-\u001f<>"]/g, '').trim().slice(0, n || 100); };
  var store = {
    get: function (k) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v && v.ts && Date.now() - v.ts < DAYS * 864e5 ? v : null; } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  var host = function (u) { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { return ''; } };
  var has = function (h, list) { return list.some(function (s) { return h === s || h.slice(-(s.length + 1)) === '.' + s || h.indexOf(s + '.') === 0; }); };
  var SEARCH = ['google', 'bing.com', 'duckduckgo.com', 'yahoo.com', 'search.yahoo.com', 'ecosia.org', 'yandex.ru', 'yandex.com', 'baidu.com', 'search.brave.com', 'startpage.com', 'qwant.com', 'naver.com'];
  var SOCIAL = ['facebook.com', 'm.facebook.com', 'l.facebook.com', 'instagram.com', 'l.instagram.com', 't.co', 'x.com', 'twitter.com', 'reddit.com', 'old.reddit.com', 'linkedin.com', 'lnkd.in', 'pinterest.com', 'youtube.com', 'tiktok.com', 'threads.net', 'threads.com', 'discord.com', 'telegram.org', 't.me', 'quora.com', 'tumblr.com', 'bsky.app', 'news.ycombinator.com', 'producthunt.com', 'snapchat.com', 'whatsapp.com', 'wa.me'];
  var AI = ['chatgpt.com', 'chat.openai.com', 'perplexity.ai', 'claude.ai', 'gemini.google.com', 'copilot.microsoft.com', 'you.com', 'phind.com', 'meta.ai', 'grok.com'];

  function channel(t) {
    var m = (t.utm_medium || '').toLowerCase(), s = (t.utm_source || '').toLowerCase(), r = t.referrer || '';
    if (t.gclid || t.gbraid || t.wbraid || t.gad_source || t.msclkid || /^(cpc|ppc|paid|paidsearch|paid_search|sem|search_ads)$/.test(m)) return 'paid_search';
    if (t.ttclid || t.twclid || t.li_fat_id || /^(paid_?social|social_?paid|social_ads|paid-social)$/.test(m)) return 'paid_social';
    if (/^(display|banner|cpm|retargeting)$/.test(m)) return 'display';
    if (/^(e-?mail|newsletter)$/.test(m) || /mail/.test(s)) return 'email';
    if (/^(qr|qr_?code|print|offline|poster|flyer|sticker|event)$/.test(m) || s === 'qr') return 'qr';
    if (/^(ai|llm|chatbot)$/.test(m) || has(s, AI)) return 'ai';
    if (/^(social|social-network|social_media|sm|organic_social)$/.test(m) || t.fbclid) return 'social';
    if (/^(affiliate|partner|referral|embed|widget)$/.test(m)) return 'referral';
    if (m || s) return has(s, SOCIAL) ? 'social' : has(s, SEARCH) ? 'organic_search' : 'campaign';
    if (!r) return 'direct';
    if (has(r, AI)) return 'ai';
    if (has(r, SEARCH)) return 'organic_search';
    if (has(r, SOCIAL)) return 'social';
    return 'referral';
  }

  // This page's touch: only counts when it brings new information (campaign fields, a click ID, or an outside referrer).
  var q, now = { ts: Date.now(), landing: cut(location.pathname, 120) };
  try { q = new URLSearchParams(location.search); } catch (e) { q = { get: function () { return null; } }; }
  var tagged = false;
  UTM.concat(CLICK).forEach(function (k) { var v = q.get(k); if (v) { now[k] = cut(v, k === 'gclid' || k === 'fbclid' || k === 'msclkid' ? 200 : 100); tagged = true; } });
  // Our own hosts and the payment page are not traffic sources (returning from checkout must not overwrite the touch).
  var SELF = ['usurp.games', 'usurp-realm.vercel.app', 'dodopayments.com', location.hostname.replace(/^www\./, '')];
  var ref = host(d.referrer);
  if (ref && !has(ref, SELF)) now.referrer = ref;
  if (!now.utm_source && now.ref) now.utm_source = now.ref;
  var fresh = tagged || !!now.referrer;
  now.channel = channel(now);

  var first = store.get(FIRST), last = store.get(LAST);
  if (!first) { first = now; store.set(FIRST, first); }
  if (fresh || !last) { last = now; store.set(LAST, last); }

  // Clarity tags: filter recordings and dashboards by source, campaign and channel (first and last touch).
  function tag() {
    if (!w.clarity) return;
    try {
      var put = function (k, v) { if (v) w.clarity('set', k, String(v)); };
      put('channel', last.channel); put('utm_source', last.utm_source); put('utm_medium', last.utm_medium);
      put('utm_campaign', last.utm_campaign); put('utm_term', last.utm_term); put('utm_content', last.utm_content);
      put('referrer', last.referrer); put('landing_page', last.landing);
      put('first_channel', first.channel); put('first_source', first.utm_source || first.referrer || '(direct)');
      put('first_campaign', first.utm_campaign);
      var ad = last.gclid || last.gbraid || last.wbraid || last.gad_source ? 'google' : last.msclkid ? 'microsoft' : last.fbclid ? 'meta' : last.ttclid ? 'tiktok' : last.twclid ? 'x' : last.li_fat_id ? 'linkedin' : '';
      put('ad_click', ad); put('gad_campaignid', last.gad_campaignid);
      if (tagged) w.clarity('event', 'campaign_landing');
      if (now.channel === 'qr' && tagged) w.clarity('event', 'qr_scan');
    } catch (e) {}
  }
  tag();

  // Checkout metadata for Dodo (shows on each payment in the Dodo dashboard). Keys stay short; values capped.
  function checkout() {
    var m = {}, add = function (k, v, n) { if (v) m['metadata_' + k] = cut(v, n || 80); };
    add('channel', last.channel); add('source', last.utm_source || last.referrer); add('medium', last.utm_medium);
    add('campaign', last.utm_campaign); add('term', last.utm_term); add('content', last.utm_content);
    add('landing', last.landing, 120);
    add('click_id', last.gclid || last.gbraid || last.wbraid || last.msclkid || last.fbclid || last.ttclid || '', 200);
    add('gad_campaignid', last.gad_campaignid);
    add('first_channel', first.channel); add('first_source', first.utm_source || first.referrer || '(direct)');
    add('first_campaign', first.utm_campaign);
    add('first_seen', new Date(first.ts).toISOString().slice(0, 10), 10);
    return m;
  }

  w.UG_ATTR = { first: first, last: last, now: now, checkout: checkout };
})(window, document);
