
import React from 'react';
import { CrossRefPopupState, TranslationSet } from '../types';
import Spinner from './Spinner';

interface CrossRefPopupProps {
  state: CrossRefPopupState;
  onNavigate: (reference: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  t: TranslationSet;
}

const CrossRefPopup: React.FC<CrossRefPopupProps> = ({ state, onNavigate, onMouseEnter, onMouseLeave, t }) => {
  if (!state.isOpen) return null;

  const { reference, content, loading, error, position } = state;

  return (
    <div
      className="fixed z-50 p-3 bg-slate-950 border border-slate-700 rounded-lg shadow-2xl max-w-sm text-sm transition-opacity animate-fade-in cursor-pointer"
      style={{ top: position.top, left: position.left, transform: 'translateY(10px)' }}
      onClick={() => reference && onNavigate(reference)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {loading && (
        <div className="p-4">
            <Spinner size="sm" />
        </div>
      )}
      {error && <p className="text-red-400">{error}</p>}
      {content && (
        <div className="text-slate-300 font-sans">
          <p className="font-bold text-amber-400 mb-2">{reference}</p>
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
      )}
    </div>
  );
};

export default CrossRefPopup;