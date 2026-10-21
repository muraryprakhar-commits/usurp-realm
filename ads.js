/* Ad slots on the guide pages (no game engine there). Each [data-ad-slot] holds house content: links to the free games.
   When an ad network is configured (window.USURP_ADS, written by tools/build.py), the slot shows a responsive AdSense unit
   instead, and goes back to the house content if the network is blocked or returns no ad. Slots hidden on this screen
   size are left alone, so no ad ever loads unseen. */
(function () {
  'use strict';
  var A = window.USURP_ADS || {};
  if (!A.client || !A.slot) return;
  var slots = [].slice.call(document.querySelectorAll('[data-ad-slot]')).filter(function (s) { return s.offsetWidth > 0; });
  if (!slots.length) return;
  function restore(s) { if (s.__house !== undefined) { s.innerHTML = s.__house; s.classList.remove('ad-net'); } }
  var sc = document.createElement('script');
  sc.async = true; sc.crossOrigin = 'anonymous';
  sc.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(A.client);
  if (A.test) sc.setAttribute('data-adtest', 'on');
  sc.onerror = function () { slots.forEach(restore); try { if (window.clarity) window.clarity('event', 'ad_blocked_page'); } catch (e) {} };
  document.head.appendChild(sc);
  slots.forEach(function (s) {
    s.__house = s.innerHTML;
    s.classList.add('ad-net');
    s.innerHTML = '<span class="ad-lbl">Advertisement</span><ins class="adsbygoogle" style="display:block" data-ad-client="' + A.client + '" data-ad-slot="' + A.slot + '" data-ad-format="auto" data-full-width-responsive="true"' + (A.test ? ' data-adtest="on"' : '') + '></ins>';
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
    var ins = s.querySelector('ins');
    var check = function () { var st = ins.getAttribute('data-ad-status'); if (st === 'unfilled') { restore(s); return true; } return st === 'filled'; };
    if ('MutationObserver' in window) { var mo = new MutationObserver(function () { if (check()) mo.disconnect(); }); mo.observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] }); }
    setTimeout(function () { if (ins.isConnected && !ins.getAttribute('data-ad-status') && !ins.querySelector('iframe')) restore(s); }, 10000);
  });
})();
