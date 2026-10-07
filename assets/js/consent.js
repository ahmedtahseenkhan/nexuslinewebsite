/* NexusLine GRC — cookie consent + Google Analytics 4
   GA4 is not requested at all until the visitor clicks Accept. The choice is kept in
   localStorage for 12 months; "Cookie settings" in the footer reopens the banner.
   Loaded with `defer` on every page. */
(function(){

  "use strict";

  /* GA4 Measurement ID (GA4 → Admin → Data streams → Web).
     Emptying it switches off the banner and all tracking. */
  var GA_ID = 'G-HKDGD6NVZC';

  var KEY = 'nl-consent', MAX_AGE = 365 * 24 * 3600 * 1000;
  var loaded = false;

  /* conversion events (e.g. main.js fires generate_lead on a demo request) — no-op until consented */
  window.nlTrack = function(name, params){
    if (loaded && !window['ga-disable-' + GA_ID]) window.gtag('event', name, params || {});
  };

  if (!GA_ID) return;

  function readChoice(){
    try {
      var c = JSON.parse(localStorage.getItem(KEY));
      return c && Date.now() - c.t < MAX_AGE ? c.v : null;
    } catch (e) { return null; }
  }
  function saveChoice(v){
    try { localStorage.setItem(KEY, JSON.stringify({v: v, t: Date.now()})); } catch (e) {}
  }

  function loadGA(){
    window['ga-disable-' + GA_ID] = false;
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
  }

  /* withdrawing consent: stop sending and delete the _ga cookies GA set */
  function stopGA(){
    window['ga-disable-' + GA_ID] = true;
    var host = location.hostname.replace(/^www\./, '');
    document.cookie.split(';').forEach(function(c){
      var name = c.split('=')[0].trim();
      if (/^_ga/.test(name)) {
        ['', '; domain=' + host, '; domain=.' + host].forEach(function(d){
          document.cookie = name + '=; Max-Age=0; path=/' + d;
        });
      }
    });
  }

  var banner = null;
  function closeBanner(){ if (banner) { banner.remove(); banner = null; } }
  function openBanner(returnFocusTo){
    if (banner) return;
    banner = document.createElement('div');
    banner.className = 'consent';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML =
      '<p>We use Google Analytics cookies to understand how this site is used. They are only set if you accept. ' +
      '<a href="/privacy">Privacy policy</a></p>' +
      '<div class="consent-actions">' +
        '<button type="button" class="btn" data-choice="denied">Decline</button>' +
        '<button type="button" class="btn" data-choice="granted">Accept</button>' +
      '</div>';
    banner.addEventListener('click', function(e){
      var choice = e.target.getAttribute && e.target.getAttribute('data-choice');
      if (!choice) return;
      saveChoice(choice);
      if (choice === 'granted') loadGA(); else stopGA();
      closeBanner();
      if (returnFocusTo) returnFocusTo.focus();
    });
    document.body.appendChild(banner);
    if (returnFocusTo) banner.querySelector('button').focus();
  }

  document.querySelectorAll('[data-cookie-settings]').forEach(function(btn){
    btn.hidden = false;
    btn.addEventListener('click', function(){ openBanner(btn); });
  });

  var choice = readChoice();
  if (choice === 'granted') loadGA();
  else if (choice !== 'denied') openBanner();

})();
