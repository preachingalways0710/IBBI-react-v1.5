

import React, { useEffect, useState } from 'react';
import { WordDefinitionState, TranslationSet } from '../types';
import ActionButtons from './ActionButtons';
import BiblicalMap from './BiblicalMap';

interface WordDefinitionPopupProps {
  state: WordDefinitionState;
  onClose: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onTranslate: () => void;
  t: TranslationSet;
}

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const StopIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3-3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
  </svg>
);

const RetryIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 13M20 20l-1.5-1.5A9 9 0 003.5 11" />
    </svg>
);


const LoadingIndicator: React.FC<{ onCancel: () => void }> = ({ onCancel }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(5);
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(timer);
          return prev;
        }
        const increment = prev < 70 ? 3 : 1;
        return prev + increment;
      });
    }, 200);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center space-x-3 w-full py-4">
      <div className="w-full bg-slate-600 rounded-full h-2.5">
        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.2s ease-in-out' }}></div>
      </div>
      <button onClick={onCancel} title="Stop generation" className="p-1 rounded-full bg-red-600 hover:bg-red-500 text-white flex-shrink-0">
        <StopIcon className="w-5 h-5" />
      </button>
    </div>
  );
};


const WordDefinitionPopup: React.FC<WordDefinitionPopupProps> = ({ state, onClose, onCancel, onRetry, onTranslate, t }) => {
  if (!state.isOpen) return null;

  const { word, verseRef, definition, loading, displayLanguage, wasCancelled } = state;
  const currentDefinition = definition[displayLanguage];
  const isLoading = loading.has(displayLanguage);

  const getContentForExport = (): string => {
    if (!currentDefinition) return "";
    let html = `<h1>${t.wordDefinitionTitle(word || '', verseRef || '')}</h1>`;
    html += `<h2>${t.modernDefinitionHeading}</h2><p>${currentDefinition.modern_definition}</p>`;
    if(currentDefinition.archaic_usage_note) {
        html += `<h3>${t.archaicUsageNoteHeading}</h3><p>${currentDefinition.archaic_usage_note}</p>`;
    }
    html += `<h2>${t.originalLangDefinitionHeading(currentDefinition.original_language_word)}</h2><p>${currentDefinition.original_language_definition}</p>`;
    return html;
  };

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 flex justify-center animate-fade-in-up">
      <div className="bg-slate-800 w-full max-w-4xl rounded-t-lg shadow-2xl border-t border-x border-slate-700 flex flex-col max-h-[50vh]">
        <header className="flex justify-between items-center p-3 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-amber-400 font-serif">
            {word && verseRef ? t.wordDefinitionTitle(word, verseRef) : 'Definition'}
          </h2>
          <div className="flex items-center space-x-2">
            {!isLoading && currentDefinition && (
              <>
                <ActionButtons
                  getContentForExport={getContentForExport}
                  exportTitle={`Definition of ${word}`}
                  t={t}
                />
                <button
                  onClick={onTranslate}
                  className="text-sm font-semibold px-3 py-1 rounded-md transition-colors text-sky-400 hover:text-sky-300 bg-slate-700/50 hover:bg-slate-700"
                  disabled={isLoading}
                  title={t.translateDefinition}
                >
                  {t.translateDefinition}
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
          {isLoading && <LoadingIndicator onCancel={onCancel} />}

          {!isLoading && wasCancelled && (
            <div className="flex flex-col items-center justify-center h-full text-center py-4">
                 <p className="text-slate-400 mb-4">Generation stopped.</p>
                 <button 
                    onClick={onRetry} 
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors"
                >
                    <RetryIcon className="w-5 h-5" />
                    <span>{t.retryGeneration}</span>
                 </button>
            </div>
          )}

          {!isLoading && !wasCancelled && currentDefinition && (
            <>
              {currentDefinition.is_location && typeof currentDefinition.latitude === 'number' && typeof currentDefinition.longitude === 'number' && (
                <BiblicalMap 
                  latitude={currentDefinition.latitude}
                  longitude={currentDefinition.longitude}
                  placeName={word || ''}
                  locationCertainty={currentDefinition.location_certainty}
                />
              )}
              <div className="space-y-4 text-slate-300">
                  <section>
                      <h3 className="text-md font-bold text-sky-300 mb-1">{t.modernDefinitionHeading}</h3>
                      <p className="whitespace-pre-wrap font-sans text-base">{currentDefinition.modern_definition}</p>
                  </section>
                  {currentDefinition.archaic_usage_note && (
                      <section>
                          <h3 className="text-md font-bold text-sky-300 mb-1">{t.archaicUsageNoteHeading}</h3>
                          <p className="whitespace-pre-wrap font-sans text-base text-amber-300/80">{currentDefinition.archaic_usage_note}</p>
                      </section>
                  )}
                  <section>
                      <h3 className="text-md font-bold text-sky-300 mb-1">{t.originalLangDefinitionHeading(currentDefinition.original_language_word)}</h3>
                      <p className="whitespace-pre-wrap font-sans text-base">{currentDefinition.original_language_definition}</p>
                  </section>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordDefinitionPopup;