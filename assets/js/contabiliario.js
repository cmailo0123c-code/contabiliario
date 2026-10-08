/*!
 * CONTABILIARIO — Landing JS v4.1 (vanilla, sin dependencias)
 * 00 AnimationController       06 Modal                 11 FAQ
 * 01 Utilidades y analítica    07 Tabs accesibles       12 Glosario
 * 02 Header                    08 Demo interactiva      13 Cuestionario
 * 03 Menú móvil                09 Reportes              14 CTA contextuales
 * 04 Navegación activa         10 Abridores de modal    15 Clics medidos / año
 * 05 Pasos, situaciones y parallax
 *
 * Mejora progresiva: el contenido es visible sin JS. Cada módulo corre aislado (run): si uno falla,
 * la página vuelve a la versión sin animaciones en vez de quedar con contenido oculto.
 */
(function () {
	'use strict';

	var root = document.documentElement;
	window.ctbLoaded = true;
	// Arranque tardío (JS diferido por un plugin de caché, red muy lenta): lo que ya está en pantalla aparece sin animar.
	var lateStart = !root.classList.contains('ctb-js-enabled') || !!(window.performance && performance.now && performance.now() > 2500);
	root.classList.add('ctb-js-enabled');

	var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
	var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
	var hasIO = 'IntersectionObserver' in window;
	var degraded = false;

	/** Corre un módulo aislado. Si falla, vuelve a la presentación sin JS (todo visible) y lo registra. */
	function run(name, fn) {
		try { fn(); } catch (err) {
			if (!degraded) { degraded = true; root.classList.remove('ctb-js-enabled'); root.classList.add('ctb-js-degraded'); }
			if (window.console && console.error) console.error('[Contabiliario] Falló el módulo "' + name + '":', err);
		}
	}
	/** matchMedia con compatibilidad para Safari < 14 (addListener). */
	function mqListen(mq, fn) {
		if (!mq) return;
		if (mq.addEventListener) mq.addEventListener('change', fn); else if (mq.addListener) mq.addListener(fn);
	}

	/* ================= 00 ANIMATION CONTROLLER =================
	 * Único responsable del movimiento: preferencia del sistema (en vivo), entradas al hacer scroll
	 * (IntersectionObserver), stagger, animaciones de entrada de tabs/paneles, pausa de bucles y scroll. */
	var Motion = (function () {
		var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
		var subs = [];
		mqListen(mq, function () { subs.forEach(function (fn) { fn(); }); });

		var api = {
			reduced: function () { return !!(mq && mq.matches); },
			onChange: function (fn) { subs.push(fn); },
			/** Duración en ms de un token CSS (--ctb-motion-fast|medium|slow|draw, --ctb-stagger). Ya refleja el modo reducido. */
			ms: function (name) {
				var v = window.getComputedStyle(root).getPropertyValue(name.indexOf('--') === 0 ? name : '--ctb-motion-' + name).trim();
				var n = parseFloat(v);
				if (isNaN(n)) return 0;
				return /ms$/.test(v) ? n : n * 1000;
			},
			behavior: function () { return api.reduced() ? 'auto' : 'smooth'; },
			scrollTo: function (el) { if (el) el.scrollIntoView({ behavior: api.behavior(), block: 'start' }); },
			/** Reproduce la animación de entrada de un elemento (tabs, filas, paneles). En modo reducido el CSS la convierte en fade. */
			enter: function (el, cls) {
				if (!el) return;
				cls = cls || 'ctb-is-entering';
				el.classList.remove(cls);
				void el.offsetWidth; // reinicia la animación
				el.classList.add(cls);
			},
			/** Pausa los bucles CSS de un contenedor mientras no se ve. */
			pauseOffscreen: function (el, onVisible) {
				if (!el || !hasIO) return;
				new IntersectionObserver(function (entries) {
					var vis = entries[0].isIntersecting;
					el.classList.toggle('ctb-is-paused', !vis);
					if (onVisible) onVisible(vis);
				}).observe(el);
			}
		};

		/* --- Entradas al hacer scroll --- */
		var VARIANTS = ['ctb-animate', 'ctb-fade-up', 'ctb-fade-in', 'ctb-fade-left', 'ctb-fade-right', 'ctb-scale-in', 'ctb-is-instant'];
		var items = [];
		var io = null;
		var repeat = function (el) { return el.getAttribute('data-animate-repeat') === 'true' && el.getAttribute('data-animate-once') !== 'true'; };

		/** Devuelve el control a las transiciones propias del componente (hover de cards, etc.). */
		function settle(el) {
			if (el.__ctbSettled) return;
			el.__ctbSettled = true;
			VARIANTS.forEach(function (c) { el.classList.remove(c); });
			el.style.removeProperty('--ctb-order');
		}
		function reveal(el, instant) {
			if (el.classList.contains('ctb-is-visible')) return;
			var animated = el.classList.contains('ctb-animate');
			if (instant) el.classList.add('ctb-is-instant');
			el.classList.add('ctb-is-visible');
			if (repeat(el)) return;
			if (io) io.unobserve(el);
			if (!animated) return;
			if (instant) { settle(el); return; }
			var order = parseFloat(el.style.getPropertyValue('--ctb-order')) || 0;
			var onEnd = function (e) { if (e.target === el && e.propertyName === 'opacity') { el.removeEventListener('transitionend', onEnd); settle(el); } };
			el.addEventListener('transitionend', onEnd);
			// Respaldo por si transitionend no llega (pestaña en segundo plano, ahorro de energía).
			setTimeout(function () { settle(el); }, api.ms('slow') + order * api.ms('--ctb-stagger') + 120);
		}
		/** Elementos anteriores que quedaron por encima de la pantalla (scroll muy rápido) aparecen sin animar. */
		function catchUp(el) {
			var idx = items.indexOf(el);
			for (var i = 0; i < idx; i++) {
				var it = items[i];
				if (!it.classList.contains('ctb-is-visible') && !repeat(it) && it.getBoundingClientRect().bottom < 0) reveal(it, true);
			}
		}

		api.initReveal = function () {
			// Stagger: 0, 70, 140… ms dentro de cada grupo (máx. 6 pasos para no generar esperas largas).
			$$('[data-ctb-stagger]').forEach(function (group) {
				$$('.ctb-animate', group).forEach(function (el, i) { el.style.setProperty('--ctb-order', String(Math.min(i, 6))); });
			});
			items = $$('.ctb-animate, [data-ctb-steps]');
			if (!items.length) return;

			// Sin IntersectionObserver: todo visible de inmediato (nunca opacity: 0 permanente).
			if (!hasIO) { items.forEach(function (el) { reveal(el, true); }); return; }

			var initial = true;
			setTimeout(function () { initial = false; }, 300);
			io = new IntersectionObserver(function (entries) {
				entries.forEach(function (entry) {
					var el = entry.target;
					var top = entry.rootBounds ? entry.rootBounds.top : 0;
					if (entry.isIntersecting) {
						reveal(el, lateStart && initial);
						catchUp(el);
					} else if (entry.boundingClientRect.bottom < top) {
						reveal(el, true); // ya quedó atrás (salto con ancla)
					} else if (repeat(el)) {
						el.classList.remove('ctb-is-visible');
					}
				});
			}, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
			items.forEach(function (el) { io.observe(el); });

			// Teclado: si el foco entra a algo que aún no aparece, se muestra al instante.
			document.addEventListener('focusin', function (e) {
				var el = e.target.closest && e.target.closest('.ctb-animate:not(.ctb-is-visible)');
				if (el) reveal(el, true);
			});
		};

		// Pestaña en segundo plano: se pausan los bucles CSS (ahorra CPU, GPU y batería).
		var onVisibility = function () { root.classList.toggle('ctb-page-inactive', document.visibilityState === 'hidden'); };
		document.addEventListener('visibilitychange', onVisibility);
		onVisibility();
		// iOS Safari solo aplica :active si existe algún listener táctil.
		document.addEventListener('touchstart', function () {}, { passive: true });
		// Las animaciones de entrada (tabs, filas, paneles) se limpian solas al terminar.
		document.addEventListener('animationend', function (e) {
			var t = e.target;
			if (t && t.classList && t.classList.contains('ctb-is-entering')) t.classList.remove('ctb-is-entering');
		});

		return api;
	})();

	run('animaciones', function () { Motion.initReveal(); });

	/* ================= 01 UTILIDADES Y ANALÍTICA ================= */
	var config = window.ctbConfig || {};
	var data = {};
	try { data = JSON.parse(($('#ctb-data') || {}).textContent || '{}'); } catch (e) { data = {}; }

	var clp = function (n) { return '$' + Math.round(n).toLocaleString('es-CL'); };
	var esc = function (s) {
		return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
	};
	var norm = function (s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
	var store = {
		get: function (k) { try { return JSON.parse(window.localStorage.getItem(k)); } catch (e) { return null; } },
		set: function (k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
		del: function (k) { try { window.localStorage.removeItem(k); } catch (e) { /* noop */ } }
	};

	/**
	 * Eventos del embudo. Solo se envían si existe GA4 (gtag), GTM (dataLayer) o Meta Pixel (fbq).
	 * Nombres: inicio_cuestionario, respuesta_problema, respuesta_tipo_cliente, respuesta_detalle,
	 * inicio_datos_contacto, envio_formulario, clic_whatsapp, clic_llamada, clic_email,
	 * clic_servicio, clic_situacion, faq_abierto, dashboard_interaccion, glosario_abierto.
	 */
	function track(event, params) {
		params = params || {};
		try {
			if (typeof window.gtag === 'function') window.gtag('event', event, params);
			else if (Array.isArray(window.dataLayer)) window.dataLayer.push(Object.assign({ event: event }, params));
			if (typeof window.fbq === 'function') {
				if (event === 'envio_formulario') window.fbq('track', 'Lead');
				else if (event === 'clic_whatsapp' || event === 'clic_llamada' || event === 'clic_email') window.fbq('track', 'Contact');
			}
		} catch (e) { /* silencioso */ }
	}

	/* ================= 02 HEADER (sin escuchar scroll: un centinela con IntersectionObserver) ================= */
	var header = $('[data-ctb-header]');
	run('header', function () {
		if (!header) return;
		var setScrolled = function (on) { header.classList.toggle('ctb-is-scrolled', on); };
		if (hasIO) {
			var sentinel = document.createElement('div');
			sentinel.setAttribute('aria-hidden', 'true');
			sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:12px;pointer-events:none;';
			document.body.insertBefore(sentinel, document.body.firstChild);
			new IntersectionObserver(function (entries) { setScrolled(!entries[0].isIntersecting); }).observe(sentinel);
		} else {
			var tick = false;
			window.addEventListener('scroll', function () {
				if (tick) return;
				tick = true;
				window.requestAnimationFrame(function () { setScrolled(window.pageYOffset > 12); tick = false; });
			}, { passive: true });
			setScrolled(window.pageYOffset > 12);
		}
	});

	/* ================= 03 MENÚ MÓVIL ================= */
	run('menu', function () {
		var burger = $('[data-ctb-burger]');
		var mobile = $('[data-ctb-mobile]');
		if (!burger || !mobile || !header) return;
		var closeTimer;
		function onMenuKey(e) { if (e.key === 'Escape') closeMenu(true); }
		function onOutside(e) { if (!header.contains(e.target)) closeMenu(false); }
		function openMenu() {
			clearTimeout(closeTimer);
			mobile.hidden = false;
			burger.setAttribute('aria-expanded', 'true');
			burger.setAttribute('aria-label', 'Cerrar menú');
			header.classList.add('ctb-is-menu-open');
			window.requestAnimationFrame(function () { window.requestAnimationFrame(function () { mobile.classList.add('ctb-is-open'); }); });
			document.addEventListener('keydown', onMenuKey);
			document.addEventListener('click', onOutside, true);
		}
		function closeMenu(returnFocus) {
			mobile.classList.remove('ctb-is-open');
			burger.setAttribute('aria-expanded', 'false');
			burger.setAttribute('aria-label', 'Abrir menú');
			header.classList.remove('ctb-is-menu-open');
			closeTimer = setTimeout(function () { mobile.hidden = true; }, Motion.ms('medium'));
			document.removeEventListener('keydown', onMenuKey);
			document.removeEventListener('click', onOutside, true);
			if (returnFocus) burger.focus();
		}
		burger.addEventListener('click', function () {
			if (burger.getAttribute('aria-expanded') === 'true') closeMenu(false); else openMenu();
		});
		$$('a', mobile).forEach(function (a) { a.addEventListener('click', function () { closeMenu(false); }); });
		mqListen(window.matchMedia('(min-width: 1120px)'), function (e) {
			if (e.matches && burger.getAttribute('aria-expanded') === 'true') closeMenu(false);
		});
	});

	/* ================= 04 NAVEGACIÓN ACTIVA ================= */
	run('navegacion', function () {
		var navLinks = $$('[data-ctb-nav]');
		if (!hasIO || !navLinks.length) return;
		var setActive = function (id) {
			navLinks.forEach(function (a) {
				var on = a.getAttribute('data-ctb-nav') === id;
				a.classList.toggle('ctb-is-active', on);
				if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
			});
		};
		var navIO = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) { if (entry.isIntersecting) setActive(entry.target.id); });
		}, { rootMargin: '-45% 0px -50% 0px' });
		navLinks.map(function (a) { return a.getAttribute('data-ctb-nav'); })
			.filter(function (v, i, arr) { return arr.indexOf(v) === i; })
			.forEach(function (id) { var s = document.getElementById(id); if (s) navIO.observe(s); });
	});

	/* ================= 05 PASOS, SITUACIONES Y PARALLAX ================= */
	/* Cómo funciona: resalta solo el paso activo. Sin listener de scroll: IntersectionObserver con franjas. */
	run('pasos', function () {
		if (!hasIO) return;
		$$('[data-ctb-steps]').forEach(function (wrap) {
			var steps = $$('.ctb-step', wrap);
			if (!steps.length) return;
			var current = -1;
			var setCurrent = function (i) {
				if (i === current) return;
				current = i;
				steps.forEach(function (st, k) { st.classList.toggle('ctb-is-current', k === i); });
			};
			var stacked = function () { return steps.length > 1 && steps[1].offsetTop > steps[0].offsetTop + 10; };

			// Móvil (pasos apilados): el paso que cruza la franja central de la pantalla.
			var bandIO = new IntersectionObserver(function (entries) {
				if (!stacked()) return;
				entries.forEach(function (e) { if (e.isIntersecting) setCurrent(steps.indexOf(e.target)); });
			}, { rootMargin: '-45% 0px -45% 0px' });
			steps.forEach(function (st) { bandIO.observe(st); });

			// En fila (tablet/desktop): avanza a medida que el centro del bloque sube por la pantalla.
			var marker = document.createElement('span');
			marker.setAttribute('aria-hidden', 'true');
			marker.style.cssText = 'position:absolute;left:0;top:50%;width:1px;height:1px;pointer-events:none;';
			wrap.appendChild(marker);
			var marks = steps.map(function (s, k) { return 0.8 - (0.45 * k) / Math.max(1, steps.length - 1); }); // 80% → 35% del alto
			var fromMarker = function () {
				if (stacked()) return;
				var y = marker.getBoundingClientRect().top;
				var vh = window.innerHeight || root.clientHeight;
				var passed = marks.filter(function (m) { return y < vh * m; }).length;
				setCurrent(Math.max(0, passed - 1));
			};
			marks.forEach(function (m) {
				var topPct = (m * 100).toFixed(1);
				var botPct = (100 - m * 100 - 1).toFixed(1);
				new IntersectionObserver(fromMarker, { rootMargin: '-' + topPct + '% 0px -' + botPct + '% 0px' }).observe(marker);
			});
			// Cambio de orientación / Split View: se recalcula una vez, no en cada píxel.
			mqListen(window.matchMedia('(min-width: 768px)'), function () {
				if (!stacked()) { fromMarker(); return; }
				var vh = window.innerHeight || root.clientHeight, best = Infinity, idx = 0;
				steps.forEach(function (st, k) {
					var r = st.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - vh / 2);
					if (d < best) { best = d; idx = k; }
				});
				setCurrent(idx);
			});
			setCurrent(0);
		});
	});

	/* Situaciones: marca la tarjeta elegida (estado visible también en táctil). */
	run('situaciones', function () {
		document.addEventListener('click', function (e) {
			var sit = e.target.closest && e.target.closest('.ctb-sit:not(.ctb-sit--featured)');
			if (!sit) return;
			$$('.ctb-sit.ctb-is-selected').forEach(function (s) { if (s !== sit) s.classList.remove('ctb-is-selected'); });
			sit.classList.add('ctb-is-selected');
		});
	});

	/* Parallax sutil del hero: solo mientras el hero se ve y si no se pidió reducir movimiento. */
	run('parallax', function () {
		var hero = $('.ctb-hero');
		var layers = $$('[data-ctb-parallax]');
		if (!hero) return;
		var visible = true, active = false, ticking = false;
		var apply = function () {
			ticking = false;
			var y = window.pageYOffset || 0;
			layers.forEach(function (el) {
				var f = parseFloat(el.getAttribute('data-ctb-parallax')) || 0;
				el.style.transform = 'translate3d(0,' + (y * f).toFixed(1) + 'px,0)';
			});
		};
		var onScroll = function () { if (!ticking) { ticking = true; window.requestAnimationFrame(apply); } };
		var update = function () {
			var should = visible && layers.length > 0 && !Motion.reduced();
			if (should === active) return;
			active = should;
			if (should) {
				layers.forEach(function (el) { el.style.willChange = 'transform'; });
				window.addEventListener('scroll', onScroll, { passive: true });
				apply();
			} else {
				window.removeEventListener('scroll', onScroll);
				layers.forEach(function (el) { el.style.willChange = ''; if (Motion.reduced()) el.style.transform = ''; });
			}
		};
		// Además pausa las tarjetas flotantes y el punto "Actualizado" cuando el hero sale de pantalla.
		Motion.pauseOffscreen(hero, function (vis) { visible = vis; update(); });
		Motion.onChange(update);
		update();
	});

	/* ================= 06 MODAL (dialog nativo + trampa de foco) ================= */
	var modal = $('[data-ctb-modal]');
	var modalBody = $('[data-ctb-modal-body]');
	var lastTrigger = null;
	var afterClose = null;

	function openModal(tplId, trigger) {
		var tpl = document.getElementById(tplId);
		if (!modal || !tpl) return;
		modalBody.innerHTML = '';
		modalBody.appendChild(tpl.content.cloneNode(true));
		if (trigger) lastTrigger = trigger;
		modal.classList.remove('ctb-is-closing');
		if (!modal.open) {
			if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
		}
		$('.ctb-modal__box', modal).scrollTop = 0;
		root.classList.add('ctb-modal-open');
		var close = $('[data-ctb-modal-close]', modal);
		if (close) close.focus();
	}
	function onModalClosed() {
		modal.classList.remove('ctb-is-closing');
		root.classList.remove('ctb-modal-open');
		var cb = afterClose; afterClose = null;
		if (cb) cb();
		else if (lastTrigger && document.body.contains(lastTrigger)) lastTrigger.focus();
	}
	function closeModal(cb) {
		if (!modal || !modal.open) { if (cb) cb(); return; }
		afterClose = cb || null;
		modal.classList.add('ctb-is-closing');
		// El cierre es más corto que la apertura (fast vs medium).
		setTimeout(function () {
			if (typeof modal.close === 'function') modal.close(); else { modal.removeAttribute('open'); onModalClosed(); }
		}, Motion.ms('fast'));
	}
	run('modal', function () {
		if (!modal) return;
		modal.addEventListener('close', onModalClosed);
		modal.addEventListener('cancel', function (e) { e.preventDefault(); closeModal(); });
		modal.addEventListener('click', function (e) {
			if (e.target === modal || e.target.closest('[data-ctb-modal-close]')) closeModal();
		});
		modal.addEventListener('keydown', function (e) {
			// Escape siempre cierra (incluso escribiendo en el buscador del glosario).
			if (e.key === 'Escape') { e.preventDefault(); closeModal(); return; }
			if (e.key !== 'Tab') return;
			var f = $$('a[href], button:not([disabled]), summary, input, select, textarea, [tabindex]:not([tabindex="-1"])', modal)
				.filter(function (n) { return n.offsetParent !== null; });
			if (!f.length) return;
			var first = f[0], last = f[f.length - 1];
			if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
			else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
		});
	});

	/* ================= 07 TABS ACCESIBLES (role="tab") ================= */
	function setupTabs(list, onChange) {
		var tabs = $$('[role="tab"]', list);
		var activate = function (tab, focus) {
			tabs.forEach(function (t) {
				var on = t === tab;
				t.setAttribute('aria-selected', on ? 'true' : 'false');
				t.setAttribute('tabindex', on ? '0' : '-1');
				t.classList.toggle('ctb-is-active', on);
				var panel = document.getElementById(t.getAttribute('aria-controls'));
				if (panel) {
					panel.hidden = !on;
					panel.classList.toggle('ctb-is-active', on);
					if (on) Motion.enter(panel);
				}
			});
			if (focus) tab.focus();
			if (list.scrollWidth > list.clientWidth) tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: Motion.behavior() });
			if (onChange) onChange(tab);
		};
		tabs.forEach(function (tab, i) {
			tab.addEventListener('click', function () { activate(tab, false); });
			tab.addEventListener('keydown', function (e) {
				var next = null;
				if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
				else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
				else if (e.key === 'Home') next = tabs[0];
				else if (e.key === 'End') next = tabs[tabs.length - 1];
				if (next) { e.preventDefault(); activate(next, true); }
			});
		});
		return { activate: activate };
	}

	/* ================= 09 REPORTES (funciones; se usan desde la demo) ================= */
	var reportRendered = false;
	var reportChart = $('[data-ctb-report-chart]');
	var reportData = null;
	var kpiState = { ingresos: 0, gastos: 0, resultado: 0 };
	if (reportChart) { try { reportData = JSON.parse(reportChart.getAttribute('data-report')); } catch (e) { reportData = null; } }
	/** Contador corto (≤ 600 ms). Con movimiento reducido muestra el valor final al instante. */
	function countTo(el, from, to) {
		if (Motion.reduced()) { el.textContent = clp(to); return; }
		var start = null;
		var dur = Math.min(600, Math.max(300, Motion.ms('slow')));
		var step = function (t) {
			if (!start) start = t;
			var p = Math.min((t - start) / dur, 1);
			el.textContent = clp(from + (to - from) * (1 - Math.pow(1 - p, 3)));
			if (p < 1) window.requestAnimationFrame(step);
		};
		window.requestAnimationFrame(step);
	}
	function barColumn(label, inc, out, max, i) {
		var res = inc - out;
		return '<div class="ctb-bars__col" style="--ctb-i:' + i + '" tabindex="0" aria-label="' + esc(label + ': ingresos ' + clp(inc) + ', gastos ' + clp(out) + ', resultado ' + clp(res)) + '">' +
			'<div class="ctb-bars__pair"><span class="ctb-bars__bar ctb-bars__bar--a" style="--h:' + (inc / max * 100).toFixed(1) + '%"></span>' +
			'<span class="ctb-bars__bar ctb-bars__bar--b" style="--h:' + (out / max * 100).toFixed(1) + '%"></span></div>' +
			'<span class="ctb-bars__label">' + esc(label) + '</span>' +
			'<span class="ctb-tip" aria-hidden="true"><b>' + esc(label) + '</b><span><i class="ctb-legend__a"></i>Ingresos ' + clp(inc) + '</span>' +
			'<span><i class="ctb-legend__b"></i>Gastos ' + clp(out) + '</span><span class="ctb-tip__res">Resultado ' + clp(res) + '</span></span></div>';
	}
	function renderReport(n) {
		if (!reportData) return;
		var L = reportData.labels.slice(-n), I = reportData.ingresos.slice(-n), G = reportData.gastos.slice(-n);
		var max = Math.max.apply(null, I) * 1.05;
		var html = '';
		for (var i = 0; i < L.length; i++) html += barColumn(L[i], I[i], G[i], max, i);
		reportChart.style.setProperty('--cols', n);
		reportChart.classList.toggle('ctb-bars--dense', n > 6);
		reportChart.innerHTML = html;
		var sum = function (a) { return a.reduce(function (s, v) { return s + v; }, 0); };
		var totals = { ingresos: sum(I), gastos: sum(G) };
		totals.resultado = totals.ingresos - totals.gastos;
		Object.keys(totals).forEach(function (k) {
			var el = $('[data-ctb-rk="' + k + '"]');
			if (el) countTo(el, kpiState[k], totals[k]);
			kpiState[k] = totals[k];
		});
		var best = 0;
		for (var j = 1; j < L.length; j++) if (I[j] - G[j] > I[best] - G[best]) best = j;
		var bestEl = $('[data-ctb-rk="best"]');
		if (bestEl) bestEl.textContent = 'Mejor mes del período: ' + L[best] + ' (resultado de ' + clp(I[best] - G[best]) + '). Toca una barra para ver el detalle.';
		Motion.enter($('[data-ctb-cats]'), 'ctb-is-animating');
	}

	/* ================= 08 DEMO INTERACTIVA ================= */
	run('demo', function () {
		var demoTabs = $('[data-ctb-tabs]');
		if (demoTabs) {
			var demo = setupTabs(demoTabs, function (tab) {
				var id = tab.id.replace('ctb-tab-', '');
				track('dashboard_interaccion', { accion: 'tab', seccion: id });
				if (id === 'reportes' && !reportRendered) { renderReport(6); reportRendered = true; }
			});
			$$('[data-ctb-goto-tab]').forEach(function (b) {
				b.addEventListener('click', function () {
					var t = document.getElementById('ctb-tab-' + b.getAttribute('data-ctb-goto-tab'));
					if (t) demo.activate(t, true);
				});
			});
		}
		var docFilters = $('[data-ctb-doc-filters]');
		if (docFilters) {
			var rows = $$('[data-ctb-doc-table] tbody tr');
			var empty = $('[data-ctb-doc-empty]');
			$$('.ctb-filter', docFilters).forEach(function (btn) {
				btn.addEventListener('click', function () {
					var f = btn.getAttribute('data-filter');
					$$('.ctb-filter', docFilters).forEach(function (b) {
						b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
						b.classList.toggle('ctb-is-active', b === btn);
					});
					var shown = 0;
					rows.forEach(function (r) {
						var ok = f === 'all' || r.getAttribute('data-status') === f;
						r.hidden = !ok;
						if (ok) { shown++; Motion.enter(r); }
					});
					empty.hidden = shown > 0;
					track('dashboard_interaccion', { accion: 'filtro', valor: f });
				});
			});
		}
		// Botones que muestran/ocultan un bloque (aria-expanded + aria-controls)
		$$('[data-ctb-toggle]').forEach(function (btn) {
			var target = document.getElementById(btn.getAttribute('aria-controls'));
			btn.addEventListener('click', function () {
				var open = btn.getAttribute('aria-expanded') !== 'true';
				btn.setAttribute('aria-expanded', open ? 'true' : 'false');
				if (target) {
					target.hidden = !open;
					if (open) { var f = $('textarea, input', target); if (f) f.focus(); }
				}
			});
		});
		// Barras: el detalle se abre con toque o clic (no depende del hover).
		document.addEventListener('click', function (e) {
			var col = e.target.closest && e.target.closest('.ctb-bars__col');
			$$('.ctb-bars__col.ctb-is-active').forEach(function (c) { if (c !== col) c.classList.remove('ctb-is-active'); });
			if (col) col.classList.toggle('ctb-is-active');
		});
		var range = $('[data-ctb-range]');
		if (range) {
			$$('.ctb-seg__btn', range).forEach(function (btn) {
				btn.addEventListener('click', function () {
					$$('.ctb-seg__btn', range).forEach(function (b) {
						b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
						b.classList.toggle('ctb-is-active', b === btn);
					});
					renderReport(parseInt(btn.getAttribute('data-range'), 10));
					reportRendered = true;
					track('dashboard_interaccion', { accion: 'periodo', meses: btn.getAttribute('data-range') });
				});
			});
		}
	});

	/* ================= 10 ABRIDORES DE MODAL ================= */
	run('abridores', function () {
		document.addEventListener('click', function (e) {
			var opener = e.target.closest('[data-ctb-open]');
			if (opener) {
				e.preventDefault();
				openModal(opener.getAttribute('data-ctb-open'), modal && modal.contains(opener) ? lastTrigger : opener);
				return;
			}
			// Toda la tarjeta de servicio es clickeable (el botón sigue siendo el control accesible).
			var card = e.target.closest('[data-ctb-card-click]');
			if (card && !e.target.closest('a, button')) {
				var btn = $('[data-ctb-open]', card);
				if (btn) btn.click();
			}
		});
	});

	/* ================= 11 FAQ ================= */
	run('faq', function () {
		var faqTabs = $('[data-ctb-faq-tabs]');
		if (faqTabs) setupTabs(faqTabs);
		$$('[data-ctb-accordion]').forEach(function (acc) {
			var buttons = $$('.ctb-acc__btn', acc);
			var setOpen = function (btn, open) {
				btn.setAttribute('aria-expanded', open ? 'true' : 'false');
				btn.closest('.ctb-acc').classList.toggle('ctb-is-open', open);
			};
			buttons.forEach(function (btn, i) {
				btn.addEventListener('click', function () {
					var willOpen = btn.getAttribute('aria-expanded') !== 'true';
					buttons.forEach(function (b) { if (b !== btn) setOpen(b, false); });
					setOpen(btn, willOpen);
					if (willOpen) track('faq_abierto', { pregunta: btn.textContent.trim().slice(0, 100) });
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
		var faqMore = $('[data-ctb-faq-more]');
		if (faqMore) {
			var faqAll = document.getElementById(faqMore.getAttribute('aria-controls'));
			var faqMoreLabel = $('[data-ctb-faq-more-label]', faqMore);
			faqMore.addEventListener('click', function () {
				var open = faqMore.getAttribute('aria-expanded') !== 'true';
				faqMore.setAttribute('aria-expanded', open ? 'true' : 'false');
				faqAll.hidden = !open;
				faqMoreLabel.textContent = open ? 'Ver menos preguntas' : 'Ver todas las preguntas';
				if (open) track('faq_ver_todas');
			});
		}
	});

	/* ================= 12 GLOSARIO (dentro del modal) ================= */
	run('glosario', function () {
		document.addEventListener('input', function (e) {
			if (!e.target.matches('[data-ctb-glossary-search]')) return;
			var scope = e.target.closest('.ctb-detail');
			var q = norm(e.target.value.trim());
			var shown = 0;
			$$('.ctb-gloss__item', scope).forEach(function (li) {
				var ok = !q || norm(li.getAttribute('data-term')).indexOf(q) !== -1;
				li.hidden = !ok;
				if (ok) shown++;
			});
			$('[data-ctb-glossary-empty]', scope).hidden = shown > 0;
		});
	});

	/* ================= 13 CUESTIONARIO ================= */
	var wizardApi = null;
	run('cuestionario', function () {
		var wz = $('[data-ctb-wizard]');
		if (!wz || !data.wizard) return;
		var W = data.wizard;
		var DRAFT = 'ctbLeadDraft';
		var stage = $('[data-ctb-wz-stage]', wz);
		var contact = $('[data-ctb-wz-contact]', wz);
		var summary = $('[data-ctb-wz-summary]', wz);
		var countEl = $('[data-ctb-wz-count]', wz);
		var barEl = $('[data-ctb-wz-bar]', wz);
		var chip = $('[data-ctb-wz-chip]', wz);
		var backBtn = $('[data-ctb-wz-back]', wz);
		var contBtn = $('[data-ctb-wz-continue]', wz);
		var submitBtn = $('[data-ctb-submit]', wz);
		var alertBox = $('[data-ctb-alert]', wz);
		var alertText = $('[data-ctb-alert-text]', wz);
		var success = $('[data-ctb-success]');
		var formCard = $('[data-ctb-formcard]');
		var started = false;

		var S = { problema: '', tipo: '', detalle: '', origen: '', skipQ1: false, step: 'q1' };
		var opt = function (q, id) { return (W[q].options.filter(function (o) { return o.id === id; })[0]) || null; };
		var follow = function () { return S.problema && W.follow[S.problema] ? W.follow[S.problema] : null; };
		var sequence = function () {
			var seq = S.skipQ1 ? [] : ['q1'];
			seq.push('q2');
			if (!S.problema || follow()) seq.push('q3'); // sin respuesta aún: se asume 3 preguntas
			return seq.concat(['contacto', 'resumen']);
		};
		var questionCount = function () { return sequence().length - 2; };

		var startOnce = function (via) {
			if (started) return;
			started = true;
			track('inicio_cuestionario', { origen: S.origen || via || 'directo' });
		};
		var setHidden = function () {
			wz.elements.problema.value = S.problema;
			wz.elements.tipo_cliente.value = S.tipo;
			wz.elements.detalle.value = S.detalle;
			wz.elements.origen.value = S.origen || 'directo';
			wz.elements.pagina.value = window.location.href.split('#')[0];
		};
		var saveDraft = function () {
			var f = {};
			['nombre', 'telefono', 'correo', 'negocio', 'mensaje'].forEach(function (k) { f[k] = wz.elements[k].value; });
			var p = wz.querySelector('input[name="preferencia"]:checked');
			var h = wz.querySelector('input[name="horario"]:checked');
			f.preferencia = p ? p.value : '';
			f.horario = h ? h.value : '';
			store.set(DRAFT, { s: S, f: f });
		};
		var renderChip = function () {
			if (!S.skipQ1 || !S.problema) { chip.hidden = true; return; }
			var o = opt('q1', S.problema);
			chip.innerHTML = '<span>Elegiste: ' + esc(o ? o.label : '') + '</span><button type="button" data-ctb-wz-change>Cambiar</button>';
			chip.hidden = false;
		};
		var setProgress = function () {
			var seq = sequence();
			var idx = seq.indexOf(S.step);
			var n = questionCount();
			if (S.step === 'contacto') countEl.textContent = 'Último paso';
			else if (S.step === 'resumen') countEl.textContent = 'Revisa tu solicitud';
			else countEl.textContent = 'Pregunta ' + (idx + 1) + ' de ' + n;
			barEl.style.width = Math.round(((idx + 1) / (n + 2)) * 100) + '%';
		};

		var renderQuestion = function (step) {
			var q = step === 'q3' ? follow() : W[step];
			var answered = step === 'q1' ? S.problema : step === 'q2' ? S.tipo : S.detalle;
			var html = '<div class="ctb-wz-q"><h3 class="ctb-quiz__title" tabindex="-1">' + esc(q.title) + '</h3>';
			if (q.hint) html += '<p class="ctb-quiz__hint">' + esc(q.hint) + '</p>';
			html += '<div class="ctb-options">';
			q.options.forEach(function (o) {
				var id = typeof o === 'string' ? o : o.id;
				var label = typeof o === 'string' ? o : o.label;
				var hint = typeof o === 'string' ? '' : (o.hint || '');
				var sel = answered === id ? ' ctb-is-selected' : '';
				html += '<button class="ctb-option' + sel + '" type="button" data-opt="' + esc(id) + '" aria-pressed="' + (sel ? 'true' : 'false') + '">' +
					'<span class="ctb-option__text"><span>' + esc(label) + '</span>' + (hint ? '<span class="ctb-option__hint">' + esc(hint) + '</span>' : '') + '</span></button>';
			});
			stage.innerHTML = html + '</div></div>';
			contBtn.hidden = !answered;
		};

		var row = function (k, v) { return v ? '<div><dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd></div>' : ''; };
		var radio = function (n) { var r = wz.querySelector('input[name="' + n + '"]:checked'); return r ? r.value : ''; };
		/* --- Resumen "Esto es lo que entendimos" --- */
		var buildSummary = function () {
			var p = opt('q1', S.problema), t = opt('q2', S.tipo), f = follow();
			var contacto = radio('preferencia') + (radio('horario') && radio('horario') !== 'Me da lo mismo' ? ' · ' + radio('horario').toLowerCase() : '');
			$('[data-ctb-wz-dl]', wz).innerHTML =
				row('Necesitas', p ? p.summary : '') +
				row('Tu situación', t ? t.label : '') +
				row(f ? f.label : 'Detalle', S.detalle) +
				row('Contacto', contacto) +
				row('Nombre', wz.elements.nombre.value.trim()) +
				row('Teléfono', wz.elements.telefono.value.trim()) +
				row('Correo', wz.elements.correo.value.trim()) +
				row('Negocio', wz.elements.negocio.value.trim());
			alertBox.hidden = true;
		};

		var render = function (focus) {
			var seq = sequence();
			if (seq.indexOf(S.step) === -1) S.step = seq[0];
			var isQ = S.step.charAt(0) === 'q';
			stage.hidden = !isQ;
			contact.hidden = S.step !== 'contacto';
			summary.hidden = S.step !== 'resumen';
			if (isQ) renderQuestion(S.step);
			else contBtn.hidden = true;
			if (S.step === 'resumen') buildSummary();
			backBtn.hidden = seq.indexOf(S.step) === 0 || S.step === 'resumen'; // en el resumen basta con "Cambiar respuestas"
			renderChip();
			setProgress();
			setHidden();
			if (focus) {
				var t = isQ ? $('.ctb-quiz__title', stage) : $('.ctb-quiz__title', S.step === 'contacto' ? contact : summary);
				if (t) t.focus({ preventScroll: true });
				var top = formCard.getBoundingClientRect().top;
				if (top < 0 || top > window.innerHeight * 0.7) Motion.scrollTo(formCard);
			}
			saveDraft();
		};
		var go = function (step, focus) {
			// Dirección de la transición: avanzar entra desde la derecha, volver desde la izquierda (máx. 12 px).
			var seq = sequence();
			wz.classList.toggle('ctb-wz--back', seq.indexOf(step) < seq.indexOf(S.step));
			S.step = step;
			render(focus !== false);
			if (step === 'contacto') track('inicio_datos_contacto', { problema: S.problema, tipo_cliente: S.tipo });
		};
		var next = function () {
			var seq = sequence();
			go(seq[seq.indexOf(S.step) + 1]);
		};

		stage.addEventListener('click', function (e) {
			var b = e.target.closest('[data-opt]');
			if (!b) return;
			startOnce('pregunta');
			var v = b.getAttribute('data-opt');
			if (S.step === 'q1') {
				if (S.problema !== v) S.detalle = '';
				S.problema = v;
				track('respuesta_problema', { problema: v });
			} else if (S.step === 'q2') {
				S.tipo = v;
				track('respuesta_tipo_cliente', { tipo_cliente: v });
			} else {
				S.detalle = v;
				track('respuesta_detalle', { problema: S.problema, detalle: v });
			}
			$$('.ctb-option', stage).forEach(function (o) {
				o.classList.toggle('ctb-is-selected', o === b);
				o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
			});
			// Pausa breve para que se vea la opción elegida antes de avanzar.
			setTimeout(next, Motion.ms('fast'));
		});
		contBtn.addEventListener('click', next);
		backBtn.addEventListener('click', function () {
			var seq = sequence();
			var i = seq.indexOf(S.step);
			if (i > 0) go(seq[i - 1]);
		});
		chip.addEventListener('click', function (e) {
			if (!e.target.closest('[data-ctb-wz-change]')) return;
			S.skipQ1 = false;
			go('q1');
		});
		$('[data-ctb-wz-restart]', wz).addEventListener('click', function () { go(sequence()[0]); });

		/* --- Validación con mensajes humanos --- */
		var validPhone = function (v) {
			var raw = String(v).trim();
			var d = raw.replace(/\D/g, '');
			if (/^\+/.test(raw) && !/^\+\s*56/.test(raw)) return d.length >= 8 && d.length <= 15; // número extranjero
			if (d.indexOf('56') === 0 && d.length === 11) d = d.slice(2);
			return d.length === 9; // Chile: 9 dígitos (celular 9 XXXX XXXX o fijo)
		};
		var rules = {
			nombre: function () { return wz.elements.nombre.value.trim().length >= 2 ? '' : 'Necesitamos tu nombre para poder contactarte.'; },
			telefono: function () {
				var v = wz.elements.telefono.value.trim();
				if (!v) return 'Necesitamos un teléfono para contactarte.';
				return validPhone(v) ? '' : 'Revisa tu número. Debería verse así: +56 9 1234 5678.';
			},
			correo: function () {
				var v = wz.elements.correo.value.trim();
				if (!v) return 'Necesitamos tu correo para enviarte la información.';
				return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Revisa tu correo, parece que falta algo.';
			},
			consentimiento: function () { return wz.elements.consentimiento.checked ? '' : 'Necesitamos tu autorización para poder contactarte.'; }
		};
		var setError = function (name, text) {
			var input = wz.elements[name];
			var field = input.closest('.ctb-field');
			var err = document.getElementById('ctb-' + name + '-err');
			if (field) field.classList.toggle('ctb-is-invalid', !!text);
			input.setAttribute('aria-invalid', text ? 'true' : 'false');
			if (err) err.textContent = text || '';
		};
		var validateContact = function () {
			var first = null;
			Object.keys(rules).forEach(function (k) {
				var t = rules[k]();
				setError(k, t);
				if (t && !first) first = k;
			});
			if (first) wz.elements[first].focus();
			return !first;
		};
		Object.keys(rules).forEach(function (k) {
			var el = wz.elements[k];
			el.addEventListener('blur', function () { if (el.value && k !== 'consentimiento') setError(k, rules[k]()); });
			el.addEventListener(k === 'consentimiento' ? 'change' : 'input', function () {
				var f = el.closest('.ctb-field');
				if (f && f.classList.contains('ctb-is-invalid')) setError(k, rules[k]());
			});
		});
		wz.addEventListener('input', saveDraft);
		wz.addEventListener('change', saveDraft);
		$('[data-ctb-wz-review]', wz).addEventListener('click', function () { if (validateContact()) go('resumen'); });

		/* --- Envío --- */
		wz.addEventListener('submit', function (e) {
			e.preventDefault();
			if (S.step !== 'resumen') { if (S.step === 'contacto') $('[data-ctb-wz-review]', wz).click(); return; }
			if (!S.problema || !S.tipo || (follow() && !S.detalle)) { go(sequence()[0]); return; }
			if (!validateContact()) { go('contacto'); validateContact(); return; }
			setHidden();
			// Sin backend configurado: NO se simula el envío.
			if (!config.formEndpoint) {
				alertText.textContent = 'Este formulario aún no está conectado. Configura el envío en config.php (form_mode) para recibir solicitudes.';
				alertBox.hidden = false;
				return;
			}
			// El loader dura exactamente lo que tarda la respuesta (nunca un tiempo fijo).
			submitBtn.classList.add('ctb-is-loading');
			submitBtn.disabled = true;
			wz.setAttribute('aria-busy', 'true');
			var controller = 'AbortController' in window ? new AbortController() : null;
			var timeout = setTimeout(function () { if (controller) controller.abort(); }, 15000);
			fetch(config.formEndpoint, {
				method: 'POST', body: new FormData(wz), headers: { 'Accept': 'application/json' },
				credentials: 'same-origin', signal: controller ? controller.signal : undefined
			})
				.then(function (res) { return res.json().catch(function () { return {}; }).then(function (d) { return { ok: res.ok, data: d }; }); })
				.then(function (r) {
					if (r.ok && r.data.success !== false) {
						var name = wz.elements.nombre.value.trim().split(/\s+/)[0];
						var digits = wz.elements.telefono.value.replace(/\D/g, '');
						$('[data-ctb-success-title]').textContent = name ? 'Recibimos tu solicitud, ' + name + '.' : 'Recibimos tu solicitud';
						$('[data-ctb-success-dl]').innerHTML = row('Preferencia', radio('preferencia')) + row('Número', '•••• ' + digits.slice(-4));
						wz.hidden = true;
						success.hidden = false;
						success.focus();
						store.del(DRAFT);
						track('envio_formulario', { problema: S.problema, tipo_cliente: S.tipo, origen: S.origen || 'directo' });
						track('generate_lead', { problema: S.problema });
						return;
					}
					var fields = r.data.fields || {};
					if (Object.keys(fields).some(function (k) { return rules[k]; })) {
						go('contacto');
						Object.keys(fields).forEach(function (k) { if (rules[k]) setError(k, fields[k]); });
						return;
					}
					alertText.textContent = r.data.message || 'No pudimos enviar tu solicitud. Inténtalo nuevamente en unos minutos.';
					alertBox.hidden = false;
				})
				.catch(function () {
					alertText.textContent = 'Hubo un problema de conexión. Revisa tu internet e inténtalo nuevamente.';
					alertBox.hidden = false;
				})
				.then(function () {
					clearTimeout(timeout);
					submitBtn.classList.remove('ctb-is-loading');
					submitBtn.disabled = false;
					wz.setAttribute('aria-busy', 'false');
				});
		});

		/* --- Contexto: la persona llega desde un botón específico --- */
		wizardApi = {
			start: function (interest, origin) {
				S.origen = origin || interest || S.origen || 'directo';
				if (interest && opt('q1', interest)) {
					if (S.problema !== interest) S.detalle = '';
					S.problema = interest;
					S.skipQ1 = true;
					startOnce('cta');
					track('respuesta_problema', { problema: interest, via: 'cta' });
					go('q2', false);
				} else {
					S.skipQ1 = false;
					if (!S.problema) go('q1', false); else render(false);
				}
			}
		};

		/* --- Restaurar borrador --- */
		var d = store.get(DRAFT);
		if (d && d.s) {
			S = Object.assign(S, d.s);
			if (S.step === 'resumen') S.step = 'contacto'; // el consentimiento se vuelve a marcar
			Object.keys(d.f || {}).forEach(function (k) {
				if (k === 'preferencia' || k === 'horario') {
					var r = d.f[k] && wz.querySelector('input[name="' + k + '"][value="' + d.f[k] + '"]');
					if (r) r.checked = true;
				} else if (wz.elements[k] && d.f[k]) wz.elements[k].value = d.f[k];
			});
			if (d.f && d.f.mensaje) { var tg = $('[aria-controls="ctb-mensaje-wrap"]', wz); if (tg) tg.click(); }
			started = true;
		}
		render(false);
	});

	/* ================= 14 CTA CONTEXTUALES ================= */
	run('cta', function () {
		document.addEventListener('click', function (e) {
			var cta = e.target.closest('[data-ctb-interest]');
			if (!cta) return;
			var interest = cta.getAttribute('data-ctb-interest');
			var origin = cta.getAttribute('data-ctb-origin') || interest;
			if (wizardApi) wizardApi.start(interest, origin);
			if (modal && modal.contains(cta)) {
				e.preventDefault();
				closeModal(function () { Motion.scrollTo(document.getElementById('contacto')); });
			}
		});
	});

	/* ================= 15 CLICS MEDIDOS / AÑO ================= */
	run('medicion', function () {
		document.addEventListener('click', function (e) {
			var t = e.target.closest('[data-ctb-track]');
			if (t) track(t.getAttribute('data-ctb-track'), { id: t.getAttribute('data-ctb-track-id') || '' });
		});
		$$('[data-ctb-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
	});
})();
