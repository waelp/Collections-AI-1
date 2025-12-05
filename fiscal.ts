import { getYear, getMonth, addMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export type FiscalYearStart = '01-01' | '04-01' | '06-01';

export const getFiscalYear = (date: Date, startMonth: number): number => {
  const month = getMonth(date); // 0-indexed (0 = Jan, 3 = Apr, 5 = Jun)
  const year = getYear(date);
  
  // If startMonth is 0 (Jan), fiscal year matches calendar year
  if (startMonth === 0) return year;

  // If current month is before start month, it belongs to previous fiscal year
  if (month < startMonth) {
    return year - 1; // e.g., Mar 2025 with Apr start -> FY2024
  }
  
  return year; // e.g., Apr 2025 with Apr start -> FY2025
};

export const getFiscalQuarter = (date: Date, startMonth: number): number => {
  const month = getMonth(date);
  // Shift month so that startMonth becomes 0
  const shiftedMonth = (month - startMonth + 12) % 12;
  return Math.floor(shiftedMonth / 3) + 1;
};

export const getFiscalPeriodRange = (
  fiscalYear: number, 
  period: string, 
  startMonth: number
): { start: Date; end: Date } => {
  // Start date of the fiscal year
  const fyStart = new Date(fiscalYear, startMonth, 1);
  
  if (period === 'year') {
    const fyEnd = endOfMonth(addMonths(fyStart, 11));
    return { start: fyStart, end: fyEnd };
  }
  
  if (period === 'h1') {
    const h1End = endOfMonth(addMonths(fyStart, 5));
    return { start: fyStart, end: h1End };
  }
  
  if (period === 'h2') {
    const h2Start = startOfMonth(addMonths(fyStart, 6));
    const h2End = endOfMonth(addMonths(fyStart, 11));
    return { start: h2Start, end: h2End };
  }
  
  if (period.startsWith('q')) {
    const qIndex = parseInt(period.substring(1)) - 1; // 0-3
    const qStart = startOfMonth(addMonths(fyStart, qIndex * 3));
    const qEnd = endOfMonth(addMonths(qStart, 2));
    return { start: qStart, end: qEnd };
  }

  if (period === 'current_month') {
    const now = new Date();
    return { start: startOfMonth(now), end: endOfMonth(now) };
  }

  // Default fallback
  return { start: fyStart, end: endOfMonth(addMonths(fyStart, 11)) };
};

export const getStartMonthIndex = (fiscalStart: FiscalYearStart): number => {
  switch (fiscalStart) {
    case '04-01': return 3; // April
    case '06-01': return 5; // June
    default: return 0; // January
  }
};
