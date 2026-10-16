import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Transaction,
  BankAccount,
  CreditCard,
  MonthlyFinancialSummary,
  Holder,
  GoogleSheetConfig,
  CardReconciliationItem,
} from '../types/finance';
import {
  INITIAL_BANK_ACCOUNTS,
  INITIAL_CREDIT_CARDS,
  INITIAL_TRANSACTIONS,
  SAMPLE_MOCK_TRANSACTIONS,
} from '../data/initialData';

const STORAGE_KEYS = {
  TRANSACTIONS: 'finfamilia_clean_v3_transactions',
  BANK_ACCOUNTS: 'finfamilia_clean_v3_accounts',
  CREDIT_CARDS: 'finfamilia_clean_v3_cards',
  SELECTED_MONTH: 'finfamilia_clean_v3_selected_month',
  SHEET_INVOICES: 'finfamilia_clean_v3_sheet_invoices',
  SHEET_CONFIG: 'finfamilia_clean_v3_sheet_config',
};

const DEFAULT_SHEET_INVOICES: { [cardId: string]: number } = {
  'card-bb-silvio': 0,
  'card-bb-janaina': 0,
  'card-inter-silvio': 0,
  'card-renner-janaina': 0,
};

interface FinanceContextType {
  transactions: Transaction[];
  bankAccounts: BankAccount[];
  creditCards: CreditCard[];
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  selectedHolder: 'Todos' | Holder;
  setSelectedHolder: (holder: 'Todos' | Holder) => void;

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  toggleTransactionStatus: (id: string) => Promise<void>;
  settleTransaction: (id: string, settlementDate?: string, bankAccountId?: string) => Promise<void>;
  payCreditCardInvoice: (cardId: string, bankAccountId: string, amount: number, date: string) => Promise<void>;
  updateBankAccountInitialBalance: (accountId: string, amount: number) => void;
  updateSheetInvoice: (cardId: string, amount: number) => void;
  updateGoogleSheetConfig: (config: Partial<GoogleSheetConfig>) => void;
  syncWithGoogleAppsScript: () => Promise<{ success: boolean; message: string }>;
  resetToDefaultData: () => Promise<void>;
  loadSampleData: () => void;
  exportToJSON: () => void;
  importFromJSON: (jsonString: string) => boolean;
  exportToCSV: () => void;

