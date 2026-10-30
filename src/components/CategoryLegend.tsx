import { useState, useEffect } from 'react';
import { Palette, ChevronUp, X } from 'lucide-react';
import { SUBJECTS } from '../data';

interface CategoryLegendProps {
  activeSubject: string;
  onSelectSubject: (subject: string) => void;
  hideOnMobile?: boolean;
}

export default function CategoryLegend({
  activeSubject,
  onSelectSubject,
  hideOnMobile = false
}: CategoryLegendProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 640 : false));

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // On mobile screens, SubjectFilter at bottom serves all category switching needs.
  if (hideOnMobile || isMobile) return null;

  const OFFICIAL_KEYS = ['english', 'hindi', 'sanskrit', 'kannada', 'math', 'science', 'social', 'commerce', 'cs'];
  const subjectEntries = OFFICIAL_KEYS
    .map(k => [k, SUBJECTS[k]] as [string, (typeof SUBJECTS)[string]])
    .filter(([_, info]) => !!info);

  return (
    <div className="hidden sm:block fixed bottom-16 sm:bottom-20 left-2.5 sm:left-5 z-20 pointer-events-auto font-sans">
      {isOpen ? (
        <div className="liquid-glass-dock p-3.5 rounded-2xl animate-in fade-in zoom-in-95 duration-150 max-w-[240px] text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/[0.06]">
            <div className="flex items-center gap-1.5 font-extrabold text-neutral-950 text-xs">
              <Palette className="w-3.5 h-3.5 text-indigo-600" />
              <span>Categories</span>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
              }}
              className="apple-press w-6 h-6 flex items-center justify-center text-slate-400 hover:text-neutral-900 rounded-lg liquid-glass-btn"
              aria-label="Close legend"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5">
            {subjectEntries.map(([key, info]) => {
              const isActive = activeSubject === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    onSelectSubject(isActive ? 'all' : key);
                  }}
                  className={`apple-press w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-neutral-950 text-white font-bold shadow-sm border border-white/30'
                      : 'liquid-glass-btn text-slate-800 hover:text-black font-semibold'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs mt-0.5"
                    style={{ backgroundColor: info.css }}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="truncate text-xs block">{info.label}</span>
                    {info.topic && (
                      <span className={`text-[10px] block truncate leading-none mt-0.5 ${isActive ? 'text-neutral-300' : 'text-slate-500'}`}>
                        {info.topic}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            setIsOpen(true);
          }}
          className="apple-press min-h-[42px] px-4 py-2 rounded-2xl liquid-glass-dock hover:bg-white text-neutral-900 flex items-center gap-2.5 text-xs font-bold transition-all"
          title="Open category legend"
          aria-label="Open category legend"
        >
          <div className="flex items-center -space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 border border-white shadow-xs" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white shadow-xs" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white shadow-xs" />
          </div>
          <span className="font-extrabold text-xs">Categories</span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
        </button>
      )}
    </div>
  );
}
