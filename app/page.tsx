'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const FRAME_TOTALS: Record<string, number> = {
  '/frames/desktop/truck': 410,
  '/frames/mobile/promo': 1811,
};

const DEFAULT_TOTAL_FRAMES = 410;
const FRAME_NAME_PREFIX = 'frame_';
const FRAME_NAME_PADDING = 4;

type SectionCard = {
  id: string;
  title: string;
  subtitle: string;
  focus: string;
  benefit: string;
  tagline: string;
  cta: string;
};

const SECTION_CARDS: SectionCard[] = [
  {
    id: 'security',
    title: 'Охранное предприятие',
    subtitle: 'Физическая и цифровая защита объектов класса А.',
    focus: 'Ситуационные центры 24/7 и мобильные группы.',
    benefit: 'Снижение операционных рисков и инцидентов до 42%.',
    tagline: 'Точка входа в полностью контролируемый периметр.',
    cta: 'Заказать аудит безопасности',
  },
  {
    id: 'engineering',
    title: 'Инженерия',
    subtitle: 'Проектирование и внедрение сложных инженерных контуров.',
    focus: 'Инфраструктура, автоматизация, контроль качества.',
    benefit: 'Сокращение сроков запуска объектов до 30%.',
    tagline: 'От концепта до запуска в едином техническом цикле.',
    cta: 'Получить инженерную консультацию',
  },
  {
    id: 'logistics',
    title: 'Логистика',
    subtitle: 'Управление потоками, маршрутами и складскими мощностями.',
    focus: 'Predictive-модель поставок и цифровой диспетчерский контур.',
    benefit: 'Рост оборачиваемости и прозрачности цепочек поставок.',
    tagline: 'Доставка как точный алгоритм, а не случайность.',
    cta: 'Оптимизировать логистику',
  },
  {
    id: 'it',
    title: 'Цифровые решения',
    subtitle: 'Корпоративный AI, данные и интеграция процессов.',
    focus: 'Нейросети, бизнес-аналитика, сквозная автоматизация.',
    benefit: 'Сокращение ручных операций и ускорение принятия решений.',
    tagline: 'Цифровой контур, который растет вместе с бизнесом.',
    cta: 'Запросить демонстрацию платформы',
  },
  {
    id: 'energy',
    title: 'Энергетика',
    subtitle: 'Надежные энергетические и резервные системы.',
    focus: 'Проектирование, мониторинг и предиктивное обслуживание.',
    benefit: 'Стабильность энергоконтуров и снижение аварийности.',
    tagline: 'Энергия как сервис с прогнозируемым результатом.',
    cta: 'Рассчитать проект модернизации',
  },
  {
    id: 'service',
    title: 'Сервис и эксплуатация',
    subtitle: 'Постпроектное сопровождение и SLA-контроль.',
    focus: 'Единое окно поддержки и прозрачная отчетность.',
    benefit: 'Максимальная готовность инфраструктуры к нагрузкам.',
    tagline: 'Долгий жизненный цикл систем без просадки качества.',
    cta: 'Подключить сервисный контракт',
  },
];

const CARDS_PER_PAIR = 2;
const SECTION_PAIRS = Array.from(
  { length: Math.ceil(SECTION_CARDS.length / CARDS_PER_PAIR) },
  (_, index) => SECTION_CARDS.slice(index * CARDS_PER_PAIR, index * CARDS_PER_PAIR + CARDS_PER_PAIR),
);

