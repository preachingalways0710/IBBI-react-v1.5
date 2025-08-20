import React from 'react';
import { BIBLE_BOOKS } from '../constants';

interface AnswerRendererProps {
  text: string;
  onNavigate: (reference: string) => void;
}

// Pre-build the regex for performance. It looks for full book names followed by chapter:verse.
const bookNamesForRegex = BIBLE_BOOKS.map(b => b.name.replace(/\s/g, '\\s')).join('|');
const verseRefRegex = new RegExp(`\\b(${bookNamesForRegex})\\s+(\\d{1,3}):(\\d{1,3}(?:-\\d{1,3})?)\\b`, 'g');

const AnswerRenderer: React.FC<AnswerRendererProps> = ({ text, onNavigate }) => {
  const matches = [...text.matchAll(verseRefRegex)];
  
  if (matches.length === 0) {
      return <>{text}</>;
  }

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach((match, index) => {
    const fullRef = match[0];
    const matchIndex = match.index || 0;

    // Add the text before this match
    if (matchIndex > lastIndex) {
      elements.push(text.substring(lastIndex, matchIndex));
    }

    // Add the link as a styled button
    elements.push(
      <button 
        key={`${fullRef}-${index}`}
        onClick={() => onNavigate(fullRef)} 
        className="text-amber-400 hover:underline font-semibold transition-colors duration-200"
        title={`Go to ${fullRef}`}
      >
        {fullRef}
      </button>
    );

    lastIndex = matchIndex + fullRef.length;
  });

  // Add any remaining text after the last match
  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }

  return <>{elements.map((el, i) => <React.Fragment key={i}>{el}</React.Fragment>)}</>;
};

export default AnswerRenderer;