export interface Transaction {
  id: string;
  date: string;
  amount: number;
  categoryId: string;
  spender: 'me' | 'spouse' | 'joint';
  notes: string;
  cleanNote?: string;
  pos?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'need' | 'want' | 'saving';
  limit: number;
  icon: string;
  color: string;
  bonus?: number;
  totalLimit?: number;
  spent?: number;
  spentRatio?: number;
  pacingStatus?: 'green' | 'yellow' | 'red';
  projectedSpend?: number;
}

export interface TripCategory {
  name: string;
  limit: number;
  spent?: number;
  remaining?: number;
  ratio?: number;
}

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  currency: string;
  archived: boolean;
  categories: TripCategory[];
}

export interface HistorySnapshot {
  monthId: string;
  monthlyIncome: number;
  categories: Category[];
  transactions: Transaction[];
}

export interface ExchangeRates {
  [key: string]: number;
}

export interface DateMetrics {
  startDate: string;
  endDate: string;
  totalDays: number;
  elapsedDays: number;
  pacingRatio: number;
  daysRemaining: number;
  isCurrentRealMonth: boolean;
}

export interface GroupMetrics {
  planned: number;
  spent: number;
  projected: number;
}

export interface BudgetMetrics {
  enrichedCategories: Category[];
  profileTransactions: Transaction[];
  monthTransactions: Transaction[];
  totalPlannedLimit: number;
  totalSpent: number;
  totalProjected: number;
  groupMetrics: {
    need: GroupMetrics;
    want: GroupMetrics;
    saving: GroupMetrics;
  };
  isOverpace: boolean;
}

export interface ConfirmDialog {
  title?: string;
  message: string;
  onConfirm: () => void;
  isDanger?: boolean;
  confirmText?: string;
  cancelText?: string;
}
