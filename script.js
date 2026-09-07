/* =====================================================================
   SUTOS CO. — Script principal
   Sólo comportamiento funcional: menú móvil, scroll suave, estado del
   header, enlace activo y animación de entrada. Sin efectos decorativos.
   ===================================================================== */

(() => {
  'use strict';

  const prefiereMenosMovimiento = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------- 1. Menú móvil ------------------- */
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  function cerrarMenu() {
    navToggle.classList.remove('is-open');
    navMenu.classList.remove('is-open');
    document.body.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const abierto = navMenu.classList.toggle('is-open');
      navToggle.classList.toggle('is-open', abierto);
      // `nav-open` en <body> deja la barra sólida mientras el panel está abierto
      document.body.classList.toggle('nav-open', abierto);
      navToggle.setAttribute('aria-expanded', String(abierto));
    });

    // Cierra el menú al elegir un enlace (comportamiento esperado en móvil)
    navMenu.querySelectorAll('a').forEach((enlace) => {
      enlace.addEventListener('click', cerrarMenu);
    });

    // Escape cierra el menú y devuelve el foco al botón
    document.addEventListener('keydown', (evento) => {
      if (evento.key === 'Escape' && navMenu.classList.contains('is-open')) {
        cerrarMenu();
        navToggle.focus();
      }
    });
  }

  /* ------------------- 2. Scroll suave ------------------- */
  // El desplazamiento por el header ya lo resuelve `scroll-margin-top` en CSS;
  // aquí sólo unificamos el comportamiento entre navegadores.
  document.querySelectorAll('a[href^="#"]').forEach((enlace) => {
    enlace.addEventListener('click', (evento) => {
      const destino = document.querySelector(enlace.getAttribute('href'));
      if (!destino) return;
      evento.preventDefault();
      destino.scrollIntoView({
        behavior: prefiereMenosMovimiento() ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  });

  /* ------------------- 3. Header: estado y enlace activo ------------------- */
  const header = document.getElementById('siteHeader');
  const secciones = document.querySelectorAll('main section[id]');
  const enlacesNav = document.querySelectorAll('.site-nav__link');

  function actualizarHeader() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }

  window.addEventListener('scroll', actualizarHeader, { passive: true });
  actualizarHeader();

  const observerActivo = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        const id = entrada.target.getAttribute('id');
        enlacesNav.forEach((enlace) => {
          enlace.classList.toggle('is-active', enlace.getAttribute('href') === `#${id}`);
        });
      });
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );

  secciones.forEach((seccion) => observerActivo.observe(seccion));

  /* ------------------- 4. Animación de entrada ------------------- */
  const elementosRevelar = document.querySelectorAll('.reveal');

  if (prefiereMenosMovimiento()) {
    elementosRevelar.forEach((el) => el.classList.add('is-visible'));
  } else {
    const observerRevelar = new IntersectionObserver(
      (entradas, observer) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return;
          entrada.target.classList.add('is-visible');
          observer.unobserve(entrada.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    elementosRevelar.forEach((el) => observerRevelar.observe(el));
  }
})();
