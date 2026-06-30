import React, { useState } from 'react';
import { X, Layers } from 'lucide-react';

interface Subtask {
  title: string;
  estimated_hours: number;
}

interface BreakTaskModalProps {
  onClose: () => void;
  onSubmit: (taskDescription: string) => void;
  onAcceptSubtasks: (subtasks: Subtask[]) => void;
  isLoading: boolean;
  generatedSubtasks: Subtask[] | null;
}

export const BreakTaskModal: React.FC<BreakTaskModalProps> = ({ onClose, onSubmit, onAcceptSubtasks, isLoading, generatedSubtasks }) => {
  const [description, setDescription] = useState('');

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full card-base flex flex-col gap-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-text-dark flex items-center gap-2">
            <Layers className="text-blue-400" /> Break Down Task
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        {!generatedSubtasks ? (
          <>
            <p className="text-sm text-gray-500 mb-2">Describe a complex task and Gayu will break it into manageable steps.</p>
            <textarea 
              placeholder="e.g. Prepare marketing presentation for Monday"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-300 transition-colors h-24 resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button 
              onClick={() => onSubmit(description)}
              disabled={isLoading || description.trim().length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition mt-2 disabled:opacity-50"
            >
              {isLoading ? 'Breaking down...' : 'Break it down'}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-text-dark mb-2">Generated Subtasks</p>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar">
              {generatedSubtasks.map((sub, idx) => (
                <div key={idx} className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex justify-between items-center text-sm">
                  <span className="font-medium text-text-dark">{sub.title}</span>
                  <span className="text-blue-600 font-semibold">{sub.estimated_hours}h</span>
                </div>
              ))}
            </div>
            <button 
              onClick={() => onAcceptSubtasks(generatedSubtasks)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition mt-2"
            >
              Add to My Tasks
            </button>
          </>
        )}
      </div>
    </div>
  );
};
