import { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Clock,
  Footprints,
  Layers
} from 'lucide-react';
import { NavRoute, TourPlan } from '../utils/navigation';
import { Exhibit, Floor } from '../data';

interface NavigationHUDProps {
  activeRoute: NavRoute | null;
  activeTour: TourPlan | null;
  currentTourStopIndex: number;
  onNextTourStop: () => void;
  onPrevTourStop: () => void;
  onCloseNavigation: () => void;
  onReopen2DMap: () => void;
  onSelectExhibit: (exhibit: Exhibit, floor: Floor) => void;
}

export default function NavigationHUD({
  activeRoute,
  activeTour,
  currentTourStopIndex,
  onNextTourStop,
  onPrevTourStop,
  onCloseNavigation,
  onReopen2DMap,
  onSelectExhibit
}: NavigationHUDProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // Auto-play tour runner
  useEffect(() => {
    if (!isAutoPlaying || !activeTour) return;

    const timer = setInterval(() => {
      onNextTourStop();
    }, 8500);

    return () => clearInterval(timer);
  }, [isAutoPlaying, activeTour, onNextTourStop]);

  if (!activeRoute && !activeTour) return null;

  // 1. POINT-TO-POINT NAVIGATION HUD
  if (activeRoute) {
    const currentStep = activeRoute.steps[currentStepIdx] || activeRoute.steps[0];
    const target = activeRoute.destination;

    return (
      <div className="fixed top-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] left-1/2 -translate-x-1/2 z-40 w-[94vw] max-w-lg pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300 font-sans">
        <div className="liquid-glass-dock rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 text-slate-900">
          {/* Top Title & Step Count */}
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse shrink-0 shadow-xs" />
              <div className="text-xs font-bold text-slate-900 truncate">
                Optimal Route to <strong className="text-sky-600 font-extrabold">{target.exhibit.room}</strong>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  onReopen2DMap();
                }}
                className="apple-press text-[11px] font-bold text-slate-800 hover:text-black px-2.5 py-1 rounded-lg liquid-glass-btn"
                title="Change starting pin on 2D map"
              >
                Change Pin
              </button>
              <button
                onClick={() => {
                  onCloseNavigation();
                }}
                className="apple-press w-7 h-7 flex items-center justify-center text-slate-500 hover:text-neutral-950 rounded-lg liquid-glass-btn"
                aria-label="Exit navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Current Step Instruction */}
          <div className="space-y-1.5 mb-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                {currentStepIdx + 1}
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                {currentStep?.instruction}
              </p>
            </div>
          </div>

          {/* Metrics & Step Navigation */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 text-[11px] text-slate-500 font-medium">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1 text-neutral-900 font-semibold">
                <Footprints className="w-3.5 h-3.5 text-neutral-800" />
                <span>{activeRoute.totalDistanceMeters}m</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>~{activeRoute.estimatedMinutes} min</span>
              </span>
              {activeRoute.usesStairs && (
                <>
                  <span>·</span>
                  <span className="text-neutral-800 font-semibold flex items-center gap-1">
                    <Layers className="w-3 h-3 text-neutral-600" />
                    <span>{activeRoute.stairName}</span>
                  </span>
                </>
              )}
            </div>

            {/* Step navigation buttons if multi-step */}
            {activeRoute.steps.length > 1 && (
              <div className="flex items-center gap-1">
                <button
                  disabled={currentStepIdx === 0}
                  onClick={() => {
                    setCurrentStepIdx(prev => Math.max(0, prev - 1));
                  }}
                  className="apple-press w-6 h-6 flex items-center justify-center rounded-md bg-black/[0.05] hover:bg-black/[0.09] disabled:opacity-30 disabled:pointer-events-none text-slate-700 transition-colors"
                  aria-label="Previous step"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-bold text-slate-700">
                  {currentStepIdx + 1}/{activeRoute.steps.length}
                </span>
                <button
                  disabled={currentStepIdx === activeRoute.steps.length - 1}
                  onClick={() => {
                    setCurrentStepIdx(prev => Math.min(activeRoute.steps.length - 1, prev + 1));
                  }}
                  className="apple-press w-6 h-6 flex items-center justify-center rounded-md bg-black/[0.05] hover:bg-black/[0.09] disabled:opacity-30 disabled:pointer-events-none text-slate-700 transition-colors"
                  aria-label="Next step"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. FLOW OF PLAN / ALL EXHIBITS TOUR HUD
  if (activeTour) {
    const total = activeTour.stops.length;
    const currentStop = activeTour.stops[currentTourStopIndex] || activeTour.stops[0];
    const progressPercent = Math.round(((currentTourStopIndex + 1) / total) * 100);

    return (
      <div className="fixed top-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] left-1/2 -translate-x-1/2 z-40 w-[94vw] max-w-lg pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300 font-sans">
        <div className="liquid-glass-dock rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 text-slate-900">
          {/* Header & Controls */}
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-black/[0.06]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="text-xs font-bold text-slate-900">
                <span>Exhibition Tour Flow</span>
                <span className="ml-1.5 text-[11px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
                  Stop {currentTourStopIndex + 1} of {total}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  setIsAutoPlaying(prev => !prev);
                }}
                className={`apple-press px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isAutoPlaying
                    ? 'bg-neutral-950 text-white shadow-sm'
                    : 'liquid-glass-btn text-neutral-800'
                }`}
              >
                {isAutoPlaying ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-500" />}
                <span>{isAutoPlaying ? 'Pause' : 'Auto Fly'}</span>
              </button>

              <button
                onClick={() => {
                  setIsAutoPlaying(false);
                  onCloseNavigation();
                }}
                className="apple-press w-7 h-7 flex items-center justify-center text-slate-500 hover:text-neutral-950 rounded-lg liquid-glass-btn"
                aria-label="Exit tour"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Stop Card */}
          <div
            onClick={() => onSelectExhibit(currentStop.exhibit, currentStop.floor)}
            className="apple-press p-2.5 rounded-xl bg-white/70 border border-black/[0.06] hover:bg-white/90 cursor-pointer transition-colors mb-2.5 shadow-2xs"
          >
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5 font-medium">
              <span>{currentStop.floor.name} · {currentStop.exhibit.room}</span>
              <span className="font-bold text-sky-700">{currentStop.exhibit.wing}</span>
            </div>
            <div className="text-sm font-bold text-slate-900 leading-snug">
              {currentStop.exhibit.title}
            </div>
          </div>

          {/* Progress Bar & Prev/Next Controls */}
          <div className="space-y-2">
            <div className="w-full bg-black/[0.06] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <button
                disabled={currentTourStopIndex === 0}
                onClick={() => {
                  onPrevTourStop();
                }}
                className="apple-press px-3 py-1.5 rounded-xl bg-black/[0.05] hover:bg-black/[0.09] disabled:opacity-40 disabled:pointer-events-none font-semibold text-slate-700 flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="text-[11px] text-slate-500 font-medium">
                {progressPercent}% Explored
              </span>

              <button
                disabled={currentTourStopIndex === total - 1}
                onClick={() => {
                  onNextTourStop();
                }}
                className="apple-press px-3.5 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 disabled:opacity-40 disabled:pointer-events-none font-bold text-white flex items-center gap-1 transition-colors shadow-sm"
              >
                <span>Next Exhibit</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
