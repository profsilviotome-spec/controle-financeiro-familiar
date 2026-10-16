import { BankAccount, CreditCard, Transaction } from '../types/finance';

/**
 * Estrutura bancária inicial limpa pronta para inserção de dados reais
 */
export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'acc-bb-silvio',
    bankName: 'Banco do Brasil',
    holder: 'Silvio',
    accountType: 'Conta Corrente',
    agencyNumber: '1584-9',
    accountNumber: '28.490-X',
    initialBalance: 0.00,
    color: '#003882', // BB Blue
  },
  {
    id: 'acc-bb-janaina',
    bankName: 'Banco do Brasil',
    holder: 'Janaína',
    accountType: 'Conta Corrente',
    agencyNumber: '1584-9',
    accountNumber: '34.120-4',
    initialBalance: 0.00,
    color: '#003882',
  },
  {
    id: 'acc-inter-silvio',
    bankName: 'Banco Inter',
    holder: 'Silvio',
    accountType: 'Conta Corrente',
    agencyNumber: '0001-9',
    accountNumber: '1049281-2',
    initialBalance: 0.00,
    color: '#FF7A00', // Inter Orange
  },
  {
    id: 'acc-inter-janaina',
    bankName: 'Banco Inter',
    holder: 'Janaína',
    accountType: 'Conta Corrente',
    agencyNumber: '0001-9',
    accountNumber: '1098442-7',
    initialBalance: 0.00,
    color: '#FF7A00',
  },
];

/**
 * Cartões de crédito da família (limites e vencimentos padrão, prontos para lançamentos reais)
 */
export const INITIAL_CREDIT_CARDS: CreditCard[] = [
  {
    id: 'card-bb-silvio',
    cardName: 'BB Ourocard Visa',
    bankName: 'Banco do Brasil',
    holder: 'Silvio',
    last4: '4821',
    closingDay: 28,
    dueDay: 5,
    creditLimit: 8000.00,
    color: '#003882',
  },
  {
    id: 'card-bb-janaina',
    cardName: 'BB Ourocard Elo',
    bankName: 'Banco do Brasil',
    holder: 'Janaína',
    last4: '7190',
    closingDay: 25,
    dueDay: 5,
    creditLimit: 6000.00,
    color: '#0054A6',
  },
  {
    id: 'card-inter-silvio',
    cardName: 'Inter Mastercard',
    bankName: 'Banco Inter',
    holder: 'Silvio',
    last4: '3318',
    closingDay: 20,
    dueDay: 1,
    creditLimit: 5000.00,
    color: '#FF7A00',
  },
  {
    id: 'card-renner-janaina',
    cardName: 'Cartão Lojas Renner',
    bankName: 'Renner',
    holder: 'Janaína',
    last4: '9042',
    closingDay: 15,
    dueDay: 25,
    creditLimit: 2500.00,
    color: '#E30613',
  },
];

/**
 * Array de lançamentos totalmente limpo para que o usuário comece inserindo os dados do zero
 */
export const INITIAL_TRANSACTIONS: Transaction[] = [];

/**
 * Dados de exemplo opcionais (caso o usuário queira carregar para demonstração rápida via painel de dados)
 */
export const SAMPLE_MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-sample-01',
    createdAt: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    monthRef: '2026-10',
    description: 'Salário Mensal',
    type: 'receita',
    group: 'Salário',
    category: 'Salário',
    amount: 6850.00,
    paymentMethod: 'PIX / Transferência',
    holder: 'Silvio',
    status: 'efetivado',
    bankAccountId: 'acc-bb-silvio',
  },
  {
    id: 'tx-sample-02',
    createdAt: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    monthRef: '2026-10',
    description: 'Supermercado da Família',
    type: 'despesa',
    group: 'Despesa Rotineira',
    category: 'Supermercado',
    amount: 950.00,
    paymentMethod: 'Cartão BB - Silvio',
    holder: 'Silvio',
    status: 'efetivado',
    creditCardId: 'card-bb-silvio',
  },
  {
    id: 'tx-sample-03',
    createdAt: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    monthRef: '2026-10',
    description: 'Conta de Energia Copel',
    type: 'despesa',
    group: 'Despesa Rotineira',
    category: 'Casa',
    amount: 245.00,
    paymentMethod: 'Débito automático BB',
    holder: 'Família / Comum',
    status: 'provisionado',
    bankAccountId: 'acc-bb-silvio',
  },
];
