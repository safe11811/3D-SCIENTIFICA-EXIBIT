import { useState, useEffect } from 'react';
import { Exhibit, SUBJECTS, FLOORS } from '../data';

interface HoverTooltipProps {
  hoveredExhibit?: Exhibit | null;
}

export default function HoverTooltip({ hoveredExhibit: propExhibit }: HoverTooltipProps) {
  const [internalExhibit, setInternalExhibit] = useState<Exhibit | null>(null);

  useEffect(() => {
    const handleCustomHover = (e: Event) => {
      const customEvent = e as CustomEvent<Exhibit | null>;
      setInternalExhibit(customEvent.detail || null);
    };

    window.addEventListener('scientifica-hover-exhibit', handleCustomHover);
    return () => {
      window.removeEventListener('scientifica-hover-exhibit', handleCustomHover);
    };
  }, []);

  const currentExhibit = propExhibit !== undefined ? propExhibit : internalExhibit;

  if (!currentExhibit || currentExhibit.id.includes('_str')) return null;

  const sub = SUBJECTS[currentExhibit.subject] || SUBJECTS.general;
  const floor = FLOORS.find(f => f.exhibits.some(e => e.id === currentExhibit.id));

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-in fade-in zoom-in-95 duration-150 font-sans">
      <div className="liquid-glass-dock px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3">
        <span
          className="w-3 h-3 rounded-full shrink-0 shadow-xs"
          style={{ backgroundColor: sub.css }}
        />
        <div className="text-left">
          <div className="text-[11px] text-slate-500 font-semibold">
            {floor?.name} · {currentExhibit.room}
          </div>
          <div className="text-sm font-bold text-slate-900 font-sans truncate max-w-[260px] sm:max-w-[340px]">
            {currentExhibit.title}
          </div>
        </div>
      </div>
    </div>
  );
}

