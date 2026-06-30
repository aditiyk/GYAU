import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';

interface PlanDayModalProps {
  onClose: () => void;
  onSubmit: (data: { priorities: string; availableHours: string; deadlines: string }) => void;
  isLoading: boolean;
}

export const PlanDayModal: React.FC<PlanDayModalProps> = ({ onClose, onSubmit, isLoading }) => {
  const [priorities, setPriorities] = useState('');
  const [availableHours, setAvailableHours] = useState('8');
  const [deadlines, setDeadlines] = useState('');

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full card-base flex flex-col gap-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-text-dark flex items-center gap-2">
            <Calendar className="text-purple-400" /> Plan My Day
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <p className="text-sm text-gray-500 mb-2">Gayu will look at your tasks and calendar to build the perfect schedule.</p>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-text-dark">Top Priorities for Today</label>
          <input 
            type="text" 
            placeholder="e.g. Finish math homework, study for bio"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-300 transition-colors"
            value={priorities}
            onChange={(e) => setPriorities(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-text-dark">Available Study Hours</label>
          <input 
            type="number" 
            min="1" max="24"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-300 transition-colors"
            value={availableHours}
            onChange={(e) => setAvailableHours(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-text-dark">Urgent Deadlines</label>
          <input 
            type="text" 
            placeholder="e.g. Assignment due at 5 PM"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-300 transition-colors"
            value={deadlines}
            onChange={(e) => setDeadlines(e.target.value)}
          />
        </div>

        <button 
          onClick={() => onSubmit({ priorities, availableHours, deadlines })}
          disabled={isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition mt-2 disabled:opacity-50"
        >
          {isLoading ? 'Planning...' : 'Let Gayu Plan'}
        </button>
      </div>
    </div>
  );
};
