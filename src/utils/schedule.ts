import { Exhibit } from '../data';

/** The exhibition day. Live-status badges only override static labels on this date. */
export const EVENT_DATE = '2026-10-31';

export type LiveStatus = 'live' | 'upcoming' | 'ended';

const TIME_WINDOW_RE =
  /(\d{1,2}):(\d{2})\s*(am|pm)\s*[–—-]\s*(\d{1,2}):(\d{2})\s*(am|pm)/i;

/**
 * Parses exhibit time windows like "10:00 AM – 3:30 PM" into concrete Dates
 * on the event day. Returns null for free-form strings it can't parse.
 */
export function parseTimeWindow(time: string, now: Date = new Date()): { start: Date; end: Date } | null {
  const match = TIME_WINDOW_RE.exec(time);
  if (!match) return null;

  const [, sh, sm, sap, eh, em, eap] = match;
  const buildDate = (h: string, m: string, ap: string): Date => {
    let hours = parseInt(h, 10) % 12;
    if (ap.toLowerCase() === 'pm') hours += 12;
    const d = new Date(now);
    d.setHours(hours, parseInt(m, 10), 0, 0);
    return d;
  };

  const start = buildDate(sh, sm, sap);
  const end = buildDate(eh, em, eap);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return { start, end };
}

const isEventDay = (now: Date): boolean =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}` === EVENT_DATE;

/**
 * Live status derived from the actual clock on the event day.
 * Returns null when not on the event day or the time string is unparseable,
 * so callers fall back to the curated static status label.
 */
export function getLiveStatus(exhibit: Exhibit, now: Date = new Date()): LiveStatus | null {
  if (!isEventDay(now)) return null;
  const window = parseTimeWindow(exhibit.time, now);
  if (!window) return null;
  if (now < window.start) return 'upcoming';
  if (now > window.end) return 'ended';
  return 'live';
}

export type SessionState = 'past' | 'live' | 'upcoming';

interface MinutesWindow {
  startMin: number;
  endMin: number;
}

const SESSION_RANGE_RE = /(\d{1,2}):(\d{2})\s*(am|pm)\s*[–—-]\s*(\d{1,2}):(\d{2})\s*(am|pm)/gi;
const SESSION_SINGLE_RE = /(\d{1,2}):(\d{2})\s*(am|pm)/gi;

const toMinutes = (h: string, m: string, ap: string): number => {
  let hours = parseInt(h, 10) % 12;
  if (ap.toLowerCase() === 'pm') hours += 12;
  return hours * 60 + parseInt(m, 10);
};

/**
 * Extracts every time window mentioned in a session line. Handles full ranges
 * ("9:40 AM – 9:56 AM"), multi-range lines joined by "&", and bare time lists
 * ("11:30 AM & 1:45 PM" becomes one window spanning both). Returns null for
 * lines with no clock times (e.g. "Continuous All-Day").
 */
function parseSessionWindows(line: string): MinutesWindow[] | null {
  const windows: MinutesWindow[] = [];
  const rangeRe = new RegExp(SESSION_RANGE_RE.source, 'gi');
  let match: RegExpExecArray | null;
  while ((match = rangeRe.exec(line)) !== null) {
    windows.push({
      startMin: toMinutes(match[1], match[2], match[3]),
      endMin: toMinutes(match[4], match[5], match[6])
    });
  }
  if (windows.length > 0) return windows;

  const singleRe = new RegExp(SESSION_SINGLE_RE.source, 'gi');
  const singles: number[] = [];
  while ((match = singleRe.exec(line)) !== null) {
    singles.push(toMinutes(match[1], match[2], match[3]));
  }
  if (singles.length >= 2) {
    return [{ startMin: Math.min(...singles), endMin: Math.max(...singles) }];
  }
  if (singles.length === 1) {
    return [{ startMin: singles[0], endMin: singles[0] + 15 }];
  }
  return null;
}

/**
 * State of one schedule line relative to the clock on the event day, so past
 * acts can be greyed out and the current act highlighted as time advances.
 * Returns null when not on the event day or the line has no parseable time.
 */
export function getSessionLineState(line: string, now: Date = new Date()): SessionState | null {
  if (!isEventDay(now)) return null;
  const windows = parseSessionWindows(line);
  if (!windows) return null;
  const startMin = Math.min(...windows.map(w => w.startMin));
  const endMin = Math.max(...windows.map(w => w.endMin));
  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (nowMin > endMin) return 'past';
  if (nowMin < startMin) return 'upcoming';
  return 'live';
}

export const LIVE_STATUS_LABELS: Record<LiveStatus, string> = {
  live: 'Live Now',
  upcoming: 'Starts Soon',
  ended: 'Finished Today'
};
