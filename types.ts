export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: TransactionType;
}

export interface FinancialForecast {
  predictedSpendNextMonth: number;
  savingsPotential: number;
  advice: string[];
  riskFactor: 'Low' | 'Medium' | 'High';
  anomalies: string[];
  searchSources?: { title: string; uri: string }[];
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  TRANSACTIONS = 'TRANSACTIONS',
  FORECAST = 'FORECAST'
}