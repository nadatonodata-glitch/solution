'use client';

import { useEffect } from 'react';
import { NotificationProps } from '@/types';

export default function Notification({ message, show, onClose }: NotificationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed top-5 right-5 z-[1000] animate-slideIn">
      <div className="bg-black/80 text-white px-5 py-3 rounded-lg text-sm backdrop-blur-md border border-white/20 shadow-lg">
        {message}
      </div>
    </div>
  );
}
