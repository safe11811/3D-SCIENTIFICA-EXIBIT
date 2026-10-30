import { useState, useMemo } from 'react';
import { Clock, User, ArrowUpRight, Search, X, AlertCircle, Layers, Calendar } from 'lucide-react';
import { FLOORS, Floor, Exhibit, SUBJECTS } from '../data';

interface ScheduleViewProps {
  onSelectExhibit: (exhibit: Exhibit, floor: Floor) => void;
  onClose: () => void;
}

// Event date + clock-derived live status come from the shared schedule util
import { EVENT_DATE, getLiveStatus, parseTimeWindow } from '../utils/schedule';

// Filter pill definitions with primary label and secondary time range
const TIME_PILLS = [
  { id: 'all', label: 'All Day', sub: '9:35 – 3:00' },
  { id: 'morning', label: 'Morning', sub: '9:35 – 12:00' },
  { id: 'afternoon', label: 'Afternoon', sub: '12:00 – 3:00' }
];

const FLOOR_OPTIONS = [
  { id: 'all', label: 'All Floors', color: null },
  { id: 'second', label: 'Second Floor', color: '#6366F1' },
  { id: 'ground', label: 'Ground Floor', color: '#047857' },
  { id: 'basement', label: 'Basement', color: '#B45309' }
];

function formatPresenter(presenters?: string): string {
  if (!presenters) return '';
  let str = presenters.trim();
  if (str.toLowerCase().startsWith('by ')) {
    str = str.slice(3).trim();
  }
  return `By ${str}`;
}

function formatLocation(floor: Floor, exhibit: Exhibit): string {
  return `${floor.name} · ${exhibit.room}`;
}

