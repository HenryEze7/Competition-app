import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Play, Eye, MoreHorizontal } from 'lucide-react';

const REELS_DATA = [
  {
    id: '1',
    title: 'Top 5 Design Patterns for 2026',
    creator: 'DesignMaster',
    views: '124K',
    image: 'https://images.unsplash.com/photo-1616469829941-c7200edec809?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: '2',
    title: 'How to win premium challenges',
    creator: 'CodeNinja',
    views: '89K',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: '3',
    title: 'UI/UX Tips in 60 Seconds',
    creator: 'SarahUX',
    views: '210K',
    image: 'https://images.unsplash.com/photo-1541462608143-67571c6738dd?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: '4',
    title: 'My coding setup!',
    creator: 'DevLife',
    views: '45K',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: '5',
    title: 'Secret CSS Tricks',
    creator: 'FrontendWizard',
    views: '332K',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: '6',
    title: 'A day in the life of a dev',
    creator: 'TechBro',
    views: '1.2M',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600&auto=format&fit=crop'
  }
];

export function ReelsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Play className="w-5 h-5 text-indigo-600 fill-indigo-600" />
          Trending Reels
        </h2>
        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
          View all
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {REELS_DATA.map((reel, idx) => (
          <motion.div
            key={reel.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative flex-none w-40 sm:w-48 aspect-[9/16] rounded-2xl overflow-hidden snap-start group cursor-pointer bg-slate-900"
          >
            {/* Thumbnail */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
              style={{ backgroundImage: `url(${reel.image})` }}
            />
            
            {/* Top Gradient for icons */}
            <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/60 to-transparent" />
            
            {/* Bottom Gradient for text */}
            <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
            
            {/* Top Info */}
            <div className="absolute top-3 right-3 text-white">
              <MoreHorizontal className="w-5 h-5 opacity-70 hover:opacity-100" />
            </div>

            {/* Center Play Button (appears on hover) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-white ml-1" />
              </div>
            </div>
            
            {/* Bottom Info */}
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <div className="flex items-center gap-1.5 mb-1.5 text-xs font-medium text-white/90">
                <Eye className="w-3.5 h-3.5" />
                {reel.views}
              </div>
              <h3 className="font-bold text-sm leading-tight line-clamp-2 mb-1 shadow-sm">
                {reel.title}
              </h3>
              <p className="text-xs text-white/70 truncate">
                @{reel.creator}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
