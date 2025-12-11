import { Customer, ExcelRow, ImportResult } from '@/types-calltoddie';
import * as XLSX from 'xlsx';

// Format phone number: 0901234567 → 090-123-4567
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

// Validate phone number
export const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return /^0\d{9,10}$/.test(cleaned);
};

// Format date: ISO string → DD/MM/YYYY
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Parse date từ Excel: DD/MM/YYYY hoặc DD/M/YYYY → ISO string
export const parseExcelDate = (dateStr: string): string | null => {
  if (!dateStr || dateStr.trim() === '') return null;
  
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // Month is 0-indexed
  const year = parseInt(parts[2]);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (day < 1 || day > 31 || month < 0 || month > 11 || year < 2000) return null;
  
  const date = new Date(year, month, day);
  return date.toISOString();
};

// Validate status
export const validateStatus = (status: string | undefined): Customer['status'] => {
  if (!status || status.trim() === '') return null;
  
  const normalized = status.toLowerCase().trim();
  
  // Mapping các biến thể
  if (normalized.includes('gọi được') || normalized.includes('goi duoc') || normalized === 'ok') {
    return 'gọi được';
  }
  if (normalized.includes('không gọi') || normalized.includes('ko goi') || normalized.includes('máy bận') || normalized.includes('may ban')) {
    return 'không gọi được';
  }
  if (normalized.includes('sai số') || normalized.includes('sai so') || normalized.includes('không tồn tại')) {
    return 'sai số';
  }
  
  return null;
};

// Get status color
export const getStatusColor = (status: Customer['status']): string => {
  switch (status) {
    case 'gọi được':
      return '#22c55e'; // green
    case 'không gọi được':
      return '#eab308'; // yellow
    case 'sai số':
      return '#ef4444'; // red
    default:
      return '#9ca3af'; // gray
  }
};

// Get status icon
export const getStatusIcon = (status: Customer['status']): string => {
  switch (status) {
    case 'gọi được':
      return '🟢';
    case 'không gọi được':
      return '🟡';
    case 'sai số':
      return '🔴';
    default:
      return '⚪';
  }
};

// Get status text
export const getStatusText = (status: Customer['status']): string => {
  return status || 'Chưa gọi';
};

// Parse Excel file
export const parseExcelFile = async (file: File): Promise<ImportResult> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  
  // Lấy sheet đầu tiên
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert to JSON
  const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);
  
  const valid: Customer[] = [];
  const errors: { row: number; message: string }[] = [];
  
  jsonData.forEach((row, index) => {
    const rowNum = index + 2; // +2 vì index bắt đầu từ 0 và có header row
    
    // Validate tên
    if (!row['Tên'] || row['Tên'].toString().trim() === '') {
      errors.push({ row: rowNum, message: 'Thiếu tên khách hàng' });
      return;
    }
    
    // Validate SĐT
    const phone = row['SĐT']?.toString().trim() || '';
    if (!phone) {
      errors.push({ row: rowNum, message: 'Thiếu số điện thoại' });
      return;
    }
    if (!validatePhone(phone)) {
      errors.push({ row: rowNum, message: 'Số điện thoại không hợp lệ' });
      return;
    }
    
    // Parse last_call
    let lastCall: string | null = null;
    if (row['Last-call']) {
      lastCall = parseExcelDate(row['Last-call'].toString());
      if (lastCall === null && row['Last-call'].toString().trim() !== '') {
        errors.push({ row: rowNum, message: 'Định dạng ngày không hợp lệ (dùng DD/MM/YYYY)' });
        return;
      }
    }
    
    // Validate status
    const status = validateStatus(row['Trạng thái']?.toString());
    
    // OK - Add to valid list
    valid.push({
<<<<<<< HEAD
      id: row['ID']?.toString() || '', // Nếu có ID thì giữ, không thì để trống (sẽ gen UUID)
=======
      id: row['ID']?.toString() || crypto.randomUUID(), // Nếu có ID thì giữ, không thì gen UUID
>>>>>>> 3e845aaa4f3e9bb8f3fb89e01a059847981ef7ab
      name: row['Tên'].toString().trim(),
      phone: phone.replace(/\D/g, ''), // Lưu số thuần không có dấu
      last_call: lastCall,
      status: status,
      note: row['Note']?.toString().trim() || '',
      created_at: new Date().toISOString(),
    });
  });
  
  return { valid, errors };
};

// Generate Excel template
export const generateExcelTemplate = (): void => {
  const template = [
    {
      'ID': '',
      'Tên': 'Nguyễn Văn A',
      'SĐT': '0901234567',
      'Last-call': '',
      'Trạng thái': '',
      'Note': 'Khách hàng tiềm năng',
    },
    {
      'ID': '',
      'Tên': 'Trần Thị B',
      'SĐT': '0912345678',
      'Last-call': '03/11/2025',
      'Trạng thái': 'Gọi được',
      'Note': 'Hẹn gọi lại chiều',
    },
    {
      'ID': '',
      'Tên': 'Lê Văn C',
      'SĐT': '0923456789',
      'Last-call': '02/11/2025',
      'Trạng thái': 'Không gọi được',
      'Note': 'Máy bận',
    },
  ];
  
  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 8 },  // ID
    { wch: 20 }, // Tên
    { wch: 15 }, // SĐT
    { wch: 12 }, // Last-call
    { wch: 18 }, // Trạng thái
    { wch: 30 }, // Note
  ];
  
  XLSX.writeFile(workbook, 'CallToDie_Template.xlsx');
};

// Export customers to Excel
export const exportCustomersToExcel = (customers: Customer[]): void => {
  const data = customers.map(c => ({
    'ID': c.id,
    'Tên': c.name,
    'SĐT': c.phone,
    'Last-call': formatDate(c.last_call),
    'Trạng thái': getStatusText(c.status),
    'Note': c.note,
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 10 },
    { wch: 20 },
    { wch: 15 },
    { wch: 12 },
    { wch: 18 },
    { wch: 30 },
  ];
  
  const timestamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `CallToDie_Export_${timestamp}.xlsx`);
<<<<<<< HEAD
};
=======
};
>>>>>>> 3e845aaa4f3e9bb8f3fb89e01a059847981ef7ab
