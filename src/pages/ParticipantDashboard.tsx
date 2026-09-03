import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Submission, Transaction } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import { Wallet, CheckCircle, Clock, XCircle, FileText, Plus, UserCircle, Edit3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BuyPointsModal } from '../components/BuyPointsModal';
import { EditProfileModal } from '../components/EditProfileModal';

export function ParticipantDashboard() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Submissions listener
    const subQ = query(
      collection(db, 'submissions'),
      where('participantId', '==', user.uid),
      orderBy('submittedAt', 'desc')
    );

    const unsubSub = onSnapshot(subQ, (snapshot) => {
      const results: Submission[] = [];
      snapshot.forEach((doc) => results.push({ id: doc.id, ...doc.data() } as Submission));
      setSubmissions(results);
    }, (error) => {
      console.error("Submissions snapshot error:", error);
    });

    // Transactions listener
    const transQ = query(
      collection(db, 'transactions'),
      where('participantId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubTrans = onSnapshot(transQ, (snapshot) => {
      const results: Transaction[] = [];
      snapshot.forEach((doc) => results.push({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(results);
      setLoading(false);
    }, (error) => {
      console.error("Transactions snapshot error:", error);
      setLoading(false);
    });

    return () => {
      unsubSub();
      unsubTrans();
    };
  }, [user]);

  if (!user) return null;

  const pending = submissions.filter(s => s.status === 'pending').length;
  const approved = submissions.filter(s => s.status === 'approved').length;
  const rejected = submissions.filter(s => s.status === 'rejected').length;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100 shadow-sm" onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name); }} />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-indigo-200">
              <UserCircle className="w-10 h-10 text-indigo-400" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{user.username || user.name}</h1>
              <button onClick={() => setIsEditProfileOpen(true)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors" title="Edit Profile">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-slate-500 mt-0.5">Track your progress and rewards.</p>
          </div>
        </div>
        <button
          onClick={() => setIsBuyModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Buy Points / Top Up
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Wallet className="w-5 h-5" /></div>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Total Earned</h3>
          </div>
          <p className="text-3xl font-bold text-indigo-700">{formatCurrency(user.totalEarned)}</p>
        </div>
        
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><Clock className="w-5 h-5" /></div>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Pending</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{pending}</p>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg text-green-600"><CheckCircle className="w-5 h-5" /></div>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Approved</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{approved}</p>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 rounded-lg text-red-600"><XCircle className="w-5 h-5" /></div>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Rejected</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{rejected}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Recent Submissions */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xl font-bold text-slate-900">Recent Submissions</h2>
          </div>
          <div className="divide-y divide-slate-100 flex-grow">
            {submissions.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No submissions yet.</div>
            ) : (
              submissions.map((sub) => (
                <div key={sub.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <Link to={`/challenge/${sub.challengeId}`} className="font-bold text-slate-900 hover:text-indigo-600 text-lg">
                      {sub.challengeTitle}
                    </Link>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      sub.status === 'approved' ? 'bg-green-100 text-green-800' :
                      sub.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-slate-500 mb-3">
                    <FileText className="w-4 h-4 mr-1.5" />
                    Submitted {formatDate(sub.submittedAt)}
                  </div>
                  {sub.status === 'rejected' && sub.adminFeedback && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-800">
                      <strong>Admin Feedback:</strong> {sub.adminFeedback}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reward History */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xl font-bold text-slate-900">Reward History</h2>
          </div>
          <div className="divide-y divide-slate-100 flex-grow overflow-x-auto">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No rewards earned yet.</div>
            ) : (
              <table className="min-w-full">
                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider text-left">
                  <tr>
                    <th className="px-6 py-3">Challenge</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3 text-right">Reward</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">{tx.challengeTitle}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{tx.description}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-green-600 text-right">
                        +{formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      
      <BuyPointsModal isOpen={isBuyModalOpen} onClose={() => setIsBuyModalOpen(false)} />
      <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />
    </div>
  );
}
