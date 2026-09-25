export interface SavingsEntry {
  date: string;
  category: string;
  amount: number;
  notes?: string
};

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  updatedRange?: string
};

export interface SavingsRow {
  rowIndex: number;       // Sheet row number (1-based index)
  year: number;           // 2025, 2026, etc.
  monthOrLabel: string;   // "January", "EOY Total", etc.
  savings: number;
  vamshiBofa: number;
  vamshiDcu: number;
  priyaBofa: number;
  priyaEtrade: number;
  cash: number;
  lcaBalance: number;
  ccDebt: number;
  autoLoan: number;
  dollarChange: number;
  percentChange: string;
  total: number;
  isEOYRow: boolean;
  isFutureMonth: boolean;
};

export interface RothKpiData {
  vamshiContributions: number;
  priyaContributions: number;
  totalContributions: number;
  vamshiPnlDollar: number;
  priyaPnlDollar: number;
  totalPnlDollar: number;
  vamshiPnlPercent: string;
  priyaPnlPercent: string;
  totalPnlPercent: string;
}

export interface RothRow {
  rowIndex: number;
  year: number;
  monthOrLabel: string;
  vamshiBalance: number;
  priyaBalance: number;
  dollarChange: number;
  percentChange: string;
  rothBoth: number;
  isEoYRow?: boolean;
  isContributionsRow?: boolean;
  isFutureMonth?: boolean;
}

export interface RothResponse {
  kpis: RothKpiData;
  rows: RothRow[];
}

export interface NetWorthRow {
  year: number;
  monthOrLabel: string;
  rowIndex: number;
  netWorth: number;
  dollarChange: number;
  percentChange: string;
  isEOYRow: boolean;
  isFutureMonth: boolean;
}

export interface NetWorthBreakdown {
  cash: number;
  iras: number;
  total: number;
}

export interface NetWorthDataResponse {
  rows: NetWorthRow[];
  summary: NetWorthBreakdown;
}
