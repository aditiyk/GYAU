import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ProfileModal from './ProfileModal';

export default function ProfileMenu() {
  const { user, isGuest } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="relative w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold uppercase shadow-sm border-2 border-transparent hover:border-emerald-200 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ml-2 hover:shadow-[0_0_15px_rgba(52,211,153,0.4)]"
      >
        {isGuest ? 'G' : user.name.charAt(0)}
      </button>

      {isModalOpen && (
        <ProfileModal onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}
