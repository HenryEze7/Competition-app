import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const ADVERT_SLIDES = [
  {
    id: 1,
    title: "Double Points Weekend!",
    description: "Earn 2x points on all design and development challenges this weekend only. Top up your balance now to participate in premium tier challenges.",
    ctaText: "Top Up Now",
    bgColor: "from-indigo-600 to-purple-600",
    image: "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "Refer a Friend, Get ₦5,000",
    description: "Invite your friends to join the platform. Once they complete their first challenge, you both receive a ₦5,000 bonus instantly.",
    ctaText: "Get Invite Link",
    bgColor: "from-emerald-500 to-teal-700",
    image: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2000&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "New Premium Challenges",
    description: "Unlock high-paying premium challenges. Dedicated support and guaranteed minimum payouts for all approved submissions.",
    ctaText: "View Premium",
    bgColor: "from-orange-500 to-red-600",
    image: "https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?q=80&w=2000&auto=format&fit=crop"
  }
];

export function AdvertSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Auto-advance slides
  useEffect(() => {
    if (!isVisible) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ADVERT_SLIDES.length);
    }, 6000);
    
    return () => clearInterval(timer);
  }, [isVisible]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % ADVERT_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + ADVERT_SLIDES.length) % ADVERT_SLIDES.length);
  };

  if (!isVisible) return null;

  return (
    <div className="relative w-full max-w-5xl mx-auto mb-8 rounded-2xl overflow-hidden shadow-lg h-64 md:h-72 group bg-slate-900">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Background Image with Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
            style={{ backgroundImage: `url(${ADVERT_SLIDES[currentIndex].image})` }}
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${ADVERT_SLIDES[currentIndex].bgColor} opacity-90`} />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 text-white z-10">
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="uppercase tracking-wider font-bold text-xs mb-2 text-white/80"
            >
              Featured Promotion
            </motion.span>
            
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-4xl font-extrabold mb-3 leading-tight"
            >
              {ADVERT_SLIDES[currentIndex].title}
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-xl text-white/90 text-sm md:text-base mb-6 line-clamp-2 md:line-clamp-none"
            >
              {ADVERT_SLIDES[currentIndex].description}
            </motion.p>
            
            <motion.button 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="w-fit bg-white text-slate-900 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-slate-100 transition-colors shadow-lg hover:shadow-xl"
            >
              {ADVERT_SLIDES[currentIndex].ctaText}
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all z-20"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all z-20"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Close Button */}
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute right-4 top-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur flex items-center justify-center text-white z-20 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {ADVERT_SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
