import React, { createContext, useContext, useState, useEffect } from 'react';
import { DataState, Invoice, ColumnMapping, RawInvoice, GlobalParameters, DEFAULT_PARAMETERS, DSOMethod, User } from '@/types/data';
import * as XLSX from 'xlsx';
import { parse, isValid, parseISO } from 'date-fns';
import { saveDataState, loadDataState, saveGlobalParams, loadGlobalParams, clearData } from '@/lib/db';

interface DataContextType extends DataState {
  setFile: (file: File) => void;
  updateMapping: (mapping: ColumnMapping) => void;
  processData: () => void;
  resetData: () => void;
  globalParams: GlobalParameters;
  updateGlobalParams: (params: GlobalParameters) => void;
  isLoading: boolean;
  currentUser: User | null;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
}

const defaultState: DataState = {
  rawData: [],
  mappedData: [],
  columns: [],
  mapping: {
    invoiceNumber: '',
    customerName: '',
    invoiceDate: '',
    totalAmount: '',
  },
  isMapped: false,
  fileName: null,
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DataState>(defaultState);
  const [globalParams, setGlobalParams] = useState<GlobalParameters>(DEFAULT_PARAMETERS);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load data from IndexedDB on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [savedState, savedParams] = await Promise.all([
          loadDataState(),
          loadGlobalParams()
        ]);

        if (savedState) {
          // Re-hydrate dates
          savedState.mappedData = savedState.mappedData.map((inv: any) => ({
            ...inv,
            invoiceDate: new Date(inv.invoiceDate),
            dueDate: inv.dueDate ? new Date(inv.dueDate) : new Date(),
            expectedDate: inv.expectedDate ? new Date(inv.expectedDate) : undefined,
            paymentDate: inv.paymentDate ? new Date(inv.paymentDate) : undefined,
          }));
          setState(savedState);
        }

        if (savedParams) {
          // Ensure backward compatibility by merging with defaults
          setGlobalParams({ ...DEFAULT_PARAMETERS, ...savedParams });
        }
        
        // Check for saved user session (simple simulation)
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Failed to load data from DB:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save state changes to IndexedDB
  useEffect(() => {
    if (!isLoading) {
      saveDataState(state).catch(console.error);
    }
  }, [state, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      saveGlobalParams(globalParams).catch(console.error);
    }
  }, [globalParams, isLoading]);

  const updateGlobalParams = (params: GlobalParameters) => {
    setGlobalParams(params);
  };

  const login = (email: string, pass: string): boolean => {
    const user = globalParams.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const setFile = async (file: File) => {
    // Clear old data first
    await clearData();
    setState(defaultState);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Use header: 1 to get array of arrays, ensuring we get all columns including empty ones
      const rawRows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
      
      if (rawRows.length > 0) {
        // First row is headers
        const columns = rawRows[0].map(String); // Ensure all headers are strings
        
        // Convert rest of rows to objects using these headers
        const jsonData: RawInvoice[] = rawRows.slice(1).map(row => {
          const obj: any = {};
          columns.forEach((col, index) => {
            obj[col] = row[index];
          });
          return obj;
        });
        
        // Auto-detect mapping
        const newMapping: ColumnMapping = {
          invoiceNumber: columns.find(c => /invoice.*number|inv.*no/i.test(c)) || '',
          customerName: columns.find(c => /customer/i.test(c)) || '',
          paymentTerms: columns.find(c => /terms|pt/i.test(c)) || '',
          status: columns.find(c => /status/i.test(c)) || '',
          invoiceDate: columns.find(c => /invoice.*date/i.test(c)) || '',
          dueDate: columns.find(c => /due.*date/i.test(c)) || '',
          expectedDate: columns.find(c => /expected/i.test(c)) || '',
          collectorName: columns.find(c => /collector/i.test(c)) || '',
          paymentDate: columns.find(c => /payment.*date/i.test(c)) || '',
          customerType: columns.find(c => /type/i.test(c)) || '',
          totalAmount: columns.find(c => /total.*amount|amount/i.test(c)) || '',
          amountCollected: columns.find(c => /collected/i.test(c)) || '',
          totalBalance: columns.find(c => /balance/i.test(c)) || '',
          businessCase: columns.find(c => /business.*case|case/i.test(c)) || '',
          creditNote: columns.find(c => /credit.*note|cn/i.test(c)) || '',
          openingBalance: columns.find(c => /opening.*balance/i.test(c)) || '',
          salesperson: columns.find(c => /sales.*person|sales/i.test(c)) || '',
        };

        setState(prev => ({
          ...prev,
          rawData: jsonData,
          columns,
          mapping: newMapping,
          fileName: file.name,
          isMapped: false
        }));
      }
    };
    reader.readAsBinaryString(file);
  };

  const updateMapping = (mapping: ColumnMapping) => {
    setState(prev => ({ ...prev, mapping }));
  };

  const processData = () => {
    const { rawData, mapping } = state;
    
    const mappedData: Invoice[] = rawData.map((row, index) => {
      // Helper to parse date
      const parseDate = (val: any): Date => {
        if (!val) return new Date();
        if (val instanceof Date) return val;
        // Excel serial date
        if (typeof val === 'number') {
          return new Date(Date.UTC(1899, 11, 30 + val));
        }
        // String date
        const parsed = parseISO(val);
        if (isValid(parsed)) return parsed;
        const parsed2 = parse(val, 'yyyy-MM-dd', new Date());
        if (isValid(parsed2)) return parsed2;
        return new Date();
      };

      // Helper to parse number
      const parseNum = (val: any): number => {
        if (typeof val === 'number') return val;
        const num = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
        return isNaN(num) ? 0 : num;
      };

      return {
        id: `INV-${index}`,
        invoiceNumber: row[mapping.invoiceNumber] || `INV-${index}`,
        customerName: row[mapping.customerName] || 'Unknown',
        paymentTerms: mapping.paymentTerms ? row[mapping.paymentTerms] : '',
        status: mapping.status ? row[mapping.status] : 'Open',
        invoiceDate: parseDate(row[mapping.invoiceDate]),
        dueDate: mapping.dueDate ? parseDate(row[mapping.dueDate]) : new Date(),
        expectedDate: mapping.expectedDate ? parseDate(row[mapping.expectedDate]) : undefined,
        collectorName: mapping.collectorName ? row[mapping.collectorName] : 'Unassigned',
        paymentDate: mapping.paymentDate ? parseDate(row[mapping.paymentDate]) : undefined,
        customerType: mapping.customerType ? row[mapping.customerType] : 'Commercial',
        totalAmount: parseNum(row[mapping.totalAmount]),
        amountCollected: mapping.amountCollected ? parseNum(row[mapping.amountCollected]) : 0,
        totalBalance: mapping.totalBalance ? parseNum(row[mapping.totalBalance]) : 0,
        businessCase: mapping.businessCase ? row[mapping.businessCase] : undefined,
        creditNote: mapping.creditNote ? parseNum(row[mapping.creditNote]) : undefined,
        openingBalance: mapping.openingBalance ? parseNum(row[mapping.openingBalance]) : undefined,
        salesperson: mapping.salesperson ? row[mapping.salesperson] : undefined,
        mtdOverdue: row['MTD Overdue'] ? parseNum(row['MTD Overdue']) : 0, // Direct mapping if available
      };
    });

    setState(prev => ({
      ...prev,
      mappedData,
      isMapped: true
    }));
  };

  const resetData = () => {
    setState(defaultState);
    clearData().catch(console.error);
  };

  return (
    <DataContext.Provider value={{ 
      ...state, 
      setFile, 
      updateMapping, 
      processData, 
      resetData,
      globalParams,
      updateGlobalParams,
      isLoading,
      currentUser,
      login,
      logout
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
