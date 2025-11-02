import { QRData } from '@/types';

// Validate input theo loại QR
export const validateQRInput = (type: QRData['type'], content: string): boolean => {
  if (!content || content.trim() === '') return false;

  switch (type) {
    case 'link':
      try {
        new URL(content);
        return true;
      } catch {
        return false;
      }
    case 'file':
      return content.length > 0;
    case 'vcard':
      return content.includes('BEGIN:VCARD') && content.includes('END:VCARD');
    default:
      return false;
  }
};

// Tạo VCard string từ thông tin
export const createVCard = (data: {
  fullName: string;
  phone: string;
  email?: string;
  company?: string;
}): string => {
  let vcard = 'BEGIN:VCARD\nVERSION:4.0\n';
  vcard += `FN:${data.fullName}\n`;
  vcard += `N:${data.fullName};;;;\n`; // Structured name
  vcard += `TEL;TYPE=cell:${data.phone}\n`;
  if (data.email) vcard += `EMAIL:${data.email}\n`;
  if (data.company) vcard += `ORG:${data.company}\n`;
  vcard += 'END:VCARD';
  return vcard;
};

// Format hiển thị info QR
export const formatQRInfo = (qrData: QRData): string => {
  switch (qrData.type) {
    case 'link':
      return `URL: ${qrData.content}`;
    case 'file':
      // Hiển thị URL từ Supabase
      if (qrData.content.includes('supabase.co')) {
        const fileName = qrData.content.split('/').pop() || 'file';
        return `File đã upload: ${decodeURIComponent(fileName)}`;
      }
      return `File: ${qrData.content}`;
    case 'vcard':
      return 'Danh thiếp điện tử với thông tin liên hệ';
    default:
      return 'Mã QR đã được tạo thành công';
  }
};