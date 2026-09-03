import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Challenge } from '../types';
import { Link } from 'react-router-dom';
import { formatCurrency, formatTimeAgo } from '../lib/utils';
import { Search, Clock, Users, ArrowRight } from 'lucide-react';
import { AdvertSlider } from '../components/AdvertSlider';
import { ReelsSection } from '../components/ReelsSection';

export function Home() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'challenges'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results: Challenge[] = [];
      snapshot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() } as Challenge);
      });
      setChallenges(results);
      setLoading(false);
    }, (error) => {
      console.error("Home challenges snapshot error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredChallenges = challenges.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <AdvertSlider />
      
      <ReelsSection />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Available Challenges</h1>
          <p className="text-slate-500 mt-1">Complete tasks to earn rewards.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search challenges..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      {filteredChallenges.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-slate-500 text-lg">No challenges found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredChallenges.map((challenge) => (
            <div key={challenge.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <div className="p-6 flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    challenge.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {challenge.status === 'open' ? 'Open' : 'Closed'}
                  </span>
                  <span className="font-bold text-indigo-700 text-lg">
                    {formatCurrency(challenge.reward)}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2">{challenge.title}</h3>
                <p className="text-slate-500 text-sm mb-4 line-clamp-3">{challenge.description}</p>
                
                <div className="space-y-2 mt-auto">
                  <div className="flex items-center text-xs text-slate-500 font-medium">
                    <Clock className="w-4 h-4 mr-1.5 text-slate-400" />
                    Due {formatTimeAgo(challenge.deadline)}
                  </div>
                  <div className="flex items-center text-xs text-slate-500 font-medium">
                    <Users className="w-4 h-4 mr-1.5 text-slate-400" />
                    {challenge.submissionsCount || 0} Submissions
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 mt-auto">
                <Link
                  to={`/challenge/${challenge.id}`}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 font-medium py-2 rounded-lg transition-colors"
                >
                  View Challenge
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
