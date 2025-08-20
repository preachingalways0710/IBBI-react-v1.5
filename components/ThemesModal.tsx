

import React from 'react';
import { CommonThemeItem, TranslationSet } from '../types';
import Spinner from './Spinner';

interface ThemesModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  themes: CommonThemeItem[] | null;
  loading: boolean;
  onTranslate: () => void;
  t: TranslationSet;
}

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ThemesModal: React.FC<ThemesModalProps> = ({ isOpen, onClose, title, themes, loading, onTranslate, t }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col border border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-xl font-semibold text-amber-400 font-serif">{title}</h2>
          <div className="flex items-center space-x-2">
            {!loading && themes && (
              <button 
                onClick={onTranslate}
                className="text-sm font-semibold px-3 py-1 rounded-md transition-colors text-sky-400 hover:text-sky-300 bg-slate-700/50 hover:bg-slate-700"
                disabled={loading}
              >
                {t.translateThemes}
              </button>
            )}
            <button 
              onClick={onClose} 
              className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
              aria-label="Close"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
        </header>
        <div className="p-6 overflow-y-auto">
          {loading && (
            <div className="flex justify-center items-center py-12">
              <Spinner />
            </div>
          )}
          {!loading && themes && (
            <ul className="space-y-4">
              {themes.map((item, index) => (
                <li key={index} className="pb-4 border-b border-slate-700 last:border-b-0">
                  <h3 className="text-lg font-bold text-sky-300">{item.theme}</h3>
                  <p className="text-sm text-slate-400 mt-1 font-sans">
                    Key Verses: <span className="font-semibold text-amber-400">{item.verses}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
           {!loading && !themes && (
             <p className="text-slate-400 text-center py-12">Could not load themes.</p>
           )}
        </div>
      </div>
    </div>
  );
};

export default ThemesModal;
