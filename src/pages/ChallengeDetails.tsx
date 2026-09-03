import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Challenge } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import { ArrowLeft, Clock, Target as TargetIcon, FileText, CheckCircle, AlertCircle, Link as LinkIcon, Upload } from 'lucide-react';

export function ChallengeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);

  // Submission Form State
  const [response, setResponse] = useState('');
  const [submittedLink, setSubmittedLink] = useState('');
  const [fileData, setFileData] = useState(''); // base64
  const [fileName, setFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChallenge = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'challenges', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setChallenge({ id: docSnap.id, ...docSnap.data() } as Challenge);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchChallenge();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('File is too large. Maximum size is 2MB.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFileData(event.target.result as string);
        setError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!challenge) return;
    
    if (!response.trim() && !submittedLink.trim() && !fileData) {
      setError('Please provide a written response, a link, or upload a file.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await addDoc(collection(db, 'submissions'), {
        challengeId: challenge.id,
        participantId: user.uid,
        participantName: user.name,
        challengeTitle: challenge.title,
        response,
        submittedLink,
        fileData,
        status: 'pending',
        submittedAt: new Date(),
      });

      // Increment submissions count safely
      await updateDoc(doc(db, 'challenges', challenge.id), {
        submissionsCount: increment(1)
      });

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit result.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-900">Challenge not found</h2>
        <button onClick={() => navigate('/')} className="text-indigo-600 hover:underline mt-4">Return to Challenges</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Challenges
      </button>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-8">
        <div className="border-b border-slate-200 bg-slate-50 px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
              challenge.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-800'
            }`}>
              {challenge.status === 'open' ? 'Currently Open' : 'Closed'}
            </span>
            <div className="flex flex-col md:items-end">
              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Reward</span>
              <span className="font-extrabold text-indigo-700 text-3xl">{formatCurrency(challenge.reward)}</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">{challenge.title}</h1>
          <div className="flex items-center text-sm text-slate-600 font-medium">
            <Clock className="w-4 h-4 mr-1.5 text-slate-400" />
            Deadline: {formatDate(challenge.deadline)}
          </div>
        </div>

        <div className="p-8 space-y-8">
          <section>
            <h3 className="text-lg font-bold text-slate-900 flex items-center mb-3">
              <TargetIcon className="w-5 h-5 mr-2 text-indigo-500" />
              The Task
            </h3>
            <div className="prose prose-slate max-w-none text-slate-700 bg-slate-50 p-6 rounded-xl border border-slate-100 whitespace-pre-wrap">
              {challenge.task}
            </div>
          </section>

          <div className="grid md:grid-cols-2 gap-8">
            <section>
              <h3 className="text-lg font-bold text-slate-900 flex items-center mb-3">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                Expected Result
              </h3>
              <p className="text-slate-700 bg-green-50 p-4 rounded-xl border border-green-100 whitespace-pre-wrap">
                {challenge.expectedResult}
              </p>
            </section>
            <section>
              <h3 className="text-lg font-bold text-slate-900 flex items-center mb-3">
                <FileText className="w-5 h-5 mr-2 text-amber-500" />
                Rules & Requirements
              </h3>
              <div className="text-slate-700 bg-amber-50 p-4 rounded-xl border border-amber-100 space-y-3">
                <div>
                  <strong className="block text-amber-900 text-sm mb-1">Rules:</strong>
                  <p className="whitespace-pre-wrap text-sm">{challenge.rules}</p>
                </div>
                <div>
                  <strong className="block text-amber-900 text-sm mb-1">Submission Requirements:</strong>
                  <p className="whitespace-pre-wrap text-sm">{challenge.submissionRequirements}</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Submission Form */}
      {challenge.status === 'open' && user?.role === 'participant' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Submit Your Result</h2>
          
          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-900 mb-2">Submission received — awaiting verification.</h3>
              <p className="text-green-700 mb-6">Your work has been submitted successfully. An administrator will review it shortly.</p>
              <button onClick={() => navigate('/dashboard')} className="bg-green-600 text-white font-medium px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                View in Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Written Response / Explanation
                </label>
                <textarea
                  rows={4}
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  placeholder="Explain your approach or provide the text result here..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  External Link (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LinkIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="url"
                    value={submittedLink}
                    onChange={(e) => setSubmittedLink(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Upload Document/Image (Optional)
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-slate-400" />
                      <p className="mb-2 text-sm text-slate-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-slate-500">PDF, PNG, JPG (MAX. 2MB)</p>
                    </div>
                    <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
                  </label>
                </div>
                {fileName && <p className="mt-2 text-sm text-indigo-600 font-medium">Selected file: {fileName}</p>}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Result'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {!user && challenge.status === 'open' && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-8 text-center">
          <h3 className="text-lg font-bold text-indigo-900 mb-2">Log in to participate</h3>
          <p className="text-indigo-700 mb-6">You need an account to submit your result and earn the reward.</p>
          <div className="flex justify-center gap-4">
            <button onClick={() => navigate('/login')} className="bg-white text-indigo-600 font-medium px-6 py-2 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors">Log in</button>
            <button onClick={() => navigate('/register')} className="bg-indigo-600 text-white font-medium px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors">Sign up</button>
          </div>
        </div>
      )}
    </div>
  );
}
