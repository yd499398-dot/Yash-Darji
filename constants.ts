import { Transaction } from './types';

export const CATEGORIES = [
  'Food & Drink',
  'Housing',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Health',
  'Income',
  'Utilities',
  'Other'
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', description: 'Monthly Rent', amount: 1200, date: '2023-10-01', category: 'Housing', type: 'expense' },
  { id: '2', description: 'Grocery Store Run', amount: 85.50, date: '2023-10-03', category: 'Food & Drink', type: 'expense' },
  { id: '3', description: 'Gas Station', amount: 45.00, date: '2023-10-05', category: 'Transportation', type: 'expense' },
  { id: '4', description: 'Freelance Payment', amount: 2500, date: '2023-10-10', category: 'Income', type: 'income' },
  { id: '5', description: 'Netflix Subscription', amount: 15.99, date: '2023-10-12', category: 'Entertainment', type: 'expense' },
  { id: '6', description: 'Coffee Shop', amount: 5.75, date: '2023-10-15', category: 'Food & Drink', type: 'expense' },
];