export default function ScheduleView({
  onSelectExhibit,
  onClose
}: ScheduleViewProps) {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('all');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [liveNowFilter, setLiveNowFilter] = useState<boolean>(false);

  // Check if current date is past the event date
  const isPastEvent = useMemo(() => {
    const today = new Date();
    const eventDate = new Date(`${EVENT_DATE}T23:59:59`);
    return today > eventDate;
  }, []);

  // Filter & collect exhibits
  const filteredEvents = useMemo(() => {
    const events: { exhibit: Exhibit; floor: Floor; isLive: boolean; isSoon: boolean }[] = [];

    FLOORS.forEach(floor => {
      floor.exhibits.forEach(ex => {
        if (ex.id.includes('_str') || ex.id.includes('stairs')) return;

        if (selectedFloor !== 'all' && floor.id !== selectedFloor) return;

        if (selectedTimeSlot === 'morning' || selectedTimeSlot === 'afternoon') {
          const isAllDay = ex.time.toLowerCase().includes('all day');
          if (!isAllDay) {
            const win = parseTimeWindow(ex.time);
            if (win) {
              const startH = win.start.getHours() + win.start.getMinutes() / 60;
              const endH = win.end.getHours() + win.end.getMinutes() / 60;
              // Morning slot: covers events active before 12:00 PM
              if (selectedTimeSlot === 'morning' && !(startH < 12.0 && endH >= 9.0)) return;
              // Afternoon slot: covers events active at or after 12:00 PM
              if (selectedTimeSlot === 'afternoon' && !(endH > 12.0 && startH < 17.0)) return;
            } else {
              const mMatch = ex.time.includes('09:') || ex.time.includes('10:') || ex.time.includes('11:') || ex.time.includes('AM');
              const aMatch = ex.time.includes('12:') || ex.time.includes('13:') || ex.time.includes('14:') || ex.time.includes('15:') || ex.time.includes('PM');
              if (selectedTimeSlot === 'morning' && !mMatch) return;
              if (selectedTimeSlot === 'afternoon' && !aMatch) return;
            }
          }
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = ex.title.toLowerCase().includes(q);
          const matchRoom = ex.room.toLowerCase().includes(q);
          const matchPresenter = (ex.presenters || '').toLowerCase().includes(q);
          const matchDesc = ex.desc.toLowerCase().includes(q);
          const matchSessions = (ex.scheduleDetails?.sessions || []).some(s => s.toLowerCase().includes(q));
          if (!matchTitle && !matchRoom && !matchPresenter && !matchDesc && !matchSessions) return;
        }

        // On the event day, derive live status from the actual clock;
        // otherwise fall back to the curated static labels.
        const live = getLiveStatus(ex);
        const isLive = !isPastEvent && Boolean(
          live === 'live' ||
          (live === null && (ex.scheduleDetails?.status === 'Live Now' || ex.featured))
        );
        const isSoon = !isPastEvent && Boolean(
          live === 'upcoming' ||
          (live === null && ex.scheduleDetails?.status === 'Scheduled Shows')
        );

        if (liveNowFilter && !isLive) return;

        events.push({ exhibit: ex, floor, isLive, isSoon });
      });
    });

    if (liveNowFilter) {
      events.sort((a, b) => (b.isLive ? 1 : 0) - (a.isLive ? 1 : 0));
    }

    return events;
  }, [selectedFloor, selectedTimeSlot, searchQuery, liveNowFilter, isPastEvent]);

  return (
    <div className="fixed inset-0 z-40 bg-[#cdd9e2]/90 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200 text-slate-900 font-sans selection:bg-indigo-500/15">
      <div className="relative max-w-5xl mx-auto px-3 sm:px-8 pt-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+3.5rem))] space-y-4">
        
        {/* Apple VisionOS Frosted Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden liquid-glass-panel p-5 sm:p-7 border border-white/80 shadow-lg shadow-slate-900/5">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200/80 mb-2.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                <Calendar className="w-3.5 h-3.5" />
                <span>Live Exhibition Agenda · Saturday, October 31, 2026</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Scientifica 2026 Schedule
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl font-normal leading-relaxed">
                Official department exhibitions, live shows, and interactive stages across all campus floors.
              </p>
            </div>

            <button
              onClick={() => {
                onClose();
              }}
              className="apple-press self-start sm:self-auto min-h-[44px] px-5 py-2.5 rounded-2xl liquid-glass-btn text-slate-900 hover:text-black font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <span>Back to 3D map</span>
              <ArrowUpRight className="w-4 h-4 text-slate-700" />
            </button>
          </div>
        </div>

        {/* Event Ended Notice (if past) */}
        {isPastEvent && (
          <div className="p-3.5 sm:p-4 rounded-2xl liquid-glass-dock border border-amber-300/80 bg-amber-50/90 text-amber-900 flex items-center gap-3 text-xs sm:text-sm shadow-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Event archive:</span> Scientifica 2026 took place on Saturday, October 31, 2026. Browsing agenda in archive mode.
            </div>
          </div>
        )}

        {/* STICKY FROSTED FILTER DOCK */}
        <div className="sticky top-[max(0.75rem,env(safe-area-inset-top))] z-30 liquid-glass-dock rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 space-y-3 shadow-md shadow-slate-900/5">
          
          {/* Row 1: Frosted Liquid Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by exhibit name, presenter, or room..."
              className="w-full h-11 pl-10 pr-10 rounded-xl sm:rounded-2xl liquid-glass-input text-base sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-black"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Row 2: Apple Segmented Time Control + Quick Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            
            {/* Time of Day Segmented Control */}
            <div className="flex items-center gap-1 p-1 rounded-xl sm:rounded-2xl bg-white/60 border border-white/80 overflow-x-auto no-scrollbar shrink-0 shadow-2xs">
              {TIME_PILLS.map(slot => {
                const isActive = selectedTimeSlot === slot.id;
                return (
                  <button
                    key={slot.id}
                    onClick={() => {
                      setSelectedTimeSlot(slot.id);
                    }}
                    className={`apple-press min-h-[40px] px-3.5 sm:px-4 py-1.5 rounded-lg sm:rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer ${
                      isActive
                        ? 'bg-slate-950 text-white font-extrabold shadow-sm border border-slate-900'
                        : 'text-slate-700 hover:text-black hover:bg-white/60'
                    }`}
                  >
                    <span className="text-xs sm:text-[13px] font-bold leading-tight">{slot.label}</span>
                    <span className={`text-[10px] sm:text-[11px] tabular-nums font-medium leading-tight ${isActive ? 'text-indigo-300' : 'text-slate-500'}`}>
                      {slot.sub}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Live Filter Toggle */}
            <div className="flex items-center gap-2">
              {!isPastEvent && (
                <button
                  onClick={() => {
                    setLiveNowFilter(prev => !prev);
                  }}
                  className={`apple-press min-h-[42px] px-3.5 py-1.5 rounded-xl sm:rounded-2xl text-xs sm:text-[13px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    liveNowFilter
                      ? 'bg-emerald-600 text-white border border-emerald-700 shadow-md shadow-emerald-600/20'
                      : 'liquid-glass-btn text-slate-800 hover:text-black'
                  }`}
                  title="Filter exhibits happening live right now"
                >
                  <span className={`w-2 h-2 rounded-full ${liveNowFilter ? 'bg-white animate-pulse' : 'bg-emerald-500'}`} />
                  <span>Live Now</span>
                </button>
              )}
            </div>

          </div>

          {/* Row 3: Floor Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              Floor
            </span>
            {FLOOR_OPTIONS.map(f => {
              const isActive = selectedFloor === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    setSelectedFloor(f.id);
                  }}
                  className={`apple-press min-h-[38px] px-3.5 py-1.5 rounded-xl sm:rounded-2xl text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white border border-slate-900 shadow-sm'
                      : 'liquid-glass-btn text-slate-700 hover:text-black'
                  }`}
                >
                  {f.color && (
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: isActive ? '#FFFFFF' : f.color }}
                    />
                  )}
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Results Counter Header */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
          <span className="tabular-nums">Showing {filteredEvents.length} exhibit{filteredEvents.length === 1 ? '' : 's'}</span>
          {(selectedTimeSlot !== 'all' || selectedFloor !== 'all' || searchQuery || liveNowFilter) && (
            <button
              onClick={() => {
                setSelectedTimeSlot('all');
                setSelectedFloor('all');
                setSearchQuery('');
                setLiveNowFilter(false);
              }}
              className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Schedule Event Grid */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-16 liquid-glass-panel rounded-3xl p-8 space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-slate-900 font-bold text-base">No exhibits match your filters</p>
            <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
              Try selecting a different floor, clearing your search keywords, or selecting all day.
            </p>
            <button
              onClick={() => {
                setSelectedTimeSlot('all');
                setSelectedFloor('all');
                setSearchQuery('');
                setLiveNowFilter(false);
              }}
              className="mt-3 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pb-16">
            {filteredEvents.map(({ exhibit, floor, isLive, isSoon }) => {
              const sub = SUBJECTS[exhibit.subject] || SUBJECTS.general;
              const readableLoc = formatLocation(floor, exhibit);
              const formattedPresenter = formatPresenter(exhibit.presenters);

              return (
                <div
                  key={exhibit.id}
                  style={{ borderLeftColor: sub.css }}
                  className="liquid-glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-l-[5px] flex flex-col justify-between gap-3 group relative overflow-hidden"
                >
                  {/* Subtle subject color glow in top-right corner */}
                  <div
                    className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-15 pointer-events-none transition-opacity group-hover:opacity-30"
                    style={{ backgroundColor: sub.css }}
                  />

                  <div className="space-y-2 relative z-10">
                    
                    {/* Meta Tier 1: Category Tag & Live/Soon Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        {/* Vibrant Subject Jewel Badge */}
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

                        {exhibit.department && (
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-900/5 text-slate-800 border border-slate-300/60">
                            Dept: {exhibit.department}
                          </span>
                        )}
                        {exhibit.classGrade && (
                          <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                            {exhibit.classGrade}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Status badge */}
                        {isPastEvent ? null : isLive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 font-extrabold bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            <span>Live</span>
                          </span>
                        ) : isSoon ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 font-extrabold bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            <span>Soon</span>
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Meta Tier 2: Location pill & Time Chip (Never colliding on narrow mobile) */}
                    <div className="flex items-center justify-between text-xs gap-2 pt-0.5 text-slate-600">
                      <span className="font-semibold text-slate-700 text-xs sm:text-[13px] truncate">
                        {readableLoc}
                      </span>

                      <span className="text-xs tabular-nums text-slate-700 flex items-center gap-1 font-bold bg-slate-100/90 px-2.5 py-0.5 rounded-lg border border-slate-200/70 shrink-0">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{exhibit.time}</span>
                      </span>
                    </div>

                    {/* Title in Clean Apple SF Pro / Inter typography */}
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-black tracking-tight leading-snug">
                      {exhibit.title}
                    </h3>

                    {/* Description */}
                    <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 leading-relaxed font-normal">
                      {exhibit.desc}
                    </p>

                    {/* Presenter info */}
                    {formattedPresenter && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 pt-0.5">
                        <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[280px] font-medium">{formattedPresenter}</span>
                      </div>
                    )}

                    {/* Live Show Lineup / Sessions breakdown (Flagship arena lineups) */}
                    {exhibit.scheduleDetails?.sessions && exhibit.scheduleDetails.sessions.length > 0 && (
                      <div className="mt-2 p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/80 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                            <span>Show Lineup & Timings</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            {exhibit.scheduleDetails.sessions.length} scheduled acts
                          </span>
                        </div>
                        <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-[11px] text-slate-700">
                          {exhibit.scheduleDetails.sessions.map((session, sIdx) => {
                            const isHeader =
                              session.startsWith('1ST SHOW') ||
                              session.startsWith('2ND SHOW') ||
                              session.startsWith('3RD SHOW');
                            return (
                              <div
                                key={sIdx}
                                className={`leading-snug ${
                                  isHeader
                                    ? 'font-bold text-indigo-900 bg-indigo-50/80 px-2 py-0.5 rounded mt-1 border border-indigo-100 text-[11px]'
                                    : 'pl-2 text-slate-600 text-[11px]'
                                }`}
                              >
                                {session}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Bottom Action Row */}
                  <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs relative z-10">
                    <span className="font-semibold text-slate-500 text-[11px] tabular-nums">
                      Room {exhibit.room}
                    </span>

                    <button
                      onClick={() => {
                        onSelectExhibit(exhibit, floor);
                      }}
                      className="apple-press min-h-[38px] flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-black transition-all py-1.5 px-3.5 rounded-xl shadow-xs cursor-pointer group-hover:shadow-md"
                    >
                      <span>Locate in 3D map</span>
                      <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}