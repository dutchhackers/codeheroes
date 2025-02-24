export interface TimeFrame {
  daily: string; // YYYY-MM-DD
  weekly: string; // YYYY-WXX
}

export interface TimeRange {
  startDate: string; // ISO timestamp
  endDate: string; // ISO timestamp
}

export interface TimeBasedQuery {
  startDate?: string;
  endDate?: string;
  timeframe?: 'daily' | 'weekly' | 'monthly';
}
