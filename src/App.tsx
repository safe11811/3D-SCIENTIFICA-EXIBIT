import { useState, useEffect } from 'react';
import ThreeCanvas, { CameraViewPreset } from './components/ThreeCanvas';
import Header from './components/Header';
import ElevatorBar from './components/ElevatorBar';
import SubjectFilter from './components/SubjectFilter';
import CategoryLegend from './components/CategoryLegend';
import ExhibitDrawer from './components/ExhibitDrawer';
import SearchModal from './components/SearchModal';
import ScheduleView from './components/ScheduleView';
import HoverTooltip from './components/HoverTooltip';
import DirectionsMapModal from './components/DirectionsMapModal';
import NavigationHUD from './components/NavigationHUD';
import ShareModal from './components/ShareModal';
import ProjectInfoModal from './components/ProjectInfoModal';
import { FLOORS, Floor, Exhibit } from './data';
import { NavRoute, TourPlan } from './utils/navigation';

export default function App() {
  // Navigation states
  const [activeFloorId, setActiveFloorId] = useState<string | null>(null);
  const [activeExhibit, setActiveExhibit] = useState<Exhibit | null>(null);
  const [activeFloor, setActiveFloor] = useState<Floor | null>(null);
  const [activeSubjectFilter, setActiveSubjectFilter] = useState<string>('all');
  const [hasInteracted, setHasInteracted] = useState(false);

  // 3D Navigation & Tour states
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [activeRoute, setActiveRoute] = useState<NavRoute | null>(null);
  const [activeTour, setActiveTour] = useState<TourPlan | null>(null);
  const [currentTourStopIndex, setCurrentTourStopIndex] = useState(0);

  // Camera presets
  const [viewPreset, setViewPreset] = useState<CameraViewPreset>('iso');
  const [resetTrigger, setResetTrigger] = useState(0);

  // Enforce pure light mode
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, []);

  // App UI modes
  const [viewMode, setViewMode] = useState<'map' | 'schedule'>('map');

  // Modals
  const [searchOpen, setSearchOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [projectInfoOpen, setProjectInfoOpen] = useState(false);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      // While any modal or the schedule view is open, it owns the keyboard
      if (searchOpen || shareOpen || directionsOpen || projectInfoOpen || viewMode !== 'map') return;

      if (e.key === '/') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      } else if (e.key === '0' || e.key === 'b' || e.key === 'B') {
        handleSelectFloor('basement');
      } else if (e.key === '1' || e.key === 'g' || e.key === 'G') {
        handleSelectFloor('ground');
      } else if (e.key === '2' || e.key === 'f' || e.key === 'F') {
        // 1F has no public exhibits
      } else if (e.key === '3' || e.key === 's' || e.key === 'S') {
        handleSelectFloor('second');
      } else if (e.key === 'a' || e.key === 'A' || e.key === ' ') {
        e.preventDefault();
        handleResetCamera();
      } else if (e.key === 'ArrowRight' && activeExhibit) {
        e.preventDefault();
        handleNavigateNext();
      } else if (e.key === 'ArrowLeft' && activeExhibit) {
        e.preventDefault();
        handleNavigatePrev();
      } else if (e.key === 'Escape') {
        if (activeExhibit) {
          setActiveExhibit(null);
        } else if (activeFloorId) {
          setActiveFloorId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeExhibit, activeFloorId, activeFloor, searchOpen, shareOpen, directionsOpen, viewMode]);

  const handleSelectFloor = (floorId: string | null) => {
    setHasInteracted(true);
    setActiveFloorId(floorId);
    setActiveExhibit(null);
    if (floorId) {
      const f = FLOORS.find(item => item.id === floorId) || null;
      setActiveFloor(f);
    } else {
      setActiveFloor(null);
    }
  };

  const handleSelectExhibit = (exhibit: Exhibit | null, floor: Floor | null) => {
    setHasInteracted(true);
    setActiveExhibit(exhibit);
    if (floor) {
      setActiveFloor(floor);
      setActiveFloorId(floor.id);
    }
  };

  useEffect(() => {
    (window as any).__selectTestExhibit = (exId?: string) => {
      for (const f of FLOORS) {
        const ex = exId ? f.exhibits.find(e => e.id === exId) : f.exhibits[0];
        if (ex) {
          handleSelectExhibit(ex, f);
          return;
        }
      }
    };
    (window as any).__selectFloor = (flId: string | null) => {
      handleSelectFloor(flId);
    };
  }, []);

  // Deep links: restore #exhibit=<id> / #floor=<id> from a shared link and respond to hash changes
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      const exhibitMatch = /#exhibit=([A-Za-z0-9_-]+)/.exec(hash);
      if (exhibitMatch) {
        for (const f of FLOORS) {
          const ex = f.exhibits.find(e => e.id === exhibitMatch[1]);
          if (ex) {
            handleSelectExhibit(ex, f);
            return;
          }
        }
      }
      const floorMatch = /#floor=([A-Za-z0-9_-]+)/.exec(hash);
      if (floorMatch && FLOORS.some(f => f.id === floorMatch[1] && f.exhibits.length > 0)) {
        handleSelectFloor(floorMatch[1]);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the URL shareable: mirror the current room/floor into the address bar
  useEffect(() => {
    const hash = activeExhibit
      ? `#exhibit=${activeExhibit.id}`
      : activeFloorId
        ? `#floor=${activeFloorId}`
        : '';
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search + hash);
    }
  }, [activeExhibit, activeFloorId]);

  const handleResetCamera = () => {
    setHasInteracted(true);
    setActiveExhibit(null);
    setActiveFloorId(null);
    setActiveFloor(null);
    setActiveSubjectFilter('all');
    setViewPreset('iso');
    setResetTrigger(prev => prev + 1);
  };

  const handleNavigateNext = () => {
    if (!activeFloor || !activeExhibit) return;
    const nonStairs = activeFloor.exhibits.filter(e => !e.id.includes('_str') && !e.id.includes('stairs'));
    const currentIndex = nonStairs.findIndex(e => e.id === activeExhibit.id);
    const nextIndex = (currentIndex + 1) % nonStairs.length;
    const nextExhibit = nonStairs[nextIndex];
    if (nextExhibit) {
      handleSelectExhibit(nextExhibit, activeFloor);
    }
  };

  const handleNavigatePrev = () => {
    if (!activeFloor || !activeExhibit) return;
    const nonStairs = activeFloor.exhibits.filter(e => !e.id.includes('_str') && !e.id.includes('stairs'));
    const currentIndex = nonStairs.findIndex(e => e.id === activeExhibit.id);
    const prevIndex = (currentIndex - 1 + nonStairs.length) % nonStairs.length;
    const prevExhibit = nonStairs[prevIndex];
    if (prevExhibit) {
      handleSelectExhibit(prevExhibit, activeFloor);
    }
  };

  const handleRequestDirections = (exhibit: Exhibit, floor: Floor) => {
    setActiveExhibit(exhibit);
    setActiveFloor(floor);
    setDirectionsOpen(true);
  };

  const handleConfirmRoute = (route: NavRoute) => {
    setActiveRoute(route);
    setActiveTour(null);
    setDirectionsOpen(false);
    setActiveExhibit(null);
    // Switch to starting floor so visitor sees their current start pin and path
    handleSelectFloor(route.start.floorId);
  };

  const handleConfirmTour = (tour: TourPlan) => {
    setActiveTour(tour);
    setActiveRoute(null);
    setCurrentTourStopIndex(0);
    setDirectionsOpen(false);
    const firstStop = tour.stops[0];
    if (firstStop) {
      handleSelectExhibit(firstStop.exhibit, firstStop.floor);
    }
  };

  const handleNextTourStop = () => {
    if (!activeTour) return;
    const nextIdx = (currentTourStopIndex + 1) % activeTour.stops.length;
    setCurrentTourStopIndex(nextIdx);
    const stop = activeTour.stops[nextIdx];
    if (stop) {
      handleSelectExhibit(stop.exhibit, stop.floor);
    }
  };

  const handlePrevTourStop = () => {
    if (!activeTour) return;
    const prevIdx = (currentTourStopIndex - 1 + activeTour.stops.length) % activeTour.stops.length;
    setCurrentTourStopIndex(prevIdx);
    const stop = activeTour.stops[prevIdx];
    if (stop) {
      handleSelectExhibit(stop.exhibit, stop.floor);
    }
  };

  const handleCloseNavigation = () => {
    setActiveRoute(null);
    setActiveTour(null);
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#f8fafc]">
      {/* Ultra-subtle Apple-grade radial vignette directing focus toward central 3D campus */}
      <div
        className="fixed inset-0 pointer-events-none z-10 bg-[radial-gradient(ellipse_at_center,transparent_65%,rgba(15,23,42,0.04)_85%,rgba(15,23,42,0.10)_100%)]"
        aria-hidden="true"
      />

      {/* 3D WebGL Canvas Engine */}
      <ThreeCanvas
        activeFloorId={activeFloorId}
        activeExhibitId={activeExhibit?.id || null}
        activeSubjectFilter={activeSubjectFilter}
        viewPreset={viewPreset}
        activeRoute={activeRoute}
        activeTour={activeTour}
        currentTourStopIndex={currentTourStopIndex}
        resetTrigger={resetTrigger}
        onSelectExhibit={(ex, fl) => {
          handleSelectExhibit(ex, fl);
        }}
        onSelectFloor={(flId) => {
          handleSelectFloor(flId);
        }}
        onHoverExhibit={() => {}}
      />

      {/* Header & Breadcrumb Strip */}
      <Header
        activeFloorId={activeFloorId}
        activeExhibit={activeExhibit}
        activeFloor={activeFloor}
        viewMode={viewMode}
        onSelectFloor={handleSelectFloor}
        onClearExhibit={() => setActiveExhibit(null)}
        onToggleViewMode={() => setViewMode(prev => prev === 'map' ? 'schedule' : 'map')}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenDirections={() => setDirectionsOpen(true)}
        onResetView={() => {
          handleResetCamera();
          handleCloseNavigation();
        }}
        onOpenProjectInfo={() => setProjectInfoOpen(true)}
      />

      {/* On-Screen Navigation & Tour Flow HUD */}
      <NavigationHUD
        activeRoute={activeRoute}
        activeTour={activeTour}
        currentTourStopIndex={currentTourStopIndex}
        onNextTourStop={handleNextTourStop}
        onPrevTourStop={handlePrevTourStop}
        onCloseNavigation={handleCloseNavigation}
        onReopen2DMap={() => setDirectionsOpen(true)}
        onSelectExhibit={handleSelectExhibit}
      />

      {/* First load guidance hint */}
      {!hasInteracted && !activeFloorId && !activeExhibit && !activeRoute && !activeTour && (
        <div className="fixed top-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300 font-sans">
          <div className="liquid-glass-dock px-4 py-2 rounded-2xl text-slate-800 text-xs sm:text-sm font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neutral-900 animate-pulse" />
            <span>Tap a floor to explore</span>
          </div>
        </div>
      )}

      {/* Floating Hover Indicator when hovering 3D room (Desktop only - fully decoupled for 120+ FPS) */}
      {!activeExhibit && !activeRoute && <HoverTooltip />}

      {/* Elevator Selector Bar (Right Edge) */}
      <ElevatorBar
        activeFloorId={activeFloorId}
        onSelectFloor={handleSelectFloor}
        isCompact={!!activeExhibit}
      />

      {/* Small Collapsible Category Color Legend (Bottom Left) */}
      <CategoryLegend
        activeSubject={activeSubjectFilter}
        onSelectSubject={setActiveSubjectFilter}
        hideOnMobile={!!activeExhibit || !!activeRoute}
      />

      {/* Subject Filter Bar (Bottom Center) */}
      <SubjectFilter
        activeSubject={activeSubjectFilter}
        activeFloorId={activeFloorId}
        onSelectSubject={setActiveSubjectFilter}
        hideOnMobile={!!activeExhibit || !!activeRoute}
      />

      {/* Active Exhibit Drawer (Multi-tab Detailed Info & Location) */}
      <ExhibitDrawer
        exhibit={activeExhibit}
        floor={activeFloor}
        onClose={() => setActiveExhibit(null)}
        onNavigateNext={handleNavigateNext}
        onRequestDirections={handleRequestDirections}
        onOpenShare={() => setShareOpen(true)}
      />

      {/* 2D School Top-Down Interactive Map & Directions Modal */}
      <DirectionsMapModal
        isOpen={directionsOpen}
        onClose={() => setDirectionsOpen(false)}
        targetExhibit={activeExhibit}
        targetFloor={activeFloor}
        onConfirmRoute={handleConfirmRoute}
        onConfirmTour={handleConfirmTour}
      />

      {/* Search & Quick Finder Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectExhibit={(exhibit, floor) => {
          setViewMode('map');
          handleSelectExhibit(exhibit, floor);
        }}
      />

      {/* Live Exhibition Schedule Overlay */}
      {viewMode === 'schedule' && (
        <ScheduleView
          onSelectExhibit={(exhibit, floor) => {
            setViewMode('map');
            handleSelectExhibit(exhibit, floor);
          }}
          onClose={() => setViewMode('map')}
        />
      )}

      {/* Share & QR Modal (deep-links to the current room) */}
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        exhibitTitle={activeExhibit?.title ?? null}
      />

      {/* Project Info & Credits Modal */}
      <ProjectInfoModal
        isOpen={projectInfoOpen}
        onClose={() => setProjectInfoOpen(false)}
      />
    </div>
  );
}
