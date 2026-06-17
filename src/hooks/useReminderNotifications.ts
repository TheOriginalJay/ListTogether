import { useEffect, useRef } from 'react';
import { getReminders } from '@/lib/reminders';

const NOTIFIED_KEY = 'bagged_notified_reminders';

function loadNotified(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function saveNotified(s: Set<string>) {
  try {
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...s].slice(-300)));
  } catch {
    /* ignore quota errors */
  }
}

/**
 * Fires a browser notification when a reminder becomes due, while the app is open.
 * Polls once a minute (one lightweight query). De-dupes via localStorage so a
 * reminder only notifies once per device.
 *
 * NOTE: true background/scheduled push (app closed) needs Web Push + VAPID + a
 * server/edge function — tracked as a follow-up. This covers app-open delivery.
 */
export function useReminderNotifications() {
  const notified = useRef(loadNotified());

  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    let active = true;

    const check = async () => {
      if (!active || Notification.permission !== 'granted') return;
      try {
        const reminders = await getReminders();
        const now = Date.now();
        for (const r of reminders) {
          if (r.is_completed || !r.due_at || notified.current.has(r.id)) continue;
          const due = new Date(r.due_at).getTime();
          // Fire when due, within a 12h window so we don't blast very old reminders.
          if (due <= now && now - due < 12 * 60 * 60 * 1000) {
            try {
              new Notification('Bagged reminder', {
                body: r.title,
                icon: '/pwa-192x192.png',
                badge: '/pwa-192x192.png',
                tag: r.id,
              });
            } catch {
              /* some browsers require SW notifications; ignore failures */
            }
            notified.current.add(r.id);
            saveNotified(notified.current);
          }
        }
      } catch {
        /* offline / transient — try again next tick */
      }
    };

    check();
    const id = setInterval(check, 60_000);
    return () => { active = false; clearInterval(id); };
  }, []);
}
