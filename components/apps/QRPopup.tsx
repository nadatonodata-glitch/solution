'use client';

import { useState, useRef, useEffect } from 'react';
import { QRData } from '@/types';
import { validateQRInput, createVCard, formatQRInfo } from '@/lib/qrUtils';
import { uploadFileToSupabase } from '@/lib/uploadUtils';
import QRCode from 'qrcode';

interface QRPopupProps {
  onClose: () => void;
}

export default function QRPopup({ onClose }: QRPopupProps) {
  const [page, setPage] = useState(1);
  const [qrType, setQrType] = useState<'link' | 'file' | 'vcard'>('link');
  const [qrData, setQrData] = useState<QRData>({
    type: 'link',
    content: '',
    bgColor: '#ffffff',
    qrColor: '#000000',
    hasLogo: false,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form inputs
  const [linkInput, setLinkInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [vcardData, setVcardData] = useState({
    fullName: '',
    phone: '',
    email: '',
    company: '',
  });

  const goToPage2 = (type: 'link' | 'file' | 'vcard') => {
    setQrType(type);
    setQrData({ ...qrData, type });
    setPage(2);
  };

  const generateQR = async () => {
    let content = '';
    
    switch (qrType) {
      case 'link':
        content = linkInput;
        if (!content || content.trim() === '') {
          alert('Vui lòng nhập URL!');
          return;
        }
        break;
        
      case 'file':
        if (!selectedFile) {
          alert('Vui lòng chọn file!');
          return;
        }
        
        // Upload file lên Supabase
        console.log('Bắt đầu upload file:', selectedFile.name);
        setIsUploading(true);
        const uploadResult = await uploadFileToSupabase(selectedFile);
        setIsUploading(false);
        
        console.log('Kết quả upload:', uploadResult);
        
        if (!uploadResult.success || !uploadResult.url) {
          alert(`Upload thất bại: ${uploadResult.error || 'Lỗi không xác định'}`);
          return;
        }
        
        content = uploadResult.url;
        setFileUrl(content);
        console.log('URL file từ Supabase:', content);
        break;
        
      case 'vcard':
        if (!vcardData.fullName || !vcardData.phone) {
          alert('Vui lòng nhập họ tên và số điện thoại!');
          return;
        }
        content = createVCard(vcardData);
        break;
    }

    const newQrData = { ...qrData, content, type: qrType };
    setQrData(newQrData);
    setQrGenerated(false);
    setPage(3);
    
    // Tạo QR ngay
    setTimeout(() => {
      generateQRCanvas(newQrData);
    }, 100);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const generateQRCanvas = async (data: QRData) => {
    if (!canvasRef.current || !data.content) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    try {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Tăng size nếu có logo để độ phân giải tốt hơn
      const qrSize = data.hasLogo && logoImage ? 400 : 280;

      // Tạo QR
      await QRCode.toCanvas(canvas, data.content, {
        color: {
          dark: data.qrColor,
          light: data.bgColor,
        },
        width: qrSize,
        margin: 2,
        errorCorrectionLevel: 'H',
      });

      console.log('QR created successfully');
      setQrGenerated(true);

      // Vẽ logo nếu có
      if (data.hasLogo && logoImage) {
        const img = new Image();
        img.onload = () => {
          const logoSize = qrSize * 0.15; // Logo chiếm 15% QR
          const x = (canvas.width - logoSize) / 2;
          const y = (canvas.height - logoSize) / 2;
          
          // Nền trắng cho logo
          ctx.fillStyle = 'white';
          ctx.fillRect(x - 5, y - 5, logoSize + 10, logoSize + 10);
          
          // Vẽ logo
          ctx.drawImage(img, x, y, logoSize, logoSize);
        };
        img.src = logoImage;
      }
    } catch (error) {
      console.error('QR Error:', error);
      alert('Không thể tạo mã QR. Vui lòng thử lại!');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (page === 3 && qrData.content) {
      generateQRCanvas(qrData);
    }
  }, [page]);

  const downloadQR = async () => {
    // Nếu có logo, tải trực tiếp từ canvas đã vẽ
    if (qrData.hasLogo && logoImage && canvasRef.current) {
      try {
        const canvas = canvasRef.current;
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `qr-${qrData.type}-${Date.now()}.png`;
        link.href = url;
        link.click();
      } catch (error) {
        console.error('Download from canvas failed:', error);
      }
      return;
    }

    // Nếu không có logo, tạo QR mới với độ phân giải cao
    try {
      const url = await QRCode.toDataURL(qrData.content, {
        color: {
          dark: qrData.qrColor,
          light: qrData.bgColor,
        },
        width: 512,
        margin: 2,
        errorCorrectionLevel: 'H',
      });

      const link = document.createElement('a');
      link.download = `qr-${qrData.type}-${Date.now()}.png`;
      link.href = url;
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="relative p-6 border-b border-gray-100">
        {page > 1 && (
          <button
            onClick={() => setPage(page - 1)}
            className="absolute left-6 top-6 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600 font-bold text-xl"
          >
            ←
          </button>
        )}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600 font-bold text-2xl"
        >
          ×
        </button>
        <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          QR MAKER
        </h1>
      </div>

      {/* Content */}
      <div className="p-8 overflow-y-auto max-h-[calc(90vh-80px)]">
        {/* Page 1: Chọn loại QR */}
        {page === 1 && (
          <div className="space-y-4">
          {/* 
            <div
              onClick={() => goToPage2('link')}
              className="flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 cursor-pointer hover:scale-105 transition-transform shadow-lg"
            >
              <div className="text-4xl">🔗</div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-800">Tạo QR từ Link</h3>
                <p className="text-sm text-gray-600">Tạo mã QR từ đường dẫn website, URL</p>
              </div>
              <div className="text-2xl text-gray-400">→</div>
            </div>
            */}
            <div
              onClick={() => goToPage2('file')}
              className="flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 cursor-pointer hover:scale-105 transition-transform shadow-lg"
            >
              <div className="text-4xl">📄</div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-800">Tạo QR từ File</h3>
                <p className="text-sm text-gray-600">Upload file và tạo mã QR để chia sẻ</p>
              </div>
              <div className="text-2xl text-gray-400">→</div>
            </div>

            <div
              onClick={() => goToPage2('vcard')}
              className="flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 cursor-pointer hover:scale-105 transition-transform shadow-lg"
            >
              <div className="text-4xl">👤</div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-800">Tạo VCard</h3>
                <p className="text-sm text-gray-600">Tạo danh thiếp điện tử với thông tin liên hệ</p>
              </div>
              <div className="text-2xl text-gray-400">→</div>
            </div>

            <p className="text-center text-sm text-gray-500 mt-8">
              Click vào card để chọn loại QR code bạn muốn tạo
            </p>
          </div>
        )}

        {/* Page 2: Nhập data + tùy chỉnh */}
        {page === 2 && (
          <div className="space-y-6">
            {/* Tùy chỉnh màu */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                🎨 Tùy chỉnh QR Code
              </h2>
              <div className="flex gap-6 flex-wrap items-center">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Màu nền QR
                  </label>
                  <input
                    type="color"
                    value={qrData.bgColor}
                    onChange={(e) => setQrData({ ...qrData, bgColor: e.target.value })}
                    className="w-20 h-12 border-2 border-gray-200 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Màu mã QR
                  </label>
                  <input
                    type="color"
                    value={qrData.qrColor}
                    onChange={(e) => setQrData({ ...qrData, qrColor: e.target.value })}
                    className="w-20 h-12 border-2 border-gray-200 rounded-lg cursor-pointer"
                  />
                </div>
                
                {/* Toggle Logo */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600">Thêm logo giữa</span>
                  <div
                    onClick={() => setQrData({ ...qrData, hasLogo: !qrData.hasLogo })}
                    className={`relative w-12 h-7 rounded-full cursor-pointer transition-colors ${
                      qrData.hasLogo ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                        qrData.hasLogo ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    ></div>
                  </div>
                </div>

                {/* Upload Logo Button */}
                {qrData.hasLogo && (
                  <>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="px-4 py-2 border-2 border-purple-600 text-purple-600 rounded-lg font-medium hover:bg-purple-600 hover:text-white transition-colors"
                    >
                      {logoImage ? '✓ Đã tải logo' : 'Upload Logo'}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="h-px bg-gray-200"></div>

            {/* Form nhập liệu */}
            {qrType === 'link' && (
              <div>
                <label className="block text-base font-medium text-gray-700 mb-3 flex items-center gap-2">
                  🔗 Nhập đường dẫn
                </label>
                <input
                  type="url"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full h-14 px-4 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none text-base"
                />
              </div>
            )}

            {qrType === 'file' && (
              <div>
                <label className="block text-base font-medium text-gray-700 mb-3 flex items-center gap-2">
                  📄 Upload File
                </label>
                <label className="block border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-purple-500 transition-colors cursor-pointer">
                  <div className="text-5xl mb-3">☁️</div>
                  <div className="text-gray-600">Kéo thả hoặc click để chọn file</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {selectedFile && (
                    <div className="mt-3 text-sm text-purple-600 font-medium">
                      Đã chọn: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </div>
                  )}
                </label>
              </div>
            )}

            {qrType === 'vcard' && (
              <div className="space-y-4">
                <label className="block text-base font-medium text-gray-700 mb-3 flex items-center gap-2">
                  👤 Thông tin danh thiếp
                </label>
                <input
                  type="text"
                  value={vcardData.fullName}
                  onChange={(e) => setVcardData({ ...vcardData, fullName: e.target.value })}
                  placeholder="Họ và tên *"
                  className="w-full h-14 px-4 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                />
                <input
                  type="tel"
                  value={vcardData.phone}
                  onChange={(e) => setVcardData({ ...vcardData, phone: e.target.value })}
                  placeholder="Số điện thoại *"
                  className="w-full h-14 px-4 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                />
                <input
                  type="email"
                  value={vcardData.email}
                  onChange={(e) => setVcardData({ ...vcardData, email: e.target.value })}
                  placeholder="Email"
                  className="w-full h-14 px-4 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={vcardData.company}
                  onChange={(e) => setVcardData({ ...vcardData, company: e.target.value })}
                  placeholder="Công ty"
                  className="w-full h-14 px-4 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>
            )}

            <button
              onClick={generateQR}
              disabled={isUploading}
              className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:scale-105 transition-transform shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'ĐANG UPLOAD FILE...' : 'TẠO MÃ QR'}
            </button>
          </div>
        )}

        {/* Page 3: Hiển thị QR */}
        {page === 3 && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-72 h-72 border border-gray-200 rounded-2xl p-6 bg-white shadow-xl flex items-center justify-center">
              {!qrGenerated && (
                <div className="text-gray-400">Đang tạo QR...</div>
              )}
              <canvas ref={canvasRef} className={qrGenerated ? 'max-w-full max-h-full' : 'hidden'}></canvas>
            </div>

            <div className="text-sm text-gray-600 max-w-md break-all">
              {formatQRInfo(qrData)}
            </div>

            <div className="flex flex-col gap-3 w-full max-w-md">
              <button
                onClick={downloadQR}
                disabled={!qrGenerated}
                className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                📥 TẢI XUỐNG QR CODE
              </button>
              <button
                onClick={() => {
                  setPage(1);
                  setLinkInput('');
                  setSelectedFile(null);
                  setFileUrl('');
                  setLogoImage(null);
                  setVcardData({ fullName: '', phone: '', email: '', company: '' });
                  setQrGenerated(false);
                }}
                className="w-full h-14 border-2 border-purple-600 text-purple-600 font-semibold rounded-lg hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                🔄 TẠO MÃ MỚI
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}