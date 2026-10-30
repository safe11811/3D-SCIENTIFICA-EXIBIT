export interface ExhibitSchedule {
  status: 'Live Now' | 'Scheduled Shows' | 'All-Day Exhibition';
  sessions?: string[];
  peakTime?: string;
}

export interface Exhibit {
  id: string;
  room: string;
  title: string;
  subject: string;
  mockup: string;
  time: string;
  presenters?: string;
  desc: string;
  px: number;
  pz: number;
  w: number;
  h: number;
  d: number;
  featured?: boolean;
  wing: string;
  locationGuide: string;
  scheduleDetails?: ExhibitSchedule;
  nearbyLandmark?: string;
  rotation?: number;
  department?: string;      // Official department from Scientifica 2026 sheet
  studentCount?: number;    // Student headcount for department
  greenRoom?: string;       // Assigned green room
  classGrade?: string;      // Classes participating, e.g. "Cl 9-12"
}

export interface Floor {
  id: string;
  name: string;
  shortName: string;
  level: number;
  theme: string;
  baseY: number;
  color: number;
  css: string;
  exhibits: Exhibit[];
}

export type MockupType = string;

export const SUBJECTS: Record<string, { label: string; topic: string; color: number; css: string }> = {
  all:          { label: 'All',             topic: 'Scientifica 2026',           color: 0x06b6d4, css: '#06B6D4' },
  english:      { label: 'English',         topic: 'Department of English',      color: 0xf43f5e, css: '#F43F5E' },
  hindi:        { label: 'Hindi',           topic: 'Department of Hindi',        color: 0xf97316, css: '#F97316' },
  sanskrit:     { label: 'Sanskrit',        topic: 'Department of Sanskrit',     color: 0xf59e0b, css: '#F59E0B' },
  kannada:      { label: 'Kannada',         topic: 'Department of Kannada',      color: 0xeab308, css: '#EAB308' },
  math:         { label: 'Math',            topic: 'Department of Mathematics',  color: 0x6366f1, css: '#6366F1' },
  science:      { label: 'Science',         topic: 'Department of Science',      color: 0x10b981, css: '#10B981' },
  physics:      { label: 'Physics',         topic: 'Science: Physics',           color: 0xf59e0b, css: '#F59E0B' },
  chemistry:    { label: 'Chemistry',       topic: 'Science: Chemistry',         color: 0x10b981, css: '#10B981' },
  biology:      { label: 'Biology',         topic: 'Science: Biology',           color: 0x8b5cf6, css: '#8B5CF6' },
  social:       { label: 'Social Science',  topic: 'Social Science Dept.',       color: 0xa855f7, css: '#A855F7' },
  commerce:     { label: 'Commerce',        topic: 'Department of Commerce',     color: 0x3b82f6, css: '#3B82F6' },
  cs:           { label: 'Computer Science',topic: 'Computer Science Dept.',     color: 0x0ea5e9, css: '#0EA5E9' },
  languages:    { label: 'Languages',       topic: 'Languages Dept.',            color: 0xf43f5e, css: '#F43F5E' },
  general:      { label: 'General',         topic: 'School Info & Facilities',   color: 0x64748b, css: '#64748B' }
};

/**
 * EXACT ARCHITECTURAL GEOMETRY FROM DXF BLUEPRINTS (NPS Yeshwanthpur)
 * Real dimensions: 46.00m Width x 42.50m Depth (plus 16.0m x 6.0m Covered Entrance Stage)
 * Coordinate origin (0, 0) corresponds to DXF Center: (X=23.00m, Y=21.25m)
 * Transformation: x = X - 23.00, z = -(Y - 21.25)
 */
export const BUILDING_CONFIG = {
  WIDTH: 46.0,
  DEPTH: 42.5,
  HEIGHT: 26.5,
  SLAB_W: 46.0,
  SLAB_D: 42.5,
  SLAB_H: 0.35,
  FLOOR_GAP: 6.5,

  STAGE: { x: 0.0, z: -24.25, w: 16.0, d: 6.0 },

  SMALL_QUAD: { x: -6.5, z: -0.25, w: 6.4, d: 20.0 },
  BIG_QUAD:   { x: 4.55, z: -0.25, w: 8.9, d: 26.0 },

  CENTRAL_CORRIDOR: { x: -1.6, z: -0.25, w: 2.8, d: 20.0 },

  WEST_STAIRS: { x: -19.25, z: -11.0, w: 7.5, d: 7.5 },
  EAST_STAIRS: { x: 11.0,   z: -7.25, w: 4.0, d: 6.0 },
  BASEMENT_STAIRS: { x: 9.5, z: -2.75, w: 5.0, d: 8.0 }
};

/**
 * Architectural room partition outlines from DXF floor plans.
 * Rendered as passive architectural wireframe partition borders on floor plates.
 * Contains no interior models and is strictly non-clickable (no raycasting/hitboxes).
 */
export interface ArchitecturalRoomOutline {
  floorId: 'basement' | 'ground' | 'first' | 'second';
  x: number;
  z: number;
  w: number;
  d: number;
}

