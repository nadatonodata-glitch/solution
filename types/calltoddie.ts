// Types for CallToDie App

export interface Customer {
  id: string;
  name: string;
  phone: string;
  last_call: string | null; // ISO date string hoặc null
  status: 'gọi được' | 'không gọi được' | 'sai số' | null;
  note: string;
  created_at: string;
}

export interface ExcelRow {
  'ID'?: string;
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

export interface CallUpdateData {
  status: 'gọi được' | 'không gọi được' | 'sai số';
  note: string;
}