const HUB_MAX_PROGRESS = SECTION_PAIRS.length;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function VostokLanding() {
  const hubLayerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionScrollRef = useRef<HTMLDivElement>(null);
  const frameCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const pendingFramesRef = useRef<Set<string>>(new Set());
  const currentFrameRef = useRef(1);
  const targetProgressRef = useRef(0);
  const isModalOpenRef = useRef(false);
  const isFramesReadyRef = useRef(false);
  const returnHubProgressRef = useRef(0);
  const hubTapLockRef = useRef(false);
  const hubWheelLockUntilRef = useRef(0);
  const hubWheelAccumRef = useRef(0);

  const [frameFolder, setFrameFolder] = useState('/frames/desktop/truck');
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [isFramesReady, setIsFramesReady] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [mode, setMode] = useState<'hub' | 'section'>('hub');
  const [hubProgress, setHubProgress] = useState(0);
  const [sectionProgress, setSectionProgress] = useState(0);
  const [selectedSection, setSelectedSection] = useState<SectionCard | null>(null);

  useEffect(() => {
    const updateFolder = () => {
      setFrameFolder(window.innerWidth < 768 ? '/frames/mobile/promo' : '/frames/desktop/truck');
    };

    updateFolder();
    window.addEventListener('resize', updateFolder);
    return () => window.removeEventListener('resize', updateFolder);
  }, []);

  useEffect(() => {
    isModalOpenRef.current = isModalOpen;
  }, [isModalOpen]);

  useEffect(() => {
    isFramesReadyRef.current = isFramesReady;
  }, [isFramesReady]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const exitToHub = useCallback((progressOverride?: number) => {
    const nextHubProgress = typeof progressOverride === 'number' ? progressOverride : returnHubProgressRef.current;

    setMode('hub');
    setSelectedSection(null);
    setSectionProgress(0);
    targetProgressRef.current = 0;
    setHubProgress(clamp(nextHubProgress, 0, HUB_MAX_PROGRESS));

    requestAnimationFrame(() => {
      const scroller = sectionScrollRef.current;
      if (scroller) {
        scroller.scrollTop = 0;
      }
    });
  }, []);

  const openSection = useCallback((section: SectionCard, pairIndex: number) => {
    if (hubTapLockRef.current) {
      return;
    }

    setSelectedSection(section);
    setMode('section');
    setSectionProgress(0);
    targetProgressRef.current = 0;
    returnHubProgressRef.current = clamp(pairIndex, 0, HUB_MAX_PROGRESS);

    requestAnimationFrame(() => {
      const scroller = sectionScrollRef.current;
      if (scroller) {
        scroller.scrollTop = 0;
      }
    });
  }, []);

  useEffect(() => {
    const totalFrames = FRAME_TOTALS[frameFolder] ?? DEFAULT_TOTAL_FRAMES;

    let isCancelled = false;
    let animationFrameId = 0;
    let smoothedProgress = 0;
    let lastRenderedFrame = 0;

    frameCacheRef.current.clear();
    pendingFramesRef.current.clear();
    currentFrameRef.current = 1;
    targetProgressRef.current = 0;
    isFramesReadyRef.current = false;

    const normalizeFrameIndex = (index: number) => clamp(index, 1, totalFrames);

    const getFramePath = (index: number) => {
      const safeIndex = normalizeFrameIndex(index);
      return `${frameFolder}/${FRAME_NAME_PREFIX}${String(safeIndex).padStart(FRAME_NAME_PADDING, '0')}.webp`;
    };

    const getFrameKey = (index: number) => `${frameFolder}_${normalizeFrameIndex(index)}`;

    const drawFrameToCanvas = (image: HTMLImageElement) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const context = canvas.getContext('2d');
      if (!context) {
        return;
      }

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width <= 0 || height <= 0) {
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const renderWidth = Math.round(width * dpr);
      const renderHeight = Math.round(height * dpr);

      if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
        canvas.width = renderWidth;
        canvas.height = renderHeight;
      }

      const imageAspect = image.naturalWidth / image.naturalHeight;
      const canvasAspect = renderWidth / renderHeight;

      let drawWidth = renderWidth;
      let drawHeight = renderHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (imageAspect > canvasAspect) {
        drawHeight = renderHeight;
        drawWidth = drawHeight * imageAspect;
        offsetX = (renderWidth - drawWidth) / 2;
      } else {
        drawWidth = renderWidth;
        drawHeight = drawWidth / imageAspect;
        offsetY = (renderHeight - drawHeight) / 2;
      }

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, renderWidth, renderHeight);
      context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    };

    const drawFrameFromCache = (index: number) => {
      const safeIndex = normalizeFrameIndex(index);
      const frame = frameCacheRef.current.get(getFrameKey(safeIndex));

      if (!frame) {
        return false;
      }

      drawFrameToCanvas(frame);
      return true;
    };

    const preloadFrame = (index: number) => {
      const safeIndex = normalizeFrameIndex(index);
      const frameKey = getFrameKey(safeIndex);

      if (frameCacheRef.current.has(frameKey) || pendingFramesRef.current.has(frameKey)) {
        return;
      }

      const image = new Image();
      image.decoding = 'async';
      pendingFramesRef.current.add(frameKey);

      image.onload = () => {
        frameCacheRef.current.set(frameKey, image);
        pendingFramesRef.current.delete(frameKey);

        if (currentFrameRef.current === safeIndex) {
          drawFrameToCanvas(image);
        }
      };

      image.onerror = () => {
        pendingFramesRef.current.delete(frameKey);
      };

      image.src = getFramePath(safeIndex);
    };

    const preloadFrameWithPromise = (index: number) => {
      const safeIndex = normalizeFrameIndex(index);
      const frameKey = getFrameKey(safeIndex);

      if (frameCacheRef.current.has(frameKey)) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        if (pendingFramesRef.current.has(frameKey)) {
          const waitUntilLoaded = () => {
            if (isCancelled || frameCacheRef.current.has(frameKey) || !pendingFramesRef.current.has(frameKey)) {
              resolve();
              return;
            }

            requestAnimationFrame(waitUntilLoaded);
          };

          waitUntilLoaded();
          return;
        }

        const image = new Image();
        image.decoding = 'async';
        pendingFramesRef.current.add(frameKey);

        image.onload = () => {
          frameCacheRef.current.set(frameKey, image);
          pendingFramesRef.current.delete(frameKey);

          if (currentFrameRef.current === safeIndex) {
            drawFrameToCanvas(image);
          }

          resolve();
        };

        image.onerror = () => {
          pendingFramesRef.current.delete(frameKey);
          resolve();
        };

        image.src = getFramePath(safeIndex);
      });
    };

    const renderFrame = (index: number) => {
      const safeIndex = normalizeFrameIndex(index);
      currentFrameRef.current = safeIndex;

      if (!drawFrameFromCache(safeIndex)) {
        preloadFrame(safeIndex);
      }
    };

    const renderLoop = () => {
      if (isCancelled) {
        return;
      }

      smoothedProgress += (targetProgressRef.current - smoothedProgress) * 0.07;
      const nextFrame = Math.round(smoothedProgress * (totalFrames - 1)) + 1;

      if (nextFrame !== lastRenderedFrame) {
        renderFrame(nextFrame);
        lastRenderedFrame = nextFrame;
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    const startRenderLoop = () => {
      if (animationFrameId === 0) {
        animationFrameId = requestAnimationFrame(renderLoop);
      }
    };

    const handleResize = () => {
      if (!drawFrameFromCache(currentFrameRef.current)) {
        preloadFrame(currentFrameRef.current);
      }
    };

    const runPreload = async () => {
      setPreloadProgress(0);
      setIsFramesReady(false);

      const frameIndexes = Array.from({ length: totalFrames }, (_, index) => index + 1);
      const workers = Math.min(8, frameIndexes.length);
      const framesToStart = Math.min(Math.floor(totalFrames * 0.4), totalFrames);

      let cursor = 0;
      let loaded = 0;

      const updateProgress = () => {
        setPreloadProgress(Math.round((loaded / totalFrames) * 100));
      };

      const worker = async () => {
        while (!isCancelled) {
          const current = cursor;
          cursor += 1;

          if (current >= frameIndexes.length) {
            break;
          }

          const frameIndex = frameIndexes[current];
          await preloadFrameWithPromise(frameIndex);
          loaded += 1;

          if (loaded === 1) {
            renderFrame(1);
          }

          if (loaded === framesToStart) {
            isFramesReadyRef.current = true;
            setIsFramesReady(true);
            startRenderLoop();
          }

          if (loaded % 6 === 0 || loaded === totalFrames) {
            updateProgress();
          }
        }
      };

      await Promise.all(Array.from({ length: workers }, () => worker()));

      if (isCancelled) {
        return;
      }

      if (!isFramesReadyRef.current) {
        setPreloadProgress(100);
        isFramesReadyRef.current = true;
        setIsFramesReady(true);
        startRenderLoop();
      }
    };

    window.addEventListener('resize', handleResize);
    runPreload();

    return () => {
      isCancelled = true;
      window.removeEventListener('resize', handleResize);

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [frameFolder]);

  useEffect(() => {
    if (!isFramesReady || mode !== 'hub') {
      return;
    }

    const handleHubWheel = (event: WheelEvent) => {
      if (isModalOpenRef.current) {
        return;
      }

      const wheelDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!wheelDelta) {
        return;
      }

      event.preventDefault();

      const now = performance.now();
      if (now < hubWheelLockUntilRef.current) {
        return;
      }

      hubWheelAccumRef.current += wheelDelta;
      const threshold = 90;

      if (Math.abs(hubWheelAccumRef.current) < threshold) {
        return;
      }

      const direction = hubWheelAccumRef.current > 0 ? 1 : -1;
      hubWheelAccumRef.current = 0;
      hubWheelLockUntilRef.current = now + 220;

      setHubProgress((prev) => clamp(Math.round(prev) + direction, 0, HUB_MAX_PROGRESS));
    };

    window.addEventListener('wheel', handleHubWheel, { passive: false });

    return () => {
      hubWheelAccumRef.current = 0;
      window.removeEventListener('wheel', handleHubWheel);
    };
  }, [isFramesReady, mode]);

  useEffect(() => {
    if (!isFramesReady || mode !== 'hub') {
      return;
    }

    const hubLayer = hubLayerRef.current;
    if (!hubLayer) {
      return;
    }

    let tapUnlockTimeout = 0;
    const unlockTap = () => {
      hubTapLockRef.current = false;
    };

    const lockTapAfterDrag = () => {
      hubTapLockRef.current = true;
      tapUnlockTimeout = window.setTimeout(unlockTap, 120);
    };

    const stepByDirection = (direction: number) => {
      if (direction === 0) {
        return;
      }

      setHubProgress((prev) => clamp(Math.round(prev) + direction, 0, HUB_MAX_PROGRESS));
    };

    const supportsPointer = typeof window !== 'undefined' && 'PointerEvent' in window;

    if (supportsPointer) {
      const dragState = {
        active: false,
        pointerId: -1,
        startX: 0,
        lastX: 0,
        moved: false,
      };

      const handlePointerDown = (event: PointerEvent) => {
        if (isModalOpenRef.current) {
          return;
        }

        if (event.pointerType === 'mouse' && event.button !== 0) {
          return;
        }

        dragState.active = true;
        dragState.pointerId = event.pointerId;
        dragState.startX = event.clientX;
        dragState.lastX = event.clientX;
        dragState.moved = false;
        hubLayer.setPointerCapture(event.pointerId);
      };

      const handlePointerMove = (event: PointerEvent) => {
        if (!dragState.active || dragState.pointerId !== event.pointerId || isModalOpenRef.current) {
          return;
        }

        dragState.lastX = event.clientX;

        if (Math.abs(dragState.startX - event.clientX) > 4) {
          dragState.moved = true;
        }

        if (event.pointerType === 'touch') {
          event.preventDefault();
        }
      };

      const finishPointer = (event: PointerEvent) => {
        if (!dragState.active || dragState.pointerId !== event.pointerId) {
          return;
        }

        const totalDeltaX = dragState.startX - dragState.lastX;
        if (Math.abs(totalDeltaX) > 42) {
          stepByDirection(totalDeltaX > 0 ? 1 : -1);
        }

        if (dragState.moved) {
          lockTapAfterDrag();
        }

        dragState.active = false;
        dragState.pointerId = -1;
        dragState.startX = 0;
        dragState.moved = false;

        if (hubLayer.hasPointerCapture(event.pointerId)) {
          hubLayer.releasePointerCapture(event.pointerId);
        }
      };

      hubLayer.addEventListener('pointerdown', handlePointerDown);
      hubLayer.addEventListener('pointermove', handlePointerMove);
      hubLayer.addEventListener('pointerup', finishPointer);
      hubLayer.addEventListener('pointercancel', finishPointer);

      return () => {
        if (tapUnlockTimeout) {
          clearTimeout(tapUnlockTimeout);
        }

        hubLayer.removeEventListener('pointerdown', handlePointerDown);
        hubLayer.removeEventListener('pointermove', handlePointerMove);
        hubLayer.removeEventListener('pointerup', finishPointer);
        hubLayer.removeEventListener('pointercancel', finishPointer);
      };
    }

    const touchState = {
      active: false,
      startX: 0,
      lastX: 0,
      moved: false,
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (isModalOpenRef.current) {
        return;
      }

      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      touchState.active = true;
      touchState.startX = touch.clientX;
      touchState.lastX = touch.clientX;
      touchState.moved = false;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!touchState.active || isModalOpenRef.current) {
        return;
      }

      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      const deltaX = touchState.lastX - touch.clientX;
      touchState.lastX = touch.clientX;

      if (Math.abs(touchState.startX - touch.clientX) > 4) {
        touchState.moved = true;
      }

      if (Math.abs(deltaX) > 0.1) {
        event.preventDefault();
      }
    };

    const finishTouch = () => {
      if (!touchState.active) {
        return;
      }

      const totalDeltaX = touchState.startX - touchState.lastX;
      if (Math.abs(totalDeltaX) > 42) {
        stepByDirection(totalDeltaX > 0 ? 1 : -1);
      }

      if (touchState.moved) {
        lockTapAfterDrag();
      }

      touchState.active = false;
      touchState.startX = 0;
      touchState.moved = false;
    };

    hubLayer.addEventListener('touchstart', handleTouchStart, { passive: true });
    hubLayer.addEventListener('touchmove', handleTouchMove, { passive: false });
    hubLayer.addEventListener('touchend', finishTouch);
    hubLayer.addEventListener('touchcancel', finishTouch);

    return () => {
      if (tapUnlockTimeout) {
        clearTimeout(tapUnlockTimeout);
      }

      hubLayer.removeEventListener('touchstart', handleTouchStart);
      hubLayer.removeEventListener('touchmove', handleTouchMove);
      hubLayer.removeEventListener('touchend', finishTouch);
      hubLayer.removeEventListener('touchcancel', finishTouch);
    };
  }, [isFramesReady, mode]);

  useEffect(() => {
    if (mode !== 'section') {
      return;
    }

    const scroller = sectionScrollRef.current;
    if (!scroller) {
      return;
    }

    const updateProgress = () => {
      const maxScroll = Math.max(scroller.scrollHeight - scroller.clientHeight, 1);
      const progress = clamp(scroller.scrollTop / maxScroll, 0, 1);

      setSectionProgress(progress);
      targetProgressRef.current = progress;
    };

    const handleSectionWheel = (event: WheelEvent) => {
      if (isModalOpenRef.current) {
        return;
      }

      if (scroller.scrollTop <= 2 && event.deltaY < -30) {
        event.preventDefault();
        exitToHub();
      }
    };

    updateProgress();
    scroller.addEventListener('scroll', updateProgress, { passive: true });
    scroller.addEventListener('wheel', handleSectionWheel, { passive: false });

    return () => {
      scroller.removeEventListener('scroll', updateProgress);
      scroller.removeEventListener('wheel', handleSectionWheel);
    };
  }, [mode, exitToHub]);

  const pairCount = SECTION_PAIRS.length;
  const currentPanel = clamp(hubProgress, 0, HUB_MAX_PROGRESS);
  const activePanelIndex = Math.round(currentPanel);
  const isFinalStep = activePanelIndex >= pairCount;
  const finalPanelDistance = pairCount - currentPanel;
  const finalPanelOpacity = clamp(1 - Math.abs(finalPanelDistance) * 0.55, 0, 1);
  const finalPanelScale = 1 - Math.min(Math.abs(finalPanelDistance) * 0.05, 0.16);
  const hubProgressPercent = HUB_MAX_PROGRESS > 0 ? Math.round((currentPanel / HUB_MAX_PROGRESS) * 100) : 0;
  const activePairNumber = Math.min(activePanelIndex + 1, pairCount);

  const sectionTitle = selectedSection?.title ?? 'Направление';
  const sectionSubtitle = selectedSection?.subtitle ?? 'Персональная траектория масштабирования вашего бизнеса.';
  const sectionFocus = selectedSection?.focus ?? 'Комплексная экспертиза, адаптированная под ваш контур.';
  const sectionBenefit = selectedSection?.benefit ?? 'Прозрачный результат с метриками эффективности.';
  const sectionTagline = selectedSection?.tagline ?? 'Единый периметр управления проектом и операциями.';
  const sectionCta = selectedSection?.cta ?? 'Оставить заявку на консультацию';

  return (
    <>
      <div className="relative h-screen w-full overflow-hidden bg-black text-white font-sans">
        {!isFramesReady && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-black/90 backdrop-blur-sm">
            <p className="text-sm uppercase tracking-[0.3em] text-gray-300">Подготовка кадров</p>
            <div className="h-2 w-[80vw] max-w-lg overflow-hidden bg-white/10">
              <div className="h-full bg-white transition-all duration-150" style={{ width: `${preloadProgress}%` }} />
            </div>
            <p className="text-2xl font-bold tabular-nums">{preloadProgress}%</p>
          </div>
        )}

        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/85 via-black/45 to-black/90" />

        <div
          ref={hubLayerRef}
          className={`absolute inset-0 z-10 transition-opacity duration-700 ${mode === 'hub' ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
          style={{ touchAction: 'none' }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.06),transparent_35%)]" />

          <div className="relative flex h-full flex-col justify-between px-6 py-7 md:px-12 md:py-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gray-400">Пространство направлений</p>
                <h1 className="text-3xl font-black uppercase leading-none md:text-6xl">Восток-Холдинг</h1>
              </div>

              <div className="max-w-md border border-white/15 bg-black/45 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Навигация</p>
                <p className="mt-1 text-sm text-gray-200">
                  На телефоне свайпайте влево/вправо, на ПК скролльте по горизонтали или колесом. Когда карточки проявятся, нажмите на нужный раздел.
                </p>
              </div>
            </div>

            <div className="relative mx-auto h-[45vh] w-full max-w-5xl overflow-hidden md:h-[54vh]">
              {SECTION_PAIRS.map((pair, pairIndex) => {
                const panelDistance = pairIndex - currentPanel;
                const panelOpacity = clamp(1 - Math.abs(panelDistance) * 0.55, 0, 1);
                const panelScale = 1 - Math.min(Math.abs(panelDistance) * 0.05, 0.16);

                return (
                  <div
                    key={`pair-panel-${pairIndex}`}
                    className="absolute inset-0 flex items-center justify-center transition-[transform,opacity] duration-500 ease-out"
                    style={{
                      transform: `translate3d(${panelDistance * 100}%, 0, 0) scale(${panelScale})`,
                      opacity: panelOpacity,
                      pointerEvents: Math.abs(panelDistance) < 0.55 ? 'auto' : 'none',
                    }}
                  >
                    <div className="grid h-full w-full grid-cols-2 gap-3 md:gap-5">
                      {pair.map((card, index) => (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => openSection(card, pairIndex)}
                          className="group relative h-full min-h-[220px] overflow-hidden border border-white/20 bg-black/35 p-4 text-left transition-all duration-500 hover:border-white/60 hover:bg-white/5 md:min-h-[320px] md:p-7"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-70" />
                          <div className="relative flex h-full flex-col justify-between">
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500 md:text-xs">0{pairIndex * 2 + index + 1}</p>
                              <h2 className="mt-2 text-sm font-black uppercase leading-tight md:mt-3 md:text-3xl">{card.title}</h2>
                              <p className="mt-2 hidden max-w-sm text-sm text-gray-300 md:block">{card.subtitle}</p>
                            </div>

                            <div>
                              <p className="text-[11px] text-gray-200 md:text-sm">{card.focus}</p>
                              <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-gray-400 transition-colors group-hover:text-white md:mt-4 md:text-xs md:tracking-[0.2em]">
                                Тапните для входа
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div
                className="absolute inset-0 flex items-center justify-center transition-[transform,opacity] duration-500 ease-out"
                style={{
                  transform: `translate3d(${finalPanelDistance * 100}%, 0, 0) scale(${finalPanelScale})`,
                  opacity: finalPanelOpacity,
                  pointerEvents: Math.abs(finalPanelDistance) < 0.55 ? 'auto' : 'none',
                }}
              >
                <div className="w-full max-w-4xl border border-white/20 bg-black/65 px-5 py-7 backdrop-blur-md md:px-10 md:py-12">
                  <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Финальный этап</p>
                  <h2 className="mt-3 text-2xl font-black uppercase leading-tight md:text-5xl">Оставьте заявку напрямую</h2>
                  <p className="mt-4 max-w-2xl text-sm text-gray-300 md:text-base">
                    Вы просмотрели все направления. Оставьте контакт, и мы соберем персональную стратегию под ваш бизнес-контур.
                  </p>

                  <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Горячая линия</p>
                      <a href="tel:+78000000000" className="mt-1 block text-3xl font-black tracking-tight md:text-4xl">
                        8 800 000 00 00
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="bg-white px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-black transition-colors hover:bg-gray-200"
                    >
                      Оставить заявку
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="h-1 w-full overflow-hidden bg-white/10">
                <div className="h-full bg-white transition-all duration-200" style={{ width: `${hubProgressPercent}%` }} />
              </div>

              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <p className="text-xs uppercase tracking-[0.22em] text-gray-400">
                  {isFinalStep
                    ? 'Конечная точка маршрута'
                    : `Пара ${activePairNumber} из ${pairCount} • горизонтально листайте, чтобы перейти дальше`}
                </p>
                <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Жест: сдвиг влево для движения по ленте вперед</p>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`absolute inset-0 z-20 transition-opacity duration-700 ${mode === 'section' ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        >
          <div ref={sectionScrollRef} className="h-full overflow-y-auto overscroll-contain">
            <div className="relative h-[1200vh]">
              <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
                <div className="absolute left-4 top-4 z-30 flex items-center gap-3 md:left-8 md:top-8">
                  <button
                    type="button"
                    onClick={() => exitToHub()}
                    className="border border-white/30 bg-black/40 px-5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-black"
                  >
                    Назад к разделам
                  </button>
                  <p className="hidden text-xs uppercase tracking-[0.2em] text-gray-400 md:block">Прокрутка вверх из начала также вернет назад</p>
                </div>

                <div
                  className="absolute flex flex-col items-center px-6 text-center transition-all duration-1000"
                  style={{
                    opacity: sectionProgress < 0.08 ? 1 : 0,
                    transform: `translateY(${sectionProgress * 180}px)`,
                  }}
                >
                  <p className="mb-4 text-xs uppercase tracking-[0.28em] text-gray-400">Внутри раздела</p>
                  <h2 className="text-4xl font-black uppercase leading-tight md:text-8xl">{sectionTitle}</h2>
                  <p className="mt-4 max-w-2xl text-base text-gray-300 md:text-lg">{sectionSubtitle}</p>
                </div>

                <div
                  className="absolute left-6 max-w-sm transition-all duration-1000 md:left-20"
                  style={{
                    opacity: sectionProgress > 0.08 && sectionProgress < 0.18 ? 1 : 0,
                    transform: `translateX(${(0.13 - sectionProgress) * 700}px)`,
                  }}
                >
                  <div className="rounded-2xl border border-white/20 bg-white/10 p-7 backdrop-blur-lg">
                    <div className="mb-2 text-5xl font-black">40+</div>
                    <h3 className="mb-3 text-xl font-bold uppercase">Критических метрик под контролем</h3>
                    <p className="text-sm text-gray-300">{sectionFocus}</p>
                  </div>
                </div>

                <div
                  className="absolute right-6 max-w-md transition-all duration-1000 md:right-20"
                  style={{
                    opacity: sectionProgress > 0.18 && sectionProgress < 0.28 ? 1 : 0,
                    transform: `translateY(${(0.23 - sectionProgress) * -900}px)`,
                  }}
                >
                  <div className="border border-gray-600 bg-black/60 p-8 backdrop-blur-md">
                    <h3 className="mb-3 text-3xl font-black uppercase">Время решает</h3>
                    <p className="mb-5 text-sm text-gray-400">{sectionBenefit}</p>
                    <div className="flex flex-col gap-3">
                      <input
                        type="tel"
                        placeholder="+7 (999) 000-00-00"
                        className="border border-white/30 bg-white/10 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-white focus:outline-none"
                      />
                      <button className="bg-white py-3 text-sm font-bold uppercase text-black transition-colors hover:bg-gray-200">
                        Жду звонка
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  className="absolute left-6 max-w-lg transition-all duration-1000 md:left-28"
                  style={{
                    opacity: sectionProgress > 0.28 && sectionProgress < 0.42 ? 1 : 0,
                    transform: `translateX(${(0.35 - sectionProgress) * -500}px)`,
                  }}
                >
                  <h3 className="mb-5 text-4xl font-black uppercase leading-none md:text-6xl">Глубина и результат</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="border border-white/15 bg-white/5 p-6 backdrop-blur-sm">
                      <p className="text-lg font-bold">Контур 01</p>
                      <p className="mt-2 text-xs text-gray-300">{sectionTagline}</p>
                    </div>
                    <div className="border border-white/15 bg-white/5 p-6 backdrop-blur-sm">
                      <p className="text-lg font-bold">Контур 02</p>
                      <p className="mt-2 text-xs text-gray-300">Сценарии масштабирования и SLA на каждом этапе внедрения.</p>
                    </div>
                  </div>
                </div>

                <div
                  className="absolute flex w-full flex-col items-center justify-center px-6 transition-all duration-1000"
                  style={{
                    opacity: sectionProgress > 0.42 && sectionProgress < 0.58 ? 1 : 0,
                    transform: `scale(${sectionProgress > 0.42 && sectionProgress < 0.58 ? 1 : 0.82})`,
                    pointerEvents: sectionProgress > 0.42 && sectionProgress < 0.58 ? 'auto' : 'none',
                  }}
                >
                  <div className="w-full bg-black/55 p-10 text-center backdrop-blur-lg md:p-14">
                    <h3 className="mb-4 text-2xl font-light text-gray-300 md:text-3xl">Прямая линия для проектных решений</h3>
                    <a
                      href="tel:+78000000000"
                      className="mb-7 block text-5xl font-black tracking-tighter transition-colors hover:text-gray-300 md:text-8xl"
                    >
                      8 800 000 00 00
                    </a>
                    <button className="border-2 border-white px-10 py-3 text-lg font-bold uppercase transition-all hover:bg-white hover:text-black md:px-14 md:py-4">
                      {sectionCta}
                    </button>
                  </div>
                </div>

                <div
                  className="absolute right-6 max-w-sm transition-all duration-1000 md:right-24"
                  style={{
                    opacity: sectionProgress > 0.58 && sectionProgress < 0.76 ? 1 : 0,
                    transform: `translateY(${(0.67 - sectionProgress) * 900}px)`,
                  }}
                >
                  <div className="border-l-4 border-white py-4 pl-7">
                    <h3 className="mb-3 text-4xl font-black uppercase">Сценарий внедрения</h3>
                    <p className="mb-5 text-gray-400">Единый roadmap от диагностики до полного операционного запуска и сопровождения.</p>
                    <button className="bg-white px-6 py-2 text-sm font-bold uppercase text-black transition-colors hover:bg-gray-300">
                      Скачать маршрут
                    </button>
                  </div>
                </div>

                <div
                  className="pointer-events-none absolute inset-0 bg-white transition-opacity duration-300"
                  style={{
                    opacity:
                      sectionProgress > 0.76 && sectionProgress < 0.86
                        ? 1 - Math.abs(0.81 - sectionProgress) * 20
                        : 0,
                  }}
                />

                <div
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 px-6 text-center transition-opacity duration-1000"
                  style={{
                    opacity: sectionProgress > 0.86 ? 1 : 0,
                    pointerEvents: sectionProgress > 0.86 ? 'auto' : 'none',
                  }}
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Раздел завершен</p>
                  <h3 className="mt-3 text-3xl font-black uppercase md:text-5xl">{sectionTitle}</h3>
                  <p className="mt-4 max-w-2xl text-gray-300">Вы дошли до конца раздела. Можно вернуться к карточкам и открыть следующее направление.</p>

                  <div className="mt-10 flex flex-col gap-4 md:flex-row">
                    <button
                      type="button"
                      onClick={() => exitToHub()}
                      className="border border-white px-8 py-4 text-sm font-black uppercase tracking-[0.18em] transition-colors hover:bg-white hover:text-black"
                    >
                      Вернуться к разделам
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="bg-white px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-black transition-colors hover:bg-gray-200"
                    >
                      Связаться с руководством
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 ${isModalOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />

        <div
          className={`relative flex h-[600px] w-full max-w-5xl flex-col overflow-hidden border border-white/20 bg-zinc-950 shadow-2xl transition-all duration-700 ease-out md:flex-row ${
            isModalOpen ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-20 scale-95 opacity-0'
          }`}
        >
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute right-6 top-4 z-20 text-4xl font-light text-white/50 transition-colors hover:text-white"
          >
            &times;
          </button>

          <div className="group relative h-64 w-full overflow-hidden bg-zinc-900 md:h-full md:w-1/2">
            <video
              src="/director.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />

            <div
              className={`absolute bottom-0 left-0 right-0 p-8 transition-all delay-300 duration-1000 ${
                isModalOpen ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
              }`}
            >
              <div className="border-l-4 border-white pl-4">
                <h4 className="text-3xl font-black uppercase tracking-wide text-white">Алексей Романов</h4>
                <p className="mb-4 text-sm uppercase tracking-widest text-gray-300">Генеральный директор</p>
                <p className="border-t border-white/20 pt-4 text-sm italic text-gray-400">
                  «Мы не продаем услуги. Мы строим партнерства на десятилетия. Оставьте заявку, и мы обсудим интеграцию наших технологий в ваш бизнес.»
                </p>
              </div>
            </div>
          </div>

          <div className="relative flex w-full flex-col justify-center p-8 md:w-1/2 md:p-12">
            <div className={`transition-all delay-500 duration-1000 ${isModalOpen ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}`}>
              <h3 className="mb-4 text-4xl font-black uppercase text-white">
                Прямой
                <br />
                контакт
              </h3>
              <p className="mb-8 text-gray-400">Заполните форму, и моя команда организует для вас персональную презентацию.</p>

              <form className="flex flex-col gap-6" onSubmit={(event) => event.preventDefault()}>
                <div className="relative">
                  <label className="absolute -top-3 left-4 bg-zinc-950 px-2 text-xs uppercase tracking-widest text-gray-500">Ваше имя</label>
                  <input
                    type="text"
                    className="w-full border border-white/30 bg-transparent px-4 py-4 text-white transition-colors focus:border-white focus:outline-none"
                  />
                </div>

                <div className="relative">
                  <label className="absolute -top-3 left-4 bg-zinc-950 px-2 text-xs uppercase tracking-widest text-gray-500">Номер телефона</label>
                  <input
                    type="tel"
                    className="w-full border border-white/30 bg-transparent px-4 py-4 text-white transition-colors focus:border-white focus:outline-none"
                  />
                </div>

                <button type="submit" className="mt-2 bg-white py-5 text-sm font-black uppercase tracking-widest text-black transition-colors hover:bg-gray-200">
                  Отправить руководству
                </button>
                <p className="mt-2 text-center text-xs text-gray-600">Ваши данные надежно зашифрованы.</p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
