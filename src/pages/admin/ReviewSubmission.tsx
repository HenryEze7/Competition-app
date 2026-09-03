import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, addDoc, collection, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Submission, Challenge } from '../../types';
import { formatDate, formatCurrency } from '../../lib/utils';
import { ArrowLeft, CheckCircle, XCircle, User, Calendar, Target, FileText, Link as LinkIcon, Download } from 'lucide-react';

export function ReviewSubmission() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      try {
        const subDoc = await getDoc(doc(db, 'submissions', id));
        if (!subDoc.exists()) throw new Error('Submission not found');
        
        const subData = { id: subDoc.id, ...subDoc.data() } as Submission;
        setSubmission(subData);

        const chalDoc = await getDoc(doc(db, 'challenges', subData.challengeId));
        if (chalDoc.exists()) {
          setChallenge({ id: chalDoc.id, ...chalDoc.data() } as Challenge);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const handleApprove = async () => {
    if (!submission || !challenge) return;
    setProcessing(true);
    
    try {
      // 1. Update Submission status
      await updateDoc(doc(db, 'submissions', submission.id), {
        status: 'approved',
        verifiedAt: new Date()
      });

      // 2. Update Participant Balance
      await updateDoc(doc(db, 'users', submission.participantId), {
        balance: increment(challenge.reward),
        totalEarned: increment(challenge.reward)
      });

      // 3. Create Transaction Record
      await addDoc(collection(db, 'transactions'), {
        participantId: submission.participantId,
        amount: challenge.reward,
        type: 'reward',
        challengeId: challenge.id,
        challengeTitle: challenge.title,
        description: `Completed "${challenge.title}" challenge`,
        createdAt: new Date()
      });

      navigate('/admin');
    } catch (err) {
      console.error(err);
      alert('Failed to approve submission');
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!submission || !rejectionReason.trim()) return;
    setProcessing(true);
    
    try {
      await updateDoc(doc(db, 'submissions', submission.id), {
        status: 'rejected',
        adminFeedback: rejectionReason,
        verifiedAt: new Date()
      });
      navigate('/admin');
    } catch (err) {
      console.error(err);
      alert('Failed to reject submission');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!submission || !challenge) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-900">Not found</h2>
        <Link to="/admin" className="text-indigo-600 hover:underline mt-4 inline-block">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <Link 
        to="/admin"
        className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </Link>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Review Submission</h1>
            
            <div className="space-y-8">
              <section>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Participant Response</h3>
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 whitespace-pre-wrap text-slate-700">
                  {submission.response || <span className="text-slate-400 italic">No written response provided.</span>}
                </div>
              </section>

              {submission.submittedLink && (
                <section>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">External Link</h3>
                  <a 
                    href={submission.submittedLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    {submission.submittedLink}
                  </a>
                </section>
              )}

              {submission.fileData && (
                <section>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Attached File</h3>
                  {submission.fileData.startsWith('data:image/') ? (
                    <img src={submission.fileData} alt="Submission Attachment" className="max-w-full rounded-lg border border-slate-200" />
                  ) : (
                    <a 
                      href={submission.fileData} 
                      download={`submission-${submission.id}`}
                      className="inline-flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Attached File
                    </a>
                  )}
                </section>
              )}
            </div>
          </div>
          
          {/* Admin Actions */}
          {submission.status === 'pending' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Verification Decision</h2>
              
              {!showRejectForm ? (
                <div className="flex gap-4">
                  <button
                    onClick={handleApprove}
                    disabled={processing}
                    className="flex-1 flex justify-center items-center bg-green-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Approve & Reward
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    disabled={processing}
                    className="flex-1 flex justify-center items-center bg-red-50 text-red-700 font-bold py-3 px-4 rounded-xl border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Reject
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Reason for Rejection</label>
                    <textarea
                      required
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                      placeholder="Explain why this submission does not meet the requirements..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleReject}
                      disabled={processing || !rejectionReason.trim()}
                      className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => setShowRejectForm(false)}
                      disabled={processing}
                      className="px-4 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Submission Details</h3>
            <ul className="space-y-4">
              <li>
                <div className="flex items-center text-slate-500 text-sm mb-1"><User className="w-4 h-4 mr-1.5" /> Participant</div>
                <div className="font-medium text-slate-900">{submission.participantName}</div>
              </li>
              <li>
                <div className="flex items-center text-slate-500 text-sm mb-1"><Calendar className="w-4 h-4 mr-1.5" /> Submitted At</div>
                <div className="font-medium text-slate-900">{formatDate(submission.submittedAt)}</div>
              </li>
              <li>
                <div className="flex items-center text-slate-500 text-sm mb-1"><Target className="w-4 h-4 mr-1.5" /> Challenge Status</div>
                <div className="font-medium text-slate-900">{challenge.status.toUpperCase()}</div>
              </li>
            </ul>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-4 border-b border-indigo-200 pb-2">Expected Result</h3>
            <div className="text-indigo-800 text-sm whitespace-pre-wrap">
              {challenge.expectedResult}
            </div>
            <div className="mt-4 pt-4 border-t border-indigo-200">
              <div className="text-xs text-indigo-600 font-bold uppercase mb-1">Reward to Award</div>
              <div className="text-2xl font-extrabold text-indigo-700">{formatCurrency(challenge.reward)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
