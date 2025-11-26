import React from 'react';
import { HistoryItem } from '../types';
import { Clock, Trash2, FileText, X } from 'lucide-react';

interface HistorySidebarProps {
  history: HistoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ 
  history, 
  isOpen, 
  onClose, 
  onSelect,
  onDelete
}) => {
  return (
    <div 
      className={`fixed inset-y-0 left-0 bg-white w-80 shadow-2xl transform transition-transform duration-300 z-50 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="p-4 border-b flex items-center justify-between bg-slate-50">
        <h2 className="font-bold text-slate-700 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            History
        </h2>
        <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded text-slate-500">
            <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {history.length === 0 ? (
            <div className="text-center text-slate-400 mt-10 p-4">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>No history yet.</p>
            </div>
        ) : (
            history.map((item) => (
                <div 
                    key={item.id}
                    onClick={() => onSelect(item)}
                    className="group relative p-3 rounded-lg border border-transparent hover:border-green-100 hover:bg-green-50 cursor-pointer transition-all"
                >
                    <h3 className="font-medium text-slate-800 text-sm truncate pr-6">
                        {item.title || "Untitled Draft"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                        {new Date(item.timestamp).toLocaleString()}
                    </p>
                    <button 
                        onClick={(e) => onDelete(item.id, e)}
                        className="absolute right-2 top-3 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))
        )}
      </div>
    </div>
  );
};