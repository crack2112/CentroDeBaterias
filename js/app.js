/* ============================================================
   NAVIGATION ENGINE
============================================================ */
(function(){
  'use strict';

  const sections = ['inicio','nosotros','productos','solar','servicios','sucursales','cotizar'];
  let catalogLoaded = false;
  let currentSection = 'inicio';

  window.loadCatalog = function(){
    if (window.CBIDCatalog && typeof window.CBIDCatalog.load === 'function') {
      window.CBIDCatalog.load();
      return true;
    }
    return false;
  };

  window.toggleWaMenu = function(){
    const menu = document.getElementById('wa-menu');
    const toggle = document.getElementById('wa-toggle');
    if(!menu || !toggle) return;
    const isOpen = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  };

  /* Page loader */
  window.addEventListener('load', function(){
    setTimeout(function(){
      document.getElementById('page-loader').classList.add('hidden');
    }, 1800);
  });

  /* AOS init */
  if(window.AOS) {
    AOS.init({
      duration: 700,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60
    });
  }

  /* Header scroll */
  window.addEventListener('scroll', function(){
    const header = document.getElementById('main-header');
    const backTop = document.getElementById('back-to-top');
    if(window.scrollY > 50) { header.classList.add('scrolled'); }
    else { header.classList.remove('scrolled'); }
    if(window.scrollY > 300) { backTop.classList.add('visible'); }
    else { backTop.classList.remove('visible'); }
  }, { passive: true });

  /* Global navigate function */
  window.navigateTo = function(sectionId) {
    if(!sections.includes(sectionId)) return;
    currentSection = sectionId;
    document.body.classList.remove(...sections.map(function(id){ return 'is-section-' + id; }));
    document.body.classList.add('is-section-' + sectionId);
    
    // Hide all sections
    sections.forEach(function(id){
      const el = document.getElementById(id);
      if(el) { el.classList.remove('active'); el.removeAttribute('aria-current'); }
    });
    
    // Show target section
    const target = document.getElementById(sectionId);
    if(target) { target.classList.add('active'); target.setAttribute('aria-current','page'); }

    // Update nav links
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(function(link){
      link.classList.remove('active');
    });
    document.querySelectorAll('[data-section="' + sectionId + '"]').forEach(function(link){
      if(link.classList.contains('nav-link') || link.classList.contains('mobile-nav-link')) {
        link.classList.add('active');
      }
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Load catalog when products section is shown
    if(sectionId === 'productos' && !catalogLoaded) {
      catalogLoaded = window.loadCatalog();
    }

    // Re-init AOS for new content
    if(window.AOS) setTimeout(function(){ AOS.refresh(); }, 100);

    // Update URL hash without page jump
    history.pushState(null, '', '#' + sectionId);
  };

  /* Declarative actions */
  document.addEventListener('click', function(e){
    const actionEl = e.target.closest('[data-action]');
    if(!actionEl) return;
    const action = actionEl.dataset.action;

    if(action === 'navigate') {
      e.preventDefault();
      window.navigateTo(actionEl.dataset.section);
      if(actionEl.dataset.closeMobile === 'true') window.closeMobileNav();
    }
    if(action === 'navigate-solar-quote') {
      e.preventDefault();
      window.navigateTo('cotizar');
      setTimeout(function(){ document.getElementById('tab-solar').click(); }, 200);
    }
    if(action === 'toggle-whatsapp') {
      e.preventDefault();
      window.toggleWaMenu();
    }
    if(action === 'back-to-top') {
      window.scrollTo({top:0,behavior:'smooth'});
    }
    if(action === 'service-tab') {
      window.switchSvcTab(actionEl, actionEl.dataset.panel);
    }
    if(action === 'quote-tab') {
      window.switchQuoteTab(actionEl.dataset.tab);
    }
    if(action === 'filter-projects') {
      window.filterProjects(actionEl, actionEl.dataset.category);
    }
  });

  /* Handle hash on load */
  function checkHash(){
    const hash = window.location.hash.replace('#','');
    if(sections.includes(hash)) {
      window.navigateTo(hash);
      return;
    }
    document.body.classList.remove(...sections.map(function(id){ return 'is-section-' + id; }));
    document.body.classList.add('is-section-inicio');
  }
  checkHash();
  window.addEventListener('popstate', checkHash);

  /* Mobile nav */
  const hamburger = document.getElementById('hamburger-btn');
  const mobileNav = document.getElementById('mobile-nav');
  
  hamburger.addEventListener('click', function(){
    const isOpen = mobileNav.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.classList.toggle('is-menu-open', isOpen);
  });

  mobileNav.addEventListener('click', function(e){
    if(e.target === mobileNav) window.closeMobileNav();
  });

  window.closeMobileNav = function(){
    mobileNav.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-menu-open');
  };

  /* WhatsApp menu */
  document.addEventListener('click', function(e){
    const waFloat = document.querySelector('.whatsapp-float');
    const menu = document.getElementById('wa-menu');
    const toggle = document.getElementById('wa-toggle');
    if(waFloat && menu && toggle && !waFloat.contains(e.target)) {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded','false');
    }
  });
  const waToggle = document.getElementById('wa-toggle');
  if(waToggle) {
    waToggle.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.toggleWaMenu(); }
    });
  }

  /* Services tabs */
  window.switchSvcTab = function(btn, panelId){
    document.querySelectorAll('.services-tab').forEach(function(t){ t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
    document.querySelectorAll('.svc-detail').forEach(function(p){ p.hidden = true; });
    btn.classList.add('active');
    btn.setAttribute('aria-selected','true');
    const panel = document.getElementById(panelId);
    if(panel) {
      panel.hidden = false;
      if(window.AOS) AOS.refresh();
    }
  };

  /* Quote tabs */
  window.switchQuoteTab = function(tab){
    document.querySelectorAll('.quote-tab').forEach(function(t){ t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
    document.querySelectorAll('.quote-form-panel').forEach(function(p){ p.classList.remove('active'); });
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('tab-' + tab).setAttribute('aria-selected','true');
    document.getElementById('qpanel-' + tab).classList.add('active');
  };

  /* Project filter */
  window.filterProjects = function(btn, cat){
    document.querySelectorAll('.proj-filter-btn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    document.querySelectorAll('#projects-grid .project-card').forEach(function(card){
      if(cat === 'all' || card.dataset.cat === cat) {
        card.hidden = false;
        card.classList.add('is-filtered-in');
      } else {
        card.hidden = true;
        card.classList.remove('is-filtered-in');
      }
    });
  };

  /* Forms */
  function handleForm(formId, successId){
    const form = document.getElementById(formId);
    if(!form) return;
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const required = form.querySelectorAll('[required]');
      let valid = true;
      required.forEach(function(input){
        if(!input.value.trim()) {
          valid = false;
          input.classList.add('is-invalid');
          input.addEventListener('input', function(){ this.classList.remove('is-invalid'); }, { once: true });
        }
      });
      if(!valid) return;
      // Success (no real backend in demo)
      form.hidden = true;
      const success = document.getElementById(successId);
      if(success) {
        success.hidden = false;
        success.classList.add('is-visible');
      }
    });
  }

  handleForm('solar-quick-form', 'solar-quick-success');
  handleForm('contact-form', 'contact-success');
  handleForm('quote-general-form', 'quote-general-success');
  handleForm('quote-solar-form', 'quote-solar-success');

})();
