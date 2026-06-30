import React from 'react';
import { X, Sparkles } from 'lucide-react';

interface AIHelpersModalProps {
  onClose: () => void;
  onSelectHelper: (helper: 'PlanDay' | 'BreakTask' | 'Prioritize' | 'Study' | 'RevisionPlan') => void;
}

export const AIHelpersModal: React.FC<AIHelpersModalProps> = ({ onClose, onSelectHelper }) => {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full card-base flex flex-col gap-3">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-text-dark flex items-center gap-2">
            <Sparkles className="text-purple-400" /> AI Helpers
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <button onClick={() => onSelectHelper('PlanDay')} className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold py-3 rounded-xl transition">Plan My Day</button>
        <button onClick={() => onSelectHelper('BreakTask')} className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-3 rounded-xl transition">Break Down Task</button>
        <button onClick={() => onSelectHelper('Prioritize')} className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold py-3 rounded-xl transition">Prioritize Tasks</button>
        <button onClick={() => onSelectHelper('Study')} className="w-full bg-pink-50 hover:bg-pink-100 text-pink-700 font-semibold py-3 rounded-xl transition">Study With Gayu</button>
        <button onClick={() => onSelectHelper('RevisionPlan')} className="w-full bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-semibold py-3 rounded-xl transition">Build Revision Plan</button>
      </div>
    </div>
  );
};
