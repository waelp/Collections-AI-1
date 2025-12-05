import { Invoice, KPI, MonthlyStats, CollectorPerformance, CustomerRisk, GlobalParameters, DEFAULT_PARAMETERS, DSOMethod, EvaluationBasis } from '@/types/data';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, format, differenceInDays, addDays, isSameMonth, subMonths, isBefore, isAfter } from 'date-fns';

// Helper to filter invoices by period
export const filterInvoicesByPeriod = (
  invoices: Invoice[],
  period: 'month' | 'quarter' | 'year' | 'all',
  basis: EvaluationBasis = 'invoiceDate',
  referenceDate: Date = new Date()
): Invoice[] => {
  if (period === 'all') return invoices;

  const end = endOfMonth(referenceDate);
  let start = startOfMonth(referenceDate);

  if (period === 'quarter') start = subMonths(start, 2);
  if (period === 'year') start = subMonths(start, 11);

  return invoices.filter(inv => {
    const dateToCheck = basis === 'invoiceDate' ? inv.invoiceDate : inv.dueDate;
    return isWithinInterval(dateToCheck, { start, end });
  });
};

// 1. Weighted DSO (Recommended)
// SUM(Invoice_Age * Invoice_Amount) / SUM(Invoice_Amount)
export const calculateWeightedDSO = (invoices: Invoice[], basis: EvaluationBasis = 'invoiceDate'): number => {
  const totalCreditSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  if (totalCreditSales === 0) return 0;

  const weightedSum = invoices.reduce((sum, inv) => {
    // Age is typically calculated from Invoice Date regardless of basis, 
    // but if user wants Due Date basis, we might calculate days past due?
    // Standard DSO definition uses Invoice Date for age.
    // However, if the user selects "Due Date" as basis, they might imply "Days Past Due" analysis?
    // Usually DSO is always (Date - InvoiceDate). 
    // Let's stick to standard definition: Age = Today - InvoiceDate.
    // But if basis affects filtering, the set of invoices changes.
    // If basis affects calculation logic itself:
    // If basis is 'dueDate', maybe we calculate days from Due Date? (That would be ADD, not DSO).
    // Requirement says: "Date Basis dynamic... for measuring KPIs".
    // Let's assume this primarily affects FILTERING (which invoices are included) 
    // and potentially the reference date for "Age" if explicitly requested.
    // Standard practice: DSO is always based on Invoice Date. 
    // We will keep using Invoice Date for Age calculation to maintain standard DSO definition,
    // unless explicitly instructed otherwise. The 'basis' param here is kept for future extensibility
    // or if we decide to switch age calculation.
    
    const age = differenceInDays(new Date(), inv.invoiceDate);
    return sum + (inv.totalAmount * age);
  }, 0);

  return Math.round(weightedSum / totalCreditSales);
};

// 2. Simple Average DSO
// SUM(Invoice_Age) / COUNT(Invoices)
export const calculateSimpleAverageDSO = (invoices: Invoice[]): number => {
  if (invoices.length === 0) return 0;
  
  const totalAge = invoices.reduce((sum, inv) => {
    return sum + differenceInDays(new Date(), inv.invoiceDate);
  }, 0);

  return Math.round(totalAge / invoices.length);
};

// 3. Traditional Formula
// (Total Outstanding / Total Credit Sales) * Days in Period
export const calculateTraditionalDSO = (invoices: Invoice[], periodDays: number = 30): number => {
  const totalCreditSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  if (totalCreditSales === 0) return 0;

  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.totalBalance, 0);
  
  return Math.round((totalOutstanding / totalCreditSales) * periodDays);
};

// 4. Countback Method
// Days required to cover Current AR from recent sales
export const calculateCountbackDSO = (invoices: Invoice[]): number => {
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.totalBalance, 0);
  if (totalOutstanding <= 0) return 0;

  // Sort invoices by date descending (newest first)
  const sortedInvoices = [...invoices].sort((a, b) => b.invoiceDate.getTime() - a.invoiceDate.getTime());
  
  let accumulatedSales = 0;
  let daysCount = 0;
  const today = new Date();

  for (const inv of sortedInvoices) {
    accumulatedSales += inv.totalAmount;
    daysCount = differenceInDays(today, inv.invoiceDate);
    
    if (accumulatedSales >= totalOutstanding) {
      return Math.round(daysCount);
    }
  }

  return daysCount;
};

