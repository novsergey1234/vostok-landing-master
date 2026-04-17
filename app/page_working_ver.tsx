// 'use client';

// import { useEffect, useRef, useState } from 'react';

// export default function VostokLanding() {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const containerRef = useRef<HTMLDivElement>(null);
//   const [scrollProgress, setScrollProgress] = useState(0);

//   useEffect(() => {
//     let targetProgress = 0;
//     let currentProgress = 0;
//     let animationFrameId: number;

//     const handleScroll = () => {
//       const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
//       const maxScroll = scrollHeight - clientHeight;
//       targetProgress = Math.min(Math.max(scrollTop / maxScroll, 0), 1);
//       setScrollProgress(targetProgress);
//     };

//     const renderLoop = () => {
//       currentProgress += (targetProgress - currentProgress) * 0.05;
//       if (videoRef.current && videoRef.current.duration) {
//         videoRef.current.currentTime = videoRef.current.duration * currentProgress;
//       }
//       animationFrameId = requestAnimationFrame(renderLoop);
//     };

//     window.addEventListener('scroll', handleScroll);
//     animationFrameId = requestAnimationFrame(renderLoop);

//     return () => {
//       window.removeEventListener('scroll', handleScroll);
//       cancelAnimationFrame(animationFrameId);
//     };
//   }, []);

//   return (
//     // Увеличили высоту до 1200vh для долгого и плавного пути
//     <div ref={containerRef} className="relative h-[1200vh] bg-black text-white font-sans overflow-x-hidden">
      
//       <div className="fixed top-0 left-0 h-screen w-full overflow-hidden flex items-center justify-center">

//         {/* Видео */}
//         <video
//           ref={videoRef}
//           src="promo.mp4" 
//           className="absolute top-0 left-0 w-full h-full object-cover opacity-60"
//           muted
//           playsInline
//           preload="auto"
//         />

//         {/* Затемнение для читаемости */}
//         <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />

//         {/* ========================================== */}
//         {/* СЦЕНА 1: Интро (0% - 8%) */}
//         {/* ========================================== */}
//         <div 
//           className="absolute flex flex-col items-center transition-all duration-1000"
//           style={{ 
//             opacity: scrollProgress < 0.08 ? 1 : 0, 
//             transform: `translateY(${scrollProgress * 200}px)`,
//             pointerEvents: scrollProgress < 0.08 ? 'auto' : 'none' 
//           }}
//         >
//           <h1 className="text-6xl md:text-9xl font-black tracking-tighter uppercase mb-2">Восток-Холдинг</h1>
//           <p className="text-xl tracking-widest text-gray-400">СЕРДЦЕ ИННОВАЦИЙ</p>
//         </div>

//         {/* ========================================== */}
//         {/* СЦЕНА 2: Карточка 1 - Масштаб (10% - 20%) */}
//         {/* ========================================== */}
//         <div 
//           className="absolute left-10 md:left-20 max-w-sm transition-all duration-1000"
//           style={{ 
//             opacity: scrollProgress > 0.1 && scrollProgress < 0.22 ? 1 : 0,
//             transform: `translateX(${(0.15 - scrollProgress) * 300}px)`,
//             filter: `blur(${scrollProgress > 0.1 && scrollProgress < 0.22 ? 0 : 10}px)`
//           }}
//         >
//           <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-3xl">
//             <div className="text-5xl font-black mb-2">40+</div>
//             <h3 className="text-xl font-bold uppercase mb-4">Регионов присутствия</h3>
//             <p className="text-gray-300 text-sm mb-6">Глобальная инфраструктура, обеспечивающая бесперебойную работу вашего бизнеса 24/7.</p>
//             <button className="text-xs font-bold uppercase border-b border-white pb-1 hover:text-gray-400 transition-colors">Узнать больше</button>
//           </div>
//         </div>

