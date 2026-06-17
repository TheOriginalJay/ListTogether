import { buildBackup, importBackupData, type BackupFile, type ImportResult } from '@/lib/backup';

// Passphrase-encrypted backup files (AES-GCM + PBKDF2). The passphrase is never
// stored — losing it means the encrypted file can't be recovered.

interface EncryptedFile {
  app: 'Bagged';
  enc: true;
  v: 1;
  salt: string;
  iv: string;
  ct: string;
}

function bufToB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function b64ToBuf(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 150_000, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function exportEncryptedBackup(passphrase: string): Promise<void> {
  if (!passphrase || passphrase.length < 6) throw new Error('Use a passphrase of at least 6 characters.');
  const data = await buildBackup();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, plaintext);

  const payload: EncryptedFile = {
    app: 'Bagged', enc: true, v: 1,
    salt: bufToB64(salt.buffer), iv: bufToB64(iv.buffer), ct: bufToB64(ct),
  };
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bagged-encrypted-backup-${data.exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importEncryptedBackup(file: File, passphrase: string): Promise<ImportResult> {
  let payload: EncryptedFile;
  try {
    payload = JSON.parse(await file.text());
  } catch {
    throw new Error('That file isn’t valid.');
  }
  if (payload?.app !== 'Bagged' || !payload.enc) throw new Error('Not an encrypted Bagged backup.');

  const key = await deriveKey(passphrase, b64ToBuf(payload.salt));
  let plaintext: ArrayBuffer;
  try {
    plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b64ToBuf(payload.iv) as BufferSource },
      key,
      b64ToBuf(payload.ct) as BufferSource
    );
  } catch {
    throw new Error('Wrong passphrase, or the file is corrupted.');
  }
  const data: BackupFile = JSON.parse(new TextDecoder().decode(plaintext));
  return importBackupData(data);
}
