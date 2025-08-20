import React from 'react';
import ReactDOM from 'react-dom';

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const modalRoot = document.getElementById('modal-root');

const MobileModal: React.FC<MobileModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen || !modalRoot) {
    return null;
  }

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[240px] bg-slate-800 border border-slate-700 rounded-lg shadow-xl flex flex-col animate-fade-in-down"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-3 border-b border-slate-700">
          <h3 className="font-semibold text-lg text-slate-200">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-600 hover:text-white" aria-label="Close">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="p-2 flex flex-col items-center space-y-1">
          {children}
        </div>
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default MobileModal;