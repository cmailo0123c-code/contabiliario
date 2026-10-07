/*!
 * CONTABILIARIO — Landing JS v3 (vanilla, sin dependencias)
 * 01 Utilidades y analítica   06 Modal                 11 FAQ
 * 02 Header                   07 Tabs accesibles       12 Glosario
 * 03 Menú móvil               08 Demo interactiva      13 Cuestionario (corazón de la captación)
 * 04 Navegación activa        09 Reportes              14 CTA contextuales
 * 05 Revelado / parallax      10 Abridores de modal    15 Clics medidos / año
 */
(function () {
	'use strict';

	/* ================= 01 UTILIDADES Y ANALÍTICA ================= */
	var root = document.documentElement;
	var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var config = window.ctbConfig || {};
	var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
	var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
	var hasIO = 'IntersectionObserver' in window;
	var data = {};
	try { data = JSON.parse(($('#ctb-data') || {}).textContent || '{}'); } catch (e) { data = {}; }

	root.classList.add('ctb-js');
	window.ctbLoaded = true;

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
	var animateIn = function (el, cls) {
		cls = cls || 'is-entering';
		if (reduceMotion || !el) return;
		el.classList.remove(cls);
		void el.offsetWidth;
		el.classList.add(cls);
	};
	var scrollToEl = function (el) {
		if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
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

	/* ================= 02 HEADER ================= */
	var header = $('[data-ctb-header]');
	if (header) {
		var hTick = false;
		var updateHeader = function () { header.classList.toggle('is-scrolled', window.scrollY > 12); hTick = false; };
		window.addEventListener('scroll', function () {
			if (!hTick) { window.requestAnimationFrame(updateHeader); hTick = true; }
		}, { passive: true });
		updateHeader();
	}

	/* ================= 03 MENÚ MÓVIL ================= */
	var burger = $('[data-ctb-burger]');
	var mobile = $('[data-ctb-mobile]');
	var closeTimer;
	function openMenu() {
		clearTimeout(closeTimer);
		mobile.hidden = false;
		burger.setAttribute('aria-expanded', 'true');
		burger.setAttribute('aria-label', 'Cerrar menú');
		header.classList.add('is-menu-open');
		window.requestAnimationFrame(function () { window.requestAnimationFrame(function () { mobile.classList.add('is-open'); }); });
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
		window.matchMedia('(min-width: 1120px)').addEventListener('change', function (mq) {
			if (mq.matches && burger.getAttribute('aria-expanded') === 'true') closeMenu(false);
		});
	}

	/* ================= 04 NAVEGACIÓN ACTIVA ================= */
	var navLinks = $$('[data-ctb-nav]');
	if (hasIO && navLinks.length) {
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
		navLinks.map(function (a) { return a.getAttribute('data-ctb-nav'); })
			.filter(function (v, i, arr) { return arr.indexOf(v) === i; })
			.forEach(function (id) { var s = document.getElementById(id); if (s) navIO.observe(s); });
	}

	/* ================= 05 REVELADO AL SCROLL + PARALLAX ================= */
	$$('[data-ctb-stagger]').forEach(function (group) {
		$$('.ctb-reveal', group).forEach(function (el, i) {
			if (!el.style.getPropertyValue('--ctb-delay')) el.style.setProperty('--ctb-delay', Math.min(i * 70, 420) + 'ms');
		});
	});
	var finishReveal = function (el) {
		if (!el.matches('.ctb-card, .ctb-tcard, .ctb-help__item')) return;
		var delay = parseInt(el.style.getPropertyValue('--ctb-delay'), 10) || 0;
		setTimeout(function () { el.classList.remove('ctb-reveal', 'ctb-reveal--scale', 'is-in'); }, reduceMotion ? 0 : delay + 750);
	};
	var reveals = $$('.ctb-reveal');
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
	$$('[data-ctb-steps]').forEach(function (el) {
		if (!hasIO || reduceMotion) { el.classList.add('is-in'); return; }
		var io = new IntersectionObserver(function (entries) {
			if (entries[0].isIntersecting) { el.classList.add('is-in'); io.disconnect(); }
		}, { threshold: 0.3 });
		io.observe(el);
	});

	/* Cómo funciona: resalta solo el paso activo según el scroll */
	$$('[data-ctb-steps]').forEach(function (wrap) {
		var steps = $$('.ctb-step', wrap);
		if (!steps.length) return;
		var current = -1, ticking = false;
		function update() {
			ticking = false;
			var vh = window.innerHeight, idx;
			var stacked = steps.length > 1 && steps[1].offsetTop > steps[0].offsetTop + 10;
			if (stacked) {
				var best = Infinity;
				steps.forEach(function (st, i) {
					var r = st.getBoundingClientRect();
					var d = Math.abs(r.top + r.height / 2 - vh * 0.5);
					if (d < best) { best = d; idx = i; }
				});
			} else {
				var r = wrap.getBoundingClientRect();
				var p = (vh * 0.8 - r.top) / (r.height + vh * 0.4);
				idx = Math.max(0, Math.min(steps.length - 1, Math.floor(p * steps.length)));
			}
			if (idx !== current) {
				current = idx;
				steps.forEach(function (st, i) { st.classList.toggle('is-current', i === idx); });
			}
		}
		window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
		window.addEventListener('resize', update);
		update();
	});

	/* Situaciones: marca la tarjeta elegida */
	document.addEventListener('click', function (e) {
		var sit = e.target.closest && e.target.closest('.ctb-sit:not(.ctb-sit--featured)');
		if (!sit) return;
		$$('.ctb-sit.is-selected').forEach(function (s) { if (s !== sit) s.classList.remove('is-selected'); });
		sit.classList.add('is-selected');
	});

	var parallax = $$('[data-ctb-parallax]');
	if (parallax.length && !reduceMotion) {
		var pTick = false;
		var hero = $('.ctb-hero');
		window.addEventListener('scroll', function () {
			if (pTick) return;
			pTick = true;
			window.requestAnimationFrame(function () {
				var y = window.scrollY;
				if (!hero || y < hero.offsetHeight) {
					parallax.forEach(function (el) {
						el.style.transform = 'translate3d(0,' + (y * (parseFloat(el.getAttribute('data-ctb-parallax')) || 0)).toFixed(1) + 'px,0)';
					});
				}
				pTick = false;
			});
		}, { passive: true });
	}

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
		modal.classList.remove('is-closing');
		if (!modal.open) {
			if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
		}
		$('.ctb-modal__box', modal).scrollTop = 0;
		root.classList.add('ctb-modal-open');
		var close = $('[data-ctb-modal-close]', modal);
		if (close) close.focus();
	}
	function closeModal(cb) {
		if (!modal || !modal.open) { if (cb) cb(); return; }
		afterClose = cb || null;
		modal.classList.add('is-closing');
		setTimeout(function () {
			if (typeof modal.close === 'function') modal.close(); else { modal.removeAttribute('open'); onModalClosed(); }
		}, reduceMotion ? 0 : 180);
	}
	function onModalClosed() {
		modal.classList.remove('is-closing');
		root.classList.remove('ctb-modal-open');
		var cb = afterClose; afterClose = null;
		if (cb) cb();
		else if (lastTrigger && document.body.contains(lastTrigger)) lastTrigger.focus();
	}
	if (modal) {
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
	}

	/* ================= 07 TABS ACCESIBLES (role="tab") ================= */
	function setupTabs(list, onChange) {
		var tabs = $$('[role="tab"]', list);
		var activate = function (tab, focus) {
			tabs.forEach(function (t) {
				var on = t === tab;
				t.setAttribute('aria-selected', on ? 'true' : 'false');
				t.setAttribute('tabindex', on ? '0' : '-1');
				t.classList.toggle('is-active', on);
				var panel = document.getElementById(t.getAttribute('aria-controls'));
				if (panel) {
					panel.hidden = !on;
					panel.classList.toggle('is-active', on);
					if (on) animateIn(panel);
				}
			});
			if (focus) tab.focus();
			if (list.scrollWidth > list.clientWidth) tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
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

	/* ================= 08 DEMO INTERACTIVA ================= */
	var demoTabs = $('[data-ctb-tabs]');
	var reportRendered = false;
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
					b.classList.toggle('is-active', b === btn);
				});
				var shown = 0;
				rows.forEach(function (r) {
					var ok = f === 'all' || r.getAttribute('data-status') === f;
					r.hidden = !ok;
					if (ok) { shown++; animateIn(r, 'is-shown'); }
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

	/* ================= 09 REPORTES ================= */
	var reportChart = $('[data-ctb-report-chart]');
	var reportData = null;
	var kpiState = { ingresos: 0, gastos: 0, resultado: 0 };
	if (reportChart) { try { reportData = JSON.parse(reportChart.getAttribute('data-report')); } catch (e) { reportData = null; } }
	function countTo(el, from, to) {
		if (reduceMotion) { el.textContent = clp(to); return; }
		var start = null;
		var step = function (t) {
			if (!start) start = t;
			var p = Math.min((t - start) / 500, 1);
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
		var cats = $('[data-ctb-cats]');
		if (cats && !reduceMotion) { cats.classList.remove('is-anim'); void cats.offsetWidth; cats.classList.add('is-anim'); }
	}
	var range = $('[data-ctb-range]');
	if (range) {
		$$('.ctb-seg__btn', range).forEach(function (btn) {
			btn.addEventListener('click', function () {
				$$('.ctb-seg__btn', range).forEach(function (b) {
					b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
					b.classList.toggle('is-active', b === btn);
				});
				renderReport(parseInt(btn.getAttribute('data-range'), 10));
				reportRendered = true;
				track('dashboard_interaccion', { accion: 'periodo', meses: btn.getAttribute('data-range') });
			});
		});
	}

	/* ================= 10 ABRIDORES DE MODAL ================= */
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

	/* ================= 11 FAQ ================= */
	var faqTabs = $('[data-ctb-faq-tabs]');
	if (faqTabs) setupTabs(faqTabs);
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

	/* ================= 12 GLOSARIO (dentro del modal) ================= */
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

	/* ================= 13 CUESTIONARIO ================= */
	var wz = $('[data-ctb-wizard]');
	var wizardApi = null;
	if (wz && data.wizard) {
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
				var sel = answered === id ? ' is-selected' : '';
				html += '<button class="ctb-option' + sel + '" type="button" data-opt="' + esc(id) + '" aria-pressed="' + (sel ? 'true' : 'false') + '">' +
					'<span class="ctb-option__text"><span>' + esc(label) + '</span>' + (hint ? '<span class="ctb-option__hint">' + esc(hint) + '</span>' : '') + '</span></button>';
			});
			stage.innerHTML = html + '</div></div>';
			contBtn.hidden = !answered;
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
				if (top < 0 || top > window.innerHeight * 0.7) scrollToEl(formCard);
			}
			saveDraft();
		};
		var go = function (step, focus) {
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
				o.classList.toggle('is-selected', o === b);
				o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
			});
			setTimeout(next, reduceMotion ? 0 : 160);
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
			if (field) field.classList.toggle('is-invalid', !!text);
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
				if (f && f.classList.contains('is-invalid')) setError(k, rules[k]());
			});
		});
		wz.addEventListener('input', saveDraft);
		wz.addEventListener('change', saveDraft);
		$('[data-ctb-wz-review]', wz).addEventListener('click', function () { if (validateContact()) go('resumen'); });

		/* --- Resumen "Esto es lo que entendimos" --- */
		var row = function (k, v) { return v ? '<div><dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd></div>' : ''; };
		var radio = function (n) { var r = wz.querySelector('input[name="' + n + '"]:checked'); return r ? r.value : ''; };
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
			submitBtn.classList.add('is-loading');
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
					submitBtn.classList.remove('is-loading');
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
	}

	/* ================= 14 CTA CONTEXTUALES ================= */
	document.addEventListener('click', function (e) {
		var cta = e.target.closest('[data-ctb-interest]');
		if (!cta) return;
		var interest = cta.getAttribute('data-ctb-interest');
		var origin = cta.getAttribute('data-ctb-origin') || interest;
		if (wizardApi) wizardApi.start(interest, origin);
		if (modal && modal.contains(cta)) {
			e.preventDefault();
			closeModal(function () { scrollToEl(document.getElementById('contacto')); });
		}
	});

	/* ================= 15 CLICS MEDIDOS / AÑO ================= */
	document.addEventListener('click', function (e) {
		var t = e.target.closest('[data-ctb-track]');
		if (t) track(t.getAttribute('data-ctb-track'), { id: t.getAttribute('data-ctb-track-id') || '' });
	});
	$$('[data-ctb-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
