// Shared helper to show a consistent "customer called" toast across flows
import { useToast } from './useToast';

function makeCalledNotifyKey(business_id?: number, id?: number, queue_number?: number) {
  const biz = Number(business_id);
  const pid = id != null ? Number(id) : undefined;
  const qn = queue_number != null ? Number(queue_number) : undefined;
  return `calledNotified:${biz}:${pid ?? qn ?? 'unknown'}`;
}

function hasCalledNotified(business_id?: number, id?: number, queue_number?: number) {
  try { return localStorage.getItem(makeCalledNotifyKey(business_id, id, queue_number)) === '1'; }
  catch { return false; }
}

function markCalledNotified(business_id?: number, id?: number, queue_number?: number) {
  try { localStorage.setItem(makeCalledNotifyKey(business_id, id, queue_number), '1'); }
  catch {/* no-op */}
}

export function clearCalledNotified(business_id?: number, id?: number, queue_number?: number) {
  try { localStorage.removeItem(makeCalledNotifyKey(business_id, id, queue_number)); }
  catch {/* no-op */}
}

let chimeCtx: AudioContext | null = null;
function playChime() {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    chimeCtx = chimeCtx || new AC();
    if (chimeCtx.state === 'suspended') {
      chimeCtx.resume().catch(() => {});
    }
    const now = chimeCtx.currentTime;
    const makeTone = (freq: number, startOffset: number, duration: number) => {
      const osc = chimeCtx!.createOscillator();
      const gain = chimeCtx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + startOffset);
      gain.gain.setValueAtTime(0.0001, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.25, now + startOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
      osc.connect(gain).connect(chimeCtx!.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.01);
      setTimeout(() => { try { osc.disconnect(); gain.disconnect(); } catch { /* ignore */ } }, (startOffset + duration + 0.05) * 1000);
    };
    makeTone(880, 0.0, 0.6);
    makeTone(660, 0.12, 0.5);
  } catch { /* ignore */ }
}

export function notifyCustomerCalledOnce(params: { business_id?: number, id?: number, queue_number?: number }) {
  const { business_id, id, queue_number } = params || {};
  if (hasCalledNotified(business_id, id, queue_number)) return;
  markCalledNotified(business_id, id, queue_number);
  try {
    const { toast } = useToast();
    toast('You are being called now', 'info', 0, {
      showConfirmButton: true,
      confirmButtonText: 'OK',
      confirmButtonColor: '#283618',
      customClass: {
        popup: 'swal2-toast',
        confirmButton: 'swal2-confirm text-xs py-1 px-2',
        title: 'text-sm',
      },
    });
  } catch { /* toast failed silently */ }
  playChime();
}

export default {
  notifyCustomerCalledOnce,
  clearCalledNotified,
};
