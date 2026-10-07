/*!
 * CONTABILIARIO — Landing JS v2 (vanilla, sin dependencias)
 * 01 Utilidades y analítica   08 Problemas reales      15 Glosario
 * 02 Header                   09 Servicios (modal)     16 CTA contextuales
 * 03 Menú móvil               10 Tabs accesibles       17 Formulario en 3 pasos
 * 04 Navegación activa        11 Demo interactiva      18 Contadores / año
 * 05 Revelado al scroll       12 Reportes
 * 06 Parallax                 13 Selector de servicio
 * 07 Modal                    14 FAQ por categorías
 */
(function () {
	'use strict';

	/* ================= 01 UTILIDADES ================= */
	var root = document.documentElement;
	var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var config = window.ctbConfig || {};
	var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
	var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
	var hasIO = 'IntersectionObserver' in window;
	var mqDesktop = window.matchMedia('(min-width: 1024px)');
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
		void el.offsetWidth; // reinicia la animación
		el.classList.add(cls);
	};
	var scrollToEl = function (el) {
		if (!el) return;
		el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
	};

	/* Analítica: envía eventos solo si GA4 / GTM / Meta Pixel existen. */
	function track(event, params) {
		params = params || {};
		try {
			if (typeof window.gtag === 'function') window.gtag('event', event, params);
			else if (Array.isArray(window.dataLayer)) window.dataLayer.push(Object.assign({ event: event }, params));
			if (typeof window.fbq === 'function' && event === 'generate_lead') window.fbq('track', 'Lead');
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
		var navIds = navLinks.map(function (a) { return a.getAttribute('data-ctb-nav'); })
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
		navIds.forEach(function (id) { var s = document.getElementById(id); if (s) navIO.observe(s); });
	}

	/* ================= 05 REVELADO AL SCROLL ================= */
	$$('[data-ctb-stagger]').forEach(function (group) {
		$$('.ctb-reveal', group).forEach(function (el, i) {
			if (!el.style.getPropertyValue('--ctb-delay')) el.style.setProperty('--ctb-delay', Math.min(i * 70, 560) + 'ms');
		});
	});
	var finishReveal = function (el) {
		// Las tarjetas recuperan su transición de hover propia después de aparecer.
		if (!el.matches('.ctb-card, .ctb-aud, .ctb-story, .ctb-term')) return;
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

	/* ================= 06 PARALLAX SUTIL ================= */
	var parallax = $$('[data-ctb-parallax]');
	if (parallax.length && !reduceMotion) {
		var pTick = false;
		var hero = $('.ctb-hero');
		var runParallax = function () {
			var y = window.scrollY;
			if (!hero || y < hero.offsetHeight) {
				parallax.forEach(function (el) {
					var f = parseFloat(el.getAttribute('data-ctb-parallax')) || 0;
					el.style.transform = 'translate3d(0,' + (y * f).toFixed(1) + 'px,0)';
				});
			}
			pTick = false;
		};
		window.addEventListener('scroll', function () {
			if (!pTick) { window.requestAnimationFrame(runParallax); pTick = true; }
		}, { passive: true });
	}

	/* ================= 07 MODAL (dialog nativo + trampa de foco) ================= */
	var modal = $('[data-ctb-modal]');
	var modalBody = $('[data-ctb-modal-body]');
	var lastTrigger = null;
	var afterClose = null;

	function fillFromTemplate(target, tplId, stripIds) {
		var tpl = document.getElementById(tplId);
		if (!tpl || !target) return false;
		target.innerHTML = '';
		var frag = tpl.content.cloneNode(true);
		if (stripIds) $$('[id]', frag).forEach(function (n) { n.removeAttribute('id'); });
		target.appendChild(frag);
		return true;
	}
	function openModal(tplId, trigger) {
		if (!modal || !fillFromTemplate(modalBody, tplId, false)) return;
		if (trigger) lastTrigger = trigger;
		modal.classList.remove('is-closing');
		if (!modal.open) {
			if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
		}
		modalBody.scrollTop = 0;
		$('.ctb-modal__box', modal).scrollTop = 0;
		root.classList.add('ctb-modal-open');
		var close = $('[data-ctb-modal-close]', modal);
		if (close) close.focus();
		track('modal_open', { id: tplId });
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
		modal.addEventListener('cancel', function (e) { e.preventDefault(); closeModal(); }); // Escape
		modal.addEventListener('click', function (e) {
			if (e.target === modal) closeModal(); // clic en el fondo
			if (e.target.closest('[data-ctb-modal-close]')) closeModal();
		});
		modal.addEventListener('keydown', function (e) {
			if (e.key !== 'Tab') return;
			var f = $$('a[href], button:not([disabled]), summary, input, select, textarea, [tabindex]:not([tabindex="-1"])', modal)
				.filter(function (n) { return n.offsetParent !== null; });
			if (!f.length) return;
			var first = f[0], last = f[f.length - 1];
			if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
			else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
		});
	}

	/* ================= 08 PROBLEMAS REALES ================= */
	var problemBtns = $$('[data-ctb-problem]');
	var problemDetail = $('[data-ctb-problem-detail]');
	function showProblemDetail(btn) {
		problemBtns.forEach(function (b) {
			var on = b === btn;
			b.setAttribute('aria-pressed', on ? 'true' : 'false');
			b.classList.toggle('is-active', on);
		});
		fillFromTemplate(problemDetail, 'ctb-tpl-problem-' + btn.getAttribute('data-ctb-problem'), true);
	}
	if (problemBtns.length) {
		var syncProblems = function () {
			if (mqDesktop.matches) {
				var active = problemBtns.filter(function (b) { return b.classList.contains('is-active'); })[0] || problemBtns[0];
				showProblemDetail(active);
			} else {
				problemBtns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-haspopup', 'dialog'); });
			}
			problemBtns.forEach(function (b) { if (mqDesktop.matches) b.removeAttribute('aria-haspopup'); });
		};
		problemBtns.forEach(function (btn) {
			btn.addEventListener('click', function () {
				track('problem_select', { id: btn.getAttribute('data-ctb-problem') });
				if (mqDesktop.matches) showProblemDetail(btn);
				else openModal('ctb-tpl-problem-' + btn.getAttribute('data-ctb-problem'), btn);
			});
		});
		mqDesktop.addEventListener('change', syncProblems);
		syncProblems();
	}

	/* ================= 09 SERVICIOS ================= */
	document.addEventListener('click', function (e) {
		var opener = e.target.closest('[data-ctb-open-service]');
		if (opener) {
			e.preventDefault();
			openModal('ctb-tpl-service-' + opener.getAttribute('data-ctb-open-service'), modal && modal.contains(opener) ? lastTrigger : opener);
			return;
		}
		// Toda la tarjeta de servicio es clickeable (el botón sigue siendo el control accesible).
		var card = e.target.closest('[data-ctb-card-click]');
		if (card && !e.target.closest('a, button')) {
			var btn = $('[data-ctb-open-service]', card);
			if (btn) btn.click();
		}
	});

	/* ================= 10 TABS ACCESIBLES (role="tab") ================= */
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
			if (tab.scrollIntoView && list.scrollWidth > list.clientWidth) {
				tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
			}
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
		return { activate: activate, tabs: tabs };
	}

	/* ================= 11 DEMO INTERACTIVA ================= */
	var demoTabs = $('[data-ctb-tabs]');
	var reportRendered = false;
	if (demoTabs) {
		var demo = setupTabs(demoTabs, function (tab) {
			var id = tab.id.replace('ctb-tab-', '');
			track('demo_tab', { tab: id });
			if (id === 'reportes' && !reportRendered) { renderReport(6); reportRendered = true; }
		});
		$$('[data-ctb-goto-tab]').forEach(function (b) {
			b.addEventListener('click', function () {
				var t = document.getElementById('ctb-tab-' + b.getAttribute('data-ctb-goto-tab'));
				if (t) demo.activate(t, true);
			});
		});
	}

	// Documentos: filtros por estado
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
			});
		});
	}

	// Botones "Explícamelo en simple" (aria-expanded)
	$$('[data-ctb-toggle]').forEach(function (btn) {
		var target = document.getElementById(btn.getAttribute('aria-controls'));
		btn.addEventListener('click', function () {
			var open = btn.getAttribute('aria-expanded') !== 'true';
			btn.setAttribute('aria-expanded', open ? 'true' : 'false');
			if (target) target.hidden = !open;
		});
	});

	/* ================= 12 REPORTES ================= */
	var reportChart = $('[data-ctb-report-chart]');
	var reportData = null;
	var kpiState = { ingresos: 0, gastos: 0, resultado: 0 };
	if (reportChart) {
		try { reportData = JSON.parse(reportChart.getAttribute('data-report')); } catch (e) { reportData = null; }
	}
	function countTo(el, from, to) {
		if (reduceMotion) { el.textContent = clp(to); return; }
		var start = null;
		var step = function (t) {
			if (!start) start = t;
			var p = Math.min((t - start) / 600, 1);
			var e = 1 - Math.pow(1 - p, 3);
			el.textContent = clp(from + (to - from) * e);
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
		if (bestEl) bestEl.textContent = 'Mejor mes del período: ' + L[best] + ' (resultado de ' + clp(I[best] - G[best]) + '). Pasa el cursor o toca una barra para ver el detalle.';
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
				track('report_range', { months: btn.getAttribute('data-range') });
			});
		});
	}

	/* ================= 13 SELECTOR DE SERVICIO ================= */
	var quizEl = $('[data-ctb-quiz]');
	var quizState = { answers: {}, labels: {}, history: [] };
	if (quizEl && data.quiz) {
		var stage = $('[data-ctb-quiz-stage]', quizEl);
		var countEl = $('[data-ctb-quiz-count]', quizEl);
		var barEl = $('[data-ctb-quiz-bar]', quizEl);
		var backBtn = $('[data-ctb-quiz-back]', quizEl);
		var order = function (key) { return key === 'q1' ? 1 : key === 'q3' ? 3 : 2; };

		var renderQuestion = function (key, focus) {
			var q = data.quiz[key];
			quizState.current = key;
			var n = order(key);
			countEl.textContent = 'Pregunta ' + n + ' de 3';
			barEl.style.width = (n / 3 * 100) + '%';
			backBtn.hidden = quizState.history.length === 0;
			var html = '<div class="ctb-quiz__q"><h3 class="ctb-quiz__title" tabindex="-1">' + esc(q.title) + '</h3>';
			if (q.hint) html += '<p class="ctb-quiz__hint">' + esc(q.hint) + '</p>';
			html += '<div class="ctb-options">';
			q.options.forEach(function (o) {
				var sel = quizState.answers[key] === o.id ? ' is-selected' : '';
				html += '<button class="ctb-option' + sel + '" type="button" data-opt="' + esc(o.id) + '">' + esc(o.label) + '</button>';
			});
			stage.innerHTML = html + '</div></div>';
			if (focus) { var t = $('.ctb-quiz__title', stage); if (t) t.focus({ preventScroll: true }); }
		};

		var computeResult = function () {
			var scores = {};
			['q1', 'q2', 'q2_problemas', 'q3'].forEach(function (k) {
				var a = quizState.answers[k];
				if (!a || !data.quiz[k]) return;
				data.quiz[k].options.forEach(function (o) {
					if (o.id !== a) return;
					Object.keys(o.scores || {}).forEach(function (s) { scores[s] = (scores[s] || 0) + o.scores[s]; });
				});
			});
			var ranked = Object.keys(scores).sort(function (a, b) { return scores[b] - scores[a]; });
			var recs = ranked.slice(0, 1);
			if (ranked[1] && scores[ranked[1]] >= 2 && scores[ranked[1]] >= scores[ranked[0]] * 0.6) recs.push(ranked[1]);
			return recs.filter(function (id) { return data.services[id]; });
		};

		var renderResult = function () {
			var recs = computeResult();
			quizState.recs = recs;
			countEl.textContent = 'Tu orientación';
			barEl.style.width = '100%';
			backBtn.hidden = false;
			var told = Object.keys(quizState.labels).map(function (k) { return quizState.labels[k]; });
			quizState.summary = 'Selector: ' + told.join(' · ') + ' → Recomendación: ' + recs.map(function (id) { return data.services[id].title; }).join(' + ');
			var html = '<div class="ctb-quiz__q"><p class="ctb-result__label">Según tus respuestas</p>' +
				'<h3 class="ctb-quiz__title" tabindex="-1">Probablemente necesitas:</h3>' +
				'<div class="ctb-recs' + (recs.length > 1 ? ' ctb-recs--2' : '') + '">';
			recs.forEach(function (id, i) {
				var s = data.services[id];
				if (i > 0) html += '<span class="ctb-recs__plus" aria-hidden="true">+</span>';
				html += '<div class="ctb-rec"><p class="ctb-rec__title">' + esc(s.title) + '</p><p class="ctb-rec__why">' + esc(s.why) + '</p>' +
					'<button class="ctb-link ctb-link--btn" type="button" data-ctb-open-service="' + esc(id) + '">Ver qué incluye</button></div>';
			});
			html += '</div><p class="ctb-result__told">Nos contaste: <strong>' + told.map(esc).join('</strong> · <strong>') + '</strong></p>' +
				'<p class="ctb-result__disclaimer"><svg class="ctb-icon ctb-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/></svg>' +
				'<span>Esta recomendación es orientativa. Podemos revisar tu situación sin compromiso.</span></p>' +
				'<div class="ctb-result__actions"><a class="ctb-btn ctb-btn--primary" href="#contacto" data-ctb-interest="quiz">Hablar con un contador</a>' +
				'<button class="ctb-btn ctb-btn--ghost" type="button" data-ctb-quiz-restart>Volver a empezar</button></div></div>';
			stage.innerHTML = html;
			var t = $('.ctb-quiz__title', stage); if (t) t.focus({ preventScroll: true });
			track('quiz_complete', { recommendation: recs.join('+') });
		};

		stage.addEventListener('click', function (e) {
			var opt = e.target.closest('[data-opt]');
			if (opt) {
				var key = quizState.current;
				var q = data.quiz[key];
				var o = q.options.filter(function (x) { return x.id === opt.getAttribute('data-opt'); })[0];
				quizState.answers[key] = o.id;
				quizState.labels[key === 'q2_problemas' ? 'q2' : key] = o.label;
				if (key === 'q1') { delete quizState.answers.q2; delete quizState.answers.q2_problemas; }
				$$('.ctb-option', stage).forEach(function (b) { b.classList.toggle('is-selected', b === opt); });
				quizState.history.push(key);
				var next = key === 'q1' ? (o.next || 'q2') : (key === 'q3' ? 'result' : 'q3');
				setTimeout(function () { next === 'result' ? renderResult() : renderQuestion(next, true); }, reduceMotion ? 0 : 200);
				return;
			}
			if (e.target.closest('[data-ctb-quiz-restart]')) {
				quizState = { answers: {}, labels: {}, history: [] };
				renderQuestion('q1', true);
			}
		});
		backBtn.addEventListener('click', function () {
			var prev = quizState.history.pop();
			if (prev) renderQuestion(prev, true);
		});
		renderQuestion('q1', false);
	}

	/* ================= 14 FAQ ================= */
	var faqTabs = $('[data-ctb-faq-tabs]');
	if (faqTabs) setupTabs(faqTabs, function (tab) { track('faq_category', { id: tab.id.replace('ctb-faqtab-', '') }); });
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

	/* ================= 15 GLOSARIO ================= */
	var terms = $('[data-ctb-glossary]');
	if (terms) {
		var moreBtn = $('[data-ctb-glossary-more]');
		var moreLabel = $('[data-ctb-more-label]');
		var search = $('[data-ctb-glossary-search]');
		var gEmpty = $('[data-ctb-glossary-empty]');
		var termEls = $$('.ctb-term', terms);
		moreBtn.addEventListener('click', function () {
			var open = moreBtn.getAttribute('aria-expanded') !== 'true';
			moreBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
			terms.classList.toggle('is-expanded', open);
			moreLabel.textContent = open ? 'Ver menos conceptos' : 'Ver más conceptos';
			if (open) {
				var firstExtra = $('.ctb-term--extra', terms);
				if (firstExtra) { firstExtra.setAttribute('tabindex', '-1'); firstExtra.focus({ preventScroll: true }); }
			}
			track('glossary_more', { open: open });
		});
		search.addEventListener('input', function () {
			var q = norm(search.value.trim());
			terms.classList.toggle('is-searching', !!q);
			var shown = 0;
			termEls.forEach(function (t) {
				var ok = !q || norm(t.getAttribute('data-term')).indexOf(q) !== -1;
				t.hidden = !ok;
				if (ok) shown++;
			});
			gEmpty.hidden = shown > 0;
			moreBtn.hidden = !!q;
		});
	}

	/* ================= 16-17 CTA CONTEXTUALES + FORMULARIO EN PASOS ================= */
	var form = $('[data-ctb-form]');
	var formApi = null;

	if (form) {
		var DRAFT = 'ctbFormDraft';
		var current = 1;
		var stepNames = { 1: '¿Cómo podemos ayudarte?', 2: 'Cuéntanos brevemente sobre tu negocio', 3: 'Tus datos de contacto' };
		var stepEls = $$('[data-ctb-fstep]', form);
		var prevBtn = $('[data-ctb-prev]', form);
		var nextBtn = $('[data-ctb-next]', form);
		var submitBtn = $('[data-ctb-submit]', form);
		var stepCount = $('[data-ctb-step-count]', form);
		var stepName = $('[data-ctb-step-name]', form);
		var formBar = $('[data-ctb-form-bar]', form);
		var follow = $('[data-ctb-follow]', form);
		var followQ = $('[data-ctb-follow-q]', form);
		var followOpts = $('[data-ctb-follow-options]', form);
		var msg = form.elements.mensaje;
		var msgLabel = $('[data-ctb-msg-label]', form);
		var interestField = $('[data-ctb-interest-field]', form);
		var contextField = $('[data-ctb-context-field]', form);
		var formTitle = $('[data-ctb-form-title]');
		var defaultTitle = formTitle ? formTitle.textContent : '';
		var alertBox = $('[data-ctb-alert]', form);
		var alertText = $('[data-ctb-alert-text]', form);
		var success = $('[data-ctb-success]');
		var successText = $('[data-ctb-success-text]');
		var formCard = form.closest('.ctb-formcard');

		var radioVal = function (name) {
			var r = form.querySelector('input[name="' + name + '"]:checked');
			return r ? r.value : '';
		};
		var setError = function (name, text) {
			var err = document.getElementById('ctb-' + name + '-err');
			var input = form.elements[name];
			var group = $('[data-ctb-field="' + name + '"]', form);
			var field = group || (input && input.closest ? input.closest('.ctb-field') : null);
			if (field) field.classList.toggle('is-invalid', !!text);
			if (input && input.setAttribute) input.setAttribute('aria-invalid', text ? 'true' : 'false');
			if (err) err.textContent = text || '';
		};
		var showAlert = function (t) { alertText.textContent = t; alertBox.hidden = false; };
		var hideAlert = function () { alertBox.hidden = true; alertText.textContent = ''; };

		var rules = {
			ayuda: function () { return radioVal('ayuda') ? '' : 'Elige una opción para continuar.'; },
			detalle: function () { return follow.hidden || radioVal('detalle') ? '' : 'Elige una respuesta.'; },
			situacion: function () { return radioVal('situacion') ? '' : 'Elige la opción que más se parezca.'; },
			rubro: function () { return form.elements.rubro.value.trim().length >= 2 ? '' : 'Cuéntanos en pocas palabras a qué se dedica.'; },
			mensaje: function () { return msg.value.length <= 3000 ? '' : 'El mensaje es demasiado largo.'; },
			nombre: function () { return form.elements.nombre.value.trim().length >= 2 ? '' : 'Ingresa tu nombre.'; },
			correo: function () { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.elements.correo.value.trim()) ? '' : 'Ingresa un correo válido (ej: nombre@empresa.cl).'; },
			telefono: function () { var v = form.elements.telefono.value.trim(); return !v || /^[0-9+()\s-]{8,20}$/.test(v) ? '' : 'Ingresa un teléfono válido (ej: +56 9 1234 5678).'; },
			empresa: function () { return form.elements.empresa.value.length <= 120 ? '' : 'El nombre es demasiado largo.'; }
		};
		var stepFields = { 1: ['ayuda', 'detalle'], 2: ['situacion', 'rubro', 'mensaje'], 3: ['nombre', 'correo', 'telefono', 'empresa'] };
		var focusTarget = function (name) {
			var el = form.elements[name];
			if (el && el.length && !el.tagName) el = el[0];
			return el && el.focus ? el : null;
		};
		var validateStep = function (n) {
			var first = null;
			stepFields[n].forEach(function (name) {
				var t = rules[name]();
				setError(name, t);
				if (t && !first) first = name;
			});
			if (first) { var f = focusTarget(first); if (f) f.focus(); }
			return !first;
		};

		var renderFollow = function (helpId, keepValue) {
			var h = data.help && data.help[helpId];
			var prev = keepValue ? radioVal('detalle') : '';
			if (!h || !h.follow) { follow.hidden = true; followOpts.innerHTML = ''; setError('detalle', ''); return; }
			followQ.textContent = h.follow.q;
			followOpts.innerHTML = h.follow.options.map(function (o) {
				return '<label class="ctb-choice ctb-choice--sm"><input type="radio" name="detalle" value="' + esc(o) + '"' + (o === prev ? ' checked' : '') + ' aria-describedby="ctb-detalle-err"><span>' + esc(o) + '</span></label>';
			}).join('');
			follow.hidden = false;
		};
		var applyHelpCopy = function (helpId) {
			if (interestField.value) return; // el CTA contextual manda
			var match = null;
			Object.keys(data.interests || {}).some(function (k) {
				if (data.interests[k].help === helpId) { match = data.interests[k]; return true; }
				return false;
			});
			if (match) msg.placeholder = match.placeholder;
		};

		var goTo = function (n, focus) {
			current = n;
			stepEls.forEach(function (s) {
				var on = parseInt(s.getAttribute('data-ctb-fstep'), 10) === n;
				s.classList.toggle('is-current', on);
				if (on) animateIn(s);
			});
			stepCount.textContent = n + ' de 3';
			stepName.textContent = stepNames[n];
			formBar.style.width = (n / 3 * 100) + '%';
			prevBtn.hidden = n === 1;
			nextBtn.hidden = n === 3;
			submitBtn.hidden = n !== 3;
			hideAlert();
			saveDraft();
			if (focus) {
				var legend = $('[data-ctb-fstep="' + n + '"] .ctb-fstep__title', form);
				var firstInput = $('[data-ctb-fstep="' + n + '"] input:not([type=hidden]), [data-ctb-fstep="' + n + '"] textarea', form);
				if (firstInput) firstInput.focus({ preventScroll: true });
				var top = formCard.getBoundingClientRect().top;
				if (top < 0 || top > window.innerHeight * 0.6) scrollToEl(formCard);
				if (legend) legend.setAttribute('aria-live', 'polite');
			}
			track('form_step', { step: n });
		};

		var saveDraft = function () {
			var d = { step: current, f: {} };
			['ayuda', 'detalle', 'situacion', 'rubro', 'mensaje', 'nombre', 'correo', 'telefono', 'empresa', 'interes', 'contexto'].forEach(function (k) {
				var el = form.elements[k];
				if (!el) return;
				d.f[k] = (el.length && !el.tagName) || (el.type === 'radio') ? radioVal(k) : el.value;
			});
			store.set(DRAFT, d);
		};
		var restoreDraft = function () {
			var d = store.get(DRAFT);
			if (!d || !d.f) return;
			Object.keys(d.f).forEach(function (k) {
				var v = d.f[k];
				if (!v) return;
				var radio = form.querySelector('input[type=radio][name="' + k + '"][value="' + (window.CSS && CSS.escape ? CSS.escape(v) : v) + '"]');
				if (radio) { radio.checked = true; return; }
				if (form.elements[k] && form.elements[k].tagName) form.elements[k].value = v;
			});
			if (d.f.ayuda) { renderFollow(d.f.ayuda, false); if (d.f.detalle) { var r = form.querySelector('input[name="detalle"][value="' + (window.CSS && CSS.escape ? CSS.escape(d.f.detalle) : d.f.detalle) + '"]'); if (r) r.checked = true; } }
			if (d.f.interes) applyInterestCopy(d.f.interes);
			if (d.step && d.step > 1) goTo(Math.min(d.step, 3), false);
		};

		/* CTA contextuales: guardan qué se presionó y adaptan el formulario */
		var applyInterestCopy = function (key) {
			var info = data.interests && data.interests[key];
			if (key === 'quiz' && quizState.recs && quizState.recs.length) {
				var top = data.services[quizState.recs[0]];
				info = { help: top ? top.help : 'nosure', title: 'Revisemos lo que nos contaste.', placeholder: 'Si quieres, agrega más detalles sobre tu situación.' };
			}
			if (!info) return null;
			if (formTitle && info.title) formTitle.textContent = info.title;
			if (info.placeholder) msg.placeholder = info.placeholder;
			if (msgLabel) msgLabel.textContent = 'Cuéntanos un poco más';
			return info;
		};
		var applyInterest = function (key) {
			interestField.value = key;
			if (key === 'quiz' && quizState.summary) contextField.value = quizState.summary;
			var info = applyInterestCopy(key);
			if (info && info.help) {
				var radio = form.querySelector('input[name="ayuda"][value="' + info.help + '"]');
				if (radio && !radio.checked) {
					radio.checked = true;
					renderFollow(info.help, false);
					setError('ayuda', '');
				}
			}
			if (success && !success.hidden) return;
			goTo(1, false);
			saveDraft();
			track('cta_contextual', { interest: key });
		};
		formApi = { applyInterest: applyInterest };

		form.addEventListener('change', function (e) {
			if (e.target.name === 'ayuda') {
				renderFollow(e.target.value, false);
				applyHelpCopy(e.target.value);
				setError('ayuda', '');
			}
			if (e.target.name && rules[e.target.name] && e.target.type === 'radio') setError(e.target.name, '');
			saveDraft();
		});
		form.addEventListener('input', function (e) {
			var name = e.target.name;
			if (name && rules[name]) {
				var field = e.target.closest('.ctb-field');
				if (field && field.classList.contains('is-invalid')) setError(name, rules[name]());
			}
			saveDraft();
		});
		nextBtn.addEventListener('click', function () { if (validateStep(current)) goTo(current + 1, true); });
		prevBtn.addEventListener('click', function () { goTo(current - 1, true); });

		form.addEventListener('submit', function (e) {
			e.preventDefault();
			if (current < 3) { if (validateStep(current)) goTo(current + 1, true); return; }
			hideAlert();
			for (var s = 1; s <= 3; s++) {
				if (!stepFields[s].every(function (n) { return !rules[n](); })) { goTo(s, false); validateStep(s); return; }
			}
			// Sin backend configurado: NO se simula el envío.
			if (!config.formEndpoint) {
				showAlert('El formulario aún no está conectado a un servidor. Configura el envío en config.php (form_mode) para recibir solicitudes.');
				return;
			}
			submitBtn.classList.add('is-loading');
			submitBtn.disabled = true;
			prevBtn.disabled = true;
			form.setAttribute('aria-busy', 'true');
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
					return res.json().catch(function () { return {}; }).then(function (d) { return { ok: res.ok, data: d }; });
				})
				.then(function (r) {
					var ok = r.ok && r.data.success !== false;
					if (ok) {
						form.hidden = true;
						if (r.data.message) successText.textContent = r.data.message;
						success.hidden = false;
						success.focus();
						store.del(DRAFT);
						track('generate_lead', { help: radioVal('ayuda'), interest: interestField.value || 'directo' });
						return;
					}
					if (r.data.fields) {
						var firstStep = 3;
						Object.keys(r.data.fields).forEach(function (k) {
							setError(k, r.data.fields[k]);
							for (var s2 = 1; s2 <= 3; s2++) if (stepFields[s2].indexOf(k) !== -1 && s2 < firstStep) firstStep = s2;
						});
						if (firstStep !== current) goTo(firstStep, false);
					}
					showAlert(r.data.message || 'No pudimos enviar tu mensaje. Inténtalo nuevamente en unos minutos.');
				})
				.catch(function () {
					showAlert('Hubo un problema de conexión con el servidor. Revisa tu conexión e inténtalo nuevamente.');
				})
				.then(function () {
					clearTimeout(timeout);
					submitBtn.classList.remove('is-loading');
					submitBtn.disabled = false;
					prevBtn.disabled = false;
					form.setAttribute('aria-busy', 'false');
				});
		});

		restoreDraft();
		if (!formTitle || !interestField.value) { if (formTitle) formTitle.textContent = defaultTitle; }
	}

	// Delegado: cualquier elemento con data-ctb-interest (también dentro de modales o del selector)
	document.addEventListener('click', function (e) {
		var cta = e.target.closest('[data-ctb-interest]');
		if (!cta) return;
		var key = cta.getAttribute('data-ctb-interest');
		var target = document.getElementById('contacto');
		var inModal = modal && modal.contains(cta);
		if (formApi) formApi.applyInterest(key);
		if (inModal) {
			e.preventDefault();
			closeModal(function () { scrollToEl(target); });
		}
	});

	/* ================= 18 CONTADORES / AÑO / WHATSAPP ================= */
	var counters = $$('[data-ctb-count]');
	if (counters.length && hasIO) {
		var countIO = new IntersectionObserver(function (entries) {
			entries.forEach(function (en) {
				if (!en.isIntersecting) return;
				var el = en.target, target = parseFloat(el.getAttribute('data-ctb-count')) || 0;
				countIO.unobserve(el);
				if (reduceMotion) return;
				var start = null;
				var step = function (t) {
					if (!start) start = t;
					var p = Math.min((t - start) / 1600, 1);
					el.textContent = Math.round(target * (1 - Math.pow(1 - p, 4))).toLocaleString('es-CL');
					if (p < 1) window.requestAnimationFrame(step);
				};
				window.requestAnimationFrame(step);
			});
		}, { threshold: 0.6 });
		counters.forEach(function (c) { countIO.observe(c); });
	}
	$$('[data-ctb-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
	$$('a[href^="https://wa.me/"]').forEach(function (a) {
		a.addEventListener('click', function () { track('contact_whatsapp'); });
	});
})();
