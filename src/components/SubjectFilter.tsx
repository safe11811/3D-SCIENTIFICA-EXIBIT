import { useRef, useEffect } from 'react';
import { Sparkles, Cpu, FlaskConical, Calculator, Languages, TrendingUp, BookOpen, Globe } from 'lucide-react';

interface SubjectFilterProps {
  activeSubject: string;
  activeFloorId: string | null;
  onSelectSubject: (subject: string) => void;
  hideOnMobile?: boolean;
}

interface FilterDepartment {
  key: string;
  label: string;
  shortLabel: string;
  colorHex: string;
}

// 9 Official Departments from Scientifica 2026 Sheet + "All"
const OFFICIAL_DEPARTMENTS: FilterDepartment[] = [
  { key: 'all',      label: 'All Departments', shortLabel: 'All',         colorHex: '#09090B' },
  { key: 'english',  label: 'English',         shortLabel: 'English',     colorHex: '#E11D48' },
  { key: 'hindi',    label: 'Hindi',           shortLabel: 'Hindi',       colorHex: '#EA580C' },
  { key: 'sanskrit', label: 'Sanskrit',        shortLabel: 'Sanskrit',    colorHex: '#D97706' },
  { key: 'kannada',  label: 'Kannada',         shortLabel: 'Kannada',     colorHex: '#CA8A04' },
  { key: 'math',     label: 'Mathematics',     shortLabel: 'Math',        colorHex: '#4F46E5' },
  { key: 'science',  label: 'Science',         shortLabel: 'Science',     colorHex: '#059669' },
  { key: 'social',   label: 'Social Science',  shortLabel: 'Social Sci',  colorHex: '#9333EA' },
  { key: 'commerce', label: 'Commerce',        shortLabel: 'Commerce',    colorHex: '#2563EB' },
  { key: 'cs',       label: 'Computer Science',shortLabel: 'Computer Sci',colorHex: '#0284C7' }
];

export default function SubjectFilter({
  activeSubject,
  onSelectSubject,
  hideOnMobile = false
}: SubjectFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep active chip scrolled into view on mobile
  useEffect(() => {
    if (!scrollRef.current) return;
    const activeBtn = scrollRef.current.querySelector('[data-active="true"]') as HTMLElement;
    if (activeBtn) {
      const containerLeft = scrollRef.current.getBoundingClientRect().left;
      const btnLeft = activeBtn.getBoundingClientRect().left;
      const offset = btnLeft - containerLeft - 16;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }, [activeSubject]);

  if (hideOnMobile) {
    return null;
  }

  const getDepartmentIcon = (key: string) => {
    switch (key) {
      case 'all': return <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      case 'english': return <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      case 'hindi': return <Languages className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      case 'sanskrit': return <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      case 'kannada': return <Languages className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      case 'math': return <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      case 'science': return <FlaskConical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      case 'social': return <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      case 'commerce': return <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      case 'cs': return <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      default: return <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
    }
  };

  return (
    <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-0 right-0 z-20 pointer-events-none px-2 sm:px-6 flex justify-center">
      {/* Apple-style floating category dock */}
      <div className="relative max-w-[96vw] sm:max-w-max pointer-events-auto">
        <div
          ref={scrollRef}
          className="p-1 sm:p-1.5 rounded-2xl sm:rounded-full flex items-center gap-1 sm:gap-1.5 liquid-glass-dock overflow-x-auto no-scrollbar scroll-smooth pr-3 sm:pr-2 shadow-xl shadow-slate-900/10 border border-white/80"
        >
          {OFFICIAL_DEPARTMENTS.map((dept) => {
            const isActive = activeSubject === dept.key;

            return (
              <button
                key={dept.key}
                data-active={isActive ? 'true' : undefined}
                onClick={() => {
                  onSelectSubject(dept.key);
                }}
                title={dept.label}
                aria-label={`Filter by ${dept.label}`}
                className={`min-h-[36px] sm:min-h-[40px] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl sm:rounded-full text-xs sm:text-[13px] font-bold shrink-0 whitespace-nowrap transition-all apple-press cursor-pointer ${
                  isActive
                    ? 'bg-neutral-950 text-white border border-neutral-800 shadow-md scale-[1.03]'
                    : 'liquid-glass-btn text-slate-800 hover:text-black'
                }`}
              >
                <span
                  className="shrink-0 flex items-center justify-center transition-colors"
                  style={{ color: isActive ? '#FFFFFF' : dept.colorHex }}
                >
                  {getDepartmentIcon(dept.key)}
                </span>
                <span className="tracking-tight font-semibold">
                  {dept.shortLabel}
                </span>
                {dept.key !== 'all' && (
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: dept.colorHex }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
