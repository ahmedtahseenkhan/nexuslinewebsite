/* NexusLine GRC — site interactions
   Nav scroll state, mobile menu, reveal-on-scroll, domain tabs, rolling stats, demo forms, and the
   components adapted from Skiper UI (skiper-ui.com): text-roll nav, letter reveal, sticky stacked
   cards, hover-expand strip.
   Loaded with `defer` on every page; all handlers no-op safely if their elements are absent. */
(function(){

  "use strict";
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* sticky nav shadow */
  var nav = document.getElementById('nav');
  var onScroll = function(){ nav.classList.toggle('scrolled', window.scrollY > 12); };
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});

  /* mobile menu */
  var mb = document.getElementById('menuBtn'), mm = document.getElementById('mobileMenu');
  mb.addEventListener('click', function(){
    var open = mm.classList.toggle('open');
    mb.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  function closeMenu(){ mm.classList.remove('open'); mb.setAttribute('aria-expanded','false'); }
  mm.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && mm.classList.contains('open')){ closeMenu(); mb.focus(); }
  });

  /* reveal on scroll */
  var revs = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (reduce || !('IntersectionObserver' in window)){
    revs.forEach(function(el){ el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, {threshold:0.12, rootMargin:'0px 0px -8% 0px'});
    revs.forEach(function(el){ io.observe(el); });
  }

  /* tabs — WAI-ARIA tabs pattern: one tab stop, arrow keys / Home / End move between tabs */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  function selectTab(t){
    var id = t.getAttribute('data-tab');
    tabs.forEach(function(x){ x.classList.remove('on'); x.setAttribute('aria-selected','false'); x.setAttribute('tabindex','-1'); });
    t.classList.add('on'); t.setAttribute('aria-selected','true'); t.removeAttribute('tabindex');
    document.querySelectorAll('.tabpanel').forEach(function(p){ p.classList.remove('on'); });
    var panel = document.getElementById('tab-' + id);
    if (panel) panel.classList.add('on');
  }
  tabs.forEach(function(t, i){
    t.addEventListener('click', function(){ selectTab(t); });
    t.addEventListener('keydown', function(e){
      var next = {ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1}[e.key];
      if (next === undefined) return;
      e.preventDefault();
      var target = tabs[(next + tabs.length) % tabs.length];
      selectTab(target); target.focus();
    });
  });

  /* one rAF-throttled scroll/resize loop shared by the scroll-driven components below */
  var scrollers = [], ticking = false;
  function onFrame(){ ticking = false; scrollers.forEach(function(fn){ fn(); }); }
  function requestFrame(){ if (!ticking){ ticking = true; requestAnimationFrame(onFrame); } }
  function onScrollFrame(fn){
    if (!scrollers.length){
      window.addEventListener('scroll', requestFrame, {passive:true});
      window.addEventListener('resize', requestFrame);
    }
    scrollers.push(fn); fn();
  }
  function clamp01(v){ return v < 0 ? 0 : v > 1 ? 1 : v; }
  function letters(text, cls){
    return text.split('').map(function(c){ return '<span class="' + cls + '">' + (c === ' ' ? '&nbsp;' : c) + '</span>'; }).join('');
  }

  /* stats — rolling digits (Skiper UI skiper37 / NumberFlow). Each digit is a 0-9 column that slides
     to its value when the band scrolls into view; screen readers get the plain number. */
  var band = document.querySelector('.statband');
  var odos = Array.prototype.slice.call(document.querySelectorAll('[data-count]')).map(function(el){
    var text = parseInt(el.getAttribute('data-count'), 10).toLocaleString('en-US');
    if (reduce) { el.textContent = text; return null; }
    var cols = [], html = '';
    text.split('').forEach(function(c, i){
      if (/\d/.test(c)) {
        html += '<span class="odo-col" style="--d:' + (i * 90) + 'ms">';
        for (var d = 0; d <= 9; d++) html += '<span>' + d + '</span>';
        html += '</span>';
        cols.push(+c);
      } else html += '<span class="odo-sep">' + c + '</span>';
    });
    el.innerHTML = '<span class="sr-only">' + text + '</span><span class="odo" aria-hidden="true">' + html + '</span>';
    return {el: el, digits: cols};
  }).filter(Boolean);
  function rollStats(){
    odos.forEach(function(o){
      o.el.querySelectorAll('.odo-col').forEach(function(col, i){ col.style.transform = 'translateY(' + (-o.digits[i]) + 'em)'; });
    });
  }
  if (odos.length) {
    if (band && 'IntersectionObserver' in window) {
      var io2 = new IntersectionObserver(function(entries){
        entries.forEach(function(e){ if (e.isIntersecting){ rollStats(); io2.disconnect(); } });
      }, {threshold:0.4});
      io2.observe(band);
    } else rollStats();
  }

  /* text-roll nav links (Skiper UI skiper58): letters roll up on hover, staggered from the centre */
  if (!reduce) document.querySelectorAll('.nav-item > a').forEach(function(a){
    var node = Array.prototype.find.call(a.childNodes, function(n){ return n.nodeType === 3 && n.textContent.trim(); });
    if (!node) return;
    var label = node.textContent.trim(), mid = (label.length - 1) / 2;
    var roll = document.createElement('span');
    roll.className = 'roll'; roll.setAttribute('aria-hidden', 'true');
    roll.innerHTML = letters(label, 'ch');
    Array.prototype.forEach.call(roll.children, function(ch, i){ ch.style.setProperty('--d', Math.round(Math.abs(i - mid) * 30) + 'ms'); });
    var sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = label;
    a.replaceChild(roll, node); a.insertBefore(sr, roll);
  });

  /* letter reveal (Skiper UI skiper31): the statement's letters gather from the centre as it scrolls
     into view. The heading keeps its full text as the accessible name. */
  if (!reduce) document.querySelectorAll('[data-letter-reveal]').forEach(function(h){
    var text = h.textContent.trim();
    h.setAttribute('aria-label', text);
    h.innerHTML = text.split(' ').map(function(w){ return '<span class="w" aria-hidden="true">' + letters(w, 'ch') + '</span>'; }).join(' ');
    var chs = Array.prototype.slice.call(h.querySelectorAll('.ch'));
    var mid = (chs.length - 1) / 2;
    onScrollFrame(function(){
      var r = h.getBoundingClientRect(), vh = window.innerHeight;
      var p = clamp01((vh - r.top) / (vh * 0.62));
      var k = 1 - (1 - Math.pow(1 - p, 3));               /* remaining distance, eased */
      chs.forEach(function(c, i){
        var d = i - mid;
        c.style.transform = k ? 'translateX(' + (d * 16 * k).toFixed(1) + 'px) rotateX(' + (d * 7 * k).toFixed(1) + 'deg)' : '';
        c.style.opacity = (0.12 + 0.88 * (1 - k)).toFixed(3);
      });
    });
  });

  /* sticky stacked cards (Skiper UI skiper16): cards pin under the nav one over another; each one
     shrinks a little as the cards after it arrive */
  if (!reduce) document.querySelectorAll('[data-stack]').forEach(function(stack){
    var cards = Array.prototype.slice.call(stack.querySelectorAll('.stack-card')), n = cards.length;
    onScrollFrame(function(){
      var r = stack.getBoundingClientRect(), vh = window.innerHeight;
      var p = clamp01(-r.top / Math.max(1, r.height - vh * 0.6));
      cards.forEach(function(c, i){
        var start = i / n, target = 1 - (n - 1 - i) * 0.05;
        var t = clamp01((p - start) / (1 - start));
        c.style.transform = 'scale(' + (1 + (target - 1) * t).toFixed(4) + ')';
      });
    });
  });

  /* hover-expand strip (Skiper UI skiper52): one panel open at a time — hover, focus or click opens it.
     Below 900px the strip becomes an accordion, so only click/tap toggles. */
  document.querySelectorAll('[data-hover-expand]').forEach(function(hx){
    var panels = Array.prototype.slice.call(hx.querySelectorAll('.hx-panel'));
    var wide = window.matchMedia('(min-width: 901px)');
    function open(panel){
      panels.forEach(function(p){
        var on = p === panel;
        p.classList.toggle('is-active', on);
        p.querySelector('.hx-btn').setAttribute('aria-expanded', on ? 'true' : 'false');
      });
    }
    panels.forEach(function(p){
      var btn = p.querySelector('.hx-btn');
      btn.addEventListener('click', function(){ open(p); });
      btn.addEventListener('focus', function(){ if (wide.matches) open(p); });
      p.addEventListener('pointerenter', function(e){ if (wide.matches && e.pointerType === 'mouse') open(p); });
    });
  });

  /* demo request forms — post to FormSubmit, which emails info@nexusline.io.
     Without JS the form still submits normally and FormSubmit shows its own thank-you page. */
  var formCount = 0;
  document.querySelectorAll('form[data-demo-form]').forEach(function(form){
    var status = form.querySelector('.form-status');
    var btn = form.querySelector('button[type="submit"]');
    var fields = Array.prototype.slice.call(form.querySelectorAll('label input, label textarea'));
    var n = ++formCount;

    /* inline validation: JS replaces the browser's tooltips with messages under each field
       (without JS the browser's built-in required/email checks still apply) */
    form.setAttribute('novalidate', '');
    function showError(input){
      var id = 'err-' + n + '-' + input.name;
      var err = document.getElementById(id);
      var msg = input.validity.valueMissing ? 'Please fill in this field.'
              : input.validity.typeMismatch ? 'Please enter a valid email address, e.g. name@company.com.'
              : input.validationMessage;
      if (input.validity.valid){
        if (err) err.remove();
        input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby');
        return true;
      }
      if (!err){
        err = document.createElement('span'); err.className = 'field-error'; err.id = id;
        input.parentNode.appendChild(err);
      }
      err.textContent = msg;
      input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', id);
      return false;
    }
    fields.forEach(function(input){
      input.addEventListener('input', function(){ if (input.hasAttribute('aria-invalid')) showError(input); });
      input.addEventListener('blur', function(){ if (input.value) showError(input); });
    });

    form.addEventListener('submit', function(e){
      var invalid = fields.filter(function(input){ return !showError(input); });
      if (invalid.length){ e.preventDefault(); invalid[0].focus(); return; }
      if (!window.fetch || !window.FormData) return;
      e.preventDefault();
      var data = {};
      new FormData(form).forEach(function(v, k){ data[k] = v; });
      btn.disabled = true;
      status.className = 'form-status'; status.textContent = 'Sending…';
      fetch(form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        body: JSON.stringify(data)
      }).then(function(r){ return r.json().then(function(j){ if (!r.ok || String(j.success) !== 'true') throw j; }); })
        .then(function(){
          form.reset();
          status.className = 'form-status ok';
          status.textContent = 'Thanks — your request has been sent. We\'ll be in touch shortly.';
          if (window.nlTrack) window.nlTrack('generate_lead', {form_location: document.body.getAttribute('data-page') || 'home'});
        })
        .catch(function(){
          status.className = 'form-status err';
          status.textContent = 'Something went wrong. Please email info@nexusline.io directly.';
        })
        .then(function(){ btn.disabled = false; });
    });
  });

  /* FAQ structured data, built from the FAQ markup so the two never drift apart.
     Skipped while the section is hidden. */
  var faq = document.getElementById('faq');
  if (faq && !faq.hidden) {
    var qa = Array.prototype.map.call(faq.querySelectorAll('.faq-item'), function(d){
      return {'@type': 'Question', name: d.querySelector('summary').textContent.trim(),
              acceptedAnswer: {'@type': 'Answer', text: d.querySelector('.faq-a').textContent.trim()}};
    });
    if (qa.length) {
      var ld = document.createElement('script');
      ld.type = 'application/ld+json';
      ld.textContent = JSON.stringify({'@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qa});
      document.head.appendChild(ld);
    }
  }

  /* active nav — mark the link for the current page */
  try {
    var page = (document.body.getAttribute('data-page') || '').trim();
    if (page) {
      document.querySelectorAll('.nav-item').forEach(function(li){
        var a = li.querySelector('a');
        if (a && a.getAttribute('href') === '/' + page) {
          li.classList.add('current');
          a.setAttribute('aria-current', 'page');
        }
      });
    }
  } catch (e) {}

})();