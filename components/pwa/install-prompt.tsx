'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * PWA Install Prompt Component
 * Shows install banner when PWA can be installed
 */
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return; // Already installed
    }

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('PWA installed');
        setShowPrompt(false);
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.error('Installation error:', err);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    // Remember dismissal for 7 days
    localStorage.setItem('pwa-dismiss', String(Date.now()));
  };

  // Check if user dismissed recently
  useEffect(() => {
    const lastDismiss = localStorage.getItem('pwa-dismiss');
    if (lastDismiss) {
      const daysSinceDismiss = (Date.now() - parseInt(lastDismiss)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) {
        setDismissed(true);
      }
    }
  }, []);

  if (!showPrompt || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-md mx-auto bg-slate-900 text-white rounded-lg shadow-lg p-4 flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 bg-green-600 rounded-lg">
          <Download className="h-6 w-6" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">Install FreshMarket BD</h3>
          <p className="text-xs text-slate-300 mt-1">
            Get faster access and work offline
          </p>

          {/* Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-2 rounded transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium py-2 rounded transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

/**
 * Detect if app is installed
 */
export function useIsInstalled() {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check display mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Fallback for non-standard implementations
    if ((window.navigator as any).standalone === true) {
      setIsInstalled(true);
    }
  }, []);

  return isInstalled;
}
