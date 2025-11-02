export interface App {
  id: string;
  name: string;
  icon: string; // Path to icon: "/icons/chrome.svg" or FontAwesome class: "fa-chrome"
  iconType: 'custom' | 'fontawesome';
  gradient: string;
  link?: string;
  hasPopup?: boolean; // App có popup riêng hay mở link
}

export interface NotificationProps {
  message: string;
  show: boolean;
  onClose: () => void;
}

// Interface cho QR Code
export interface QRData {
  type: 'link' | 'file' | 'vcard';
  content: string;
  bgColor: string;
  qrColor: string;
  hasLogo: boolean;
}

// Interface cho Popup
export interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}