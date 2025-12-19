export interface Bill {
  id: string;
  title: string;
  value: number;
  dueDate: string; // YYYY-MM-DD
  status: 'pending' | 'paid';
  barcode?: string;
  receiptAttachment?: string; // Base64 or URL
  notificationSet?: boolean;
}

export interface UserSettings {
  userName: string;
  monthlyIncome: number;
}

export interface DashboardStats {
  totalPending: number;
  totalPaid: number;
  totalValue: number;
  remainingValue: number;
  percentComplete: number;
  leftover: number;
}