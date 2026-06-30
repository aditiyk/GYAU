import React, { useState } from 'react';
import { X, BookOpen } from 'lucide-react';

interface RevisionPlanModalProps {
  onClose: () => void;
  onSubmit: (data: { examDate: string; subjects: string; dailyHours: string }) => void;
  isLoading: boolean;
}

export const RevisionPlanModal: React.FC<RevisionPlanModalProps> = ({ onClose, onSubmit, isLoading }) => {
  const [examDate, setExamDate] = useState('');
  const [subjects, setSubjects] = useState('');
  const [dailyHours, setDailyHours] = useState('3');

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full card-base flex flex-col gap-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-text-dark flex items-center gap-2">
            <BookOpen className="text-yellow-400" /> Build Revision Plan
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <p className="text-sm text-gray-500 mb-2">Gayu will generate a spaced-repetition study schedule leading up to your exam.</p>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-text-dark">Exam Date</label>
          <input 
            type="date" 
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-yellow-300 transition-colors"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-text-dark">Subjects/Topics</label>
          <textarea 
            placeholder="e.g. Calculus (Integrals), Physics (Kinematics)"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-yellow-300 transition-colors h-20 resize-none"
            value={subjects}
            onChange={(e) => setSubjects(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-text-dark">Daily Study Hours</label>
          <input 
            type="number" 
            min="1" max="12"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-yellow-300 transition-colors"
            value={dailyHours}
            onChange={(e) => setDailyHours(e.target.value)}
          />
        </div>

        <button 
          onClick={() => onSubmit({ examDate, subjects, dailyHours })}
          disabled={isLoading || !examDate || !subjects}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 rounded-xl transition mt-2 disabled:opacity-50"
        >
          {isLoading ? 'Building Plan...' : 'Build Revision Plan'}
        </button>
      </div>
    </div>
  );
};
