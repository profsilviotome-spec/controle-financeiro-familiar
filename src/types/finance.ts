export type TransactionType = 'despesa' | 'receita';

export type ExpenseGroup = 'Despesa Rotineira' | 'Despesa Eventual' | 'Investimento';
export type IncomeGroup = 'Salário' | 'Renda Extra' | 'Outras Entradas';
export type TransactionGroup = ExpenseGroup | IncomeGroup;

export type Category = 
  | 'Casa'
  | 'Supermercado'
  | 'Transporte'
  | 'Saúde'
  | 'Educação'
  | 'Lazer & Cultura'
  | 'Empréstimos / Dívidas'
  | 'Vestuário & Pessoal'
  | 'Serviços & Assinaturas'
  | 'Salário'
  | 'Renda Extra'
  | 'Outros';

export type Holder = 'Silvio' | 'Janaína' | 'Família / Comum';

export type PaymentMethod = 
  | 'Cartão BB - Silvio'
  | 'Cartão BB - Janaína'
  | 'Cartão Inter - Silvio'
  | 'Cartão Renner - Janaína'
  | 'Débito automático BB'
  | 'Débito automático Inter'
  | 'Desconto em folha'
  | 'PIX / Transferência'
  | 'Dinheiro em espécie';

export type TransactionStatus = 'efetivado' | 'provisionado';

export interface Transaction {
  id: string;
  createdAt: string; // ISO string automatic timestamp
  date: string; // YYYY-MM-DD
  monthRef: string; // YYYY-MM e.g. "2026-10"
  description: string;
  type: TransactionType;
  group: TransactionGroup;
  category: Category;
  subcategory?: string;
  amount: number; // positive value in BRL
  paymentMethod: PaymentMethod;
  holder: Holder;
  status: TransactionStatus;
  notes?: string;
  bankAccountId?: string; // If paid via account
  creditCardId?: string; // If paid via credit card
}

export interface BankAccount {
  id: string;
  bankName: 'Banco do Brasil' | 'Banco Inter';
  holder: 'Silvio' | 'Janaína';
  accountType: 'Conta Corrente';
  agencyNumber: string;
  accountNumber: string;
  initialBalance: number; // Saldo anterior / inicial do mês base
  color: string;
}

export interface CreditCard {
  id: string;
  cardName: string;
  bankName: 'Banco do Brasil' | 'Banco Inter' | 'Renner';
  holder: 'Silvio' | 'Janaína';
  last4: string;
  closingDay: number;
  dueDay: number;
  creditLimit: number;
  color: string;
}

export interface MonthlyFinancialSummary {
  monthRef: string;
  initialBalance: number;
  totalIncomeRealized: number;
  totalIncomeProvisioned: number;
  totalExpenseRealized: number;
  totalExpenseProvisioned: number;
  netMonthRealized: number; // Incomes realized - Expenses realized
  netMonthProvisioned: number; // All incomes - All expenses
  projectedFinalBalance: number; // Initial balance + netMonthProvisioned
  currentRealBalance: number; // Initial balance + netMonthRealized
}

export interface GoogleSheetConfig {
  sheetUrl?: string;
  appsScriptUrl?: string;
  autoSync?: boolean;
  lastSyncTime?: string;
}

export interface CardReconciliationItem {
  cardId: string;
  cardName: string;
  holder: Holder;
  appTotal: number; // Total registered in the app for current month
  sheetTotal: number; // Total reported in spreadsheet / closed statement
  difference: number; // appTotal - sheetTotal
  status: 'conciliado' | 'divergente' | 'pendente_lancamentos';
}

