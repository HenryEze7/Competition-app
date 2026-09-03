import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Challenge, Submission } from '../../types';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../lib/utils';
import { PlusCircle, Target, Users, FileText, CheckCircle, Clock } from 'lucide-react';

export function AdminDashboard() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    // Challenges
    const cQ = query(collection(db, 'challenges'), orderBy('createdAt', 'desc'));
    const unsubC = onSnapshot(cQ, (snapshot) => {
      const results: Challenge[] = [];
      snapshot.forEach((doc) => results.push({ id: doc.id, ...doc.data() } as Challenge));
      setChallenges(results);
    }, (error) => {
      console.error("Admin challenges snapshot error:", error);
    });

    // Submissions (pending first)
    const sQ = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'));
    const unsubS = onSnapshot(sQ, (snapshot) => {
      const results: Submission[] = [];
      snapshot.forEach((doc) => results.push({ id: doc.id, ...doc.data() } as Submission));
      setSubmissions(results);
    }, (error) => {
      console.error("Admin submissions snapshot error:", error);
    });

    return () => {
      unsubC();
      unsubS();
    };
  }, []);

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');

  const handleSeedData = async () => {
    const demoChallenges = [
      {
        title: "Find 5 verified scholarships for university students",
        description: "Research and compile a list of 5 active, verified scholarship opportunities suitable for first-year or returning university students.",
        task: "Your task is to find 5 legitimate scholarships. For each scholarship, you must provide the name, amount, eligibility requirements, deadline, and a direct link to the official application page.",
        expectedResult: "5 legitimate scholarship opportunities with eligibility requirements and application links in a clear list.",
        reward: 2000,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        rules: "Scholarships must be currently active (not expired). They must not require application fees.",
        submissionRequirements: "Submit a written response or PDF containing the 5 scholarships with all required details.",
        status: "open",
        submissionsCount: 0,
        createdAt: new Date(),
        createdBy: 'admin'
      },
      {
        title: "Create a useful study timetable for first-year students",
        description: "Design a realistic and effective weekly study timetable template for incoming first-year students.",
        task: "Create a weekly timetable that balances lecture times, personal revision, assignments, and rest. Include tips on how to use it effectively.",
        expectedResult: "A practical weekly timetable covering lectures, revision and personal study.",
        reward: 1500,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        rules: "Must be realistic. Include time for meals, sleep, and breaks.",
        submissionRequirements: "Submit an image, PDF, or a link to a Google Sheet.",
        status: "open",
        submissionsCount: 0,
        createdAt: new Date(),
        createdBy: 'admin'
      },
      {
        title: "Find 3 affordable student accommodation options",
        description: "Help students find verified, affordable places to live near the main university campus.",
        task: "Find 3 currently available and affordable accommodation options. List the price, location (distance to campus), amenities, and contact information for the agent or landlord.",
        expectedResult: "Three verified options with location, price and contact information.",
        reward: 1000,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        rules: "Must be within a 5km radius of the main campus. Price must not exceed standard student rates.",
        submissionRequirements: "Submit a written response with the 3 options and verified contact details.",
        status: "open",
        submissionsCount: 0,
        createdAt: new Date(),
        createdBy: 'admin'
      }
    ];

    try {
      for (const challenge of demoChallenges) {
        await addDoc(collection(db, 'challenges'), challenge);
      }
      alert('Demo data seeded successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to seed demo data.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage platform challenges and verify submissions.</p>
        </div>
        <div className="flex items-center gap-3">
          {challenges.length === 0 && (
            <button 
              onClick={handleSeedData}
              className="inline-flex items-center justify-center bg-white border border-slate-300 text-slate-700 font-medium px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Seed Demo Challenges
            </button>
          )}
          <Link 
            to="/admin/create-challenge" 
            className="inline-flex items-center justify-center bg-indigo-600 text-white font-medium px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Create Challenge
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Submissions Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-indigo-500" />
              Pending Review
              {pendingSubmissions.length > 0 && (
                <span className="ml-3 bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingSubmissions.length}
                </span>
              )}
            </h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            {pendingSubmissions.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p>All caught up! No pending submissions.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingSubmissions.slice(0, 10).map(sub => (
                  <div key={sub.id} className="p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-slate-900 line-clamp-1">{sub.challengeTitle}</div>
                    </div>
                    <div className="text-sm text-slate-500 mb-4">by {sub.participantName}</div>
                    <Link
                      to={`/admin/review/${sub.id}`}
                      className="text-sm font-medium text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors inline-block"
                    >
                      Review Submission
                    </Link>
                  </div>
                ))}
              </div>
            )}
            {pendingSubmissions.length > 10 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-sm font-medium text-slate-600">
                +{pendingSubmissions.length - 10} more pending
              </div>
            )}
          </div>
        </div>

        {/* Challenges Section */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <Target className="w-5 h-5 mr-2 text-indigo-500" />
            Active Challenges
          </h2>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Challenge</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reward</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {challenges.map(challenge => (
                    <tr key={challenge.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 mb-1">{challenge.title}</div>
                        <div className="flex items-center text-xs text-slate-500">
                          <Clock className="w-3 h-3 mr-1" />
                          Due: {formatDate(challenge.deadline)}
                          <span className="mx-2">•</span>
                          <Users className="w-3 h-3 mr-1" />
                          {challenge.submissionsCount || 0} Submissions
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          challenge.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {challenge.status === 'open' ? 'Open' : 'Closed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-indigo-600 text-sm">
                        {formatCurrency(challenge.reward)}
                      </td>
                      <td className="px-6 py-4 text-right space-x-3 text-sm font-medium">
                         <button 
                            onClick={async () => {
                              await updateDoc(doc(db, 'challenges', challenge.id), {
                                status: challenge.status === 'open' ? 'closed' : 'open'
                              });
                            }}
                            className="text-slate-600 hover:text-slate-900"
                          >
                           {challenge.status === 'open' ? 'Close' : 'Reopen'}
                         </button>
                      </td>
                    </tr>
                  ))}
                  {challenges.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        No challenges created yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
