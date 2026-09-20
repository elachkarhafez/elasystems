(() => {
  'use strict';
  document.documentElement.classList.add('enhanced');
  const menu = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#navigation');
  const setMenu = open => {
    menu.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
    menu.querySelector('span').textContent = open ? '-' : '+';
  };
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  navigation.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { setMenu(false); menu.focus(); }
  });
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) setMenu(false); });
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 761px)');
  const planes = [...document.querySelectorAll('.work-plane')];
  const approachMark = document.querySelector('.approach-mark');
  let scheduled = false;
  function renderScroll() {
    const progress = motion.matches || !desktop.matches ? 0 : Math.min(window.scrollY / 800, 1);
    planes.forEach((plane, i) => plane.style.setProperty('--drift', `${progress * [8, -20, 12][i]}px`));
    if (approachMark) {
      const turn = motion.matches ? 0 : Math.max(-25, Math.min(65, (innerHeight - approachMark.getBoundingClientRect().top) / innerHeight * 65));
      approachMark.style.setProperty('--turn', `${turn}deg`);
    }
    scheduled = false;
  }
  window.addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(renderScroll); }
  }, { passive: true });
  motion.addEventListener('change', renderScroll);
  desktop.addEventListener('change', () => { setMenu(false); renderScroll(); });

  const tabList = document.querySelector('.system-tabs');
  const tabs = [...tabList.querySelectorAll('button')];
  const panels = [...document.querySelectorAll('.capability-panel')];
  const map = document.querySelector('.system-map');
  tabList.setAttribute('role', 'tablist');
  const orientTabs = () => tabList.setAttribute('aria-orientation', desktop.matches ? 'horizontal' : 'vertical');
  orientTabs();
  desktop.addEventListener('change', orientTabs);
  function selectTab(index, focus = false) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', tab.dataset.panel);
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
      panels[i].setAttribute('role', 'tabpanel');
      panels[i].setAttribute('aria-labelledby', tab.id);
      panels[i].tabIndex = 0;
    });
    map.dataset.active = ['web', 'ops', 'auto'][index];
    // Restart the short connection trace only on an intentional capability change.
    map.classList.remove('is-switching');
    requestAnimationFrame(() => requestAnimationFrame(() => map.classList.add('is-switching')));
    if (focus) tabs[index].focus();
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(i));
    tab.addEventListener('keydown', event => {
      let target;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') target = (i + 1) % tabs.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') target = (i + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') target = 0;
      if (event.key === 'End') target = tabs.length - 1;
      if (target !== undefined) { event.preventDefault(); selectTab(target, true); }
    });
  });
  selectTab(0);
  const year = document.querySelector('#year');
  if (year) year.textContent = String(new Date().getFullYear());
  renderScroll();
})();
