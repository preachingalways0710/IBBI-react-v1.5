

import React from 'react';
import { ChapterSummary, TranslationSet, Language } from '../types';
import Spinner from './Spinner';
import ActionButtons from './ActionButtons';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  summary: ChapterSummary | null;
  loading: boolean;
  onTranslate: () => void;
  t: TranslationSet;
  displayBookName: string;
  chapter: number;
  currentLanguage: Language;
}

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SummaryModal: React.FC<SummaryModalProps> = ({ 
  isOpen, onClose, title, summary, loading, onTranslate, t, displayBookName, chapter, currentLanguage
}) => {
  if (!isOpen) {
    return null;
  }

  const getContentForExport = (): string => {
    if (!summary) return "";
    let html = `<h1>${t.summaryTitle} for ${displayBookName} ${chapter}</h1>`;
    
    if (summary.book_summary) {
      html += `<h2>${t.bookSummaryHeading}</h2><p>${summary.book_summary}</p>`;
    }
    html += `<h2>${t.chapterSummaryHeading}</h2><p>${summary.chapter_summary}</p>`;
    html += `<h2>${t.chapterStatsHeading}</h2><ul>`;
    html += `<li><strong>Key Word:</strong> ${summary.chapter_stats.key_word}</li>`;
    html += `<li><strong>Key Verse:</strong> ${summary.chapter_stats.key_verse}</li>`;
    html += `<li><strong>Original Language:</strong> ${summary.chapter_stats.original_language}</li>`;
    html += `<li><strong>${t.wordCounts}:</strong><ul>`;
    summary.chapter_stats.word_counts.forEach(wc => {
      html += `<li>${wc.word}: ${wc.count}</li>`;
    });
    html += `</ul></li></ul>`;
    
    return html;
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-xl font-semibold text-amber-400 font-serif">{title}</h2>
          <div className="flex items-center space-x-2">
            {!loading && summary && (
                <>
                    <ActionButtons
                        getContentForExport={getContentForExport}
                        exportTitle={`${displayBookName} ${chapter} Summary`}
                        t={t}
                    />
                    <button 
                        onClick={onTranslate}
                        className="text-sm font-semibold px-3 py-1 rounded-md transition-colors text-sky-400 hover:text-sky-300 bg-slate-700/50 hover:bg-slate-700"
                        disabled={loading}
                        title={t.translateSummary}
                    >
                        {t.translateSummary}
                    </button>
                </>
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
          {!loading && summary && (
            <div className="space-y-6 text-slate-300">
              {summary.book_summary && (
                <section>
                  <h3 className="text-lg font-bold text-sky-300 mb-2 border-b border-sky-800 pb-1">{t.bookSummaryHeading}</h3>
                  <p className="whitespace-pre-wrap font-sans">{summary.book_summary}</p>
                </section>
              )}
               <section>
                  <h3 className="text-lg font-bold text-sky-300 mb-2 border-b border-sky-800 pb-1">{t.chapterSummaryHeading}</h3>
                  <p className="whitespace-pre-wrap font-sans">{summary.chapter_summary}</p>
                </section>
                <section>
                  <h3 className="text-lg font-bold text-sky-300 mb-2 border-b border-sky-800 pb-1">{t.chapterStatsHeading}</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-sm">
                        <div><strong>Key Word:</strong> <span className="text-amber-400">{summary.chapter_stats.key_word}</span></div>
                        <div><strong>Key Verse:</strong> <span className="text-amber-400">{summary.chapter_stats.key_verse}</span></div>
                        <div><strong>Original Language:</strong> <span className="text-amber-400">{summary.chapter_stats.original_language}</span></div>
                        <div>
                            <strong>{t.wordCounts}:</strong>
                            <span className="text-slate-500 italic text-xs ml-2">{t.wordCountFromTranslation}</span>
                            <ul className="list-disc list-inside ml-4 mt-1">
                                {summary.chapter_stats.word_counts.map(wc => (
                                    <li key={wc.word}><span className="text-amber-400">{wc.word}:</span> {wc.count}</li>
                                ))}
                            </ul>
                        </div>
                   </div>
                </section>
            </div>
          )}
           {!loading && !summary && (
             <p className="text-slate-400 text-center py-12">Could not load summary.</p>
           )}
        </div>
      </div>
    </div>
  );
};

export default SummaryModal;