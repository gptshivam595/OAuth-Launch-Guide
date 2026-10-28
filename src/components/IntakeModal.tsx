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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-2xl rounded-2xl cyber-panel-elevated cyber-highlight-top p-1 shadow-2xl my-8"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-[#7C988B] hover:text-[#00F29D] hover:bg-[#171D1A] transition"
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