export const ARCHITECTURAL_ROOM_OUTLINES: ArchitecturalRoomOutline[] = [
  // ── First Floor (1F) ────────────────────────────────────────────────────────
  // Passive classroom partition skeleton (excluding active 3D, 3E, 3F and staircases)
  { floorId: 'first', x: 0.0, z: -18.0, w: 16.0, d: 6.5 },
  { floorId: 'first', x: 11.75, z: -18.0, w: 7.5, d: 6.5 },
  { floorId: 'first', x: 19.25, z: -18.0, w: 7.5, d: 6.5 },
  { floorId: 'first', x: -19.25, z: 7.0, w: 7.5, d: 9.5 },
  { floorId: 'first', x: 19.25, z: -12.25, w: 7.5, d: 5.0 },
  { floorId: 'first', x: 19.25, z: -4.25, w: 7.5, d: 11.0 },
  { floorId: 'first', x: 19.25, z: 4.0, w: 7.5, d: 5.5 },
  { floorId: 'first', x: 19.25, z: 9.25, w: 7.5, d: 5.0 },
  { floorId: 'first', x: 19.25, z: 16.5, w: 7.5, d: 9.5 },
  { floorId: 'first', x: 10.25, z: -2.5, w: 2.5, d: 3.5 }, // Lift shaft
  { floorId: 'first', x: 12.25, z: -2.5, w: 1.5, d: 3.5 }, // Electrical room
  { floorId: 'first', x: -19.25, z: 17.75, w: 7.5, d: 7.0 },
  { floorId: 'first', x: -11.75, z: 17.75, w: 7.5, d: 7.0 },
  { floorId: 'first', x: -4.1, z: 17.75, w: 7.8, d: 7.0 },
  { floorId: 'first', x: 3.65, z: 17.75, w: 7.7, d: 7.0 },
  { floorId: 'first', x: 11.5, z: 17.75, w: 8.0, d: 7.0 },

  // ── Second Floor (2F) ───────────────────────────────────────────────────────
  // Non-exhibit classrooms, labs and corridors
  { floorId: 'second', x: -4.0, z: -18.0, w: 8.0, d: 6.5 },
  { floorId: 'second', x: 2.5, z: -18.0, w: 5.0, d: 6.5 },
  { floorId: 'second', x: -19.25, z: 7.0, w: 7.5, d: 9.5 },
  { floorId: 'second', x: 19.25, z: -4.25, w: 7.5, d: 11.0 },
  { floorId: 'second', x: 19.25, z: 4.0, w: 7.5, d: 5.5 },
  { floorId: 'second', x: 19.25, z: 9.25, w: 7.5, d: 5.0 },
  { floorId: 'second', x: 19.25, z: 16.5, w: 7.5, d: 9.5 },
  { floorId: 'second', x: 10.25, z: -2.5, w: 2.5, d: 3.5 }, // Lift shaft
  { floorId: 'second', x: 12.25, z: -2.5, w: 1.5, d: 3.5 }, // Electrical room
  { floorId: 'second', x: -19.25, z: 17.75, w: 7.5, d: 7.0 },
  { floorId: 'second', x: -11.75, z: 17.75, w: 7.5, d: 7.0 },
  { floorId: 'second', x: -6.05, z: 17.75, w: 3.9, d: 7.0 },
  { floorId: 'second', x: -2.15, z: 17.75, w: 3.9, d: 7.0 },
  { floorId: 'second', x: 3.65, z: 17.75, w: 7.7, d: 7.0 },
  { floorId: 'second', x: 11.5, z: 17.75, w: 8.0, d: 7.0 },

  // ── Ground Floor (GF) ───────────────────────────────────────────────────────
  // Non-exhibit classrooms along perimeter wings
  { floorId: 'ground', x: -19.25, z: -18.0, w: 7.5, d: 6.5 },
  { floorId: 'ground', x: -11.75, z: -18.0, w: 7.5, d: 6.5 },
  { floorId: 'ground', x: 11.75, z: -18.0, w: 7.5, d: 6.5 },
  { floorId: 'ground', x: 19.25, z: -18.0, w: 7.5, d: 6.5 },
  { floorId: 'ground', x: 19.25, z: -11.0, w: 7.5, d: 7.5 },
  { floorId: 'ground', x: -19.25, z: -2.5, w: 7.5, d: 9.5 },
  { floorId: 'ground', x: -19.25, z: 10.0, w: 7.5, d: 6.5 },
  { floorId: 'ground', x: 19.25, z: -2.5, w: 7.5, d: 9.5 },
  { floorId: 'ground', x: 19.25, z: 7.0, w: 7.5, d: 9.5 },
  { floorId: 'ground', x: -19.25, z: 17.75, w: 7.5, d: 7.0 },
  { floorId: 'ground', x: -11.75, z: 17.75, w: 7.5, d: 7.0 },
  { floorId: 'ground', x: -4.1, z: 17.75, w: 7.8, d: 7.0 },
  { floorId: 'ground', x: 3.65, z: 17.75, w: 7.7, d: 7.0 },
  { floorId: 'ground', x: 11.5, z: 17.75, w: 8.0, d: 7.0 },
  { floorId: 'ground', x: 19.25, z: 17.75, w: 7.5, d: 7.0 },

  // ── Basement Level (B) ──────────────────────────────────────────────────────
  // Non-exhibit spaces along perimeter
  { floorId: 'basement', x: -1.75, z: -16.75, w: 8.5, d: 9.0 },
  { floorId: 'basement', x: 17.0, z: -16.75, w: 12.0, d: 9.0 }, // Skill Room (disabled / greyed out)
  { floorId: 'basement', x: -19.75, z: 17.75, w: 6.5, d: 7.0 },
  { floorId: 'basement', x: -13.25, z: 17.75, w: 6.5, d: 7.0 },
  { floorId: 'basement', x: -6.5, z: 17.75, w: 7.0, d: 7.0 },
];

