import { supabase, STORAGE_BUCKET } from './supabase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Upload file lên Supabase Storage
export const uploadFileToSupabase = async (file: File): Promise<UploadResult> => {
  try {
    // Tạo tên file unique
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomStr}.${fileExt}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Lấy public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (error: any) {
    console.error('Upload failed:', error);
    return {
      success: false,
      error: error.message || 'Upload thất bại',
    };
  }
};

// Lấy public URL của file đã upload
export const getFileUrl = (fileName: string): string => {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName);
  
  return data.publicUrl;
};

// Xóa file từ Storage (optional, dùng khi cần cleanup)
export const deleteFile = async (fileName: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([fileName]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete failed:', error);
    return false;
  }
};