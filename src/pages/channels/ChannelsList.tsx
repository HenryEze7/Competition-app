import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Channel } from '../../types';
import { Link } from 'react-router-dom';
import { Tv, Users, ChevronRight, PlaySquare } from 'lucide-react';

export function ChannelsList() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChannels() {
      try {
        const q = query(collection(db, 'videoChannels'), orderBy('subscribersCount', 'desc'), limit(50));
        const querySnapshot = await getDocs(q);
        const channelsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Channel[];
        setChannels(channelsData);
      } catch (error) {
        console.error("Error fetching channels:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchChannels();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2 mb-2">
            <Tv className="w-8 h-8 text-indigo-600" />
            Creator Channels
          </h1>
          <p className="text-slate-500">Discover and subscribe to top creators on the platform.</p>
        </div>
        <Link 
          to="/my-channel" 
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-indigo-700 transition-colors shadow-sm self-start md:self-auto whitespace-nowrap"
        >
          Create Channel
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {channels.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Tv className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No channels yet</h3>
            <p className="text-slate-500">Be the first to create one in your studio!</p>
          </div>
        ) : (
          channels.map(channel => (
            <Link 
              key={channel.id} 
              to={`/channels/${channel.id}`}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all group flex flex-col"
            >
              <div className="h-24 bg-slate-100 relative">
                 {channel.bannerUrl ? (
                    <img src={channel.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full bg-gradient-to-r from-indigo-100 to-emerald-50"></div>
                 )}
                 <div className="absolute -bottom-10 left-6">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white bg-slate-100 shadow-md">
                      {channel.avatarUrl ? (
                        <img src={channel.avatarUrl} alt={channel.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-indigo-600 font-bold text-2xl bg-indigo-50">
                          {channel.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                 </div>
              </div>
              
              <div className="pt-12 px-6 pb-6 flex-1 flex flex-col">
                <h3 className="font-bold text-xl text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{channel.name}</h3>
                <div className="text-sm text-slate-500 mb-3 font-medium">
                  @{channel.name.toLowerCase().replace(/\s+/g, '')} • {channel.subscribersCount || 0} subscribers
                </div>
                
                {channel.description && (
                  <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed flex-1">
                    {channel.description}
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                   <div className="text-indigo-600 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                      Visit Channel <ChevronRight className="w-4 h-4" />
                   </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
