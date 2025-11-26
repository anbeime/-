import React from 'react';
import { Settings, Sparkles, Copy, FileText, Image as ImageIcon, History as HistoryIcon, FileUp, Download } from 'lucide-react';
import { GenerationConfig } from '../types';

interface ToolbarProps {
  onFormat: () => void;
  onCopy: () => void;
  isGenerating: boolean;
  onImportDoc: (e: React.ChangeEvent<HTMLInputElement>) => void;
  config: GenerationConfig;
  setConfig: (config: GenerationConfig) => void;
  toggleHistory: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  onFormat, 
  onCopy, 
  isGenerating, 
  onImportDoc,
  config,
  setConfig,
  toggleHistory
}) => {
  return (
    <div className="h-16 border-b bg-white flex items-center justify-between px-6 shadow-sm z-20 sticky top-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-green-600 font-bold text-xl mr-4">
          <Sparkles className="w-6 h-6" />
          <span>WeChat AI Editor</span>
        </div>
        
        <div className="flex items-center gap-2 border-l pl-4">
            <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 rounded text-slate-600 text-sm font-medium transition-colors">
                <FileUp className="w-4 h-4" />
                <span>Import Doc/PDF</span>
                <input 
                    type="file" 
                    className="hidden" 
                    accept=".docx, .pdf"
                    onChange={onImportDoc}
                />
            </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Config Toggles */}
        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border mr-2">
            <select 
                value={config.tone}
                onChange={(e) => setConfig({...config, tone: e.target.value as any})}
                className="bg-transparent text-xs font-medium text-slate-600 px-2 py-1 outline-none cursor-pointer"
            >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="emotional">Emotional</option>
                <option value="witty">Witty</option>
            </select>
            <button 
                onClick={() => setConfig({...config, includeEmoji: !config.includeEmoji})}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${config.includeEmoji ? 'bg-green-100 text-green-700' : 'text-slate-400 hover:text-slate-600'}`}
            >
                Emojis
            </button>
        </div>

        <button 
            onClick={toggleHistory}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative"
            title="History"
        >
            <HistoryIcon className="w-5 h-5" />
        </button>

        <button
          onClick={onFormat}
          disabled={isGenerating}
          className={`
            flex items-center gap-2 px-5 py-2 rounded-full font-medium text-white shadow-lg shadow-green-200 transition-all
            ${isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 hover:shadow-xl hover:-translate-y-0.5'}
          `}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Magic Formatting...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>AI Format</span>
            </>
          )}
        </button>

        <button
          onClick={onCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
        >
          <Copy className="w-4 h-4" />
          <span>Copy HTML</span>
        </button>
      </div>
    </div>
  );
};