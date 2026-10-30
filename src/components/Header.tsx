import { Search, Calendar, Box, Navigation, RotateCcw, Info } from 'lucide-react';
import { FLOORS, Floor, Exhibit } from '../data';

interface HeaderProps {
  activeFloorId: string | null;
  activeExhibit: Exhibit | null;
  activeFloor: Floor | null;
  viewMode: 'map' | 'schedule';
  onSelectFloor: (floorId: string | null) => void;
  onClearExhibit: () => void;
  onToggleViewMode: () => void;
  onOpenSearch: () => void;
  onOpenDirections?: () => void;
  onResetView?: () => void;
  onOpenProjectInfo?: () => void;
}

export default function Header({
  activeFloorId,
  activeExhibit,
  viewMode,
  onSelectFloor,
  onClearExhibit,
  onToggleViewMode,
  onOpenSearch,
  onOpenDirections,
  onResetView,
  onOpenProjectInfo
}: HeaderProps) {
  const currentFloor = FLOORS.find(f => f.id === activeFloorId);

  return (
    <header className="fixed top-[max(0.75rem,env(safe-area-inset-top))] left-[max(0.75rem,env(safe-area-inset-left))] right-[max(0.75rem,env(safe-area-inset-right))] z-30 pointer-events-none flex items-center justify-between gap-2 sm:gap-3 font-sans">
      {/* Left Navigation Zone: Brand Island & Floating Breadcrumb Capsule */}
      <div className="pointer-events-none flex items-center gap-1.5 sm:gap-2.5">
        {/* Brand Floating Island */}
        <div className="pointer-events-auto liquid-glass-dock rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2 transition-all">
          <button
            onClick={() => {
              if (onOpenProjectInfo) {
                onOpenProjectInfo();
              } else {
                onClearExhibit();
                onSelectFloor(null);
              }
            }}
            className="flex items-center text-left group shrink-0 apple-press"
            title="Click for Project Info & Developer Credits"
            aria-label="Scientifica 2026 project information and developer credits"
          >
            <div className="leading-tight">
              <div className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-1 sm:gap-1.5">
                <span className="tracking-tight group-hover:text-indigo-600 transition-colors">Scientifica</span>
                <span className="text-[10px] sm:text-[11px] font-extrabold text-indigo-700 bg-indigo-50/90 px-1.5 sm:px-2 py-0.5 rounded-full border border-indigo-200/80 shadow-2xs group-hover:bg-indigo-100 transition-colors">
                  2026
                </span>
                <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors ml-0.5 shrink-0" />
              </div>
              <div className="text-[11px] text-slate-500 hidden sm:block font-medium group-hover:text-slate-700 transition-colors">
                Science & Technology Exhibition · <span className="text-indigo-600 font-semibold underline decoration-indigo-300 underline-offset-2">About</span>
              </div>
            </div>
          </button>
        </div>

        {/* Separate Floating Breadcrumb Capsule (Cleanly separated from brand) */}
        {(currentFloor || activeExhibit) && (
          <div className="pointer-events-auto hidden md:flex items-center gap-2 liquid-glass-dock rounded-2xl px-3.5 py-2 text-xs text-slate-600 animate-in fade-in slide-in-from-left-2 duration-200 shadow-sm">
            {currentFloor && (
              <button
                onClick={() => {
                  onClearExhibit();
                  onSelectFloor(currentFloor.id);
                }}
                className={`hover:text-black transition-colors font-semibold ${!activeExhibit ? 'text-black' : 'text-slate-600'}`}
              >
                {currentFloor.name}
              </button>
            )}
            {activeExhibit && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-slate-900 font-bold truncate max-w-[200px]">
                  {activeExhibit.room}
                </span>
                <button
                  onClick={onClearExhibit}
                  className="w-4 h-4 ml-0.5 flex items-center justify-center rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 hover:text-black transition-colors text-[10px] font-bold"
                  title="Clear room selection"
                  aria-label="Clear room selection"
                >
                  ✕
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Buttons Island */}
      <div className="pointer-events-auto flex items-center gap-1 sm:gap-2 liquid-glass-dock rounded-2xl p-1 sm:p-2 transition-all">
        {/* Reset View Button - positioned immediately to the left of Search */}
        {onResetView && viewMode === 'map' && (
          <button
            onClick={onResetView}
            className="min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3.5 py-1.5 rounded-xl liquid-glass-btn text-slate-800 flex items-center gap-1.5 text-xs sm:text-sm font-semibold hover:text-black apple-press"
            title="Reset 3D map view"
            aria-label="Reset 3D map view"
          >
            <RotateCcw className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Reset view</span>
          </button>
        )}

        {/* Search button */}
        <button
          onClick={onOpenSearch}
          className="min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3.5 py-1.5 rounded-xl liquid-glass-btn text-slate-800 flex items-center gap-1.5 text-xs sm:text-sm font-semibold hover:text-black apple-press"
          title="Search exhibits (/)"
          aria-label="Search exhibits"
        >
          <Search className="w-4 h-4 text-slate-500" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden lg:inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200/80 ml-0.5">
            /
          </kbd>
        </button>

        {/* 2D Directions & School Map Planner */}
        {onOpenDirections && (
          <button
            onClick={onOpenDirections}
            className="min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3.5 py-1.5 rounded-xl liquid-glass-btn text-slate-800 hover:text-sky-700 flex items-center gap-1.5 text-xs sm:text-sm font-semibold apple-press"
            title="School Map & 3D Navigation"
            aria-label="School Map & 3D Navigation"
          >
            <Navigation className="w-4 h-4 text-sky-600" />
            <span className="hidden sm:inline">Directions</span>
          </button>
        )}

        {/* View Mode Toggle: Map vs Schedule */}
        <button
          onClick={onToggleViewMode}
          className={`min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all apple-press ${
            viewMode === 'schedule'
              ? 'bg-neutral-950 text-white border border-neutral-800 shadow-sm'
              : 'liquid-glass-btn text-slate-800 hover:text-black'
          }`}
          title={viewMode === 'schedule' ? 'Switch to 3D View' : 'Open Schedule'}
          aria-label={viewMode === 'schedule' ? 'Switch to 3D View' : 'Open Schedule'}
        >
          {viewMode === 'schedule' ? (
            <>
              <Box className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">3D Map</span>
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Schedule</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
