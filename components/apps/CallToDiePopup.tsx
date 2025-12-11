'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

// ==================== TYPES ====================
interface Customer {
  id: string;
  name: string;
  phone: string;
  last_call: string | null;
  status: 'gọi được' | 'không gọi được' | 'sai số' | null;
  note: string;
  created_at: string;
}

interface ExcelRow {
  'ID'?: string;
  'Tên': string;
  'SĐT': string;
  'Last-call'?: string;
  'Trạng thái'?: string;
  'Note'?: string;
}

interface ImportResult {
  valid: Customer[];
  errors: { row: number; message: string }[];
}

interface CallUpdateData {
  status: 'gọi được' | 'không gọi được' | 'sai số';
  note: string;
}

// ==================== UTILS ====================
const CUSTOMERS_TABLE = 'customers';

const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return /^0\d{9,10}$/.test(cleaned);
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const parseExcelDate = (dateStr: string): string | null => {
  if (!dateStr || dateStr.trim() === '') return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const year = parseInt(parts[2]);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (day < 1 || day > 31 || month < 0 || month > 11 || year < 2000) return null;
  const date = new Date(year, month, day);
  return date.toISOString();
};

const validateStatus = (status: string | undefined): Customer['status'] => {
  if (!status || status.trim() === '') return null;
  const normalized = status.toLowerCase().trim();
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

const getStatusColor = (status: Customer['status']): string => {
  switch (status) {
    case 'gọi được': return '#22c55e';
    case 'không gọi được': return '#eab308';
    case 'sai số': return '#ef4444';
    default: return '#9ca3af';
  }
};

const getStatusIcon = (status: Customer['status']): string => {
  switch (status) {
    case 'gọi được': return '🟢';
    case 'không gọi được': return '🟡';
    case 'sai số': return '🔴';
    default: return '⚪';
  }
};

const getStatusText = (status: Customer['status']): string => {
  return status || 'Chưa gọi';
};

const parseExcelFile = async (file: File): Promise<ImportResult> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);
  
  const valid: Customer[] = [];
  const errors: { row: number; message: string }[] = [];
  
  jsonData.forEach((row, index) => {
    const rowNum = index + 2;
    
    if (!row['Tên'] || row['Tên'].toString().trim() === '') {
      errors.push({ row: rowNum, message: 'Thiếu tên khách hàng' });
      return;
    }
    
    const phone = row['SĐT']?.toString().trim() || '';
    if (!phone) {
      errors.push({ row: rowNum, message: 'Thiếu số điện thoại' });
      return;
    }
    if (!validatePhone(phone)) {
      errors.push({ row: rowNum, message: 'Số điện thoại không hợp lệ' });
      return;
    }
    
    let lastCall: string | null = null;
    if (row['Last-call']) {
      lastCall = parseExcelDate(row['Last-call'].toString());
      if (lastCall === null && row['Last-call'].toString().trim() !== '') {
        errors.push({ row: rowNum, message: 'Định dạng ngày không hợp lệ (dùng DD/MM/YYYY)' });
        return;
      }
    }
    
    const status = validateStatus(row['Trạng thái']?.toString());
    
    valid.push({
      id: row['ID']?.toString() || '',
      name: row['Tên'].toString().trim(),
      phone: phone.replace(/\D/g, ''),
      last_call: lastCall,
      status: status,
      note: row['Note']?.toString().trim() || '',
      created_at: new Date().toISOString(),
    });
  });
  
  return { valid, errors };
};

const generateExcelTemplate = (): void => {
  const template = [
    { 'ID': '', 'Tên': 'Nguyễn Văn A', 'SĐT': '0901234567', 'Last-call': '', 'Trạng thái': '', 'Note': 'Khách hàng tiềm năng' },
    { 'ID': '', 'Tên': 'Trần Thị B', 'SĐT': '0912345678', 'Last-call': '03/11/2025', 'Trạng thái': 'Gọi được', 'Note': 'Hẹn gọi lại chiều' },
    { 'ID': '', 'Tên': 'Lê Văn C', 'SĐT': '0923456789', 'Last-call': '02/11/2025', 'Trạng thái': 'Không gọi được', 'Note': 'Máy bận' },
  ];
  
  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
  worksheet['!cols'] = [{ wch: 8 }, { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 30 }];
  XLSX.writeFile(workbook, 'CallToDie_Template.xlsx');
};

