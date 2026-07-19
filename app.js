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
      const accountLink = container.querySelector('.login-btn');
      menuButton.addEventListener('click', () => {
        const open = nav.classList.toggle('active');
        menuButton.setAttribute('aria-expanded', String(open));
      });
      nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => nav.classList.remove('active')));
      if (!this.isLoggedIn()) {
        nav.hidden = true;
        menuButton.hidden = true;
      } else if (accountLink) {
        accountLink.textContent = 'تسجيل الخروج';
        accountLink.href = '#';
        accountLink.setAttribute('aria-label', 'تسجيل الخروج');
        accountLink.addEventListener('click', event => {
          event.preventDefault();
          this.logout();
        });
      }
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
  isLoggedIn() {
    return Boolean(localStorage.getItem('dawaeiUser'));
  },
  logout() {
    localStorage.removeItem('dawaeiUser');
    window.location.replace('login.html');
  },
  alarmContext: null,
  alertedReminders: new Set(),
  async enableAlarms() {
    localStorage.setItem('dawaeiAlarmsEnabled', 'true');
    localStorage.removeItem('dawaeiAlarmsDisabledByUser');
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.alarmContext = this.alarmContext || new AudioContextClass();
      if (this.alarmContext.state === 'suspended') await this.alarmContext.resume();
    }
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  },
  async disableAlarms() {
    localStorage.setItem('dawaeiAlarmsEnabled', 'false');
    localStorage.setItem('dawaeiAlarmsDisabledByUser', 'true');
    if (this.alarmContext && this.alarmContext.state === 'running') {
      await this.alarmContext.suspend();
    }
  },
  async playAlarm() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = this.alarmContext || (this.alarmContext = new AudioContextClass());
    try {
      if (context.state === 'suspended') await context.resume();
    } catch (error) {
      console.error('تعذر تشغيل صوت التنبيه.', error);
      return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startTime = context.currentTime;
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(880, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(.22, startTime + .04);
    gain.gain.setValueAtTime(.22, startTime + 2.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 3);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + 3);
  },
  checkReminders() {
    if (localStorage.getItem('dawaeiAlarmsEnabled') !== 'true') return;
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    this.get('medicines').forEach(medicine => {
      const isScheduled = medicine.frequency === 'يوميًا' || !medicine.frequency;
      const reminderKey = `${dateKey}-${medicine.id}-${medicine.time}`;
      if (!medicine.enabled || !isScheduled || medicine.time !== currentTime || this.alertedReminders.has(reminderKey)) return;

      this.alertedReminders.add(reminderKey);
      this.playAlarm();
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('موعد الدواء', {
          body: `حان الآن موعد ${medicine.name} (${medicine.dose}).`,
          tag: reminderKey
        });
      }
    });
  },
  startReminderMonitoring() {
    this.checkReminders();
    window.setInterval(() => this.checkReminders(), 10000);
  },
  id() { return `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
};

// تبدأ جميع صفحات الموقع بتسجيل الدخول، باستثناء صفحة الدخول نفسها.
const currentPage = window.location.pathname.split('/').pop().toLowerCase();
if (!Dawaei.isLoggedIn() && currentPage !== 'login.html') {
  window.location.replace('login.html');
} else if (Dawaei.isLoggedIn()) {
  Dawaei.startReminderMonitoring();
}
