import React from 'react';
import { TranslationSet } from '../types';

type Mode = 'study' | 'sermon';
type ActivePanel = 'chat' | 'selector' | 'reader' | null;

interface ModeSwitcherProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  activePanel: ActivePanel;
  setActivePanel: (panel: ActivePanel) => void;
  onScrollToggle: () => void;
  t: TranslationSet;
}

// Icons
const StudyIcon = ({ className = "w-6 h-6" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v15H6.5A2.5 2.5 0 0 1 4 14.5V4.5A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const SermonIcon = ({ className = "w-6 h-6" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;

const ChatIcon = ({ className = "w-5 h-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const SelectorIcon = ({ className = "w-5 h-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>;
const ScrollToggleIcon = ({ className = "w-5 h-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m-4-4l4 4 4-4M8 8l4-4 4 4" /></svg>;


const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ mode, setMode, activePanel, setActivePanel, onScrollToggle, t }) => {
  
  const getPanelButtonClass = (panel: 'chat' | 'selector' | 'reader') => {
    return `p-2 rounded-full transition-colors duration-200 ${
      activePanel === panel
        ? 'bg-sky-500 text-white shadow-lg'
        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
    }`;
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/80 backdrop-blur-sm border-t border-slate-700/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        {mode === 'sermon' && (
          <div className="flex items-center space-x-4 py-2 animate-fade-in-up">
            <button onClick={() => setActivePanel(activePanel === 'chat' ? null : 'chat')} className={getPanelButtonClass('chat')} aria-label="Show Chat Panel"><ChatIcon /></button>
            <button onClick={() => setActivePanel(activePanel === 'selector' ? null : 'selector')} className={getPanelButtonClass('selector')} aria-label="Show Passage Selector"><SelectorIcon /></button>
            <button onClick={() => setActivePanel(activePanel === 'reader' ? null : 'reader')} className={getPanelButtonClass('reader')} aria-label="Show Bible Reader"><StudyIcon className="w-5 h-5"/></button>
            <div className="w-px h-6 bg-slate-600"></div>
            <button onClick={onScrollToggle} className="p-2 rounded-full transition-colors duration-200 bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!activePanel} aria-label="Scroll to panel"><ScrollToggleIcon /></button>
          </div>
        )}
        <div className="flex items-center justify-center w-full max-w-xs p-1 bg-slate-800 rounded-full my-2 shadow-inner">
          <button
            onClick={() => setMode('study')}
            className={`w-1/2 flex items-center justify-center space-x-2 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${
              mode === 'study' ? 'bg-amber-500 text-slate-900 shadow-md' : 'text-slate-300'
            }`}
          >
            <StudyIcon />
            <span>{t.study}</span>
          </button>
          <button
            onClick={() => setMode('sermon')}
            className={`w-1/2 flex items-center justify-center space-x-2 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${
              mode === 'sermon' ? 'bg-amber-500 text-slate-900 shadow-md' : 'text-slate-300'
            }`}
          >
            <SermonIcon />
            <span>{t.sermon}</span>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default ModeSwitcher;