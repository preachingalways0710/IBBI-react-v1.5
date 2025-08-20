
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BibleVersion, Verse, Language, OutlineItem, CommonThemeItem, ChatTurn, ChapterSummary, WordDefinitionState, ChapterViewMode, StructuredCommentary, CrossRefPopupState, CrossReferenceItem, TranslationSet, SermonDataType, PointContent, ScriptureContent, SermonBodyItem, SermonType } from './types';
import { BIBLE_BOOKS, translations } from './constants';
import { fetchChapter, fetchCrossReferenceText } from './services/bibleService';
import { createChatSession, getVerseCommentary, getChapterOutline, getChapterVerseByVerseCommentary, getChapterVerseByVerseSimplifiedCommentary, getTranslationDifferenceExplanation, getCommonThemes, translateText, getChapterSummary, getWordDefinition, simplifyCommentary, getVerseCrossReferences, generateSermonOutline, parseScriptureReferences } from './services/geminiService';
import Header from './components/Header';
import BibleSelector from './components/BibleSelector';
import ChapterDisplay from './components/ChapterDisplay';
import ChatInterface from './components/ChatInterface';
import ThemesModal from './components/ThemesModal';
import SummaryModal from './components/SummaryModal';
import WordDefinitionPopup from './components/WordDefinitionPopup';
import CrossRefPopup from './components/CrossRefPopup';
import ModeSwitcher from './components/ModeSwitcher';
import SermonEditor from './components/SermonEditor';
import SelectionToolbar from './components/SelectionToolbar';
import { Chat } from '@google/genai';

