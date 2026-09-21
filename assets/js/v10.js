document.body.classList.add('js');
const machine = document.querySelector('.machine');
const switches = document.querySelectorAll('.mode-switch button');
switches.forEach(button => button.addEventListener('click', () => {
  const mode = button.dataset.mode;
  machine.dataset.mode = mode;
  switches.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  document.querySelector('.machine-message').textContent = mode === 'front'
    ? 'A first impression, made your own.' : 'Built around the way you work.';
}));
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('in-view', entry.isIntersecting));
  }, { threshold: 0.12 });
  document.querySelectorAll('.machine, .capabilities, .section-heading').forEach(item => observer.observe(item));
}
