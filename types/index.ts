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

// ===== INTERFACES CHO CALL TO DIE =====

export interface Customer {
  id: string;
  name: string;
  phone: string;
  last_call: string | null;
  status: 'gọi được' | 'không gọi được' | 'sai số' | null;
  note: string;
  created_at: string;
}

export interface ExcelRow {
  ID?: string;
  'Tên': string;
  'SĐT': string;
  'Last-call'?: string;
  'Trạng thái'?: string;
  'Note'?: string;
}

export interface ImportResult {
  valid: Customer[];
  errors: { row: number; message: string }[];
}

export interface CallResultPopupProps {
  isOpen: boolean;
  customerName: string;
  onComplete: (status: Customer['status'], note: string) => void;
  onClose: () => void;
}