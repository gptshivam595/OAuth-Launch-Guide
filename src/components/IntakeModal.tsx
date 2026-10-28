import React from 'react';
import { X } from 'lucide-react';
import { GuideAssumptions } from '../types/client.js';
import { IntakeForm } from './IntakeForm.js';

interface IntakeModalProps {
  initialProvider?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (provider: string, website: string, assumptions: GuideAssumptions) => void;
}

export const IntakeModal: React.FC<IntakeModalProps> = ({
  initialProvider = '',
  isOpen,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/35 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative my-8 w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        <IntakeForm
          initialProvider={initialProvider}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
};
