import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, setDoc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Channel, Video } from '../../types';
import { 
  Video as VideoIcon, Plus, Settings, BarChart2, LayoutDashboard, 
  PlaySquare, Upload, Users, Eye, Clock, Image as ImageIcon, ChevronRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { compressImage } from '../../lib/imageUtils';

export function MyChannelDashboard() {
  const { user } = useAuth();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  // Creation State
  const [isCreating, setIsCreating] = useState(false);
  
  const handleImageUpload = (setter: (val: string) => void, maxWidth: number, maxHeight: number) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file, maxWidth, maxHeight, 0.8);
      setter(base64);
    } catch (err) {
      console.error("Failed to process image", err);
      alert("Failed to process image. Please try a different one.");
    }
  };

  // Settings State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDesc, setVideoDesc] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  const [activeTab, setActiveTab] = useState<'dashboard' | 'content' | 'analytics' | 'customization'>('dashboard');

  useEffect(() => {
    if (!user) return;
    async function fetchData() {
      try {
        const q = query(collection(db, 'videoChannels'), where('ownerId', '==', user.uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const ch = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Channel;
          setChannel(ch);
          setName(ch.name);
          setDescription(ch.description || '');
          setAvatarUrl(ch.avatarUrl || '');
          setBannerUrl(ch.bannerUrl || '');

          const vq = query(collection(db, 'videos'), where('channelId', '==', ch.id));
          const vSnapshot = await getDocs(vq);
          const vData = vSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Video[];
          setVideos(vData.sort((a,b) => b.createdAt - a.createdAt));
        }
      } catch (error) {
        console.error("Error fetching channel:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const newChannelRef = doc(collection(db, 'videoChannels'));
      const newChannel: Omit<Channel, 'id'> = {
        ownerId: user.uid,
        name,
        description,
        avatarUrl: '',
        bannerUrl: '',
        subscribersCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await setDoc(newChannelRef, newChannel);
      setChannel({ id: newChannelRef.id, ...newChannel });
      setIsCreating(false);
    } catch (error) {
      console.error("Error creating channel:", error);
    }
  };

  const handleUploadVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !channel) return;
    try {
      const newVideo: Omit<Video, 'id'> = {
        channelId: channel.id,
        ownerId: user.uid,
        title: videoTitle,
        description: videoDesc,
        videoUrl,
        thumbnailUrl,
        viewsCount: 0,
        likesCount: 0,
        status: 'public',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      const docRef = await addDoc(collection(db, 'videos'), newVideo);
      setVideos([{ id: docRef.id, ...newVideo }, ...videos]);
      setIsUploading(false);
      setVideoTitle('');
      setVideoDesc('');
      setVideoUrl('');
      setThumbnailUrl('');
      setActiveTab('content');
    } catch (error) {
      console.error("Error uploading video:", error);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channel) return;
    try {
      await updateDoc(doc(db, 'videoChannels', channel.id), {
        name,
        description,
        avatarUrl,
        bannerUrl,
        updatedAt: Date.now()
      });
      setChannel({ ...channel, name, description, avatarUrl, bannerUrl });
      alert('Channel customized successfully!');
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!channel) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <VideoIcon className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Create your Channel</h2>
        <p className="text-slate-500 mb-8">You need a channel to start uploading reels and building your audience.</p>
        
        {isCreating ? (
          <form onSubmit={handleCreateChannel} className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Channel Name</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="e.g. Daily Motivation" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" rows={3} placeholder="What is your channel about?" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setIsCreating(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors">Cancel</button>
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">Create Channel</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setIsCreating(true)} className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            Get Started
          </button>
        )}
      </div>
    );
  }

  const latestVideo = videos.length > 0 ? videos[0] : null;
  const totalViews = videos.reduce((acc, v) => acc + (v.viewsCount || 0), 0);
  const totalLikes = videos.reduce((acc, v) => acc + (v.likesCount || 0), 0);

  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto min-h-[80vh]">
      {/* Studio Sidebar */}
      <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center text-center mb-2">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-2 border-white shadow-sm mb-4">
            {channel.avatarUrl ? (
              <img src={channel.avatarUrl} alt={channel.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-indigo-600 font-bold text-3xl bg-indigo-50">
                {channel.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h2 className="font-bold text-slate-900 text-lg line-clamp-1">{channel.name}</h2>
          <Link to={`/channels/${channel.id}`} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-1">View Channel</Link>
        </div>

        <nav className="bg-white rounded-2xl border border-slate-200 p-2 flex flex-row md:flex-col gap-1 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('content')} 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'content' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <PlaySquare className="w-5 h-5" /> Content
          </button>
          <button 
            onClick={() => setActiveTab('analytics')} 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'analytics' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <BarChart2 className="w-5 h-5" /> Analytics
          </button>
          <button 
            onClick={() => setActiveTab('customization')} 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'customization' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Settings className="w-5 h-5" /> Customization
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900 capitalize">Channel {activeTab}</h1>
          <button 
            onClick={() => setIsUploading(true)} 
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Create Reel</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Latest Video Performance */}
            <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Latest video performance</h3>
              </div>
              {latestVideo ? (
                <div>
                  <div className="aspect-[9/16] bg-slate-100 relative w-1/2 mx-auto mt-4 rounded-lg overflow-hidden border border-slate-200">
                    {latestVideo.thumbnailUrl ? (
                      <img src={latestVideo.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <PlaySquare className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h4 className="font-semibold text-slate-900 line-clamp-1 mb-4 text-center">{latestVideo.title}</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Views</span>
                        <span className="font-medium text-slate-900">{latestVideo.viewsCount || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Likes</span>
                        <span className="font-medium text-slate-900">{latestVideo.likesCount || 0}</span>
                      </div>
                    </div>
                    <Link to={`/reels/${latestVideo.id}`} className="mt-6 block text-center text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wide">
                      Go to video analytics
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <PlaySquare className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                  <p className="text-sm">No videos uploaded yet.</p>
                </div>
              )}
            </div>

            {/* Channel Analytics Summary */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-6">Channel analytics</h3>
                <div className="space-y-6">
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Current subscribers</div>
                    <div className="text-3xl font-bold text-slate-900">{channel.subscribersCount || 0}</div>
                  </div>
                  
                  <div className="h-px bg-slate-100" />
                  
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-4">Summary</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-slate-500 mb-1">Views</div>
                        <div className="text-xl font-bold text-slate-900">{totalViews}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-500 mb-1">Total Likes</div>
                        <div className="text-xl font-bold text-slate-900">{totalLikes}</div>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100" />
                  
                  <button onClick={() => setActiveTab('analytics')} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wide">
                    Go to channel analytics
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTENT TAB */}
        {activeTab === 'content' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Video</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Visibility</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Views</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Likes</th>
                  </tr>
                </thead>
                <tbody>
                  {videos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                        <Upload className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                        <p className="font-medium text-slate-900 mb-1">No content available</p>
                        <p className="text-sm">Upload a video to get started.</p>
                      </td>
                    </tr>
                  ) : (
                    videos.map(video => (
                      <tr key={video.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-4">
                            <Link to={`/reels/${video.id}`} className="w-16 h-28 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 relative">
                              {video.thumbnailUrl ? (
                                <img src={video.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white"><PlaySquare className="w-6 h-6"/></div>
                              )}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <PlaySquare className="w-6 h-6 text-white" />
                              </div>
                            </Link>
                            <div className="py-1 max-w-xs">
                              <Link to={`/reels/${video.id}`} className="font-semibold text-slate-900 line-clamp-2 hover:text-indigo-600 transition-colors">
                                {video.title}
                              </Link>
                              <div className="text-sm text-slate-500 line-clamp-1 mt-1">{video.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <Eye className="w-3.5 h-3.5" /> Public
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(video.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{video.viewsCount || 0}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{video.likesCount || 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                    <Eye className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Views</div>
                </div>
                <div className="text-4xl font-bold text-slate-900">{totalViews}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Subscribers</div>
                </div>
                <div className="text-4xl font-bold text-slate-900">{channel.subscribersCount || 0}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
                    <PlaySquare className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Videos</div>
                </div>
                <div className="text-4xl font-bold text-slate-900">{videos.length}</div>
              </div>
            </div>
            
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
              <BarChart2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">Advanced Analytics</h3>
              <p>Historical charts and audience retention data will appear here once you receive more traffic.</p>
            </div>
          </div>
        )}

        {/* CUSTOMIZATION TAB */}
        {activeTab === 'customization' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Profile Customization</h2>
              <p className="text-sm text-slate-500">Update your channel's branding and basic info.</p>
            </div>
            <div className="p-6 md:p-8 max-w-3xl">
              <form onSubmit={handleUpdateSettings} className="space-y-8">
                
                {/* Branding Section */}
                <div className="space-y-6">
                  <h3 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-2">Branding</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Picture</label>
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 mb-2">Provide an image URL or upload a file for your profile picture. It's recommended to use a square image.</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input type="text" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm" placeholder="https://example.com/avatar.jpg" />
                          <label className="cursor-pointer bg-slate-100 border border-slate-300 text-slate-700 px-4 py-2.5 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center font-medium text-sm whitespace-nowrap">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload(setAvatarUrl, 500, 500)} />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Banner Image</label>
                    <div className="flex flex-col gap-3">
                      <div className="w-full h-32 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                        {bannerUrl ? (
                          <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-2">This image will appear across the top of your channel.</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input type="text" value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm" placeholder="https://example.com/banner.jpg" />
                          <label className="cursor-pointer bg-slate-100 border border-slate-300 text-slate-700 px-4 py-2.5 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center font-medium text-sm whitespace-nowrap">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload(setBannerUrl, 1600, 600)} />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Basic Info Section */}
                <div className="space-y-6 pt-4">
                  <h3 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-2">Basic info</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" rows={5} placeholder="Tell viewers about your channel." />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button type="submit" className="bg-indigo-600 text-white px-8 py-2.5 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-sm">
                    Publish Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Upload Video</h2>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="uploadForm" onSubmit={handleUploadVideo} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-1">Title (required)</label>
                      <input required type="text" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="Add a title that describes your video" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-1">Description</label>
                      <textarea required value={videoDesc} onChange={e => setVideoDesc(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" rows={5} placeholder="Tell viewers about your video" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-1">Video Source URL (required)</label>
                      <input required type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="https://example.com/video.mp4" />
                      <p className="text-xs text-slate-500 mt-1">Must be a direct link to an MP4 or compatible video file.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-1">Thumbnail URL</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input required={!thumbnailUrl} type="text" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="https://example.com/thumb.jpg" />
                        <label className="cursor-pointer bg-slate-100 border border-slate-300 text-slate-700 px-4 py-2.5 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center font-medium text-sm whitespace-nowrap">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload(setThumbnailUrl, 800, 1200)} />
                        </label>
                      </div>
                    </div>
                    
                    {/* Thumbnail Preview */}
                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Thumbnail Preview</label>
                      <div className="w-full aspect-[9/16] bg-slate-100 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center max-w-[200px]">
                        {thumbnailUrl ? (
                          <img src={thumbnailUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.classList.add('bg-slate-200');
                          }} />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-slate-300" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
              <button type="button" onClick={() => setIsUploading(false)} className="px-6 py-2.5 text-slate-700 font-semibold hover:bg-slate-200 rounded-full transition-colors">Cancel</button>
              <button type="submit" form="uploadForm" className="bg-indigo-600 text-white px-8 py-2.5 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-sm">Upload Reel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
