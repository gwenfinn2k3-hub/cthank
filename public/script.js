/**
 * =====================================================================
 * BÀI 1: BẢO VỆ CHỦ QUYỀN LÃNH THỔ, BIÊN GIỚI QUỐC GIA VIỆT NAM
 * Presentation Controller (GSAP + Stagger + Swipe + Fullscreen + State)
 * =====================================================================
 */

(function () {
  'use strict';

  // --- 1. DOM REFERENCES & STATE ---
  const deck = document.getElementById('deck');
  const slides = Array.from(document.querySelectorAll('.slide'));
  const totalSlides = slides.length;
  let currentIndex = 0;
  let isAnimating = false;
  let hasGSAP = typeof window.gsap !== 'undefined';

  if (!hasGSAP) {
    document.body.classList.add('no-gsap');
  }

  // Chrome elements
  const progressBar = document.getElementById('progress-bar');
  const counterCurrent = document.getElementById('counter-current');
  const counterTotal = document.getElementById('counter-total');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const btnFullscreen = document.getElementById('btn-fullscreen');
  const paginationDotsContainer = document.getElementById('pagination-dots');
  const liveRegion = document.getElementById('live-region');
  const btnStart = document.getElementById('btn-start');
  const btnRestart = document.getElementById('btn-restart');
  const btnOverview = document.getElementById('btn-overview');
  const btnOpenOverview = document.getElementById('btn-open-overview');
  const overviewModal = document.getElementById('overview');
  const overviewGrid = document.getElementById('overview-grid');
  const btnOverviewClose = document.getElementById('btn-overview-close');

  if (counterTotal) {
    counterTotal.textContent = String(totalSlides).padStart(2, '0');
  }

  // --- 2. BUILD PAGINATION & OVERVIEW ITEMS ---
  function buildNavigationUI() {
    // Pagination dots
    if (paginationDotsContainer) {
      paginationDotsContainer.innerHTML = '';
      slides.forEach((slide, idx) => {
        const dot = document.createElement('button');
        dot.className = 'dot' + (idx === 0 ? ' is-active' : '');
        dot.type = 'button';
        dot.setAttribute('aria-label', `Chuyển tới slide ${idx + 1}: ${slide.dataset.title || ''}`);
        
        const tip = document.createElement('span');
        tip.className = 'dot__tip';
        tip.innerHTML = `<b>${String(idx + 1).padStart(2, '0')}</b>${slide.dataset.title || ''}`;
        dot.appendChild(tip);

        dot.addEventListener('click', () => {
          goToSlide(idx);
        });
        paginationDotsContainer.appendChild(dot);
      });
    }

    // Overview modal items
    if (overviewGrid) {
      overviewGrid.innerHTML = '';
      slides.forEach((slide, idx) => {
        const item = document.createElement('button');
        item.className = 'ov-item' + (idx === 0 ? ' is-current' : '');
        item.type = 'button';
        const iconClass = slide.dataset.icon || 'fa-file-lines';
        item.innerHTML = `
          <span class="ov-item__num">${String(idx + 1).padStart(2, '0')}</span>
          <span class="ov-item__title">
            <small><i class="fa-solid ${iconClass}"></i>Slide ${idx + 1}</small>
            <strong>${slide.dataset.title || 'Nội dung bài'}</strong>
          </span>
        `;
        item.addEventListener('click', () => {
          closeOverview();
          goToSlide(idx);
        });
        overviewGrid.appendChild(item);
      });
    }
  }

  // --- 3. ANIMATION ENGINE (GSAP / CSS FALLBACK) ---
  function animateSlideContent(slideElement, direction = 1) {
    if (!hasGSAP) {
      slideElement.classList.add('animate');
      const animItems = slideElement.querySelectorAll('[data-anim]');
      animItems.forEach((el, i) => {
        el.style.setProperty('--i', i);
      });
      return;
    }

    // Animate via GSAP
    const animEls = slideElement.querySelectorAll('[data-anim]');
    const mediaEl = slideElement.querySelector('[data-anim="media"]');
    const lineX = slideElement.querySelector('[data-anim="lineX"]');
    const burst = slideElement.querySelector('.burst');

    // Reset initial styles for animatable children
    gsap.killTweensOf(animEls);
    if (mediaEl) gsap.killTweensOf(mediaEl);
    if (lineX) gsap.killTweensOf(lineX);

    // Stagger in content elements
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Stagger slide text/cards
    if (animEls.length > 0) {
      tl.fromTo(
        animEls,
        {
          opacity: 0,
          y: direction >= 0 ? 35 : -35,
          scale: 0.98
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.75,
          stagger: 0.08,
          clearProps: 'transform,scale'
        },
        0.05
      );
    }

    // Media element cinematic reveal
    if (mediaEl) {
      tl.fromTo(
        mediaEl,
        {
          opacity: 0,
          scale: 1.08,
          x: direction >= 0 ? 30 : -30
        },
        {
          opacity: 1,
          scale: 1,
          x: 0,
          duration: 1,
          ease: 'power2.out',
          clearProps: 'transform'
        },
        0.1
      );
    }

    // Special timeline line animation on Slide 9
    if (lineX) {
      tl.fromTo(
        lineX,
        { scaleX: 0, opacity: 0 },
        { scaleX: 1, opacity: 1, duration: 0.85, ease: 'power2.out' },
        0.2
      );
    }

    // Special finale fireworks / stars burst on Slide 14
    if (burst && !burst.hasChildNodes()) {
      for (let i = 0; i < 16; i++) {
        const star = document.createElement('i');
        star.className = 'fa-solid fa-star';
        burst.appendChild(star);
        const angle = (i / 16) * Math.PI * 2;
        const dist = 60 + Math.random() * 80;
        gsap.fromTo(
          star,
          { x: 0, y: 0, opacity: 1, scale: 0.5 },
          {
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist,
            opacity: 0,
            scale: 1.4,
            duration: 1.4 + Math.random() * 0.8,
            ease: 'power2.out',
            repeat: -1,
            repeatDelay: 2
          }
        );
      }
    }
  }

  // --- 4. SLIDE NAVIGATION TRANSITIONS ---
  function updateChrome(index) {
    const slide = slides[index];
    const theme = slide.dataset.theme || 'red';
    document.body.setAttribute('data-theme', theme);

    // Update Progress Bar
    if (progressBar) {
      const pct = ((index + 1) / totalSlides) * 100;
      progressBar.style.width = pct + '%';
      const progressWrap = document.getElementById('progress');
      if (progressWrap) progressWrap.setAttribute('aria-valuenow', index + 1);
    }

    // Update Counter
    if (counterCurrent) {
      counterCurrent.textContent = String(index + 1).padStart(2, '0');
    }

    // Update Prev / Next buttons
    if (btnPrev) btnPrev.disabled = index === 0;
    if (btnNext) {
      btnNext.disabled = index === totalSlides - 1;
      const nextSpan = btnNext.querySelector('span');
      if (nextSpan) {
        nextSpan.textContent = index === totalSlides - 2 ? 'Tổng kết' : 'Tiếp theo';
      }
    }

    // Update Pagination Dots
    if (paginationDotsContainer) {
      const dots = paginationDotsContainer.querySelectorAll('.dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('is-active', idx === index);
        if (idx < index) {
          dot.classList.add('is-visited');
        } else {
          dot.classList.remove('is-visited');
        }
      });
    }

    // Update Overview modal highlights
    if (overviewGrid) {
      const items = overviewGrid.querySelectorAll('.ov-item');
      items.forEach((item, idx) => {
        item.classList.toggle('is-current', idx === index);
      });
    }

    // Screen reader announcement
    if (liveRegion) {
      liveRegion.textContent = `Đang ở slide ${index + 1} trên ${totalSlides}: ${slide.dataset.title || ''}`;
    }

    // Hash sync
    history.replaceState(null, '', `#/${index + 1}`);
  }

  function goToSlide(targetIndex) {
    if (targetIndex < 0 || targetIndex >= totalSlides || targetIndex === currentIndex || isAnimating) {
      return;
    }

    const direction = targetIndex > currentIndex ? 1 : -1;
    const currentSlide = slides[currentIndex];
    const nextSlide = slides[targetIndex];

    isAnimating = true;

    if (hasGSAP) {
      // 3D Perspective Flip / Slide Transition
      const tl = gsap.timeline({
        onComplete: () => {
          currentSlide.classList.remove('is-active');
          nextSlide.classList.add('is-active');
          gsap.set([currentSlide, nextSlide], { clearProps: 'all' });
          currentIndex = targetIndex;
          updateChrome(currentIndex);
          animateSlideContent(nextSlide, direction);
          isAnimating = false;
        }
      });

      // Outgoing slide
      tl.to(
        currentSlide,
        {
          opacity: 0,
          y: direction * -50,
          scale: 0.94,
          filter: 'blur(6px)',
          duration: 0.55,
          ease: 'power2.inOut'
        },
        0
      );

      // Incoming slide
      tl.fromTo(
        nextSlide,
        {
          opacity: 0,
          y: direction * 50,
          scale: 1.05,
          filter: 'blur(6px)',
          visibility: 'visible'
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 0.65,
          ease: 'power3.out'
        },
        0.18
      );
    } else {
      currentSlide.classList.remove('is-active');
      currentSlide.classList.remove('animate');
      nextSlide.classList.add('is-active');
      currentIndex = targetIndex;
      updateChrome(currentIndex);
      animateSlideContent(nextSlide, direction);
      setTimeout(() => {
        isAnimating = false;
      }, 500);
    }
  }

  function nextSlide() {
    if (currentIndex < totalSlides - 1) {
      goToSlide(currentIndex + 1);
    }
  }

  function prevSlide() {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    }
  }

  // --- 5. INTERACTIVE WIDGETS ---
  // Slide 5: Territory Tabs
  function initTerritoryWidget() {
    const tabs = document.querySelectorAll('.terr-tab');
    const details = document.querySelectorAll('.terr-detail');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const key = tab.dataset.key;
        tabs.forEach((t) => {
          const isActive = t === tab;
          t.classList.toggle('is-active', isActive);
          t.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        details.forEach((det) => {
          det.classList.toggle('is-active', det.dataset.key === key);
        });
      });
    });
  }

  // Slide 11: Sea Zones Interactive Diagram
  function initSeaMapWidget() {
    const seaMap = document.getElementById('sea-map');
    const zoneButtons = document.querySelectorAll('#zone-list .zl-item');
    const bands = document.querySelectorAll('.sea-map .band, .shelf-label');

    function setActiveZone(zoneId) {
      if (!seaMap) return;
      if (!zoneId) {
        seaMap.removeAttribute('data-active');
        bands.forEach((b) => b.classList.remove('is-active'));
        zoneButtons.forEach((btn) => btn.classList.remove('is-active'));
        return;
      }
      seaMap.setAttribute('data-active', zoneId);
      bands.forEach((b) => {
        b.classList.toggle('is-active', b.dataset.zone === String(zoneId));
      });
      zoneButtons.forEach((btn) => {
        btn.classList.toggle('is-active', btn.dataset.zone === String(zoneId));
      });
    }

    zoneButtons.forEach((btn) => {
      btn.addEventListener('mouseenter', () => setActiveZone(btn.dataset.zone));
      btn.addEventListener('focus', () => setActiveZone(btn.dataset.zone));
      btn.addEventListener('mouseleave', () => setActiveZone(null));
      btn.addEventListener('blur', () => setActiveZone(null));
    });

    bands.forEach((band) => {
      band.addEventListener('mouseenter', () => setActiveZone(band.dataset.zone));
      band.addEventListener('mouseleave', () => setActiveZone(null));
      band.addEventListener('click', () => {
        setActiveZone(band.dataset.zone);
      });
    });
  }

  // Spotlight Cursor Tracking
  function initSpotlightEffect() {
    const spots = document.querySelectorAll('.spot');
    spots.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mx', `${x}px`);
        card.style.setProperty('--my', `${y}px`);
      });
    });
  }

  // Particle Background
  function initParticles() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const count = Math.min(45, Math.floor((width * height) / 32000));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2 + 0.6,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -0.2 - Math.random() * 0.45,
        alpha: Math.random() * 0.5 + 0.2,
        gold: Math.random() > 0.4
      });
    }

    function render() {
      ctx.clearRect(0, 0, width, height);
      for (let p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.gold
          ? `rgba(255, 205, 2, ${p.alpha * 0.7})`
          : `rgba(218, 37, 29, ${p.alpha * 0.5})`;
        ctx.fill();
      }
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  }

  // --- 6. FULLSCREEN & OVERVIEW MODAL ---
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  function updateFullscreenIcon() {
    if (!btnFullscreen) return;
    const icon = btnFullscreen.querySelector('i');
    if (!icon) return;
    if (document.fullscreenElement) {
      icon.className = 'fa-solid fa-compress';
      btnFullscreen.setAttribute('title', 'Thoát toàn màn hình (F)');
    } else {
      icon.className = 'fa-solid fa-expand';
      btnFullscreen.setAttribute('title', 'Toàn màn hình (F)');
    }
  }

  document.addEventListener('fullscreenchange', updateFullscreenIcon);

  function openOverview() {
    if (!overviewModal) return;
    overviewModal.classList.add('is-open');
    overviewModal.setAttribute('aria-hidden', 'false');
  }

  function closeOverview() {
    if (!overviewModal) return;
    overviewModal.classList.remove('is-open');
    overviewModal.setAttribute('aria-hidden', 'true');
  }

  // --- 7. EVENT LISTENERS ---
  // Keyboard Navigation
  window.addEventListener('keydown', (e) => {
    // If overview is open, handle Esc
    if (overviewModal && overviewModal.classList.contains('is-open')) {
      if (e.key === 'Escape') {
        closeOverview();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ': // Spacebar
      case 'PageDown':
        e.preventDefault();
        nextSlide();
        break;

      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        prevSlide();
        break;

      case 'Home':
        e.preventDefault();
        goToSlide(0);
        break;

      case 'End':
        e.preventDefault();
        goToSlide(totalSlides - 1);
        break;

      case 'f':
      case 'F':
        e.preventDefault();
        toggleFullscreen();
        break;

      case 'o':
      case 'O':
        e.preventDefault();
        if (overviewModal && overviewModal.classList.contains('is-open')) {
          closeOverview();
        } else {
          openOverview();
        }
        break;

      case 'Escape':
        if (overviewModal && overviewModal.classList.contains('is-open')) {
          closeOverview();
        }
        break;
    }
  });

  // Touch Swipe for Mobile & Tablet
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  window.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    },
    { passive: true }
  );

  window.addEventListener(
    'touchend',
    (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleSwipe();
    },
    { passive: true }
  );

  function handleSwipe() {
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    const threshold = 55;

    // Horizontal swipe dominant
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
      if (diffX < 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  }

  // Mouse wheel throttling
  let wheelTimeout = null;
  window.addEventListener(
    'wheel',
    (e) => {
      if (overviewModal && overviewModal.classList.contains('is-open')) return;
      // Allow internal scrolling if content overflows
      const activeSlide = slides[currentIndex];
      if (activeSlide && activeSlide.scrollHeight > activeSlide.clientHeight) {
        const atBottom = activeSlide.scrollHeight - activeSlide.scrollTop <= activeSlide.clientHeight + 2;
        const atTop = activeSlide.scrollTop <= 2;
        if ((e.deltaY > 0 && !atBottom) || (e.deltaY < 0 && !atTop)) {
          return;
        }
      }

      if (wheelTimeout) return;
      if (Math.abs(e.deltaY) > 40) {
        if (e.deltaY > 0) nextSlide();
        else prevSlide();
        wheelTimeout = setTimeout(() => {
          wheelTimeout = null;
        }, 650);
      }
    },
    { passive: true }
  );

  // Auto idle cursor hide in presentation
  let idleTimer = null;
  function resetIdle() {
    document.body.classList.remove('is-idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      document.body.classList.add('is-idle');
    }, 4500);
  }
  window.addEventListener('mousemove', resetIdle);
  window.addEventListener('keydown', resetIdle);

  // Button clicks
  if (btnPrev) btnPrev.addEventListener('click', prevSlide);
  if (btnNext) btnNext.addEventListener('click', nextSlide);
  if (btnFullscreen) btnFullscreen.addEventListener('click', toggleFullscreen);
  if (btnStart) btnStart.addEventListener('click', () => goToSlide(1));
  if (btnRestart) btnRestart.addEventListener('click', () => goToSlide(0));
  if (btnOverview) btnOverview.addEventListener('click', openOverview);
  if (btnOpenOverview) btnOpenOverview.addEventListener('click', openOverview);
  if (btnOverviewClose) btnOverviewClose.addEventListener('click', closeOverview);
  if (overviewModal) {
    overviewModal.addEventListener('click', (e) => {
      if (e.target === overviewModal) closeOverview();
    });
  }

  // URL Hash routing at load time (e.g. #/5)
  function handleInitialHash() {
    const hash = window.location.hash;
    const match = hash.match(/#\/(\d+)/);
    if (match) {
      const idx = parseInt(match[1], 10) - 1;
      if (idx >= 0 && idx < totalSlides) {
        slides[0].classList.remove('is-active');
        slides[idx].classList.add('is-active');
        currentIndex = idx;
      }
    }
  }

  // Image load fallback helper
  function setupImageFallbacks() {
    const images = document.querySelectorAll('.media img');
    images.forEach((img) => {
      img.addEventListener('error', () => {
        const parent = img.closest('.media');
        if (parent) {
          parent.classList.add('media--fallback');
        }
      });
    });
  }

  // --- 8. INITIALIZE ---
  function init() {
    buildNavigationUI();
    handleInitialHash();
    updateChrome(currentIndex);
    initTerritoryWidget();
    initSeaMapWidget();
    initSpotlightEffect();
    initParticles();
    setupImageFallbacks();

    // Trigger initial slide animations
    setTimeout(() => {
      animateSlideContent(slides[currentIndex], 1);
    }, 150);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
