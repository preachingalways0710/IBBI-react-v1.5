import React, { useEffect, useState, useRef } from 'react';
import { Verse, TranslationSet, OutlineItem, Language, ChapterViewMode } from '../types';
import Spinner from './Spinner';
import ActionButtons from './ActionButtons';
import MobileModal from './MobileModal';

interface ChapterDisplayProps {
  loading: boolean;
  content: Verse[];
  error: string | null;
  displayBookName: string;
  chapter: number;
  onToggleVerse: (verseNumber: number) => void;
  t: TranslationSet;
  highlightedVerses: number[];
  manuallySelectedVerses: number[];
  onVerseSelectionToggle: (verseNumber: number) => void;
  verseToScrollTo: number | null;
  onScrollComplete: () => void;
  scrollToRef: number | null;
  onScrollToRefComplete: () => void;
  viewMode: ChapterViewMode;
  chapterOutline: OutlineItem[] | null;
  outlineLoading: boolean;
  expandAllLoading: boolean;
  onSetViewMode: (mode: ChapterViewMode) => void;
  translateCommentaryToggle: boolean;
  translationLoading: boolean;
  onToggleCommentaryTranslation: () => void;
  onShowDifference: (verseNumber: number) => void;
  onSimplifyVerse: (verseNumber: number, action: 'simplify' | 'revert') => void;
  onToggleCrossReferences: (verseNumber: number) => void;
  onCancelGeneration: () => void;
  uiLanguage: Language;
  currentVersionName: string;
  testament: string;
  onNavigateChapter: (direction: 'prev' | 'next') => void;
  isPrevDisabled: boolean;
  isNextDisabled: boolean;
  onToggleThemesModal: () => void;
  onToggleSummaryModal: () => void;
  onWordClick: (word: string, verseNumber: number, contextSentence: string) => void;
  isWordDefinitionOpen: boolean;
  onShowCrossRefPopup: (reference: string, targetElement: HTMLElement) => void;
  onHideCrossRefPopup: () => void;
  onNavigateToReference: (reference: string) => void;
  onGoToSelector: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  isFloating?: boolean;
}

const ExpandIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
);
  
const CollapseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
    </svg>
);

const ChainIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.596a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const StopIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <rect x="6" y="6" width="12" height="12" rx="1" />
  </svg>
);

const LeftArrowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const RightArrowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const DotsVerticalIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

const TranslateIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m4 13-4-4-4 4M6 17v-2a4 4 0 014-4h2m4 0a4 4 0 014 4v2" />
      <path d="M15 9a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

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


const ProgressIndicator: React.FC<{ onCancel: () => void; t: TranslationSet; loadType?: 'single' | 'chapter', message?: string }> = ({ onCancel, t, loadType = 'chapter', message }) => {
  const [progress, setProgress] = useState(2);

  useEffect(() => {
    setProgress(2); // Reset progress on new load

    const totalDuration = loadType === 'single' ? 6250 : 157500;
    const totalSteps = 96; // from 2 to 98
    const intervalTime = totalDuration / totalSteps;

    const progressTimer = setInterval(() => {
        setProgress(prev => Math.min(prev + 1, 98));
    }, intervalTime);

    // This timer ensures the interval stops exactly when the duration is up
    const stopTimer = setTimeout(() => {
        clearInterval(progressTimer);
        setProgress(98);
    }, totalDuration);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(stopTimer);
    };
  }, [loadType]);

  return (
    <div className="w-full">
        <div className="text-center text-xs text-slate-400 mb-1 h-4 animate-pulse">
            {(message || t.generatingCommentary)}...
        </div>
        <div className="flex items-center space-x-3 w-full">
          <div className="w-full bg-slate-600 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${progress}%`, transition: `width ${loadType === 'single' ? 0.1 : 0.15}s linear` }}></div>
          </div>
          <button onClick={onCancel} title="Stop generation" className="p-1 rounded-full bg-red-600 hover:bg-red-500 text-white flex-shrink-0">
            <StopIcon className="w-4 h-4" />
          </button>
        </div>
    </div>
  );
};


