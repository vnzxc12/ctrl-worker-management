import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '../components/common/Toast';

const PWAContext = createContext();

export function PWAProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const { addToast } = useToast();

  // Detect iOS Safari
  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  useEffect(() => {
    // Check if already running in standalone mode (installed PWA)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent automatic browser banner so we can trigger with custom button
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      addToast('CTRL Construction HR app installed successfully!', 'success');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback instruction for browsers without beforeinstallprompt
      addToast('To install: click the Install icon in your browser address bar or menu.', 'info');
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.error('PWA install prompt error:', err);
    }
  };

  return (
    <PWAContext.Provider value={{
      isInstallable: isInstallable || isIOS,
      isInstalled,
      promptInstall,
      isIOS,
      showIOSModal,
      setShowIOSModal
    }}>
      {children}
    </PWAContext.Provider>
  );
}

export const usePWA = () => useContext(PWAContext);
