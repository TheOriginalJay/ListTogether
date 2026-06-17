// Secret space — a PIN gate for hiding notes on this device.
// NOTE: this is a privacy gate (like WhatsApp's locked chats), not encryption.
// The PIN hash lives in localStorage; note data still lives in your account.

const PIN_KEY = 'bagged_pin_hash';
const UNLOCK_KEY = 'bagged_secret_unlocked';

async function hashPin(pin: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`bagged:${pin}`));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function hasPin(): boolean {
  try { return !!localStorage.getItem(PIN_KEY); } catch { return false; }
}

export async function setPin(pin: string): Promise<void> {
  localStorage.setItem(PIN_KEY, await hashPin(pin));
}

export async function verifyPin(pin: string): Promise<boolean> {
  try { return localStorage.getItem(PIN_KEY) === await hashPin(pin); } catch { return false; }
}

export function removePin(): void {
  try { localStorage.removeItem(PIN_KEY); } catch { /* ignore */ }
  lockSecret();
}

export function isUnlocked(): boolean {
  try { return sessionStorage.getItem(UNLOCK_KEY) === '1'; } catch { return false; }
}

export function unlockSecret(): void {
  try { sessionStorage.setItem(UNLOCK_KEY, '1'); } catch { /* ignore */ }
}

export function lockSecret(): void {
  try { sessionStorage.removeItem(UNLOCK_KEY); } catch { /* ignore */ }
}
