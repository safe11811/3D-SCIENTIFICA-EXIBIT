import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, Share2, Clock, Navigation2 } from 'lucide-react';
import { Exhibit, Floor, SUBJECTS } from '../data';
import { getLiveStatus, getSessionLineState, LIVE_STATUS_LABELS } from '../utils/schedule';

interface ExhibitDrawerProps {
  exhibit: Exhibit | null;
  floor: Floor | null;
  onClose: () => void;
  onNavigateNext: () => void;
  onRequestDirections?: (exhibit: Exhibit, floor: Floor) => void;
  onOpenShare?: () => void;
}

export default function ExhibitDrawer({
  exhibit,
  floor,
  onClose,
  onNavigateNext,
  onRequestDirections,
  onOpenShare
}: ExhibitDrawerProps) {
  // 3D Spatial Parallax Tilt (Sleek floating in space effect on desktop)
  const [tilt, setTilt] = useState({ rx: 2, ry: -4, tz: 10 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 640) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xNorm = (x / rect.width - 0.5) * 2;
    const yNorm = (y / rect.height - 0.5) * 2;

    setTilt({
      rx: 2 - yNorm * 3,
      ry: -4 + xNorm * 4,
      tz: 16
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rx: 2, ry: -4, tz: 10 });
  };

  // Apple-style sheet drag-to-dismiss: the grabber tracks the finger 1:1,
  // then springs home or commits to dismiss based on release velocity.
  const [dragY, setDragY] = useState(0);
  const dragState = useRef<{ active: boolean; lastY: number; lastT: number; velocity: number }>({
    active: false,
    lastY: 0,
    lastT: 0,
    velocity: 0
  });

  // Ticking clock so finished acts grey out and the running act highlights
  // live, without any interaction — refreshes every 30 seconds.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const onGrabPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragState.current = { active: true, lastY: e.clientY, lastT: performance.now(), velocity: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onGrabPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = dragState.current;
    if (!st.active) return;
    const now = performance.now();
    const dy = e.clientY - st.lastY;
    const dt = Math.max(1, now - st.lastT);
    st.velocity = (dy / dt) * 1000;
    st.lastY = e.clientY;
    st.lastT = now;
    const next = Math.max(0, dragY + dy);
    setDragY(next);
  };
  const onGrabPointerUp = () => {
    const st = dragState.current;
    if (!st.active) return;
    st.active = false;
    const flicked = st.velocity > 600;
    if (dragY > 80 || flicked) {
      setDragY(0);
      onClose();
    } else {
      setDragY(0);
    }
  };

  if (!exhibit) return null;

  const currentFloor = floor || {
    id: 'unknown',
    name: 'Floor Plan',
    shortName: '?',
    level: 0,
    theme: '',
    baseY: 0,
    color: 0x09090b,
    css: '#09090B',
    exhibits: []
  };

  const subjectInfo = SUBJECTS[exhibit.subject] || SUBJECTS.general;
  const liveStatus = getLiveStatus(exhibit);
  const status = liveStatus ? LIVE_STATUS_LABELS[liveStatus] : exhibit.scheduleDetails?.status || 'All-Day Exhibition';
  const isLive = liveStatus === 'live' || (!liveStatus && status === 'Live Now');
  const sessions = exhibit.scheduleDetails?.sessions || [];

  return (
    <aside
      aria-label="Venue and Event Details"
      style={{
        transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
        transition: dragState.current.active ? 'none' : 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)'
      }}
      className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 z-40 pointer-events-auto sm:w-[410px] re6-hud-perspective select-none font-sans animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      {/* Sleek Apple-designed Floating Glass Card (Parent-Focused & Ultra Compact) */}
      <div
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateY(${tilt.ry}deg) rotateX(${tilt.rx}deg) translateZ(${tilt.tz}px)`,
          transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        className="relative liquid-glass-panel rounded-3xl p-3 sm:p-4.5 max-h-[38dvh] sm:max-h-[75dvh] flex flex-col gap-2.5 text-slate-900 shadow-2xl shadow-slate-900/12 border border-white/95 overflow-hidden"
      >
        {/* Sheet grabber for mobile swipe down */}
        <div
          onPointerDown={onGrabPointerDown}
          onPointerMove={onGrabPointerMove}
          onPointerUp={onGrabPointerUp}
          onPointerCancel={onGrabPointerUp}
          className="sm:hidden flex justify-center -mt-1 pb-1 cursor-grab active:cursor-grabbing touch-none shrink-0"
          aria-hidden="true"
        >
          <div className="h-1 w-9 rounded-full bg-slate-300/90" />
        </div>

        {/* Top Header Row: Floor & Room, Department, Class Grade & Close */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/70 shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-600 truncate">
              {currentFloor.shortName} · {exhibit.room}
            </span>
            <span
              className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border shrink-0 flex items-center gap-1 shadow-2xs"
              style={{
                backgroundColor: subjectInfo.css + '15',
                borderColor: subjectInfo.css + '40',
                color: subjectInfo.css
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subjectInfo.css }} />
              <span>{subjectInfo.label}</span>
            </span>
            {exhibit.department && (
              <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-900/5 text-slate-800 border border-slate-300/60 shrink-0">
                {exhibit.department}
              </span>
            )}
            {exhibit.classGrade && (
              <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                {exhibit.classGrade}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isLive && (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Live
              </span>
            )}

            <button
              onClick={() => {
                onClose();
              }}
              className="w-7 h-7 flex items-center justify-center rounded-xl liquid-glass-btn text-slate-600 hover:text-black transition-colors cursor-pointer apple-press"
              title="Close [Esc]"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Verbatim Official Event Title */}
        <div className="shrink-0">
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-snug line-clamp-2">
            {exhibit.title}
          </h2>
        </div>

        {/* Essential Parent Information: Hours, Scheduled Shows & Route Guide */}
        <div className="min-h-0 flex-1 overflow-y-auto space-y-2 pr-0.5">
          {/* Timing & Show Schedule */}
          <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs">
            <div className="flex items-center justify-between text-slate-700 font-bold mb-1">
              <span className="flex items-center gap-1 text-slate-500 font-semibold text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Exhibition Hours</span>
              </span>
              <span className="text-[11px] text-slate-900">{exhibit.time}</span>
            </div>

            {sessions.length > 0 ? (
              <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Show Sessions & Timings
                  </span>
                  <span className="text-[10px] font-medium text-slate-500">
                    {sessions.filter(s => s.includes('SHOW')).length > 0 
                      ? `${sessions.filter(s => s.includes('SHOW')).length} Shows` 
                      : `${sessions.length} acts`}
                  </span>
                </div>
                <div className="space-y-1 max-h-48 sm:max-h-60 overflow-y-auto pr-0.5">
                  {sessions.map((sess, idx) => {
                    const isHeader = sess.includes('SHOW');
                    const state = getSessionLineState(sess, now);
                    if (isHeader) {
                      return (
                        <div
                          key={idx}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold tracking-wide mt-1.5 first:mt-0 flex items-center justify-between transition-colors ${
                            state === 'past'
                              ? 'bg-slate-100/80 border-slate-200/70 text-slate-400 line-through decoration-slate-300'
                              : 'bg-amber-50/90 border-amber-200/80 text-amber-950'
                          }`}
                        >
                          <span>{sess}</span>
                          {state === 'live' && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-extrabold uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              Live
                            </span>
                          )}
                        </div>
                      );
                    }
                    return (
                      <div
                        key={idx}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium leading-tight transition-colors ${
                          state === 'past'
                            ? 'bg-slate-50/60 border-slate-200/50 text-slate-400 line-through decoration-slate-300'
                            : state === 'live'
                            ? 'bg-emerald-50/90 border-emerald-300/80 text-emerald-900 font-bold flex items-center justify-between'
                            : 'bg-white/80 border-slate-200/70 text-slate-800'
                        }`}
                      >
                        <span>{sess}</span>
                        {state === 'live' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-extrabold uppercase shrink-0 ml-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Live
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 font-medium pt-0.5">
                Open walk-in exhibition during event hours.
              </p>
            )}
          </div>

          {/* Location & Waypoint Guidance */}
          {exhibit.locationGuide && (
            <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs text-slate-700 font-medium flex items-start gap-1.5">
              <Navigation2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="leading-snug text-[11px]">
                <span className="font-bold text-slate-900">{currentFloor.name} ({currentFloor.shortName})</span>
                <span className="text-slate-500"> · </span>
                <span>{exhibit.locationGuide}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons: Get Directions & Next Room */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/70 shrink-0">
          {onRequestDirections && (
            <button
              onClick={() => {
                onRequestDirections(exhibit, currentFloor);
              }}
              className="flex-1 min-h-[36px] sm:min-h-[38px] py-1.5 px-3 rounded-xl bg-slate-950 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs apple-press"
            >
              <span>Get Directions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => {
              onNavigateNext();
            }}
            className="min-h-[36px] sm:min-h-[38px] py-1.5 px-3 rounded-xl liquid-glass-btn text-slate-700 hover:text-black font-semibold text-xs transition-colors cursor-pointer apple-press"
          >
            Next Room
          </button>

          {onOpenShare && (
            <button
              onClick={() => {
                onOpenShare();
              }}
              className="min-h-[36px] sm:min-h-[38px] min-w-[36px] sm:min-w-[38px] py-1.5 px-2 rounded-xl liquid-glass-btn text-slate-700 hover:text-black transition-colors cursor-pointer apple-press flex items-center justify-center"
              aria-label={`Share ${exhibit.title}`}
              title="Share this venue"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
