import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Video, Channel } from '../../types';
import { Link, useNavigate } from 'react-router-dom';
import { PlaySquare, ThumbsUp, Share2, Eye } from 'lucide-react';

type VideoWithChannel = Video & { channel?: Channel };

export function VideoDashboard() {
  const [videos, setVideos] = useState<VideoWithChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchVideos() {
      try {
        const vq = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
        const vSnap = await getDocs(vq);
        const videosData = vSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Video[];

        const cSnap = await getDocs(collection(db, 'videoChannels'));
        const channelsData = cSnap.docs.reduce((acc, doc) => {
          acc[doc.id] = { id: doc.id, ...doc.data() } as Channel;
          return acc;
        }, {} as Record<string, Channel>);

        const combined = videosData.map(v => ({
          ...v,
          channel: channelsData[v.channelId]
        }));

        setVideos(combined);
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, []);

  const handleShare = (e: React.MouseEvent, videoId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/reels/${videoId}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const handleLike = async (e: React.MouseEvent, videoId: string, currentLikes: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const newCount = (currentLikes || 0) + 1;
      await updateDoc(doc(db, 'videos', videoId), { likesCount: newCount });
      setVideos(prev => prev.map(v => v.id === videoId ? { ...v, likesCount: newCount } : v));
    } catch (err) {
      console.error("Error liking reel:", err);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <PlaySquare className="w-6 h-6 text-indigo-600" />
          Reels
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {videos.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            <PlaySquare className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No videos found</h3>
            <p className="text-slate-500">Check back later for new content!</p>
          </div>
        ) : (
          videos.map(video => (
            <div key={video.id} className="group block bg-white rounded-xl overflow-hidden border border-slate-200 hover:shadow-lg transition-all">
              <Link to={`/reels/${video.id}`} className="block relative aspect-[9/16] bg-slate-200 overflow-hidden">
                {video.thumbnailUrl ? (
                  <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-800">
                    <PlaySquare className="w-12 h-12" />
                  </div>
                )}
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                
                {/* Overlay Stats/Buttons */}
                <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <Eye className="w-4 h-4" />
                      {video.viewsCount || 0}
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => handleLike(e, video.id, video.likesCount)} 
                        className="flex items-center gap-1 hover:text-indigo-400 transition-colors"
                        title="Like"
                      >
                        <ThumbsUp className="w-5 h-5" />
                        <span className="text-sm font-medium">{video.likesCount || 0}</span>
                      </button>
                      <button 
                        onClick={(e) => handleShare(e, video.id)} 
                        className="hover:text-indigo-400 transition-colors"
                        title="Share"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
              
              <div className="p-3">
                <div className="flex gap-3">
                  <Link to={`/channels/${video.channelId}`} className="flex-shrink-0 w-9 h-9 bg-slate-200 rounded-full overflow-hidden shadow-sm hover:ring-2 hover:ring-indigo-500 transition-all">
                    {video.channel?.avatarUrl ? (
                      <img src={video.channel.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold text-sm">
                        {video.channel?.name?.charAt(0).toUpperCase() || 'C'}
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/reels/${video.id}`}>
                      <h3 className="font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                        {video.title}
                      </h3>
                    </Link>
                    <Link to={`/channels/${video.channelId}`} className="text-sm text-slate-500 hover:text-slate-700 block truncate mt-0.5">
                      {video.channel?.name || 'Unknown Channel'}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
