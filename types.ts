


export interface WordDefinition {
  modern_definition: string;
  archaic_usage_note?: string;
  original_language_word: string;
  original_language_definition: string;
  is_location: boolean;
  latitude?: number;
  longitude?: number;
  location_certainty?: 'certain' | 'uncertain' | 'disputed';
}

export interface WordDefinitionState {
  isOpen: boolean;
  word: string | null;
  verseRef: string | null;
  definition: {
    en: WordDefinition | null;
    pt: WordDefinition | null;
  };
  loading: Set<Language>;
  displayLanguage: Language;
  wasCancelled: boolean;
}

export interface CommonThemeItem {
  theme: string;
  verses: string;
}

export interface ChapterSummary {
  book_summary?: string;
  chapter_summary: string;
  chapter_stats: {
    key_word: string;
    key_verse: string;
    word_counts: { word: string; count: number }[];
    original_language: string;
  };
}

export enum BibleVersion {
  KJV = 'KJV',
  ACF2011 = 'ACF2011',
  ACF2007 = 'ACF2007',
}

export interface Book {
  name: string;
  chapters: number;
  pt_name: string;
  pt_abbrev: string;
  api_name?: string;
}

export interface PhrasalCommentary {
  phrase: string;
  explanation: string;
}

export interface CrossReferenceItem {
  subject: string;
  references: string[];
}

export interface StructuredCommentary {
  overview: string;
  phrasal_breakdown: PhrasalCommentary[];
}

export interface Verse {
  number: number;
  text: string;
  isExpanded?: boolean;
  commentaries: {
    en?: StructuredCommentary;
    pt?: StructuredCommentary;
  };
  simplifiedCommentaries: {
    en?: StructuredCommentary;
    pt?: StructuredCommentary;
  };
  crossReferences: {
    en?: CrossReferenceItem[];
    pt?: CrossReferenceItem[];
  };
  isCrossRefsVisible?: boolean;
  isSimplified?: boolean;
  overrideSimplified?: boolean;
  hasSignificantDifference: {
    en?: boolean;
    pt?: boolean;
  };
  differenceExplanation: {
    en?: string;
    pt?: string;
  };
  isDifferenceExpanded?: boolean;
  commentaryLoading: Set<Language>;
  differenceLoading: Set<Language>;
  simplificationLoading: Set<Language>;
  crossRefsLoading: Set<Language>;
}

export interface OutlineItem {
  heading: string;
  start_verse: number;
  end_verse: number;
}

export interface ChatTurn {
  question: string;
  answer: string;
  answerLoading?: boolean;
}

export type Language = 'en' | 'pt';

export type ChapterViewMode = 'reading' | 'outline' | 'commentary' | 'simplified';

export interface CrossRefPopupState {
    isOpen: boolean;
    reference: string | null;
    content: string | null;
    loading: boolean;
    error: string | null;
    position: { top: number; left: number };
}

export interface PointContent {
  title: string;
  explanation: string;
}

export interface ScriptureContent {
  references: string;
  fetchedText?: string;
}

export type SermonBodyItem = { id: string; } & (
  | { type: 'point'; content: PointContent }
  | { type: 'scripture'; content: ScriptureContent }
  | { type: 'illustration'; content: string }
);

export type SermonType = 'general' | 'expositional' | 'textual' | 'topical';

export interface SermonDataType {
  title: string;
  bibleText: string;
  introduction: string;
  thesis: string;
  body: SermonBodyItem[];
  conclusion: string;
  verdict: string;
}