// 5. Best Possible DSO
// (Current AR [Not Overdue] / Total Credit Sales) * Days in Period
export const calculateBestPossibleDSO = (invoices: Invoice[], periodDays: number = 30): number => {
  const totalCreditSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  if (totalCreditSales === 0) return 0;

  const currentAR = invoices.reduce((sum, inv) => {
    // Only include current (not overdue) receivables
    const isOverdue = (inv.mtdOverdue || 0) > 0;
    return sum + (!isOverdue ? inv.totalBalance : 0);
  }, 0);

  return Math.round((currentAR / totalCreditSales) * periodDays);
};

// Main DSO Dispatcher
export const calculateDSO = (invoices: Invoice[], method: DSOMethod = 'weighted', periodDays: number = 30): number => {
  switch (method) {
    case 'weighted': return calculateWeightedDSO(invoices);
    case 'simple': return calculateSimpleAverageDSO(invoices);
    case 'traditional': return calculateTraditionalDSO(invoices, periodDays);
    case 'countback': return calculateCountbackDSO(invoices);
    case 'bestPossible': return calculateBestPossibleDSO(invoices, periodDays);
    default: return calculateWeightedDSO(invoices);
  }
};

// Calculate CEI (Collection Effectiveness Index)
export const calculateCEI = (invoices: Invoice[]): number => {
  let beginningAR = 0;
  let creditSales = 0;
  let endingAR = 0;
  let totalOverdue = 0;

  invoices.forEach(inv => {
    // Ending AR is always the current total balance
    endingAR += inv.totalBalance;

    // Calculate Overdue for Ending Current AR
    if ((inv.mtdOverdue || 0) > 0) {
      totalOverdue += inv.totalBalance;
    }

    // Determine Beginning AR vs Credit Sales
    // If openingBalance is present and > 0, treat as Beginning AR (Old Invoice)
    // Otherwise treat totalAmount as Credit Sales (New Invoice or Fallback)
    if (typeof inv.openingBalance === 'number' && inv.openingBalance > 0) {
      beginningAR += inv.openingBalance;
    } else {
      creditSales += inv.totalAmount;
    }
  });
  
  const endingCurrentAR = endingAR - totalOverdue;

  // Formula: (Beginning AR + Credit Sales - Ending AR) / (Beginning AR + Credit Sales - Ending Current AR) * 100
  const numerator = beginningAR + creditSales - endingAR;
  const denominator = beginningAR + creditSales - endingCurrentAR;

  if (denominator === 0) return 100;
  
  return Math.round((numerator / denominator) * 100);
};

// Calculate ADD (Average Days Delinquent)
export const calculateADD = (invoices: Invoice[], dsoMethod: DSOMethod = 'weighted'): number => {
  const dso = calculateDSO(invoices, dsoMethod);
  const bestDso = calculateBestPossibleDSO(invoices);
  return Math.max(0, dso - bestDso);
};

// Calculate % Collected within 30 days of Due Date
export const calculate30Days = (invoices: Invoice[]): number => {
  const eligibleInvoices = invoices.filter(inv => inv.totalAmount > 0);
  if (eligibleInvoices.length === 0) return 0;

  const collectedWithin30 = eligibleInvoices.reduce((sum, inv) => {
    if (!inv.paymentDate) return sum;
    const daysDiff = differenceInDays(inv.paymentDate, inv.dueDate);
    if (daysDiff <= 30) {
      return sum + inv.amountCollected;
    }
    return sum;
  }, 0);

  const totalEligible = eligibleInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  if (totalEligible === 0) return 0;

  return Math.round((collectedWithin30 / totalEligible) * 100);
};

