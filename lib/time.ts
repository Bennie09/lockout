export function parseHHMM(value: string) {
  const [h, m] = value.split(':').map((part) => Number(part) || 0);
  return clamp(h, 0, 23) * 60 + clamp(m, 0, 59);
}

export function toHHMM(totalMinutes: number) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${pad(h)}:${pad(m)}`;
}

export function formatTime(value: string) {
  const minutes = parseHHMM(value);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${ampm}`;
}

export function formatClock(date: Date) {
  return formatTime(toHHMM(date.getHours() * 60 + date.getMinutes()));
}

export function minutesOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

export function inWindow(nowMinutes: number, start: string, end: string) {
  const startMin = parseHHMM(start);
  const endMin = parseHHMM(end);
  if (startMin === endMin) return true;
  if (startMin < endMin) return nowMinutes >= startMin && nowMinutes < endMin;
  return nowMinutes >= startMin || nowMinutes < endMin;
}

export function windowLength(start: string, end: string) {
  const startMin = parseHHMM(start);
  const endMin = parseHHMM(end);
  if (startMin === endMin) return 1440;
  if (startMin < endMin) return endMin - startMin;
  return 1440 - startMin + endMin;
}

export function untilEnd(nowMinutes: number, end: string) {
  const endMin = parseHHMM(end);
  if (nowMinutes < endMin) return endMin - nowMinutes;
  return 1440 - nowMinutes + endMin;
}

export function untilStart(nowMinutes: number, start: string) {
  const startMin = parseHHMM(start);
  if (nowMinutes <= startMin) return startMin - nowMinutes;
  return 1440 - nowMinutes + startMin;
}

export function formatDuration(minutes: number) {
  const abs = Math.max(0, Math.round(minutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatHoursLabel(minutes: number | null) {
  if (minutes == null) return 'No daily cap';
  return `${formatDuration(minutes)} / day`;
}

export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function weekday(date = new Date()) {
  return date.getDay();
}

export function prettyDate(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}
