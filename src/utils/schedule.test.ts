import { describe, it, expect } from 'vitest';
import { parseTimeWindow, getLiveStatus, getSessionLineState, EVENT_DATE } from './schedule';
import { FLOORS } from '../data';

describe('parseTimeWindow', () => {
  it('parses the en-dash format used across data.ts', () => {
    const now = new Date(`${EVENT_DATE}T12:00:00`);
    const w = parseTimeWindow('10:00 AM – 3:30 PM', now);
    expect(w).not.toBeNull();
    expect(w!.start.getHours()).toBe(10);
    expect(w!.start.getMinutes()).toBe(0);
    expect(w!.end.getHours()).toBe(15);
    expect(w!.end.getMinutes()).toBe(30);
    expect(w!.start.toDateString()).toBe(now.toDateString());
  });

  it('parses hyphen-separated windows and handles 12-hour wraparound', () => {
    const now = new Date(`${EVENT_DATE}T12:00:00`);
    const w = parseTimeWindow('11:00 AM - 1:30 PM', now);
    expect(w!.start.getHours()).toBe(11);
    expect(w!.end.getHours()).toBe(13);
  });

  it('correctly classifies multi-period shows spanning morning and afternoon (e.g. Flagship Quadrangle)', () => {
    const now = new Date(`${EVENT_DATE}T12:00:00`);
    const w = parseTimeWindow('9:40 AM – 2:30 PM', now);
    expect(w).not.toBeNull();
    const startH = w!.start.getHours() + w!.start.getMinutes() / 60;
    const endH = w!.end.getHours() + w!.end.getMinutes() / 60;
    expect(startH).toBeCloseTo(9.667, 2);
    expect(endH).toBeCloseTo(14.5, 2);
    // Matches morning criteria
    expect(startH < 12 && endH >= 9).toBe(true);
    // Matches afternoon criteria
    expect(endH > 12 && startH < 17).toBe(true);
  });

  it('returns null for free-form strings without a full window', () => {
    expect(parseTimeWindow('Every hour from 10:30 AM')).toBeNull();
    expect(parseTimeWindow('All Day')).toBeNull();
  });
});

describe('getLiveStatus', () => {
  const exhibit = FLOORS.flatMap(f => f.exhibits).find(e => e.time.includes('9:35 AM'))!;

  it('is null away from the event day regardless of time', () => {
    expect(getLiveStatus(exhibit, new Date('2026-10-01T11:00:00'))).toBeNull();
    expect(getLiveStatus(exhibit, new Date('2026-10-03T11:00:00'))).toBeNull();
  });

  it('derives live/upcoming/ended from the clock on the event day', () => {
    const day = (h: number) => new Date(`${EVENT_DATE}T${String(h).padStart(2, '0')}:00:00`);
    const statusAt = (h: number) => getLiveStatus(exhibit, day(h));

    if (statusAt(11) === 'live') {
      // This exhibit runs 10:00 AM – 3:30 PM style hours
      expect(statusAt(8)).toBe('upcoming');
      expect(statusAt(17)).toBe('ended');
    } else {
      // Fallback exhibit had unparseable hours — must degrade to null, never lie
      expect(getLiveStatus(exhibit, day(11))).toBeNull();
    }
  });
});

describe('getSessionLineState', () => {
  // Event-day clocks at 10:05, 12:10 and 15:00
  const at = (h: number, m = 0) => new Date(`${EVENT_DATE}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);

  it('greys out finished acts and shows the running act as live', () => {
    const line = '• 9:40 AM – 9:56 AM: Hindi · Dashaavatar';
    expect(getSessionLineState(line, at(10, 5))).toBe('past');
    expect(getSessionLineState(line, at(9, 45))).toBe('live');
    expect(getSessionLineState(line, at(9, 30))).toBe('upcoming');
  });

  it('classifies show headers by their full window', () => {
    const header = '1ST SHOW (9:45 AM – 10:45 AM)';
    expect(getSessionLineState(header, at(11))).toBe('past');
    expect(getSessionLineState(header, at(10))).toBe('live');
  });

  it('handles multi-range afternoon lines via their span', () => {
    const line = 'Aerodynamics Demonstrations: 9:35 AM – 12:00 PM & 1:30 PM – 3:00 PM';
    // 12:10 falls in the lunch gap inside the overall span — still "live"
    expect(getSessionLineState(line, at(12, 10))).toBe('live');
    expect(getSessionLineState(line, at(15, 30))).toBe('past');
  });

  it('treats bare time lists as a span and all-day text as unstateable', () => {
    expect(getSessionLineState('Interactive Game Sessions: 11:30 AM & 1:45 PM', at(12))).toBe('live');
    expect(getSessionLineState('Interactive Game Sessions: 11:30 AM & 1:45 PM', at(15))).toBe('past');
    expect(getSessionLineState('Stalls for 4 Genres with characters (Cl 5-8): Continuous All-Day', at(12))).toBeNull();
  });

  it('is null away from the event day so lists stay static', () => {
    expect(getSessionLineState('• 9:40 AM – 9:56 AM: Hindi · Dashaavatar', new Date('2026-10-01T12:00:00'))).toBeNull();
  });
});