const ChapterDisplay: React.FC<ChapterDisplayProps> = ({ 
  loading, content, error, displayBookName, chapter, onToggleVerse, t, highlightedVerses,
  manuallySelectedVerses, onVerseSelectionToggle,
  verseToScrollTo, onScrollComplete, scrollToRef, onScrollToRefComplete,
  viewMode, chapterOutline, outlineLoading, onSetViewMode,
  expandAllLoading,
  translateCommentaryToggle, translationLoading, onToggleCommentaryTranslation,
  onShowDifference, onSimplifyVerse, onToggleCrossReferences, onCancelGeneration, uiLanguage,
  currentVersionName, testament, onNavigateChapter, isPrevDisabled, isNextDisabled, onToggleThemesModal,
  onToggleSummaryModal, onWordClick, isWordDefinitionOpen,
  onShowCrossRefPopup, onHideCrossRefPopup, onNavigateToReference, onGoToSelector,
  isMinimized, onToggleMinimize, isFloating = false
}) => {
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [isMobileResourcesMenuOpen, setIsMobileResourcesMenuOpen] = useState(false);
  const [isDesktopResourcesMenuOpen, setIsDesktopResourcesMenuOpen] = useState(false);
  
  const viewMenuRef = useRef<HTMLDivElement>(null);
  const desktopResourcesMenuRef = useRef<HTMLDivElement>(null);

  const expandAllActive = viewMode === 'commentary' || viewMode === 'simplified';
  
  useEffect(() => {
    if (highlightedVerses.length > 0) {
      const firstVerseId = `verse-${highlightedVerses[0]}`;
      const element = document.getElementById(firstVerseId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedVerses, content]);

  useEffect(() => {
    if (verseToScrollTo !== null) {
      const verseElement = document.getElementById(`verse-${verseToScrollTo}`);
      if (verseElement) {
        verseElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      onScrollComplete();
    }
  }, [verseToScrollTo, onScrollComplete]);

  useEffect(() => {
    if (scrollToRef !== null) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`cross-ref-container-${scrollToRef}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          onScrollToRefComplete();
        }
      }, 100); // Allow time for element to render
      return () => clearTimeout(timer);
    }
  }, [scrollToRef, onScrollToRefComplete]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (desktopResourcesMenuRef.current && !desktopResourcesMenuRef.current.contains(event.target as Node)) {
        setIsDesktopResourcesMenuOpen(false);
      }
    }
    // Only add the listener if the desktop menu is open to improve performance and prevent conflicts
    if (isDesktopResourcesMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDesktopResourcesMenuOpen]);

  const verseHeadings = new Map<number, string>();
  if (viewMode === 'outline' && chapterOutline) {
    chapterOutline.forEach(item => {
      verseHeadings.set(item.start_verse, item.heading);
    });
  }
  
  const displayLang = translateCommentaryToggle ? (uiLanguage === 'en' ? 'pt' : 'en') : uiLanguage;
  const isAnyVerseExpanded = content.some(v => v.isExpanded);
  const isCommentaryVisible = expandAllActive || isAnyVerseExpanded;

  const getVerseExportContent = (verse: Verse): string => {
    const isCurrentlyShowingSimplified = verse.isSimplified && !!verse.simplifiedCommentaries[displayLang];
    const commentary = isCurrentlyShowingSimplified ? verse.simplifiedCommentaries[displayLang] : verse.commentaries[displayLang];
    const crossRefs = (verse.isCrossRefsVisible && verse.crossReferences[displayLang]) ? verse.crossReferences[displayLang] : null;
    const difference = verse.differenceExplanation[displayLang];

    let commentaryHtml = '';
    if (commentary) {
        let crossRefHtml = '';
        if (crossRefs && crossRefs.length > 0) {
            crossRefHtml += `<h4>${t.crossReferencesHeading}</h4><ul>`;
            crossRefs.forEach(group => {
                crossRefHtml += `<li><strong>${group.subject}:</strong> ${group.references.join(', ')}</li>`;
            });
            crossRefHtml += '</ul>';
        }

        commentaryHtml = `<div class="commentary-block">
            <h4>Commentary${isCurrentlyShowingSimplified ? ' (Simplified)' : ''}:</h4>
            <p><strong>${commentary.overview}</strong></p>
            <hr />
            ${commentary.phrasal_breakdown.map(p => `
                <h5>“${p.phrase}”</h5>
                <p>${p.explanation}</p>
            `).join('')}
            ${crossRefHtml}
        </div>`;
    }

    let html = `<div class="verse-block">
        <p><strong>${displayBookName} ${chapter}:${verse.number}</strong></p>
        <p>${verse.text}</p>
        ${commentaryHtml}
        ${verse.isDifferenceExpanded && difference ? `<div class="commentary-block"><h4>ACF/KJV Variation:</h4><p>${difference}</p></div>` : ''}
    </div>`;
    return html;
  };

  const getChapterExportContent = (): string => {
    let html = `<h2>Commentary for ${displayBookName} ${chapter}</h2>`;
    content.forEach(verse => {
      if (verse.commentaries[displayLang] || verse.simplifiedCommentaries[displayLang]) {
        html += getVerseExportContent(verse);
      }
    });
    return html;
  };

  const renderCrossReferences = (verse: Verse) => {
    const crossRefs = verse.crossReferences[displayLang];
    const crossRefsLoading = verse.crossRefsLoading.has(displayLang);
    const isVisible = verse.isCrossRefsVisible;
  
    if (!isVisible && !crossRefsLoading) return null;
  
    const hasContent = crossRefs && crossRefs.length > 0;
  
    return (
      <div id={`cross-ref-container-${verse.number}`} className="mt-4">
        {crossRefsLoading && (
          <div className="px-4 py-2">
            <ProgressIndicator onCancel={onCancelGeneration} t={t} loadType="single" message={t.generatingCrossRefs} />
          </div>
        )}
        {!crossRefsLoading && hasContent && (
          <div className="p-4 bg-slate-800/60 rounded-lg animate-fade-in">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">{t.crossReferencesHeading}</h4>
            <div className="space-y-3">
              {crossRefs.map((group, groupIndex) => (
                <div key={groupIndex}>
                  <h5 className="font-semibold text-sky-300 font-sans text-sm">{group.subject}</h5>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                    {group.references.map((ref, refIndex) => (
                      <button
                        key={refIndex}
                        onMouseEnter={(e) => onShowCrossRefPopup(ref, e.currentTarget)}
                        onMouseLeave={onHideCrossRefPopup}
                        onClick={() => onNavigateToReference(ref)}
                        className="text-sm text-amber-400 hover:text-amber-300 hover:underline transition-colors"
                      >
                        {ref}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const renderCommentary = (verse: Verse) => {
    const verseHasOverride = verse.overrideSimplified !== undefined;
    const showSimplified = verseHasOverride
      ? verse.overrideSimplified
      : (viewMode === 'simplified');

    const commentary = showSimplified ? verse.simplifiedCommentaries[displayLang] : verse.commentaries[displayLang];
    
    const originalCommentaryExists = !!verse.commentaries[displayLang] || !!verse.simplifiedCommentaries[displayLang];
    const differenceExplanation = verse.differenceExplanation[displayLang];
    const hasDifference = verse.hasSignificantDifference[displayLang];
    const isDifferenceExpanded = verse.isDifferenceExpanded;
    const commentaryLoading = verse.commentaryLoading.has(displayLang);
    const differenceLoading = verse.differenceLoading.has(displayLang);
    const simplificationLoading = verse.simplificationLoading.has(displayLang);
    const crossRefsLoading = verse.crossRefsLoading.has(displayLang);
    const isCrossRefsVisible = verse.isCrossRefsVisible;


    if (commentaryLoading) {
      return <ProgressIndicator onCancel={onCancelGeneration} t={t} loadType="single"/>;
    }

    const simplifyButtonClass = `text-xs font-semibold px-2 py-1 rounded-md transition-colors disabled:opacity-50 flex items-center space-x-1 ${
      verseHasOverride
      ? 'bg-amber-800/60 text-amber-300 hover:bg-amber-800/90' // Override color
      : 'bg-green-800/60 text-green-300 hover:bg-green-800/90' // Default color
    }`;

    return (
      <div className="space-y-4">
        {commentary && (
            <div className="space-y-4">
                {/* Overview */}
                <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-1">Overview</h4>
                    <p className="text-base text-slate-300 whitespace-pre-wrap font-sans font-bold">{commentary.overview}</p>
                </div>

                {/* Phrasal Breakdown */}
                {commentary.phrasal_breakdown.length > 0 && (
                    <div className="space-y-3 pt-3 border-t border-slate-700/50">
                        {commentary.phrasal_breakdown.map((item, index) => (
                            <div key={index}>
                                <h5 className="font-semibold text-sky-300 font-sans">{`“${item.phrase}”`}</h5>
                                <p className="text-base text-slate-300 whitespace-pre-wrap font-sans mt-1 pl-2">{item.explanation}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
        
        {originalCommentaryExists && (
            <div className="flex justify-between items-start pt-3 mt-3 border-t border-slate-700/50">
                <div className="flex flex-col items-start space-y-2">
                    {hasDifference && (
                        <button 
                          onClick={() => onShowDifference(verse.number)}
                          disabled={differenceLoading}
                          className="text-xs font-semibold px-2 py-1 rounded-md transition-colors bg-purple-800/50 text-purple-300 hover:bg-purple-800/80 disabled:opacity-50"
                          title={isDifferenceExpanded ? t.minimize : t.tooltipAcfKjvVariations}
                        >
                          {isDifferenceExpanded ? t.minimize : t.acfKjvVariations}
                        </button>
                    )}
                    <button
                        onClick={() => onSimplifyVerse(verse.number, showSimplified ? 'revert' : 'simplify')}
                        disabled={simplificationLoading || (!verse.commentaries[displayLang] && !showSimplified)}
                        className={simplifyButtonClass}
                        title={showSimplified ? t.tooltipRevertCommentary : t.tooltipSimplifyCommentary}
                    >
                        {simplificationLoading ? <Spinner size="sm" /> : <span>{showSimplified ? t.revertCommentary : t.simplifyCommentary}</span>}
                    </button>
                    <button
                        onClick={() => onToggleCrossReferences(verse.number)}
                        disabled={crossRefsLoading}
                        className="text-xs font-semibold px-2 py-1 rounded-md transition-colors bg-sky-800/60 text-sky-300 hover:bg-sky-800/90 disabled:opacity-50 flex items-center space-x-1"
                        title={isCrossRefsVisible ? t.tooltipHideCrossRefs : t.tooltipShowCrossRefs}
                    >
                        {crossRefsLoading ? <Spinner size="sm" /> : <span>{isCrossRefsVisible ? t.hideCrossRefs : t.showCrossRefs}</span>}
                    </button>
                </div>

                <div className="pl-2">
                  <ActionButtons 
                      getContentForExport={() => getVerseExportContent(verse)}
                      exportTitle={`${displayBookName} ${chapter}:${verse.number} Commentary`}
                      t={t}
                      orientation="vertical"
                  />
                </div>
            </div>
        )}

        {isDifferenceExpanded && (
            differenceLoading ? <ProgressIndicator onCancel={onCancelGeneration} t={t} loadType="single" /> :
            differenceExplanation && (
              <div className="mt-4 p-3 bg-slate-800/60 border-l-2 border-purple-400 rounded-r-md animate-fade-in text-purple-300 font-sans text-sm whitespace-pre-wrap">
                {differenceExplanation}
              </div>
            )
        )}
      </div>
    );
  };
  
  const renderVerseTextWithClickableWords = (verse: Verse) => {
    const words = verse.text.split(/(\s+)/); // Split by space, keeping spaces
    const punctuationRegex = /[.,;:!?()"“”‘’]/g;

    return words.map((word, index) => {
      if (word.trim() === '') {
        return <React.Fragment key={index}>{word}</React.Fragment>;
      }
      const cleanWord = word.trim().replace(punctuationRegex, '');
      if (cleanWord.length === 0) {
         return <React.Fragment key={index}>{word}</React.Fragment>;
      }
      return (
        <span 
          key={index} 
          className="cursor-pointer hover:bg-sky-900/50 transition-colors duration-200 rounded"
          onClick={(e) => {
            e.stopPropagation(); // Prevent verse selection when clicking a word
            onWordClick(cleanWord, verse.number, verse.text);
          }}
        >
          {word}
        </span>
      );
    });
  };

  const renderDefaultView = () => (
    <div className="space-y-2 font-serif text-lg leading-relaxed text-slate-200">
      {content.map((verse) => (
          <React.Fragment key={verse.number}>
            {verseHeadings.has(verse.number) && (
              <h3 className="text-lg font-semibold text-sky-300 mt-6 mb-2 pt-2 border-t border-slate-700/50">
                {verseHeadings.get(verse.number)}
              </h3>
            )}
            <div 
              id={`verse-${verse.number}`}
              className={`transition-colors duration-300 rounded-lg cursor-pointer ${manuallySelectedVerses.includes(verse.number) ? 'bg-amber-800/50' : highlightedVerses.includes(verse.number) ? 'bg-sky-900/60' : 'hover:bg-slate-900/50'}`}
              onClick={() => onVerseSelectionToggle(verse.number)}
            >
              <div className="flex items-start space-x-3 p-2">
                  {!expandAllActive && (
                    <div className="flex items-center space-x-2 mt-1 flex-shrink-0">
                      <button 
                          onClick={(e) => { e.stopPropagation(); onToggleVerse(verse.number); }}
                          className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-amber-400 transition-colors"
                          aria-label={verse.isExpanded ? t.tooltipCollapseCommentary : t.tooltipExpandCommentary}
                          title={verse.isExpanded ? t.tooltipCollapseCommentary : t.tooltipExpandCommentary}
                      >
                          {verse.isExpanded ? <CollapseIcon className="w-4 h-4" /> : <ExpandIcon className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleCrossReferences(verse.number); }}
                        disabled={verse.crossRefsLoading.has(displayLang)}
                        className={`p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-amber-400 transition-colors disabled:opacity-50 disabled:animate-pulse ${verse.isCrossRefsVisible ? 'text-amber-400 bg-slate-700/50' : ''}`}
                        title={verse.isCrossRefsVisible ? t.tooltipHideCrossRefs : t.tooltipShowCrossRefs}
                      >
                        <ChainIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <p className="flex-1">
                      <sup className="font-sans font-bold text-amber-500 mr-2">{verse.number}</sup>
                      {renderVerseTextWithClickableWords(verse)}
                  </p>
              </div>
              {(verse.isExpanded || verse.isCrossRefsVisible) && (
                  <div className="mt-1 mb-2 ml-12 mr-4 pl-4 pr-2 py-3 border-l-2 border-slate-700 bg-slate-900/50 rounded-r-md animate-fade-in space-y-4">
                      {verse.isExpanded && renderCommentary(verse)}
                      {verse.isExpanded && verse.isCrossRefsVisible && (
                        <div className="border-t border-slate-700/50"></div>
                      )}
                      {verse.isCrossRefsVisible && renderCrossReferences(verse)}
                  </div>
              )}
            </div>
          </React.Fragment>
        )
      )}
    </div>
  );

  const renderExpandAllView = () => (
     <div className="space-y-1 font-serif text-lg leading-relaxed text-slate-200">
        <div className="flex justify-end pb-2">
          {!expandAllLoading && !translationLoading && (
            <ActionButtons 
              getContentForExport={getChapterExportContent}
              exportTitle={`${displayBookName} ${chapter} Commentary`}
              t={t}
            />
          )}
        </div>
        {(expandAllLoading || translationLoading) && <ProgressIndicator onCancel={onCancelGeneration} t={t} loadType="chapter"/> }
        {content.map((verse) => (
              <React.Fragment key={verse.number}>
                {verseHeadings.has(verse.number) && (
                  <h3 className="text-lg font-semibold text-sky-300 mt-6 mb-2 pt-2 border-t border-slate-700/50">
                    {verseHeadings.get(verse.number)}
                  </h3>
                )}
                <div 
                  id={`verse-${verse.number}`}
                  onClick={() => onVerseSelectionToggle(verse.number)}
                  className={`grid grid-cols-2 gap-x-6 py-3 border-b border-slate-700/50 items-start transition-colors duration-300 rounded-lg cursor-pointer ${manuallySelectedVerses.includes(verse.number) ? 'bg-amber-800/50' : highlightedVerses.includes(verse.number) ? 'bg-sky-900/60' : 'hover:bg-slate-900/50'}`}
                >
                  <p className="flex items-baseline">
                    <sup className="font-sans font-bold text-amber-500 mr-2">{verse.number}</sup>
                    <span>{renderVerseTextWithClickableWords(verse)}</span>
                  </p>
                  <div className="pl-4 pr-1 space-y-4">
                    { !(expandAllLoading || translationLoading) && (
                        <>
                            {renderCommentary(verse)}
                            {verse.isExpanded && verse.isCrossRefsVisible && (
                                <div className="border-t border-slate-700/50"></div>
                            )}
                            {renderCrossReferences(verse)}
                        </>
                    )}
                  </div>
                </div>
              </React.Fragment>
            )
        )}
      </div>
  );
  
  const renderViewButton = (mode: ChapterViewMode, title: string, tooltip: string, mobile: boolean = false) => {
    const isLoading = (mode === 'outline' && outlineLoading) || (mode === 'commentary' && expandAllLoading && viewMode === 'commentary') || (mode === 'simplified' && expandAllLoading && viewMode === 'simplified');
    const isActive = viewMode === mode;
    const mobileClasses = "w-48";
    const desktopClasses = "min-w-[80px] w-full";

    return (
      <button
        onClick={() => {
            onSetViewMode(mode);
            setViewMenuOpen(false);
        }}
        title={tooltip}
        disabled={isLoading || loading}
        className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors flex items-center justify-center ${mobile ? mobileClasses : desktopClasses} ${
          isActive ? 'bg-sky-600 text-sky-100 shadow-inner' : 'text-slate-300 hover:bg-slate-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? <Spinner size="sm" /> : title}
      </button>
    );
  };
  
  const handleHeaderClick = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ((e as React.KeyboardEvent).key) {
        if ((e as React.KeyboardEvent).key === 'Enter' || (e as React.KeyboardEvent).key === ' ') {
            e.preventDefault();
            onGoToSelector();
        }
    } else {
        onGoToSelector();
    }
  };

  const mainContainerClass = isFloating 
    ? '' 
    : `bg-slate-800 rounded-lg shadow-md flex flex-col overflow-hidden transition-all duration-500 ease-in-out ${isMinimized ? 'max-h-16' : ''}`;

  return (
    <div className={mainContainerClass}>
      {/* Primary Header */}
      {!isFloating && (
          <div 
            className={`flex items-center justify-between p-4 flex-shrink-0 ${isMinimized ? 'cursor-pointer h-full border-b-transparent' : 'border-b border-slate-700'}`}
            onClick={isMinimized ? onToggleMinimize : undefined}
            style={{minHeight: '64px'}}
            role={isMinimized ? 'button' : 'region'}
            aria-label={isMinimized ? 'Maximize reader panel' : undefined}
            tabIndex={isMinimized ? 0 : -1}
          >
            <h2 className="text-2xl font-semibold text-amber-400 font-serif">{t.godsWord}</h2>
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleMinimize(); }} 
              className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
              aria-label={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? <MaximizeIcon className="w-5 h-5" /> : <MinimizeIcon className="w-5 h-5" />}
            </button>
          </div>
      )}

      {/* Secondary Header (Controls) */}
      <div className={`p-4 flex-shrink-0 ${!isFloating ? 'border-b border-slate-700' : ''}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigateChapter('prev')}
              disabled={isPrevDisabled || loading}
              className="p-1 rounded-md transition-colors text-slate-400 hover:text-sky-300 bg-slate-700/50 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              title={t.tooltipPreviousChapter}
            >
              <LeftArrowIcon className="w-5 h-5" />
            </button>
            <h2
              onClick={handleHeaderClick}
              onKeyDown={handleHeaderClick}
              tabIndex={0}
              role="button"
              aria-label={t.ariaGoToSelector}
              className="text-lg font-normal text-slate-500 font-sans text-center transition-colors hover:text-slate-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-md px-2"
            >
              {displayBookName} {chapter}
            </h2>
            <button
              onClick={() => onNavigateChapter('next')}
              disabled={isNextDisabled || loading}
              className="p-1 rounded-md transition-colors text-slate-400 hover:text-sky-300 bg-slate-700/50 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              title={t.tooltipNextChapter}
            >
              <RightArrowIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="text-xs font-bold tracking-wider uppercase text-slate-500 text-right">
              <div>{currentVersionName}</div>
              <div>{testament}</div>
          </div>
        </div>

        <div className="flex justify-center items-center space-x-2 mt-3">
          {/* Desktop View Buttons */}
          <div className="hidden sm:flex items-center bg-slate-700/50 rounded-lg p-1 space-x-1">
            {renderViewButton('reading', t.viewReading, t.tooltipViewReading)}
            {renderViewButton('outline', t.viewOutline, t.tooltipViewOutline)}
            {renderViewButton('commentary', t.viewCommentary, t.tooltipViewCommentary)}
            {renderViewButton('simplified', t.viewSimplified, t.tooltipViewSimplified)}
          </div>
          
          {/* Mobile Buttons */}
          <div className="flex sm:hidden items-center space-x-2">
            {/* View Button */}
            <div className="relative" ref={viewMenuRef}>
              <button
                onClick={() => setViewMenuOpen(p => !p)}
                className="px-4 py-2 rounded-md transition-colors text-slate-300 bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center font-semibold text-sm"
              >
                {t.view}
              </button>
              <MobileModal isOpen={viewMenuOpen} onClose={() => setViewMenuOpen(false)} title={t.view}>
                {renderViewButton('reading', t.viewReading, t.tooltipViewReading, true)}
                {renderViewButton('outline', t.viewOutline, t.tooltipViewOutline, true)}
                {renderViewButton('commentary', t.viewCommentary, t.tooltipViewCommentary, true)}
                {renderViewButton('simplified', t.viewSimplified, t.tooltipViewSimplified, true)}
              </MobileModal>
            </div>
            
            {/* Resources Button */}
            <div className="relative">
              <button
                onClick={() => setIsMobileResourcesMenuOpen(true)}
                className="px-4 py-2 rounded-md transition-colors text-slate-300 bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center font-semibold text-sm"
              >
                {t.resources}
              </button>
              <MobileModal isOpen={isMobileResourcesMenuOpen} onClose={() => setIsMobileResourcesMenuOpen(false)} title={t.resources}>
                  <button onClick={() => { onToggleSummaryModal(); setIsMobileResourcesMenuOpen(false); }} className="w-48 flex items-center justify-center px-3 py-2 hover:bg-slate-600 rounded-md text-sm font-semibold text-slate-300 disabled:text-slate-500" disabled={loading}>{t.summary}</button>
                  <button onClick={() => { onToggleThemesModal(); setIsMobileResourcesMenuOpen(false); }} className="w-48 flex items-center justify-center px-3 py-2 hover:bg-slate-600 rounded-md text-sm font-semibold text-slate-300 disabled:text-slate-500" disabled={loading}>{t.commonThemes}</button>
                  {isCommentaryVisible && (
                    <button
                      onClick={() => { onToggleCommentaryTranslation(); setIsMobileResourcesMenuOpen(false); }}
                      className={`flex items-center justify-center space-x-2 w-48 px-3 py-2 hover:bg-slate-600 rounded-md text-sm font-semibold text-slate-300 disabled:text-slate-500 ${translateCommentaryToggle ? 'bg-sky-700/50' : ''}`}
                      disabled={loading || expandAllLoading || translationLoading}
                      title={t.tooltipTranslateCommentary}
                    >
                      {translationLoading ? <Spinner size="sm" /> : <TranslateIcon className="w-5 h-5" />}
                      <span>{t.toggleCommentaryTranslation}</span>
                    </button>
                  )}
              </MobileModal>
            </div>
          </div>
          
          {/* Desktop "More Actions" (dots icon) */}
          <div className="relative hidden sm:block" ref={desktopResourcesMenuRef}>
            <button
              onClick={() => setIsDesktopResourcesMenuOpen(prev => !prev)}
              className="p-2 rounded-md transition-colors text-slate-300 bg-slate-700/50 hover:bg-slate-700 hover:text-sky-300 flex items-center justify-center"
              aria-label={t.moreActions}
            >
              <DotsVerticalIcon className="w-5 h-5" />
            </button>
            {isDesktopResourcesMenuOpen && (
              <div className="absolute z-20 top-full right-0 mt-2 p-0 bg-transparent">
                <div className="bg-slate-700 border border-slate-600 rounded-lg shadow-lg flex flex-col w-48 p-1">
                  <button onClick={() => { onToggleSummaryModal(); setIsDesktopResourcesMenuOpen(false); }} className="w-full flex items-center justify-start px-3 py-2 hover:bg-slate-600 rounded-md text-sm font-semibold text-slate-300 disabled:text-slate-500" disabled={loading}>{t.summary}</button>
                  <button onClick={() => { onToggleThemesModal(); setIsDesktopResourcesMenuOpen(false); }} className="w-full flex items-center justify-start px-3 py-2 hover:bg-slate-600 rounded-md text-sm font-semibold text-slate-300 disabled:text-slate-500" disabled={loading}>{t.commonThemes}</button>
                  {isCommentaryVisible && (
                    <button
                      onClick={() => { onToggleCommentaryTranslation(); setIsDesktopResourcesMenuOpen(false); }}
                      className={`flex items-center justify-start space-x-2 w-full px-3 py-2 hover:bg-slate-600 rounded-md text-sm font-semibold text-slate-300 disabled:text-slate-500 ${translateCommentaryToggle ? 'bg-sky-700/50' : ''}`}
                      disabled={loading || expandAllLoading || translationLoading}
                      title={t.tooltipTranslateCommentary}
                    >
                      {translationLoading ? <Spinner size="sm" /> : <TranslateIcon className="w-5 h-5" />}
                      <span>{t.toggleCommentaryTranslation}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Content Area */}
      <div className={`p-6 transition-all duration-300 ${isWordDefinitionOpen ? 'pb-96' : ''}`}>
        {loading && <div className="flex justify-center items-center h-full"><Spinner /></div>}
        {error && <p className="text-red-400 text-center">{error}</p>}
        {!loading && !error && (
           expandAllActive ? renderExpandAllView() : renderDefaultView()
        )}
      </div>
    </div>
  );
};

export default ChapterDisplay;