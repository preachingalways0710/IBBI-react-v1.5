import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 28;
const DEFAULT_FONT_SIZE = 16;

interface FontSizeContextType {
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

export const FontSizeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [fontSize, setFontSize] = useState<number>(() => {
    const storedSize = localStorage.getItem('app-font-size');
    return storedSize ? parseInt(storedSize, 10) : DEFAULT_FONT_SIZE;
  });

  useEffect(() => {
    // Apply font size to the root element
    document.documentElement.style.setProperty('--base-font-size', `${fontSize}px`);
    // Save font size to localStorage for persistence
    localStorage.setItem('app-font-size', fontSize.toString());
  }, [fontSize]);

  const increaseFontSize = () => {
    setFontSize(prevSize => Math.min(prevSize + 2, MAX_FONT_SIZE));
  };

  const decreaseFontSize = () => {
    setFontSize(prevSize => Math.max(prevSize - 2, MIN_FONT_SIZE));
  };

  return (
    <FontSizeContext.Provider value={{ increaseFontSize, decreaseFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontSize = () => {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
};
