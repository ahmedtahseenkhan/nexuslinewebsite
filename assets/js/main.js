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
  mm.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){ mm.classList.remove('open'); mb.setAttribute('aria-expanded','false'); });
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

  /* tabs */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  tabs.forEach(function(t){
    t.addEventListener('click', function(){
      var id = t.getAttribute('data-tab');
      tabs.forEach(function(x){ x.classList.remove('on'); x.setAttribute('aria-selected','false'); });
      t.classList.add('on'); t.setAttribute('aria-selected','true');
      document.querySelectorAll('.tabpanel').forEach(function(p){ p.classList.remove('on'); });
      var panel = document.getElementById('tab-' + id);
      if (panel) panel.classList.add('on');
    });
  });

  /* count-up stats */
  var counted = false;
  var band = document.querySelector('.statband');
  function runCount(){
    if (counted) return; counted = true;
    document.querySelectorAll('[data-count]').forEach(function(el){
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (reduce){ el.textContent = target; return; }
      var start = null, dur = 1100;
      function step(ts){
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(step); else el.textContent = target;
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

  /* active nav — mark the link for the current page */
  try {
    var page = (document.body.getAttribute('data-page') || '').trim();
    if (page) {
      document.querySelectorAll('.nav-item').forEach(function(li){
        var a = li.querySelector('a');
        if (a && a.getAttribute('href') === page + '.html') {
          li.classList.add('current');
          a.setAttribute('aria-current', 'page');
        }
      });
    }
  } catch (e) {}

})();