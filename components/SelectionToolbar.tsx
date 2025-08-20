import React, { useState } from 'react';
import { TranslationSet } from '../types';

const CopyIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const DeselectIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

interface SelectionToolbarProps {
  selectedCount: number;
  onCopy: () => void;
  onClear: () => void;
  t: TranslationSet;
}

const SelectionToolbar: React.FC<SelectionToolbarProps> = ({ selectedCount, onCopy, onClear, t }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-24 lg:pb-4 animate-fade-in-up" style={{ pointerEvents: 'none' }}>
      <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg shadow-2xl flex items-center space-x-4 p-2" style={{ pointerEvents: 'auto' }}>
        <span className="text-sm font-semibold text-slate-300 w-36 text-center">{t.versesSelected(selectedCount)}</span>
        <div className="flex items-center space-x-2">
          <button onClick={handleCopy} className="px-4 py-2 text-sm font-bold bg-amber-500 text-slate-900 rounded-md hover:bg-amber-400 transition-colors flex items-center space-x-2">
            <CopyIcon />
            <span>{copied ? t.copiedSelection : t.copySelection}</span>
          </button>
          <button onClick={onClear} className="p-2 bg-slate-600 text-slate-200 rounded-md hover:bg-slate-500 transition-colors" title={t.deselectAll}>
            <DeselectIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectionToolbar;
