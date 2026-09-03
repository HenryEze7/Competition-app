import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Video, Channel, Comment } from '../../types';
import { ThumbsUp, MessageSquare, Tv, Share2 } from 'lucide-react';

export function VideoPlayer() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const [video, setVideo] = useState<Video | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchData() {
      try {
        const vRef = doc(db, 'videos', id!);
        const vSnap = await getDoc(vRef);
        
        if (vSnap.exists()) {
          const vData = { id: vSnap.id, ...vSnap.data() } as Video;
          
          // Increment view count
          await updateDoc(vRef, { viewsCount: (vData.viewsCount || 0) + 1 });
          setVideo({ ...vData, viewsCount: (vData.viewsCount || 0) + 1 });

          const cRef = doc(db, 'videoChannels', vData.channelId);
          const cSnap = await getDoc(cRef);
          if (cSnap.exists()) {
            setChannel({ id: cSnap.id, ...cSnap.data() } as Channel);
            
            if (user) {
              const sq = query(collection(db, 'subscriptions'), where('channelId', '==', cSnap.id), where('userId', '==', user.uid));
              const sSnap = await getDocs(sq);
              if (!sSnap.empty) {
                setIsSubscribed(true);
                setSubscriptionId(sSnap.docs[0].id);
              }
            }
          }
        }

        const cq = query(collection(db, 'comments'), where('videoId', '==', id));
        const cSnapshot = await getDocs(cq);
        const cData = cSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Comment[];
        setComments(cData.sort((a,b) => b.createdAt - a.createdAt));

      } catch (error) {
        console.error("Error fetching video:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, user]);

  const handleLike = async () => {
    if (!video || !user) return;
    try {
      const newCount = (video.likesCount || 0) + 1;
      await updateDoc(doc(db, 'videos', video.id), { likesCount: newCount });
      setVideo({ ...video, likesCount: newCount });
    } catch (error) {
      console.error("Error liking video:", error);
    }
  };
  
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };
  
  const handleSubscribe = async () => {
    if (!channel || !user) return;
    try {
      if (isSubscribed && subscriptionId) {
        await deleteDoc(doc(db, 'subscriptions', subscriptionId));
        const newCount = Math.max(0, (channel.subscribersCount || 0) - 1);
        await updateDoc(doc(db, 'videoChannels', channel.id), { subscribersCount: newCount });
        setChannel({ ...channel, subscribersCount: newCount });
        setIsSubscribed(false);
        setSubscriptionId(null);
      } else {
        const docRef = await addDoc(collection(db, 'subscriptions'), {
          channelId: channel.id,
          userId: user.uid,
          createdAt: Date.now()
        });
        const newCount = (channel.subscribersCount || 0) + 1;
        await updateDoc(doc(db, 'videoChannels', channel.id), { subscribersCount: newCount });
        setChannel({ ...channel, subscribersCount: newCount });
        setIsSubscribed(true);
        setSubscriptionId(docRef.id);
      }
    } catch (error) {
      console.error("Error toggling subscription:", error);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!video || !user || !newComment.trim()) return;
    
    try {
      const commentData: Omit<Comment, 'id'> = {
        videoId: video.id,
        userId: user.uid,
        userName: user.displayName || user.email || 'User',
        text: newComment.trim(),
        createdAt: Date.now()
      };
      
      const docRef = await addDoc(collection(db, 'comments'), commentData);
      setComments([{ id: docRef.id, ...commentData }, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  if (!video) return <div className="text-center p-12 text-slate-500">Video not found.</div>;

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Video Area */}
      <div className="lg:col-span-2 space-y-6">
        {/* Player */}
        <div className="bg-black aspect-video rounded-xl overflow-hidden flex items-center justify-center relative">
          {video.videoUrl ? (
             <video src={video.videoUrl} controls className="w-full h-full object-contain" poster={video.thumbnailUrl} />
          ) : (
            <div className="text-white text-center">
              <Tv className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Video source unavailable</p>
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{video.title}</h1>
          <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-4">
              {channel && (
                <>
                  <Link to={`/channels/${channel.id}`} className="flex items-center gap-3 group">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
                      {channel.avatarUrl ? <img src={channel.avatarUrl} alt="" className="w-full h-full object-cover" /> : channel.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{channel.name}</div>
                      <div className="text-sm text-slate-500">{channel.subscribersCount || 0} subscribers</div>
                    </div>
                  </Link>
                  {user && user.uid !== channel.ownerId && (
                    <button 
                      onClick={handleSubscribe} 
                      className={`ml-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                        isSubscribed 
                          ? 'bg-slate-200 text-slate-800 hover:bg-slate-300' 
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {isSubscribed ? 'Subscribed' : 'Subscribe'}
                    </button>
                  )}
                </>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button onClick={handleLike} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-2 rounded-full font-medium transition-colors">
                <ThumbsUp className="w-5 h-5" />
                {video.likesCount || 0}
              </button>
              <button onClick={handleShare} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-2 rounded-full font-medium transition-colors">
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-xl p-4 mt-6 text-sm text-slate-700">
            <div className="font-medium text-slate-900 mb-2">
              {video.viewsCount || 0} views • {new Date(video.createdAt).toLocaleDateString()}
            </div>
            <div className="whitespace-pre-wrap">{video.description}</div>
          </div>
        </div>
      </div>

      {/* Sidebar - Comments */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <MessageSquare className="w-5 h-5" />
          {comments.length} Comments
        </div>

        {user ? (
          <form onSubmit={handlePostComment} className="flex gap-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
               {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 space-y-3">
              <input 
                type="text" 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full border-b border-slate-300 bg-transparent px-0 py-1 focus:border-indigo-600 focus:ring-0 text-sm outline-none transition-colors"
              />
              {newComment.trim() && (
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setNewComment('')} className="px-4 py-1.5 rounded-full text-sm font-medium hover:bg-slate-100">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 rounded-full text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700">Comment</button>
                </div>
              )}
            </div>
          </form>
        ) : (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-600 flex justify-between items-center">
            Sign in to add a comment
            <Link to="/login" className="text-indigo-600 font-medium">Log in</Link>
          </div>
        )}

        <div className="space-y-6 mt-8">
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-4 group/comment">
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold flex-shrink-0">
                {comment.userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-slate-900 text-sm">{comment.userName}</span>
                  <span className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-slate-700">{comment.text}</p>
              </div>
              {user && (user.uid === comment.userId || user.uid === video.ownerId) && (
                <button 
                  onClick={async () => {
                    if (window.confirm('Delete this comment?')) {
                      await deleteDoc(doc(db, 'comments', comment.id));
                      setComments(comments.filter(c => c.id !== comment.id));
                    }
                  }}
                  className="opacity-0 group-hover/comment:opacity-100 text-red-500 hover:text-red-700 p-2 text-sm transition-opacity"
                  title="Delete comment"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
