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
  // Function to detect verse references (English and Portuguese patterns)
  const detectReferences = (inputText: string) => {
    // Regex for references: e.g., Genesis 1:1, 3 John 1:1, Proverbs 4:20-22, Gênesis 1:1, 3 João 1:1, Provérbios 4:20-22
    const refRegex = /(\d*\s*[A-Za-zÀ-ÿ\s]*Psalm[s]?\s*\d+:\d+(-\d+)?|\d*\s*[A-Za-zÀ-ÿ\s]+ \d+:\d+(-\d+)?)/gi;
    return inputText.replace(refRegex, (match) => `<strong class="text-amber-400">${match}</strong>`);
  };

  // Process text: Detect references and make them bold with amber color, then handle links or other rendering
  const processedText = detectReferences(text);

  return (
    <div dangerouslySetInnerHTML={{ __html: processedText }} />
  );
};

export default AnswerRenderer;