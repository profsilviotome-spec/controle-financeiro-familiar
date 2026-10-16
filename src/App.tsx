/**
 * FinFamília - Gestão Financeira Familiar
 * Aplicação responsiva para controle financeiro moderno
 */

import React, { useState } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import { Header, ActiveTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { CardsAndBanksView } from './components/CardsAndBanksView';
import { CategoryReportView } from './components/CategoryReportView';
import { NewTransactionView } from './components/NewTransactionView';
import { TransactionFormModal } from './components/TransactionFormModal';
import { PayInvoiceModal } from './components/PayInvoiceModal';
import { EditBalanceModal } from './components/EditBalanceModal';
import { BackupModal } from './components/BackupModal';
import { Transaction, CreditCard, BankAccount } from './types/finance';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  
  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);

  const [isPayInvoiceOpen, setIsPayInvoiceOpen] = useState(false);
  const [cardToPay, setCardToPay] = useState<CreditCard | null>(null);
  const [invoicePayAmount, setInvoicePayAmount] = useState(0);

  const [isEditBalanceOpen, setIsEditBalanceOpen] = useState(false);
  const [accountToEditBalance, setAccountToEditBalance] = useState<BankAccount | null>(null);

  const [isBackupOpen, setIsBackupOpen] = useState(false);

  const handleOpenNewTransaction = () => {
    setTxToEdit(null);
    setIsTxModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setTxToEdit(tx);
    setIsTxModalOpen(true);
  };

  const handleOpenPayInvoice = (card: CreditCard, amount: number) => {
    setCardToPay(card);
    setInvoicePayAmount(amount);
    setIsPayInvoiceOpen(true);
  };

  const handleOpenEditBalance = (account: BankAccount) => {
    setAccountToEditBalance(account);
    setIsEditBalanceOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTransactionModal={handleOpenNewTransaction}
        onOpenBackup={() => setIsBackupOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            onOpenNewTransaction={() => setActiveTab('new_transaction')}
            onEditTransaction={handleEditTransaction}
            onNavigateToTransactions={() => setActiveTab('transactions')}
            onNavigateToCards={() => setActiveTab('banks_cards')}
          />
        )}

        {activeTab === 'new_transaction' && (
          <NewTransactionView
            onNavigateToDashboard={() => setActiveTab('dashboard')}
            onNavigateToTransactions={() => setActiveTab('transactions')}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            onOpenNewTransaction={() => setActiveTab('new_transaction')}
            onEditTransaction={handleEditTransaction}
          />
        )}

        {activeTab === 'banks_cards' && (
          <CardsAndBanksView
            onOpenPayInvoice={handleOpenPayInvoice}
            onOpenEditBalance={handleOpenEditBalance}
            onOpenNewTransaction={() => setActiveTab('new_transaction')}
          />
        )}

        {activeTab === 'categories' && (
          <CategoryReportView
            onOpenNewTransaction={() => setActiveTab('new_transaction')}
            onEditTransaction={handleEditTransaction}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-5 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FinFamília · Gestão e Controle Financeiro Familiar</span>
          <div className="flex items-center gap-4 text-[11px] text-neutral-400">
            <span>Silvio & Janaína</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsBackupOpen(true)}
              className="hover:text-neutral-700 underline"
            >
              Backup & Exportação
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TransactionFormModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setTxToEdit(null);
        }}
        transactionToEdit={txToEdit}
      />

      <PayInvoiceModal
        isOpen={isPayInvoiceOpen}
        onClose={() => {
          setIsPayInvoiceOpen(false);
          setCardToPay(null);
        }}
        card={cardToPay}
        defaultAmount={invoicePayAmount}
      />

      <EditBalanceModal
        isOpen={isEditBalanceOpen}
        onClose={() => {
          setIsEditBalanceOpen(false);
          setAccountToEditBalance(null);
        }}
        account={accountToEditBalance}
      />

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
