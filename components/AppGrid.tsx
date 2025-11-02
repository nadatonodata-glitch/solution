'use client';

import { useState } from 'react';
import { apps } from '@/lib/appData';
import AppItem from './AppItem';
import Notification from './Notification';
import PopupOverlay from './PopupOverlay';
import QRPopup from './apps/QRPopup';
import { usePopup } from '@/hooks/usePopup';
import { handleAppClick } from '@/lib/utils';

export default function AppGrid() {
  const [notification, setNotification] = useState({ show: false, message: '' });
  const { isOpen, currentApp, openPopup, closePopup } = usePopup();

  const onAppClick = (appId: string, appName: string, hasPopup?: boolean, link?: string) => {
    if (hasPopup) {
      // Mở popup
      openPopup(appId);
    } else if (link) {
      // Mở link
      window.open(link, '_blank', 'noopener,noreferrer');
    }
    
    handleAppClick(appName, (message) => {
      setNotification({ show: true, message });
    });
  };

  return (
    <>
      <main className="relative z-10 min-h-screen flex flex-col justify-center items-center px-5 py-10 pt-28 pb-10">
        <h1 className="text-white text-3xl font-light text-center mb-12 drop-shadow-[2px_2px_4px_rgba(0,0,0,0.6)] tracking-wide">
          Ứng Dụng Của Tôi
        </h1>

        <div className="grid grid-cols-4 gap-8 max-w-4xl w-full md:grid-cols-6 lg:grid-cols-8 sm:grid-cols-4">
          {apps.map((app) => (
            <AppItem 
              key={app.id} 
              app={app} 
              onClick={(appName) => onAppClick(app.id, appName, app.hasPopup, app.link)} 
            />
          ))}
        </div>
      </main>

      <Notification
        message={notification.message}
        show={notification.show}
        onClose={() => setNotification({ show: false, message: '' })}
      />

      {/* Popup Overlay */}
      <PopupOverlay isOpen={isOpen} onClose={closePopup}>
        {currentApp === 'qr' && <QRPopup onClose={closePopup} />}
        {/* Thêm các popup khác ở đây */}
      </PopupOverlay>
    </>
  );
}