import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, X, ZoomIn, Images } from "lucide-react";

interface Props {
  images: string[];
  alt?: string;
  className?: string;
}

export default function ImageGallery({ images, alt = "Imagem", className = "" }: Props) {
  const [current,   setCurrent]   = useState(0);
  const [lightbox,  setLightbox]  = useState(false);
  const [lbIndex,   setLbIndex]   = useState(0);
  const touchStartX = useRef<number | null>(null);
  const imgs = images.filter(Boolean);

  if (imgs.length === 0) return null;

  const prev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrent((c) => (c - 1 + imgs.length) % imgs.length);
  };
  const next = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrent((c) => (c + 1) % imgs.length);
  };

  const openLightbox = (i: number) => { setLbIndex(i); setLightbox(true); };
  const closeLightbox = () => setLightbox(false);
  const lbPrev = () => setLbIndex((i) => (i - 1 + imgs.length) % imgs.length);
  const lbNext = () => setLbIndex((i) => (i + 1) % imgs.length);

  // Keyboard
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  lbPrev();
      if (e.key === "ArrowRight") lbNext();
      if (e.key === "Escape")     closeLightbox();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  // Swipe touch na galeria principal
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };

  return (
    <>
      {/* ── Galeria principal ── */}
      <div className={`relative overflow-hidden rounded-2xl bg-slate-900 ${className}`}>
        {/* Imagem principal */}
        <div
          className="relative cursor-zoom-in select-none"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onClick={() => openLightbox(current)}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={current}
              src={imgs[current]}
              alt={`${alt} ${current + 1}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="w-full h-64 sm:h-80 object-cover"
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>

          {/* Overlay hover */}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all flex items-center justify-center">
            <div className="opacity-0 hover:opacity-100 transition-opacity bg-white/10 backdrop-blur-sm rounded-full p-3 border border-white/20">
              <ZoomIn size={22} className="text-white"/>
            </div>
          </div>

          {/* Counter */}
          {imgs.length > 1 && (
            <div className="absolute top-3 right-3 bg-slate-950/70 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-slate-700">
              <Images size={11}/>
              {current + 1}/{imgs.length}
            </div>
          )}
        </div>

        {/* Setas navegação */}
        {imgs.length > 1 && (
          <>
            <button onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-slate-950/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-slate-950/90 transition-all border border-slate-700 shadow-lg">
              <ChevronLeft size={18}/>
            </button>
            <button onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-slate-950/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-slate-950/90 transition-all border border-slate-700 shadow-lg">
              <ChevronRight size={18}/>
            </button>
          </>
        )}

        {/* Dots */}
        {imgs.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {imgs.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                className={`rounded-full transition-all duration-200 ${
                  i === current ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Miniaturas ── */}
      {imgs.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 no-scrollbar">
          {imgs.map((src, i) => (
            <button key={i} onClick={() => { setCurrent(i); }}
              className={`shrink-0 w-16 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                i === current ? "border-indigo-500 ring-1 ring-indigo-500/40" : "border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100"
              }`}>
              <img src={src} alt={`Miniatura ${i+1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
            </button>
          ))}
        </div>
      )}

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] bg-slate-950/97 backdrop-blur-xl flex flex-col"
            onClick={closeLightbox}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 shrink-0" onClick={e => e.stopPropagation()}>
              <span className="text-white font-black text-sm flex items-center gap-2">
                <Images size={16} className="text-indigo-400"/>
                {lbIndex + 1} de {imgs.length}
              </span>
              <button onClick={closeLightbox}
                className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center text-white transition-all border border-slate-700">
                <X size={20}/>
              </button>
            </div>

            {/* Imagem full */}
            <div className="flex-1 flex items-center justify-center px-4 pb-4 relative min-h-0"
              onClick={e => e.stopPropagation()}
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => {
                if (touchStartX.current === null) return;
                const diff = touchStartX.current - e.changedTouches[0].clientX;
                if (Math.abs(diff) > 50) diff > 0 ? lbNext() : lbPrev();
                touchStartX.current = null;
              }}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={lbIndex}
                  src={imgs[lbIndex]}
                  alt={`${alt} ${lbIndex + 1}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>

              {/* Setas lightbox */}
              {imgs.length > 1 && (
                <>
                  <button onClick={lbPrev}
                    className="absolute left-2 sm:left-6 w-11 h-11 bg-slate-900/80 hover:bg-slate-800 rounded-full flex items-center justify-center text-white border border-slate-700 shadow-xl transition-all">
                    <ChevronLeft size={22}/>
                  </button>
                  <button onClick={lbNext}
                    className="absolute right-2 sm:right-6 w-11 h-11 bg-slate-900/80 hover:bg-slate-800 rounded-full flex items-center justify-center text-white border border-slate-700 shadow-xl transition-all">
                    <ChevronRight size={22}/>
                  </button>
                </>
              )}
            </div>

            {/* Miniaturas lightbox */}
            {imgs.length > 1 && (
              <div className="flex gap-2 justify-center px-4 pb-5 shrink-0 overflow-x-auto no-scrollbar"
                onClick={e => e.stopPropagation()}>
                {imgs.map((src, i) => (
                  <button key={i} onClick={() => setLbIndex(i)}
                    className={`shrink-0 w-14 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                      i === lbIndex ? "border-indigo-500" : "border-slate-700 opacity-50 hover:opacity-80"
                    }`}>
                    <img src={src} alt={`thumb-${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
