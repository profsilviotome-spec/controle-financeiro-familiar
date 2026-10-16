import React from 'react';
import { Plus, RotateCcw, CloudCheck, FileSpreadsheet } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export type ActiveTab = 'dashboard' | 'new_transaction' | 'transactions' | 'banks_cards' | 'categories';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewTransactionModal: () => void;
  onOpenBackup: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTransactionModal,
  onOpenBackup,
}) => {
  const { isCloudSynced } = useFinance();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-left group cursor-pointer focus:outline-none"
            >
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold tracking-tight text-neutral-900 group-hover:text-emerald-700 transition-colors">
                  FinFamília
                </span>
                <span className="text-xs font-semibold text-emerald-700">
                  Gestão Familiar
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'text-neutral-900 border-b-2 border-emerald-600 font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Visão Geral
            </button>

            <button
              onClick={() => setActiveTab('new_transaction')}
              className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
                activeTab === 'new_transaction'
                  ? 'text-neutral-900 border-b-2 border-emerald-600 font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Novo Lançamento
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
                activeTab === 'transactions'
                  ? 'text-neutral-900 border-b-2 border-emerald-600 font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Lançamentos
            </button>

            <button
              onClick={() => setActiveTab('banks_cards')}
              className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
                activeTab === 'banks_cards'
                  ? 'text-neutral-900 border-b-2 border-emerald-600 font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Cartões & Contas
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
                activeTab === 'categories'
                  ? 'text-neutral-900 border-b-2 border-emerald-600 font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Categorias
            </button>
          </nav>

          {/* Zone 3: Primary action and secondary utility tools */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenBackup}
              title="Gerenciar Dados, Nuvem e Google Sheets"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Nuvem & Sheets</span>
            </button>

            <button
              onClick={() => setActiveTab('new_transaction')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Novo Lançamento</span>
            </button>
          </div>
        </div>

        {/* Mobile navigation strip */}
        <div className="md:hidden flex items-center justify-start border-t border-neutral-100 py-2.5 overflow-x-auto gap-1.5 scrollbar-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-neutral-900 text-white font-semibold'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('new_transaction')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'new_transaction'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            + Novo Lançamento
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'transactions'
                ? 'bg-neutral-900 text-white font-semibold'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Lançamentos
          </button>
          <button
            onClick={() => setActiveTab('banks_cards')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'banks_cards'
                ? 'bg-neutral-900 text-white font-semibold'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Cartões & Bancos
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'categories'
                ? 'bg-neutral-900 text-white font-semibold'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Categorias
          </button>
        </div>
      </div>
    </header>
  );
};
