export function pad2(n: number): string {
  return n < 10 ? `0${Math.floor(n)}` : `${Math.floor(n)}`;
}


export function formatHMS(totalSeconds: number | null | undefined): string {
  const s = Number(totalSeconds);
  if (!Number.isFinite(s) || s <= 0) return '00:00:00';
  const secs = Math.max(0, Math.floor(s));
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

export function minutesToHMS(mins: number | null | undefined): string {
  if (mins == null || isNaN(Number(mins))) return '00:00:00';
  return formatHMS(Math.max(0, Math.round(Number(mins) * 60)));
}
