const Dawaei = {
  loadHeader(containerId = 'header') {
    const container = document.getElementById(containerId);
    if (!container) return;
    fetch('header.html').then(response => {
      if (!response.ok) throw new Error('تعذر تحميل الهيدر');
      return response.text();
    }).then(markup => {
      container.innerHTML = markup;
      const menuButton = container.querySelector('.menu-btn');
      const nav = container.querySelector('.site-nav');
      menuButton.addEventListener('click', () => {
        const open = nav.classList.toggle('active');
        menuButton.setAttribute('aria-expanded', String(open));
      });
      nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => nav.classList.remove('active')));
    }).catch(error => console.error(error));
  },
  get(key) { return JSON.parse(localStorage.getItem(key) || '[]'); },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  id() { return `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
};
