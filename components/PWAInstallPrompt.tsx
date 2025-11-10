import React, { useState, useEffect } from 'react';
import { Button, Card } from './ui';
import { Icon } from './icons';
import { isPWAInstalled } from '../lib/pwa';

interface PWAInstallPromptProps {
  onDismiss?: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onDismiss }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if browser supports PWA features
    if (!('serviceWorker' in navigator)) {
      return; // PWA not supported, don't show prompt
    }

    // Check if already installed
    try {
      setIsInstalled(isPWAInstalled());
    } catch (error) {
      console.log('[PWA] Could not check install status:', error);
      return;
    }

    // Check if user dismissed prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent default browser install prompt
      e.preventDefault();
      
      // Store the event for later use
      setDeferredPrompt(e);
      setShowPrompt(true);
      
      console.log('[PWA] Install prompt ready');
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setShowPrompt(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show browser's install prompt
    deferredPrompt.prompt();

    // Wait for user choice
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] User choice:', outcome);

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted install');
    } else {
      console.log('[PWA] User dismissed install');
    }

    // Clear the prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    // Save dismissal timestamp
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    setShowPrompt(false);
    
    if (onDismiss) {
      onDismiss();
    }
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <Card className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-96 z-50 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none shadow-2xl animate-fade-in-up">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
          <Icon name="Rocket" className="w-7 h-7" />
        </div>
        
        <div className="flex-grow min-w-0">
          <h3 className="font-bold text-lg mb-1">Install Task Pilot</h3>
          <p className="text-sm text-white/90 mb-3">
            Get faster access and work offline! Install our app for the best experience.
          </p>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleInstall}
              className="bg-white text-indigo-600 hover:bg-white/90 font-semibold"
              size="sm"
            >
              Install Now
            </Button>
            <Button 
              onClick={handleDismiss}
              variant="ghost"
              className="text-white hover:bg-white/20"
              size="sm"
            >
              Maybe Later
            </Button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-white/80 hover:text-white"
          aria-label="Dismiss"
        >
          <Icon name="Close" className="w-5 h-5" />
        </button>
      </div>
    </Card>
  );
};

/**
 * PWA Status Badge (shows when installed)
 */
export const PWAStatusBadge: React.FC = () => {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsInstalled(isPWAInstalled());
  }, []);

  if (!isInstalled) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-md text-xs font-medium">
      <Icon name="CheckCircle" className="w-3 h-3" />
      App Installed
    </div>
  );
};

/**
 * Offline Storage Badge
 */
export const OfflineStorageBadge: React.FC = () => {
  const [storageSize, setStorageSize] = useState<string>('0 KB');

  useEffect(() => {
    const updateStorageSize = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;
        
        const usageInMB = (usage / (1024 * 1024)).toFixed(1);
        const quotaInMB = (quota / (1024 * 1024)).toFixed(0);
        
        setStorageSize(`${usageInMB} MB / ${quotaInMB} MB`);
      }
    };

    updateStorageSize();
    
    // Update every 30 seconds
    const interval = setInterval(updateStorageSize, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md text-xs font-medium">
      <Icon name="Database" className="w-3 h-3" />
      {storageSize} cached
    </div>
  );
};