export const FLOORS: Floor[] = [
  // ==========================================
  // LEVEL 0: BASEMENT (English, CS Skit, CS Projects & Commerce)
  // ==========================================
  {
    id: 'basement',
    name: 'Basement Level',
    shortName: 'B',
    level: 0,
    baseY: 0.0,
    theme: 'English Festival, CS Skit, Senior Computer Lab & Commerce Studios',
    color: 0x18181b,
    css: '#18181B',
    exhibits: [
      {
        id: 'b_big_av',
        room: 'Big AV Room',
        title: 'The Bard Revisited, Character Crossroads & Stalls for 4 Genres',
        department: 'English',
        classGrade: 'Cl 5-12',
        subject: 'english',
        mockup: 'av_screen',
        time: '9:20 AM – 1:30 PM',
        presenters: 'English Department (Classes 5–12)',
        desc: 'English Department presentations: The Bard Revisited (Cl 9-12), Character Crossroads (Cl 6-8), and Stalls for 4 Genres with characters (Cl 5-8).',
        px: 18.50, pz: 1.00,
        w: 9.0, h: 3.2, d: 26.5,
        featured: true,
        wing: 'East Wing (Basement)',
        locationGuide: 'Basement · East Wing. Spans the eastern auditorium hall. Take Central Staircase down and turn east.',
        scheduleDetails: {
          status: 'Scheduled Shows',
          sessions: [
            '1ST SHOW (9:20 AM – 10:08 AM)',
            '• 9:20 AM – 9:25 AM: English · Character Crossroads',
            '• 9:50 AM – 10:08 AM: English · The Bard Revisited',
            '2ND SHOW (11:15 AM – 12:03 PM)',
            '• 11:15 AM – 11:30 AM: English · Character Crossroads',
            '• 11:45 AM – 12:03 PM: English · The Bard Revisited',
            '3RD SHOW (1:15 PM – 1:30 PM)',
            '• 1:15 PM – 1:30 PM: English · Character Crossroads',
            'Stalls for 4 Genres with characters (Cl 5-8): Continuous All-Day'
          ],
          peakTime: '9:50 AM & 11:45 AM'
        },
        nearbyLandmark: 'Spans full east wall of Basement'
      },
      {
        id: 'b_av',
        room: 'Small AV Room',
        title: 'Skit on AI vs Human & Kavyantara (Rashmi Rathi)',
        department: 'Computer Science & Hindi',
        classGrade: 'Cl 6-11',
        subject: 'cs',
        mockup: 'av_screen',
        time: '9:40 AM – 2:08 PM',
        presenters: 'CS & Hindi Student Troupes',
        desc: 'Dual-department stage: Skit on AI vs Human (Class 10&11) and Kavyantara (Rashmi Rathi) (Cl 6-10).',
        px: 6.75, pz: -16.75,
        w: 8.5, h: 2.8, d: 9.0,
        wing: 'North Wing (Basement)',
        locationGuide: 'Basement · North Wing. North corridor between Dance Room and East Wing.',
        scheduleDetails: {
          status: 'Scheduled Shows',
          sessions: [
            '1ST SHOW (9:40 AM – 10:18 AM)',
            '• 9:40 AM – 9:48 AM: Hindi · Kavyantara (Rashmi Rathi)',
            '• 10:10 AM – 10:18 AM: Computer Science · Skit on AI vs Human',
            '2ND SHOW (11:35 AM – 12:18 PM)',
            '• 11:35 AM – 11:43 AM: Hindi · Kavyantara (Rashmi Rathi)',
            '• 12:10 PM – 12:18 PM: Computer Science · Skit on AI vs Human',
            '3RD SHOW (1:30 PM – 2:08 PM)',
            '• 1:30 PM – 1:38 PM: Computer Science · Skit on AI vs Human',
            '• 1:45 PM – 1:53 PM: Computer Science · Skit on AI vs Human',
            '• 2:00 PM – 2:08 PM: Computer Science · Skit on AI vs Human'
          ],
          peakTime: '10:10 AM & 1:30 PM'
        },
        nearbyLandmark: 'North corridor'
      },
      {
        id: 'b_sr_cs1',
        room: 'Senior Computer Lab 1',
        title: 'Projects (Cl 6-12)',
        department: 'Computer Science',
        classGrade: 'Cl 6-12',
        subject: 'cs',
        mockup: 'computer_lab',
        time: '9:35 AM – 3:00 PM',
        presenters: 'Computer Science Department (Classes 6–12)',
        desc: 'Computer Science Department student project exhibitions across software, artificial intelligence, and applied computing.',
        px: 9.75, pz: 17.75,
        w: 8.5, h: 2.8, d: 7.0,
        featured: true,
        wing: 'South Wing (Basement)',
        locationGuide: 'Basement · South Wing. Beside Senior Computer Lab 2 along the rear technology corridor.',
        scheduleDetails: {
          status: 'Live Now',
          sessions: [
            'Morning Session: 9:35 AM – 12:30 PM',
            'Afternoon Session: 1:30 PM – 3:00 PM'
          ],
          peakTime: '11:00 AM & 2:30 PM'
        },
        nearbyLandmark: 'Beside Senior Computer Lab 2'
      },
      {
        id: 'b_sr_cs2',
        room: 'Senior Computer Lab 2',
        title: 'Projects (Cl 6-12)',
        department: 'Computer Science',
        classGrade: 'Cl 6-12',
        subject: 'cs',
        mockup: 'computer_lab',
        time: '9:35 AM – 3:00 PM',
        presenters: 'Computer Science Department (Classes 6–12)',
        desc: 'Computer Science Department student project exhibitions across software, artificial intelligence, and applied computing.',
        px: 1.25, pz: 17.75,
        w: 8.5, h: 2.8, d: 7.0,
        featured: true,
        wing: 'South Wing (Basement)',
        locationGuide: 'Basement · South Wing. Between Server Room and Senior Computer Lab 1.',
        scheduleDetails: {
          status: 'Live Now',
          sessions: [
            'Morning Session: 9:35 AM – 12:30 PM',
            'Afternoon Session: 1:30 PM – 3:00 PM'
          ],
          peakTime: '11:30 AM'
        },
        nearbyLandmark: 'Beside Senior Computer Lab 1'
      },
      {
        id: 'b_dance_w',
        room: 'Theatre Room',
        title: 'Micro-presentation & Monopoly Game (Cl 11&12)',
        department: 'Commerce',
        classGrade: 'Cl 11&12',
        subject: 'commerce',
        mockup: 'dance_studio',
        time: '9:35 AM – 3:00 PM',
        presenters: 'Commerce Department (Classes 11 & 12)',
        desc: 'Commerce Department venture micro-presentations and live interactive Monopoly economic game.',
        px: -19.25, pz: 3.25,
        w: 7.5, h: 2.8, d: 12.0,
        wing: 'West Wing (Basement)',
        locationGuide: 'Basement · West Wing. Beside West Staircase landing.',
        scheduleDetails: {
          status: 'Live Now',
          sessions: [
            'Micro-presentation: 10:15 AM – 11:45 AM',
            'Monopoly Game: 1:00 PM – 2:45 PM'
          ],
          peakTime: '11:00 AM & 1:30 PM'
        },
        nearbyLandmark: 'Beside West Staircase'
      },
      {
        id: 'b_dance_e',
        room: 'Dance Room',
        title: 'Models & Interactive Game (Cl 11&12)',
        department: 'Commerce',
        classGrade: 'Cl 11&12',
        subject: 'commerce',
        mockup: 'dance_studio',
        time: '9:35 AM – 3:00 PM',
        presenters: 'Commerce Department (Classes 11 & 12)',
        desc: 'Commerce Department business models and interactive economic decision game.',
        px: -10.75, pz: -16.75,
        w: 9.5, h: 2.8, d: 9.0,
        wing: 'North Wing (Basement)',
        locationGuide: 'Basement · North Wing. North corridor room beside West Staircase.',
        scheduleDetails: {
          status: 'All-Day Exhibition',
          sessions: [
            'Models Exhibition: Continuous All-Day',
            'Interactive Game Sessions: 11:30 AM & 1:45 PM'
          ],
          peakTime: '11:30 AM'
        },
        nearbyLandmark: 'North corridor'
      },
      {
        id: 'b_stairs_w',
        room: 'West Staircase',
        title: 'West Staircase Core',
        subject: 'general',
        mockup: 'stairs_circulation',
        time: '9:35 AM – 3:00 PM',
        presenters: 'Facilities Core',
        desc: 'Western circulation staircase connecting Basement, Ground, First, and Second floors.',
        px: -19.25, pz: -11.0,
        w: 7.5, h: 2.8, d: 7.5,
        rotation: Math.PI / 2,
        wing: 'West Core',
        locationGuide: 'Basement · Northwest corner connecting directly to Ground Floor West Entrance.',
        scheduleDetails: {
          status: 'All-Day Exhibition',
          sessions: ['Vertical Transit Access: All Day'],
          peakTime: 'Between sessions'
        },
        nearbyLandmark: 'Beside Theatre Room'
      },
      {
        id: 'b_stairs_c',
        room: 'Central Staircase',
        title: 'Central Staircase Core',
        subject: 'general',
        mockup: 'stairs_circulation',
        time: '9:35 AM – 3:00 PM',
        presenters: 'Facilities Core',
        desc: 'Main wide central staircase connecting Basement concourse up to Ground Floor reception lobby.',
        px: 9.5, pz: -2.75,
        w: 5.0, h: 2.8, d: 8.0,
        wing: 'East Central',
        locationGuide: 'Basement · East Central Core. Adjacent to Big AV Room entrance.',
        scheduleDetails: {
          status: 'All-Day Exhibition',
          sessions: ['Vertical Transit Access: All Day'],
          peakTime: 'Between sessions'
        },
        nearbyLandmark: 'West of Big AV Room'
      }
    ]
  },

  // ==========================================
  // LEVEL 1: GROUND FLOOR (Quad Shows, Parapet Games, Street Plays, Skill Lab & Classrooms)
  // ==========================================
  {
    id: 'ground',
    name: 'Ground Floor',
    shortName: 'GF',
    level: 1,
    baseY: 6.5,
    theme: 'Flagship Quadrangle Shows, Math Parapet Games, Street Plays, Skill Lab & Aero Labs',
    color: 0x27272a,
    css: '#27272A',
    exhibits: [
      {
        id: 'g_stage',
        room: 'Parapet (Main Entrance Stage)',
        title: 'Games (Cl 6-10)',
        department: 'Math',
        classGrade: 'Cl 6-10',
        subject: 'math',
        mockup: 'laser_optics',
        time: '9:35 AM – 3:00 PM',
        presenters: 'Math Department (Classes 6–10)',
        desc: 'Math Department interactive outdoor games, logic puzzles, and speed challenges under the covered entrance parapet.',
        px: 0.0, pz: -24.25,
        w: 16.0, h: 2.8, d: 6.0,
        featured: true,
        wing: 'North Front Entrance',
        locationGuide: 'Ground Floor · Front Entrance Canopy and Stage. Visible directly upon arriving at school.',
        scheduleDetails: {
          status: 'Live Now',
          sessions: [
            'Logic Games & Speed Puzzles: 10:00 AM – 12:30 PM',
            'Interactive Math Challenges: 1:30 PM – 3:30 PM'
          ],
          peakTime: '11:15 AM & 2:00 PM'
        },
        nearbyLandmark: 'Main Campus Entrance Porch'
      },
      {
        id: 'g_cemented',
        room: 'Cemented Area',
        title: 'Street Plays: Social awareness (Cl 6-8)',
        department: 'Social Science',
        classGrade: 'Cl 6-8',
        subject: 'social',
        mockup: 'stage_show',
        time: '10:30 AM – 2:00 PM',
        presenters: 'Social Science & Kannada Student Troupes (Classes 6–8)',
        desc: 'Social Science outdoor street theatre on social awareness and Kannada Hasyanataka comedy acts on the front cemented sports concourse.',
        px: -1.5, pz: -47.25,
        w: 38.0, h: 2.8, d: 26.0,
        featured: true,
        wing: 'Front Sports Concourse',
        locationGuide: 'Ground Floor · Front open-air cemented courts and sports arena directly in front of the main school entrance.',
        scheduleDetails: {
          status: 'Scheduled Shows',
          sessions: [
            '1ST SHOW (10:30 AM – 11:20 AM)',
            '• 10:30 AM – 10:40 AM: Social Science · Street Plays: Social Awareness',
            '• 10:45 AM – 10:55 AM: Social Science · Street Plays: Social Awareness',
            '• 11:10 AM – 11:20 AM: Social Science · Street Plays: Social Awareness',
            '2ND SHOW (11:30 AM – 12:55 PM)',
            '• 11:30 AM – 11:40 AM: Kannada · Hasyanataka',
            '• 11:50 AM – 12:00 PM: Social Science · Street Plays: Social Awareness',
            '• 12:10 PM – 12:20 PM: Social Science · Street Plays: Social Awareness',
            '• 12:30 PM – 12:40 PM: Kannada · Hasyanataka',
            '• 12:45 PM – 12:55 PM: Social Science · Street Plays: Social Awareness',
            '3RD SHOW (1:10 PM – 2:00 PM)',
            '• 1:10 PM – 1:20 PM: Social Science · Street Plays: Social Awareness',
            '• 1:30 PM – 1:40 PM: Kannada · Hasyanataka',
            '• 1:50 PM – 2:00 PM: Social Science · Hasyanataka'
          ],
          peakTime: '11:30 AM & 1:10 PM'
        },
        nearbyLandmark: 'In front of Main Entrance Stage'
      },
      {
        id: 'g_food_truck',
        room: 'Food Truck',
        title: 'Food & Refreshments Court',
        department: 'Food & Beverages',
        subject: 'general',
        mockup: 'food_truck',
        time: '9:35 AM – 3:00 PM',
        presenters: 'School Cafeteria Partner',
        desc: 'Food truck serving snacks, beverages and refreshments to visitors throughout the exhibition, parked on the open ground beyond the far edge of the sports court.',
        px: 28, pz: -39.2,
        w: 5.5, h: 2.8, d: 2.8,
        rotation: -Math.PI/2,
        wing: 'Front Court (North-East)',
        locationGuide: 'Ground Floor · Open ground just beyond the far (north) edge of the cemented sports arena, east side.',
        scheduleDetails: {
          status: 'All-Day Exhibition',
          sessions: ['Serving: Continuous All-Day'],
          peakTime: '11:30 AM & 1:00 PM'
        },
        nearbyLandmark: 'Beyond the far edge of the Cemented Area'
      },
      {
        id: 'g_apd_stall',
        room: 'APD Planters Stall',
        title: 'Planters Sale by APD (Association of People with Disability)',
        department: 'NGO Stall',
        subject: 'general',
        mockup: 'planter_stall',
        time: '9:35 AM – 3:00 PM',
        presenters: 'APD — Association of People with Disability',
        desc: 'Stall set up by the Association of People with Disability (APD), an NGO, selling potted planters and saplings. All proceeds support the NGO.',
        px: 28, pz: -45.8,
        w: 5.0, h: 2.4, d: 2.4,
        rotation: -Math.PI/2,
        wing: 'Front Court (North-East)',
        locationGuide: 'Ground Floor · Open ground just beyond the far (north) edge of the cemented sports arena, west of the Food Truck.',
        scheduleDetails: {
          status: 'All-Day Exhibition',
          sessions: ['Stall Open: Continuous All-Day'],
          peakTime: '10:30 AM & 12:30 PM'
        },
        nearbyLandmark: 'West of the Food Truck'
      },
      {
        id: 'g_quad_b',
        room: 'Big Quadrangle',
        title: 'Flagship Quadrangle Shows',
        department: 'Multi-Department Flagship Arena',
        classGrade: 'Cl 6-12',
        subject: 'all',
        mockup: 'amphitheatre_stage',
        time: '9:40 AM – 2:30 PM',
        presenters: 'Multi-Department Student Ensembles',
        desc: 'Flagship amphitheatre stage: 1st Show (9:45 AM – 10:45 AM), 2nd Show (11:00 AM – 12:55 PM), and 3rd Show (1:00 PM – 2:30 PM), featuring Hindi Dashaavatar, Kannada Nritya Nataka, Sanskrit Navadurga & Shivatandava, Math Symphony of Symmetry, Science Luminiscence (Physics, Chemistry, Biology), English The Bard Revisited, Hindi Kavyantara, and Social Science Fashion Walk.',
        px: 4.55, pz: -0.25,
        w: 8.9, h: 2.8, d: 26.0,
        featured: true,
        wing: 'Central Courtyard (East)',
        locationGuide: 'Ground Floor · Eastern open courtyard surrounded by classrooms and central corridor.',
        scheduleDetails: {
          status: 'Scheduled Shows',
          sessions: [
            '1ST SHOW (9:45 AM – 10:45 AM)',
            '• 9:40 AM – 9:56 AM: Hindi · Dashaavatar',
            '• 10:00 AM – 10:13 AM: Kannada · Nritya Nataka',
            '• 10:15 AM – 10:28 AM: Sanskrit · Navadurga',
            '• 10:30 AM – 10:36 AM: Sanskrit · Shivatandava',
            '2ND SHOW (11:00 AM – 12:55 PM)',
            '• 11:00 AM – 11:16 AM: Hindi · Dashaavatar',
            '• 11:18 AM – 11:26 AM: Math · Symphony of Symmetry and Functions',
            '• 11:28 AM – 11:41 AM: Sanskrit · Navadurga',
            '• 11:43 AM – 11:56 AM: Kannada · Nritya Nataka',
            '• 11:58 AM – 12:06 PM: Science · Physics: Luminiscence',
            '• 12:06 PM – 12:13 PM: Science · Chemistry: Luminiscence',
            '• 12:13 PM – 12:21 PM: Science · Biology: Luminiscence',
            '• 12:23 PM – 12:39 PM: Social Science · Fashion Walk',
            '• 12:41 PM – 12:49 PM: Sanskrit · Shivatandava',
            '3RD SHOW (1:00 PM – 2:30 PM)',
            '• 1:00 PM – 1:08 PM: Math · Symphony of Symmetry and Functions',
            '• 1:10 PM – 1:28 PM: English · The Bard Revisited',
            '• 1:30 PM – 1:38 PM: Science · Physics: Luminiscence',
            '• 1:38 PM – 1:45 PM: Science · Chemistry: Luminiscence',
            '• 1:45 PM – 1:53 PM: Science · Biology: Luminiscence',
            '• 1:55 PM – 2:05 PM: Hindi · Kavyantara',
            '• 2:08 PM – 2:24 PM: Social Science · Fashion Walk'
          ],
          peakTime: '11:00 AM & 1:00 PM'
        },
        nearbyLandmark: 'East of central corridor'
      },
      {
        id: 'g_stairs_w',
        room: 'West Staircase',
        title: 'West Staircase Core',
        subject: 'general',
        mockup: 'stairs_circulation',
        time: '9:35 AM – 3:00 PM',
        presenters: 'Facilities Core',
        desc: 'West wing circulation staircase connecting Basement, Ground, First, and Second floors.',
        px: -19.25, pz: -11.0,
        w: 7.5, h: 2.8, d: 7.5,
        rotation: Math.PI / 2,
        wing: 'West Core',
        locationGuide: 'Ground Floor · West wing core. Direct vertical access to Basement and Second Floor.',
        scheduleDetails: {
          status: 'All-Day Exhibition',
          sessions: ['Vertical Transit Access: All Day'],
          peakTime: 'Break times'
        },
        nearbyLandmark: 'West Core'
      },
      {
        id: 'g_stairs_e',
        room: 'East Staircase',
        title: 'East Staircase Core',
        subject: 'general',
        mockup: 'stairs_circulation',
        time: '9:35 AM – 3:00 PM',
        presenters: 'Facilities Core',
        desc: 'Eastern architectural staircase providing rapid transit between Ground Floor and Second Floor.',
        px: 11.0, pz: -7.25,
        w: 4.0, h: 2.8, d: 6.0,
        wing: 'East Core',
        locationGuide: 'Ground Floor · East wing core adjacent to Big Quadrangle and Skill Lab.',
        scheduleDetails: {
          status: 'All-Day Exhibition',
          sessions: ['Vertical Transit Access: All Day'],
          peakTime: 'Break times'
        },
        nearbyLandmark: 'East Core'
      }
    ]
  },

  // ==========================================
  // LEVEL 2: FIRST FLOOR (Science Classrooms: 3D & 3E Aerodynamics Models & 3F Chemistry Models)
  // Derived directly from first_floor_plan_meters.dxf
  // ==========================================
  {
    id: 'first',
    name: 'First Floor',
    shortName: '1F',
    level: 2,
    baseY: 13.0,
    theme: 'Science Classrooms: 3D & 3E Aerodynamics Models & 3F Chemistry Models',
    color: 0x059669,
    css: '#059669',
    exhibits: [
      {
        id: 'f1_cr3d',
        room: 'Classroom 3D',
        title: 'Physics: Aerodynamics Demonstration Models (Cl 6-9)',
        department: 'Science',
        classGrade: 'Cl 6-9',
        subject: 'physics',
        mockup: 'aerodynamics_lab',
        time: '9:35 AM – 3:00 PM',
        presenters: 'Physics Flight & Aerodynamics Team (Classes 6–9)',
        desc: 'Physics Department wind tunnels, airfoil models, and aerodynamics demonstration apparatus.',
        px: -19.25, pz: -2.5,
        w: 7.5, h: 2.8, d: 9.5,
        featured: true,
        wing: 'West Wing (1F)',
        locationGuide: 'First Floor · West wing hallway south of West Staircase.',
        scheduleDetails: {
          status: 'Live Now',
          sessions: [
            'Aerodynamics Demonstrations: 9:35 AM – 12:00 PM & 1:30 PM – 3:00 PM'
          ],
          peakTime: '11:30 AM'
        },
        nearbyLandmark: 'West Wing beside West Staircase'
      },
      {
        id: 'f1_cr3e',
        room: 'Classroom 3E',
        title: 'Physics: Aerodynamics Demonstration Models (Cl 6-9)',
        department: 'Science',
        classGrade: 'Cl 6-9',
        subject: 'physics',
        mockup: 'aerodynamics_lab',
        time: '9:35 AM – 3:00 PM',
        presenters: 'Physics Flight & Aerodynamics Team (Classes 6–9)',
        desc: 'Physics Department fluid dynamics and flight simulation demonstration models.',
        px: -19.25, pz: -18.0,
        w: 7.5, h: 2.8, d: 6.5,
        featured: true,
        wing: 'Northwest Corner (1F)',
        locationGuide: 'First Floor · Northwest corner hallway.',
        scheduleDetails: {
          status: 'Live Now',
          sessions: [
            'Flight Simulation & Wind Tests: 9:35 AM – 12:00 PM & 1:30 PM – 3:00 PM'
          ],
          peakTime: '11:00 AM'
        },
        nearbyLandmark: 'Northwest Corner'
      },
      {
        id: 'f1_cr3f',
        room: 'Classroom 3F',
        title: 'Chemistry: Models (Cl 6-9)',
        department: 'Science',
        classGrade: 'Cl 6-9',
        subject: 'chemistry',
        mockup: 'chemistry_bench',
        time: '9:35 AM – 3:00 PM',
        presenters: 'Junior Chemistry Guild (Classes 6–9)',
        desc: 'Chemistry Department experimental models, crystal lattices, and molecular geometry exhibits.',
        px: -11.75, pz: -18.0,
        w: 7.5, h: 2.8, d: 6.5,
        featured: true,
        wing: 'North Wing (1F)',
        locationGuide: 'First Floor · North corridor beside Classroom 3E.',
        scheduleDetails: {
          status: 'Live Now',
          sessions: [
            'Chemistry Models Demonstrations: 9:35 AM – 12:15 PM & 1:30 PM – 3:00 PM'
          ],
          peakTime: '11:00 AM'
        },
        nearbyLandmark: 'Beside Classroom 3E'
      },
      {
        id: 'f1_stairs_w',
        room: 'West Staircase',
        title: 'West Staircase Core',
        subject: 'general',
        mockup: 'stairs_circulation',
        time: '9:35 AM – 3:00 PM',
        presenters: 'Facilities Core',
        desc: 'Western vertical egress connecting Ground Floor up to First and Second Floors.',
        px: -19.25, pz: -11.0,
        w: 7.5, h: 2.8, d: 7.5,
        rotation: Math.PI / 2,
        wing: 'West Core (1F)',
        locationGuide: 'First Floor · West stair core between Classroom 3E and 3D.',
        scheduleDetails: {
          status: 'All-Day Exhibition',
          sessions: ['Vertical Transit Access: All Day'],
          peakTime: 'Throughout day'
        },
        nearbyLandmark: 'West Core'
      },
      {
        id: 'f1_stairs_e',
        room: 'East Staircase',
        title: 'East Staircase Core',
        subject: 'general',
        mockup: 'stairs_circulation',
        time: '9:35 AM – 3:00 PM',
        presenters: 'Facilities Core',
        desc: 'Eastern architectural staircase providing rapid transit between Ground, First, and Second Floors.',
        px: 11.0, pz: -7.25,
        w: 4.0, h: 2.8, d: 6.0,
        wing: 'East Core (1F)',
        locationGuide: 'First Floor · East core staircase beside courtyard void.',
        scheduleDetails: {
          status: 'All-Day Exhibition',
          sessions: ['Vertical Transit Access: All Day'],
          peakTime: 'Throughout day'
        },
        nearbyLandmark: 'East of courtyard cutout'
      }
    ]
  },

  // ==========================================
  // LEVEL 3: SECOND FLOOR (Senior Classrooms: Math, Science & Social Science)
  // Derived directly from second_floor_plan_meters.dxf
  // ==========================================
  {
    id: 'second',
    name: 'Second Floor',
    shortName: '2F',
    level: 3,
    baseY: 19.5,
    theme: 'Senior Classrooms: 12B Math Games & Models, 11A Biology, 11B Earthshot & 12A Social Science',
    color: 0x475569,
    css: '#475569',
    exhibits: [
      {
        id: 'f2_cr12b',
        room: 'Class Room 12 B',
        title: 'Games (Cl 6-10)',
        department: 'Math',
        classGrade: 'Cl 6-10',
        subject: 'math',
        mockup: 'math_games',
        time: '9:35 AM – 3:00 PM',
        presenters: 'Math Department (Classes 6–10)',
        desc: 'Math Department interactive logic games, puzzles, and computational challenges.',
        px: -19.25, pz: -18.00,
        w: 7.5, h: 2.8, d: 6.5,
        wing: 'Northwest Corner (2F)',
        locationGuide: 'Second Floor · Northwest Corner beside West Staircase.',
        scheduleDetails: {
          status: 'Live Now',
          sessions: [
            'Morning Games: 9:35 AM – 12:30 PM',
            'Afternoon Tournaments: 1:30 PM – 3:00 PM'
          ],
          peakTime: '11:00 AM & 2:00 PM'
        },
        nearbyLandmark: 'Beside West Staircase'
      },
      {
        id: 'f2_cr12b_centum',
        room: 'Class Room 12 B (Centum room)',
        title: 'Models (Cl 6-10)',
        department: 'Math',
        classGrade: 'Cl 6-10',
        subject: 'math',
        mockup: 'math_models',
        time: '9:35 AM – 3:00 PM',
        presenters: 'Math Department (Classes 6–10)',
        desc: 'Math Department 3D geometric polyhedra, fractal sculptures, and topology models.',
        px: -11.75, pz: -18.00,
        w: 7.5, h: 2.8, d: 6.5,
        wing: 'North Wing (2F)',
        locationGuide: 'Second Floor · North corridor beside Class Room 12 B.',
        scheduleDetails: {
          status: 'Live Now',
          sessions: [
            '3D Geometry & Fractals: 9:35 AM – 12:00 PM',
            'Topology Demonstrations: 1:30 PM – 3:00 PM'
          ],
          peakTime: '11:30 AM'
        },
        nearbyLandmark: 'Between 12 B and Sky Terrace'
      },
      {
        id: 'f2_cr11a',
        room: 'Class Room 11 A',
        title: 'Biology: Models (Cl 6-10)',
        department: 'Science',
        classGrade: 'Cl 6-10',
        subject: 'biology',
        mockup: 'dna_biology',
        time: '9:35 AM – 3:00 PM',
        presenters: 'Biology Department (Classes 6–10)',
        desc: 'Biology Department anatomical models, physiological pumps, and ecological dioramas.',
        px: 8.75, pz: -18.00,
        w: 7.5, h: 2.8, d: 6.5,
        featured: true,
        wing: 'North Wing (2F)',
        locationGuide: 'Second Floor · North corridor east wing.',
        scheduleDetails: {
          status: 'Live Now',
          sessions: [
            'Anatomy Models: 9:35 AM – 12:00 PM',
            'Physiology Demonstrations: 1:15 PM – 3:00 PM'
          ],
          peakTime: '11:00 AM & 1:45 PM'
        },
        nearbyLandmark: 'North corridor east'
      },
      {
        id: 'f2_cr11b_centum',
        room: 'Class Room 11 B (Centum room)',
        title: 'Models: VITU, Earthshot (Cl 7-9 & 12)',
        department: 'Science',
        classGrade: 'Cl 7-9 & 12',
        subject: 'science',
        mockup: 'chemistry_bench',
        time: '9:35 AM – 3:00 PM',
        presenters: 'VITU & Earthshot Climate Scholars (Classes 7–9 & 12)',
        desc: 'Science Department VITU technology and Earthshot climate action innovation models.',
        px: 15.75, pz: -18.00,
        w: 6.5, h: 2.8, d: 6.5,
        featured: true,
        wing: 'Northeast Corner (2F)',
        locationGuide: 'Second Floor · Northeast corner room.',
        scheduleDetails: {
          status: 'Live Now',
          sessions: [
            'Earthshot Innovations: 9:35 AM – 12:15 PM',
            'VITU Systems: 1:30 PM – 3:00 PM'
          ],
          peakTime: '11:15 AM & 2:00 PM'
        },
        nearbyLandmark: 'Northeast corner'
      },
      {
        id: 'f2_cr12a',
        room: 'Class Room 12 A',
        title: 'Models (Cl 9&10)',
        department: 'Social Science',
        classGrade: 'Cl 9&10',
        subject: 'social',
        mockup: 'social_diorama',
        time: '9:35 AM – 3:00 PM',
        presenters: 'Social Science Department (Classes 9 & 10)',
        desc: 'Social Science architectural, civic, and historical diorama models.',
        px: -19.25, pz: -4.00,
        w: 7.5, h: 2.8, d: 6.5,
        featured: true,
        wing: 'West Corridor (2F)',
        locationGuide: 'Second Floor · West corridor south of West Staircase.',
        scheduleDetails: {
          status: 'Live Now',
          sessions: [
            'Historical Models: 9:35 AM – 12:00 PM',
            'Geospatial Exhibits: 1:30 PM – 3:00 PM'
          ],
          peakTime: '11:00 AM & 2:15 PM'
        },
        nearbyLandmark: 'West corridor'
      },
      {
        id: 'f2_stairs_w',
        room: 'West Staircase',
        title: 'West Staircase Core',
        subject: 'general',
        mockup: 'stairs_circulation',
        time: '9:35 AM – 3:00 PM',
        presenters: 'Facilities Core',
        desc: 'Western vertical egress connecting Ground Floor up to Second Floor.',
        px: -19.25, pz: -11.0,
        w: 7.5, h: 2.8, d: 7.5,
        rotation: Math.PI / 2,
        wing: 'West Core (2F)',
        locationGuide: 'Second Floor · West stair core beside Class Room 12 B.',
        scheduleDetails: {
          status: 'All-Day Exhibition',
          sessions: ['Vertical Transit Access: All Day'],
          peakTime: 'Throughout day'
        },
        nearbyLandmark: 'West vertical core'
      },
      {
        id: 'f2_stairs_e',
        room: 'East Staircase',
        title: 'East Staircase Core',
        subject: 'general',
        mockup: 'stairs_circulation',
        time: '9:35 AM – 3:00 PM',
        presenters: 'Facilities Core',
        desc: 'Eastern architectural staircase providing rapid transit between Ground Floor and Second Floor.',
        px: 11.0, pz: -7.25,
        w: 4.0, h: 2.8, d: 6.0,
        wing: 'East Core (2F)',
        locationGuide: 'Second Floor · East core staircase beside courtyard void.',
        scheduleDetails: {
          status: 'All-Day Exhibition',
          sessions: ['Vertical Transit Access: All Day'],
          peakTime: 'Throughout day'
        },
        nearbyLandmark: 'East of courtyard cutout'
      }
    ]
  }
];
