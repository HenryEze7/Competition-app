import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, X, Send, UserCircle, Bell } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatTimeAgo } from '../lib/utils';

interface ChatMessage {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  createdAt: any;
}

export function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to messages
  useEffect(() => {
    if (!isOpen || !user) return;

    const q = query(
      collection(db, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => msgs.push({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(msgs.reverse()); // Reverse to show chronological order
    }, (error) => {
      console.error("Chat snapshot error:", error);
    });

    return () => unsubscribe();
  }, [isOpen, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      await addDoc(collection(db, 'messages'), {
        text,
        userId: user.uid,
        userName: user.username || user.name || 'Anonymous',
        userPhoto: user.photoURL || null,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error sending message:", err);
      // Restore the message if failed
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  };

  // Only show the widget if the user is authenticated
  if (!user) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 sm:right-6 w-full max-w-sm sm:w-96 h-[500px] max-h-[70vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-slate-200"
          >
            {/* Header */}
            <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-100" />
                <h3 className="font-bold">News & Updates</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-indigo-500 rounded-full transition-colors text-indigo-100 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Megaphone className="w-8 h-8 opacity-50" />
                  <p className="text-sm">No announcements yet.</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  return (
                    <div key={msg.id} className="flex flex-col items-start w-full">
                      <div className="flex items-center gap-2 mb-2">
                        {msg.userPhoto ? (
                          <img src={msg.userPhoto} alt={msg.userName} className="w-6 h-6 rounded-full object-cover shadow-sm" />
                        ) : (
                          <UserCircle className="w-6 h-6 text-indigo-400" />
                        )}
                        <span className="text-sm font-bold text-slate-700">{msg.userName}</span>
                        <span className="text-xs text-slate-400 ml-1">
                          {msg.createdAt?.toDate ? formatTimeAgo(msg.createdAt.toDate()) : 'Just now'}
                        </span>
                      </div>
                      
                      <div className="w-full p-4 rounded-2xl bg-white border border-slate-200 text-slate-800 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area (Admins Only) */}
            {user.role === 'admin' && (
              <div className="p-3 bg-white border-t border-slate-100 shrink-0">
                <form onSubmit={handleSend} className="flex items-end gap-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Broadcast an announcement..."
                    className="flex-1 max-h-32 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shrink-0 flex items-center justify-center"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-4 sm:right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-600/30 flex items-center justify-center z-40 transition-colors hover:bg-indigo-700"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
      </motion.button>
    </>
  );
}
