
import React, { useState } from 'react';
import { copyContent, printContent, downloadPdf } from '../utils/exportUtils';
import { TranslationSet } from '../types';

interface ActionButtonsProps {
  getContentForExport: () => string;
  exportTitle: string;
  t: TranslationSet;
  orientation?: 'horizontal' | 'vertical';
}

const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const PrintIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

const PdfIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);


const ActionButtons: React.FC<ActionButtonsProps> = ({ getContentForExport, exportTitle, t, orientation = 'horizontal' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyContent(getContentForExport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    printContent(getContentForExport, exportTitle);
  };

  const handlePdf = () => {
    downloadPdf(getContentForExport, exportTitle.replace(/\s+/g, '_').toLowerCase());
  };

  const buttonClass = "p-1.5 rounded-md text-slate-400 hover:bg-slate-600 hover:text-amber-400 transition-colors";
  const containerClass = orientation === 'vertical'
    ? "flex flex-col space-y-1 bg-slate-700/50 rounded-lg p-0.5"
    : "flex items-center space-x-1 bg-slate-700/50 rounded-lg p-0.5";

  return (
    <div className={containerClass}>
      <button onClick={handleCopy} title={copied ? t.copied : t.tooltipCopy} className={buttonClass}>
        {copied ? (
          orientation === 'horizontal' ? (
             <span className="text-xs font-semibold px-1 text-green-400">{t.copied}</span>
          ) : (
             <CheckIcon className="w-4 h-4 text-green-400"/>
          )
        ) : (
          <CopyIcon className="w-4 h-4" />
        )}
      </button>
      <button onClick={handlePrint} title={t.tooltipPrint} className={buttonClass}>
        <PrintIcon className="w-4 h-4" />
      </button>
      <button onClick={handlePdf} title={t.tooltipPdf} className={buttonClass}>
        <PdfIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ActionButtons;
