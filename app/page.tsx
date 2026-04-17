'use client';

import { useEffect, useRef, useState } from 'react';

const FRAME_TOTALS: Record<string, number> = {
  '/frames/desktop/truck': 410,
  '/frames/mobile/promo': 1811,
};
const DEFAULT_TOTAL_FRAMES = 410;
const FRAME_NAME_PREFIX = 'frame_';
const FRAME_NAME_PADDING = 4;

export default function VostokLanding() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const pendingFramesRef = useRef<Set<string>>(new Set());
  const currentFrameRef = useRef(1);
  const isModalOpenRef = useRef(false);
  const isFramesReadyRef = useRef(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [frameFolder, setFrameFolder] = useState('/frames/desktop/truck');
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [isFramesReady, setIsFramesReady] = useState(false);
  
  // Новое состояние для управления модальным окном
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Определение мобильного устройства при монтировании и ресайзе
  useEffect(() => {
    const updateFolder = () => {
      // breakpoint 768px для перехода на мобильные кадры
      setFrameFolder(window.innerWidth < 768 ? '/frames/mobile/promo' : '/frames/desktop/truck');
    };
    updateFolder();
    window.addEventListener('resize', updateFolder);
    return () => window.removeEventListener('resize', updateFolder);
  }, []);

  // Блокируем скролл фона, когда открыто окно
  useEffect(() => {
    isModalOpenRef.current = isModalOpen;
    isFramesReadyRef.current = isFramesReady;

    if (isModalOpen || !isFramesReady) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isModalOpen, isFramesReady]);

  // Основной цикл анимации скролла
  useEffect(() => {
    const totalFrames = FRAME_TOTALS[frameFolder] ?? DEFAULT_TOTAL_FRAMES;
    let targetProgress = 0;
    let currentProgress = 0;
    let animationFrameId: number;
    let lastRenderedFrame = 0;
    let isCancelled = false;

    frameCacheRef.current.clear();
    pendingFramesRef.current.clear();
    currentFrameRef.current = 1;
    isFramesReadyRef.current = false;

    const normalizeFrameIndex = (index: number) => {
      return Math.min(Math.max(index, 1), totalFrames);
    };

    const getFramePath = (index: number) => {
      const safeIndex = normalizeFrameIndex(index);
      return `${frameFolder}/${FRAME_NAME_PREFIX}${String(safeIndex).padStart(FRAME_NAME_PADDING, '0')}.webp`;
    };

    const getFrameKey = (index: number) => {
      return `${frameFolder}_${normalizeFrameIndex(index)}`;
    };

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
      context.globalAlpha = 0.6;
      context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
      context.globalAlpha = 1;
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

    const handleScroll = () => {
      // Если модалка открыта, не обновляем прогресс скролла
      if (isModalOpenRef.current || !isFramesReadyRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const maxScroll = Math.max(scrollHeight - clientHeight, 1);
      targetProgress = Math.min(Math.max(scrollTop / maxScroll, 0), 1);
      setScrollProgress(targetProgress);
    };

    const handleResize = () => {
      if (!drawFrameFromCache(currentFrameRef.current)) {
        preloadFrame(currentFrameRef.current);
      }
    };

    const renderLoop = () => {
      if (isCancelled) {
        return;
      }

      currentProgress += (targetProgress - currentProgress) * 0.05;
      const nextFrame = Math.round(currentProgress * (totalFrames - 1)) + 1;

      if (nextFrame !== lastRenderedFrame) {
        renderFrame(nextFrame);
        lastRenderedFrame = nextFrame;
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    const startAnimation = () => {
      if (isCancelled) {
        return;
      }

      handleScroll();
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleResize);
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    const runPreload = async () => {
      setScrollProgress(0);
      setPreloadProgress(0);
      setIsFramesReady(false);

      const frameIndexes = Array.from({ length: totalFrames }, (_, index) => index + 1);
      const workers = Math.min(8, frameIndexes.length);
      let cursor = 0;
      let loaded = 0;

      // Количество кадров для старта, например 30, чтобы не ждать все 1800
      const framesToStart = Math.min(Math.floor(totalFrames*0.4), totalFrames);

      const updateProgress = () => {
        // Прогресс бар будет работать до загрузки всех кадров, но экран пропадет раньше
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

          // Запускаем анимацию и скрываем лоадер, как только загрузились первые N кадров
          if (loaded === framesToStart) {
            isFramesReadyRef.current = true;
            setIsFramesReady(true);
            startAnimation();
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
        startAnimation();
      }
    };

    runPreload();

    return () => {
      isCancelled = true;
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [frameFolder]);

  return (
    <>
      <div ref={containerRef} className="relative h-[1200vh] bg-black text-white font-sans">
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">

          {!isFramesReady && (
            <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center gap-5">
              <p className="text-sm uppercase tracking-[0.3em] text-gray-300">Подготовка кадров</p>
              <div className="w-[80vw] max-w-lg h-2 bg-white/10 overflow-hidden">
                <div className="h-full bg-white transition-all duration-150" style={{ width: `${preloadProgress}%` }} />
              </div>
              <p className="text-2xl font-bold tabular-nums">{preloadProgress}%</p>
            </div>
          )}
          
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />

          {/* ... СЦЕНЫ 1-7 ОСТАЮТСЯ БЕЗ ИЗМЕНЕНИЙ (сократил для читаемости, они те же самые) ... */}
          
          <div className="absolute flex flex-col items-center transition-all duration-1000" style={{ opacity: scrollProgress < 0.04 ? 1 : 0, transform: `translateY(${scrollProgress * 200}px)`, pointerEvents: scrollProgress < 0.05 ? 'auto' : 'none' }}>
            <h1 className="text-6xl md:text-9xl font-black tracking-tighter uppercase mb-2">Восток-Холдинг</h1>
            <p className="text-xl tracking-widest text-gray-400">СЕРДЦЕ ИННОВАЦИЙ</p>
          </div>

          <div className="absolute left-10 md:left-20 max-w-sm transition-all duration-1000" style={{ opacity: scrollProgress > 0.04 && scrollProgress < 0.08 ? 1 : 0, transform: `translateX(${(0.07 - scrollProgress) * 300}px)`, filter: `blur(${scrollProgress > 0.10 && scrollProgress < 0.25 ? 0 : 10}px)` }}>
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-3xl">
              <div className="text-5xl font-black mb-2">40+</div>
              <h3 className="text-xl font-bold uppercase mb-4">Регионов присутствия</h3>
              <p className="text-gray-300 text-sm mb-6">Глобальная инфраструктура, обеспечивающая бесперебойную работу бизнеса 24/7.</p>
              <button className="text-xs font-bold uppercase border-b border-white pb-1 hover:text-gray-400 transition-colors">Узнать больше</button>
            </div>
          </div>

          <div className="absolute right-10 md:right-20 max-w-md transition-all duration-1000" style={{ opacity: scrollProgress > 0.08 && scrollProgress < 0.12 ? 1 : 0, transform: `translateY(${(0.11 - scrollProgress) * -400}px)` }}>
            <div className="bg-black/60 backdrop-blur-md border border-gray-600 p-8">
              <h2 className="text-3xl font-black uppercase mb-2">Время — деньги</h2>
              <p className="text-gray-400 text-sm mb-6">Оставьте номер, и наш эксперт свяжется с вами через 2 минуты.</p>
              <div className="flex flex-col gap-3">
                <input type="tel" placeholder="+7 (999) 000-00-00" className="bg-white/10 border border-white/30 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors" />
                <button className="bg-white text-black font-bold uppercase py-3 hover:bg-gray-200 transition-colors">Жду звонка</button>
              </div>
            </div>
          </div>

          <div className="absolute left-10 md:left-32 max-w-lg transition-all duration-1000" style={{ opacity: scrollProgress > 0.12 && scrollProgress < 0.20 ? 1 : 0, transform: `translateX(${(0.45 - scrollProgress) * -200}px)` }}>
            <h2 className="text-5xl md:text-7xl font-black uppercase leading-none mb-6">Закрытая<br/>Экосистема</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
                <div className="text-2xl font-bold mb-2">AI Core</div>
                <p className="text-xs text-gray-400">Собственные нейросети.</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
                <div className="text-2xl font-bold mb-2">FinTech</div>
                <p className="text-xs text-gray-400">Защищенные шлюзы.</p>
              </div>
            </div>
          </div>

          <div className="absolute flex flex-col items-center justify-center transition-all duration-1000 w-full" style={{ opacity: scrollProgress > 0.20 && scrollProgress < 0.30 ? 1 : 0, transform: `scale(${scrollProgress > 0.52 && scrollProgress < 0.72 ? 1 : 0.8})`, pointerEvents: scrollProgress > 0.52 && scrollProgress < 0.72 ? 'auto' : 'none' }}>
            <div className="text-center bg-black/50 p-12 backdrop-blur-lg w-full">
              <h2 className="text-3xl font-light text-gray-300 mb-4">ПРЯМАЯ ЛИНИЯ ДЛЯ VIP КЛИЕНТОВ</h2>
              <a href="tel:+78000000000" className="text-6xl md:text-8xl font-black tracking-tighter hover:text-gray-300 transition-colors block mb-8">8 800 000 00 00</a>
              <button className="border-2 border-white px-12 py-4 text-xl font-bold uppercase hover:bg-white hover:text-black transition-all">Забронировать визит</button>
            </div>
          </div>

          <div className="absolute right-10 md:right-32 max-w-sm transition-all duration-1000" style={{ opacity: scrollProgress > 0.30 && scrollProgress < 0.34 ? 1 : 0, transform: `translateY(${(0.76 - scrollProgress) * 300}px)` }}>
             <div className="border-l-4 border-white pl-8 py-4">
              <h3 className="text-4xl font-black uppercase mb-4">Уровень защиты: Титан</h3>
              <p className="text-gray-400 mb-6">Ваши данные защищены алгоритмами квантового шифрования.</p>
              <button className="bg-white text-black px-6 py-2 font-bold uppercase text-sm hover:bg-gray-300">Скачать аудит</button>
            </div>
          </div>
          
          <div className="absolute right-10 md:right-32 max-w-sm transition-all duration-1000" style={{ opacity: scrollProgress > 0.34 && scrollProgress < 0.38 ? 1 : 0, transform: `translateY(${(0.62 - scrollProgress) * 800}px)` }}>
             <div className="border-l-4 border-white pl-8 py-4">
              <h3 className="text-4xl font-black uppercase mb-4">Уровень защиты: Титан</h3>
              <p className="text-gray-400 mb-6">Ваши данные защищены алгоритмами квантового шифрования.</p>
              <button className="bg-white text-black px-6 py-2 font-bold uppercase text-sm hover:bg-gray-300">Скачать аудит</button>
            </div>
          </div>

          <div className="absolute right-10 md:right-32 max-w-sm transition-all duration-1000" style={{ opacity: scrollProgress > 0.38 && scrollProgress < 0.42 ? 1 : 0, transform: `translateY(${(0.66 - scrollProgress) * 800}px)` }}>
             <div className="border-l-4 border-white pl-8 py-4">
              <h3 className="text-4xl font-black uppercase mb-4">Корпоративный AI</h3>
              <p className="text-gray-400 mb-6">Нейросети для предиктивной аналитики и снижения издержек на 40%.</p>
              <button className="bg-white text-black px-6 py-2 font-bold uppercase text-sm hover:bg-gray-300">Демонстрация</button>
            </div>
          </div>

          <div className="absolute left-10 md:left-20 max-w-sm transition-all duration-1000" style={{ opacity: scrollProgress > 0.42 && scrollProgress < 0.46 ? 1 : 0, transform: `translateY(${(0.68 - scrollProgress) * 800}px)` }}>
             <div className="border-l-4 border-white pl-8 py-4">
              <h3 className="text-4xl font-black uppercase mb-4">Финансовый HUB</h3>
              <p className="text-gray-400 mb-6">Мгновенные кроссбордерные транзакции с нулевой задержкой и комиссией.</p>
              <button className="bg-white text-black px-6 py-2 font-bold uppercase text-sm hover:bg-gray-300">Открыть счет</button>
            </div>
          </div>

          <div className="absolute right-10 md:right-32 max-w-sm transition-all duration-1000" style={{ opacity: scrollProgress > 0.46 && scrollProgress < 0.50 ? 1 : 0, transform: `translateY(${(0.70 - scrollProgress) * 800}px)` }}>
             <div className="border-l-4 border-white pl-8 py-4">
              <h3 className="text-4xl font-black uppercase mb-4">Роботизация 4.0</h3>
              <p className="text-gray-400 mb-6">Интеллектуальное машинное зрение для контроля качества на производстве.</p>
              <button className="bg-white text-black px-6 py-2 font-bold uppercase text-sm hover:bg-gray-300">Смотреть кейсы</button>
            </div>
          </div>

          <div className="absolute left-10 md:left-20 max-w-sm transition-all duration-1000" style={{ opacity: scrollProgress > 0.50 && scrollProgress < 0.54 ? 1 : 0, transform: `translateY(${(0.72 - scrollProgress) * 800}px)` }}>
             <div className="border-l-4 border-white pl-8 py-4">
              <h3 className="text-4xl font-black uppercase mb-4">Распределенные ЦОД</h3>
              <p className="text-gray-400 mb-6">Серверная инфраструктура стандарта Tier IV для доступности 99.99%.</p>
              <button className="bg-white text-black px-6 py-2 font-bold uppercase text-sm hover:bg-gray-300">Выбрать тариф</button>
            </div>
          </div>

          <div className="absolute right-10 md:right-32 max-w-sm transition-all duration-1000" style={{ opacity: scrollProgress > 0.54 && scrollProgress < 0.58 ? 1 : 0, transform: `translateY(${(0.74 - scrollProgress) * 800}px)` }}>
             <div className="border-l-4 border-white pl-8 py-4">
              <h3 className="text-4xl font-black uppercase mb-4">Управление активами</h3>
              <p className="text-gray-400 mb-6">Диверсификация портфеля с использованием алгоритмического трейдинга.</p>
              <button className="bg-white text-black px-6 py-2 font-bold uppercase text-sm hover:bg-gray-300">Инвестировать</button>
            </div>
          </div>

          <div className="absolute left-10 md:left-20 max-w-sm transition-all duration-1000" style={{ opacity: scrollProgress > 0.58 && scrollProgress < 0.62 ? 1 : 0, transform: `translateY(${(0.76 - scrollProgress) * 800}px)` }}>
             <div className="border-l-4 border-white pl-8 py-4">
              <h3 className="text-4xl font-black uppercase mb-4">Big Data Аналитика</h3>
              <p className="text-gray-400 mb-6">Конвертация терабайтов сырых данных в реальные бизнес-инсайты on-the-fly.</p>
              <button className="bg-white text-black px-6 py-2 font-bold uppercase text-sm hover:bg-gray-300">Запросить отчет</button>
            </div>
          </div>

          <div className="absolute right-10 md:right-32 max-w-sm transition-all duration-1000" style={{ opacity: scrollProgress > 0.62 && scrollProgress < 0.66 ? 1 : 0, transform: `translateY(${(0.78 - scrollProgress) * 800}px)` }}>
             <div className="border-l-4 border-white pl-8 py-4">
              <h3 className="text-4xl font-black uppercase mb-4">B2B Коммерция</h3>
              <p className="text-gray-400 mb-6">Единая цифровая платформа для закупок без региональных ограничений.</p>
              <button className="bg-white text-black px-6 py-2 font-bold uppercase text-sm hover:bg-gray-300">Получить доступ</button>
            </div>
          </div>

          <div className="absolute left-10 md:left-20 max-w-sm transition-all duration-1000" style={{ opacity: scrollProgress > 0.66 && scrollProgress < 0.70 ? 1 : 0, transform: `translateY(${(0.80 - scrollProgress) * 800}px)` }}>
             <div className="border-l-4 border-white pl-8 py-4">
              <h3 className="text-4xl font-black uppercase mb-4">BioTech Решения</h3>
              <p className="text-gray-400 mb-6">Синтез инновационных материалов с помощью компьютерного моделирования.</p>
              <button className="bg-white text-black px-6 py-2 font-bold uppercase text-sm hover:bg-gray-300">Читать whitepaper</button>
            </div>
          </div>

          <div className="absolute right-10 md:right-32 max-w-sm transition-all duration-1000" style={{ opacity: scrollProgress > 0.70 && scrollProgress < 0.74 ? 1 : 0, transform: `translateY(${(0.82 - scrollProgress) * 800}px)` }}>
             <div className="border-l-4 border-white pl-8 py-4">
              <h3 className="text-4xl font-black uppercase mb-4">Протокол Zero-Trust</h3>
              <p className="text-gray-400 mb-6">Многоуровневая биометрическая аутентификация для топ-менеджмента.</p>
              <button className="bg-white text-black px-6 py-2 font-bold uppercase text-sm hover:bg-gray-300">Интеграция</button>
            </div>
          </div>

          <div className="absolute left-10 md:left-20 max-w-sm transition-all duration-1000" style={{ opacity: scrollProgress > 0.74 && scrollProgress < 0.80 ? 1 : 0, transform: `translateY(${(0.84 - scrollProgress) * 800}px)` }}>
             <div className="border-l-4 border-white pl-8 py-4">
              <h3 className="text-4xl font-black uppercase mb-4">Устойчивое развитие</h3>
              <p className="text-gray-400 mb-6">Внедрение ESG-стандартов для минимизации углеродного следа производств.</p>
              <button className="bg-white text-black px-6 py-2 font-bold uppercase text-sm hover:bg-gray-300">ESG Отчет</button>
            </div>
          </div>
          
          <div className="absolute inset-0 bg-white pointer-events-none transition-opacity duration-300" style={{ opacity: scrollProgress > 0.80 && scrollProgress < 0.89 ? 1 - Math.abs(0.86 - scrollProgress) * 20 : 0 }} />

          {/* ========================================== */}
          {/* СЦЕНА 8: Финальный экран */}
          {/* ========================================== */}
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 transition-opacity duration-1000"
            style={{ 
              opacity: scrollProgress > 0.88 ? 1 : 0,
              pointerEvents: scrollProgress > 0.88 ? 'auto' : 'none'
            }}
          >
            <h2 className="text-4xl md:text-5xl font-black mb-12 uppercase tracking-widest text-white text-center">Ваш следующий шаг</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl px-8 mb-12">
              <div className="group relative h-80 border border-white/20 hover:border-white p-6 flex flex-col justify-end cursor-pointer overflow-hidden transition-all duration-500 hover:bg-white/5">
                <div className="text-sm font-bold text-gray-500 mb-2">01</div>
                <h3 className="text-2xl font-black uppercase mb-2">Инвестиции</h3>
              </div>
              <div className="group relative h-80 border border-white/20 hover:border-white p-6 flex flex-col justify-end cursor-pointer overflow-hidden transition-all duration-500 hover:bg-white/5">
                <div className="text-sm font-bold text-gray-500 mb-2">02</div>
                <h3 className="text-2xl font-black uppercase mb-2">B2B Решения</h3>
              </div>
              <div className="group relative h-80 bg-white text-black p-6 flex flex-col justify-end cursor-pointer overflow-hidden transition-all duration-500 hover:bg-gray-200">
                <div className="text-sm font-bold text-gray-600 mb-2">03</div>
                <h3 className="text-2xl font-black uppercase mb-2">О Холдинге</h3>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6 border-t border-white/20 pt-8 w-full max-w-4xl px-8 justify-between">
               <div className="text-left">
                  <p className="text-gray-400 uppercase text-sm mb-1">Горячая линия</p>
                  <a href="tel:+78000000000" className="text-3xl font-bold hover:text-gray-300">8 800 000 00 00</a>
               </div>
               {/* КНОПКА ВЫЗОВА ОКНА */}
               <button 
                 onClick={() => setIsModalOpen(true)}
                 className="bg-white text-black px-10 py-4 font-black uppercase tracking-wider hover:scale-105 transition-transform"
               >
                 Связаться с руководством
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* МОДАЛЬНОЕ ОКНО (ПОПАП) С ДИРЕКТОРОМ */}
      {/* ========================================== */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 ${isModalOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        
        {/* Затемненный фон по клику на который окно закрывается */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-md" 
          onClick={() => setIsModalOpen(false)} 
        />

        {/* Само окно */}
        <div className={`relative w-full max-w-5xl h-[600px] bg-zinc-950 border border-white/20 shadow-2xl flex flex-col md:flex-row overflow-hidden transition-all duration-700 ease-out ${isModalOpen ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-20 scale-95 opacity-0'}`}>
          
          {/* Кнопка закрытия */}
          <button 
            onClick={() => setIsModalOpen(false)} 
            className="absolute top-4 right-6 z-20 text-white/50 hover:text-white text-4xl font-light transition-colors"
          >
            &times;
          </button>

          {/* Левая часть: Видео директора */}
          <div className="w-full md:w-1/2 h-64 md:h-full relative bg-zinc-900 overflow-hidden group">
            <video 
              src="/director.mp4" 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Градиент для читаемости текста */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
            
            {/* Выезжающая плашка с информацией */}
            <div className={`absolute bottom-0 left-0 right-0 p-8 transition-all duration-1000 delay-300 ${isModalOpen ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
              <div className="border-l-4 border-white pl-4">
                <h4 className="text-3xl font-black uppercase tracking-wide text-white">Алексей Романов</h4>
                <p className="text-gray-300 text-sm uppercase tracking-widest mb-4">Генеральный директор</p>
                <p className="text-gray-400 text-sm italic border-t border-white/20 pt-4">
                  «Мы не продаем услуги. Мы строим партнерства на десятилетия. Оставьте заявку, и мы обсудим интеграцию наших технологий в ваш бизнес.»
                </p>
              </div>
            </div>
          </div>

          {/* Правая часть: Форма захвата */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
            <div className={`transition-all duration-1000 delay-500 ${isModalOpen ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}`}>
              <h3 className="text-4xl font-black uppercase mb-4 text-white" >Прямой<br/>контакт</h3>
              <p className="text-gray-400 mb-8">Заполните форму, и моя команда организует для вас персональную презентацию.</p>
              
              <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
                <div className="relative">
                  <label className="text-xs text-gray-500 uppercase tracking-widest absolute -top-3 left-4 bg-zinc-950 px-2">Ваше имя</label>
                  <input type="text" className="w-full bg-transparent border border-white/30 px-4 py-4 text-white focus:outline-none focus:border-white transition-colors" />
                </div>
                
                <div className="relative">
                  <label className="text-xs text-gray-500 uppercase tracking-widest absolute -top-3 left-4 bg-zinc-950 px-2">Номер телефона</label>
                  <input type="tel" className="w-full bg-transparent border border-white/30 px-4 py-4 text-white focus:outline-none focus:border-white transition-colors" />
                </div>

                <button type="submit" className="bg-white text-black font-black uppercase tracking-widest py-5 mt-2 hover:bg-gray-200 transition-colors">
                  Отправить руководству
                </button>
                <p className="text-xs text-gray-600 text-center mt-2">Ваши данные надежно зашифрованы.</p>
              </form>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
