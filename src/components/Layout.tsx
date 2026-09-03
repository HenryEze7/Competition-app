import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Target, LayoutDashboard, History, LogOut, FileText, CheckCircle, Wallet, MessageSquare, Tv, Video, PlaySquare } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { ChatWidget } from './ChatWidget';
import { DirectMessageModal } from './DirectMessageModal';

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isDmOpen, setIsDmOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="flex items-center gap-2 text-indigo-600 font-bold text-xl tracking-tight">
                  <Target className="w-6 h-6" />
                  Bounty
                </Link>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                {user?.role === 'admin' ? (
                  <>
                    <Link
                      to="/admin"
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive('/admin')
                          ? 'border-indigo-500 text-slate-900'
                          : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/"
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive('/')
                          ? 'border-indigo-500 text-slate-900'
                          : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                      }`}
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Challenges
                    </Link>
                    <Link
                      to="/channels"
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive('/channels')
                          ? 'border-indigo-500 text-slate-900'
                          : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                      }`}
                    >
                      <Tv className="w-4 h-4 mr-2" />
                      Channels
                    </Link>
                    <Link
                      to="/reels"
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive('/reels') || location.pathname.startsWith('/reels/')
                          ? 'border-indigo-500 text-slate-900'
                          : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                      }`}
                    >
                      <PlaySquare className="w-4 h-4 mr-2" />
                      Reels
                    </Link>
                    {user && (
                      <>
                        <Link
                          to="/dashboard"
                          className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                            isActive('/dashboard')
                              ? 'border-indigo-500 text-slate-900'
                              : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                          }`}
                        >
                          <LayoutDashboard className="w-4 h-4 mr-2" />
                          Dashboard
                        </Link>
                        <Link
                          to="/my-channel"
                          className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                            isActive('/my-channel')
                              ? 'border-indigo-500 text-slate-900'
                              : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                          }`}
                        >
                          <Video className="w-4 h-4 mr-2" />
                          My Channel
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center">
              {user ? (
                <div className="flex items-center gap-4">
                  {user.role === 'participant' && (
                    <div className="hidden md:flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-semibold">
                      <Wallet className="w-4 h-4" />
                      {formatCurrency(user.balance)}
                    </div>
                  )}
                  <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                    <button
                      onClick={() => setIsDmOpen(true)}
                      className="text-slate-500 hover:text-indigo-600 p-1 transition-colors"
                      title="Direct Messages"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-slate-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : null}
                      <div className="text-sm font-medium text-slate-700 hidden sm:block">
                        {user.username || user.name}
                      </div>
                    </div>
                    <button
                      onClick={logout}
                      className="text-slate-500 hover:text-slate-700 p-1"
                      title="Log out"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Link to="/login" className="text-sm font-medium text-slate-500 hover:text-slate-900">
                    Log in
                  </Link>
                  <Link to="/register" className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile nav indicator - only visible on small screens */}
      {user && (
        <div className="sm:hidden bg-white border-b border-slate-200 px-4 py-3 flex overflow-x-auto gap-4">
          {user.role === 'admin' ? (
             <Link
                to="/admin"
                className={`text-sm font-medium whitespace-nowrap ${isActive('/admin') ? 'text-indigo-600' : 'text-slate-600'}`}
             >
                Dashboard
             </Link>
          ) : (
             <>
               <Link
                  to="/"
                  className={`text-sm font-medium whitespace-nowrap ${isActive('/') ? 'text-indigo-600' : 'text-slate-600'}`}
               >
                  Challenges
               </Link>
               <Link
                  to="/channels"
                  className={`text-sm font-medium whitespace-nowrap ${isActive('/channels') ? 'text-indigo-600' : 'text-slate-600'}`}
               >
                  Channels
               </Link>
               <Link
                  to="/reels"
                  className={`text-sm font-medium whitespace-nowrap ${isActive('/reels') || location.pathname.startsWith('/reels/') ? 'text-indigo-600' : 'text-slate-600'}`}
               >
                  Reels
               </Link>
               <Link
                  to="/my-channel"
                  className={`text-sm font-medium whitespace-nowrap ${isActive('/my-channel') ? 'text-indigo-600' : 'text-slate-600'}`}
               >
                  My Channel
               </Link>
               <Link
                  to="/dashboard"
                  className={`text-sm font-medium whitespace-nowrap ${isActive('/dashboard') ? 'text-indigo-600' : 'text-slate-600'}`}
               >
                  Dashboard
               </Link>
               <div className="ml-auto text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                 <Wallet className="w-3 h-3" />
                 {formatCurrency(user.balance)}
               </div>
             </>
          )}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <ChatWidget />
      <DirectMessageModal isOpen={isDmOpen} onClose={() => setIsDmOpen(false)} />
    </div>
  );
}
