import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  MapPin,
  Navigation,
  Sparkles,
  Footprints,
  Clock,
  Layers,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowUpDown,
  Compass
} from 'lucide-react';
import { FLOORS, Floor, Exhibit, SUBJECTS, BUILDING_CONFIG } from '../data';
import {
  NavWaypoint,
  NavRoute,
  TourPlan,
  PRESET_START_POINTS,
  calculateOptimalRoute,
  generateExhibitionTourPlan
} from '../utils/navigation';

interface DirectionsMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetExhibit: Exhibit | null;
  targetFloor: Floor | null;
  onConfirmRoute: (route: NavRoute) => void;
  onConfirmTour: (tour: TourPlan) => void;
}

export default function DirectionsMapModal({
  isOpen,
  onClose,
  targetExhibit,
  targetFloor,
  onConfirmRoute,
  onConfirmTour
}: DirectionsMapModalProps) {
  // Navigation mode: 'point_to_point' (Directions) or 'tour' (All Exhibits Tour)
  const [navMode, setNavMode] = useState<'point_to_point' | 'tour'>('point_to_point');

  // Mobile viewport view tab: 'route' (form & steps) | 'map' (2D floor explorer)
  const [mobileTab, setMobileTab] = useState<'route' | 'map'>('route');

  // Active Floor view in 2D map
  const [selectedFloorId, setSelectedFloorId] = useState<string>('ground');

  // Start Waypoint (defaults to Main Entrance, or user chosen room)
  const [userPin, setUserPin] = useState<NavWaypoint>(PRESET_START_POINTS.main_entrance);
  const [startExhibit, setStartExhibit] = useState<{ exhibit: Exhibit; floor: Floor } | null>(null);

  // Destination (defaults to targetExhibit or first popular exhibit)
  const [destination, setDestination] = useState<{ exhibit: Exhibit; floor: Floor }>(() => {
    if (targetExhibit && targetFloor) {
      return { exhibit: targetExhibit, floor: targetFloor };
    }
    const gf = FLOORS.find(f => f.id === 'ground') || FLOORS[1];
    // Default to an interesting exhibit like Laser Interferometry or Quantum CS
    const defaultEx =
      gf.exhibits.find(e => e.id === 'g_c_w2') ||
      gf.exhibits.find(e => !e.id.includes('_str') && !e.id.includes('stairs')) ||
      gf.exhibits[0];
    return { exhibit: defaultEx, floor: gf };
  });

  // Active pin target for direct map placement: 'start' | 'destination'
  const [pinMode, setPinMode] = useState<'start' | 'destination'>('start');
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [activePicker, setActivePicker] = useState<'start' | 'destination' | null>(null);
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');
  const [pickerFloorFilter, setPickerFloorFilter] = useState<'all' | 'second' | 'ground' | 'basement'>('all');

  const [showSteps, setShowSteps] = useState(false);

  // Map Pan & Zoom states
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggingTarget, setDraggingTarget] = useState<'start' | 'destination' | null>(null);

  const dragStartRef = useRef<{ x: number; y: number; startPanX: number; startPanY: number }>({
    x: 0,
    y: 0,
    startPanX: 0,
    startPanY: 0
  });
  const pointerDownPosRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const hasMovedRef = useRef<boolean>(false);

  // Sync destination when modal opens or target props change
  useEffect(() => {
    if (isOpen) {
      setNavMode('point_to_point');
      setMobileTab('route');
      setPinMode('start');
      if (targetExhibit && targetFloor) {
        setDestination({ exhibit: targetExhibit, floor: targetFloor });
        setSelectedFloorId(targetFloor.id);
        // If target exhibit is the entrance itself, default start to Reception so start != dest
        if (targetExhibit.id === 'g_stage') {
          setUserPin(PRESET_START_POINTS.reception);
          setStartExhibit(null);
        } else {
          setUserPin(PRESET_START_POINTS.main_entrance);
          setStartExhibit(null);
        }
      }
      setActivePicker(null);
      setPickerSearchQuery('');
    }
  }, [isOpen, targetExhibit, targetFloor]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const activeFloor = useMemo(
    () => FLOORS.find(f => f.id === selectedFloorId) || FLOORS[1],
    [selectedFloorId]
  );

  // Compute live point-to-point route for currently selected destination
  const computedRoute = useMemo(() => {
    if (!destination.exhibit || !destination.floor) return null;
    return calculateOptimalRoute(userPin, destination.exhibit, destination.floor);
  }, [userPin, destination]);

  // Compute live exhibition tour plan
  const computedTour = useMemo(() => {
    return generateExhibitionTourPlan(userPin);
  }, [userPin]);

  // All destinations list for search
  const allDestinations = useMemo(() => {
    const list: { exhibit: Exhibit; floor: Floor }[] = [];
    FLOORS.forEach(f => {
      f.exhibits
        .filter(e => !e.id.includes('_str') && !e.id.includes('stairs'))
        .forEach(e => {
          list.push({ exhibit: e, floor: f });
        });
    });
    return list;
  }, []);

  // Filtered rooms for picker
  const filteredPickerItems = useMemo(() => {
    let items = allDestinations;
    if (pickerFloorFilter !== 'all') {
      items = items.filter(d => d.floor.id === pickerFloorFilter);
    }
    if (pickerSearchQuery.trim()) {
      const q = pickerSearchQuery.toLowerCase();
      items = items.filter(
        d =>
          d.exhibit.room.toLowerCase().includes(q) ||
          d.exhibit.title.toLowerCase().includes(q) ||
          d.exhibit.subject.toLowerCase().includes(q) ||
          d.floor.name.toLowerCase().includes(q)
      );
    }
    return items;
  }, [allDestinations, pickerFloorFilter, pickerSearchQuery]);

  // Landmark presets list for Start selection
  const landmarkPresets = useMemo(
    () => [
      { key: 'main_entrance', label: 'Main Entrance Stage', point: PRESET_START_POINTS.main_entrance },
      { key: 'reception', label: 'Reception Foyer', point: PRESET_START_POINTS.reception },
      { key: 'cemented_area', label: 'Cemented Area (Sports Plaza)', point: { x: -1.5, y: 6.5, z: -47.25, floorId: 'ground', name: 'Cemented Area' } },
      { key: 'west_stairs_gf', label: 'West Staircase (GF)', point: PRESET_START_POINTS.west_stairs_gf },
      { key: 'east_stairs_gf', label: 'East Staircase (GF)', point: PRESET_START_POINTS.east_stairs_gf },
      { key: 'big_quad', label: 'Big Quadrangle (Atrium)', point: PRESET_START_POINTS.big_quad }
    ],
    []
  );

  if (!isOpen) return null;

  // 2D SVG Coordinate System mapping:
  // With generous padding so top stage, outdoor sports plaza, and pins NEVER clip outside viewport
  const isGround = activeFloor.id === 'ground';
  const svgWidth = 860;
  const svgHeight = isGround ? 1160 : 940;
  const svgCenterX = 430;
  const svgCenterY = isGround ? 800 : 480;
  const svgScale = isGround ? 11.5 : 15.5;

  const toSvgX = (x: number) => svgCenterX + x * svgScale;
  const toSvgY = (z: number) => svgCenterY + z * svgScale;
  const toWorldX = (svgX: number) => (svgX - svgCenterX) / svgScale;
  const toWorldZ = (svgY: number) => (svgY - svgCenterY) / svgScale;

  // Helper to place pin at specific world coordinate
  const placePinAtWorldCoords = (wx: number, wz: number, targetModeOverride?: 'start' | 'destination') => {
    const targetMode = targetModeOverride || pinMode;
    const clampedX = Math.max(-22.5, Math.min(22.5, Math.round(wx * 10) / 10));
    const minZ = isGround ? -61.0 : -26.5;
    const clampedZ = Math.max(minZ, Math.min(20.5, Math.round(wz * 10) / 10));

    // Check if inside or near any room on activeFloor
    let targetRoom: Exhibit | null = null;
    let closestDist = Infinity;
    for (const ex of activeFloor.exhibits) {
      if (ex.id.includes('_str') || ex.id.includes('stairs')) continue;
      const inX = Math.abs(clampedX - ex.px) <= ex.w / 2;
      const inZ = Math.abs(clampedZ - ex.pz) <= ex.d / 2;
      if (inX && inZ) {
        targetRoom = ex;
        break;
      }
      const dist = Math.hypot(clampedX - ex.px, clampedZ - ex.pz);
      if (dist < closestDist) {
        closestDist = dist;
        if (dist <= 3.8) targetRoom = ex;
      }
    }

    if (targetMode === 'destination') {
      if (targetRoom) {
        setDestination({ exhibit: targetRoom, floor: activeFloor });
      } else {
        const fallback = activeFloor.exhibits.find(e => !e.id.includes('_str') && !e.id.includes('stairs')) || activeFloor.exhibits[0];
        setDestination({ exhibit: fallback, floor: activeFloor });
      }
    } else {
      const pinName = targetRoom
        ? `${targetRoom.room} (${activeFloor.shortName})`
        : `Corridor (${activeFloor.shortName})`;

      const newPin: NavWaypoint = {
        x: clampedX,
        y: activeFloor.baseY + 0.15,
        z: clampedZ,
        floorId: activeFloor.id,
        name: pinName
      };

      setUserPin(newPin);
      setStartExhibit(targetRoom ? { exhibit: targetRoom, floor: activeFloor } : null);
    }
  };

  // Pointer Drag, Pan, and Direct Pin Movement handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    hasMovedRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPanX: panOffset.x,
      startPanY: panOffset.y
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const dx = e.clientX - pointerDownPosRef.current.x;
    const dy = e.clientY - pointerDownPosRef.current.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 8) {
      hasMovedRef.current = true;
    }

    // Active Pin Dragging
    if (draggingTarget) {
      const svgP = getSvgPoint(e);
      if (svgP) {
        const minZ = isGround ? -61.0 : -26.5;
        const wx = Math.max(-22.5, Math.min(22.5, Math.round(toWorldX(svgP.x) * 10) / 10));
        const wz = Math.max(minZ, Math.min(20.5, Math.round(toWorldZ(svgP.y) * 10) / 10));
        if (draggingTarget === 'start') {
          setUserPin(prev => ({ ...prev, x: wx, z: wz, floorId: activeFloor.id }));
        }
      }
      return;
    }

    // Map Panning
    if (hasMovedRef.current && (e.buttons === 1)) {
      setIsDragging(true);
      setPanOffset({
        x: dragStartRef.current.startPanX + dx,
        y: dragStartRef.current.startPanY + dy
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingTarget) {
      const svgP = getSvgPoint(e);
      if (svgP) {
        const wx = toWorldX(svgP.x);
        const wz = toWorldZ(svgP.y);
        placePinAtWorldCoords(wx, wz, draggingTarget);
      }
      setDraggingTarget(null);
      setIsDragging(false);
      return;
    }

    setIsDragging(false);

    // If pointer was pressed and released without significant drag: TAP / CLICK!
    if (!hasMovedRef.current && (Date.now() - pointerDownPosRef.current.time < 500)) {
      const svgP = getSvgPoint(e);
      if (svgP) {
        const wx = toWorldX(svgP.x);
        const wz = toWorldZ(svgP.y);
        placePinAtWorldCoords(wx, wz);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    setZoomLevel(prev => Math.max(0.65, Math.min(2.8, Number((prev * factor).toFixed(2)))));
  };

  // Exact W3C matrix inverse transform for SVG coordinates
  const getSvgPoint = (e: React.MouseEvent<SVGSVGElement> | React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    return pt.matrixTransform(ctm.inverse());
  };

  // Direct click fallback
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (hasMovedRef.current) return;
    const svgP = getSvgPoint(e);
    if (!svgP) return;
    const wx = toWorldX(svgP.x);
    const wz = toWorldZ(svgP.y);
    placePinAtWorldCoords(wx, wz);
  };

  // Reset Map View
  const handleResetMap = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
    setUserPin(PRESET_START_POINTS.main_entrance);
    setStartExhibit(null);
    if (destination.floor) {
      setSelectedFloorId(destination.floor.id);
    } else {
      setSelectedFloorId('ground');
    }
  };

  // Choose Start Point from exhibit
  const handleSelectStartExhibit = (exhibit: Exhibit, floor: Floor) => {
    const newPin: NavWaypoint = {
      x: exhibit.px,
      y: floor.baseY + 0.15,
      z: exhibit.pz,
      floorId: floor.id,
      name: `${exhibit.room} (${floor.shortName})`
    };
    setUserPin(newPin);
    setStartExhibit({ exhibit, floor });
    setActivePicker(null);
  };

  // Choose Start Landmark
  const handleSelectStartLandmark = (point: NavWaypoint) => {
    setUserPin(point);
    setStartExhibit(null);
    setActivePicker(null);
  };

  // Choose Destination
  const handleSelectDestination = (exhibit: Exhibit, floor: Floor) => {
    setDestination({ exhibit, floor });
    setSelectedFloorId(floor.id);
    setActivePicker(null);
  };

  // Swap Start & Destination (like Google/Apple Maps)
  const handleSwapLocations = () => {
    const prevDestination = destination;

    // New destination becomes previous start exhibit or fallback
    let newDestinationExhibit: { exhibit: Exhibit; floor: Floor } | null = null;
    if (startExhibit) {
      newDestinationExhibit = startExhibit;
    } else {
      // Find exhibit nearest to userPin or default to stage/reception
      const found = allDestinations.find(
        d =>
          Math.hypot(d.exhibit.px - userPin.x, d.exhibit.pz - userPin.z) < 2.0 &&
          d.floor.id === userPin.floorId
      );
      if (found) {
        newDestinationExhibit = found;
      } else {
        const gf = FLOORS.find(f => f.id === 'ground') || FLOORS[1];
        newDestinationExhibit = { exhibit: gf.exhibits[0], floor: gf };
      }
    }

    // New start becomes old destination
    const newStartPin: NavWaypoint = {
      x: prevDestination.exhibit.px,
      y: prevDestination.floor.baseY + 0.15,
      z: prevDestination.exhibit.pz,
      floorId: prevDestination.floor.id,
      name: `${prevDestination.exhibit.room} (${prevDestination.floor.shortName})`
    };

    setUserPin(newStartPin);
    setStartExhibit(prevDestination);
    setDestination(newDestinationExhibit);
    setSelectedFloorId(newDestinationExhibit.floor.id);
  };

  const handleStartPointToPoint = () => {
    if (computedRoute) {
      onConfirmRoute(computedRoute);
      onClose();
    }
  };

  const handleStartTour = () => {
    onConfirmTour(computedTour);
    onClose();
  };

  const isSameRoom =
    destination.exhibit &&
    userPin &&
    destination.floor.id === userPin.floorId &&
    Math.hypot(destination.exhibit.px - userPin.x, destination.exhibit.pz - userPin.z) < 2.0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-4 md:p-6 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200 font-sans"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full max-w-7xl max-h-[920px] liquid-glass-panel rounded-2xl sm:rounded-3xl border border-white/90 shadow-2xl shadow-slate-900/10 flex flex-col md:flex-row overflow-hidden text-slate-900 animate-in fade-in zoom-in-[0.98] duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* ============================================================== */}
        {/* MOBILE TOP NAVIGATION BAR & CLOSE (Visible on < md screens)    */}
        {/* ============================================================== */}
        <div className="md:hidden flex items-center justify-between gap-2 p-2.5 sm:p-3 bg-white/95 border-b border-slate-200/90 z-30 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-neutral-950 text-white flex items-center justify-center shadow-xs shrink-0">
              <Navigation className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-extrabold text-sm text-slate-900 truncate">
                Directions
              </h2>
              <span className="text-[10px] text-slate-500 block truncate">
                {navMode === 'point_to_point' ? 'Route Planner' : 'Full Tour'}
              </span>
            </div>
          </div>

          {/* Mobile Segmented View Switcher: [ Route ] vs [ 2D Map ] */}
          <div className="flex items-center p-1 bg-black/[0.06] rounded-xl text-xs font-bold shrink-0">
            <button
              onClick={() => {
                setMobileTab('route');
              }}
              className={`apple-press px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                mobileTab === 'route'
                  ? 'bg-neutral-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Route</span>
            </button>
            <button
              onClick={() => {
                setMobileTab('map');
              }}
              className={`apple-press px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                mobileTab === 'map'
                  ? 'bg-neutral-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>2D Map</span>
            </button>
          </div>

          {/* Sticky Mobile Close Button */}
          <button
            onClick={() => {
              onClose();
            }}
            className="apple-press w-9 h-9 flex items-center justify-center text-slate-700 hover:text-black bg-slate-100/90 rounded-xl border border-slate-200 shadow-2xs cursor-pointer shrink-0"
            aria-label="Close directions modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* LEFT COLUMN: NAVIGATION FORM & ROUTE STATION                   */}
        {/* ============================================================== */}
        <div className={`w-full md:w-[410px] lg:w-[440px] shrink-0 border-b md:border-b-0 md:border-r border-slate-200/80 bg-white/85 flex flex-col z-20 shadow-xs overflow-hidden ${
          mobileTab === 'route' ? 'flex-1' : 'hidden md:flex'
        }`}>
          {/* Top Console Header (Desktop) */}
          <div className="hidden md:flex p-4 sm:p-5 border-b border-slate-200/80 items-center justify-between gap-3 bg-white/95">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-neutral-950 text-white flex items-center justify-center shadow-md shrink-0">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-base text-slate-900 tracking-tight leading-tight">
                  Campus Directions
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  {navMode === 'point_to_point' ? 'Enter start and destination' : 'All-exhibit guided tour'}
                </p>
              </div>
            </div>

            {/* Mode Switcher Pills */}
            <div className="flex items-center p-1 bg-black/[0.05] rounded-2xl text-xs font-semibold">
              <button
                onClick={() => {
                  setNavMode('point_to_point');
                }}
                className={`apple-press px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  navMode === 'point_to_point'
                    ? 'bg-neutral-950 text-white shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Direct Route between two rooms"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Directions</span>
              </button>
              <button
                onClick={() => {
                  setNavMode('tour');
                }}
                className={`apple-press px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  navMode === 'tour'
                    ? 'bg-neutral-950 text-white shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={`Full ${computedTour.stops.length}-Exhibit circular tour`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tour</span>
              </button>
            </div>
          </div>

          {/* Mode 1: Point to Point Directions */}
          {navMode === 'point_to_point' ? (
            <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* Apple / Google Maps Style Dual Input Card */}
              <div className="relative p-3.5 rounded-2xl liquid-glass-card border border-white/20 shadow-xs space-y-3">
                {/* Connecting Line Between Start & Destination */}
                <div className="absolute left-[26px] top-[34px] bottom-[34px] w-0.5 border-l-2 border-dashed border-slate-300 pointer-events-none" />

                {/* 1. STARTING LOCATION (A) */}
                <div className="relative flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-1 z-10 ${
                      pinMode === 'start'
                        ? 'bg-neutral-950 text-white ring-2 ring-neutral-900 ring-offset-2'
                        : 'bg-neutral-800 text-white'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between pb-0.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-900">
                        Starting Location
                      </span>
                      <button
                        onClick={() => {
                          setPinMode('start');
                        }}
                        className={`text-[11px] font-bold cursor-pointer transition-colors ${
                          pinMode === 'start' ? 'text-neutral-950 underline' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {pinMode === 'start' ? '📍 Active on Map' : 'Tap Map to Pin'}
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setPinMode('start');
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all shadow-2xs cursor-pointer flex items-center justify-between gap-2 ${
                        pinMode === 'start'
                          ? 'bg-white border-neutral-900 ring-1 ring-neutral-900'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 truncate block">
                          {userPin.name || 'Custom Pin on Map'}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate block">
                          Floor: {FLOORS.find(f => f.id === userPin.floorId)?.shortName || 'Ground'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-950 text-white shrink-0 uppercase">
                        {pinMode === 'start' ? 'Pinning' : 'Start'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* SWAP BUTTON (Right side in between inputs) */}
                <div className="flex justify-end pr-1 -my-1">
                  <button
                    onClick={handleSwapLocations}
                    className="w-7 h-7 rounded-full bg-[#F8F9FB] border border-slate-200 text-slate-600 hover:text-black hover:border-neutral-900 flex items-center justify-center shadow-xs transition-transform active:rotate-180 cursor-pointer"
                    title="Reverse starting point and destination"
                    aria-label="Reverse starting point and destination"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 2. DESTINATION (B) */}
                <div className="relative flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-1 z-10 ${
                      pinMode === 'destination'
                        ? 'bg-neutral-950 text-white ring-2 ring-neutral-900 ring-offset-2'
                        : 'bg-neutral-800 text-white'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between pb-0.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-900">
                        Destination
                      </span>
                      <button
                        onClick={() => {
                          setPinMode('destination');
                        }}
                        className={`text-[11px] font-bold cursor-pointer transition-colors ${
                          pinMode === 'destination'
                            ? 'text-neutral-950 underline'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {pinMode === 'destination' ? '🎯 Active on Map' : 'Tap Map to Pin'}
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setPinMode('destination');
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all shadow-2xs cursor-pointer flex items-center justify-between gap-2 ${
                        pinMode === 'destination'
                          ? 'bg-white border-neutral-900 ring-1 ring-neutral-900'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          {destination.exhibit.room}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate block">
                          {destination.exhibit.title} · {destination.floor.shortName}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-900 text-white shrink-0 uppercase">
                        {pinMode === 'destination' ? 'Pinning' : 'Target'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Quick Start Presets row */}
                <div className="pt-2 border-t border-slate-200/80 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                    Presets:
                  </span>
                  {landmarkPresets.map(lm => {
                    const isSelected = userPin.name === lm.point.name;
                    return (
                      <button
                        key={lm.key}
                        onClick={() => handleSelectStartLandmark(lm.point)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-950 text-white border-neutral-950'
                            : 'bg-[#F8F9FB] text-slate-700 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {lm.label.replace(' (GF)', '')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Direct Pinning Helper Notice & Optional Search Button */}
              <div className="flex items-center justify-between px-1 text-xs">
                <span className="text-[11px] font-semibold text-slate-600">
                  {pinMode === 'start'
                    ? '📍 Click anywhere on map to drop Start Pin'
                    : '🎯 Click any room on map to set Destination'}
                </span>
                <button
                  onClick={() => setActivePicker(activePicker ? null : 'destination')}
                  className="text-[11px] font-bold text-slate-700 hover:text-black underline cursor-pointer"
                >
                  {activePicker ? 'Hide search' : 'Search by name'}
                </button>
              </div>

              {/* SEARCH / PICKER DRAWER (Optional, only when explicitly toggled) */}
              {activePicker && (
                <div className="p-3.5 rounded-2xl bg-[#F8F9FB] border border-slate-300 shadow-xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-neutral-900" />
                      <span>{activePicker === 'start' ? 'Choose Starting Location' : 'Choose Destination'}</span>
                    </span>
                    <button
                      onClick={() => setActivePicker(null)}
                      className="text-slate-400 hover:text-slate-800 p-1 rounded-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={pickerSearchQuery}
                      onChange={e => setPickerSearchQuery(e.target.value)}
                      placeholder="Search room name, topic, science..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 font-medium"
                      autoFocus
                    />
                  </div>

                  {/* Floor Filters */}
                  <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-bold">
                    {(['all', 'second', 'ground', 'basement'] as const).map(flKey => (
                      <button
                        key={flKey}
                        onClick={() => setPickerFloorFilter(flKey)}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer capitalize ${
                          pickerFloorFilter === flKey
                            ? 'bg-neutral-950 text-white font-extrabold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {flKey === 'all'
                          ? 'All Floors'
                          : flKey === 'second'
                          ? '2nd Floor'
                          : flKey === 'ground'
                          ? 'Ground (GF)'
                          : 'Basement'}
                      </button>
                    ))}
                  </div>

                  {/* Filtered Results List */}
                  <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-[#F8F9FB]">
                    {filteredPickerItems.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No exhibits match your search
                      </div>
                    ) : (
                      filteredPickerItems.map(({ exhibit, floor }) => {
                        const isChosen =
                          activePicker === 'destination'
                            ? destination.exhibit.id === exhibit.id && destination.floor.id === floor.id
                            : startExhibit?.exhibit.id === exhibit.id && startExhibit?.floor.id === floor.id;
                        const sub = SUBJECTS[exhibit.subject] || SUBJECTS.general;

                        return (
                          <button
                            key={`${floor.id}_${exhibit.id}`}
                            onClick={() => {
                              if (activePicker === 'destination') {
                                handleSelectDestination(exhibit, floor);
                              } else {
                                handleSelectStartExhibit(exhibit, floor);
                              }
                            }}
                            className={`w-full py-2 px-2.5 text-left flex items-center justify-between hover:bg-neutral-200/50 transition-colors cursor-pointer ${
                              isChosen ? 'bg-neutral-200 text-neutral-950 font-bold' : 'text-slate-800'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: sub.css }}
                                />
                                <span className="text-xs truncate font-semibold">{exhibit.room}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {exhibit.title} · {floor.shortName}
                              </span>
                            </div>
                            {isChosen && <Check className="w-3.5 h-3.5 text-neutral-900 shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Same Room Warning */}
              {isSameRoom && (
                <div className="p-3 rounded-xl bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-neutral-800 shrink-0" />
                  <span>Start and Destination are the same room. Select a destination to see path.</span>
                </div>
              )}

              {/* Clean Route Statistics Bar */}
              {computedRoute && !isSameRoom && (
                <div className="p-3 rounded-2xl liquid-glass-dock flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5 text-slate-900">
                    <Footprints className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="tabular-nums">~{computedRoute.totalDistanceMeters}m walk</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="tabular-nums">~{computedRoute.estimatedMinutes} min</span>
                  </span>
                  {computedRoute.usesStairs && (
                    <span className="flex items-center gap-1 text-indigo-800 text-[11px] bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                      <Layers className="w-3 h-3 text-indigo-600" />
                      <span>Via Stairs</span>
                    </span>
                  )}
                </div>
              )}

              {/* Turn-by-Turn Guidance Accordion */}
              {computedRoute && computedRoute.steps && computedRoute.steps.length > 0 && !isSameRoom && (
                <div className="space-y-1.5">
                  <button
                    onClick={() => setShowSteps(!showSteps)}
                    className="w-full flex items-center justify-between text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors py-1 cursor-pointer"
                  >
                    <span>{computedRoute.steps.length} Route Navigation Steps</span>
                    {showSteps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showSteps && (
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {computedRoute.steps.map((st, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-[#F8F9FB] border border-slate-200/80 text-[11px] flex items-start gap-2 shadow-2xs"
                        >
                          <span className="w-4 h-4 rounded-full bg-neutral-900 font-bold text-[9px] text-white flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 leading-snug">{st.instruction}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Button: Start 3D Path */}
              <div className="pt-2 mt-auto space-y-2">
                <button
                  onClick={() => {
                    setMobileTab('map');
                  }}
                  className="md:hidden apple-press w-full min-h-[42px] px-4 py-2 rounded-xl liquid-glass-btn text-slate-800 hover:text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <span>View Route on 2D Floor Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleStartPointToPoint}
                  disabled={isSameRoom}
                  className={`apple-press w-full min-h-[48px] px-5 py-3 rounded-2xl font-extrabold text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isSameRoom
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-neutral-950 hover:bg-neutral-800 text-white'
                  }`}
                >
                  <span>Launch 3D Navigation Path</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Mode 2: All Exhibits Tour */
            <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-y-auto space-y-4">
              <div className="p-4 rounded-2xl liquid-glass-card border border-white/20 space-y-2.5">
                <div className="flex items-center gap-2 font-extrabold text-neutral-950 text-sm">
                  <Sparkles className="w-4 h-4 text-neutral-800" />
                  <span>{computedTour.stops.length}-Exhibit Circular Flow</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Continuous exhibition sequence visiting all exhibits across Ground → First → Basement without
                  back-tracking.
                </p>
                <div className="flex items-center justify-between text-xs font-bold text-neutral-950 pt-2 border-t border-white/10">
                  <span>~{computedTour.totalDistanceMeters}m walk</span>
                  <span>{computedTour.stops.length} Stops</span>
                </div>
              </div>

              {/* Sequence Preview */}
              <div className="space-y-1.5 flex-1 max-h-64 overflow-y-auto pr-1">
                {computedTour.stops.slice(0, 8).map((st, i) => (
                  <div
                    key={st.exhibit.id}
                    className="p-2.5 rounded-xl liquid-glass-card border border-white/20 text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="w-4 h-4 rounded-full bg-neutral-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="font-semibold text-slate-800 truncate">{st.exhibit.room}</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                      {st.floor.shortName}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 mt-auto space-y-2">
                <button
                  onClick={() => {
                    setMobileTab('map');
                  }}
                  className="md:hidden apple-press w-full min-h-[42px] px-4 py-2 rounded-xl liquid-glass-btn text-slate-800 hover:text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <span>View Stops on 2D Floor Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleStartTour}
                  className="apple-press w-full min-h-[48px] px-5 py-3 rounded-2xl bg-neutral-950 hover:bg-neutral-800 text-white font-extrabold text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Start Full 3D Tour Flow</span>
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: INTERACTIVE 2D VECTOR MAP & EXPLORER             */}
        {/* ============================================================== */}
        <div className={`flex-1 relative flex flex-col bg-[#F4F6F9] overflow-hidden ${
          mobileTab === 'map' ? 'flex' : 'hidden md:flex'
        }`}>
          {/* Top Map Toolbar (Floor switcher, Pinning mode, & Close) */}
          <div className="p-2 sm:p-4 border-b border-slate-200/80 bg-[#F8F9FB] flex flex-wrap items-center justify-between gap-2 sm:gap-3 z-10 shrink-0">
            {/* Active Floor Name Badge & Pin Mode Switcher */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs font-bold text-slate-700 truncate hidden lg:inline">
                Floor: <strong className="text-slate-900">{activeFloor.shortName}</strong>
              </span>

              {/* Interactive Pinning Mode Switcher */}
              <div className="flex items-center p-0.5 bg-neutral-200/80 rounded-xl text-xs font-bold">
                <button
                  onClick={() => {
                    setPinMode('start');
                  }}
                  className={`apple-press px-2 sm:px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                    pinMode === 'start'
                      ? 'bg-neutral-950 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                  title="Click anywhere on map to drop Start Pin"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${pinMode === 'start' ? 'bg-white' : 'bg-neutral-500'}`}
                  />
                  <span>Start</span>
                </button>
                <button
                  onClick={() => {
                    setPinMode('destination');
                  }}
                  className={`apple-press px-2 sm:px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                    pinMode === 'destination'
                      ? 'bg-neutral-950 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                  title="Click any room on map to set Destination"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${pinMode === 'destination' ? 'bg-white' : 'bg-neutral-500'}`}
                  />
                  <span>Dest</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Floor Switcher Buttons */}
              <div className="flex items-center gap-1 p-1 bg-black/[0.05] rounded-xl sm:rounded-2xl text-xs font-bold">
                {FLOORS.map(fl => {
                  const isActive = selectedFloorId === fl.id;
                  const isRestricted = fl.exhibits.length === 0;
                  return (
                    <button
                      key={fl.id}
                      onClick={() => {
                        if (isRestricted) return;
                        setSelectedFloorId(fl.id);
                      }}
                      disabled={isRestricted}
                      title={isRestricted ? `${fl.name}: No public exhibits` : undefined}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl transition-all ${
                        isRestricted
                          ? 'opacity-30 text-slate-400 cursor-not-allowed select-none'
                          : isActive
                          ? 'bg-neutral-950 text-white font-extrabold shadow-sm cursor-pointer apple-press'
                          : 'text-neutral-600 hover:text-neutral-950 cursor-pointer apple-press'
                      }`}
                    >
                      {fl.shortName}
                    </button>
                  );
                })}
              </div>

              {/* Close Modal Button (Desktop) */}
              <button
                onClick={() => {
                  onClose();
                }}
                className="hidden md:flex apple-press w-9 h-9 items-center justify-center text-neutral-500 hover:text-neutral-900 bg-white/80 hover:bg-white rounded-xl border border-black/[0.08] transition-colors shadow-2xs cursor-pointer shrink-0"
                aria-label="Close directions map"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive SVG Canvas Area */}
          <div
            className="relative flex-1 w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing bg-[#F4F6F9]"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
          >
            {/* Direct Pinning Helper Badge */}
            <div className="absolute top-3 left-3 z-20 pointer-events-none bg-neutral-900/95 text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl shadow-lg border border-neutral-700/50 flex items-center gap-2">
              {pinMode === 'start' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
                  <span>Tap anywhere on the floor or hallway to drop Start Pin</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-white shrink-0" />
                  <span>Tap any room on the map to set Destination</span>
                </>
              )}
            </div>

            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <svg
                ref={svgRef}
                className="w-full h-full max-h-[85vh] drop-shadow-xl select-none"
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                onClick={handleSvgClick}
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Outdoor Ground: Cemented Sports Arena & Entrance Concourse (Ground Floor Only) */}
                {activeFloor.id === 'ground' && (
                  <g id="groundOutdoorPlaza">
                    {/* Walkway connecting Main Entrance Stage to Cemented Sports Area */}
                    <rect
                      x={toSvgX(-6.0)}
                      y={toSvgY(-34.25)}
                      width={12.0 * svgScale}
                      height={(34.25 - 27.25) * svgScale}
                      fill="#E2E8F0"
                      stroke="#CBD5E1"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                    />

                    {/* Cemented Sports Courts Base Slab Shadow */}
                    <rect
                      x={toSvgX(-1.5 - 38.0 / 2) + 4}
                      y={toSvgY(-47.25 - 26.0 / 2) + 5}
                      width={38.0 * svgScale}
                      height={26.0 * svgScale}
                      rx={16}
                      fill="rgba(15, 23, 42, 0.05)"
                    />

                    {/* Cemented Sports Courts Base Slab */}
                    <rect
                      x={toSvgX(-1.5 - 38.0 / 2)}
                      y={toSvgY(-47.25 - 26.0 / 2)}
                      width={38.0 * svgScale}
                      height={26.0 * svgScale}
                      rx={16}
                      fill="#ECEFF2"
                      stroke="#94A3B8"
                      strokeWidth={2}
                    />

                    {/* Basketball Court Linework (West half of sports concourse) */}
                    <g opacity="0.65">
                      <rect
                        x={toSvgX(-18.0)}
                        y={toSvgY(-47.25 - 10.0)}
                        width={15.0 * svgScale}
                        height={20.0 * svgScale}
                        fill="none"
                        stroke="#64748B"
                        strokeWidth={1.5}
                      />
                      <circle
                        cx={toSvgX(-10.5)}
                        cy={toSvgY(-47.25)}
                        r={2.2 * svgScale}
                        fill="none"
                        stroke="#64748B"
                        strokeWidth={1.5}
                      />
                      <rect
                        x={toSvgX(-18.0)}
                        y={toSvgY(-47.25 - 3.0)}
                        width={4.5 * svgScale}
                        height={6.0 * svgScale}
                        fill="none"
                        stroke="#64748B"
                        strokeWidth={1.5}
                      />
                    </g>

                    {/* Volleyball / Badminton Courts Linework (East half of sports concourse) */}
                    <g opacity="0.65">
                      <rect
                        x={toSvgX(1.5)}
                        y={toSvgY(-47.25 - 10.0)}
                        width={14.0 * svgScale}
                        height={20.0 * svgScale}
                        fill="none"
                        stroke="#64748B"
                        strokeWidth={1.5}
                      />
                      <line
                        x1={toSvgX(1.5)}
                        y1={toSvgY(-47.25)}
                        x2={toSvgX(15.5)}
                        y2={toSvgY(-47.25)}
                        stroke="#64748B"
                        strokeWidth={1.5}
                      />
                    </g>

                    {/* Sports Arena Architectural Label */}
                    <text
                      x={toSvgX(-1.5)}
                      y={toSvgY(-47.25 - 11.2)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[11px] font-bold fill-slate-700 pointer-events-none tracking-wider uppercase"
                    >
                      Outdoor Sports Courts &amp; Cemented Concourse (38.0m × 26.0m)
                    </text>
                  </g>
                )}

                {/* Floor Slab Shadow */}
                <rect
                  x={toSvgX(-BUILDING_CONFIG.SLAB_W / 2) + 4}
                  y={toSvgY(-BUILDING_CONFIG.SLAB_D / 2) + 6}
                  width={BUILDING_CONFIG.SLAB_W * svgScale}
                  height={BUILDING_CONFIG.SLAB_D * svgScale}
                  rx={20}
                  fill="rgba(15, 23, 42, 0.05)"
                />

                {/* Architectural Base Slab */}
                <rect
                  x={toSvgX(-BUILDING_CONFIG.SLAB_W / 2)}
                  y={toSvgY(-BUILDING_CONFIG.SLAB_D / 2)}
                  width={BUILDING_CONFIG.SLAB_W * svgScale}
                  height={BUILDING_CONFIG.SLAB_D * svgScale}
                  rx={20}
                  fill="#F8F9FB"
                  stroke="#CBD5E1"
                  strokeWidth={2.5}
                />

                {/* Clean Architectural Corridor Pattern Grid */}
                <defs>
                  <pattern id="archGrid" width="16" height="16" patternUnits="userSpaceOnUse">
                    <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#E2E8F0" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect
                  x={toSvgX(-BUILDING_CONFIG.SLAB_W / 2)}
                  y={toSvgY(-BUILDING_CONFIG.SLAB_D / 2)}
                  width={BUILDING_CONFIG.SLAB_W * svgScale}
                  height={BUILDING_CONFIG.SLAB_D * svgScale}
                  fill="url(#archGrid)"
                  rx={20}
                />

                {/* Front Entrance Stage on Ground Floor (16m x 6m) with generous clearance */}
                {activeFloor.id === 'ground' && (
                  <g>
                    <rect
                      x={toSvgX(BUILDING_CONFIG.STAGE.x - BUILDING_CONFIG.STAGE.w / 2)}
                      y={toSvgY(BUILDING_CONFIG.STAGE.z - BUILDING_CONFIG.STAGE.d / 2)}
                      width={BUILDING_CONFIG.STAGE.w * svgScale}
                      height={BUILDING_CONFIG.STAGE.d * svgScale}
                      rx={10}
                      fill="#E2E8F0"
                      stroke="#64748B"
                      strokeWidth={2}
                    />
                    <text
                      x={toSvgX(BUILDING_CONFIG.STAGE.x)}
                      y={toSvgY(BUILDING_CONFIG.STAGE.z)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[12px] font-medium fill-neutral-900 pointer-events-none"
                    >
                      Main Entrance Stage & Covered Parapet (16.0m x 6.0m)
                    </text>
                  </g>
                )}

                {/* Courtyards on Ground Floor and First Floor */}
                {activeFloor.id !== 'basement' && (
                  <>
                    {/* Big Quadrangle Open Courtyard */}
                    <rect
                      x={toSvgX(BUILDING_CONFIG.BIG_QUAD.x - BUILDING_CONFIG.BIG_QUAD.w / 2)}
                      y={toSvgY(BUILDING_CONFIG.BIG_QUAD.z - BUILDING_CONFIG.BIG_QUAD.d / 2)}
                      width={BUILDING_CONFIG.BIG_QUAD.w * svgScale}
                      height={BUILDING_CONFIG.BIG_QUAD.d * svgScale}
                      rx={10}
                      fill={activeFloor.level >= 2 ? '#EEF1F5' : '#E2E8F0'}
                      stroke="#94A3B8"
                      strokeWidth={2}
                      strokeDasharray={activeFloor.level >= 2 ? '6 4' : undefined}
                    />
                    <text
                      x={toSvgX(BUILDING_CONFIG.BIG_QUAD.x)}
                      y={toSvgY(BUILDING_CONFIG.BIG_QUAD.z)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[12px] font-medium fill-cyan-800 pointer-events-none"
                    >
                      {activeFloor.level >= 2
                        ? 'Big Quad Cutout (Open to Below)'
                        : `Big Quadrangle (${BUILDING_CONFIG.BIG_QUAD.w.toFixed(1)}m x ${BUILDING_CONFIG.BIG_QUAD.d.toFixed(1)}m)`}
                    </text>

                    {/* Small Quadrangle Open Courtyard */}
                    <rect
                      x={toSvgX(BUILDING_CONFIG.SMALL_QUAD.x - BUILDING_CONFIG.SMALL_QUAD.w / 2)}
                      y={toSvgY(BUILDING_CONFIG.SMALL_QUAD.z - BUILDING_CONFIG.SMALL_QUAD.d / 2)}
                      width={BUILDING_CONFIG.SMALL_QUAD.w * svgScale}
                      height={BUILDING_CONFIG.SMALL_QUAD.d * svgScale}
                      rx={10}
                      fill={activeFloor.level >= 2 ? '#EEF1F5' : '#E2E8F0'}
                      stroke="#94A3B8"
                      strokeWidth={2}
                      strokeDasharray={activeFloor.level >= 2 ? '6 4' : undefined}
                    />
                    <text
                      x={toSvgX(BUILDING_CONFIG.SMALL_QUAD.x)}
                      y={toSvgY(BUILDING_CONFIG.SMALL_QUAD.z)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[12px] font-normal fill-neutral-600 pointer-events-none"
                    >
                      {activeFloor.level >= 2 ? 'Small Quad Cutout' : `Small Quad (${BUILDING_CONFIG.SMALL_QUAD.w.toFixed(1)}m x ${BUILDING_CONFIG.SMALL_QUAD.d.toFixed(1)}m)`}
                    </text>
                  </>
                )}

                {/* Staircases */}
                {/* West Stairs (7.5m x 7.5m) */}
                <g
                  transform={`translate(${toSvgX(
                    BUILDING_CONFIG.WEST_STAIRS.x - BUILDING_CONFIG.WEST_STAIRS.w / 2
                  )}, ${toSvgY(
                    BUILDING_CONFIG.WEST_STAIRS.z - BUILDING_CONFIG.WEST_STAIRS.d / 2
                  )})`}
                >
                  <rect
                    width={BUILDING_CONFIG.WEST_STAIRS.w * svgScale}
                    height={BUILDING_CONFIG.WEST_STAIRS.d * svgScale}
                    rx={8}
                    fill="#E2E8F0"
                    stroke="#64748B"
                    strokeWidth={2}
                  />
                  <text
                    x={(BUILDING_CONFIG.WEST_STAIRS.w * svgScale) / 2}
                    y={(BUILDING_CONFIG.WEST_STAIRS.d * svgScale) / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[12px] font-medium fill-neutral-900 pointer-events-none"
                  >
                    West Stairs (7.5m x 7.5m)
                  </text>
                </g>

                {/* East Stairs / Central Stairs */}
                {activeFloor.id === 'basement' ? (
                  <g
                    transform={`translate(${toSvgX(
                      BUILDING_CONFIG.BASEMENT_STAIRS.x - BUILDING_CONFIG.BASEMENT_STAIRS.w / 2
                    )}, ${toSvgY(
                      BUILDING_CONFIG.BASEMENT_STAIRS.z - BUILDING_CONFIG.BASEMENT_STAIRS.d / 2
                    )})`}
                  >
                    <rect
                      width={BUILDING_CONFIG.BASEMENT_STAIRS.w * svgScale}
                      height={BUILDING_CONFIG.BASEMENT_STAIRS.d * svgScale}
                      rx={8}
                      fill="#E2E8F0"
                      stroke="#64748B"
                      strokeWidth={2}
                    />
                    <text
                      x={(BUILDING_CONFIG.BASEMENT_STAIRS.w * svgScale) / 2}
                      y={(BUILDING_CONFIG.BASEMENT_STAIRS.d * svgScale) / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[12px] font-medium fill-neutral-900 pointer-events-none"
                    >
                      Central Stairs (5m x 8m)
                    </text>
                  </g>
                ) : (
                  <g
                    transform={`translate(${toSvgX(
                      BUILDING_CONFIG.EAST_STAIRS.x - BUILDING_CONFIG.EAST_STAIRS.w / 2
                    )}, ${toSvgY(
                      BUILDING_CONFIG.EAST_STAIRS.z - BUILDING_CONFIG.EAST_STAIRS.d / 2
                    )})`}
                  >
                    <rect
                      width={BUILDING_CONFIG.EAST_STAIRS.w * svgScale}
                      height={BUILDING_CONFIG.EAST_STAIRS.d * svgScale}
                      rx={8}
                      fill="#E2E8F0"
                      stroke="#64748B"
                      strokeWidth={2}
                    />
                    <text
                      x={(BUILDING_CONFIG.EAST_STAIRS.w * svgScale) / 2}
                      y={(BUILDING_CONFIG.EAST_STAIRS.d * svgScale) / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[12px] font-medium fill-neutral-900 pointer-events-none"
                    >
                      East Stairs (4m x 6m)
                    </text>
                  </g>
                )}

                {/* Interactive Rooms for the selected floor */}
                {activeFloor.exhibits
                  .filter(e => !e.id.includes('_str') && !e.id.includes('stairs'))
                  .map(ex => {
                    const isDestination =
                      destination.exhibit.id === ex.id && destination.floor.id === activeFloor.id;
                    const isStart =
                      userPin.floorId === activeFloor.id &&
                      Math.hypot(ex.px - userPin.x, ex.pz - userPin.z) < 2.0;

                    const rx = toSvgX(ex.px - ex.w / 2);
                    const ry = toSvgY(ex.pz - ex.d / 2);
                    const rw = ex.w * svgScale;
                    const rh = ex.d * svgScale;
                    const sub = SUBJECTS[ex.subject] || SUBJECTS.general;

                    const isCemented = ex.id === 'g_cemented';

                    return (
                      <g
                        key={ex.id}
                        className="cursor-pointer group"
                        onClick={e => {
                          e.stopPropagation();
                          if (pinMode === 'start') {
                            handleSelectStartExhibit(ex, activeFloor);
                          } else {
                            handleSelectDestination(ex, activeFloor);
                          }
                        }}
                      >
                        <rect
                          x={rx}
                          y={ry}
                          width={rw}
                          height={rh}
                          rx={isCemented ? 14 : 8}
                          fill={
                            isCemented
                              ? isDestination
                                ? 'rgba(224, 242, 254, 0.65)'
                                : isStart
                                ? 'rgba(240, 253, 244, 0.65)'
                                : 'rgba(236, 239, 242, 0.35)'
                              : isDestination
                              ? '#E0F2FE'
                              : isStart
                              ? '#F0FDF4'
                              : '#F8F9FB'
                          }
                          stroke={
                            isDestination
                              ? '#0284C7'
                              : isStart
                              ? '#16A34A'
                              : isCemented
                              ? '#94A3B8'
                              : '#CBD5E1'
                          }
                          strokeWidth={isDestination || isStart ? 3 : isCemented ? 2 : 1.5}
                          strokeDasharray={isCemented && !isDestination && !isStart ? '6 4' : undefined}
                          className="transition-colors group-hover:fill-neutral-200/50"
                        />

                        {/* Subject Color Top Accent */}
                        <rect x={rx} y={ry} width={rw} height={4.5} rx={2} fill={sub.css} />

                        {/* Room Label */}
                        <text
                          x={rx + rw / 2}
                          y={ry + rh / 2 - (rh > 44 ? 6 : 0)}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className={`text-[12px] sm:text-[13px] pointer-events-none ${
                            isDestination
                              ? 'font-bold fill-sky-950'
                              : isStart
                              ? 'font-bold fill-emerald-950'
                              : 'font-semibold fill-neutral-800'
                          }`}
                        >
                          {ex.room.length > 20 ? ex.room.slice(0, 18) + '...' : ex.room}
                        </text>
                        {rh > 44 && (
                          <text
                            x={rx + rw / 2}
                            y={ry + rh / 2 + 10}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-[10px] font-normal fill-slate-500 pointer-events-none"
                          >
                            {ex.title.length > 22 ? ex.title.slice(0, 20) + '...' : ex.title}
                          </text>
                        )}

                        {/* Destination Star Badge */}
                        {isDestination && (
                          <g transform={`translate(${rx + rw / 2}, ${ry - 12})`}>
                            <circle r={11} fill="#0284C7" className="shadow-lg" />
                            <text
                              y={3.5}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="text-[10px] font-black fill-white"
                            >
                              ★
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}

                {/* Destination Pin (if on currently viewed floor) */}
                {destination.floor.id === activeFloor.id && (
                  <g
                    transform={`translate(${toSvgX(destination.exhibit.px)}, ${toSvgY(destination.exhibit.pz)})`}
                    className="cursor-grab active:cursor-grabbing select-none"
                    onPointerDown={e => {
                      e.stopPropagation();
                      setDraggingTarget('destination');
                      setPinMode('destination');
                    }}
                  >
                    <circle r={26} fill="#E11D48" opacity={draggingTarget === 'destination' ? 0.35 : 0.15} />
                    <circle r={14} fill="#E11D48" opacity={0.3} />
                    <circle r={7.5} fill="#E11D48" stroke="#FFFFFF" strokeWidth={2.5} />
                    <path
                      d="M 0 0 C -7 -14 -7 -22 0 -28 C 7 -22 7 -14 0 0 Z"
                      fill="#E11D48"
                      stroke="#FFFFFF"
                      strokeWidth={1.5}
                    />
                    <circle cx={0} cy={-18} r={3} fill="#FFFFFF" />
                    <rect
                      x={-52}
                      y={-46}
                      width={104}
                      height={18}
                      rx={6}
                      fill="#09090B"
                      opacity={0.92}
                    />
                    <text
                      x={0}
                      y={-34}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[9px] font-extrabold fill-white tracking-wider pointer-events-none"
                    >
                      🎯 TARGET (DRAG)
                    </text>
                  </g>
                )}

                {/* User Start Pin (if on currently viewed floor) */}
                {userPin.floorId === activeFloor.id && (
                  <g
                    transform={`translate(${toSvgX(userPin.x)}, ${toSvgY(userPin.z)})`}
                    className="cursor-grab active:cursor-grabbing select-none"
                    onPointerDown={e => {
                      e.stopPropagation();
                      setDraggingTarget('start');
                      setPinMode('start');
                    }}
                  >
                    <circle r={28} fill="#0284C7" opacity={draggingTarget === 'start' ? 0.40 : 0.20} className="animate-ping" />
                    <circle r={15} fill="#0284C7" opacity={0.35} />
                    <circle r={7.5} fill="#0284C7" stroke="#FFFFFF" strokeWidth={2.5} />
                    <path
                      d="M 0 0 C -7 -14 -7 -22 0 -28 C 7 -22 7 -14 0 0 Z"
                      fill="#0284C7"
                      stroke="#FFFFFF"
                      strokeWidth={1.5}
                    />
                    <circle cx={0} cy={-18} r={3} fill="#FFFFFF" />
                    <rect
                      x={-48}
                      y={-46}
                      width={96}
                      height={18}
                      rx={6}
                      fill="#09090B"
                      opacity={0.92}
                    />
                    <text
                      x={0}
                      y={-34}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[9px] font-extrabold fill-white tracking-wider pointer-events-none"
                    >
                      📍 START (DRAG)
                    </text>
                  </g>
                )}

                {/* 2D Projected Route Path on Current Floor */}
                {navMode === 'point_to_point' &&
                  computedRoute &&
                  computedRoute.points.length > 1 &&
                  !isSameRoom && (
                    <path
                      d={computedRoute.points
                        .filter(p => p.floorId === activeFloor.id)
                        .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${toSvgX(p.x)} ${toSvgY(p.z)}`)
                        .join(' ')}
                      fill="none"
                      stroke="#09090B"
                      strokeWidth={4.5}
                      strokeDasharray="8 6"
                      strokeLinecap="round"
                      opacity={0.92}
                    />
                  )}
              </svg>
            </div>

            {/* Mobile Bottom Action Bar over 2D Map */}
            <div className="md:hidden absolute bottom-3 left-3 right-16 z-20 flex items-center gap-2">
              <button
                onClick={() => {
                  setMobileTab('route');
                }}
                className="apple-press flex-1 min-h-[42px] px-3 py-2 rounded-xl bg-white/95 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg border border-slate-200/90 cursor-pointer"
              >
                <span>← Route Steps</span>
              </button>
              <button
                onClick={navMode === 'point_to_point' ? handleStartPointToPoint : handleStartTour}
                disabled={navMode === 'point_to_point' && isSameRoom}
                className={`apple-press flex-1 min-h-[42px] px-3 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer ${
                  navMode === 'point_to_point' && isSameRoom
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-neutral-950 text-white'
                }`}
              >
                <span>Start 3D</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Floating Map Zoom & Reset Tools (Bottom Right) */}
            <div className="absolute bottom-5 right-5 z-20 flex flex-col items-center gap-1 bg-white/95 rounded-2xl border border-slate-200/80 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.12)] p-1">
              <button
                onClick={() => setZoomLevel(prev => Math.min(2.8, Number((prev + 0.2).toFixed(2))))}
                className="apple-press w-8 h-8 flex items-center justify-center text-slate-700 hover:text-slate-900 rounded-xl hover:bg-black/[0.05] transition-colors cursor-pointer"
                title="Zoom In"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-4 h-[1px] bg-black/[0.06] my-0.5" />
              <button
                onClick={() => setZoomLevel(prev => Math.max(0.65, Number((prev - 0.2).toFixed(2))))}
                className="apple-press w-8 h-8 flex items-center justify-center text-slate-700 hover:text-slate-900 rounded-xl hover:bg-black/[0.05] transition-colors cursor-pointer"
                title="Zoom Out"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <div className="w-4 h-[1px] bg-black/[0.06] my-0.5" />
              <button
                onClick={handleResetMap}
                className="apple-press w-8 h-8 flex items-center justify-center text-neutral-700 hover:text-black rounded-xl hover:bg-black/[0.05] transition-colors cursor-pointer"
                title="Reset View"
                aria-label="Reset map"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
