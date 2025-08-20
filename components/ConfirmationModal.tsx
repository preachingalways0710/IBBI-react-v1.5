import React from 'react';
import ReactDOM from 'react-dom';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText: string;
  confirmButtonClass?: string;
  onCancel: () => void;
  cancelText: string;
  onExtraAction?: () => void;
  extraActionText?: string;
  extraButtonClass?: string;
}

const modalRoot = document.getElementById('modal-root');

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  confirmText,
  confirmButtonClass = 'bg-red-600 hover:bg-red-500 text-white',
  onCancel,
  cancelText,
  onExtraAction,
  extraActionText,
  extraButtonClass = 'bg-sky-600 hover:bg-sky-500 text-white',
}) => {
  if (!isOpen || !modalRoot) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-amber-400 font-serif">{title}</h2>
        </header>
        <div className="p-6">
          <p className="text-slate-300">{message}</p>
        </div>
        <footer className="flex justify-end items-center space-x-3 p-4 bg-slate-800/50 rounded-b-lg">
            <button onClick={onCancel} className="px-4 py-2 rounded-md font-semibold text-slate-300 bg-slate-600 hover:bg-slate-500 transition-colors">
                {cancelText}
            </button>
            {onExtraAction && extraActionText && (
                <button onClick={onExtraAction} className={`px-4 py-2 rounded-md font-semibold transition-colors ${extraButtonClass}`}>
                    {extraActionText}
                </button>
            )}
            <button onClick={onConfirm} className={`px-4 py-2 rounded-md font-semibold transition-colors ${confirmButtonClass}`}>
                {confirmText}
            </button>
        </footer>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default ConfirmationModal;