  // Computed
  monthlySummary: MonthlyFinancialSummary;
  filteredTransactions: Transaction[];
  accountBalances: { [accountId: string]: { initial: number; in: number; out: number; current: number } };
  cardInvoiceTotals: { [cardId: string]: { total: number; realized: number; provisioned: number; count: number } };
  sheetInvoices: { [cardId: string]: number };
  cardReconciliations: CardReconciliationItem[];
  reconciliationSummary: { totalApp: number; totalSheet: number; totalDifference: number; isBalanced: boolean };
  availableMonths: string[];
  googleSheetConfig: GoogleSheetConfig;
  isCloudSynced: boolean;
  isSyncing: boolean;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading transactions from localStorage', e);
    }
    return INITIAL_TRANSACTIONS;
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BANK_ACCOUNTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading bank accounts from localStorage', e);
    }
    return INITIAL_BANK_ACCOUNTS;
  });

  const [creditCards, setCreditCards] = useState<CreditCard[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CREDIT_CARDS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading credit cards from localStorage', e);
    }
    return INITIAL_CREDIT_CARDS;
  });

  const [sheetInvoices, setSheetInvoices] = useState<{ [cardId: string]: number }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHEET_INVOICES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading sheet invoices from localStorage', e);
    }
    return DEFAULT_SHEET_INVOICES;
  });

  const [googleSheetConfig, setGoogleSheetConfig] = useState<GoogleSheetConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHEET_CONFIG);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading sheet config from localStorage', e);
    }
    return {
      sheetUrl: 'https://docs.google.com/spreadsheets/d/finfamilia-controle',
      appsScriptUrl: '',
      autoSync: true,
      lastSyncTime: new Date().toISOString(),
    };
  });

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_MONTH);
      if (saved) return saved;
    } catch {
      // ignore
    }
    return '2026-10'; // Outubro de 2026
  });

  const [selectedHolder, setSelectedHolder] = useState<'Todos' | Holder>('Todos');
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Fetch initial cloud state from server if available
  useEffect(() => {
    const fetchServerState = async () => {
      try {
        const response = await fetch('/api/state');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.transactions) && data.transactions.length > 0) {
            setTransactions(data.transactions);
          }
          if (Array.isArray(data.bankAccounts) && data.bankAccounts.length > 0) {
            setBankAccounts(data.bankAccounts);
          }
          if (Array.isArray(data.creditCards) && data.creditCards.length > 0) {
            setCreditCards(data.creditCards);
          }
          if (data.sheetInvoices) {
            setSheetInvoices(prev => ({ ...prev, ...data.sheetInvoices }));
          }
          if (data.googleSheetConfig) {
            setGoogleSheetConfig(prev => ({ ...prev, ...data.googleSheetConfig }));
          }
          setIsCloudSynced(true);
        }
      } catch (err) {
        console.log('Running in local/offline fallback mode for now.');
      }
    };
    fetchServerState();
  }, []);

  // Persistence to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BANK_ACCOUNTS, JSON.stringify(bankAccounts));
  }, [bankAccounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CREDIT_CARDS, JSON.stringify(creditCards));
  }, [creditCards]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHEET_INVOICES, JSON.stringify(sheetInvoices));
  }, [sheetInvoices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHEET_CONFIG, JSON.stringify(googleSheetConfig));
  }, [googleSheetConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_MONTH, selectedMonth);
  }, [selectedMonth]);

  // Derived available months list sorted descending
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add('2026-09');
    set.add('2026-10');
    set.add('2026-11');
    set.add('2026-12');
    transactions.forEach(t => {
      if (t.monthRef) set.add(t.monthRef);
    });
    return Array.from(set).sort().reverse();
  }, [transactions]);

  // Filtered transactions for selected month and holder
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchMonth = t.monthRef === selectedMonth;
      const matchHolder =
        selectedHolder === 'Todos' ||
        t.holder === selectedHolder ||
        t.holder === 'Família / Comum';
      return matchMonth && matchHolder;
    });
  }, [transactions, selectedMonth, selectedHolder]);

  // Card invoices calculation for selected month
  const cardInvoiceTotals = useMemo(() => {
    const totals: { [cardId: string]: { total: number; realized: number; provisioned: number; count: number } } = {};
    creditCards.forEach(c => {
      totals[c.id] = { total: 0, realized: 0, provisioned: 0, count: 0 };
    });

    transactions.forEach(t => {
      if (t.monthRef === selectedMonth && t.creditCardId && totals[t.creditCardId]) {
        totals[t.creditCardId].total += t.amount;
        totals[t.creditCardId].count += 1;
        if (t.status === 'efetivado') {
          totals[t.creditCardId].realized += t.amount;
        } else {
          totals[t.creditCardId].provisioned += t.amount;
        }
      }
    });

    return totals;
  }, [creditCards, transactions, selectedMonth]);

  // Dynamic Card Reconciliation comparing App Totals vs Spreadsheet Totals
  const cardReconciliations: CardReconciliationItem[] = useMemo(() => {
    return creditCards.map(card => {
      const appTotal = cardInvoiceTotals[card.id]?.total || 0;
      const sheetTotal = sheetInvoices[card.id] ?? appTotal;
      const difference = appTotal - sheetTotal;
      const absDiff = Math.abs(difference);

      let status: 'conciliado' | 'divergente' | 'pendente_lancamentos' = 'conciliado';
      if (absDiff > 0.05) {
        if (difference < 0) {
          // App has less spent than spreadsheet (missing entries in app)
          status = 'pendente_lancamentos';
        } else {
          // App has more spent or difference
          status = 'divergente';
        }
      }

      return {
        cardId: card.id,
        cardName: card.cardName,
        holder: card.holder,
        appTotal,
        sheetTotal,
        difference,
        status,
      };
    });
  }, [creditCards, cardInvoiceTotals, sheetInvoices]);

  // Overall reconciliation summary
  const reconciliationSummary = useMemo(() => {
    const totalApp = cardReconciliations.reduce((sum, r) => sum + r.appTotal, 0);
    const totalSheet = cardReconciliations.reduce((sum, r) => sum + r.sheetTotal, 0);
    const totalDifference = totalApp - totalSheet;
    return {
      totalApp,
      totalSheet,
      totalDifference,
      isBalanced: Math.abs(totalDifference) < 0.05,
    };
  }, [cardReconciliations]);

  // Bank accounts movement calculation
  const accountBalances = useMemo(() => {
    const balances: { [accountId: string]: { initial: number; in: number; out: number; current: number } } = {};

    bankAccounts.forEach(acc => {
      balances[acc.id] = {
        initial: acc.initialBalance,
        in: 0,
        out: 0,
        current: acc.initialBalance,
      };
    });

    transactions.forEach(t => {
      if (t.monthRef === selectedMonth && t.status === 'efetivado' && t.bankAccountId && balances[t.bankAccountId]) {
        if (t.type === 'receita') {
          balances[t.bankAccountId].in += t.amount;
          balances[t.bankAccountId].current += t.amount;
        } else {
          balances[t.bankAccountId].out += t.amount;
          balances[t.bankAccountId].current -= t.amount;
        }
      }
    });

    return balances;
  }, [bankAccounts, transactions, selectedMonth]);

  // Monthly summary computation
  const monthlySummary: MonthlyFinancialSummary = useMemo(() => {
    const accountsToSum = bankAccounts.filter(acc => {
      if (selectedHolder === 'Todos') return true;
      return acc.holder === selectedHolder;
    });

    const initialBalance = accountsToSum.reduce((sum, acc) => {
      return sum + (accountBalances[acc.id]?.initial || acc.initialBalance);
    }, 0);

    let totalIncomeRealized = 0;
    let totalIncomeProvisioned = 0;
    let totalExpenseRealized = 0;
    let totalExpenseProvisioned = 0;

    filteredTransactions.forEach(t => {
      if (t.type === 'receita') {
        if (t.status === 'efetivado') {
          totalIncomeRealized += t.amount;
        } else {
          totalIncomeProvisioned += t.amount;
        }
      } else {
        if (t.status === 'efetivado') {
          totalExpenseRealized += t.amount;
        } else {
          totalExpenseProvisioned += t.amount;
        }
      }
    });

    const netMonthRealized = totalIncomeRealized - totalExpenseRealized;
    const netMonthProvisioned =
      totalIncomeRealized + totalIncomeProvisioned - (totalExpenseRealized + totalExpenseProvisioned);
    const currentRealBalance = initialBalance + netMonthRealized;
    const projectedFinalBalance = initialBalance + netMonthProvisioned;

    return {
      monthRef: selectedMonth,
      initialBalance,
      totalIncomeRealized,
      totalIncomeProvisioned,
      totalExpenseRealized,
      totalExpenseProvisioned,
      netMonthRealized,
      netMonthProvisioned,
      currentRealBalance,
      projectedFinalBalance,
    };
  }, [bankAccounts, accountBalances, filteredTransactions, selectedHolder, selectedMonth]);

  // Actions
  const addTransaction = async (data: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> => {
    const newTx: Transaction = {
      ...data,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    setTransactions(prev => [newTx, ...prev]);

    // Send to backend server for shared cloud persistence
    try {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx),
      });
      setIsCloudSynced(true);
    } catch (e) {
      console.warn('Saved locally, will sync when backend is available');
    }

    return newTx;
  };

  const updateTransaction = async (updatedTx: Transaction): Promise<void> => {
    setTransactions(prev => prev.map(t => (t.id === updatedTx.id ? updatedTx : t)));

    try {
      await fetch(`/api/transactions/${updatedTx.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTx),
      });
      setIsCloudSynced(true);
    } catch (e) {
      console.warn('Updated locally');
    }
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    setTransactions(prev => prev.filter(t => t.id !== id));

    try {
      await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });
      setIsCloudSynced(true);
    } catch (e) {
      console.warn('Deleted locally');
    }
  };

  const toggleTransactionStatus = async (id: string): Promise<void> => {
    setTransactions(prev =>
      prev.map(t => {
        if (t.id === id) {
          const nextStatus = t.status === 'efetivado' ? 'provisionado' : 'efetivado';
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );

    try {
      await fetch(`/api/transactions/${id}/toggle`, {
        method: 'POST',
      });
    } catch (e) {
      console.warn('Status toggled locally');
    }
  };

  const settleTransaction = async (
    id: string,
    settlementDate?: string,
    bankAccountId?: string
  ): Promise<void> => {
    let updatedTx: Transaction | null = null;
    setTransactions(prev =>
      prev.map(t => {
        if (t.id === id) {
          const nextTx: Transaction = {
            ...t,
            status: 'efetivado',
            date: settlementDate || t.date,
            bankAccountId: bankAccountId || t.bankAccountId,
          };
          updatedTx = nextTx;
          return nextTx;
        }
        return t;
      })
    );

    if (updatedTx) {
      try {
        await fetch(`/api/transactions/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedTx),
        });
        setIsCloudSynced(true);
      } catch (e) {
        console.warn('Settled locally');
      }
    }
  };

  const payCreditCardInvoice = async (
    cardId: string,
    bankAccountId: string,
    amount: number,
    date: string
  ): Promise<void> => {
    const card = creditCards.find(c => c.id === cardId);
    const bank = bankAccounts.find(b => b.id === bankAccountId);
    if (!card || !bank) return;

    const monthOfPayment = date.substring(0, 7);
    await addTransaction({
      date,
      monthRef: monthOfPayment,
      description: `Pagamento Fatura ${card.cardName} (${card.holder})`,
      type: 'despesa',
      group: 'Despesa Rotineira',
      category: 'Serviços & Assinaturas',
      subcategory: 'Fatura de Cartão',
      amount,
      paymentMethod: bank.bankName === 'Banco do Brasil' ? 'Débito automático BB' : 'Débito automático Inter',
      holder: card.holder,
      status: 'efetivado',
      bankAccountId: bank.id,
      notes: `Quitação de fatura do cartão com débito em ${bank.bankName}`,
    });
  };

  const updateBankAccountInitialBalance = (accountId: string, amount: number) => {
    setBankAccounts(prev => prev.map(b => (b.id === accountId ? { ...b, initialBalance: amount } : b)));
  };

  const updateSheetInvoice = (cardId: string, amount: number) => {
    const updated = { ...sheetInvoices, [cardId]: amount };
    setSheetInvoices(updated);

    try {
      fetch('/api/sheet-invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      // ignore
    }
  };

  const updateGoogleSheetConfig = (config: Partial<GoogleSheetConfig>) => {
    setGoogleSheetConfig(prev => ({ ...prev, ...config }));
  };

  const syncWithGoogleAppsScript = async (): Promise<{ success: boolean; message: string }> => {
    setIsSyncing(true);
    try {
      const now = new Date().toISOString();
      setGoogleSheetConfig(prev => ({ ...prev, lastSyncTime: now }));

      // If user configured an Apps Script Webhook URL, send data
      if (googleSheetConfig.appsScriptUrl) {
        await fetch(googleSheetConfig.appsScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'sync',
            timestamp: now,
            transactions,
            sheetInvoices,
          }),
          mode: 'no-cors',
        });
      }

      setIsSyncing(false);
      setIsCloudSynced(true);
      return {
        success: true,
        message: 'Sincronização em nuvem e conciliação com o Google Sheets concluídas com sucesso!',
      };
    } catch (error) {
      setIsSyncing(false);
      return {
        success: false,
        message: 'Aviso: Dados sincronizados no armazenamento local/servidor. Verifique a URL do Google Apps Script.',
      };
    }
  };

  const resetToDefaultData = async (): Promise<void> => {
    setTransactions(INITIAL_TRANSACTIONS);
    setBankAccounts(INITIAL_BANK_ACCOUNTS);
    setCreditCards(INITIAL_CREDIT_CARDS);
    setSheetInvoices(DEFAULT_SHEET_INVOICES);
    setSelectedMonth('2026-10');
    setSelectedHolder('Todos');
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.BANK_ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.CREDIT_CARDS);
    localStorage.removeItem(STORAGE_KEYS.SHEET_INVOICES);

    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch (e) {
      // ignore
    }
  };

  const loadSampleData = () => {
    setTransactions(SAMPLE_MOCK_TRANSACTIONS);
    setSheetInvoices({
      'card-bb-silvio': 950.00,
      'card-bb-janaina': 0,
      'card-inter-silvio': 0,
      'card-renner-janaina': 0,
    });
  };

  const exportToJSON = () => {
    const data = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      transactions,
      bankAccounts,
      creditCards,
      sheetInvoices,
      googleSheetConfig,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finfamilia-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFromJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      }
      if (Array.isArray(data.bankAccounts)) {
        setBankAccounts(data.bankAccounts);
      }
      if (Array.isArray(data.creditCards)) {
        setCreditCards(data.creditCards);
      }
      if (data.sheetInvoices) {
        setSheetInvoices(data.sheetInvoices);
      }
      return true;
    } catch (e) {
      console.error('Failed to parse import JSON', e);
      return false;
    }
  };

  const exportToCSV = () => {
    const headers = [
      'ID',
      'Data de Registro (Timestamp)',
      'Data do Lançamento',
      'Mês de Referência',
      'Tipo',
      'Grupo',
      'Categoria',
      'Subcategoria',
      'Valor (R$)',
      'Forma de Pagamento',
      'Titular',
      'Status',
      'Descrição',
      'Observações',
    ];

    const rows = transactions.map(t => [
      `"${t.id}"`,
      `"${t.createdAt}"`,
      `"${t.date}"`,
      `"${t.monthRef}"`,
      `"${t.type}"`,
      `"${t.group}"`,
      `"${t.category}"`,
      `"${t.subcategory || ''}"`,
      t.amount.toFixed(2).replace('.', ','),
      `"${t.paymentMethod}"`,
      `"${t.holder}"`,
      `"${t.status}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finfamilia-lancamentos-${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        bankAccounts,
        creditCards,
        selectedMonth,
        setSelectedMonth,
        selectedHolder,
        setSelectedHolder,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        toggleTransactionStatus,
        settleTransaction,
        payCreditCardInvoice,
        updateBankAccountInitialBalance,
        updateSheetInvoice,
        updateGoogleSheetConfig,
        syncWithGoogleAppsScript,
        resetToDefaultData,
        loadSampleData,
        exportToJSON,
        importFromJSON,
        exportToCSV,
        monthlySummary,
        filteredTransactions,
        accountBalances,
        cardInvoiceTotals,
        sheetInvoices,
        cardReconciliations,
        reconciliationSummary,
        availableMonths,
        googleSheetConfig,
        isCloudSynced,
        isSyncing,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
