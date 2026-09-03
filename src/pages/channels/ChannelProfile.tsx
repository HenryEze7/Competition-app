import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Channel, Video } from '../../types';
import { Tv, Info, PlaySquare, Bell, Search, LayoutGrid, ChevronRight, UserPlus, Check } from 'lucide-react';

export function ChannelProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'reels' | 'videos' | 'about'>('home');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const docRef = doc(db, 'videoChannels', id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setChannel({ id: snapshot.id, ...snapshot.data() } as Channel);
          
          const vq = query(collection(db, 'videos'), where('channelId', '==', id), where('status', '==', 'public'));
          const vSnapshot = await getDocs(vq);
          const vData = vSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Video[];
          setVideos(vData.sort((a,b) => b.createdAt - a.createdAt));

          if (user) {
            const sq = query(collection(db, 'subscriptions'), where('channelId', '==', id), where('userId', '==', user.uid));
            const subSnap = await getDocs(sq);
            if (!subSnap.empty) {
              setIsSubscribed(true);
              setSubscriptionId(subSnap.docs[0].id);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching channel:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, user]);

  const handleSubscribe = async () => {
    if (!user || !channel) return;
    try {
      if (isSubscribed && subscriptionId) {
        await deleteDoc(doc(db, 'subscriptions', subscriptionId));
        const newCount = Math.max(0, (channel.subscribersCount || 0) - 1);
        await updateDoc(doc(db, 'videoChannels', channel.id), { subscribersCount: newCount });
        setChannel({ ...channel, subscribersCount: newCount });
        setIsSubscribed(false);
        setSubscriptionId(null);
      } else {
        const subRef = await addDoc(collection(db, 'subscriptions'), {
          userId: user.uid,
          channelId: channel.id,
          createdAt: Date.now()
        });
        const newCount = (channel.subscribersCount || 0) + 1;
        await updateDoc(doc(db, 'videoChannels', channel.id), { subscribersCount: newCount });
        setChannel({ ...channel, subscribersCount: newCount });
        setIsSubscribed(true);
        setSubscriptionId(subRef.id);
      }
    } catch (err) {
      console.error("Subscription error:", err);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!channel) return <div className="p-8 text-center text-slate-500">Channel not found.</div>;

  const featuredVideo = videos.length > 0 ? videos[0] : null;
  const isOwner = user && channel.ownerId === user.uid;

  return (
    <div className="w-full max-w-[1400px] mx-auto pb-16">
      {/* Banner */}
      <div className="w-full h-32 md:h-48 lg:h-64 bg-slate-200 rounded-2xl overflow-hidden relative border border-slate-200">
        {channel.bannerUrl ? (
          <img src={channel.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-indigo-100 via-purple-50 to-emerald-50"></div>
        )}
      </div>

      {/* Channel Header (YouTube Style) */}
      <div className="px-4 md:px-8 pt-6 pb-2">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
          <div className="w-24 h-24 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100 flex-shrink-0 -mt-16 md:-mt-20 relative z-10">
            {channel.avatarUrl ? (
              <img src={channel.avatarUrl} alt={channel.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-indigo-600 font-bold text-4xl bg-indigo-50">
                {channel.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 truncate mb-1.5">{channel.name}</h1>
              <div className="flex flex-wrap items-center gap-2 text-slate-500 text-sm">
                <span className="font-medium">@{channel.name.toLowerCase().replace(/\s+/g, '')}</span>
                <span>•</span>
                <span>{channel.subscribersCount || 0} subscribers</span>
                <span>•</span>
                <span>{videos.length} videos</span>
              </div>
              {channel.description && (
                <div className="text-slate-600 text-sm mt-2 line-clamp-1 flex items-center gap-1 hover:text-slate-900 cursor-pointer w-max" onClick={() => setActiveTab('about')}>
                  {channel.description} <ChevronRight className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isOwner ? (
                <Link to="/my-channel" className="bg-slate-100 text-slate-900 font-semibold px-6 py-2.5 rounded-full hover:bg-slate-200 transition-colors whitespace-nowrap">
                  Customize channel
                </Link>
              ) : (
                <button
                  onClick={handleSubscribe}
                  className={`px-6 py-2.5 rounded-full font-semibold flex items-center gap-2 transition-all ${
                    isSubscribed 
                      ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' 
                      : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'
                  }`}
                >
                  {isSubscribed ? (
                    <><Bell className="w-4 h-4" /> Subscribed</>
                  ) : (
                    'Subscribe'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 md:px-8 mt-6">
        <div className="border-b border-slate-200 flex gap-8 overflow-x-auto no-scrollbar">
          {(['home', 'reels', 'videos', 'about'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 text-base font-medium capitalize whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab 
                  ? 'border-slate-900 text-slate-900' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
          
          <button className="pb-3 px-1 ml-auto text-slate-400 hover:text-slate-600 border-b-2 border-transparent">
             <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-4 md:px-8 py-8">
        {activeTab === 'home' && (
          <div className="space-y-12 max-w-6xl">
            {/* Featured Section */}
            {featuredVideo && (
              <div className="flex flex-col md:flex-row gap-6 pb-8 border-b border-slate-200">
                <Link to={`/reels/${featuredVideo.id}`} className="w-full md:w-[480px] aspect-video bg-slate-900 rounded-xl overflow-hidden flex-shrink-0 group relative">
                  {featuredVideo.thumbnailUrl ? (
                    <img src={featuredVideo.thumbnailUrl} alt={featuredVideo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <PlaySquare className="w-16 h-16" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                     <div className="w-14 h-14 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-110 duration-300">
                        <PlaySquare className="w-7 h-7 text-white ml-1" />
                     </div>
                  </div>
                </Link>
                <div className="flex-1 flex flex-col justify-start">
                  <Link to={`/reels/${featuredVideo.id}`}>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-2 leading-tight mb-2">
                      {featuredVideo.title}
                    </h2>
                  </Link>
                  <div className="text-xs md:text-sm text-slate-500 mb-4 font-medium">
                    {featuredVideo.viewsCount || 0} views • {new Date(featuredVideo.createdAt).toLocaleDateString()}
                  </div>
                  {featuredVideo.description && (
                    <p className="text-slate-600 text-sm line-clamp-4 leading-relaxed">
                      {featuredVideo.description}
                    </p>
                  )}
                  <Link to={`/reels/${featuredVideo.id}`} className="text-sm font-semibold text-slate-900 mt-auto pt-4 hover:text-indigo-600 uppercase tracking-wide">
                    Read more
                  </Link>
                </div>
              </div>
            )}
            
            {/* Recent Uploads Row */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <h3 className="text-xl font-bold text-slate-900">For You</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                {videos.slice(0, 12).map(video => (
                  <Link key={video.id} to={`/reels/${video.id}`} className="group block">
                    <div className="bg-slate-200 aspect-video rounded-xl overflow-hidden mb-3 relative">
                      {video.thumbnailUrl ? (
                        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <PlaySquare className="w-10 h-10" />
                         </div>
                      )}
                      <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[11px] font-semibold px-1.5 py-0.5 rounded shadow">
                        {video.viewsCount || 0} views
                      </div>
                    </div>
                    <h4 className="font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors text-sm">{video.title}</h4>
                    <div className="text-sm text-slate-500 mt-1">
                      {new Date(video.createdAt).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
              {videos.length === 0 && (
                <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                  <LayoutGrid className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-900">This channel has no content yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REELS TAB */}
        {activeTab === 'reels' && (
          <div>
            <div className="flex items-center gap-2 mb-6">
               <h3 className="text-xl font-bold text-slate-900">Reels</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {videos.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                  <PlaySquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-900">No reels uploaded yet.</p>
                </div>
              ) : (
                videos.map(video => (
                  <Link key={video.id} to={`/reels/${video.id}`} className="group block">
                    <div className="bg-slate-200 aspect-[9/16] rounded-xl overflow-hidden mb-2 relative">
                      {video.thumbnailUrl ? (
                        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <PlaySquare className="w-10 h-10" />
                         </div>
                      )}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-semibold drop-shadow-md">
                        <PlaySquare className="w-4 h-4 fill-white" />
                        {video.viewsCount || 0}
                      </div>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 leading-tight group-hover:text-indigo-600">{video.title}</h3>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}

        {/* VIDEOS TAB */}
        {activeTab === 'videos' && (
           <div className="max-w-6xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                {videos.map(video => (
                  <Link key={video.id} to={`/reels/${video.id}`} className="group block">
                    <div className="bg-slate-200 aspect-video rounded-xl overflow-hidden mb-3 relative">
                      {video.thumbnailUrl ? (
                        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <PlaySquare className="w-10 h-10" />
                         </div>
                      )}
                      <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[11px] font-semibold px-1.5 py-0.5 rounded shadow">
                        {video.viewsCount || 0} views
                      </div>
                    </div>
                    <h4 className="font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors text-sm">{video.title}</h4>
                    <div className="text-sm text-slate-500 mt-1">
                      {new Date(video.createdAt).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
           </div>
        )}

        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <div className="max-w-4xl flex flex-col md:flex-row gap-12">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Description</h3>
              {channel.description ? (
                <div className="text-slate-800 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                  {channel.description}
                </div>
              ) : (
                <div className="text-slate-500 italic">No description provided.</div>
              )}
            </div>
            
            <div className="w-full md:w-64 flex-shrink-0 space-y-6">
              <div>
                 <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Stats</h3>
                 <div className="space-y-3">
                   <div className="flex items-center gap-3 text-slate-700 text-sm">
                      <span>Joined {new Date(channel.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                   </div>
                   <div className="w-full h-px bg-slate-200"></div>
                   <div className="flex items-center gap-3 text-slate-700 text-sm">
                      <span>{videos.reduce((a,b) => a + (b.viewsCount||0), 0).toLocaleString()} views</span>
                   </div>
                   <div className="w-full h-px bg-slate-200"></div>
                   <div className="flex items-center gap-3 text-slate-700 text-sm">
                      <span>{videos.length} videos</span>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
