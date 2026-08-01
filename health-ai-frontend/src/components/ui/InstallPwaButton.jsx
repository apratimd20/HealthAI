import React, { useEffect, useState } from 'react';
import { IoDownloadOutline, IoCloseOutline, IoPhonePortraitOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';

export default function InstallPwaButton({ className = '' }) {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const checkInstalled = () => {
      const displayMode = window.matchMedia('(display-mode: standalone)').matches;
      const standalone = window.navigator.standalone === true;
      setIsInstalled(Boolean(displayMode || standalone));
    };

    checkInstalled();

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setShowConfirmModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.matchMedia('(display-mode: standalone)').addEventListener?.('change', checkInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.matchMedia('(display-mode: standalone)').removeEventListener?.('change', checkInstalled);
    };
  }, []);

  const handleInstall = () => {
    if (isInstalled) return;
    setShowConfirmModal(true);
  };

  const confirmInstall = async () => {
    if (!installPrompt) {
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

      if (isAndroid || /Edg|Chrome|Chromium/i.test(navigator.userAgent)) {
        toast('Use the browser menu: ⋮ > Install app', { icon: '📲' });
      } else if (isSafari) {
        toast('On Safari: Share > Add to Home Screen', { icon: '📱' });
      } else {
        toast('Your browser may not support direct install prompts here.', { icon: 'ℹ️' });
      }

      setShowConfirmModal(false);
      return;
    }

    try {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;

      if (choice.outcome === 'accepted') {
        toast.success('✅ Health AI installed successfully');
      } else {
        toast('Install cancelled', { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error('PWA install error:', error);
      toast.error('Failed to install app');
    } finally {
      setInstallPrompt(null);
      setShowConfirmModal(false);
    }
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstall}
        className={`inline-flex h-9 max-w-[120px] items-center justify-center gap-1.5 rounded-full border border-brand/40 bg-brand/12 px-2.5 py-1.5 text-[10px] font-semibold text-brand transition-all duration-200 hover:bg-brand/18 hover:shadow-[0_0_12px_rgba(16,185,129,0.2)] sm:max-w-none sm:gap-2 sm:px-3 sm:text-xs ${className}`}
        title="Install Health AI app"
        aria-label="Install Health AI app"
      >
        <IoDownloadOutline size={15} className="shrink-0" />
        <span className="hidden sm:inline">Install App</span>
        <span className="block sm:hidden">Install</span>
      </button>

      {showConfirmModal && (
        <div className="fixed inset-0 right-10 z-[60] flex items-start justify-center  p-2  sm:pt-[20vh]  sm:p-3">
          <div className="relative w-[min(74vw,300px)] rounded-2xl border border-white/10 bg-surface-card p-3  sm:w-[min(72vw,320px)] sm:p-4">
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="absolute right-2 top-2 rounded-full p-1 text-fg-muted transition hover:bg-white/5 hover:text-fg"
              aria-label="Close install modal"
            >
              <IoCloseOutline size={16} />
            </button>

            <div className="max-h-[75vh] overflow-y-auto text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/12 text-brand sm:h-12 sm:w-12">
                <IoPhonePortraitOutline size={20} className="sm:size-[24px]" />
              </div>

              <h3 className="text-base font-bold text-fg sm:text-lg">Install Health AI</h3>
              <p className="mt-1.5 text-[11px] leading-4 text-fg-muted sm:text-xs sm:leading-5">
                Add this app to your home screen for a faster, app-like experience with quick access and offline support.
              </p>

              <div className="mt-3 rounded-xl border border-white/10 bg-surface-base/80 p-2.5 text-left sm:p-3">
                <p className="text-[11px] font-semibold text-fg sm:text-xs">What you get:</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[10.5px] text-fg-muted sm:text-[11px]">
                  <li>Launch like a native app</li>
                  <li>Faster repeat access</li>
                  <li>Offline-friendly experience</li>
                </ul>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 rounded-full border border-white/10 bg-transparent px-2.5 py-2 text-xs font-medium text-fg-muted transition hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmInstall}
                  className="flex-1 rounded-full bg-brand px-2.5 py-2 text-xs font-semibold text-white transition hover:bg-brand-hover"
                >
                  Install
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
