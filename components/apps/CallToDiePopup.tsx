'use client';

import { useState, useRef, useEffect } from 'react';
import { Customer, ImportResult } from '@/types';
import { 
  parseExcelFile, 
  formatPhone, 
  formatDate,
  getStatusIcon,
  getStatusText,
  getStatusColor,
  exportCustomersToExcel,
  generateExcelTemplate
} from '@/lib/calltodie-utils';

interface CallToDiePopupProps {
  onClose: () => void;
}

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

  return (
    <>
      {/* Header */}
      <div className="relative p-6 border-b border-gray-100">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600 font-bold text-2xl"
        >
          ×
        </button>
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
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
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