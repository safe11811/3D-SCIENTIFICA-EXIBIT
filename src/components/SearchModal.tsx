import { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Clock, ArrowRight, User } from 'lucide-react';
import { FLOORS, Floor, Exhibit, SUBJECTS } from '../data';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExhibit: (exhibit: Exhibit, floor: Floor) => void;
}

export default function SearchModal({ isOpen, onClose, onSelectExhibit }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if (e.key === '/' && !isOpen && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQ = query.trim().toLowerCase();

  // Bounded Levenshtein distance — early-exits once the edit distance can no
  // longer stay within `max`, so typo checks stay cheap across ~56 rooms.
  const editDistance = (a: string, b: string, max: number): number => {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const row = [i];
      let rowMin = i;
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        row[j] = Math.min(row[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
        rowMin = Math.min(rowMin, row[j]);
      }
      if (rowMin > max) return max + 1;
      prev = row;
    }
    return prev[b.length];
  };

  // Substring match, else a per-word fuzzy match (tolerates ~2 typos in words
  // of 4+ letters, 1 in shorter ones — "quntum" still finds "Quantum").
  const fuzzyMatch = (text: string, q: string): boolean => {
    if (text.includes(q)) return true;
    const tolerance = q.length >= 4 ? 2 : q.length >= 2 ? 1 : 0;
    if (tolerance === 0) return false;
    return text.split(/[^a-z0-9]+/).some(
      word => word.length <= q.length + tolerance && editDistance(word, q, tolerance) <= tolerance
    );
  };

  const scoreExhibit = (ex: Exhibit): number => {
    if (!cleanQ) return ex.featured ? 1 : 0;
    const title = ex.title.toLowerCase();
    const room = ex.room.toLowerCase();
    const subject = SUBJECTS[ex.subject]?.label.toLowerCase() ?? '';
    const presenters = ex.presenters?.toLowerCase() ?? '';
    const desc = ex.desc.toLowerCase();

    let score = 0;
    if (title.includes(cleanQ)) score = 100;
    else if (fuzzyMatch(title, cleanQ)) score = 70;
    else if (room.includes(cleanQ)) score = 60;
    else if (fuzzyMatch(room, cleanQ)) score = 45;
    else if (subject.includes(cleanQ)) score = 50;
    else if (presenters.includes(cleanQ)) score = 40;
    else if (desc.includes(cleanQ)) score = 20;
    else return 0;
    return score + (ex.featured ? 5 : 0);
  };

  const ranked: { exhibit: Exhibit; floor: Floor; score: number }[] = [];
  for (const floor of FLOORS) {
    for (const ex of floor.exhibits) {
      if (ex.id.includes('_str')) continue;
      const score = scoreExhibit(ex);
      if (score > 0) ranked.push({ exhibit: ex, floor, score });
    }
  }
  ranked.sort((a, b) => b.score - a.score);
  const results = ranked.slice(0, 30);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[max(3.5rem,calc(env(safe-area-inset-top)+1.5rem))] pb-[max(1rem,env(safe-area-inset-bottom))] px-3 sm:px-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      <div
        className="w-full max-w-2xl liquid-glass-panel rounded-3xl border border-white/90 shadow-2xl shadow-slate-900/10 overflow-hidden flex flex-col max-h-[calc(100dvh-5rem)] animate-in fade-in zoom-in-[0.97] slide-in-from-top-3 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200/80 bg-white/80">
          <Search className="w-5 h-5 text-neutral-900 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exhibits, presenters, or rooms..."
            className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-sm sm:text-base focus:outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="apple-press min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-800"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => {
              onClose();
            }}
            className="apple-press min-w-[40px] min-h-[32px] px-2.5 py-1 flex items-center justify-center rounded-xl text-xs font-bold text-slate-700 liquid-glass-btn transition-colors"
            aria-label="Close search"
          >
            Esc
          </button>
        </div>

        {/* Results Count */}
        <div className="px-4 py-2.5 bg-white/60 border-b border-slate-200/80 flex items-center justify-between text-xs text-slate-600 font-semibold">
          <span>
            {cleanQ ? `Found ${results.length} matching exhibits` : 'Featured exhibits'}
          </span>
          <span className="hidden sm:inline font-normal text-slate-500">Select to locate in 3D</span>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-3 space-y-2 max-h-[55vh]">
          {results.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm font-medium">
              No exhibits found matching "{query}". Try searching "Quantum", "Commerce", "CRISPR", or a floor name.
            </div>
          ) : (
            results.map(({ exhibit, floor }) => {
              const sub = SUBJECTS[exhibit.subject] || SUBJECTS.general;
              return (
                <button
                  key={exhibit.id}
                  onClick={() => {
                    onSelectExhibit(exhibit, floor);
                    onClose();
                  }}
                  className="apple-press w-full text-left p-3.5 rounded-2xl liquid-glass-card border border-white/20 transition-all flex items-start justify-between gap-3 group cursor-pointer"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="px-2.5 py-0.5 rounded-full font-bold text-[11px] border shrink-0 flex items-center gap-1 shadow-2xs"
                        style={{
                          backgroundColor: sub.css + '15',
                          borderColor: sub.css + '40',
                          color: sub.css
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: sub.css }}
                        />
                        <span>{sub.label}</span>
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        {floor.name} · {exhibit.room}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-black transition-colors truncate">
                      {exhibit.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
                      {exhibit.desc}
                    </p>

                    <div className="flex items-center gap-3 pt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1 tabular-nums font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{exhibit.time}</span>
                      </span>
                      {exhibit.presenters && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-600" />
                          <span className="truncate max-w-[160px]">{exhibit.presenters}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 hidden sm:flex">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {floor.name}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 p-2 rounded-xl bg-white border border-black/[0.08] text-neutral-900 group-hover:bg-neutral-950 group-hover:text-white group-hover:border-neutral-950 transition-all self-center shadow-2xs">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
