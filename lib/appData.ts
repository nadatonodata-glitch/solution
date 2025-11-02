import { App } from '@/types';

export const apps: App[] = [
  {
    id: 'qr',
    name: 'QR Maker',
    icon: 'fa-qrcode',
    iconType: 'fontawesome',
    gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
    hasPopup: true, // App có popup riêng
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