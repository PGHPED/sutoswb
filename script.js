/* =====================================================================
   SUTOS CO. — Script principal
   Organizado por secciones: preferencias, menú móvil, scroll suave,
   campo de estrellas (canvas), animaciones de entrada, inclinación 3D
   de tarjetas y resaltado del enlace activo en la navbar.
   ===================================================================== */

(() => {
  'use strict';

  // Detecta si el usuario prefiere menos movimiento; se reevalúa donde haga falta
  const prefiereMenosMovimiento = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------- 1. Menú hamburguesa (móvil) ------------------- */
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  function cerrarMenu() {
    navToggle.classList.remove('is-open');
    navMenu.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const abierto = navMenu.classList.toggle('is-open');
      navToggle.classList.toggle('is-open', abierto);
      navToggle.setAttribute('aria-expanded', String(abierto));
    });

    // Cierra el menú al elegir un enlace (comportamiento esperado en móvil)
    navMenu.querySelectorAll('.navbar__link').forEach((enlace) => {
      enlace.addEventListener('click', cerrarMenu);
    });
  }

  /* ------------------- 2. Scroll suave con offset de navbar ------------------- */
  // El offset ya lo resuelve `scroll-margin-top` en CSS; aquí solo forzamos
  // un scroll suave consistente entre navegadores y cerramos el menú móvil.
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

  /* ------------------- 3. Navbar: estado "scrolled" + enlace activo ------------------- */
  const navbar = document.getElementById('navbar');
  const secciones = document.querySelectorAll('main section[id]');
  const enlacesNav = document.querySelectorAll('.navbar__link');

  function actualizarNavbar() {
    navbar.classList.toggle('is-scrolled', window.scrollY > 40);
  }

  const observerActivo = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          const id = entrada.target.getAttribute('id');
          enlacesNav.forEach((enlace) => {
            enlace.classList.toggle('is-active', enlace.getAttribute('href') === `#${id}`);
          });
        }
      });
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );

  secciones.forEach((seccion) => observerActivo.observe(seccion));
  window.addEventListener('scroll', actualizarNavbar, { passive: true });
  actualizarNavbar();

  /* ------------------- 4. Animaciones de entrada al hacer scroll ------------------- */
  const elementosRevelar = document.querySelectorAll('.reveal');

  if (prefiereMenosMovimiento()) {
    elementosRevelar.forEach((el) => el.classList.add('is-visible'));
  } else {
    const observerRevelar = new IntersectionObserver(
      (entradas, observer) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) {
            entrada.target.classList.add('is-visible');
            observer.unobserve(entrada.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    elementosRevelar.forEach((el) => observerRevelar.observe(el));
  }

  /* ------------------- 5. Inclinación 3D sutil en tarjetas ------------------- */
  if (!prefiereMenosMovimiento()) {
    const tarjetasInclinables = document.querySelectorAll('.card, .stat-card, .project-card');
    const INTENSIDAD_MAX = 6; // grados máximos de rotación

    tarjetasInclinables.forEach((tarjeta) => {
      tarjeta.addEventListener('mousemove', (evento) => {
        const rect = tarjeta.getBoundingClientRect();
        const x = (evento.clientX - rect.left) / rect.width - 0.5;
        const y = (evento.clientY - rect.top) / rect.height - 0.5;
        const rotY = (x * INTENSIDAD_MAX).toFixed(2);
        const rotX = (-y * INTENSIDAD_MAX).toFixed(2);
        tarjeta.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
      });

      tarjeta.addEventListener('mouseleave', () => {
        tarjeta.style.transform = '';
      });
    });
  }

  /* ------------------- 6. Campo de estrellas (canvas) ------------------- */
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');

  let ancho = 0;
  let alto = 0;
  let capas = [];
  let estrellaFugaz = null;
  let scrollY = 0;
  let mouseX = 0;
  let mouseY = 0;
  let animando = false; // arranca en false para que la primera llamada a iniciarAnimacion() sí lance el bucle
  let idAnimacion = null;

  const CONFIG_CAPAS = [
    { cantidad: 60, radioMin: 0.4, radioMax: 1.1, velocidadParallax: 0.02, brillo: 0.55 },
    { cantidad: 40, radioMin: 0.8, radioMax: 1.7, velocidadParallax: 0.045, brillo: 0.8 },
    { cantidad: 22, radioMin: 1.2, radioMax: 2.3, velocidadParallax: 0.08, brillo: 1 },
  ];

  function crearEstrellas() {
    capas = CONFIG_CAPAS.map((config) => {
      const estrellas = [];
      for (let i = 0; i < config.cantidad; i++) {
        estrellas.push({
          x: Math.random() * ancho,
          y: Math.random() * alto,
          radio: config.radioMin + Math.random() * (config.radioMax - config.radioMin),
          fase: Math.random() * Math.PI * 2,
          velocidadParpadeo: 0.5 + Math.random() * 1.2,
        });
      }
      return { ...config, estrellas };
    });
  }

  function redimensionar() {
    ancho = canvas.width = window.innerWidth;
    alto = canvas.height = window.innerHeight;
    crearEstrellas();
  }

  function posiblementeLanzarEstrellaFugaz() {
    // Probabilidad baja cada fotograma para que aparezcan de forma ocasional
    if (!estrellaFugaz && Math.random() < 0.0025) {
      const y0 = Math.random() * alto * 0.5;
      estrellaFugaz = {
        x: Math.random() * ancho * 0.6,
        y: y0,
        longitud: 90 + Math.random() * 60,
        velocidad: 9 + Math.random() * 6,
        angulo: Math.PI / 5,
        vida: 1,
      };
    }
  }

  function dibujarEstrellaFugaz() {
    if (!estrellaFugaz) return;
    const e = estrellaFugaz;
    const dx = Math.cos(e.angulo);
    const dy = Math.sin(e.angulo);

    const gradiente = ctx.createLinearGradient(
      e.x, e.y,
      e.x - dx * e.longitud, e.y - dy * e.longitud
    );
    gradiente.addColorStop(0, `rgba(255,255,255,${e.vida})`);
    gradiente.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.strokeStyle = gradiente;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.lineTo(e.x - dx * e.longitud, e.y - dy * e.longitud);
    ctx.stroke();

    e.x += dx * e.velocidad;
    e.y += dy * e.velocidad;
    e.vida -= 0.012;

    if (e.vida <= 0 || e.x > ancho + 100 || e.y > alto + 100) {
      estrellaFugaz = null;
    }
  }

  function dibujarFrame(tiempo) {
    ctx.clearRect(0, 0, ancho, alto);

    const sinMovimiento = prefiereMenosMovimiento();
    const parallaxScroll = sinMovimiento ? 0 : scrollY;
    const parallaxMouseX = sinMovimiento ? 0 : mouseX;
    const parallaxMouseY = sinMovimiento ? 0 : mouseY;

    capas.forEach((capa) => {
      const offsetX = parallaxMouseX * capa.velocidadParallax * 40;
      const offsetY = parallaxScroll * capa.velocidadParallax + parallaxMouseY * capa.velocidadParallax * 40;

      capa.estrellas.forEach((estrella) => {
        const parpadeo = sinMovimiento
          ? capa.brillo
          : capa.brillo * (0.6 + 0.4 * Math.sin(tiempo * 0.001 * estrella.velocidadParpadeo + estrella.fase));

        // Envuelve la posición para que el parallax nunca deje huecos vacíos
        let px = (estrella.x + offsetX) % ancho;
        if (px < 0) px += ancho;
        let py = (estrella.y + offsetY) % alto;
        if (py < 0) py += alto;

        ctx.beginPath();
        ctx.arc(px, py, estrella.radio, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 240, 255, ${parpadeo})`;
        ctx.fill();
      });
    });

    if (!sinMovimiento) {
      posiblementeLanzarEstrellaFugaz();
      dibujarEstrellaFugaz();
    }

    if (animando) {
      idAnimacion = requestAnimationFrame(dibujarFrame);
    }
  }

  function iniciarAnimacion() {
    if (!animando) {
      animando = true;
      idAnimacion = requestAnimationFrame(dibujarFrame);
    }
  }

  function detenerAnimacion() {
    animando = false;
    if (idAnimacion) cancelAnimationFrame(idAnimacion);
  }

  // Pausa el bucle cuando la pestaña no está visible (ahorro de batería/CPU)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      detenerAnimacion();
    } else {
      iniciarAnimacion();
    }
  });

  window.addEventListener('resize', redimensionar);

  window.addEventListener(
    'scroll',
    () => {
      scrollY = window.scrollY;
    },
    { passive: true }
  );

  window.addEventListener('mousemove', (evento) => {
    // Normaliza el ratón a un rango [-0.5, 0.5] respecto al centro de la pantalla
    mouseX = evento.clientX / window.innerWidth - 0.5;
    mouseY = evento.clientY / window.innerHeight - 0.5;
  });

  redimensionar();
  iniciarAnimacion();
})();
