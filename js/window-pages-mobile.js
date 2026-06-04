/**
 * window-pages-mobile.js
 * Mobile UX for aluminium window pages (body.page-window-pro):
 * - FAQ open/close accordion
 */
(function () {
  'use strict';

  var MQ = window.matchMedia('(max-width: 768px)');

  function isMobile() {
    return MQ.matches;
  }

  function buildFaqToggle(item, questionText) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'wm-faq-q';
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML =
      '<span>' + questionText + '</span>' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
    btn.addEventListener('click', function () {
      var open = item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    return btn;
  }

  function initFaqAccordion() {
    var faq = document.getElementById('faqs');
    if (!faq || faq.dataset.faqAccordion === '1') return;
    if (!document.body.classList.contains('page-window-pro')) return;
    if (!isMobile()) return;

    var container = faq.querySelector('.container');
    if (!container) return;

    var converted = false;
    container.querySelectorAll(':scope > div').forEach(function (item) {
      if (item.classList.contains('wm-faq-item')) return;
      var h3 = item.querySelector('h3');
      var answer = item.querySelector('p');
      if (!h3 || !answer) return;

      var questionText = h3.textContent.trim();
      item.classList.add('wm-faq-item');
      item.style.marginBottom = '';
      item.style.padding = '';
      item.style.border = '';
      item.style.borderRadius = '';

      var body = document.createElement('div');
      body.className = 'wm-faq-a';
      body.appendChild(answer);

      item.textContent = '';
      item.appendChild(buildFaqToggle(item, questionText));
      item.appendChild(body);
      converted = true;
    });

    if (converted) faq.dataset.faqAccordion = '1';
  }

  function resetFaqDesktop() {
    if (isMobile()) return;
    var faq = document.getElementById('faqs');
    if (!faq || faq.dataset.faqAccordion !== '1') return;
    faq.querySelectorAll('.wm-faq-item').forEach(function (item) {
      item.classList.remove('is-open');
    });
  }

  function boot() {
    if (!document.body.classList.contains('page-window-pro')) return;
    initFaqAccordion();
    resetFaqDesktop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(boot, 200);
    });
  } else {
    setTimeout(boot, 200);
  }

  if (MQ.addEventListener) {
    MQ.addEventListener('change', boot);
  }
})();
