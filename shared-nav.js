/* shared-nav.js — يُحقن في كل صفحة لتوليد nav ديناميكياً */
(function () {
  const pages = [
    { href: 'index.html',    label: 'الرئيسية',       icon: '🏠', num: '' },
    { href: 'networks.html', label: 'شبكات الحاسب',   icon: '📡', num: '01' },
    { href: 'security.html', label: 'الأمان',          icon: '🔒', num: '02' },
    { href: 'osi.html',      label: 'نموذج OSI',       icon: '🔁', num: '03' },
    { href: 'cables.html',   label: 'الكيابل',         icon: '🔌', num: '04' },
    { href: 'ip.html',       label: 'بروتوكول IP',     icon: '🌍', num: '05' },
  ];

  const current = window.location.pathname.split('/').pop() || 'index.html';

  const linksHTML = pages.map(p => {
    const active = (p.href === current || (current === '' && p.href === 'index.html')) ? 'active' : '';
    const numSpan = p.num ? `<span class="nav-num">${p.num}</span>` : '';
    return `<li><a href="${p.href}" class="${active}">${numSpan}${p.icon} ${p.label}</a></li>`;
  }).join('');

  const drawerHTML = pages.map(p => {
    const active = (p.href === current) ? 'active' : '';
    return `<a href="${p.href}" class="${active}">${p.icon} ${p.label}</a>`;
  }).join('');

  const nav = document.createElement('nav');
  nav.className = 'main-nav';
  nav.innerHTML = `
    <div class="nav-inner">
      <a href="index.html" class="nav-logo">
        <div class="logo-icon">🌐</div>
        مبادئ الشبكات
      </a>
      <ul class="nav-links">${linksHTML}</ul>
      <button class="nav-hamburger" id="navHamburger" aria-label="القائمة">
        <span></span><span></span><span></span>
      </button>
    </div>
  `;
  document.body.prepend(nav);

  const drawer = document.createElement('div');
  drawer.className = 'nav-drawer';
  drawer.id = 'navDrawer';
  drawer.innerHTML = drawerHTML;
  document.body.insertBefore(drawer, nav.nextSibling);

  document.getElementById('navHamburger').addEventListener('click', () => {
    drawer.classList.toggle('open');
  });

  // scroll-to-top
  const btn = document.createElement('button');
  btn.className = 'scroll-top';
  btn.id = 'scrollTop';
  btn.innerHTML = '↑';
  btn.setAttribute('aria-label', 'عودة للأعلى');
  btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  });

  // card appear animation
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, (i % 3) * 90);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll(
      '.info-card,.content-block,.cable-card,.solution-card,.threat-card,.net-type-card,.topo-card,.osi-layer'
    ).forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(18px)';
      el.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
      observer.observe(el);
    });
  });
})();
