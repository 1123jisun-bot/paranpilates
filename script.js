(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;

  /* ---------- Stagger delays ---------- */
  $$('[data-stagger]').forEach((group) => {
    [...group.children].forEach((el, i) => {
      if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', `${i * 0.1}s`);
    });
  });

  /* ---------- Scroll reveal ---------- */
  const revealEls = $$('.reveal, .reveal-img');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Count up ---------- */
  const formatNum = (n) => n.toLocaleString('ko-KR');
  const counters = $$('[data-count]');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    counters.forEach((el) => { el.textContent = '0'; });
    const countIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = Number(el.dataset.count);
        const duration = 1800;
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 4);
          el.textContent = formatNum(Math.round(target * eased));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        countIO.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => countIO.observe(el));
  }

  /* ---------- Header / quickbar / parallax / steps (scroll) ---------- */
  const header = $('#header');
  const quickbar = $('.quickbar');
  const parallaxEls = reduceMotion ? [] : $$('[data-parallax]');
  const steps = $('.steps');
  const stepItems = $$('.step');
  const mobileSteps = window.matchMedia('(max-width: 900px)');
  let lastY = window.scrollY;
  let ticking = false;

  const updateParallax = (vh) => {
    parallaxEls.forEach((el) => {
      const rect = el.parentElement.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > vh + 200) return;
      const speed = parseFloat(el.dataset.parallax) || 0;
      const offset = (rect.top + rect.height / 2 - vh / 2) * speed;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });
  };

  const updateSteps = (vh) => {
    if (!steps) return;
    const rect = steps.getBoundingClientRect();
    const p = mobileSteps.matches
      ? (vh * 0.7 - rect.top) / rect.height
      : (vh * 0.85 - rect.top) / (vh * 0.45);
    const progress = Math.min(Math.max(p, 0), 1);
    steps.style.setProperty('--p', progress.toFixed(3));
    stepItems.forEach((step, i) => {
      step.classList.toggle('is-reached', progress > i / stepItems.length + 0.001);
    });
  };

  const onScroll = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    header.classList.toggle('is-scrolled', y > 20);
    if (Math.abs(y - lastY) > 6) {
      header.classList.toggle('is-hidden', y > lastY && y > 480 && !body.classList.contains('menu-open'));
      lastY = y;
    }
    quickbar.classList.toggle('is-visible', y > vh * 0.6);
    updateParallax(vh);
    updateSteps(vh);
    ticking = false;
  };
  const requestScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  };
  window.addEventListener('scroll', requestScroll, { passive: true });
  window.addEventListener('resize', requestScroll);
  onScroll();

  /* ---------- Current section in nav ---------- */
  const navLinks = $$('.nav a');
  if ('IntersectionObserver' in window) {
    const navIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === `#${id}`));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((sec) => navIO.observe(sec));
  }

  /* ---------- Mobile menu ---------- */
  const toggle = $('.menu-toggle');
  const menu = $('#mobile-menu');
  const setMenu = (open) => {
    body.classList.toggle('menu-open', open);
    body.classList.toggle('no-scroll', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    menu.setAttribute('aria-hidden', String(!open));
  };
  toggle.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* ---------- Program hover image ---------- */
  const float = $('.program-float');
  const floatImg = float && $('img', float);
  const programList = $('.program-list');
  const canHover = window.matchMedia('(hover: hover) and (min-width: 901px)');
  if (float && programList) {
    let mx = 0, my = 0, fx = 0, fy = 0, rafId = null, active = false, preloaded = false;
    const W = 260, H = 347;
    const follow = () => {
      fx += (mx - fx) * 0.14;
      fy += (my - fy) * 0.14;
      const x = Math.min(fx + 32, window.innerWidth - W - 16);
      float.style.translate = `${x.toFixed(1)}px ${(fy - H / 2).toFixed(1)}px`;
      if (active || Math.abs(mx - fx) > 0.5 || Math.abs(my - fy) > 0.5) {
        rafId = requestAnimationFrame(follow);
      } else {
        rafId = null;
      }
    };
    programList.addEventListener('mouseenter', (e) => {
      if (!canHover.matches) return;
      if (!preloaded) {
        $$('.program', programList).forEach((p) => { new Image().src = p.dataset.img; });
        preloaded = true;
      }
      mx = fx = e.clientX;
      my = fy = e.clientY;
    });
    window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    $$('.program', programList).forEach((p) => {
      p.addEventListener('mouseenter', () => {
        if (!canHover.matches) return;
        if (floatImg.getAttribute('src') !== p.dataset.img) floatImg.src = p.dataset.img;
        float.classList.add('is-on');
        active = true;
        if (!rafId) rafId = requestAnimationFrame(follow);
      });
    });
    programList.addEventListener('mouseleave', () => {
      float.classList.remove('is-on');
      active = false;
    });
  }

  /* ---------- Works filter ---------- */
  const filters = $$('.filter');
  const works = $$('.work');
  filters.forEach((btn) => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.filter;
      filters.forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      works.forEach((w) => w.classList.remove('is-pop'));
      void document.body.offsetWidth;
      let i = 0;
      works.forEach((w) => {
        const show = f === 'all' || w.dataset.cat === f;
        w.classList.toggle('is-hidden', !show);
        if (show) {
          w.classList.add('is-in');
          w.style.setProperty('--pop', `${(i++ * 0.08).toFixed(2)}s`);
          w.classList.add('is-pop');
        }
      });
    });
  });

  /* ---------- Work modal ---------- */
  const modal = $('#work-modal');
  const modalPanel = $('.modal__panel', modal);
  let lastFocus = null;
  const openModal = (work) => {
    const img = $('.work__media img', work);
    const modalImg = $('.modal__media img', modal);
    modalImg.src = img.currentSrc || img.src;
    modalImg.alt = img.alt;
    $('.modal__cat', modal).textContent = $('.work__cat', work).textContent;
    $('.modal__title', modal).textContent = $('.work__title', work).textContent;
    $('.modal__meta', modal).textContent = $('.work__meta', work).textContent;
    $('.modal__detail', modal).innerHTML = $('.work__detail', work).innerHTML;
    lastFocus = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    body.classList.add('no-scroll');
    modalPanel.scrollTop = 0;
    setTimeout(() => $('.modal__close', modal).focus(), 50);
  };
  const closeModal = () => {
    if (!modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (!body.classList.contains('menu-open')) body.classList.remove('no-scroll');
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  };
  works.forEach((w) => $('.work__btn', w).addEventListener('click', () => openModal(w)));
  $$('[data-close]', modal).forEach((el) => el.addEventListener('click', closeModal));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      if (body.classList.contains('menu-open')) setMenu(false);
    }
    if (e.key === 'Tab' && modal.classList.contains('is-open')) {
      const focusables = $$('button, a[href]', modalPanel);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Reviews slider ---------- */
  const slider = $('.slider');
  if (slider) {
    const slides = $$('.slide', slider);
    const dotsWrap = $('.slider__dots', slider);
    let index = 0;

    const dots = slides.map((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'slider__dot';
      dot.setAttribute('aria-label', `${i + 1}번째 후기 보기`);
      dot.addEventListener('click', () => go(i));
      if (!reduceMotion) dot.addEventListener('animationend', () => go(index + 1));
      dotsWrap.appendChild(dot);
      return dot;
    });

    function go(n) {
      index = (n + slides.length) % slides.length;
      slides.forEach((s, i) => {
        const on = i === index;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', String(!on));
      });
      dots.forEach((d) => d.classList.remove('is-active'));
      void dotsWrap.offsetWidth;
      dots.forEach((d, i) => d.setAttribute('aria-current', String(i === index)));
      dots[index].classList.add('is-active');
    }

    $$('.slider__arrow', slider).forEach((btn) => {
      btn.addEventListener('click', () => go(index + Number(btn.dataset.dir)));
    });

    const pause = (on) => slider.classList.toggle('is-paused', on);
    slider.addEventListener('mouseenter', () => pause(true));
    slider.addEventListener('mouseleave', () => pause(false));
    slider.addEventListener('focusin', () => pause(true));
    slider.addEventListener('focusout', () => pause(false));

    let touchX = null;
    slider.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
      touchX = null;
    });

    go(0);
  }

  /* ---------- 산전·산후 회복 기록 ---------- */
  const pp = $('.pp');
  if (pp) {
    const data = [
      ['pp01', '1월 29일', 59.8], ['pp02', '1월 30일', 59.8], ['pp03', '1월 31일', 58.7],
      ['pp04', '2월 1일', 57.7], ['pp05', '2월 2일', 56.8], ['pp06', '2월 3일', 55.7],
      ['pp07', '2월 4일', 55.3], ['pp08', '2월 5일', 54.5], ['pp09', '2월 7일', 54.2],
      ['pp10', '2월 9일', 53.4], ['pp11', '2월 11일', 52.4], ['pp12', '2월 12일', 50.3],
    ];
    const frame = $('.pp__frame', pp);
    const dateEl = $('.pp__date', pp);
    const weightEl = $('.pp__weight', pp);
    const range = $('.pp__range', pp);
    const playBtn = $('.pp__play', pp);

    frame.innerHTML = '';
    const imgs = data.map(([id, date], i) => {
      const img = document.createElement('img');
      img.className = 'pp__img' + (i === 0 ? ' is-on' : '');
      img.src = `img/pp/${id}.webp`;
      img.alt = `출산 후 ${date} 다리 부기 기록`;
      img.width = 620; img.height = 620;
      if (i > 1) img.loading = 'lazy';
      frame.appendChild(img);
      return img;
    });
    range.max = String(data.length - 1);

    // 몸무게 그래프
    const svg = $('.pp__chart svg', pp);
    const line = $('.pp__line', svg);
    const dots = $('.pp__dots', svg);
    const xs = data.map((_, i) => 40 + (460 * i) / (data.length - 1));
    const min = 49.5, max = 60.5;
    const ys = data.map(([, , w]) => 170 - ((w - min) / (max - min)) * 150);
    line.setAttribute('points', xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' '));
    dots.innerHTML = '';
    data.forEach(([, date, w], i) => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', xs[i].toFixed(1));
      c.setAttribute('cy', ys[i].toFixed(1));
      c.setAttribute('r', '4');
      dots.appendChild(c);
      if (i === 0 || i === data.length - 1) {
        const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t.setAttribute('x', xs[i].toFixed(1));
        t.setAttribute('y', (ys[i] - 14).toFixed(1));
        t.setAttribute('text-anchor', i === 0 ? 'start' : 'end');
        t.textContent = `${w}kg`;
        dots.appendChild(t);
      }
    });
    const dotEls = [...dots.querySelectorAll('circle')];

    let idx = 0;
    let timer = null;
    const show = (n) => {
      idx = (n + data.length) % data.length;
      imgs.forEach((img, i) => img.classList.toggle('is-on', i === idx));
      dotEls.forEach((c, i) => c.classList.toggle('is-now', i === idx));
      dateEl.textContent = data[idx][1];
      weightEl.textContent = `${data[idx][2]}kg`;
      range.value = String(idx);
    };
    const stop = () => { clearInterval(timer); timer = null; playBtn.textContent = '▶'; playBtn.setAttribute('aria-label', '재생'); };
    const play = () => {
      if (timer || reduceMotion) return;
      timer = setInterval(() => show(idx + 1), 900);
      playBtn.textContent = '❚❚';
      playBtn.setAttribute('aria-label', '일시정지');
    };
    playBtn.addEventListener('click', () => (timer ? stop() : play()));
    range.addEventListener('input', () => { stop(); show(Number(range.value)); });
    show(0);
    stop();

    if ('IntersectionObserver' in window) {
      const ppIO = new IntersectionObserver((entries) => {
        entries.forEach((entry) => (entry.isIntersecting ? play() : stop()));
      }, { threshold: 0.35 });
      ppIO.observe(pp);
    }
  }

  /* ---------- Copy to clipboard ---------- */
  const toast = $('.toast');
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-show'), 2000);
  };
  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    }
  };
  $$('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const ok = await copyText(btn.dataset.copy);
      showToast(ok ? `${btn.dataset.copy} 복사되었어요` : '복사에 실패했어요. 길게 눌러 복사해 주세요.');
      if (ok) {
        btn.textContent = '완료';
        setTimeout(() => { btn.textContent = '복사'; }, 1600);
      }
    });
  });
})();