const exportCustomersToExcel = (customers: Customer[]): void => {
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
  worksheet['!cols'] = [{ wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 30 }];
  
  const timestamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `CallToDie_Export_${timestamp}.xlsx`);
};

// ==================== MAIN COMPONENT ====================
interface CallToDiePopupProps {
  onClose: () => void;
}

<<<<<<< HEAD
export default function CallToDiePopup({ onClose }: CallToDiePopupProps) {
  // State management
  const [view, setView] = useState<'main' | 'update' | 'import'>('main');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' as 'success' | 'error' | 'info' });
  
  // Update popup state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [updateStatus, setUpdateStatus] = useState<CallUpdateData['status'] | null>(null);
  const [updateNote, setUpdateNote] = useState('');
  
  // Import popup state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load customers
  const loadCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(CUSTOMERS_TABLE)
        .select('*')
        .order('last_call', { ascending: true, nullsFirst: true })
        .order('id', { ascending: false });

      if (error) throw error;

      const sorted = (data || []).sort((a, b) => {
        if (a.last_call === null && b.last_call !== null) return -1;
        if (a.last_call !== null && b.last_call === null) return 1;
        if (a.last_call === null && b.last_call === null) {
          return b.id.localeCompare(a.id);
        }
        return new Date(a.last_call!).getTime() - new Date(b.last_call!).getTime();
      });

      setCustomers(sorted);
    } catch (error: any) {
      showNotification(`Lỗi tải dữ liệu: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm.replace(/\D/g, ''))
  );

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'info' }), 3000);
  };

  // ==================== HANDLERS ====================
  const handleCallClick = (customer: Customer) => {
    window.location.href = `tel:${customer.phone}`;
    setTimeout(() => {
      setSelectedCustomer(customer);
      setUpdateStatus(null);
      setUpdateNote('');
      setView('update');
    }, 500);
  };

  const handleSaveCallUpdate = async () => {
    if (!selectedCustomer || !updateStatus) {
      alert('Vui lòng chọn trạng thái!');
      return;
    }

    try {
      const { error } = await supabase
        .from(CUSTOMERS_TABLE)
        .update({
          last_call: new Date().toISOString(),
          status: updateStatus,
          note: updateNote,
        })
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      showNotification('✅ Đã lưu cập nhật!', 'success');
      setView('main');
      setSelectedCustomer(null);
      loadCustomers();
    } catch (error: any) {
      showNotification(`❌ Lỗi: ${error.message}`, 'error');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    try {
      const result = await parseExcelFile(file);
      setParseResult(result);
    } catch (error: any) {
      alert(`Lỗi đọc file: ${error.message}`);
      setSelectedFile(null);
    }
  };

  const handleImport = async () => {
    if (!parseResult || parseResult.valid.length === 0) return;

    setIsImporting(true);

    try {
      const toUpdate = parseResult.valid.filter((c) => c.id && c.id.trim() !== '');
      const toInsert = parseResult.valid.filter((c) => !c.id || c.id.trim() === '');

      if (toUpdate.length > 0) {
        const updatePromises = toUpdate.map((customer) =>
          supabase
            .from(CUSTOMERS_TABLE)
            .update({
              name: customer.name,
              phone: customer.phone,
              last_call: customer.last_call,
              status: customer.status,
              note: customer.note,
            })
            .eq('id', customer.id)
        );
        await Promise.all(updatePromises);
      }

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase.from(CUSTOMERS_TABLE).insert(
          toInsert.map((c) => ({
            name: c.name,
            phone: c.phone,
            last_call: c.last_call,
            status: c.status,
            note: c.note,
          }))
        );
        if (insertError) throw insertError;
      }

      alert(`✅ Import thành công!\n\n- Đã thêm mới: ${toInsert.length} khách\n- Đã cập nhật: ${toUpdate.length} khách`);
      setView('main');
      setSelectedFile(null);
      setParseResult(null);
      loadCustomers();
    } catch (error: any) {
      alert(`❌ Lỗi import: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // ==================== RENDER ====================
  const statusOptions: { value: CallUpdateData['status']; label: string; icon: string; color: string }[] = [
    { value: 'gọi được', label: 'Gọi được', icon: '🟢', color: '#22c55e' },
    { value: 'không gọi được', label: 'Không gọi được', icon: '🟡', color: '#eab308' },
    { value: 'sai số', label: 'Sai số', icon: '🔴', color: '#ef4444' },
  ];
=======
const LOCAL_STORAGE_KEY = 'call-to-die-customers';

// Mini popup sau khi gọi
interface CallResultPopupProps {
  isOpen: boolean;
  customerName: string;
  onComplete: (status: Customer['status'], note: string) => void;
  onClose: () => void;
}

function CallResultPopup({ isOpen, customerName, onComplete, onClose }: CallResultPopupProps) {
  const [selectedStatus, setSelectedStatus] = useState<Customer['status']>(null);
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onComplete(selectedStatus, note);
    setSelectedStatus(null);
    setNote('');
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scaleIn">
        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
          Kết quả cuộc gọi
        </h3>
        <p className="text-center text-gray-600 mb-6">
          Khách hàng: <strong>{customerName}</strong>
        </p>

        {/* Status buttons */}
        <div className="space-y-3 mb-4">
          <button
            onClick={() => setSelectedStatus('gọi được')}
            className={`w-full p-4 rounded-xl border-2 font-semibold transition-all ${
              selectedStatus === 'gọi được'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-green-300'
            }`}
          >
            🟢 Gọi được
          </button>
          <button
            onClick={() => setSelectedStatus('không gọi được')}
            className={`w-full p-4 rounded-xl border-2 font-semibold transition-all ${
              selectedStatus === 'không gọi được'
                ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                : 'border-gray-200 hover:border-yellow-300'
            }`}
          >
            🟡 Không gọi được (máy bận)
          </button>
          <button
            onClick={() => setSelectedStatus('sai số')}
            className={`w-full p-4 rounded-xl border-2 font-semibold transition-all ${
              selectedStatus === 'sai số'
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-200 hover:border-red-300'
            }`}
          >
            🔴 Sai số
          </button>
        </div>

        {/* Note input */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ghi chú thêm (tùy chọn)..."
          className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
          rows={3}
        />

        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 h-12 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedStatus}
            className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CallToDiePopup({ onClose }: CallToDiePopupProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentCallCustomer, setCurrentCallCustomer] = useState<Customer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load từ localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setCustomers(data.customers || []);
        setFileName(data.fileName || '');
      } catch (error) {
        console.error('Load localStorage failed:', error);
      }
    }
  }, []);

  // Save vào localStorage
  useEffect(() => {
    if (customers.length > 0) {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({ customers, fileName })
      );
    }
  }, [customers, fileName]);

  // Upload Excel
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const result: ImportResult = await parseExcelFile(file);

      if (result.errors.length > 0) {
        const errorMsg = result.errors
          .map((err) => `Dòng ${err.row}: ${err.message}`)
          .join('\n');
        alert(`Có lỗi khi đọc file:\n${errorMsg}`);
      }

      if (result.valid.length > 0) {
        setCustomers(result.valid);
        setFileName(file.name);
      } else {
        alert('Không có dữ liệu hợp lệ trong file Excel!');
      }
    } catch (error) {
      console.error('Parse Excel failed:', error);
      alert('Không thể đọc file Excel. Vui lòng kiểm tra lại!');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Bắt đầu gọi
  const handleStartCall = (customer: Customer) => {
    // Kích hoạt gọi điện trên điện thoại
    window.location.href = `tel:${customer.phone}`;
    
    // Mở popup chọn kết quả
    setCurrentCallCustomer(customer);
  };

  // Hoàn thành cuộc gọi
  const handleCallComplete = (status: Customer['status'], note: string) => {
    if (!currentCallCustomer) return;

    const updatedCustomers = customers.map((c) =>
      c.id === currentCallCustomer.id
        ? {
            ...c,
            status,
            note,
            last_call: new Date().toISOString(),
          }
        : c
    );

    setCustomers(updatedCustomers);
    setCurrentCallCustomer(null);
  };

  // Đóng popup kết quả
  const handleCloseCallResult = () => {
    setCurrentCallCustomer(null);
  };

  // Export Excel
  const handleExport = () => {
    exportCustomersToExcel(customers);
    // Xóa localStorage sau khi export
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setCustomers([]);
    setFileName('');
  };

  // Reset tất cả
  const handleReset = () => {
    if (confirm('Bạn có chắc muốn xóa tất cả dữ liệu?')) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setCustomers([]);
      setFileName('');
    }
  };

  // Tải template
  const handleDownloadTemplate = () => {
    generateExcelTemplate();
  };

  // Filter: ẨN khách đã gọi (có status và last_call mới)
  // Nếu upload Excel có sẵn status cũ → vẫn hiển thị
  // Chỉ ẩn những khách được gọi TRONG phiên này (last_call được cập nhật)
  const now = new Date().toISOString().split('T')[0]; // Ngày hôm nay
  const pendingCustomers = customers.filter((c) => {
    // Nếu chưa có status → hiển thị
    if (!c.status) return true;
    // Nếu có status nhưng last_call không phải hôm nay → hiển thị (data cũ từ Excel)
    if (c.last_call) {
      const lastCallDate = new Date(c.last_call).toISOString().split('T')[0];
      return lastCallDate !== now;
    }
    // Có status nhưng không có last_call → ẩn (vừa gọi xong)
    return false;
  });
  const completedCount = customers.length - pendingCustomers.length;
  const isCompleted = customers.length > 0 && pendingCustomers.length === 0;
