import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Send, MessageSquare, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getMessages, sendMessage, deleteMessage, subscribeMessages, type ChatMessage } from '@/lib/chat';

function senderName(m: ChatMessage): string {
  return m.sender?.full_name || m.sender?.email?.split('@')[0] || 'Someone';
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function ChatPanel({ listId, listName, onClose }: { listId: string; listName: string; onClose: () => void }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try { setMessages(await getMessages(listId)); }
    catch { showToast('Could not load chat', 'error'); }
    finally { setLoading(false); }
  }, [listId, showToast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ch = subscribeMessages(listId, load);
    return () => { ch.unsubscribe(); };
  }, [listId, load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText('');
    try {
      await sendMessage(listId, body);
      // realtime will refresh; load() also called via subscription
    } catch {
      setText(body);
      showToast('Could not send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    const prev = messages;
    setMessages(p => p.filter(m => m.id !== id));
    try { await deleteMessage(id); } catch { setMessages(prev); showToast('Could not delete', 'error'); }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <div
        className="w-full sm:max-w-md bg-[#FAFAF8] h-full flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 bg-white border-b border-[#E5E5E0]/60 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#D97706]/10 flex items-center justify-center">
            <MessageSquare className="w-4.5 h-4.5 text-[#D97706]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#1A1A1A] text-sm truncate">Chat</p>
            <p className="text-xs text-[#9CA3AF] truncate">{listName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#F5F5F0] text-[#6B6B5F]" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 border-[3px] border-[#E5E5E0] border-t-[#D97706] rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm font-medium text-[#1A1A1A] mb-1">No messages yet</p>
              <p className="text-xs text-[#9CA3AF]">Say hello to everyone on this list.</p>
            </div>
          ) : (
            messages.map(m => {
              const mine = m.user_id === user?.id;
              return (
                <div key={m.id} className={`group flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                  {!mine && <span className="text-[11px] font-semibold text-[#6B6B5F] mb-0.5 ml-1">{senderName(m)}</span>}
                  <div className="flex items-end gap-1.5 max-w-[80%]">
                    {mine && (
                      <button onClick={() => handleDelete(m.id)} className="p-1 text-[#C4C4BC] hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Delete message">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${mine ? 'bg-[#D97706] text-white rounded-br-md' : 'bg-white border border-[#E5E5E0]/60 text-[#1A1A1A] rounded-bl-md'}`}>
                      {m.body}
                    </div>
                  </div>
                  <span className="text-[10px] text-[#C4C4BC] mt-0.5 mx-1">{timeLabel(m.created_at)}</span>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        {/* Composer */}
        <div className="px-3 py-3 bg-white border-t border-[#E5E5E0]/60 shrink-0 flex items-center gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            placeholder="Message…"
            className="flex-1 bg-[#F5F5F0] rounded-xl px-4 py-2.5 text-sm font-medium text-[#1A1A1A] placeholder:text-[#C4C4BC] focus:bg-white focus:ring-2 focus:ring-[#D97706]/20 focus:outline-none transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-10 h-10 rounded-xl bg-[#1A1A1A] text-white flex items-center justify-center hover:bg-[#333] active:scale-95 transition-all disabled:opacity-30 shrink-0"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