export interface TranslationSet {
  studyBible: string;
  version: string;
  book: string;
  chapter: string;
  kjv1769: string;
  acf2011: string;
  acf2007: string;
  askAQuestion: string;
  thinking: string;
  askToBegin: string;
  chatPlaceholder: string;
  fetchError: string;
  fetchChapterError: (message: string) => string;
  newChat: string;
  tooltipSwitchToEnglish: string;
  tooltipSwitchToPortuguese: string;
  tooltipNewChat: string;
  tooltipSubmitQuestion: string;
  tooltipExpandCommentary: string;
  tooltipCollapseCommentary: string;
  toggleCommentaryTranslation: string;
  tooltipTranslateCommentary: string;
  acfKjvVariations: string;
  tooltipAcfKjvVariations: string;
  minimize: string;
  oldTestament: string;
  newTestament: string;
  tooltipPreviousChapter: string;
  tooltipNextChapter: string;
  ariaGoToSelector: string;
  aboutTitle: string;
  aboutContentPart1: string;
  aboutContentLink: string;
  aboutContentPart2: string;
  commonThemes: string;
  tooltipToggleCommonThemes: string;
  commonThemesTitle: string;
  translateThemes: string;
  summary: string;
  tooltipToggleSummary: string;
  summaryTitle: string;
  bookSummaryHeading: string;
  chapterSummaryHeading: string;
  chapterStatsHeading: string;
  translateSummary: string;
  tooltipCopy: string;
  tooltipPrint: string;
  tooltipPdf: string;
  copied: string;
  translateConversation: string;
  tooltipTranslateConversation: string;
  wordDefinitionTitle: (word: string, verseRef: string) => string;
  modernDefinitionHeading: string;
  originalLangDefinitionHeading: (langWord: string) => string;
  archaicUsageNoteHeading: string;
  translateDefinition: string;
  retryGeneration: string;
  simplifyCommentary: string;
  revertCommentary: string;
  tooltipSimplifyCommentary: string;
  tooltipRevertCommentary: string;
  crossReferencesHeading: string;
  crossRefFetchError: string;
  showCrossRefs: string;
  hideCrossRefs: string;
  tooltipShowCrossRefs: string;
  tooltipHideCrossRefs: string;
  viewReading: string;
  tooltipViewReading: string;
  viewOutline: string;
  tooltipViewOutline: string;
  viewCommentary: string;
  tooltipViewCommentary: string;
  viewSimplified: string;
  tooltipViewSimplified: string;
  moreActions: string;
  generatingCommentary: string;
  generatingCrossRefs: string;
  passageSelection: string;
  godsWord: string;
  view: string;
  resources: string;
  sermonEditor: string;
  study: string;
  sermon: string;
  sermonBuilder: {
    sermonType: string;
    sermonTypes: {
        general: string;
        expositional: string;
        textual: string;
        topical: string;
    };
    title: string;
    titleTopical: string;
    bibleText: string;
    bibleTextExpositional: string;
    bibleTextTextual: string;
    introduction: string;
    thesis: string;
    thesisExpositional: string;
    thesisTextual: string;
    thesisTopical: string;
    point: string;
    pointExpositional: string;
    pointTextual: string;
    pointTopical: string;
    pointExplanation: string;
    scripture: string;
    illustration: string;
    conclusion: string;
    verdict: string;
    sermonBody: string;
    sermonBodyDescription: string;
    addItem: string;
    generateOutline: string;
    generatedOutline: string;
    clearAll: string;
    clearAllConfirmation: {
        title: string;
        message: string;
        confirm: string;
        cancel: string;
    };
    tooltipAddItem: (type: string) => string;
    tooltipRemoveItem: string;
    tooltipMoveUp: string;
    tooltipMoveDown: string;
    fetchAndExpandAll: string;
    expandFetchedOnly: string;
    fetchVerses: string;
    fetchedVerseText: string;
    disableSermonColors: string;
    help: {
        title: string;
        intro: string;
        step1: string;
        step2: string;
        step3: string;
        step4: string;
        sermonTypesTitle: string;
        types: {
            general: { title: string; desc: string; };
            expositional: { title: string; desc: string; };
            textual: { title: string; desc: string; };
            topical: { title: string; desc: string; };
        };
    };
  };
  wordCounts: string;
  wordCountFromTranslation: string;
  versesSelected: (count: number) => string;
  copySelection: string;
  copiedSelection: string;
  deselectAll: string;
};