>>>>>>> 3e845aaa4f3e9bb8f3fb89e01a059847981ef7ab

  return (
    <>
      {/* Header */}
<<<<<<< HEAD
      <div className="relative p-6 border-b border-gray-100 bg-gradient-to-r from-pink-50 to-purple-50">
        {view !== 'main' && (
          <button
            onClick={() => setView('main')}
            className="absolute left-6 top-6 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600 font-bold text-xl"
          >
            ←
          </button>
        )}
=======
      <div className="relative p-6 border-b border-gray-100">
>>>>>>> 3e845aaa4f3e9bb8f3fb89e01a059847981ef7ab
        <button
          onClick={onClose}
          className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600 font-bold text-2xl"
        >
          ×
        </button>
<<<<<<< HEAD
        <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
          {view === 'main' && '📞 CALL TO DIE'}
          {view === 'update' && 'Cập nhật cuộc gọi'}
          {view === 'import' && '📤 Import danh sách'}
        </h1>
        {view === 'main' && (
          <p className="text-center text-sm text-gray-500 mt-1">Telesale Management System</p>
        )}
      </div>

      {/* MAIN VIEW */}
      {view === 'main' && (
        <>
          <div className="p-4 border-b border-gray-100 bg-white">
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Tìm tên hoặc số điện thoại..."
                className="flex-1 h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none"
              />
              <button
                onClick={generateExcelTemplate}
                className="h-12 px-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium whitespace-nowrap"
              >
                📥 Mẫu
              </button>
              <button
                onClick={() => setView('import')}
                className="h-12 px-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium whitespace-nowrap"
              >
                📤 Import
              </button>
              <button
                onClick={() => exportCustomersToExcel(customers)}
                className="h-12 px-4 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors font-medium whitespace-nowrap"
              >
                💾 Export
              </button>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              Tổng: <span className="font-semibold">{filteredCustomers.length}</span> khách hàng
            </div>
          </div>

          <div className="overflow-auto" style={{ maxHeight: 'calc(90vh - 250px)' }}>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-400">Đang tải...</div>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <div className="text-4xl mb-3">📋</div>
                <div>Chưa có khách hàng nào</div>
                <button
                  onClick={() => setView('import')}
                  className="mt-4 px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:scale-105 transition-transform"
                >
                  Import danh sách
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 bg-gradient-to-r from-pink-100 to-purple-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tên</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">SĐT</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Last-call</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Note</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Gọi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b border-gray-100 hover:bg-pink-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">{customer.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{customer.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-mono">{formatPhone(customer.phone)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(customer.last_call)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg font-medium"
                          style={{
                            backgroundColor: `${getStatusColor(customer.status)}15`,
                            color: getStatusColor(customer.status),
                          }}
                        >
                          {getStatusIcon(customer.status)} {getStatusText(customer.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{customer.note || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleCallClick(customer)}
                          className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:scale-110 transition-transform shadow-md flex items-center justify-center"
                        >
                          📞
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* UPDATE VIEW */}
      {view === 'update' && selectedCustomer && (
        <div className="p-6 space-y-6">
          <div className="text-gray-600">
            <div className="font-semibold text-lg">{selectedCustomer.name}</div>
            <div className="text-sm font-mono mt-1">📱 {formatPhone(selectedCustomer.phone)}</div>
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-700 mb-3">
              Trạng thái cuộc gọi: <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {statusOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => setUpdateStatus(option.value)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    updateStatus === option.value ? 'border-current shadow-lg scale-105' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{
                    borderColor: updateStatus === option.value ? option.color : undefined,
                    backgroundColor: updateStatus === option.value ? `${option.color}10` : undefined,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        updateStatus === option.value ? 'border-current' : 'border-gray-300'
                      }`}
                      style={{ borderColor: updateStatus === option.value ? option.color : undefined }}
                    >
                      {updateStatus === option.value && (
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: option.color }}></div>
                      )}
                    </div>
                    <span className="text-2xl">{option.icon}</span>
                    <span className="text-base font-medium text-gray-800">{option.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-700 mb-3">Ghi chú:</label>
            <textarea
              value={updateNote}
              onChange={(e) => setUpdateNote(e.target.value)}
              placeholder="Khách hẹn gọi lại lúc 15h, quan tâm sản phẩm..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setView('main')}
              className="flex-1 h-12 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSaveCallUpdate}
              className="flex-1 h-12 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg"
            >
              💾 Lưu
            </button>
          </div>
        </div>
      )}

      {/* IMPORT VIEW */}
      {view === 'import' && (
        <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 150px)' }}>
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-3">Chọn file Excel:</label>
            <label className="block border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-purple-400 transition-colors cursor-pointer bg-gray-50 hover:bg-purple-50">
              <div className="text-5xl mb-4">☁️</div>
              <div className="text-gray-600 font-medium">Kéo thả file Excel hoặc click để chọn</div>
              <div className="text-xs text-gray-400 mt-2">Hỗ trợ: .xlsx, .xls</div>
=======
        <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
          CALL TO DIE ☎️
        </h1>
        {customers.length > 0 && (
          <p className="text-center text-sm text-gray-500 mt-2">
            Đã gọi {completedCount}/{customers.length} • Còn {pendingCustomers.length} cuộc gọi
          </p>
        )}
      </div>

      {/* Content */}
      <div className="p-8 overflow-y-auto max-h-[calc(90vh-80px)]">
        {/* No data - Upload screen */}
        {customers.length === 0 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">📞</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Upload File Excel
              </h2>
              <p className="text-sm text-gray-600">
                File Excel phải có các cột: <strong>ID, Tên, SĐT, Last-call, Trạng thái, Note</strong>
              </p>
            </div>

            <label className="block border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-pink-500 transition-colors cursor-pointer">
              <div className="text-5xl mb-3">☁️</div>
              <div className="text-gray-600">
                {isLoading ? 'Đang xử lý...' : 'Kéo thả hoặc click để chọn file Excel'}
              </div>
>>>>>>> 3e845aaa4f3e9bb8f3fb89e01a059847981ef7ab
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
<<<<<<< HEAD
                onChange={handleFileSelect}
                className="hidden"
              />
              {selectedFile && (
                <div className="mt-4 text-sm text-green-600 font-medium flex items-center justify-center gap-2">
                  <span>✓</span>
                  <span>Đã chọn: {selectedFile.name}</span>
                </div>
              )}
            </label>
          </div>

          {parseResult && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-2 text-green-700 font-semibold">
                    <span>✅</span>
                    <span>{parseResult.valid.length} khách hợp lệ</span>
                  </div>
                  {parseResult.errors.length > 0 && (
                    <>
                      <div className="w-px h-4 bg-gray-300"></div>
                      <div className="flex items-center gap-2 text-orange-700 font-semibold">
                        <span>⚠️</span>
                        <span>{parseResult.errors.length} lỗi</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {parseResult.errors.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowErrors(!showErrors)}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-2"
                  >
                    <span>{showErrors ? '▼' : '▶'}</span>
                    <span>Xem chi tiết lỗi</span>
                  </button>
                  {showErrors && (
                    <div className="mt-3 p-4 rounded-xl bg-orange-50 border border-orange-200 max-h-48 overflow-y-auto">
                      <div className="space-y-2 text-sm">
                        {parseResult.errors.map((err, idx) => (
                          <div key={idx} className="text-orange-700">
                            • Dòng {err.row}: {err.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">Xem trước danh sách (5 khách đầu):</div>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Tên</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">SĐT</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Last-call</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseResult.valid.slice(0, 5).map((customer, idx) => (
                        <tr key={idx} className="border-t border-gray-100">
                          <td className="px-3 py-2">{customer.name}</td>
                          <td className="px-3 py-2 font-mono">{customer.phone}</td>
                          <td className="px-3 py-2">{customer.last_call || '-'}</td>
                          <td className="px-3 py-2 text-gray-600 truncate max-w-xs">{customer.note || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parseResult.valid.length > 5 && (
                    <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 text-center">
                      ... và {parseResult.valid.length - 5} khách nữa
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setView('main')}
              className="flex-1 h-12 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleImport}
              disabled={!parseResult || parseResult.valid.length === 0 || isImporting}
              className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? 'ĐANG IMPORT...' : `✅ XÁC NHẬN IMPORT (${parseResult?.valid.length || 0})`}
            </button>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification.show && (
        <div className="fixed top-5 right-5 z-[1000] animate-slideIn">
          <div className="bg-black/80 text-white px-5 py-3 rounded-lg text-sm backdrop-blur-md border border-white/20 shadow-lg">
            {notification.message}
          </div>
        </div>
      )}
    </>
  );
}
=======
                onChange={handleFileUpload}
                disabled={isLoading}
                className="hidden"
              />
            </label>

            <button
              onClick={handleDownloadTemplate}
              className="w-full h-12 border-2 border-purple-600 text-purple-600 font-semibold rounded-lg hover:bg-purple-600 hover:text-white transition-colors"
            >
              📥 Tải file Excel mẫu
            </button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <strong>💡 Lưu ý:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>File Excel phải có đúng 6 cột: ID, Tên, SĐT, Last-call, Trạng thái, Note</li>
                <li>Sau mỗi cuộc gọi sẽ có popup để chọn kết quả</li>
                <li>Dữ liệu tự động lưu, thoát giữa chừng vẫn giữ được tiến độ</li>
              </ul>
            </div>
          </div>
        )}

        {/* Has data - Table view */}
        {customers.length > 0 && !isCompleted && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    File: <strong>{fileName}</strong>
                  </p>
                  <p className="text-xs text-gray-500">
                    Tổng: {customers.length} khách hàng
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-pink-600">{pendingCustomers.length}</p>
                  <p className="text-xs text-gray-600">chưa gọi</p>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">STT</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Tên</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">SĐT</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Last Call</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Ghi chú</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingCustomers.map((customer, idx) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{customer.name}</td>
                        <td className="px-4 py-3 text-gray-800 font-mono">
                          {formatPhone(customer.phone)}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {formatDate(customer.last_call)}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs max-w-[200px] truncate">
                          {customer.note || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleStartCall(customer)}
                            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg hover:scale-105 transition-transform text-xs font-semibold"
                          >
                            📞 Gọi
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 h-12 border-2 border-red-600 text-red-600 font-semibold rounded-lg hover:bg-red-600 hover:text-white transition-colors"
              >
                🗑️ Xóa dữ liệu
              </button>
              <button
                onClick={handleExport}
                className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:scale-105 transition-transform"
              >
                📥 Xuất Excel ({completedCount} đã gọi)
              </button>
            </div>
          </div>
        )}

        {/* Completed state */}
        {isCompleted && (
          <div className="text-center space-y-6">
            <div className="text-8xl">🎉</div>
            <h2 className="text-3xl font-bold text-gray-800">
              Chúc mừng bạn đã hoàn thành!
            </h2>
            <p className="text-gray-600">
              Bạn đã gọi xong <strong>{customers.length}</strong> khách hàng
            </p>
            <button
              onClick={handleExport}
              className="w-full max-w-md h-14 bg-gradient-to-r from-pink-600 to-red-600 text-white font-semibold rounded-lg hover:scale-105 transition-transform shadow-lg"
            >
              📥 Tải báo cáo Excel
            </button>
          </div>
        )}
      </div>

      {/* Call Result Popup */}
      <CallResultPopup
        isOpen={!!currentCallCustomer}
        customerName={currentCallCustomer?.name || ''}
        onComplete={handleCallComplete}
        onClose={handleCloseCallResult}
      />
    </>
  );
}
>>>>>>> 3e845aaa4f3e9bb8f3fb89e01a059847981ef7ab
