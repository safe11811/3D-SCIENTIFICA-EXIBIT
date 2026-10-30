import { useState } from 'react';
import { Layers } from 'lucide-react';
import { FLOORS } from '../data';

interface ElevatorBarProps {
  activeFloorId: string | null;
  onSelectFloor: (floorId: string | null) => void;
  isCompact?: boolean;
}

export default function ElevatorBar({ activeFloorId, onSelectFloor, isCompact = false }: ElevatorBarProps) {
  const [hoveredFloor, setHoveredFloor] = useState<string | null>(null);

  // Reverse so 2F is on top, then 1F, GF, B
  const reversedFloors = [...FLOORS].reverse();

  return (
    <div className={`fixed right-[max(0.5rem,env(safe-area-inset-right))] sm:right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col items-end gap-2 pointer-events-auto transition-all duration-200 ${
      isCompact ? 'opacity-0 pointer-events-none translate-x-4' : 'opacity-100 translate-x-0'
    }`}>
      {/* Floor Tooltip Card on Hover */}
      {hoveredFloor && (
        <div className="absolute right-14 sm:right-16 top-1/2 -translate-y-1/2 px-3.5 py-2.5 rounded-2xl text-right pointer-events-none hidden md:block whitespace-nowrap liquid-glass-dock animate-in fade-in zoom-in-95 duration-150">
          {hoveredFloor === 'all' ? (
            <div>
              <div className="text-xs font-bold text-slate-900">Full building view</div>
              <div className="text-[11px] text-slate-500 font-medium">All campus floors stacked</div>
            </div>
          ) : (
            (() => {
              const f = FLOORS.find(item => item.id === hoveredFloor);
              if (!f) return null;
              const isRestricted = f.exhibits.length === 0;
              return (
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center justify-end gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.css }} />
                    {f.name}
                    {isRestricted && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                        No Exhibits
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 max-w-[220px] truncate font-medium">
                    {isRestricted ? 'No public exhibits on this floor' : f.theme}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* Control Column */}
      <div className="p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl flex flex-col items-center gap-1.5 liquid-glass-dock">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-0.5 pb-0.5 text-center">
          Floor
        </div>

        {/* 2F, 1F, GF, B buttons (44px min tap targets) */}
        {reversedFloors.map((floor) => {
          const isActive = activeFloorId === floor.id;
          const isRestricted = floor.exhibits.length === 0;
          return (
            <button
              key={floor.id}
              onClick={() => {
                if (isRestricted) return;
                onSelectFloor(floor.id);
              }}
              onMouseEnter={() => setHoveredFloor(floor.id)}
              onMouseLeave={() => setHoveredFloor(null)}
              className={`relative w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                isRestricted
                  ? 'opacity-35 bg-slate-200/40 text-slate-400 cursor-not-allowed border border-dashed border-slate-300/60 select-none'
                  : isActive
                  ? 'bg-neutral-950 text-white border border-white/30 shadow-md scale-105 apple-press'
                  : 'liquid-glass-btn text-slate-800 hover:text-black apple-press'
              }`}
              aria-label={
                isRestricted
                  ? `${floor.name} (No public exhibits)`
                  : `Select ${floor.name}`
              }
              aria-disabled={isRestricted}
            >
              <span>{floor.shortName}</span>
              {!isRestricted && (
                <span
                  className={`absolute bottom-1.5 w-1 h-1 rounded-full ${isActive ? 'bg-sky-400' : 'bg-slate-400'}`}
                />
              )}
            </button>
          );
        })}

        <div className="w-6 h-[1px] bg-slate-200/80 my-0.5" />

        {/* ALL (Aerial) button */}
        <button
          onClick={() => {
            onSelectFloor(null);
          }}
          onMouseEnter={() => setHoveredFloor('all')}
          onMouseLeave={() => setHoveredFloor(null)}
          className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-all apple-press ${
            activeFloorId === null
              ? 'bg-neutral-950 text-white border border-white/30 shadow-md scale-105'
              : 'liquid-glass-btn text-slate-800 hover:text-black'
          }`}
          title="All Floors (Building Aerial View)"
          aria-label="View all floors"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All</span>
        </button>
      </div>
    </div>
  );
}
