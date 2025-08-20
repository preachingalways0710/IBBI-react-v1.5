import React from 'react';
import { BibleVersion, Language } from '../types';
import { BIBLE_BOOKS } from '../constants';
import { TranslationSet } from '../types';

interface BibleSelectorProps {
  version: BibleVersion;
  setVersion: (version: BibleVersion) => void;
  book: string;
  setBook: (book: string) => void;
  chapter: number;
  setChapter: (chapter: number) => void;
  t: TranslationSet;
  language: Language;
  isPulsing: boolean;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  isFloating?: boolean;
}

const MinimizeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  );
  
const MaximizeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

const BibleSelector: React.FC<BibleSelectorProps> = ({ version, setVersion, book, setBook, chapter, setChapter, t, language, isPulsing, isMinimized, onToggleMinimize, isFloating = false }) => {
  const selectedBookData = BIBLE_BOOKS.find(b => b.name === book) || BIBLE_BOOKS[0];
  const chapters = Array.from({ length: selectedBookData.chapters }, (_, i) => i + 1);

  const selectStyles = "w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-white";

  if (isFloating) {
    return (
        <div className="bg-slate-800 p-4">
            <div className="grid grid-cols-1 gap-y-4">
                <div>
                    <label htmlFor="version-floating" className="block text-sm font-medium text-slate-400 mb-1">{t.version}</label>
                    <select id="version-floating" value={version} onChange={(e) => setVersion(e.target.value as BibleVersion)} className={selectStyles}>
                        <option value={BibleVersion.KJV}>{t.kjv1769}</option>
                        <option value={BibleVersion.ACF2011}>{t.acf2011}</option>
                        <option value={BibleVersion.ACF2007}>{t.acf2007}</option>
                    </select>
                </div>
                <div className="flex gap-4">
                    <div className="w-2/3">
                        <label htmlFor="book-floating" className="block text-sm font-medium text-slate-400 mb-1">{t.book}</label>
                        <select id="book-floating" value={book} onChange={(e) => setBook(e.target.value)} className={selectStyles}>
                            {BIBLE_BOOKS.map((b) => (
                            <option key={b.name} value={b.name}>
                                {language === 'pt' ? b.pt_name : b.name}
                            </option>
                            ))}
                        </select>
                    </div>
                    <div className="w-1/3">
                        <label htmlFor="chapter-floating" className="block text-sm font-medium text-slate-400 mb-1">{t.chapter}</label>
                        <select id="chapter-floating" value={chapter} onChange={(e) => setChapter(Number(e.target.value))} className={selectStyles}>
                            {chapters.map((c) => (
                            <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className={`bg-slate-800 rounded-lg shadow-md overflow-hidden transition-all duration-500 ease-in-out ${isPulsing ? 'animate-pulse-border' : ''} ${isMinimized ? 'max-h-16' : 'max-h-80'}`}>
        <div 
          className={`flex items-center justify-between p-4 ${isMinimized ? 'cursor-pointer h-full' : 'border-b border-slate-700'}`}
          onClick={isMinimized ? onToggleMinimize : undefined}
          style={{ minHeight: '64px' }}
        >
          <h2 className="text-2xl font-semibold text-amber-400 font-serif">{t.passageSelection}</h2>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleMinimize(); }} 
            className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            aria-label={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? <MaximizeIcon className="w-5 h-5" /> : <MinimizeIcon className="w-5 h-5" />}
          </button>
        </div>
      
        {!isMinimized && (
          <div className="p-4 pt-2">
              <div className="grid grid-cols-1 gap-y-4">
                  <div>
                      <label htmlFor="version" className="block text-sm font-medium text-slate-400 mb-1">{t.version}</label>
                      <select id="version" value={version} onChange={(e) => setVersion(e.target.value as BibleVersion)} className={selectStyles}>
                          <option value={BibleVersion.KJV}>{t.kjv1769}</option>
                          <option value={BibleVersion.ACF2011}>{t.acf2011}</option>
                          <option value={BibleVersion.ACF2007}>{t.acf2007}</option>
                      </select>
                  </div>
                  <div className="flex gap-4">
                      <div className="w-2/3">
                          <label htmlFor="book" className="block text-sm font-medium text-slate-400 mb-1">{t.book}</label>
                          <select id="book" value={book} onChange={(e) => setBook(e.target.value)} className={selectStyles}>
                              {BIBLE_BOOKS.map((b) => (
                              <option key={b.name} value={b.name}>
                                  {language === 'pt' ? b.pt_name : b.name}
                              </option>
                              ))}
                          </select>
                      </div>
                      <div className="w-1/3">
                          <label htmlFor="chapter" className="block text-sm font-medium text-slate-400 mb-1">{t.chapter}</label>
                          <select id="chapter" value={chapter} onChange={(e) => setChapter(Number(e.target.value))} className={selectStyles}>
                              {chapters.map((c) => (
                              <option key={c} value={c}>{c}</option>
                              ))}
                          </select>
                      </div>
                  </div>
              </div>
          </div>
        )}
    </div>
  );
};

export default BibleSelector;
