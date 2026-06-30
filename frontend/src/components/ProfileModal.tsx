import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { X, LogOut, Trash2, Calendar, Mail, FileText, Music } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProfileModalProps {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const { user, isGuest, logout, token } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  // If user is missing entirely (shouldn't happen, but just in case)
  if (!user) return null;

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch('http://localhost:8000/auth/account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        toast.success("Account deleted successfully.");
        logout();
      } else {
        toast.error("Failed to delete account.");
      }
    } catch (e) {
      toast.error("An error occurred.");
    }
  };

  const getAccountType = () => {
    if (isGuest) return "Guest User";
    if (user.provider === 'google') return "Google Account";
    return "Local Account";
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="min-h-screen px-4 text-center">
        {/* Trick to center vertically on large screens, though we'll rely mostly on margins */}
        <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
        
        {/* Modal Panel */}
        <div 
          className="inline-block w-full max-w-sm p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white relative animate-in fade-in zoom-in duration-200 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 rounded-full p-1 hover:bg-gray-200 z-20">
            <X size={20} />
          </button>

        <h2 className="text-xl font-bold text-gray-900 mb-5 pr-8">Your Profile</h2>

        {/* User Info Header */}
        <div className="flex items-center gap-3 mb-6 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold uppercase shadow-sm">
            {isGuest ? 'G' : user.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{user.name}</h3>
            <p className="text-gray-500 text-sm">{user.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
              {getAccountType()}
            </span>
          </div>
        </div>

        {/* Section A: Account */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Login Methods</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <span className="font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 text-sm">G</span>
                Google
              </span>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${user.provider === 'google' && !isGuest ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-gray-100 text-gray-500'}`}>
                {user.provider === 'google' && !isGuest ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <span className="font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 text-sm">@</span>
                Email & Password
              </span>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${user.provider === 'local' && !isGuest ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-gray-100 text-gray-500'}`}>
                {user.provider === 'local' && !isGuest ? 'Connected' : 'Not Connected'}
              </span>
            </div>
          </div>
        </div>

        {/* Section B: Integrations */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Integrations</h4>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Calendar', icon: <Calendar size={18} />, color: 'text-blue-500', bg: 'bg-blue-50' },
              { name: 'Gmail', icon: <Mail size={18} />, color: 'text-red-500', bg: 'bg-red-50' },
              { name: 'Notion', icon: <FileText size={18} />, color: 'text-gray-700', bg: 'bg-gray-100' },
              { name: 'Spotify', icon: <Music size={18} />, color: 'text-green-500', bg: 'bg-green-50' }
            ].map((app) => (
              <div key={app.name} className="p-3 rounded-xl bg-white border border-gray-100 shadow-sm flex flex-col items-center gap-1.5 text-center">
                <div className={`w-8 h-8 rounded-full ${app.bg} ${app.color} flex items-center justify-center`}>
                  {app.icon}
                </div>
                <span className="font-semibold text-xs text-gray-700">{app.name}</span>
                <span className="text-[9px] uppercase font-bold text-gray-400">Not Connected</span>
                <button className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors px-2 py-1 bg-emerald-50 rounded-lg mt-1 w-full">Connect</button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-100 pt-5">
          {isGuest ? (
            <div className="text-center">
              <p className="text-sm font-medium text-amber-600 bg-amber-50 p-3 rounded-xl mb-4 border border-amber-100">
                You're using guest mode. Log in to save your data permanently.
              </p>
              <div className="flex gap-3">
                <button onClick={() => navigate('/login')} className="flex-1 bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
                  Login
                </button>
                <button onClick={() => navigate('/signup')} className="flex-1 bg-white text-emerald-600 border border-emerald-200 font-semibold py-3 rounded-xl hover:bg-emerald-50 transition-colors">
                  Sign Up
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button onClick={logout} className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors">
                <LogOut size={18} /> Logout
              </button>
              
              {isDeleting ? (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                  <p className="text-sm font-semibold text-red-800 mb-3 text-center">
                    Are you sure? This will permanently delete your account and saved data.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setIsDeleting(false)} className="flex-1 bg-white text-gray-600 border border-gray-200 font-semibold py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                      Cancel
                    </button>
                    <button onClick={handleDeleteAccount} className="flex-1 bg-red-600 text-white font-semibold py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm text-sm">
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setIsDeleting(true)} className="w-full flex items-center justify-center gap-2 bg-white text-red-500 font-semibold py-3 rounded-xl border border-red-100 hover:bg-red-50 hover:border-red-200 transition-all">
                  <Trash2 size={18} /> Delete Account
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>,
    document.body
  );
}