//         {/* ========================================== */}
//         {/* СЦЕНА 3: Первый Call to Action (22% - 32%) */}
//         {/* ========================================== */}
//         <div 
//           className="absolute right-10 md:right-20 max-w-md transition-all duration-1000"
//           style={{ 
//             opacity: scrollProgress > 0.22 && scrollProgress < 0.34 ? 1 : 0,
//             transform: `translateY(${(0.28 - scrollProgress) * -400}px)`,
//           }}
//         >
//           <div className="bg-black/60 backdrop-blur-md border border-gray-600 p-8">
//             <h2 className="text-3xl font-black uppercase mb-2">Время — деньги</h2>
//             <p className="text-gray-400 text-sm mb-6">Оставьте номер, и наш ведущий эксперт свяжется с вами через 2 минуты.</p>
//             <div className="flex flex-col gap-3">
//               <input type="tel" placeholder="+7 (999) 000-00-00" className="bg-white/10 border border-white/30 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors" />
//               <button className="bg-white text-black font-bold uppercase py-3 hover:bg-gray-200 transition-colors">Жду звонка</button>
//             </div>
//           </div>
//         </div>

//         {/* ========================================== */}
//         {/* СЦЕНА 4: Карточка 2 - Экосистема (35% - 48%) */}
//         {/* ========================================== */}
//         <div 
//           className="absolute left-10 md:left-32 max-w-lg transition-all duration-1000"
//           style={{ 
//             opacity: scrollProgress > 0.35 && scrollProgress < 0.5 ? 1 : 0,
//             transform: `translateX(${(0.42 - scrollProgress) * -200}px)`,
//           }}
//         >
//           <h2 className="text-5xl md:text-7xl font-black uppercase leading-none mb-6">Закрытая<br/>Экосистема</h2>
//           <div className="grid grid-cols-2 gap-4">
//             <div className="bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
//               <div className="text-2xl font-bold mb-2">AI Core</div>
//               <p className="text-xs text-gray-400">Собственные нейросети для предиктивной аналитики.</p>
//             </div>
//             <div className="bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
//               <div className="text-2xl font-bold mb-2">FinTech</div>
//               <p className="text-xs text-gray-400">Защищенные шлюзы и смарт-контракты.</p>
//             </div>
//           </div>
//         </div>

//         {/* ========================================== */}
//         {/* СЦЕНА 5: Агрессивный CTA звонка (52% - 65%) */}
//         {/* ========================================== */}
//         <div 
//           className="absolute flex flex-col items-center justify-center transition-all duration-1000 w-full"
//           style={{ 
//             opacity: scrollProgress > 0.52 && scrollProgress < 0.68 ? 1 : 0,
//             transform: `scale(${scrollProgress > 0.52 && scrollProgress < 0.68 ? 1 : 0.8})`,
//             pointerEvents: scrollProgress > 0.52 && scrollProgress < 0.68 ? 'auto' : 'none'
//           }}
//         >
//           <div className="text-center bg-black/50 p-12 backdrop-blur-lg w-full">
//             <h2 className="text-3xl font-light text-gray-300 mb-4">ПРЯМАЯ ЛИНИЯ ДЛЯ VIP КЛИЕНТОВ</h2>
//             <a href="tel:+78000000000" className="text-6xl md:text-8xl font-black tracking-tighter hover:text-gray-300 transition-colors block mb-8">
//               8 800 000 00 00
//             </a>
//             <p className="text-xl mb-8">Или назначьте встречу в нашем офисе.</p>
//             <button className="border-2 border-white px-12 py-4 text-xl font-bold uppercase hover:bg-white hover:text-black transition-all">
//               Забронировать визит
//             </button>
//           </div>
//         </div>

