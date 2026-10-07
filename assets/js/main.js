/* NexusLine GRC — site interactions
   Nav scroll state, mobile menu, reveal-on-scroll, domain tabs, count-up stats.
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

  /* count-up stats */
  var counted = false;
  var band = document.querySelector('.statband');
  function runCount(){
    if (counted) return; counted = true;
    document.querySelectorAll('[data-count]').forEach(function(el){
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (reduce){ el.textContent = target.toLocaleString('en-US'); return; }
      var start = null, dur = 1100;
      function step(ts){
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString('en-US');
        if (p < 1) requestAnimationFrame(step); else el.textContent = target.toLocaleString('en-US');
      }
      requestAnimationFrame(step);
    });
  }
  if (band && 'IntersectionObserver' in window && !reduce){
    var io2 = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if (e.isIntersecting){ runCount(); io2.disconnect(); } });
    }, {threshold:0.4});
    io2.observe(band);
  } else { runCount(); }

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
        })
        .catch(function(){
          status.className = 'form-status err';
          status.textContent = 'Something went wrong. Please email info@nexusline.io directly.';
        })
        .then(function(){ btn.disabled = false; });
    });
  });

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