'use client';

import { useState } from 'react';
import { App } from '@/types';
import Image from 'next/image';

interface AppItemProps {
  app: App;
  onClick: (appName: string) => void;
}

export default function AppItem({ app, onClick }: AppItemProps) {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    onClick(app.name);
    setTimeout(() => setIsClicked(false), 600);
  };

  const content = (
    <>
      <div
        className="w-16 h-16 flex items-center justify-center rounded-2xl mb-3 transition-all duration-300 shadow-[0_4px_15px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.3)] bg-white/15 backdrop-blur-md border border-white/20"
        style={{ background: app.gradient }}
      >
        {app.iconType === 'custom' ? (
          <Image
            src={app.icon}
            alt={app.name}
            width={32}
            height={32}
            className="w-8 h-8"
          />
        ) : (
          <i className={`fab ${app.icon} text-white text-3xl`}></i>
        )}
      </div>
      <div className="text-white text-sm font-medium text-center drop-shadow-[1px_1px_3px_rgba(0,0,0,0.7)] leading-tight">
        {app.name}
      </div>
    </>
  );

  return (
    <div
      onClick={handleClick}
      className={`flex flex-col items-center cursor-pointer transition-all duration-300 ease-out p-4 rounded-2xl hover:-translate-y-2 hover:scale-105 ${
        isClicked ? 'animate-bounce' : ''
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      {content}
    </div>
  );
}