import React, { useState, useEffect, useRef } from 'react';
import Spinner from './Spinner';
import { TranslationSet, Language, ChatTurn } from '../types';
import AnswerRenderer from './AnswerRenderer';
import ActionButtons from './ActionButtons';

interface ChatInterfaceProps {
  onAskQuestion: (question: string) => void;
  onResetChat: () => void;
  chatHistory: ChatTurn[];
  translatedChatHistory: ChatTurn[];
  loading: boolean;
  t: TranslationSet;
  onNavigateToReference: (reference: string) => void;
  qaTranslated: boolean;
  onToggleQaTranslation: () => void;
  qaTranslationLoading: boolean;
  uiLanguage: Language;
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


const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  onAskQuestion, 
  onResetChat, 
  chatHistory,
  translatedChatHistory,
  loading, 
  t, 
  onNavigateToReference,
  qaTranslated,
  onToggleQaTranslation,
  qaTranslationLoading,
  uiLanguage,
  isMinimized,
  onToggleMinimize,
  isFloating = false
}) => {
  const [question, setQuestion] = useState('');
  const lastMessageRef = useRef<HTMLDivElement>(null);

  const historyToDisplay = qaTranslated && translatedChatHistory.length === chatHistory.length
    ? translatedChatHistory
    : chatHistory;

  const hasContent = chatHistory.length > 0;

  useEffect(() => {
    if ((!isMinimized || isFloating) && lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [historyToDisplay.length, isMinimized, isFloating]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !loading) {
      onAskQuestion(question);
      setQuestion('');
    }
  };

  const handleReset = () => {
    onResetChat();
    setQuestion('');
  };

  const getContentForExport = (): string => {
    const history = qaTranslated ? translatedChatHistory : chatHistory;
    return history.map(turn => `
      <div class="verse-block">
        <h3>Question:</h3>
        <p><strong>${turn.question}</strong></p>
        <br/>
        <h3>Answer:</h3>
        <div>${turn.answer.replace(/\n/g, '<br/>')}</div>
      </div>
    `).join('<hr style="margin: 2em 0;" />');
  };
  
  const mainContainerClass = isFloating 
    ? 'flex flex-col overflow-hidden h-full' 
    : `bg-slate-800 rounded-lg shadow-md flex flex-col transition-all duration-500 ease-in-out ${isMinimized ? 'max-h-16 overflow-hidden' : 'max-h-[45vh]'}`;


  return (
    <div className={mainContainerClass}>
        {!isFloating && (
          <div 
            className={`p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0 ${isMinimized ? 'border-b-transparent cursor-pointer h-full' : ''}`}
            onClick={isMinimized ? onToggleMinimize : undefined}
          >
            <h2 className="text-2xl font-semibold text-amber-400 font-serif">{t.askAQuestion}</h2>
            <div className="flex items-center space-x-2">
                {!isMinimized && hasContent && !loading && (
                    <button
                    onClick={onToggleQaTranslation}
                    className={`text-sm font-semibold px-3 py-1 rounded-md transition-colors animate-fade-in flex items-center justify-center ${
                        qaTranslated
                        ? 'bg-sky-600 text-sky-100 ring-1 ring-sky-400'
                        : 'text-sky-400 hover:text-sky-300 bg-slate-700/50 hover:bg-slate-700'
                    }`}
                    title={t.tooltipTranslateConversation}
                    disabled={loading || qaTranslationLoading}
                    >
                    {qaTranslationLoading ? <Spinner size="sm"/> : t.translateConversation}
                    </button>
                )}
                {!isMinimized && hasContent && !loading && (
                <ActionButtons 
                    getContentForExport={getContentForExport}
                    exportTitle={`Q&A Session`}
                    t={t}
                />
                )}
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleMinimize(); }}
                    className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                    aria-label={isMinimized ? 'Maximize' : 'Minimize'}
                >
                    {isMinimized ? <MaximizeIcon className="w-5 h-5" /> : <MinimizeIcon className="w-5 h-5" />}
                </button>
            </div>
          </div>
        )}
      
      {(!isMinimized || isFloating) && (
        <>
          <div className={`p-6 flex-grow overflow-y-auto`}>
            {hasContent ? (
              <div className="space-y-6">
                {historyToDisplay.map((turn, index) => {
                  const originalTurn = chatHistory[index]; // Use original turn for loading state
                  return (
                    <div
                      key={index}
                      className="space-y-4 animate-fade-in"
                      ref={index === historyToDisplay.length - 1 ? lastMessageRef : null}
                    >
                      <p className="text-amber-400 font-bold whitespace-pre-wrap leading-relaxed">
                        {turn.question}
                      </p>
                      
                      {originalTurn.answerLoading ? (
                         <div className="flex items-center space-x-3">
                           <Spinner size="sm"/>
                           <p className="text-slate-400 text-sm">{t.thinking}</p>
                         </div>
                      ) : (
                        <div className="prose prose-invert prose-p:text-slate-300 prose-headings:text-slate-100 whitespace-pre-wrap leading-relaxed">
                          <AnswerRenderer text={turn.answer} onNavigate={onNavigateToReference} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-slate-400 text-center h-full flex items-center justify-center">
                <p>{t.askToBegin}</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-700 flex-shrink-0">
            <form onSubmit={handleSubmit}>
              <div className="flex items-center space-x-2">
                <button
                    type="button"
                    onClick={handleReset}
                    disabled={loading}
                    className="bg-slate-700 text-slate-300 p-3 rounded-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    aria-label={t.newChat}
                    title={t.tooltipNewChat}
                  >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
                  </svg>
                </button>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={t.chatPlaceholder}
                  className="flex-grow min-w-0 bg-slate-700 border border-slate-600 rounded-md shadow-sm p-3 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-white disabled:opacity-50"
                  disabled={loading}
                  aria-label={t.chatPlaceholder}
                />
                <button
                  type="submit"
                  disabled={loading || !question.trim()}
                  className="bg-amber-500 text-slate-900 font-bold py-3 px-4 rounded-md hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-amber-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                  aria-label={t.askAQuestion}
                  title={t.tooltipSubmitQuestion}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatInterface;