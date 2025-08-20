import React, { useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { TranslationSet, SermonBodyItem, PointContent, ScriptureContent, SermonDataType, SermonType } from '../types';
import ConfirmationModal from './ConfirmationModal';
import ActionButtons from './ActionButtons';
import Spinner from './Spinner';

// --- ICONS ---
const TrashIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const PlusIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const PointIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>;
const ScriptureIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v15H6.5A2.5 2.5 0 0 1 4 14.5V4.5A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const IllustrationIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
const RemoveIcon = ({ className = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const UpArrowIcon = ({ className = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>;
const DownArrowIcon = ({ className = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;
const FetchIcon = ({ className = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5 0V6.75A2.25 2.25 0 0011.25 4.5H7.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 4.5L6 9m4.5-4.5L15 9" /></svg>;

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

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
);

const modalRoot = document.getElementById('modal-root');


// --- FORM FIELD COMPONENT ---
const FormField = ({ label, value, onChange, placeholder = '' }: { label: string, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, placeholder?: string }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
        }
    }, [value]);

    return (
        <div>
            <label className="block text-sm font-semibold text-sky-300 mb-1">{label}</label>
            <textarea
                ref={textareaRef}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-md p-2 text-slate-200 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[2.75rem]"
                rows={1}
            />
        </div>
    );
};

type VerseExpansionMode = 'none' | 'fetchedOnly' | 'all';

// --- MAIN COMPONENT ---
interface SermonEditorProps {
    t: TranslationSet;
    isMinimized: boolean;
    onToggleMinimize: () => void;
    sermonType: SermonType;
    onSermonTypeChange: (type: SermonType) => void;
    sermonData: SermonDataType;
    generatedOutline: string | null;
    isLoading: boolean;
    isClearModalOpen: boolean;
    onInputChange: (field: keyof Omit<SermonDataType, 'body'>) => (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onBodyItemChange: (id: string, value: string, field?: keyof PointContent | 'references') => void;
    onAddBodyItem: (type: 'point' | 'scripture' | 'illustration') => void;
    onRemoveBodyItem: (id: string) => void;
    onMoveBodyItem: (index: number, direction: 'up' | 'down') => void;
    onGenerate: () => void;
    onClear: () => void;
    onConfirmClear: () => void;
    onCloseClearModal: () => void;
    verseExpansionMode: VerseExpansionMode;
    onVerseExpansionModeChange: (value: VerseExpansionMode) => void;
    onFetchInlineScriptures: (itemId: string) => void;
    isSermonColorEnabled: boolean;
    onSermonColorEnabledChange: (value: boolean) => void;
}

const SermonEditor: React.FC<SermonEditorProps> = ({
    t, isMinimized, onToggleMinimize,
    sermonType, onSermonTypeChange,
    sermonData, generatedOutline, isLoading, isClearModalOpen,
    onInputChange, onBodyItemChange, onAddBodyItem, onRemoveBodyItem, onMoveBodyItem,
    onGenerate, onClear, onConfirmClear, onCloseClearModal,
    verseExpansionMode, onVerseExpansionModeChange, onFetchInlineScriptures,
    isSermonColorEnabled, onSermonColorEnabledChange
}) => {
    
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const sb = t.sermonBuilder;

    const getLabels = (type: SermonType) => {
        switch (type) {
            case 'expositional':
                return { title: sb.title, bibleText: sb.bibleTextExpositional, thesis: sb.thesisExpositional, point: sb.pointExpositional };
            case 'textual':
                return { title: sb.title, bibleText: sb.bibleTextTextual, thesis: sb.thesisTextual, point: sb.pointTextual };
            case 'topical':
                return { title: sb.titleTopical, bibleText: '', thesis: sb.thesisTopical, point: sb.pointTopical };
            default: // general
                return { title: sb.title, bibleText: sb.bibleText, thesis: sb.thesis, point: sb.point };
        }
    };
    const labels = getLabels(sermonType);

    const bodyItemIcons = {
        point: <PointIcon />,
        scripture: <ScriptureIcon />,
        illustration: <IllustrationIcon />,
    };
    
    const getContentForExport = (): string => {
        return generatedOutline || "";
    };

    const selectStyles = "w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-white";

    const helpModal = isHelpModalOpen && modalRoot ? ReactDOM.createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 animate-fade-in"
          onClick={() => setIsHelpModalOpen(false)}
        >
          <div 
            className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            <header className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
              <h2 className="text-xl font-semibold text-amber-400 font-serif">{sb.help.title}</h2>
              <button 
                onClick={() => setIsHelpModalOpen(false)} 
                className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                aria-label="Close"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </header>
            <div className="p-6 overflow-y-auto space-y-6">
              <p className="text-slate-300">{sb.help.intro}</p>
              <ul className="space-y-3 list-none p-0 text-slate-300">
                {[sb.help.step1, sb.help.step2, sb.help.step3, sb.help.step4].map((step, index) => {
                    const parts = step.split(': ');
                    return (
                        <li key={index} className="grid grid-cols-[auto_1fr] gap-x-3 items-start">
                            <span className="text-sky-400 font-bold text-right">{parts[0]}:</span>
                            <span>{parts.slice(1).join(': ')}</span>
                        </li>
                    );
                })}
              </ul>
              <div>
                <h3 className="text-lg font-bold text-sky-300 mb-3 border-b border-sky-800 pb-1">{sb.help.sermonTypesTitle}</h3>
                <div className="space-y-4">
                  {Object.values(sb.help.types).map(type => (
                    <div key={type.title}>
                      <h4 className="font-semibold text-amber-400">{type.title}</h4>
                      <p className="text-slate-400 text-sm mt-1">{type.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>,
        modalRoot
    ) : null;


    return (
        <>
        <div className={`bg-slate-800 rounded-lg shadow-md flex flex-col overflow-hidden transition-all duration-500 ease-in-out ${isMinimized ? 'max-h-16' : 'h-full'}`}>
            {/* Header */}
            <header 
                className={`p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0 ${isMinimized ? 'cursor-pointer border-b-transparent h-full' : ''}`}
                onClick={isMinimized ? onToggleMinimize : undefined}
            >
                <div className="flex items-center space-x-2">
                    <h2 className="text-2xl font-semibold text-amber-400 font-serif">{t.sermonEditor}</h2>
                    {!isMinimized && (
                        <button 
                            onClick={() => setIsHelpModalOpen(true)} 
                            className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                            aria-label="Open help guide"
                        >
                            <InfoIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    {!isMinimized && (
                        <button onClick={onClear} title={sb.clearAll} className="flex items-center space-x-2 px-3 py-1.5 bg-red-800/80 text-red-200 rounded-md hover:bg-red-700 transition-colors text-sm font-semibold animate-fade-in">
                            <TrashIcon className="w-4 h-4"/>
                            <span>{sb.clearAll}</span>
                        </button>
                    )}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggleMinimize(); }} 
                        className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                        aria-label={isMinimized ? 'Maximize' : 'Minimize'}
                    >
                        {isMinimized ? <MaximizeIcon className="w-5 h-5" /> : <MinimizeIcon className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            {!isMinimized && (
                <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6">
                    {/* --- INPUT FORM --- */}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="sermon-type" className="block text-sm font-semibold text-sky-300 mb-1">{sb.sermonType}</label>
                            <select
                                id="sermon-type"
                                value={sermonType}
                                onChange={(e) => onSermonTypeChange(e.target.value as SermonType)}
                                className={selectStyles}
                            >
                                <option value="general">{sb.sermonTypes.general}</option>
                                <option value="expositional">{sb.sermonTypes.expositional}</option>
                                <option value="textual">{sb.sermonTypes.textual}</option>
                                <option value="topical">{sb.sermonTypes.topical}</option>
                            </select>
                        </div>

                        <FormField label={labels.title} value={sermonData.title} onChange={onInputChange('title')} />
                        {sermonType !== 'topical' && (
                            <FormField label={labels.bibleText} value={sermonData.bibleText} onChange={onInputChange('bibleText')} />
                        )}
                        <FormField label={sb.introduction} value={sermonData.introduction} onChange={onInputChange('introduction')} />
                        <FormField label={labels.thesis} value={sermonData.thesis} onChange={onInputChange('thesis')} />

                        {/* Dynamic Sermon Body */}
                        <div>
                            <label className="block text-sm font-semibold text-sky-300 mb-1">{sb.sermonBody}</label>
                            <p className="text-xs text-slate-400 mb-3">{sb.sermonBodyDescription}</p>
                            <div className="space-y-3 pl-3 border-l-2 border-slate-700">
                                {sermonData.body.map((item, index) => (
                                    <div key={item.id} className="bg-slate-900/50 p-3 rounded-lg flex space-x-3 animate-fade-in">
                                        <div className="flex flex-col items-center space-y-1">
                                            <div className="text-amber-400">{bodyItemIcons[item.type]}</div>
                                            <button onClick={() => onMoveBodyItem(index, 'up')} disabled={index === 0} title={sb.tooltipMoveUp} className="p-1 rounded-full hover:bg-slate-600 disabled:opacity-30"><UpArrowIcon/></button>
                                            <button onClick={() => onMoveBodyItem(index, 'down')} disabled={index === sermonData.body.length - 1} title={sb.tooltipMoveDown} className="p-1 rounded-full hover:bg-slate-600 disabled:opacity-30"><DownArrowIcon/></button>
                                            <button onClick={() => onRemoveBodyItem(item.id)} title={sb.tooltipRemoveItem} className="p-1 rounded-full hover:bg-red-500/50"><RemoveIcon/></button>
                                        </div>
                                        <div className="flex-grow space-y-2">
                                            {item.type === 'point' && (
                                                <div className="space-y-2">
                                                    <FormField
                                                        label={labels.point}
                                                        value={item.content.title}
                                                        onChange={(e) => onBodyItemChange(item.id, e.target.value, 'title')}
                                                    />
                                                    <FormField
                                                        label={sb.pointExplanation}
                                                        value={item.content.explanation}
                                                        onChange={(e) => onBodyItemChange(item.id, e.target.value, 'explanation')}
                                                    />
                                                </div>
                                            )}
                                            {item.type === 'illustration' && (
                                                <FormField
                                                    label={sb.illustration}
                                                    value={item.content}
                                                    onChange={(e) => onBodyItemChange(item.id, e.target.value)}
                                                />
                                            )}
                                            {item.type === 'scripture' && (
                                                <>
                                                    <div className="relative">
                                                      <FormField
                                                          label={sb.scripture}
                                                          value={item.content.references}
                                                          onChange={(e) => onBodyItemChange(item.id, e.target.value, 'references')}
                                                      />
                                                      <button 
                                                        onClick={() => onFetchInlineScriptures(item.id)}
                                                        disabled={!item.content.references || !!item.content.fetchedText}
                                                        title={sb.fetchVerses}
                                                        className="absolute top-0 right-0 mt-1 mr-1 p-1.5 bg-sky-700 text-sky-200 rounded-md hover:bg-sky-600 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                                                      >
                                                        <FetchIcon />
                                                      </button>
                                                    </div>
                                                    {item.content.fetchedText && (
                                                        <div className="mt-2">
                                                            <label className="block text-xs font-semibold text-sky-400/80 mb-1">{sb.fetchedVerseText}</label>
                                                            <blockquote 
                                                              className="bg-slate-800/60 p-2 rounded-md border-l-2 border-sky-700 text-sm text-slate-300 whitespace-pre-wrap"
                                                              dangerouslySetInnerHTML={{ __html: item.content.fetchedText }}
                                                            >
                                                            </blockquote>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {/* Add Item Buttons */}
                                <div className="flex flex-wrap items-center gap-2 pt-2">
                                    <span className="text-sm font-semibold text-slate-400 flex-shrink-0">{sb.addItem}:</span>
                                    <button onClick={() => onAddBodyItem('point')} title={sb.tooltipAddItem(labels.point)} className="flex items-center p-2 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 transition-colors"><PointIcon/><span className="hidden sm:inline ml-2">{labels.point}</span></button>
                                    <button onClick={() => onAddBodyItem('scripture')} title={sb.tooltipAddItem(sb.scripture)} className="flex items-center p-2 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 transition-colors"><ScriptureIcon/><span className="hidden sm:inline ml-2">{sb.scripture}</span></button>
                                    <button onClick={() => onAddBodyItem('illustration')} title={sb.tooltipAddItem(sb.illustration)} className="flex items-center p-2 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 transition-colors"><IllustrationIcon/><span className="hidden sm:inline ml-2">{sb.illustration}</span></button>
                                </div>
                            </div>
                        </div>

                        <FormField label={sb.conclusion} value={sermonData.conclusion} onChange={onInputChange('conclusion')} />
                        <FormField label={sb.verdict} value={sermonData.verdict} onChange={onInputChange('verdict')} />
                    </div>
                    
                    {/* --- GENERATE BUTTON AND OPTIONS --- */}
                    <div className="pt-4 border-t border-slate-700/50">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button 
                                onClick={onGenerate} 
                                disabled={isLoading}
                                className="w-full sm:w-auto px-6 py-3 bg-amber-500 text-slate-900 font-bold rounded-md hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-amber-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                            >
                                {isLoading ? <Spinner size="sm"/> : sb.generateOutline}
                            </button>
                            <div className="flex flex-col space-y-2 items-start">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="expand-all-verses"
                                        checked={verseExpansionMode === 'all'}
                                        onChange={(e) => onVerseExpansionModeChange(e.target.checked ? 'all' : 'none')}
                                        className="h-4 w-4 rounded border-slate-500 text-amber-500 focus:ring-amber-500 bg-slate-700"
                                    />
                                    <label htmlFor="expand-all-verses" className="ml-2 block text-sm text-slate-300">
                                        {sb.fetchAndExpandAll}
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="expand-fetched-verses"
                                        checked={verseExpansionMode === 'fetchedOnly'}
                                        onChange={(e) => onVerseExpansionModeChange(e.target.checked ? 'fetchedOnly' : 'none')}
                                        className="h-4 w-4 rounded border-slate-500 text-amber-500 focus:ring-amber-500 bg-slate-700"
                                    />
                                    <label htmlFor="expand-fetched-verses" className="ml-2 block text-sm text-slate-300">
                                        {sb.expandFetchedOnly}
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="disable-sermon-colors"
                                        checked={!isSermonColorEnabled}
                                        onChange={(e) => onSermonColorEnabledChange(!e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-500 text-amber-500 focus:ring-amber-500 bg-slate-700"
                                    />
                                    <label htmlFor="disable-sermon-colors" className="ml-2 block text-sm text-slate-300">
                                        {sb.disableSermonColors}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* --- OUTPUT SECTION --- */}
                    {(isLoading || generatedOutline) && (
                        <div className="pt-6 border-t border-slate-700">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold text-amber-400 font-serif">{sb.generatedOutline}</h3>
                                {!isLoading && generatedOutline && (
                                    <ActionButtons
                                        getContentForExport={getContentForExport}
                                        exportTitle={sermonData.title || 'Sermon Outline'}
                                        t={t}
                                    />
                                )}
                            </div>
                            <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700 min-h-[100px]">
                                {isLoading && <div className="flex justify-center items-center h-24"><Spinner/></div>}
                                {generatedOutline && (
                                    <div
                                        className="prose prose-invert max-w-none prose-headings:text-sky-300 prose-headings:font-serif prose-p:text-slate-300 prose-ul:text-slate-300 prose-ol:text-slate-300"
                                        dangerouslySetInnerHTML={{ __html: generatedOutline }}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
        <ConfirmationModal
            isOpen={isClearModalOpen}
            onClose={onCloseClearModal}
            title={sb.clearAllConfirmation.title}
            message={sb.clearAllConfirmation.message}
            onConfirm={onConfirmClear}
            confirmText={sb.clearAllConfirmation.confirm}
            onCancel={onCloseClearModal}
            cancelText={sb.clearAllConfirmation.cancel}
        />
        {helpModal}
      </>
    );
};

export default SermonEditor;