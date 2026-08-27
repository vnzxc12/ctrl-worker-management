import React from 'react';
import { Share, PlusSquare, Smartphone, X } from 'lucide-react';
import Modal from './Modal';
import { usePWA } from '../../context/PWAContext';
import Logo from '../../assets/Logo';

export default function IOSInstallModal() {
  const { showIOSModal, setShowIOSModal } = usePWA();

  if (!showIOSModal) return null;

  return (
    <Modal
      isOpen={showIOSModal}
      onClose={() => setShowIOSModal(false)}
      title="Install CTRL HR on iOS"
      maxWidth="max-w-sm"
      footer={
        <button
          type="button"
          onClick={() => setShowIOSModal(false)}
          className="w-full py-2.5 px-4 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl"
        >
          Got It
        </button>
      }
    >
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <Logo variant="icon" size="lg" />
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-900">Add to Home Screen</h4>
          <p className="text-xs text-slate-500 mt-1">
            Install CTRL Construction HR on your iPhone or iPad for fast full-screen access.
          </p>
        </div>

        <div className="space-y-2.5 text-left bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white border border-slate-200 text-brand-600 font-bold flex-shrink-0">
              1
            </div>
            <div>
              Tap the <strong className="text-slate-900 inline-flex items-center gap-1">Share <Share className="w-3.5 h-3.5 inline" /></strong> button in Safari's bottom toolbar.
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white border border-slate-200 text-brand-600 font-bold flex-shrink-0">
              2
            </div>
            <div>
              Scroll down and select <strong className="text-slate-900 inline-flex items-center gap-1">Add to Home Screen <PlusSquare className="w-3.5 h-3.5 inline" /></strong>.
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white border border-slate-200 text-brand-600 font-bold flex-shrink-0">
              3
            </div>
            <div>
              Tap <strong className="text-brand-600">Add</strong> in the top right corner.
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
