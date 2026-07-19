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
  loadFooter(containerId = 'footer') {
    const container = document.getElementById(containerId);
    if (!container) return;
    fetch('footer.html').then(response => response.text()).then(markup => {
      container.innerHTML = markup;
      const topButton = container.querySelector('#topBtn');
      if (!topButton) return;
      const updateVisibility = () => { topButton.style.display = window.scrollY > 250 ? 'block' : 'none'; };
      window.addEventListener('scroll', updateVisibility, { passive: true });
      updateVisibility();
      topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }).catch(error => console.error(error));
  },
  get(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  id() { return `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
};