// Main KPI Calculation
export const calculateKPIs = (invoices: Invoice[], params: GlobalParameters = DEFAULT_PARAMETERS): KPI => {
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + inv.amountCollected, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.totalBalance, 0);

  return {
    dso: calculateDSO(invoices, params.dsoMethod),
    bestPossibleDso: calculateBestPossibleDSO(invoices),
    cei: calculateCEI(invoices),
    collectionRate: totalAmount > 0 ? Math.round((totalCollected / totalAmount) * 100) : 0,
    add: calculateADD(invoices, params.dsoMethod),
    days30: calculate30Days(invoices),
    totalInvoices: invoices.length,
    totalAmount,
    totalCollected,
    totalOutstanding
  };
};

// Calculate Collector Performance
export const calculateCollectorPerformance = (
  invoices: Invoice[], 
  params: GlobalParameters = DEFAULT_PARAMETERS
): CollectorPerformance[] => {
  const grouped = invoices.reduce((acc, inv) => {
    const name = inv.collectorName || 'Unassigned';
    if (!acc[name]) acc[name] = [];
    acc[name].push(inv);
    return acc;
  }, {} as Record<string, Invoice[]>);

  return Object.entries(grouped).map(([name, collectorInvoices]) => {
    const kpis = calculateKPIs(collectorInvoices, params);
    
    const T_Collected = params.collectedTarget.target / 100;
    const T_DSO = params.dso.target;
    const T_CEI = params.cei.target / 100;
    const T_ADD = params.add.target;
    const T_30 = params.days30.target / 100;

    const R_Collected = kpis.collectionRate / 100;
    const R_DSO = kpis.dso;
    const R_CEI = kpis.cei / 100;
    const R_ADD = kpis.add;
    const R_30 = kpis.days30 / 100;

    const Score_Collected = Math.min(R_Collected / T_Collected, 1) * 100;
    const Score_DSO = R_DSO <= T_DSO ? 100 : Math.max(0, (T_DSO / R_DSO) * 100);
    const Score_CEI = Math.min(R_CEI / T_CEI, 1) * 100;
    const Score_ADD = R_ADD <= T_ADD ? 100 : Math.max(0, (T_ADD / R_ADD) * 100);
    const Score_30 = Math.min(R_30 / T_30, 1) * 100;

    const w_col = params.collectedTarget.weight / 100;
    const w_dso = params.dso.weight / 100;
    const w_cei = params.cei.weight / 100;
    const w_add = params.add.weight / 100;
    const w_30 = params.days30.weight / 100;

    const score = (
      w_col * Score_Collected +
      w_dso * Score_DSO +
      w_cei * Score_CEI +
      w_add * Score_ADD +
      w_30 * Score_30
    );

    let rating: 'Poor' | 'Good' | 'Excellent' | 'Outstanding' = 'Poor';
    if (score >= 96) rating = 'Outstanding';
    else if (score >= 86) rating = 'Excellent';
    else if (score >= 75) rating = 'Good';

    const salary = 10000;
    const maxBonus = salary * (params.maxBonusPercent / 100);
    const calculatedBonus = salary * (params.maxBonusPercent / 100) * Math.min(R_Collected, 1);
    const bonus = Math.min(calculatedBonus, maxBonus);

    const uniqueCustomers = new Set(collectorInvoices.map(i => i.customerName)).size;

    return {
      name,
      salary,
      totalCollected: kpis.totalCollected,
      target: kpis.totalAmount * T_Collected,
      dso: kpis.dso,
      cei: kpis.cei,
      add: kpis.add,
      days30: kpis.days30,
      score: Math.round(score * 10) / 10,
      bonus: Math.round(bonus),
      rating,
      invoiceCount: kpis.totalInvoices,
      customersCount: uniqueCustomers,
      invoices: collectorInvoices
    };
  });
};

