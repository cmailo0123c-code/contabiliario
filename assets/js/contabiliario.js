/*!
 * CONTABILIARIO — Landing JS (vanilla, sin dependencias)
 * Módulos: header · menú móvil · navegación activa · revelado · pasos
 *          parallax · contadores · FAQ · formulario · año · analítica
 */
(function () {
	'use strict';

	var root = document.documentElement;
	var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var config = window.ctbConfig || {};
	var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
	var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
	var hasIO = 'IntersectionObserver' in window;

	root.classList.add('ctb-js');
	window.ctbLoaded = true;

	/* ------------------------------------------------------------------
	 * Analítica: envía eventos solo si GA4 / GTM / Meta Pixel existen.
	 * ------------------------------------------------------------------ */
	function track(event, params) {
		params = params || {};
		try {
			if (typeof window.gtag === 'function') window.gtag('event', event, params);
			else if (Array.isArray(window.dataLayer)) window.dataLayer.push(Object.assign({ event: event }, params));
			if (typeof window.fbq === 'function' && event === 'generate_lead') window.fbq('track', 'Lead');
		} catch (e) { /* silencioso */ }
	}

	/* ------------------------------------------------------------------
	 * 1. Header: transparente → blanco translúcido con blur al bajar.
	 * ------------------------------------------------------------------ */
	var header = $('[data-ctb-header]');
	if (header) {
		var ticking = false;
		var updateHeader = function () {
			header.classList.toggle('is-scrolled', window.scrollY > 12);
			ticking = false;
		};
		window.addEventListener('scroll', function () {
			if (!ticking) { window.requestAnimationFrame(updateHeader); ticking = true; }
		}, { passive: true });
		updateHeader();
	}

	/* ------------------------------------------------------------------
	 * 2. Menú móvil con animación, Escape, clic en enlace y foco.
	 * ------------------------------------------------------------------ */
	var burger = $('[data-ctb-burger]');
	var mobile = $('[data-ctb-mobile]');
	var closeTimer;

	function openMenu() {
		clearTimeout(closeTimer);
		mobile.hidden = false;
		burger.setAttribute('aria-expanded', 'true');
		burger.setAttribute('aria-label', 'Cerrar menú');
		header.classList.add('is-menu-open');
		window.requestAnimationFrame(function () {
			window.requestAnimationFrame(function () { mobile.classList.add('is-open'); });
		});
		document.addEventListener('keydown', onMenuKey);
		document.addEventListener('click', onOutside, true);
	}
	function closeMenu(returnFocus) {
		mobile.classList.remove('is-open');
		burger.setAttribute('aria-expanded', 'false');
		burger.setAttribute('aria-label', 'Abrir menú');
		header.classList.remove('is-menu-open');
		closeTimer = setTimeout(function () { mobile.hidden = true; }, reduceMotion ? 0 : 400);
		document.removeEventListener('keydown', onMenuKey);
		document.removeEventListener('click', onOutside, true);
		if (returnFocus) burger.focus();
	}
	function onMenuKey(e) { if (e.key === 'Escape') closeMenu(true); }
	function onOutside(e) { if (!header.contains(e.target)) closeMenu(false); }

	if (burger && mobile && header) {
		burger.addEventListener('click', function () {
			burger.getAttribute('aria-expanded') === 'true' ? closeMenu(false) : openMenu();
		});
		$$('a', mobile).forEach(function (a) { a.addEventListener('click', function () { closeMenu(false); }); });
		window.matchMedia('(min-width: 1024px)').addEventListener('change', function (mq) {
			if (mq.matches && burger.getAttribute('aria-expanded') === 'true') closeMenu(false);
		});
	}

	/* ------------------------------------------------------------------
	 * 3. Navegación activa según la sección visible.
	 * ------------------------------------------------------------------ */
	var navLinks = $$('[data-ctb-nav]');
	if (hasIO && navLinks.length) {
		var ids = navLinks.map(function (a) { return a.getAttribute('data-ctb-nav'); })
			.filter(function (v, i, arr) { return arr.indexOf(v) === i; });
		var setActive = function (id) {
			navLinks.forEach(function (a) {
				var on = a.getAttribute('data-ctb-nav') === id;
				a.classList.toggle('is-active', on);
				if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
			});
		};
		var navIO = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) { if (entry.isIntersecting) setActive(entry.target.id); });
		}, { rootMargin: '-45% 0px -50% 0px' });
		ids.forEach(function (id) { var s = document.getElementById(id); if (s) navIO.observe(s); });
	}

	/* ------------------------------------------------------------------
	 * 4. Revelado al hacer scroll (+ stagger automático en grupos).
	 * ------------------------------------------------------------------ */
	$$('[data-ctb-stagger]').forEach(function (group) {
		$$(':scope > .ctb-reveal', group).forEach(function (el, i) {
			if (!el.style.getPropertyValue('--ctb-delay')) el.style.setProperty('--ctb-delay', (i * 90) + 'ms');
		});
	});

	var reveals = $$('.ctb-reveal');
	var finishReveal = function (el) {
		// Las cards recuperan su transición de hover propia después de aparecer.
		if (!el.matches('.ctb-card, .ctb-aud')) return;
		var delay = parseInt(el.style.getPropertyValue('--ctb-delay'), 10) || 0;
		setTimeout(function () { el.classList.remove('ctb-reveal', 'ctb-reveal--scale', 'is-in'); }, reduceMotion ? 0 : delay + 900);
	};

	if (!hasIO || reduceMotion) {
		reveals.forEach(function (el) { el.classList.add('is-in'); finishReveal(el); });
	} else {
		var revealIO = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (!entry.isIntersecting) return;
				entry.target.classList.add('is-in');
				finishReveal(entry.target);
				revealIO.unobserve(entry.target);
			});
		}, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
		reveals.forEach(function (el) { revealIO.observe(el); });
	}

	/* Pasos y dashboard (activan animaciones internas) */
	var oneShot = function (selector, threshold) {
		$$(selector).forEach(function (el) {
			if (!hasIO || reduceMotion) { el.classList.add('is-in'); return; }
			var io = new IntersectionObserver(function (entries) {
				if (entries[0].isIntersecting) { el.classList.add('is-in'); io.disconnect(); }
			}, { threshold: threshold });
			io.observe(el);
		});
	};
	oneShot('[data-ctb-steps]', 0.3);

	/* ------------------------------------------------------------------
	 * 5. Parallax muy sutil en los brillos del hero (requestAnimationFrame).
	 * ------------------------------------------------------------------ */
	var parallax = $$('[data-ctb-parallax]');
	if (parallax.length && !reduceMotion) {
		var pTicking = false;
		var hero = $('.ctb-hero');
		var runParallax = function () {
			var y = window.scrollY;
			if (!hero || y < hero.offsetHeight) {
				parallax.forEach(function (el) {
					var f = parseFloat(el.getAttribute('data-ctb-parallax')) || 0;
					el.style.transform = 'translate3d(0,' + (y * f).toFixed(1) + 'px,0)';
				});
			}
			pTicking = false;
		};
		window.addEventListener('scroll', function () {
			if (!pTicking) { window.requestAnimationFrame(runParallax); pTicking = true; }
		}, { passive: true });
	}

	/* ------------------------------------------------------------------
	 * 6. Contadores animados (solo existen si hay datos reales).
	 * ------------------------------------------------------------------ */
	var counters = $$('[data-ctb-count]');
	var formatNum = function (n) { return Math.round(n).toLocaleString('es-CL'); };
	var animateCount = function (el) {
		var target = parseFloat(el.getAttribute('data-ctb-count')) || 0;
		if (reduceMotion) { el.textContent = formatNum(target); return; }
		var start = null;
		var dur = 1600;
		var step = function (t) {
			if (!start) start = t;
			var p = Math.min((t - start) / dur, 1);
			var eased = 1 - Math.pow(1 - p, 4);
			el.textContent = formatNum(target * eased);
			if (p < 1) window.requestAnimationFrame(step);
		};
		el.textContent = '0';
		window.requestAnimationFrame(step);
	};
	if (counters.length) {
		if (!hasIO) counters.forEach(function (c) { c.textContent = formatNum(+c.getAttribute('data-ctb-count')); });
		else {
			var countIO = new IntersectionObserver(function (entries) {
				entries.forEach(function (e) {
					if (e.isIntersecting) { animateCount(e.target); countIO.unobserve(e.target); }
				});
			}, { threshold: 0.6 });
			counters.forEach(function (c) { countIO.observe(c); });
		}
	}

	/* ------------------------------------------------------------------
	 * 7. FAQ: acordeón accesible (uno abierto a la vez).
	 * ------------------------------------------------------------------ */
	$$('[data-ctb-accordion]').forEach(function (acc) {
		var buttons = $$('.ctb-acc__btn', acc);
		var setOpen = function (btn, open) {
			btn.setAttribute('aria-expanded', open ? 'true' : 'false');
			btn.closest('.ctb-acc').classList.toggle('is-open', open);
		};
		buttons.forEach(function (btn, i) {
			btn.addEventListener('click', function () {
				var willOpen = btn.getAttribute('aria-expanded') !== 'true';
				buttons.forEach(function (b) { if (b !== btn) setOpen(b, false); });
				setOpen(btn, willOpen);
			});
			btn.addEventListener('keydown', function (e) {
				var next = null;
				if (e.key === 'ArrowDown') next = buttons[(i + 1) % buttons.length];
				else if (e.key === 'ArrowUp') next = buttons[(i - 1 + buttons.length) % buttons.length];
				else if (e.key === 'Home') next = buttons[0];
				else if (e.key === 'End') next = buttons[buttons.length - 1];
				if (next) { e.preventDefault(); next.focus(); }
			});
		});
	});

	/* ------------------------------------------------------------------
	 * 8. Formulario: validación, estados y envío.
	 * ------------------------------------------------------------------ */
	var form = $('[data-ctb-form]');

	// Enlaces "Solicitar información" preseleccionan el servicio.
	$$('[data-ctb-service]').forEach(function (link) {
		link.addEventListener('click', function () {
			var select = form && form.elements.servicio;
			if (select) select.value = link.getAttribute('data-ctb-service');
		});
	});

	if (form) {
		var submitBtn = $('[data-ctb-submit]', form);
		var alertBox = $('[data-ctb-alert]', form);
		var alertText = $('[data-ctb-alert-text]', form);
		var success = $('[data-ctb-success]');
		var successText = $('[data-ctb-success-text]');

		var rules = {
			nombre: function (v) { return v.trim().length >= 2 ? '' : 'Ingresa tu nombre.'; },
			correo: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Ingresa un correo válido (ej: nombre@empresa.cl).'; },
			telefono: function (v) { return !v.trim() || /^[0-9+()\s-]{8,20}$/.test(v.trim()) ? '' : 'Ingresa un teléfono válido (ej: +56 9 1234 5678).'; },
			servicio: function (v) { return v ? '' : 'Selecciona un tipo de servicio.'; },
			mensaje: function (v) { return v.trim().length >= 10 ? '' : 'Cuéntanos un poco más (mínimo 10 caracteres).'; }
		};

		var setFieldError = function (name, msg) {
			var input = form.elements[name];
			if (!input) return;
			var field = input.closest('.ctb-field');
			var err = document.getElementById('ctb-' + name + '-err');
			field.classList.toggle('is-invalid', !!msg);
			input.setAttribute('aria-invalid', msg ? 'true' : 'false');
			if (err) err.textContent = msg || '';
		};
		var validateField = function (name) {
			var input = form.elements[name];
			if (!input || !rules[name]) return true;
			var msg = rules[name](input.value);
			setFieldError(name, msg);
			return !msg;
		};
		var showAlert = function (msg) { alertText.textContent = msg; alertBox.hidden = false; };
		var hideAlert = function () { alertBox.hidden = true; alertText.textContent = ''; };
		var setLoading = function (on) {
			submitBtn.classList.toggle('is-loading', on);
			submitBtn.disabled = on;
			form.setAttribute('aria-busy', on ? 'true' : 'false');
		};

		// Validación al salir del campo y corrección en vivo.
		Object.keys(rules).forEach(function (name) {
			var input = form.elements[name];
			if (!input) return;
			input.addEventListener('blur', function () { if (input.value) validateField(name); });
			input.addEventListener('input', function () {
				if (input.closest('.ctb-field').classList.contains('is-invalid')) validateField(name);
			});
			input.addEventListener('change', function () {
				if (input.tagName === 'SELECT') validateField(name);
			});
		});

		form.addEventListener('submit', function (e) {
			e.preventDefault();
			hideAlert();

			var firstInvalid = null;
			Object.keys(rules).forEach(function (name) {
				if (!validateField(name) && !firstInvalid) firstInvalid = form.elements[name];
			});
			if (firstInvalid) { firstInvalid.focus(); return; }

			// Sin backend configurado: NO se simula el envío.
			if (!config.formEndpoint) {
				showAlert('El formulario aún no está conectado a un servidor. Configura el envío en config.php (form_mode) para recibir solicitudes.');
				return;
			}

			setLoading(true);
			var controller = 'AbortController' in window ? new AbortController() : null;
			var timeout = setTimeout(function () { if (controller) controller.abort(); }, 15000);

			fetch(config.formEndpoint, {
				method: 'POST',
				body: new FormData(form),
				headers: { 'Accept': 'application/json' },
				credentials: 'same-origin',
				signal: controller ? controller.signal : undefined
			})
				.then(function (res) {
					return res.json().catch(function () { return {}; }).then(function (data) {
						return { ok: res.ok, status: res.status, data: data };
					});
				})
				.then(function (r) {
					// Formato del endpoint nativo: { success, message, fields }.
					// Endpoints externos (Make, Zapier…) solo necesitan responder 2xx.
					var ok = r.ok && r.data.success !== false;
					if (ok) {
						form.hidden = true;
						if (r.data.message) successText.textContent = r.data.message;
						success.hidden = false;
						success.focus();
						track('generate_lead', { form: 'contacto', service: form.elements.servicio.value });
						return;
					}
					if (r.data.fields) {
						Object.keys(r.data.fields).forEach(function (k) { setFieldError(k, r.data.fields[k]); });
					}
					showAlert(r.data.message || 'No pudimos enviar tu mensaje. Inténtalo nuevamente en unos minutos.');
				})
				.catch(function () {
					showAlert('Hubo un problema de conexión con el servidor. Revisa tu conexión e inténtalo nuevamente.');
				})
				.then(function () {
					clearTimeout(timeout);
					setLoading(false);
				});
		});
	}

	/* ------------------------------------------------------------------
	 * 9. Año automático en el footer + clics de contacto en analítica.
	 * ------------------------------------------------------------------ */
	$$('[data-ctb-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

	$$('a[href^="https://wa.me/"]').forEach(function (a) {
		a.addEventListener('click', function () { track('contact_whatsapp'); });
	});
})();
