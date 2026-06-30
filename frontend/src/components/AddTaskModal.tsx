import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface AddTaskModalProps {
  onClose: () => void;
  onSubmit: (title: string, deadline: string, duration: number, importance: number) => void;
  initialTitle?: string;
  isLoading?: boolean;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ onClose, onSubmit, initialTitle = "", isLoading = false }) => {
  const [title, setTitle] = useState(initialTitle);
  const [deadline, setDeadline] = useState("");
  const [duration, setDuration] = useState<number>(1);
  const [importance, setImportance] = useState<number>(3);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit(title, deadline, duration, importance);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full card-base flex flex-col gap-5 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-text-dark flex items-center gap-2">
            Add Advanced Task
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <p className="text-sm text-gray-500 -mt-3">Provide details so Gayu can automatically schedule this task in your free time.</p>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-dark">Task Title</label>
          <input 
            type="text" 
            placeholder="What needs to be done?"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-300 transition-colors"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-dark">Deadline (Optional)</label>
          <input 
            type="datetime-local" 
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-300 transition-colors text-sm"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-dark">Estimated Duration (Hours)</label>
          <div className="flex items-center gap-4">
            <input 
              type="range" 
              min="0.5" max="10" step="0.5"
              className="w-full accent-emerald-500"
              value={duration}
              onChange={(e) => setDuration(parseFloat(e.target.value))}
            />
            <span className="text-sm font-semibold text-emerald-600 w-12">{duration} h</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-dark">Importance (1 = Low, 5 = High)</label>
          <div className="flex items-center gap-4">
            <input 
              type="range" 
              min="1" max="5" step="1"
              className="w-full accent-emerald-500"
              value={importance}
              onChange={(e) => setImportance(parseInt(e.target.value))}
            />
            <span className="text-sm font-semibold text-emerald-600 w-8">{importance}</span>
          </div>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={isLoading || !title.trim()}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition flex justify-center items-center gap-2 disabled:opacity-50 mt-2 shadow-sm"
        >
          {isLoading ? 'Adding...' : <><Check size={18} /> Add & Schedule Task</>}
        </button>
      </div>
    </div>
  );
};