//         {/* ========================================== */}
//         {/* СЦЕНА 6: Карточка 3 - Безопасность (70% - 80%) */}
//         {/* ========================================== */}
//         <div 
//           className="absolute right-10 md:right-32 max-w-sm transition-all duration-1000"
//           style={{ 
//             opacity: scrollProgress > 0.7 && scrollProgress < 0.82 ? 1 : 0,
//             transform: `translateY(${(0.76 - scrollProgress) * 300}px)`,
//           }}
//         >
//            <div className="border-l-4 border-white pl-8 py-4">
//             <h3 className="text-4xl font-black uppercase mb-4">Уровень защиты: Титан</h3>
//             <p className="text-gray-400 mb-6">Ваши данные защищены алгоритмами квантового шифрования. Никаких утечек. Полная конфиденциальность.</p>
//             <button className="bg-white text-black px-6 py-2 font-bold uppercase text-sm hover:bg-gray-300">Скачать аудит безопасности</button>
//           </div>
//         </div>

//         {/* ========================================== */}
//         {/* СЦЕНА 7: ВСПЫШКА (83% - 88%) */}
//         {/* ========================================== */}
//         <div 
//           className="absolute inset-0 bg-white pointer-events-none transition-opacity duration-300"
//           style={{ 
//             opacity: scrollProgress > 0.83 && scrollProgress < 0.89 
//               ? 1 - Math.abs(0.86 - scrollProgress) * 20 
//               : 0 
//           }}
//         />

//         {/* ========================================== */}
//         {/* СЦЕНА 8: Финальный экран выбора и финальный CTA (88% - 100%) */}
//         {/* ========================================== */}
//         <div 
//           className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 transition-opacity duration-1000"
//           style={{ 
//             opacity: scrollProgress > 0.88 ? 1 : 0,
//             pointerEvents: scrollProgress > 0.88 ? 'auto' : 'none'
//           }}
//         >
//           <h2 className="text-4xl md:text-5xl font-black mb-12 uppercase tracking-widest text-white text-center">
//             Ваш следующий шаг
//           </h2>
          
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl px-8 mb-12">
//             {/* Карточки направлений */}
//             <div className="group relative h-80 border border-white/20 hover:border-white p-6 flex flex-col justify-end cursor-pointer overflow-hidden transition-all duration-500 hover:bg-white/5">
//               <div className="text-sm font-bold text-gray-500 mb-2">01</div>
//               <h3 className="text-2xl font-black uppercase mb-2">Инвестиции</h3>
//               <p className="text-sm text-gray-400">Доступ к закрытому клубу инвесторов.</p>
//             </div>
//             <div className="group relative h-80 border border-white/20 hover:border-white p-6 flex flex-col justify-end cursor-pointer overflow-hidden transition-all duration-500 hover:bg-white/5">
//               <div className="text-sm font-bold text-gray-500 mb-2">02</div>
//               <h3 className="text-2xl font-black uppercase mb-2">B2B Решения</h3>
//               <p className="text-sm text-gray-400">Внедрение ИИ в ваши бизнес-процессы.</p>
//             </div>
//             <div className="group relative h-80 bg-white text-black p-6 flex flex-col justify-end cursor-pointer overflow-hidden transition-all duration-500 hover:bg-gray-200">
//               <div className="text-sm font-bold text-gray-600 mb-2">03</div>
//               <h3 className="text-2xl font-black uppercase mb-2">О Холдинге</h3>
//               <p className="text-sm text-gray-800">Узнайте, кто стоит за технологиями.</p>
//             </div>
//           </div>

//           {/* Финальный конверсионный блок */}
//           <div className="flex flex-col md:flex-row items-center gap-6 border-t border-white/20 pt-8 w-full max-w-4xl px-8 justify-between">
//              <div className="text-left">
//                 <p className="text-gray-400 uppercase text-sm mb-1">Горячая линия</p>
//                 <a href="tel:+78000000000" className="text-3xl font-bold hover:text-gray-300">8 800 000 00 00</a>
//              </div>
//              <button className="bg-white text-black px-10 py-4 font-black uppercase tracking-wider hover:scale-105 transition-transform">
//                Связаться с руководством
//              </button>
//           </div>
//         </div>

//       </div>
//     </div>
//   );
// }
