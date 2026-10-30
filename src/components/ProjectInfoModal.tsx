import { useEffect, useState } from 'react';
import {
  X,
  User,
  GraduationCap,
  Building2,
  Code2,
  Layers,
  Compass,
  Calendar,
  Cpu,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface ProjectInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectInfoModal({ isOpen, onClose }: ProjectInfoModalProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'how-it-works' | 'tech'>('about');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200 font-sans"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="About Scientifica 2026 Project"
        className="w-full max-w-2xl max-h-[90vh] bg-[#F8F9FB] rounded-3xl border border-slate-300/90 shadow-2xl flex flex-col overflow-hidden relative animate-in fade-in zoom-in-[0.97] duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  Scientifica 2026
                </h2>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/80">
                  Interactive 3D
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                National Public School, Yeshwanthpur
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Close modal (Esc)"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 pt-3 pb-2 gap-2 bg-slate-100/70 border-b border-slate-200/60">
          <button
            onClick={() => setActiveTab('about')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'about'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Developer & Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('how-it-works')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'how-it-works'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>How It Is Made</span>
          </button>
          <button
            onClick={() => setActiveTab('tech')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'tech'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Tech Stack</span>
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'about' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Creator Recognition Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white shadow-xl relative overflow-hidden border border-indigo-700/40">
                <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold border border-indigo-400/30">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Project Creator & Lead Developer</span>
                    </div>
                    <h3 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                      Sangam H
                    </h3>
                    <p className="text-sm font-semibold text-indigo-200 flex items-center gap-1.5">
                      <span>Class 12 A</span>
                      <span className="text-indigo-400">·</span>
                      <span>National Public School, Yeshwanthpur</span>
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center">
                    <span className="px-3.5 py-1.5 rounded-xl bg-white/10 text-white text-xs font-medium border border-white/15 backdrop-blur-xs">
                      Scientifica 2026 Initiative
                    </span>
                  </div>
                </div>
              </div>

              {/* Purpose and Mission */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  About the Platform
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <strong>Scientifica 2026</strong> is a spatial digital twin and real-time interactive navigation platform created specifically for the National Public School Yeshwanthpur Science & Technology Exhibition.
                </p>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Instead of relying on flat paper pamphlets or static floor diagrams, visitors, parents, and judges can explore our 4-level campus in immersive 3D, inspect live department exhibits, find turn-by-turn routes, and follow live show schedules.
                </p>
              </div>

              {/* Key Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 text-center space-y-1">
                  <span className="text-xl font-black text-indigo-600">4</span>
                  <div className="text-[11px] font-bold text-slate-800">Campus Floors</div>
                  <div className="text-[10px] text-slate-500">Basement to 2F</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 text-center space-y-1">
                  <span className="text-xl font-black text-sky-600">40+</span>
                  <div className="text-[11px] font-bold text-slate-800">Live Exhibits</div>
                  <div className="text-[10px] text-slate-500">All Departments</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 text-center space-y-1">
                  <span className="text-xl font-black text-emerald-600">1:1</span>
                  <div className="text-[11px] font-bold text-slate-800">Scale CAD</div>
                  <div className="text-[10px] text-slate-500">DXF Blueprints</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 text-center space-y-1">
                  <span className="text-xl font-black text-amber-600">100%</span>
                  <div className="text-[11px] font-bold text-slate-800">Client PWA</div>
                  <div className="text-[10px] text-slate-500">Fast & Offline</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'how-it-works' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  Architectural Digital Twin Modeling
                </h4>
                <div className="space-y-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">Exact DXF Blueprint Reconstruction:</strong> The 3D campus structure is calculated from actual CAD floor plans (<code className="px-1 py-0.5 rounded bg-slate-100 text-indigo-700 text-[11px]">.dxf</code>) of NPS Yeshwanthpur. The building spans exactly 46.0m × 42.5m with a 16m × 6m covered entrance portico.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">Dual Courtyards & Cutaways:</strong> Accurate void cutouts for the Big Quadrangle (East atrium stage) and Small Quadrangle (West open-air courtyard), complete with safety handrails and cutaway walls for viewing inside classrooms.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">Satellite Ground Alignment:</strong> Front sports court plaza (basketball and volleyball court layout) mapped precisely from satellite coordinates.
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-sky-600" />
                  Dijkstra Wayfinding & Multi-Floor Navigation
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  The application constructs an in-memory corridor topology graph linking hallway intersections, staircases (West Staircase, East Staircase, and Basement core), and room doorways. Real-time Dijkstra shortest-path algorithms calculate turn-by-turn guidance across different floors with 3D animated route ribbons.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  Live Exhibition Timings & Schedules
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Coordinated from official exhibition time sheets, displaying morning and afternoon showtimes, live status badges, peak hour indicators, and department associations for all stages.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'tech' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs sm:text-sm">
                    <Cpu className="w-4 h-4" />
                    Three.js & WebGL
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Custom WebGL render pipeline, procedural geometry, cutaway partition walls, smooth camera tweening, and soft PBR materials running at 60-120 FPS.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-sky-600 font-bold text-xs sm:text-sm">
                    <Code2 className="w-4 h-4" />
                    React 18 & TypeScript
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Component architecture with full TypeScript type safety, decoupled hover detection, URL hash synchronization, and fast reactive UI state.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-violet-600 font-bold text-xs sm:text-sm">
                    <Layers className="w-4 h-4" />
                    Tailwind CSS & Glassmorphism
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Apple-inspired interface with backdrop blur, vibrancy docks, subtle borders, spring animations, and native touch support for phones and tablets.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs sm:text-sm">
                    <Sparkles className="w-4 h-4" />
                    Vite & Service Worker PWA
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Lightning-fast Vite build tooling with offline service worker caching, instant asset delivery, and installable Progressive Web App support.
                  </p>
                </div>
              </div>

              {/* Engineering Standards */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Engineering Quality & Verification
                </div>
                <p className="leading-relaxed">
                  Developed adhering to Gravitas reliability principles with automated Vitest suites covering geometry collision detection, scheduling window bounds, pathfinding routing, and accessibility.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200/80 bg-white/80 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div>
            Built with pride for <span className="font-semibold text-slate-800">Scientifica 2026</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
