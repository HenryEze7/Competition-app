import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { X, Image as ImageIcon, UserCircle, Upload } from 'lucide-react';
import { compressImage } from '../lib/imageUtils';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user } = useAuth();
  
  const [username, setUsername] = useState(user?.username || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file, 400, 400, 0.8);
      setPhotoURL(base64);
    } catch (err) {
      console.error("Failed to process image", err);
      setError("Failed to process image. Please try a different one.");
    }
  };
  const [error, setError] = useState('');

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        username: username.trim(),
        photoURL: photoURL.trim()
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Edit Profile</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                <UserCircle className="w-4 h-4 text-slate-400" />
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. CodeNinja99"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-slate-400" />
                Profile Picture URL or Upload
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                />
                <label className="cursor-pointer bg-slate-100 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center font-medium text-sm whitespace-nowrap">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              {photoURL && (
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-sm text-slate-500">Preview:</span>
                  <img src={photoURL} alt="Preview" className="w-10 h-10 rounded-full object-cover border border-slate-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
