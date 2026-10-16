import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard as CardIcon,
  Filter,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import {
  formatCurrencyAccounting,
  formatCurrencyRaw,
  getCurrencyColorClass,
  formatMonthRef,
  formatDateBR,
} from '../utils/formatters';
import { Holder, Transaction } from '../types/finance';

interface DashboardViewProps {
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onNavigateToTransactions: () => void;
  onNavigateToCards: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewTransaction,
  onEditTransaction,
  onNavigateToTransactions,
  onNavigateToCards,
}) => {
  const {
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    selectedHolder,
    setSelectedHolder,
    monthlySummary,
    filteredTransactions,
    toggleTransactionStatus,
    creditCards,
    cardInvoiceTotals,
  } = useFinance();

  // Category breakdown calculation
  const categoryStats = React.useMemo(() => {
    const map = new Map<string, { total: number; realized: number; provisioned: number; count: number }>();
    
    filteredTransactions.forEach(t => {
      if (t.type === 'despesa') {
        const cat = t.category;
        const current = map.get(cat) || { total: 0, realized: 0, provisioned: 0, count: 0 };
        current.total += t.amount;
        current.count += 1;
        if (t.status === 'efetivado') {
          current.realized += t.amount;
        } else {
          current.provisioned += t.amount;
        }
        map.set(cat, current);
      }
    });

    const totalExpense = monthlySummary.totalExpenseRealized + monthlySummary.totalExpenseProvisioned;
    const sorted = Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        ...data,
        percentage: totalExpense > 0 ? (data.total / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return sorted;
  }, [filteredTransactions, monthlySummary]);

  // Navigate months
  const handlePrevMonth = () => {
    const currentIndex = availableMonths.indexOf(selectedMonth);
    if (currentIndex < availableMonths.length - 1) {
      setSelectedMonth(availableMonths[currentIndex + 1]);
    } else {
      // Calculate previous month string
      const [yearStr, monthStr] = selectedMonth.split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10);
      const prevDate = new Date(y, m - 2, 1);
      const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      setSelectedMonth(prevMonthStr);
    }
  };

  const handleNextMonth = () => {
    const currentIndex = availableMonths.indexOf(selectedMonth);
    if (currentIndex > 0) {
      setSelectedMonth(availableMonths[currentIndex - 1]);
    } else {
      const [yearStr, monthStr] = selectedMonth.split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10);
      const nextDate = new Date(y, m, 1);
      const nextMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
      setSelectedMonth(nextMonthStr);
    }
  };

  const totalCardDebt = Object.values(cardInvoiceTotals).reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-6">
      {/* Top Controls: Month Selector & Holder Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-neutral-200">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-neutral-100 rounded-lg p-1">
            <button
              onClick={handlePrevMonth}
              title="Mês anterior"
              className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-white rounded-md transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 text-sm font-bold text-neutral-900 whitespace-nowrap">
              {formatMonthRef(selectedMonth)}
            </div>
            <button
              onClick={handleNextMonth}
              title="Próximo mês"
              className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-white rounded-md transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="text-xs bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-neutral-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {availableMonths.map(m => (
              <option key={m} value={m}>
                {formatMonthRef(m)}
              </option>
            ))}
          </select>
        </div>

        {/* Holder Segmented Filter */}
        <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-lg self-start sm:self-auto">
          {(['Todos', 'Silvio', 'Janaína'] as const).map(holderOption => (
            <button
              key={holderOption}
              onClick={() => setSelectedHolder(holderOption)}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedHolder === holderOption
                  ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {holderOption}
            </button>
          ))}
        </div>
      </div>

      {/* Top Financial Summary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Inicial */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Saldo Inicial</span>
            <Wallet className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
            {formatCurrencyAccounting(monthlySummary.initialBalance)}
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Soma das contas correntes em 01/{selectedMonth.split('-')[1]}
          </p>
        </div>

        {/* Entradas / Receitas */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Entradas Totais</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600">
            {formatCurrencyAccounting(monthlySummary.totalIncomeRealized + monthlySummary.totalIncomeProvisioned)}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
            <span>Realizado: {formatCurrencyRaw(monthlySummary.totalIncomeRealized)}</span>
            {monthlySummary.totalIncomeProvisioned > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-700">Previsto: {formatCurrencyRaw(monthlySummary.totalIncomeProvisioned)}</span>
              </>
            )}
          </div>
        </div>

        {/* Despesas Totais */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Despesas</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-rose-600">
            {formatCurrencyAccounting(monthlySummary.totalExpenseRealized + monthlySummary.totalExpenseProvisioned)}
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
              <span className="text-neutral-600">
                Realizado: <strong className="text-emerald-700 font-mono">{formatCurrencyRaw(monthlySummary.totalExpenseRealized)}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span className="text-neutral-600">
                A Pagar: <strong className="text-amber-700 font-mono">{formatCurrencyRaw(monthlySummary.totalExpenseProvisioned)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Saldo do Mês & Saldo Provisionado */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Saldo do Mês</span>
            <div className="text-xs font-semibold px-2 py-0.5 bg-neutral-100 rounded text-neutral-700">
              {monthlySummary.netMonthRealized >= 0 ? 'Superávit' : 'Déficit'}
            </div>
          </div>
          <div className={`text-2xl font-bold font-mono tabular-nums ${getCurrencyColorClass(monthlySummary.netMonthRealized)}`}>
            {formatCurrencyAccounting(monthlySummary.netMonthRealized)}
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-neutral-500">Saldo Provisionado:</span>
            <span className={`font-mono font-bold ${getCurrencyColorClass(monthlySummary.netMonthProvisioned)}`}>
              {formatCurrencyAccounting(monthlySummary.netMonthProvisioned)}
            </span>
          </div>
        </div>
      </div>

      {/* Provisão & Liquidez Banner */}
      <div className="bg-neutral-900 text-white rounded-xl p-5 border border-neutral-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
            <span>Posição de Liquidez & Projeção Final</span>
            <span aria-hidden="true">·</span>
            <span>{formatMonthRef(selectedMonth)}</span>
          </div>
          <div className="flex flex-wrap items-baseline gap-6">
            <div>
              <span className="text-xs text-neutral-400 block font-medium">Saldo Real Atual (Apenas Efetivadas):</span>
              <span className={`text-2xl font-bold font-mono tabular-nums ${monthlySummary.currentRealBalance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatCurrencyAccounting(monthlySummary.currentRealBalance)}
              </span>
            </div>
            <div className="hidden sm:block text-neutral-600 font-light text-2xl self-center">/</div>
            <div>
              <span className="text-xs text-neutral-400 block font-medium">Saldo Projetado Final (Descontando Provisões):</span>
              <span className={`text-2xl font-bold font-mono tabular-nums ${monthlySummary.projectedFinalBalance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatCurrencyAccounting(monthlySummary.projectedFinalBalance)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onNavigateToCards}
            className="px-3.5 py-2 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors border border-neutral-700 whitespace-nowrap cursor-pointer"
          >
            Faturas em Aberto: {formatCurrencyRaw(totalCardDebt)}
          </button>
          <button
            onClick={onOpenNewTransaction}
            className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            + Novo Lançamento
          </button>
        </div>
      </div>

      {/* Two Column Layout: Category Breakdown & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Category Distribution */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-neutral-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Despesas por Categoria
              </h3>
              <p className="text-[11px] text-neutral-500">
                Verde = Realizado · Amarelo/Laranja = Provisionado
              </p>
            </div>
            <span className="text-xs text-neutral-500 font-medium">
              {categoryStats.length} categorias
            </span>
          </div>

          {categoryStats.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-lg bg-neutral-50/70 border border-neutral-100 space-y-2">
              <div className="text-2xl">📊</div>
              <p className="text-xs font-semibold text-neutral-800">Nenhuma despesa lançada em {formatMonthRef(selectedMonth)}</p>
              <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
                As barras com valor realizado vs. provisionado aparecerão aqui conforme você registrar os gastos.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {categoryStats.map(cat => (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-800">{cat.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 font-mono">
                        {cat.percentage.toFixed(1)}%
                      </span>
                      <span className="font-mono font-bold text-neutral-900">
                        {formatCurrencyRaw(cat.total)}
                      </span>
                    </div>
                  </div>

                  {/* Progress track with dual visual fill */}
                  <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden flex shadow-2xs">
                    <div
                      className="bg-emerald-600 h-full transition-all"
                      style={{ width: `${(cat.realized / (cat.total || 1)) * 100}%` }}
                      title={`Realizado / Pago: ${formatCurrencyRaw(cat.realized)}`}
                    />
                    <div
                      className="bg-amber-400 h-full transition-all"
                      style={{ width: `${(cat.provisioned / (cat.total || 1)) * 100}%` }}
                      title={`Provisionado (A Pagar): ${formatCurrencyRaw(cat.provisioned)}`}
                    />
                  </div>

                  {/* Category Status Tag */}
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <span className="text-neutral-500 text-[11px]">
                      {cat.count} {cat.count === 1 ? 'lançamento' : 'lançamentos'}
                      {cat.realized > 0 && ` (Pago: ${formatCurrencyRaw(cat.realized)})`}
                    </span>
                    {cat.provisioned === 0 ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        100% quitado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[11px]">
                        <Clock className="w-3 h-3 text-amber-600" />
                        A Pagar: {formatCurrencyRaw(cat.provisioned)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Key Transactions of the Month */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-neutral-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Lançamentos ({formatMonthRef(selectedMonth)})
              </h3>
              <p className="text-[11px] text-neutral-500">
                Liquide contas provisionadas com um clique para atualizar o saldo bancário
              </p>
            </div>
            <button
              onClick={onNavigateToTransactions}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
            >
              <span>Ver todos ({filteredTransactions.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-lg bg-neutral-50/70 border border-neutral-100 space-y-3">
              <div className="text-3xl">📝</div>
              <p className="text-xs font-bold text-neutral-800">Painel pronto para receber seus lançamentos</p>
              <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                Sua rotina está limpa e pronta para começar. Clique abaixo para registrar o primeiro gasto ou receita da família.
              </p>
              <button
                onClick={onOpenNewTransaction}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Inserir Primeiro Lançamento</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {filteredTransactions.slice(0, 8).map(tx => {
                const isExpense = tx.type === 'despesa';
                const isProvisioned = tx.status === 'provisionado';

                return (
                  <div
                    key={tx.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 hover:bg-neutral-50/70 px-2 rounded-lg transition-colors group"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-900 truncate">
                            {tx.description}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500 mt-0.5">
                          <span>{formatDateBR(tx.date)}</span>
                          <span aria-hidden="true">·</span>
                          <span>{tx.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{tx.paymentMethod}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-neutral-700">{tx.holder}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 self-end sm:self-auto">
                      <div className="text-right">
                        <div
                          className={`text-sm font-bold font-mono tabular-nums ${
                            isExpense ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {isExpense
                            ? formatCurrencyAccounting(-tx.amount)
                            : formatCurrencyAccounting(tx.amount)}
                        </div>
                      </div>

                      {/* Explicit Liquidar / Dar Baixa (✔️) Button */}
                      {isProvisioned ? (
                        <button
                          onClick={() => toggleTransactionStatus(tx.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                          title="Clique para liquidar / dar baixa nesta conta imediatamente"
                        >
                          <span>✔️</span>
                          <span>Dar Baixa</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Efetivado</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>Ao dar baixa, o saldo real bancário e os totais de despesas são recalculados na hora.</span>
            <button
              onClick={onOpenNewTransaction}
              className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar lançamento</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
