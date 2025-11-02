import { useState } from 'react';

export function usePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentApp, setCurrentApp] = useState<string | null>(null);

  const openPopup = (appId: string) => {
    setCurrentApp(appId);
    setIsOpen(true);
  };

  const closePopup = () => {
    setIsOpen(false);
    // Delay để animation chạy xong mới reset currentApp
    setTimeout(() => {
      setCurrentApp(null);
    }, 300);
  };

  return {
    isOpen,
    currentApp,
    openPopup,
    closePopup,
  };
}