// Calculate Customer Risk
export const calculateCustomerRisk = (invoices: Invoice[]): CustomerRisk[] => {
  const grouped = invoices.reduce((acc, inv) => {
    const name = inv.customerName || 'Unknown';
    if (!acc[name]) acc[name] = [];
    acc[name].push(inv);
    return acc;
  }, {} as Record<string, Invoice[]>);

  return Object.entries(grouped).map(([name, custInvoices]) => {
    const totalExposure = custInvoices.reduce((sum, inv) => sum + inv.totalBalance, 0);
    const overdueInvoices = custInvoices.filter(inv => (inv.mtdOverdue || 0) > 0);
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.totalBalance, 0);
    
    const avgDelay = overdueInvoices.length > 0
      ? overdueInvoices.reduce((sum, inv) => sum + (inv.mtdOverdue || 0), 0) / overdueInvoices.length
      : 0;

    let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
    if (avgDelay > 60 || (overdueAmount / totalExposure > 0.5)) riskLevel = 'High';
    else if (avgDelay > 30 || (overdueAmount / totalExposure > 0.2)) riskLevel = 'Medium';

    return {
      name,
      totalExposure,
      overdueAmount,
      avgDelay,
      riskLevel,
      collectorName: custInvoices[0]?.collectorName || 'Unassigned',
      customerType: custInvoices[0]?.customerType || 'Commercial',
      invoices: custInvoices
    };
  }).sort((a, b) => b.totalExposure - a.totalExposure);
};

// Calculate Monthly Stats for Charts
export const calculateMonthlyStats = (invoices: Invoice[], params: GlobalParameters = DEFAULT_PARAMETERS): MonthlyStats[] => {
  // Grouping should respect Date Basis?
  // Charts usually show trend over time.
  // If Date Basis is 'dueDate', we should group by Due Date Month.
  // If Date Basis is 'invoiceDate', we should group by Invoice Date Month.
  
  const basis = params.dateBasis || 'invoiceDate';

  const grouped = invoices.reduce((acc, inv) => {
    const dateToUse = basis === 'invoiceDate' ? inv.invoiceDate : inv.dueDate;
    const month = format(dateToUse, 'yyyy-MM');
    if (!acc[month]) acc[month] = [];
    acc[month].push(inv);
    return acc;
  }, {} as Record<string, Invoice[]>);

  return Object.entries(grouped)
    .map(([month, monthInvoices]) => {
      const kpis = calculateKPIs(monthInvoices, params);
      return {
        month,
        sales: kpis.totalAmount,
        collected: kpis.totalCollected,
        outstanding: kpis.totalOutstanding,
        dso: kpis.dso,
        cei: kpis.cei,
        collectionRate: kpis.collectionRate
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));
};

// Backward compatibility aliases
export const calculateMetrics = (invoices: Invoice[], params: GlobalParameters = DEFAULT_PARAMETERS) => {
  const kpis = calculateKPIs(invoices, params);
  return {
    dso: { value: kpis.dso, target: params.dso.target, trend: 0, label: 'DSO', format: 'number' },
    cei: { value: kpis.cei, target: params.cei.target, trend: 0, label: 'CEI', format: 'percent' },
    collectionRate: { value: kpis.collectionRate, target: params.collectedTarget.target, trend: 0, label: 'Rate', format: 'percent' },
    add: { value: kpis.add, target: params.add.target, trend: 0, label: 'ADD', format: 'number' },
    totalOutstanding: kpis.totalOutstanding,
    totalCollected: kpis.totalCollected
  };
};
export const getMonthlyTrends = (invoices: Invoice[], params: GlobalParameters = DEFAULT_PARAMETERS) => {
  const stats = calculateMonthlyStats(invoices, params);
  return stats.map(s => ({
    name: s.month,
    dso: s.dso,
    collectionRate: s.collectionRate,
    cei: s.cei
  }));
};
export const getCustomerProfiles = (invoices: Invoice[]) => {
  const risks = calculateCustomerRisk(invoices);
  return risks.map(r => ({
    id: btoa(r.name),
    name: r.name,
    totalInvoiced: r.totalExposure + r.invoices.reduce((sum, i) => sum + i.amountCollected, 0),
    totalCollected: r.invoices.reduce((sum, i) => sum + i.amountCollected, 0),
    totalOutstanding: r.totalExposure,
    overdueAmount: r.overdueAmount,
    avgDaysDelinquent: r.avgDelay,
    riskLevel: r.riskLevel,
    invoices: r.invoices
  }));
};

// Helper to get start month index from fiscal year start string or number
export const getStartMonthIndex = (start: string | number): number => {
  if (typeof start === 'number') return start - 1; // 1-based to 0-based
  const month = parseInt(start.split('-')[0]);
  return isNaN(month) ? 0 : month - 1;
};
