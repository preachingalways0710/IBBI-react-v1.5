
import React, { useState } from 'react';
import { Language, TranslationSet } from '../types';

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationSet;
}

const USFlag: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 100" className={className} aria-label="Flag of the United States">
      <rect width="190" height="100" fill="#B22234"/>
      <rect width="190" height="7.69" y="7.69" fill="#FFFFFF"/>
      <rect width="190" height="7.69" y="23.07" fill="#FFFFFF"/>
      <rect width="190" height="7.69" y="38.45" fill="#FFFFFF"/>
      <rect width="190" height="7.69" y="53.85" fill="#FFFFFF"/>
      <rect width="190" height="7.69" y="69.23" fill="#FFFFFF"/>
      <rect width="190" height="7.69" y="84.61" fill="#FFFFFF"/>
      <rect width="76" height="53.85" fill="#3C3B6E"/>
      <g fill="#FFFFFF" transform="translate(38, 26.925) scale(2.5)">
          <g transform="translate(0, -6)">
              <path d="M0-2L.588.809-.951-.309H.951L-.588.809z" transform="translate(-10, 0)"/>
              <path d="M0-2L.588.809-.951-.309H.951L-.588.809z" transform="translate(-5, 0)"/>
              <path d="M0-2L.588.809-.951-.309H.951L-.588.809z" transform="translate(0, 0)"/>
              <path d="M0-2L.588.809-.951-.309H.951L-.588.809z" transform="translate(5, 0)"/>
              <path d="M0-2L.588.809-.951-.309H.951L-.588.809z" transform="translate(10, 0)"/>
          </g>
          <g transform="translate(0, 0)">
              <path d="M0-2L.588.809-.951-.309H.951L-.588.809z" transform="translate(-7.5, 0)"/>
              <path d="M0-2L.588.809-.951-.309H.951L-.588.809z" transform="translate(-2.5, 0)"/>
              <path d="M0-2L.588.809-.951-.309H.951L-.588.809z" transform="translate(2.5, 0)"/>
              <path d="M0-2L.588.809-.951-.309H.951L-.588.809z" transform="translate(7.5, 0)"/>
          </g>
          <g transform="translate(0, 6)">
              <path d="M0-2L.588.809-.951-.309H.951L-.588.809z" transform="translate(-10, 0)"/>
              <path d="M0-2L.588.809-.951-.309H.951L-.588.809z" transform="translate(-5, 0)"/>
              <path d="M0-2L.588.809-.951-.309H.951L-.588.809z" transform="translate(0, 0)"/>
              <path d="M0-2L.588.809-.951-.309H.951L-.588.809z" transform="translate(5, 0)"/>
              <path d="M0-2L.588.809-.951-.309H.951L-.588.809z" transform="translate(10, 0)"/>
          </g>
      </g>
    </svg>
);


const BrazilFlag: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 100" className={className} aria-label="Flag of Brazil">
      <rect width="190" height="100" fill="#009C3B"/>
      <path d="M95 10 L 175 50 L 95 90 L 15 50 z" fill="#FFB81C"/>
      <circle cx="95" cy="50" r="35" fill="#002776"/>
      <path d="M68,61 A45,45 0 0,1 122,39" fill="none" stroke="#FFFFFF" strokeWidth="7" />
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


const Header: React.FC<HeaderProps> = ({ language, setLanguage, t }) => {
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  return (
    <>
      <header className="bg-slate-900/70 backdrop-blur-sm sticky top-0 z-20 shadow-lg shadow-slate-950/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v15H6.5A2.5 2.5 0 0 1 4 14.5V4.5A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              <h1 className="text-xl font-bold text-slate-100">
                {t.studyBible}
              </h1>
              <button onClick={() => setIsAboutModalOpen(true)} aria-label={t.aboutTitle}>
                <InfoIcon className="h-5 w-5 text-slate-400 cursor-pointer hover:text-sky-400 transition-colors" />
              </button>
            </div>
            <div className="flex items-center space-x-4">
               <button onClick={() => setLanguage('en')} className={`transition-opacity ${language !== 'en' ? 'opacity-50 hover:opacity-100' : ''}`} aria-label="Switch to English" title={t.tooltipSwitchToEnglish}>
                  <USFlag className="h-6 w-auto rounded-sm shadow-md border border-slate-600" />
               </button>
               <button onClick={() => setLanguage('pt')} className={`transition-opacity ${language !== 'pt' ? 'opacity-50 hover:opacity-100' : ''}`} aria-label="Mudar para Português" title={t.tooltipSwitchToPortuguese}>
                  <BrazilFlag className="h-6 w-auto rounded-sm shadow-md border border-slate-600" />
               </button>
            </div>
          </div>
        </div>
      </header>

      {isAboutModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 animate-fade-in"
          onClick={() => setIsAboutModalOpen(false)}
        >
          <div 
            className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg border border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            <header className="flex justify-between items-center p-4 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-amber-400 font-serif">{t.aboutTitle}</h2>
              <button 
                onClick={() => setIsAboutModalOpen(false)} 
                className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                aria-label="Close"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </header>
            <div className="p-6">
              <p className="text-slate-300">
                {t.aboutContentPart1}
                <a href="https://meuibbi.com" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">
                  {t.aboutContentLink}
                </a>
                {t.aboutContentPart2}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
