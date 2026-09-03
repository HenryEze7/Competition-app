import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Target, AlertCircle } from 'lucide-react';

export function CreateChallenge() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task: '',
    expectedResult: '',
    reward: '',
    deadline: '',
    rules: '',
    submissionRequirements: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user) throw new Error('Not authenticated');

      const deadlineDate = new Date(formData.deadline);
      if (isNaN(deadlineDate.getTime())) throw new Error('Invalid deadline date');

      const rewardNum = parseFloat(formData.reward);
      if (isNaN(rewardNum) || rewardNum <= 0) throw new Error('Invalid reward amount');

      await addDoc(collection(db, 'challenges'), {
        title: formData.title,
        description: formData.description,
        task: formData.task,
        expectedResult: formData.expectedResult,
        reward: rewardNum,
        deadline: deadlineDate,
        rules: formData.rules,
        submissionRequirements: formData.submissionRequirements,
        status: 'open',
        submissionsCount: 0,
        createdAt: new Date(),
        createdBy: user.uid
      });

      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Failed to create challenge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <Link 
        to="/admin"
        className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </Link>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <Target className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create New Challenge</h1>
            <p className="text-slate-500 text-sm">Post a new task for participants to complete.</p>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basics */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900">Basic Information</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
                <input
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="e.g. Find 5 verified scholarships"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Short Description</label>
                <textarea
                  name="description"
                  required
                  rows={2}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Briefly describe what this challenge is about..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Reward Amount (₦)</label>
                <input
                  name="reward"
                  type="number"
                  required
                  min="0"
                  step="100"
                  value={formData.reward}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="2000"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Deadline</label>
                <input
                  name="deadline"
                  type="datetime-local"
                  required
                  value={formData.deadline}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Details */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900">Task Details</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Full Problem / Task Description</label>
                <textarea
                  name="task"
                  required
                  rows={4}
                  value={formData.task}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Describe the exact problem to solve..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Clearly Defined Expected Result</label>
                <textarea
                  name="expectedResult"
                  required
                  rows={3}
                  value={formData.expectedResult}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="What exactly constitutes a successful submission?"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Rules</label>
                <textarea
                  name="rules"
                  required
                  rows={3}
                  value={formData.rules}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Any constraints or rules to follow?"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Submission Requirements</label>
                <textarea
                  name="submissionRequirements"
                  required
                  rows={2}
                  value={formData.submissionRequirements}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="e.g. Must include a PDF, must include links, etc."
                />
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Publish Challenge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
