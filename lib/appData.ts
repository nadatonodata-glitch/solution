import { App } from '@/types';

export const apps: App[] = [
  {
    id: 'qr',
    name: 'QR Maker',
    icon: '/icons-app/QRapp.png',
    iconType: 'custom',
    gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
    hasPopup: true,
  },
  {
    id: 'call-to-die',
    name: 'Call to Die',
    icon: 'fa-phone',
    iconType: 'fontawesome',
    gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
    hasPopup: true,
  },
  {
    id: 'calltoddie',
    name: 'CallToDie',
    icon: '/icons-app/calltoddie.png',
    iconType: 'custom',
    gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
    hasPopup: true,
  },
  {
    id: 'chrome',
    name: 'Chrome',
    icon: 'fa-chrome',
    iconType: 'fontawesome',
    gradient: 'linear-gradient(135deg, #4285f4, #34a853)',
    link: 'https://www.google.com/chrome/',
  },
];