type AppMode = 'study' | 'sermon';
type ActiveSermonPanel = 'chat' | 'selector' | 'reader' | null;
type VerseExpansionMode = 'none' | 'fetchedOnly' | 'all';

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [version, setVersion] = useState<BibleVersion>(BibleVersion.ACF2007);
  const [book, setBook] = useState<string>(BIBLE_BOOKS[0].name);
  const [chapter, setChapter] = useState<number>(1);
  const [highlightedVerses, setHighlightedVerses] = useState<number[]>([]);
  const [manuallySelectedVerses, setManuallySelectedVerses] = useState<number[]>([]);
  const [verseToScrollTo, setVerseToScrollTo] = useState<number | null>(null);
  const [scrollToRef, setScrollToRef] = useState<number | null>(null);
  const [isSelectorPulsing, setIsSelectorPulsing] = useState<boolean>(false);
  const [isSelectorMinimized, setIsSelectorMinimized] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(true);
  const [isReaderMinimized, setIsReaderMinimized] = useState(true);
  const [isSermonEditorMinimized, setIsSermonEditorMinimized] = useState(true);

  // New state for modes
  const [mode, setMode] = useState<AppMode>('study');
  const [activeSermonPanel, setActiveSermonPanel] = useState<ActiveSermonPanel>(null);
  const [lastInteractedSermonPanel, setLastInteractedSermonPanel] = useState<'editor' | 'panel'>('editor');
  
  const [readerMinimizedBeforeSermonMode, setReaderMinimizedBeforeSermonMode] = useState(isReaderMinimized);


  const [chapterContent, setChapterContent] = useState<Verse[]>([]);
  const [chapterLoading, setChapterLoading] = useState<boolean>(true);
  const [chapterError, setChapterError] = useState<string | null>(null);
  
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([]);
  const [translatedChatHistory, setTranslatedChatHistory] = useState<ChatTurn[]>([]);
  const [qaTranslated, setQaTranslated] = useState<boolean>(false);
  const [qaTranslationLoading, setQaTranslationLoading] = useState<boolean>(false);

  const [viewMode, setViewMode] = useState<ChapterViewMode>('reading');
  const [chapterOutline, setChapterOutline] = useState<{ en: OutlineItem[] | null, pt: OutlineItem[] | null }>({ en: null, pt: null });
  const [outlineLoading, setOutlineLoading] = useState<boolean>(false);

  const [expandAllLoading, setExpandAllLoading] = useState<boolean>(false);

  const [translateCommentaryToggle, setTranslateCommentaryToggle] = useState<boolean>(false);
  const [translationLoading, setTranslationLoading] = useState<boolean>(false);

  const [isThemesModalOpen, setIsThemesModalOpen] = useState<boolean>(false);
  const [commonThemes, setCommonThemes] = useState<{ en: CommonThemeItem[] | null, pt: CommonThemeItem[] | null }>({ en: null, pt: null });
  const [themesLoading, setThemesLoading] = useState<Set<Language>>(new Set());
  const [themesDisplayLanguage, setThemesDisplayLanguage] = useState<Language>('en');

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
  const [chapterSummary, setChapterSummary] = useState<{ en: ChapterSummary | null, pt: ChapterSummary | null }>({ en: null, pt: null });
  const [summaryLoading, setSummaryLoading] = useState<Set<Language>>(new Set());
  const [summaryDisplayLanguage, setSummaryDisplayLanguage] = useState<Language>('en');

  const [wordDefinitionState, setWordDefinitionState] = useState<WordDefinitionState>({
    isOpen: false,
    word: null,
    verseRef: null,
    definition: { en: null, pt: null },
    loading: new Set(),
    displayLanguage: 'en',
    wasCancelled: false,
  });

  const [crossRefPopupState, setCrossRefPopupState] = useState<CrossRefPopupState>({
    isOpen: false,
    reference: null,
    content: null,
    loading: false,
    error: null,
    position: { top: 0, left: 0 },
  });

  // Sermon Builder State
  const [sermonType, setSermonType] = useState<SermonType>('general');
  const [sermonData, setSermonData] = useState<SermonDataType>({
    title: '', bibleText: '', introduction: '', thesis: '',
    body: [], conclusion: '', verdict: ''
  });
  const [generatedSermonOutline, setGeneratedSermonOutline] = useState<string | null>(null);
  const [isSermonLoading, setIsSermonLoading] = useState(false);
  const [isSermonClearModalOpen, setIsSermonClearModalOpen] = useState(false);
  const [verseExpansionMode, setVerseExpansionMode] = useState<VerseExpansionMode>('none');
  const [isSermonColorEnabled, setIsSermonColorEnabled] = useState(true);

  
  const generationController = useRef({ isCancelled: false });
  const crossRefTimeoutRef = useRef<number | null>(null);
  const sermonActivePanelRef = useRef<HTMLDivElement>(null);
  const sermonEditorRef = useRef<HTMLDivElement>(null);

  const t: TranslationSet = translations[language];

  const answerLoading = chatHistory.some(turn => turn.answerLoading);

  const handleResetChat = useCallback(() => {
    setChatSession(createChatSession());
    setChatHistory([]);
    setTranslatedChatHistory([]);
    setQaTranslated(false);
  }, []);

  useEffect(() => {
    handleResetChat();
  }, [handleResetChat]);

  const resetChapterViewModes = (preserveOutline = false) => {
    setHighlightedVerses([]);
    setManuallySelectedVerses([]);
    if (!preserveOutline) {
      setChapterOutline({ en: null, pt: null });
      setViewMode('reading');
    }
    setTranslateCommentaryToggle(false);
    setIsThemesModalOpen(false);
    setCommonThemes({ en: null, pt: null });
    setThemesLoading(new Set());
    setIsSummaryModalOpen(false);
    setChapterSummary({ en: null, pt: null });
    setSummaryLoading(new Set());
    setWordDefinitionState(prev => ({ ...prev, isOpen: false }));
  }

  const handleSetBook = (newBook: string) => {
    setBook(newBook);
    setChapter(1);
    resetChapterViewModes();
    if (mode === 'sermon') {
      setActiveSermonPanel('reader');
    } else {
      setIsReaderMinimized(false);
    }
  };

  const handleSetVersion = (newVersion: BibleVersion) => {
    setVersion(newVersion);
    resetChapterViewModes();
  }

  const handleSetChapter = (newChapter: number) => {
    setChapter(newChapter);
    resetChapterViewModes();
    if (mode === 'sermon') {
      setActiveSermonPanel('reader');
    } else {
      setIsReaderMinimized(false);
    }
  }

  const handleScrollComplete = () => {
    setVerseToScrollTo(null);
  };
  
  const onScrollToRefComplete = () => {
    setScrollToRef(null);
  };

  const handleGoToSelector = () => {
    if (mode === 'sermon') {
      setActiveSermonPanel('selector');
    } else {
      setIsSelectorMinimized(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsSelectorPulsing(true);
      setTimeout(() => {
        setIsSelectorPulsing(false);
      }, 2500);
    }
  };

  const loadChapter = useCallback(async () => {
    setChapterLoading(true);
    setChapterError(null);
    setChapterContent([]);
    try {
      const content = await fetchChapter(version, book, chapter);
      const versesWithCommentaryState: Verse[] = content.map(v => ({
        ...v,
        commentaries: {},
        simplifiedCommentaries: {},
        crossReferences: {},
        isCrossRefsVisible: false,
        isSimplified: false,
        overrideSimplified: undefined,
        hasSignificantDifference: {},
        differenceExplanation: {},
        isDifferenceExpanded: false,
        commentaryLoading: new Set(),
        differenceLoading: new Set(),
        simplificationLoading: new Set(),
        crossRefsLoading: new Set(),
      }));
      setChapterContent(versesWithCommentaryState);
    } catch (error) {
      setChapterError(t.fetchChapterError(error instanceof Error ? error.message : t.fetchError));
    } finally {
      setChapterLoading(false);
    }
  }, [version, book, chapter, t]);

  useEffect(() => {
    loadChapter();
  }, [loadChapter]);

  useEffect(() => {
    // This effect handles fetching the outline if the language changes while the outline is active.
    if (viewMode === 'outline' && !chapterOutline[language] && !outlineLoading && chapterContent.length > 0) {
        const fetchOutlineForNewLanguage = async () => {
            setOutlineLoading(true);
            try {
                const chapterText = chapterContent.map(v => `v${v.number} ${v.text}`).join('\n');
                const outline = await getChapterOutline({
                    bibleVersion: version,
                    book,
                    chapter,
                    chapterText,
                    language: language,
                });
                setChapterOutline(prev => ({ ...prev, [language]: outline }));
            } catch (error) {
                console.error("Failed to generate outline for language switch:", error);
                setViewMode('reading'); // Turn off outline if fetching fails
            } finally {
                setOutlineLoading(false);
            }
        };

        fetchOutlineForNewLanguage();
    }
  }, [language, viewMode, chapterOutline, outlineLoading, chapterContent, version, book, chapter]);

    useEffect(() => {
    // Auto-translate word definition if panel is open and UI language changes
    if (wordDefinitionState.isOpen && wordDefinitionState.displayLanguage !== language) {
        handleTranslateWordDefinition();
    }
  }, [language, wordDefinitionState.isOpen]);


  const handleAskQuestion = async (question: string) => {
    if (!chatSession) return;
    
    // Invalidate previous translations
    setTranslatedChatHistory([]);
    if (qaTranslated) {
      setQaTranslated(false);
    }

    const newTurn: ChatTurn = { question, answer: '', answerLoading: true };
    setChatHistory(prev => [...prev, newTurn]);

    try {
      const response = await chatSession.sendMessage({ message: question });
      setChatHistory(prev => prev.map((turn, index) => 
        index === prev.length - 1 
        ? { ...turn, answer: response.text, answerLoading: false } 
        : turn
      ));
    } catch (error) {
      console.error("Error sending message to chat:", error);
      const errorMessage = error instanceof Error ? error.message : t.fetchError;
      setChatHistory(prev => prev.map((turn, index) => 
        index === prev.length - 1 
        ? { ...turn, answer: `Error: ${errorMessage}`, answerLoading: false } 
        : turn
      ));
    }
  };

  const handleToggleQaTranslation = async () => {
    if (chatHistory.length === 0) return;

    const isTogglingToTranslated = !qaTranslated;
    setQaTranslated(isTogglingToTranslated);
    
    if (isTogglingToTranslated && translatedChatHistory.length !== chatHistory.length) {
      setQaTranslationLoading(true);
      const targetLang = language === 'en' ? 'pt' : 'en';
      try {
        const historyToTranslate = chatHistory.filter(turn => !turn.answerLoading);
        const translationPromises = historyToTranslate.map(turn => 
          Promise.all([
            translateText(turn.question, targetLang),
            translateText(turn.answer, targetLang)
          ])
        );
        const translatedResults = await Promise.all(translationPromises);
        const newTranslatedHistory: ChatTurn[] = translatedResults.map(([tQuestion, tAnswer]) => ({ question: tQuestion, answer: tAnswer }));
        setTranslatedChatHistory(newTranslatedHistory);
      } catch (error) {
        console.error("Failed to translate Q&A history", error);
        // Display an error message to the user maybe
      } finally {
        setQaTranslationLoading(false);
      }
    }
  };

  const parseVerseRange = (rangeStr: string): number[] => {
    if (!rangeStr) return [];
    const verses: number[] = [];
    if (rangeStr.includes('-')) {
      const [start, end] = rangeStr.split('-').map(Number);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          verses.push(i);
        }
      }
    } else {
      const verseNum = parseInt(rangeStr, 10);
      if (!isNaN(verseNum)) {
        verses.push(verseNum);
      }
    }
    return verses;
  };

  const handleNavigateToReference = (reference: string) => {
    const bookNamesRegex = BIBLE_BOOKS.map(b => b.name).join('|');
    const verseRefRegex = new RegExp(`^(${bookNamesRegex})\\s+(\\d{1,3}):(\\d{1,3}(?:-\\d{1,3})?)$`, 'i');
    
    const match = reference.match(verseRefRegex);

    if (match) {
        const bookName = match[1];
        const chapterNumber = parseInt(match[2], 10);
        const versePart = match[3];
        
        const bookData = BIBLE_BOOKS.find(b => b.name.toLowerCase() === bookName.toLowerCase());

        if (bookData) {
            const versesToHighlight = parseVerseRange(versePart);
            resetChapterViewModes();
            setHighlightedVerses(versesToHighlight);
            setBook(bookData.name);
            setChapter(chapterNumber);
            if (mode === 'sermon') {
                setActiveSermonPanel('reader');
            }
        } else {
             console.warn(`Could not find book data for: ${bookName}`);
        }
    } else {
        const chapterRefRegex = new RegExp(`^(${bookNamesRegex})\\s+(\\d{1,3})$`, 'i');
        const chapterMatch = reference.match(chapterRefRegex);
        if (chapterMatch) {
            const bookName = chapterMatch[1];
            const chapterNumber = parseInt(chapterMatch[2], 10);
            const bookData = BIBLE_BOOKS.find(b => b.name.toLowerCase() === bookName.toLowerCase());
            if (bookData) {
                resetChapterViewModes();
                setHighlightedVerses([]); 
                setBook(bookData.name);
                setChapter(chapterNumber);
                if (mode === 'sermon') {
                    setActiveSermonPanel('reader');
                }
            }
        } else {
            console.warn(`Could not parse reference: ${reference}`);
        }
    }
  };

  const onCancelGeneration = () => {
    generationController.current.isCancelled = true;
    setExpandAllLoading(false);
    setTranslationLoading(false);
    setChapterContent(current => current.map(v => ({
      ...v,
      commentaryLoading: new Set(),
      differenceLoading: new Set(),
      simplificationLoading: new Set(),
      crossRefsLoading: new Set(),
    })));
    setWordDefinitionState(prev => ({...prev, loading: new Set(), wasCancelled: true}));
  }

  const handleToggleVerse = async (verseNumber: number) => {
    generationController.current.isCancelled = false;
    const commentaryLang = translateCommentaryToggle ? (language === 'en' ? 'pt' : 'en') : language;
    
    let verse = chapterContent.find(v => v.number === verseNumber);
    if (!verse) return;
    
    const isExpanding = !verse.isExpanded;
    const needsFetching = isExpanding && !verse.commentaries[commentaryLang];
    
    setChapterContent(current => current.map(v => v.number === verseNumber ? { ...v, isExpanded: isExpanding } : v));

    if (needsFetching) {
      setChapterContent(current => current.map(v => {
        if (v.number === verseNumber) {
          v.commentaryLoading.add(commentaryLang);
        }
        return v;
      }));

      try {
        const response = await getVerseCommentary({ book, chapter, verseNumber, language: commentaryLang });
        if (generationController.current.isCancelled) return;

        setChapterContent(latestContent => latestContent.map(v => {
          if (v.number === verseNumber) {
            return {
              ...v,
              commentaries: { ...v.commentaries, [commentaryLang]: response.commentary },
              hasSignificantDifference: { ...v.hasSignificantDifference, [commentaryLang]: response.has_significant_difference },
              commentaryLoading: new Set([...v.commentaryLoading].filter(l => l !== commentaryLang))
            };
          }
          return v;
        }));
      } catch (error) {
        if (!generationController.current.isCancelled) {
          console.error(`Error fetching commentary for verse ${verseNumber}:`, error);
        }
      } finally {
        if (!generationController.current.isCancelled) {
           setChapterContent(latestContent => latestContent.map(v => {
            if (v.number === verseNumber) {
              return { ...v, commentaryLoading: new Set([...v.commentaryLoading].filter(l => l !== commentaryLang)) };
            }
            return v;
          }));
        }
      }
    }
  };

  const handleSetViewMode = async (mode: ChapterViewMode) => {
    const isTogglingOff = viewMode === mode && mode !== 'reading';
    const newMode = isTogglingOff ? 'reading' : mode;

    if (newMode === 'reading') {
        setViewMode('reading');
        setChapterContent(current => current.map(v => ({ ...v, isExpanded: false })));
        if (isTogglingOff) return;
    }

    setViewMode(newMode);

    if (newMode === 'outline') {
      const currentOutline = chapterOutline[language];
      if (!currentOutline) {
        setOutlineLoading(true);
        try {
          const chapterText = chapterContent.map(v => `v${v.number} ${v.text}`).join('\n');
          const outline = await getChapterOutline({
            bibleVersion: version,
            book,
            chapter,
            chapterText,
            language: language,
          });
          setChapterOutline(prev => ({...prev, [language]: outline}));
        } catch (error) {
          console.error("Failed to generate outline:", error);
          setViewMode('reading'); // Revert on error
        } finally {
          setOutlineLoading(false);
        }
      }
    }

    if (newMode === 'commentary' || newMode === 'simplified') {
      const commentaryLang = translateCommentaryToggle ? (language === 'en' ? 'pt' : 'en') : language;
      
      let versesNeedFetching = false;
      if (newMode === 'commentary') {
        versesNeedFetching = chapterContent.some(v => !v.commentaries[commentaryLang]);
      } else { // simplified
        versesNeedFetching = chapterContent.some(v => !v.simplifiedCommentaries[commentaryLang]);
      }

      if (versesNeedFetching) {
        setExpandAllLoading(true);
        generationController.current.isCancelled = false;
        try {
          const chapterText = chapterContent.map(v => `v${v.number} ${v.text}`).join('\n');
          
          const commentaryItems = newMode === 'commentary'
            ? await getChapterVerseByVerseCommentary({ book, chapter, chapterText, language: commentaryLang })
            : await getChapterVerseByVerseSimplifiedCommentary({ book, chapter, chapterText, language: commentaryLang });

          if (generationController.current.isCancelled) return;

          const commentaryMap = new Map<number, { commentary: StructuredCommentary; has_significant_difference: boolean }>();
          commentaryItems.forEach(item => {
            commentaryMap.set(item.verse_number, { commentary: item.commentary, has_significant_difference: item.has_significant_difference });
          });

          setChapterContent(currentContent =>
            currentContent.map(verse => {
              const newCommentary = commentaryMap.get(verse.number);
              if (!newCommentary) return verse;
              
              if (newMode === 'commentary') {
                return {
                  ...verse,
                  commentaries: { ...verse.commentaries, [commentaryLang]: newCommentary.commentary },
                  hasSignificantDifference: { ...verse.hasSignificantDifference, [commentaryLang]: newCommentary.has_significant_difference },
                  isSimplified: false,
                  overrideSimplified: undefined,
                };
              } else { // simplified
                return {
                  ...verse,
                  simplifiedCommentaries: { ...verse.simplifiedCommentaries, [commentaryLang]: newCommentary.commentary },
                  isSimplified: true,
                   hasSignificantDifference: { ...verse.hasSignificantDifference, [commentaryLang]: newCommentary.has_significant_difference },
                   overrideSimplified: undefined,
                };
              }
            })
          );
        } catch (error) {
          if (!generationController.current.isCancelled) {
            console.error(`Failed to fetch verse-by-verse ${newMode} commentary:`, error);
            setViewMode('reading');
          }
        } finally {
          setExpandAllLoading(false);
        }
      } else {
        // No fetching needed, just toggle the view state
        setChapterContent(current => current.map(v => ({
            ...v,
            isSimplified: newMode === 'simplified',
            overrideSimplified: undefined
        })));
      }
    }
  };


  const handleToggleCommentaryTranslation = async () => {
    const isTogglingToTranslated = !translateCommentaryToggle;
    const targetLang = isTogglingToTranslated ? (language === 'en' ? 'pt' : 'en') : language;
    const isCommentaryExpanded = viewMode === 'commentary' || viewMode === 'simplified';

    const versesNeedingTranslation = chapterContent.filter(v => {
        const isVisible = isCommentaryExpanded || v.isExpanded;
        if (!isVisible) return false;

        if (viewMode === 'simplified') {
            return !v.simplifiedCommentaries[targetLang] && !v.simplificationLoading.has(targetLang);
        }
        return !v.commentaries[targetLang] && !v.commentaryLoading.has(targetLang);
    });

    if (versesNeedingTranslation.length > 0) {
        generationController.current.isCancelled = false;
        if (isCommentaryExpanded) {
            setTranslationLoading(true);
            try {
                const chapterText = chapterContent.map(v => `v${v.number} ${v.text}`).join('\n');
                
                const commentaries = viewMode === 'simplified'
                    ? await getChapterVerseByVerseSimplifiedCommentary({ book, chapter, chapterText, language: targetLang })
                    : await getChapterVerseByVerseCommentary({ book, chapter, chapterText, language: targetLang });

                if (generationController.current.isCancelled) return;

                const commentaryMap = new Map<number, { commentary: StructuredCommentary; has_significant_difference: boolean }>();
                commentaries.forEach(item => commentaryMap.set(item.verse_number, {commentary: item.commentary, has_significant_difference: item.has_significant_difference}));
                
                setChapterContent(current => current.map(verse => {
                    const newCommentary = commentaryMap.get(verse.number);
                    if (!newCommentary) return verse;
                    
                    if (viewMode === 'simplified') {
                        return { ...verse, simplifiedCommentaries: { ...verse.simplifiedCommentaries, [targetLang]: newCommentary.commentary } };
                    }
                    return { ...verse, commentaries: { ...verse.commentaries, [targetLang]: newCommentary.commentary }, hasSignificantDifference: { ...verse.hasSignificantDifference, [targetLang]: newCommentary.has_significant_difference } };
                }));
            } catch (error) {
                if (!generationController.current.isCancelled) console.error("Failed to fetch all translated commentaries:", error);
            } finally {
                setTranslationLoading(false);
            }
        } else {
            // For individual verses
            for (const verse of versesNeedingTranslation) {
                if(generationController.current.isCancelled) break;
                setChapterContent(current => current.map(v => v.number === verse.number ? { ...v, commentaryLoading: new Set([...v.commentaryLoading, targetLang]) } : v));
                try {
                    const { commentary, has_significant_difference } = await getVerseCommentary({ book, chapter, verseNumber: verse.number, language: targetLang });
                    if (generationController.current.isCancelled) break;
                    setChapterContent(current => current.map(v => {
                        if (v.number === verse.number) {
                            return { ...v, commentaries: { ...v.commentaries, [targetLang]: commentary }, hasSignificantDifference: { ...v.hasSignificantDifference, [targetLang]: has_significant_difference } };
                        }
                        return v;
                    }));
                } catch (error) {
                    if (generationController.current.isCancelled) break;
                    console.error(`Failed to fetch translated commentary for verse ${verse.number}:`, error);
                } finally {
                   setChapterContent(current => current.map(v => v.number === verse.number ? { ...v, commentaryLoading: new Set([...v.commentaryLoading].filter(l => l !== targetLang)) } : v));
                }
            }
        }
    }
    
    setTranslateCommentaryToggle(isTogglingToTranslated);
  }

  const handleShowDifference = async (verseNumber: number) => {
    generationController.current.isCancelled = false;
    const commentaryLang = translateCommentaryToggle ? (language === 'en' ? 'pt' : 'en') : language;
    const verse = chapterContent.find(v => v.number === verseNumber);
    if (!verse) return;
    
    const isExpanding = !verse.isDifferenceExpanded;
    
    setChapterContent(current => current.map(v => 
      v.number === verseNumber ? { ...v, isDifferenceExpanded: isExpanding } : v
    ));
    
    if (isExpanding && !verse.differenceExplanation[commentaryLang]) {
       setChapterContent(current => current.map(v => v.number === verseNumber ? { ...v, differenceLoading: new Set([...v.differenceLoading, commentaryLang])} : v));

      try {
        const bibleVersionNameMap = {
          [BibleVersion.KJV]: "KJV 1769",
          [BibleVersion.ACF2011]: "ACF 2011",
          [BibleVersion.ACF2007]: "ACF 2007",
        };
        
        const isKjvSelected = version === BibleVersion.KJV;

        const version1Name = "KJV 1769";
        const version2Name = isKjvSelected ? "ACF 2011" : bibleVersionNameMap[version];

        const explanation = await getTranslationDifferenceExplanation({
          book, chapter, verseNumber, language: commentaryLang, version1Name, version2Name
        });
        if (generationController.current.isCancelled) return;
        setChapterContent(current => current.map(v => {
          if (v.number === verseNumber) {
            return { ...v, differenceExplanation: { ...v.differenceExplanation, [commentaryLang]: explanation } };
          }
          return v;
        }));
      } catch (error) {
        if (generationController.current.isCancelled) return;
        console.error("Failed to fetch difference explanation:", error);
      } finally {
        setChapterContent(current => current.map(v => v.number === verseNumber ? { ...v, differenceLoading: new Set([...v.differenceLoading].filter(l => l !== commentaryLang))} : v));
      }
    }
  };

  const handleSimplifyVerse = async (verseNumber: number, action: 'simplify' | 'revert') => {
    generationController.current.isCancelled = false;
    const commentaryLang = translateCommentaryToggle ? (language === 'en' ? 'pt' : 'en') : language;
    const verse = chapterContent.find(v => v.number === verseNumber);
    if (!verse) return;

    const isGlobalView = viewMode === 'commentary' || viewMode === 'simplified';

    // Set override state immediately for UI responsiveness of the button color
    if (isGlobalView) {
      setChapterContent(current => current.map(v =>
        v.number === verseNumber ? { ...v, overrideSimplified: action === 'simplify' } : v
      ));
    }

    if (action === 'simplify') {
      // If simplified version already exists, just toggle state and scroll
      if (verse.simplifiedCommentaries[commentaryLang]) {
        if (!isGlobalView) {
          setChapterContent(current => current.map(v => v.number === verseNumber ? { ...v, isSimplified: true, overrideSimplified: undefined } : v));
        }
        setVerseToScrollTo(verseNumber);
        return;
      }

      // Fetch simplified version
      const commentaryToSimplify = verse.commentaries[commentaryLang];
      if (!commentaryToSimplify) { // Should not happen if button is enabled, but good to check
         console.error("Cannot simplify: original commentary not found.");
         if(isGlobalView) setChapterContent(current => current.map(v => v.number === verseNumber ? { ...v, overrideSimplified: undefined } : v)); // revert override
         return;
      }

      setChapterContent(current => current.map(v => v.number === verseNumber ? { ...v, simplificationLoading: new Set([...v.simplificationLoading, commentaryLang]) } : v));
      try {
        const simplifiedText = await simplifyCommentary(commentaryToSimplify, commentaryLang);
        if (generationController.current.isCancelled) return;

        setChapterContent(current => current.map(v => {
          if (v.number === verseNumber) {
            return {
              ...v,
              simplifiedCommentaries: { ...v.simplifiedCommentaries, [commentaryLang]: simplifiedText },
              isSimplified: !isGlobalView ? true : v.isSimplified,
              overrideSimplified: isGlobalView ? true : undefined,
            };
          }
          return v;
        }));
        setVerseToScrollTo(verseNumber);
      } catch (error) {
         if (!generationController.current.isCancelled) console.error(`Error simplifying commentary for verse ${verseNumber}:`, error);
      } finally {
         if (!generationController.current.isCancelled) {
           setChapterContent(current => current.map(v => v.number === verseNumber ? { ...v, simplificationLoading: new Set([...v.simplificationLoading].filter(l => l !== commentaryLang)) } : v));
         }
      }

    } else { // action === 'revert'
      if (!isGlobalView) {
         setChapterContent(current => current.map(v => v.number === verseNumber ? { ...v, isSimplified: false, overrideSimplified: undefined } : v));
      }

      // If original doesn't exist, we must fetch it.
      if (!verse.commentaries[commentaryLang]) {
        setChapterContent(current => current.map(v => v.number === verseNumber ? { ...v, commentaryLoading: new Set([...v.commentaryLoading, commentaryLang]) } : v));
        try {
          const response = await getVerseCommentary({ book, chapter, verseNumber, language: commentaryLang });
          if (generationController.current.isCancelled) return;
          setChapterContent(current => current.map(v => {
            if (v.number === verseNumber) {
              return {
                ...v,
                commentaries: { ...v.commentaries, [commentaryLang]: response.commentary },
                hasSignificantDifference: { ...v.hasSignificantDifference, [commentaryLang]: response.has_significant_difference },
                isSimplified: false,
                overrideSimplified: isGlobalView ? false : undefined,
              };
            }
            return v;
          }));
        } catch (e) {
          console.error("Failed to fetch original commentary for revert:", e);
        } finally {
          setChapterContent(current => current.map(v => v.number === verseNumber ? { ...v, commentaryLoading: new Set([...v.commentaryLoading].filter(l => l !== commentaryLang)) } : v));
        }
      }
    }
  };

  const handleToggleCrossReferences = async (verseNumber: number) => {
    generationController.current.isCancelled = false;
    const commentaryLang = translateCommentaryToggle ? (language === 'en' ? 'pt' : 'en') : language;
    
    const verse = chapterContent.find(v => v.number === verseNumber);
    if (!verse) return;

    const isShowing = !verse.isCrossRefsVisible;

    // If showing and the commentary is already expanded, schedule a scroll.
    if (isShowing && verse.isExpanded) {
        setScrollToRef(verseNumber);
    }

    const needsFetching = isShowing && !verse.crossReferences[commentaryLang];

    // Update visibility and loading state
    setChapterContent(current => current.map(v => {
        if (v.number === verseNumber) {
            return {
                ...v,
                isCrossRefsVisible: isShowing,
                crossRefsLoading: needsFetching ? new Set([...v.crossRefsLoading, commentaryLang]) : v.crossRefsLoading,
            };
        }
        return v;
    }));

    if (needsFetching) {
        try {
            const refs = await getVerseCrossReferences({
                book,
                chapter,
                verseNumber,
                verseText: verse.text,
                language: commentaryLang,
            });

            if (generationController.current.isCancelled) return;
            
            setChapterContent(current => current.map(v => {
                if (v.number === verseNumber) {
                    return {
                        ...v,
                        crossReferences: { ...v.crossReferences, [commentaryLang]: refs },
                    };
                }
                return v;
            }));
        } catch (error) {
            if (!generationController.current.isCancelled) {
                console.error("Failed to fetch cross-references:", error);
            }
        } finally {
            if (!generationController.current.isCancelled) {
                setChapterContent(current => current.map(v => {
                    if (v.number === verseNumber) {
                        const newLoadingSet = new Set(v.crossRefsLoading);
                        newLoadingSet.delete(commentaryLang);
                        return { ...v, crossRefsLoading: newLoadingSet };
                    }
                    return v;
                }));
            }
        }
    }
  };

  const handleNavigateChapter = (direction: 'prev' | 'next') => {
    const currentBookIndex = BIBLE_BOOKS.findIndex(b => b.name === book);
    if (currentBookIndex === -1) return;
    const currentBookData = BIBLE_BOOKS[currentBookIndex];

    if (direction === 'prev') {
      if (chapter > 1) {
        handleSetChapter(chapter - 1);
      } else if (currentBookIndex > 0) {
        const prevBook = BIBLE_BOOKS[currentBookIndex - 1];
        setBook(prevBook.name);
        setChapter(prevBook.chapters);
        resetChapterViewModes(true);
      }
    } else { // next
      if (chapter < currentBookData.chapters) {
        handleSetChapter(chapter + 1);
      } else if (currentBookIndex < BIBLE_BOOKS.length - 1) {
        const nextBook = BIBLE_BOOKS[currentBookIndex + 1];
        setBook(nextBook.name);
        setChapter(1);
        resetChapterViewModes(true);
      }
    }
  };

  const handleToggleThemesModal = async () => {
    if (isThemesModalOpen) {
      setIsThemesModalOpen(false);
      return;
    }

    setIsThemesModalOpen(true);
    const initialLang = language;
    setThemesDisplayLanguage(initialLang);

    if (!commonThemes[initialLang]) {
      setThemesLoading(prev => new Set(prev).add(initialLang));
      try {
        const chapterText = chapterContent.map(v => `v${v.number} ${v.text}`).join('\n');
        const themes = await getCommonThemes({ book, chapter, chapterText, language: initialLang });
        setCommonThemes(prev => ({ ...prev, [initialLang]: themes }));
      } catch (error) {
        console.error("Failed to fetch common themes:", error);
      } finally {
        setThemesLoading(prev => {
          const newSet = new Set(prev);
          newSet.delete(initialLang);
          return newSet;
        });
      }
    }
  };

  const handleTranslateThemes = async () => {
    const targetLang = themesDisplayLanguage === 'en' ? 'pt' : 'en';
    setThemesDisplayLanguage(targetLang);

    if (!commonThemes[targetLang] && !themesLoading.has(targetLang)) {
      setThemesLoading(prev => new Set(prev).add(targetLang));
      try {
        const chapterText = chapterContent.map(v => `v${v.number} ${v.text}`).join('\n');
        const themes = await getCommonThemes({ book, chapter, chapterText, language: targetLang });
        setCommonThemes(prev => ({ ...prev, [targetLang]: themes }));
      } catch (error) {
        console.error("Failed to fetch translated themes:", error);
      } finally {
        setThemesLoading(prev => {
          const newSet = new Set(prev);
          newSet.delete(targetLang);
          return newSet;
        });
      }
    }
  };

  const handleToggleSummaryModal = async () => {
    if (isSummaryModalOpen) {
      setIsSummaryModalOpen(false);
      return;
    }

    setIsSummaryModalOpen(true);
    const initialLang = language;
    setSummaryDisplayLanguage(initialLang);

    if (!chapterSummary[initialLang]) {
      setSummaryLoading(prev => new Set(prev).add(initialLang));
      try {
        const chapterText = chapterContent.map(v => `v${v.number} ${v.text}`).join('\n');
        const summary = await getChapterSummary({ book, chapter, chapterText, language: initialLang });
        setChapterSummary(prev => ({ ...prev, [initialLang]: summary }));
      } catch (error) {
        console.error("Failed to fetch chapter summary:", error);
      } finally {
        setSummaryLoading(prev => {
          const newSet = new Set(prev);
          newSet.delete(initialLang);
          return newSet;
        });
      }
    }
  };

  const handleTranslateSummary = async () => {
    const targetLang = summaryDisplayLanguage === 'en' ? 'pt' : 'en';
    setSummaryDisplayLanguage(targetLang);

    if (!chapterSummary[targetLang] && !summaryLoading.has(targetLang)) {
      setSummaryLoading(prev => new Set(prev).add(targetLang));
      try {
        const chapterText = chapterContent.map(v => `v${v.number} ${v.text}`).join('\n');
        const summary = await getChapterSummary({ book, chapter, chapterText, language: targetLang });
        setChapterSummary(prev => ({ ...prev, [targetLang]: summary }));
      } catch (error) {
        console.error("Failed to fetch translated summary:", error);
      } finally {
        setSummaryLoading(prev => {
          const newSet = new Set(prev);
          newSet.delete(targetLang);
          return newSet;
        });
      }
    }
  };
  
  const fetchWordDefinition = useCallback(async (word: string, contextSentence: string, lang: Language) => {
    generationController.current.isCancelled = false;
    setWordDefinitionState(prev => ({ 
      ...prev, 
      loading: new Set(prev.loading).add(lang),
      wasCancelled: false,
    }));
    try {
      const bibleVersionName = version.toString();
      const definition = await getWordDefinition({
        word,
        contextSentence,
        bibleVersion: bibleVersionName,
        language: lang
      });
      if (generationController.current.isCancelled) return;
      setWordDefinitionState(prev => ({
        ...prev,
        definition: { ...prev.definition, [lang]: definition },
        loading: new Set([...prev.loading].filter(l => l !== lang)),
      }));
    } catch (error) {
      if (!generationController.current.isCancelled) {
        console.error("Failed to fetch word definition:", error);
      }
    } finally {
      if (!generationController.current.isCancelled) {
        setWordDefinitionState(prev => ({
          ...prev,
          loading: new Set([...prev.loading].filter(l => l !== lang)),
        }));
      }
    }
  }, [version]);

  const handleWordClick = (word: string, verseNumber: number, contextSentence: string) => {
    setWordDefinitionState({
      isOpen: true,
      word,
      verseRef: `${book} ${chapter}:${verseNumber}`,
      definition: { en: null, pt: null },
      loading: new Set(),
      displayLanguage: language,
      wasCancelled: false,
    });
    fetchWordDefinition(word, contextSentence, language);
  };
  
  const handleCloseWordDefinition = () => {
    setWordDefinitionState(prev => ({ ...prev, isOpen: false }));
  };
  
  const handleTranslateWordDefinition = useCallback(async () => {
    const { word, verseRef, definition, displayLanguage } = wordDefinitionState;
    if (!word || !verseRef) return;
  
    const targetLang = displayLanguage === 'en' ? 'pt' : 'en';
    setWordDefinitionState(prev => ({ ...prev, displayLanguage: targetLang }));
  
    if (!definition[targetLang]) {
      const contextSentence = chapterContent.find(v => v.number === parseInt(verseRef.split(':')[1]))?.text || '';
      fetchWordDefinition(word, contextSentence, targetLang);
    }
  }, [wordDefinitionState, chapterContent, fetchWordDefinition]);

  const handleRetryWordDefinition = () => {
    const { word, verseRef, displayLanguage } = wordDefinitionState;
     if (!word || !verseRef) return;
    const contextSentence = chapterContent.find(v => v.number === parseInt(verseRef.split(':')[1]))?.text || '';
    fetchWordDefinition(word, contextSentence, displayLanguage);
  };

  const handleShowCrossRefPopup = useCallback(async (reference: string, targetElement: HTMLElement) => {
    if (crossRefTimeoutRef.current) {
        clearTimeout(crossRefTimeoutRef.current);
    }
    const rect = targetElement.getBoundingClientRect();
    const position = {
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
    };

    setCrossRefPopupState({
        isOpen: true,
        reference,
        position,
        loading: true,
        content: null,
        error: null,
    });

    try {
        const text = await fetchCrossReferenceText(reference, version);
        setCrossRefPopupState(prev => ({ ...prev, loading: false, content: text, error: null }));
    } catch (e) {
        setCrossRefPopupState(prev => ({ ...prev, loading: false, error: t.crossRefFetchError }));
    }
  }, [version, t.crossRefFetchError]);

  const handleHideCrossRefPopup = useCallback(() => {
    crossRefTimeoutRef.current = window.setTimeout(() => {
        setCrossRefPopupState(prev => ({ ...prev, isOpen: false }));
    }, 300);
  }, []);

  const handleVerseSelectionToggle = (verseNumber: number) => {
    setManuallySelectedVerses(prev => {
        const isSelected = prev.includes(verseNumber);
        if (isSelected) {
            return prev.filter(v => v !== verseNumber);
        } else {
            return [...prev, verseNumber].sort((a, b) => a - b);
        }
    });
  };

  const handleClearVerseSelection = () => {
    setManuallySelectedVerses([]);
  };

  const handleCopySelectedVerses = () => {
    const versesToCopy = chapterContent
        .filter(v => manuallySelectedVerses.includes(v.number))
        .map(v => `${v.number}. ${v.text}`)
        .join('\n');
    
    if (versesToCopy) {
        navigator.clipboard.writeText(versesToCopy).catch(err => {
            console.error('Failed to copy verses: ', err);
            alert('Failed to copy verses.');
        });
    }
  };

  const currentBookIndex = BIBLE_BOOKS.findIndex(b => b.name === book);
  const currentBookData = BIBLE_BOOKS[currentBookIndex] || BIBLE_BOOKS[0];
  const testament = currentBookIndex !== -1 && currentBookIndex <= 38 ? t.oldTestament : t.newTestament;
  const isPrevDisabled = currentBookIndex === 0 && chapter === 1;
  const isNextDisabled = currentBookIndex === BIBLE_BOOKS.length - 1 && chapter === BIBLE_BOOKS[currentBookIndex].chapters;
  const displayBookName = language === 'pt' ? currentBookData.pt_name : currentBookData.name;

  let currentVersionDisplayName = '';
  switch (version) {
    case BibleVersion.KJV:
      currentVersionDisplayName = t.kjv1769;
      break;
    case BibleVersion.ACF2011:
      currentVersionDisplayName = t.acf2011;
      break;
    case BibleVersion.ACF2007:
      currentVersionDisplayName = t.acf2007;
      break;
  }
  
  const handlePanelToggle = (panel: ActiveSermonPanel) => {
    if (activeSermonPanel === panel) {
      setActiveSermonPanel(null);
    } else {
      setActiveSermonPanel(panel);
    }
  };
  
  const handleScrollToggle = () => {
    if (lastInteractedSermonPanel === 'editor') {
        if (activeSermonPanel && sermonActivePanelRef.current) {
            sermonActivePanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setLastInteractedSermonPanel('panel');
        }
    } else if (lastInteractedSermonPanel === 'panel') {
        if (sermonEditorRef.current) {
            sermonEditorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setLastInteractedSermonPanel('editor');
        }
    }
  };

  const handleSetMode = (newMode: AppMode) => {
    if (mode === newMode) {
      // If already in sermon mode and clicking the button again, maximize the editor.
      if (newMode === 'sermon') {
        setIsSermonEditorMinimized(false);
      }
      return;
    }

    if (newMode === 'sermon') {
      // Switching to Sermon mode
      setReaderMinimizedBeforeSermonMode(isReaderMinimized);
      if (!isReaderMinimized) {
        setIsReaderMinimized(true);
      }
      setIsSermonEditorMinimized(false);
    } else if (newMode === 'study') {
      // Switching to Study mode
      setIsReaderMinimized(readerMinimizedBeforeSermonMode);
      setIsSermonEditorMinimized(true);
    }
    
    setMode(newMode);
  };
  
  // --- SERMON BUILDER HANDLERS ---
  const translateCanonicalReference = (canonicalRef: string, bibleVersion: BibleVersion): string => {
    const isPt = bibleVersion.startsWith('ACF');

    if (!isPt) return canonicalRef; // Return original if English version (KJV)

    const bookNamesForRegex = BIBLE_BOOKS.map(b => b.name.replace(/\s/g, '\\s')).join('|');
    const refRegex = new RegExp(`^(${bookNamesForRegex})\\s+(.*)$`, 'i');
    
    const match = canonicalRef.match(refRegex);
    if (!match) return canonicalRef; // Return original if format is unexpected

    const [, bookName, restOfRef] = match;
    const bookData = BIBLE_BOOKS.find(b => b.name.toLowerCase() === bookName.toLowerCase());

    if (bookData) {
        return `${bookData.pt_name} ${restOfRef}`;
    }

    return canonicalRef; // Fallback
  };

  const handleSermonInputChange = (field: keyof Omit<SermonDataType, 'body'>) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSermonData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSermonBodyItemChange = (id: string, value: string, field?: keyof PointContent | 'references') => {
    setSermonData(prev => ({
        ...prev,
        body: prev.body.map(item => {
            if (item.id !== id) {
              return item;
            }

            if (item.type === 'point' && (field === 'title' || field === 'explanation')) {
                return { ...item, content: { ...item.content, [field]: value } };
            }
            if (item.type === 'scripture' && field === 'references') {
                return { ...item, content: { ...item.content, references: value } };
            }
            if (item.type === 'illustration' && field === undefined) {
                return { ...item, content: value };
            }
            
            return item;
        }),
    }));
  };

  const addSermonBodyItem = (type: 'point' | 'scripture' | 'illustration') => {
    const id = Date.now().toString();
    let newItem: SermonBodyItem;

    switch (type) {
      case 'point':
        newItem = { id, type: 'point', content: { title: '', explanation: '' } };
        break;
      case 'scripture':
        newItem = { id, type: 'scripture', content: { references: '' } };
        break;
      case 'illustration':
        newItem = { id, type: 'illustration', content: '' };
        break;
    }
    
    setSermonData(prev => ({ ...prev, body: [...prev.body, newItem] }));
  };


  const removeSermonBodyItem = (id: string) => {
    setSermonData(prev => ({ ...prev, body: prev.body.filter(item => item.id !== id) }));
  };
  
  const moveSermonBodyItem = (index: number, direction: 'up' | 'down') => {
    const newBody = [...sermonData.body];
    const item = newBody[index];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newBody.length) return;
    newBody[index] = newBody[swapIndex];
    newBody[swapIndex] = item;
    setSermonData(prev => ({ ...prev, body: newBody }));
  };

  const handleFetchInlineScriptures = async (itemId: string) => {
      const item = sermonData.body.find(i => i.id === itemId);
      if (!item || item.type !== 'scripture' || !item.content.references) return;

      try {
          const canonicalRefs = await parseScriptureReferences(item.content.references);
          if (canonicalRefs.length === 0) {
              const notFoundMessage = `<span class="text-yellow-400">Could not identify any valid scripture references to fetch.</span>`;
              setSermonData(prev => ({
                  ...prev,
                  body: prev.body.map(i => 
                      i.id === itemId && i.type === 'scripture'
                          ? { ...i, content: { ...i.content, fetchedText: notFoundMessage } }
                          : i
                  )
              }));
              return;
          }

          const fetchedTexts = await Promise.all(
              canonicalRefs.map(ref => fetchCrossReferenceText(ref, version))
          );
          
          const combinedText = canonicalRefs.map((ref, index) => {
              const translatedRef = translateCanonicalReference(ref, version);
              return `<strong>${translatedRef}</strong><br />${fetchedTexts[index]}`;
          }).join('<br /><br />');

          setSermonData(prev => ({
              ...prev,
              body: prev.body.map(i => 
                  i.id === itemId && i.type === 'scripture'
                      ? { ...i, content: { ...i.content, fetchedText: combinedText } }
                      : i
              )
          }));
      } catch (error) {
          console.error("Error fetching inline scriptures:", error);
          const errorMessage = error instanceof Error ? error.message : "Failed to fetch verses.";
          setSermonData(prev => ({
              ...prev,
              body: prev.body.map(i => 
                  i.id === itemId && i.type === 'scripture'
                      ? { ...i, content: { ...i.content, fetchedText: `<span class="text-red-400">${errorMessage}</span>` } }
                      : i
              )
          }));
      }
  };

  const handleGenerateSermon = async () => {
    setIsSermonLoading(true);
    setGeneratedSermonOutline(null);

    let dataForGeneration = JSON.parse(JSON.stringify(sermonData));

    if (verseExpansionMode === 'all') {
        const expandedBody = await Promise.all(dataForGeneration.body.map(async (item: SermonBodyItem) => {
            if (item.type === 'scripture' && item.content.references) {
                try {
                    const canonicalRefs = await parseScriptureReferences(item.content.references);
                    if (canonicalRefs.length > 0) {
                        const fetchedTexts = await Promise.all(
                            canonicalRefs.map(ref => fetchCrossReferenceText(ref, version))
                        );
                        
                        const combinedText = canonicalRefs.map((ref, index) => {
                            const translatedRef = translateCanonicalReference(ref, version);
                            return `<strong>${translatedRef}</strong><br />${fetchedTexts[index]}`;
                        }).join('<br /><br />');

                        item.content.fetchedText = combinedText;
                    }
                } catch (error) {
                    console.error(`Error fetching verses for ${item.content.references}:`, error);
                    const errorMessage = error instanceof Error ? error.message : "Failed to fetch";
                    item.content.fetchedText = `<span class="text-red-400">Error: ${errorMessage}</span>`;
                }
            }
            return item;
        }));
        dataForGeneration.body = expandedBody;
    } else if (verseExpansionMode === 'none') {
        dataForGeneration.body.forEach((item: SermonBodyItem) => {
            if (item.type === 'scripture' && item.content.fetchedText) {
                delete item.content.fetchedText;
            }
        });
    }

    try {
        const outlineHtml = await generateSermonOutline(dataForGeneration, language, isSermonColorEnabled);
        setGeneratedSermonOutline(outlineHtml);
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setGeneratedSermonOutline(`<div class="text-red-400 p-4 bg-red-900/20 rounded-md"><h3>Error</h3><p>${errorMessage}</p></div>`);
    } finally {
        setIsSermonLoading(false);
    }
  };


  const confirmClearSermon = () => {
    setSermonData({
        title: '', bibleText: '', introduction: '', thesis: '',
        body: [], conclusion: '', verdict: ''
    });
    setGeneratedSermonOutline(null);
    setIsSermonClearModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <Header 
        language={language}
        setLanguage={setLanguage}
        t={t}
      />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 flex-grow pb-36 lg:pb-8">
        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-8 py-8">
            <div className="flex flex-col gap-8">
                <ChatInterface
                    onAskQuestion={handleAskQuestion}
                    onResetChat={handleResetChat}
                    chatHistory={chatHistory}
                    translatedChatHistory={translatedChatHistory}
                    loading={answerLoading}
                    t={t}
                    onNavigateToReference={handleNavigateToReference}
                    qaTranslated={qaTranslated}
                    onToggleQaTranslation={handleToggleQaTranslation}
                    qaTranslationLoading={qaTranslationLoading}
                    uiLanguage={language}
                    isMinimized={isChatMinimized}
                    onToggleMinimize={() => setIsChatMinimized(p => !p)}
                />
                <BibleSelector
                  version={version}
                  setVersion={handleSetVersion}
                  book={book}
                  setBook={handleSetBook}
                  chapter={chapter}
                  setChapter={handleSetChapter}
                  t={t}
                  language={language}
                  isPulsing={false}
                  isMinimized={isSelectorMinimized}
                  onToggleMinimize={() => setIsSelectorMinimized(p => !p)}
                />
                <div className="flex-grow min-h-0">
                    <ChapterDisplay
                        loading={chapterLoading}
                        error={chapterError}
                        content={chapterContent}
                        displayBookName={displayBookName}
                        chapter={chapter}
                        onToggleVerse={handleToggleVerse}
                        t={t}
                        highlightedVerses={highlightedVerses}
                        manuallySelectedVerses={manuallySelectedVerses}
                        onVerseSelectionToggle={handleVerseSelectionToggle}
                        verseToScrollTo={verseToScrollTo}
                        onScrollComplete={handleScrollComplete}
                        scrollToRef={scrollToRef}
                        onScrollToRefComplete={onScrollToRefComplete}
                        viewMode={viewMode}
                        chapterOutline={chapterOutline[language]}
                        outlineLoading={outlineLoading}
                        onSetViewMode={handleSetViewMode}
                        expandAllLoading={expandAllLoading}
                        onToggleCommentaryTranslation={handleToggleCommentaryTranslation}
                        translateCommentaryToggle={translateCommentaryToggle}
                        translationLoading={translationLoading}
                        onShowDifference={handleShowDifference}
                        onCancelGeneration={onCancelGeneration}
                        uiLanguage={language}
                        currentVersionName={currentVersionDisplayName}
                        testament={testament}
                        onNavigateChapter={handleNavigateChapter}
                        isPrevDisabled={isPrevDisabled}
                        isNextDisabled={isNextDisabled}
                        onToggleThemesModal={handleToggleThemesModal}
                        onToggleSummaryModal={handleToggleSummaryModal}
                        onSimplifyVerse={handleSimplifyVerse}
                        onToggleCrossReferences={handleToggleCrossReferences}
                        onWordClick={handleWordClick}
                        isWordDefinitionOpen={wordDefinitionState.isOpen}
                        onShowCrossRefPopup={handleShowCrossRefPopup}
                        onHideCrossRefPopup={handleHideCrossRefPopup}
                        onNavigateToReference={handleNavigateToReference}
                        onGoToSelector={handleGoToSelector}
                        isMinimized={isReaderMinimized}
                        onToggleMinimize={() => setIsReaderMinimized(p => !p)}
                    />
                </div>
            </div>
            <div className="flex flex-col min-h-0">
                <SermonEditor
                    t={t}
                    isMinimized={isSermonEditorMinimized}
                    onToggleMinimize={() => setIsSermonEditorMinimized(p => !p)}
                    sermonType={sermonType}
                    onSermonTypeChange={setSermonType}
                    sermonData={sermonData}
                    generatedOutline={generatedSermonOutline}
                    isLoading={isSermonLoading}
                    isClearModalOpen={isSermonClearModalOpen}
                    onInputChange={handleSermonInputChange}
                    onBodyItemChange={handleSermonBodyItemChange}
                    onAddBodyItem={addSermonBodyItem}
                    onRemoveBodyItem={removeSermonBodyItem}
                    onMoveBodyItem={moveSermonBodyItem}
                    onGenerate={handleGenerateSermon}
                    onClear={() => setIsSermonClearModalOpen(true)}
                    onConfirmClear={confirmClearSermon}
                    onCloseClearModal={() => setIsSermonClearModalOpen(false)}
                    verseExpansionMode={verseExpansionMode}
                    onVerseExpansionModeChange={setVerseExpansionMode}
                    onFetchInlineScriptures={handleFetchInlineScriptures}
                    isSermonColorEnabled={isSermonColorEnabled}
                    onSermonColorEnabledChange={setIsSermonColorEnabled}
                />
            </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden h-full overflow-x-hidden">
            <div 
              className="flex transition-transform duration-700 ease-in-out h-full"
              style={{ width: '200%', transform: mode === 'sermon' ? 'translateX(-50%)' : 'translateX(0)' }}
            >
              {/* Study Mode View */}
              <div className="w-1/2 flex-shrink-0 h-full flex flex-col pt-8">
                <div className="px-0 mb-8 flex-shrink-0">
                    <ChatInterface
                      onAskQuestion={handleAskQuestion}
                      onResetChat={handleResetChat}
                      chatHistory={chatHistory}
                      translatedChatHistory={translatedChatHistory}
                      loading={answerLoading}
                      t={t}
                      onNavigateToReference={handleNavigateToReference}
                      qaTranslated={qaTranslated}
                      onToggleQaTranslation={handleToggleQaTranslation}
                      qaTranslationLoading={qaTranslationLoading}
                      uiLanguage={language}
                      isMinimized={isChatMinimized}
                      onToggleMinimize={() => setIsChatMinimized(p => !p)}
                    />
                </div>
                <div className="px-0 mb-8 flex-shrink-0">
                    <BibleSelector
                      version={version}
                      setVersion={handleSetVersion}
                      book={book}
                      setBook={handleSetBook}
                      chapter={chapter}
                      setChapter={handleSetChapter}
                      t={t}
                      language={language}
                      isPulsing={isSelectorPulsing}
                      isMinimized={isSelectorMinimized}
                      onToggleMinimize={() => setIsSelectorMinimized(p => !p)}
                    />
                </div>
                <div className="flex-grow min-h-0">
                  <ChapterDisplay
                      loading={chapterLoading}
                      error={chapterError}
                      content={chapterContent}
                      displayBookName={displayBookName}
                      chapter={chapter}
                      onToggleVerse={handleToggleVerse}
                      t={t}
                      highlightedVerses={highlightedVerses}
                      manuallySelectedVerses={manuallySelectedVerses}
                      onVerseSelectionToggle={handleVerseSelectionToggle}
                      verseToScrollTo={verseToScrollTo}
                      onScrollComplete={handleScrollComplete}
                      scrollToRef={scrollToRef}
                      onScrollToRefComplete={onScrollToRefComplete}
                      viewMode={viewMode}
                      chapterOutline={chapterOutline[language]}
                      outlineLoading={outlineLoading}
                      onSetViewMode={handleSetViewMode}
                      expandAllLoading={expandAllLoading}
                      onToggleCommentaryTranslation={handleToggleCommentaryTranslation}
                      translateCommentaryToggle={translateCommentaryToggle}
                      translationLoading={translationLoading}
                      onShowDifference={handleShowDifference}
                      onCancelGeneration={onCancelGeneration}
                      uiLanguage={language}
                      currentVersionName={currentVersionDisplayName}
                      testament={testament}
                      onNavigateChapter={handleNavigateChapter}
                      isPrevDisabled={isPrevDisabled}
                      isNextDisabled={isNextDisabled}
                      onToggleThemesModal={handleToggleThemesModal}
                      onToggleSummaryModal={handleToggleSummaryModal}
                      onSimplifyVerse={handleSimplifyVerse}
                      onToggleCrossReferences={handleToggleCrossReferences}
                      onWordClick={handleWordClick}
                      isWordDefinitionOpen={wordDefinitionState.isOpen}
                      onShowCrossRefPopup={handleShowCrossRefPopup}
                      onHideCrossRefPopup={handleHideCrossRefPopup}
                      onNavigateToReference={handleNavigateToReference}
                      onGoToSelector={handleGoToSelector}
                      isMinimized={isReaderMinimized}
                      onToggleMinimize={() => setIsReaderMinimized(p => !p)}
                  />
                </div>
              </div>

              {/* Sermon Mode View */}
              <div className="w-1/2 flex-shrink-0 h-full flex flex-col pt-8">
                {activeSermonPanel && (
                  <div ref={sermonActivePanelRef} className="mb-8 animate-fade-in-down" onClick={() => setLastInteractedSermonPanel('panel')}>
                      <div className="bg-slate-800 rounded-lg shadow-md flex flex-col max-h-[60vh] overflow-hidden relative">
                          <button
                            onClick={() => setActiveSermonPanel(null)}
                            className="absolute top-3 right-3 z-10 p-1 rounded-full text-slate-400 bg-slate-900/50 hover:bg-slate-700 hover:text-white transition-colors"
                            aria-label="Close panel"
                          >
                            <CloseIcon className="w-6 h-6" />
                          </button>
                          <div className="overflow-y-auto">
                              {activeSermonPanel === 'chat' && <ChatInterface isFloating onAskQuestion={handleAskQuestion} onResetChat={handleResetChat} chatHistory={chatHistory} translatedChatHistory={translatedChatHistory} loading={answerLoading} t={t} onNavigateToReference={handleNavigateToReference} qaTranslated={qaTranslated} onToggleQaTranslation={handleToggleQaTranslation} qaTranslationLoading={qaTranslationLoading} uiLanguage={language} isMinimized={false} onToggleMinimize={() => {}} />}
                              {activeSermonPanel === 'selector' && <BibleSelector isFloating version={version} setVersion={handleSetVersion} book={book} setBook={handleSetBook} chapter={chapter} setChapter={handleSetChapter} t={t} language={language} isPulsing={false} isMinimized={false} onToggleMinimize={() => {}} />}
                              {activeSermonPanel === 'reader' && (
                                  <ChapterDisplay
                                      isFloating
                                      loading={chapterLoading}
                                      error={chapterError}
                                      content={chapterContent}
                                      displayBookName={displayBookName}
                                      chapter={chapter}
                                      onToggleVerse={handleToggleVerse}
                                      t={t}
                                      highlightedVerses={highlightedVerses}
                                      manuallySelectedVerses={manuallySelectedVerses}
                                      onVerseSelectionToggle={handleVerseSelectionToggle}
                                      verseToScrollTo={verseToScrollTo}
                                      onScrollComplete={handleScrollComplete}
                                      scrollToRef={scrollToRef}
                                      onScrollToRefComplete={onScrollToRefComplete}
                                      viewMode={viewMode}
                                      chapterOutline={chapterOutline[language]}
                                      outlineLoading={outlineLoading}
                                      onSetViewMode={handleSetViewMode}
                                      expandAllLoading={expandAllLoading}
                                      onToggleCommentaryTranslation={handleToggleCommentaryTranslation}
                                      translateCommentaryToggle={translateCommentaryToggle}
                                      translationLoading={translationLoading}
                                      onShowDifference={handleShowDifference}
                                      onCancelGeneration={onCancelGeneration}
                                      uiLanguage={language}
                                      currentVersionName={currentVersionDisplayName}
                                      testament={testament}
                                      onNavigateChapter={handleNavigateChapter}
                                      isPrevDisabled={isPrevDisabled}
                                      isNextDisabled={isNextDisabled}
                                      onToggleThemesModal={handleToggleThemesModal}
                                      onToggleSummaryModal={handleToggleSummaryModal}
                                      onSimplifyVerse={handleSimplifyVerse}
                                      onToggleCrossReferences={handleToggleCrossReferences}
                                      onWordClick={handleWordClick}
                                      isWordDefinitionOpen={wordDefinitionState.isOpen}
                                      onShowCrossRefPopup={handleShowCrossRefPopup}
                                      onHideCrossRefPopup={handleHideCrossRefPopup}
                                      onNavigateToReference={handleNavigateToReference}
                                      onGoToSelector={handleGoToSelector}
                                      isMinimized={false}
                                      onToggleMinimize={() => {}}
                                  />
                              )}
                          </div>
                      </div>
                  </div>
                )}
                <div ref={sermonEditorRef} onClick={() => setLastInteractedSermonPanel('editor')}>
                    <SermonEditor
                      t={t}
                      isMinimized={isSermonEditorMinimized}
                      onToggleMinimize={() => setIsSermonEditorMinimized(p => !p)}
                      sermonType={sermonType}
                      onSermonTypeChange={setSermonType}
                      sermonData={sermonData}
                      generatedOutline={generatedSermonOutline}
                      isLoading={isSermonLoading}
                      isClearModalOpen={isSermonClearModalOpen}
                      onInputChange={handleSermonInputChange}
                      onBodyItemChange={handleSermonBodyItemChange}
                      onAddBodyItem={addSermonBodyItem}
                      onRemoveBodyItem={removeSermonBodyItem}
                      onMoveBodyItem={moveSermonBodyItem}
                      onGenerate={handleGenerateSermon}
                      onClear={() => setIsSermonClearModalOpen(true)}
                      onConfirmClear={confirmClearSermon}
                      onCloseClearModal={() => setIsSermonClearModalOpen(false)}
                      verseExpansionMode={verseExpansionMode}
                      onVerseExpansionModeChange={setVerseExpansionMode}
                      onFetchInlineScriptures={handleFetchInlineScriptures}
                      isSermonColorEnabled={isSermonColorEnabled}
                      onSermonColorEnabledChange={setIsSermonColorEnabled}
                    />
                </div>
              </div>
            </div>
        </div>
      </main>

      <ThemesModal
        isOpen={isThemesModalOpen}
        onClose={handleToggleThemesModal}
        title={t.commonThemesTitle}
        themes={commonThemes[themesDisplayLanguage]}
        loading={themesLoading.has(themesDisplayLanguage)}
        onTranslate={handleTranslateThemes}
        t={t}
      />

      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={handleToggleSummaryModal}
        title={t.summaryTitle}
        summary={chapterSummary[summaryDisplayLanguage]}
        loading={summaryLoading.has(summaryDisplayLanguage)}
        onTranslate={handleTranslateSummary}
        t={t}
        displayBookName={displayBookName}
        chapter={chapter}
        currentLanguage={summaryDisplayLanguage}
      />

      <WordDefinitionPopup
        state={wordDefinitionState}
        onClose={handleCloseWordDefinition}
        onCancel={onCancelGeneration}
        onRetry={handleRetryWordDefinition}
        onTranslate={handleTranslateWordDefinition}
        t={t}
      />

      <CrossRefPopup
        state={crossRefPopupState}
        onNavigate={handleNavigateToReference}
        onMouseEnter={() => { if (crossRefTimeoutRef.current) clearTimeout(crossRefTimeoutRef.current); }}
        onMouseLeave={handleHideCrossRefPopup}
        t={t}
      />

      <ModeSwitcher
        mode={mode}
        setMode={handleSetMode}
        activePanel={activeSermonPanel}
        setActivePanel={handlePanelToggle}
        onScrollToggle={handleScrollToggle}
        t={t}
      />

      {manuallySelectedVerses.length > 0 && mode === 'study' && !isReaderMinimized && !chapterLoading && (
        <SelectionToolbar
          selectedCount={manuallySelectedVerses.length}
          onCopy={handleCopySelectedVerses}
          onClear={handleClearVerseSelection}
          t={t}
        />
      )}
    </div>
  );
}

export default App;
