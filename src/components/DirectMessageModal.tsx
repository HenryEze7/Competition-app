import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, UserCircle, Search, ArrowLeft, Hash, Plus, Paperclip, Link, Upload as UploadIcon } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth, AppUser } from '../contexts/AuthContext';
import { formatTimeAgo } from '../lib/utils';
import { compressImage } from '../lib/imageUtils';

interface DirectMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DirectMessage {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  participants: string[];
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  createdAt: any;
}

interface Channel {
  id: string;
  name: string;
  createdBy: string;
  createdAt: any;
}

interface ChannelMessage {
  id: string;
  channelId: string;
  text: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  createdAt: any;
}

export function DirectMessageModal({ isOpen, onClose }: DirectMessageModalProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeTab, setActiveTab] = useState<'users' | 'channels'>('users');
  const [activeChat, setActiveChat] = useState<AppUser | null>(null);
  
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  
  const [dmMessages, setDmMessages] = useState<DirectMessage[]>([]);
  const [channelMessages, setChannelMessages] = useState<ChannelMessage[]>([]);
  
  const [newMessage, setNewMessage] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file, 800, 800, 0.8);
      setMediaUrl(base64);
      setShowMediaInput(true);
    } catch (err) {
      console.error("Failed to process image", err);
      alert("Failed to process image. Please try a different one.");
    }
  };
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all users once when modal opens
  useEffect(() => {
    if (!isOpen || !user) return;
    
    const fetchUsers = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersList: AppUser[] = [];
        usersSnap.forEach((doc) => {
          if (doc.id !== user.uid) { // Exclude current user
            usersList.push({ uid: doc.id, ...doc.data() } as AppUser);
          }
        });
        setUsers(usersList);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    
    fetchUsers();
  }, [isOpen, user]);

  // Subscribe to channels list
  useEffect(() => {
    if (!isOpen || !user) return;
    const q = query(collection(db, 'channels'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chs: Channel[] = [];
      snapshot.forEach((doc) => {
        chs.push({ id: doc.id, ...doc.data() } as Channel);
      });
      setChannels(chs);
    });
    return () => unsubscribe();
  }, [isOpen, user]);

  // Subscribe to DMs
  useEffect(() => {
    if (!activeChat || !user) return;

    const q = query(
      collection(db, 'directMessages'),
      where('participants', 'array-contains', user.uid),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: DirectMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Omit<DirectMessage, 'id'>;
        if (data.participants.includes(activeChat.uid)) {
          msgs.push({ id: doc.id, ...data });
        }
      });
      setDmMessages(msgs);
    }, (error) => {
      console.error("DM snapshot error:", error);
    });

    return () => unsubscribe();
  }, [activeChat, user]);
  
  // Subscribe to channel messages
  useEffect(() => {
    if (!activeChannel || !user) return;

    const q = query(
      collection(db, 'channelMessages'),
      where('channelId', '==', activeChannel.id),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChannelMessage[] = [];
      snapshot.forEach(doc => msgs.push({ id: doc.id, ...doc.data() } as ChannelMessage));
      setChannelMessages(msgs);
    }, (error) => {
      console.error("Channel snapshot error:", error);
    });

    return () => unsubscribe();
  }, [activeChannel, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (activeChat || activeChannel) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [dmMessages, channelMessages, activeChat, activeChannel]);

  const handleSendDM = async () => {
    if ((!newMessage.trim() && !mediaUrl.trim()) || !user || !activeChat || sending) return;
    const text = newMessage.trim();
    const mUrl = mediaUrl.trim();
    const isVideo = mUrl.match(/\.(mp4|webm|mov|ogg)(\?.*)?$/i);
    
    setNewMessage('');
    setMediaUrl('');
    setShowMediaInput(false);
    setSending(true);

    try {
      await addDoc(collection(db, 'directMessages'), {
        text,
        mediaUrl: mUrl || null,
        mediaType: mUrl ? (isVideo ? 'video' : 'image') : null,
        senderId: user.uid,
        receiverId: activeChat.uid,
        participants: [user.uid, activeChat.uid],
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error sending DM:", err);
      setNewMessage(text);
      setMediaUrl(mUrl);
    } finally {
      setSending(false);
    }
  };
  
  const handleSendChannelMessage = async () => {
    if ((!newMessage.trim() && !mediaUrl.trim()) || !user || !activeChannel || sending) return;
    const text = newMessage.trim();
    const mUrl = mediaUrl.trim();
    const isVideo = mUrl.match(/\.(mp4|webm|mov|ogg)(\?.*)?$/i);
    
    setNewMessage('');
    setMediaUrl('');
    setShowMediaInput(false);
    setSending(true);

    try {
      await addDoc(collection(db, 'channelMessages'), {
        text,
        mediaUrl: mUrl || null,
        mediaType: mUrl ? (isVideo ? 'video' : 'image') : null,
        channelId: activeChannel.id,
        senderId: user.uid,
        senderName: user.username || user.name || 'Anonymous',
        senderPhoto: user.photoURL || null,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error sending channel message:", err);
      setNewMessage(text);
      setMediaUrl(mUrl);
    } finally {
      setSending(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeChat) {
      handleSendDM();
    } else if (activeChannel) {
      handleSendChannelMessage();
    }
  };
  
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim() || !user) return;
    
    const formattedName = newChannelName.trim().toLowerCase().replace(/\s+/g, '-');
    setNewChannelName('');
    setIsCreatingChannel(false);
    
    try {
      const docRef = await addDoc(collection(db, 'channels'), {
        name: formattedName,
        createdBy: user.uid,
        createdAt: serverTimestamp()
      });
      // Optionally auto-select the new channel
      setActiveChat(null);
      setActiveChannel({ id: docRef.id, name: formattedName, createdBy: user.uid, createdAt: null });
    } catch (err) {
      console.error("Error creating channel:", err);
    }
  };

  if (!isOpen || !user) return null;

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl w-full max-w-4xl h-[600px] max-h-[85vh] overflow-hidden shadow-xl flex"
      >
        {/* Left Pane: Users & Channels List */}
        <div className={`w-full md:w-1/3 border-r border-slate-200 flex flex-col ${(activeChat || activeChannel) ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              Chat
            </h3>
            <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex border-b border-slate-200 shrink-0">
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Direct
            </button>
            <button 
              onClick={() => setActiveTab('channels')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1 ${activeTab === 'channels' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Channels
            </button>
          </div>
          
          <div className="p-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder={`Search ${activeTab}...`} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'users' ? (
              filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  No users found.
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <button
                    key={u.uid}
                    onClick={() => { setActiveChannel(null); setActiveChat(u); }}
                    className={`w-full p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors border-l-2 ${activeChat?.uid === u.uid ? 'border-indigo-600 bg-indigo-50/50' : 'border-transparent'}`}
                  >
                    {u.photoURL ? (
                      <img src={u.photoURL} alt={u.name} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                    ) : (
                      <UserCircle className="w-10 h-10 text-slate-300" />
                    )}
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-800 truncate">{u.username || u.name}</div>
                      <div className="text-xs text-slate-500 truncate">{u.role === 'admin' ? 'Admin' : 'Participant'}</div>
                    </div>
                  </button>
                ))
              )
            ) : (
              <div className="flex flex-col h-full">
                {isCreatingChannel ? (
                  <div className="p-3 border-b border-slate-100 bg-indigo-50/50">
                    <form onSubmit={handleCreateChannel} className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-slate-400" />
                        <input 
                          type="text"
                          value={newChannelName}
                          onChange={(e) => setNewChannelName(e.target.value.replace(/\s+/g, '-'))}
                          placeholder="channel-name"
                          className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setIsCreatingChannel(false)} className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1">Cancel</button>
                        <button type="submit" disabled={!newChannelName.trim()} className="text-xs bg-indigo-600 text-white rounded px-3 py-1 disabled:opacity-50">Create</button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsCreatingChannel(true)}
                    className="w-full p-3 flex items-center gap-2 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors border-b border-slate-100"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="font-medium">Create New Channel</span>
                  </button>
                )}
                
                {filteredChannels.length === 0 && !isCreatingChannel ? (
                  <div className="p-4 text-center text-sm text-slate-500">
                    No channels found.
                  </div>
                ) : (
                  filteredChannels.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setActiveChat(null); setActiveChannel(c); }}
                      className={`w-full p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors border-l-2 ${activeChannel?.id === c.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-transparent'}`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <Hash className="w-5 h-5" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-semibold text-sm text-slate-800 truncate">#{c.name}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Chat Window */}
        <div className={`w-full md:w-2/3 flex flex-col bg-slate-50 ${(!activeChat && !activeChannel) ? 'hidden md:flex' : 'flex'}`}>
          {(activeChat || activeChannel) ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => { setActiveChat(null); setActiveChannel(null); }} className="md:hidden text-slate-400 hover:text-slate-600 p-1">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  
                  {activeChat && (
                    <>
                      {activeChat.photoURL ? (
                        <img src={activeChat.photoURL} alt={activeChat.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <UserCircle className="w-8 h-8 text-slate-300" />
                      )}
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">{activeChat.username || activeChat.name}</h4>
                      </div>
                    </>
                  )}
                  
                  {activeChannel && (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <Hash className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">{activeChannel.name}</h4>
                      </div>
                    </>
                  )}
                  
                </div>
                <button onClick={onClose} className="hidden md:block text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeChat && dmMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <MessageSquare className="w-8 h-8 opacity-30" />
                    <p className="text-sm">Start the conversation with {activeChat.username || activeChat.name}</p>
                  </div>
                )}
                
                {activeChannel && channelMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <Hash className="w-8 h-8 opacity-30" />
                    <p className="text-sm">Be the first to post in #{activeChannel.name}</p>
                  </div>
                )}
                
                {/* DM Rendering */}
                {activeChat && dmMessages.map((msg, idx) => {
                  const isMe = msg.senderId === user.uid;
                  const showHeader = idx === 0 || dmMessages[idx - 1].senderId !== msg.senderId;

                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} w-full`}>
                      {showHeader && !isMe && (
                        <div className="flex items-center gap-1.5 mb-1 ml-1">
                          <span className="text-xs font-medium text-slate-500">{activeChat.username || activeChat.name}</span>
                        </div>
                      )}
                      
                      <div className={`max-w-[85%] px-4 py-2 rounded-2xl ${
                        isMe ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
                      }`}>
                        {msg.mediaUrl && msg.mediaType === 'image' && (
                          <img src={msg.mediaUrl} alt="attachment" className="max-w-full h-auto max-h-64 object-cover rounded-lg mb-2" />
                        )}
                        {msg.mediaUrl && msg.mediaType === 'video' && (
                          <video src={msg.mediaUrl} controls className="max-w-full h-auto max-h-64 object-cover rounded-lg mb-2" />
                        )}
                        {msg.text && <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>}
                      </div>
                      
                      <span className="text-[10px] text-slate-400 mt-1 mx-1">
                        {msg.createdAt?.toDate ? formatTimeAgo(msg.createdAt.toDate()) : 'Just now'}
                      </span>
                    </div>
                  );
                })}
                
                {/* Channel Rendering */}
                {activeChannel && channelMessages.map((msg, idx) => {
                  const isMe = msg.senderId === user.uid;
                  const showHeader = idx === 0 || channelMessages[idx - 1].senderId !== msg.senderId;

                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} w-full`}>
                      {showHeader && !isMe && (
                        <div className="flex items-center gap-2 mb-1 ml-1">
                          {msg.senderPhoto ? (
                            <img src={msg.senderPhoto} alt={msg.senderName} className="w-4 h-4 rounded-full object-cover" />
                          ) : (
                            <UserCircle className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="text-xs font-medium text-slate-500">{msg.senderName}</span>
                        </div>
                      )}
                      
                      <div className={`max-w-[85%] px-4 py-2 rounded-2xl ${
                        isMe ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
                      }`}>
                        {msg.mediaUrl && msg.mediaType === 'image' && (
                          <img src={msg.mediaUrl} alt="attachment" className="max-w-full h-auto max-h-64 object-cover rounded-lg mb-2" />
                        )}
                        {msg.mediaUrl && msg.mediaType === 'video' && (
                          <video src={msg.mediaUrl} controls className="max-w-full h-auto max-h-64 object-cover rounded-lg mb-2" />
                        )}
                        {msg.text && <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>}
                      </div>
                      
                      <span className="text-[10px] text-slate-400 mt-1 mx-1">
                        {msg.createdAt?.toDate ? formatTimeAgo(msg.createdAt.toDate()) : 'Just now'}
                      </span>
                    </div>
                  );
                })}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                <AnimatePresence>
                  {showMediaInput && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-2 overflow-hidden"
                    >
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
                        <Link className="w-4 h-4 text-slate-400 shrink-0" />
                        <input 
                          type="text"
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                          placeholder="Paste image URL or wait for upload..."
                          className="flex-1 bg-transparent text-sm focus:outline-none"
                          autoFocus
                        />
                        <button type="button" onClick={() => { setShowMediaInput(false); setMediaUrl(''); }} className="text-slate-400 hover:text-slate-600 p-1">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <form onSubmit={handleSend} className="flex items-end gap-2">
                  <div className="flex gap-1 shrink-0">
                    <label className={`cursor-pointer p-3 rounded-xl transition-colors flex items-center justify-center ${mediaUrl ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`} title="Upload Image">
                      <UploadIcon className="w-5 h-5" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleMediaUpload} />
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowMediaInput(!showMediaInput)}
                      className={`p-3 rounded-xl transition-colors flex items-center justify-center ${showMediaInput && !mediaUrl ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                      title="Attach Media URL"
                    >
                      <Link className="w-5 h-5" />
                    </button>
                  </div>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
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
                    disabled={(!newMessage.trim() && !mediaUrl.trim()) || sending}
                    className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shrink-0 flex items-center justify-center"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 relative">
              <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
              <MessageSquare className="w-12 h-12 opacity-20 mb-3" />
              <p className="text-sm">Select a user or channel to start chatting</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
