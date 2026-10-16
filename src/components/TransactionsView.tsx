import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import {
  formatCurrencyAccounting,
  formatCurrencyRaw,
  getCurrencyColorClass,
  formatDateBR,
  formatTimestampBR,
  formatMonthRef,
} from '../utils/formatters';
import { Transaction, TransactionType, TransactionStatus, Holder } from '../types/finance';

interface TransactionsViewProps {
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenNewTransaction,
  onEditTransaction,
}) => {
  const {
    transactions,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    deleteTransaction,
    toggleTransactionStatus,
    exportToCSV,
  } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TransactionStatus>('all');
  const [holderFilter, setHolderFilter] = useState<'all' | Holder>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'description'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filtered & Sorted list
  const filteredList = useMemo(() => {
    return transactions.filter(tx => {
      // Month
      if (selectedMonth && tx.monthRef !== selectedMonth) return false;

      // Type
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

      // Status
      if (statusFilter !== 'all' && tx.status !== statusFilter) return false;

      // Holder
      if (holderFilter !== 'all' && tx.holder !== holderFilter) return false;

      // Group
      if (groupFilter !== 'all' && tx.group !== groupFilter) return false;

      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchDesc = tx.description.toLowerCase().includes(query);
        const matchCat = tx.category.toLowerCase().includes(query);
        const matchSub = (tx.subcategory || '').toLowerCase().includes(query);
        const matchPay = tx.paymentMethod.toLowerCase().includes(query);
        const matchNotes = (tx.notes || '').toLowerCase().includes(query);
        if (!matchDesc && !matchCat && !matchSub && !matchPay && !matchNotes) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let comp = 0;
      if (sortBy === 'date') {
        comp = a.date.localeCompare(b.date);
      } else if (sortBy === 'amount') {
        comp = a.amount - b.amount;
      } else if (sortBy === 'description') {
        comp = a.description.localeCompare(b.description);
      }
      return sortOrder === 'desc' ? -comp : comp;
    });
  }, [
    transactions,
    selectedMonth,
    typeFilter,
    statusFilter,
    holderFilter,
    groupFilter,
    searchQuery,
    sortBy,
    sortOrder,
  ]);

  // Aggregate stats of current filtered table
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredList.forEach(t => {
      if (t.type === 'receita') income += t.amount;
      else expense += t.amount;
    });
    return { income, expense, balance: income - expense };
  }, [filteredList]);

  const handleDelete = (id: string, desc: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o lançamento "${desc}"?`)) {
      deleteTransaction(id);
    }
  };

  const provisionedCount = useMemo(
    () => transactions.filter(t => t.monthRef === selectedMonth && t.status === 'provisionado').length,
    [transactions, selectedMonth]
  );
  const realizedCount = useMemo(
    () => transactions.filter(t => t.monthRef === selectedMonth && t.status === 'efetivado').length,
    [transactions, selectedMonth]
  );

  return (
    <div className="space-y-4">
      {/* Top Filter and Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-4">
        {/* Month Selector & Quick Summary */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Mês de Referência:
            </span>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="text-xs bg-white font-semibold text-neutral-900 border border-neutral-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {availableMonths.map(m => (
                <option key={m} value={m}>
                  {formatMonthRef(m)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
            <button
              onClick={onOpenNewTransaction}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Lançamento</span>
            </button>
          </div>
        </div>

        {/* Quick Segmented Status Tabs */}
        <div className="flex items-center gap-2 p-1 bg-neutral-100 rounded-lg overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-neutral-900 font-bold shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Todos os Lançamentos
          </button>
          <button
            onClick={() => setStatusFilter('provisionado')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'provisionado'
                ? 'bg-amber-500 text-white font-bold shadow-xs'
                : 'text-amber-800 hover:bg-amber-100/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>A Pagar / Provisionados ({provisionedCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('efetivado')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'efetivado'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-emerald-800 hover:bg-emerald-100/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Efetivados / Realizados ({realizedCount})</span>
          </button>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search bar */}
          <div className="sm:col-span-3 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por descrição, subcategoria, cartão..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Tipo: Todos</option>
              <option value="despesa">Somente Despesas</option>
              <option value="receita">Somente Receitas</option>
            </select>
          </div>

          {/* Holder Filter */}
          <div>
            <select
              value={holderFilter}
              onChange={e => setHolderFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Titular: Todos</option>
              <option value="Silvio">Silvio</option>
              <option value="Janaína">Janaína</option>
              <option value="Família / Comum">Família / Comum</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Strip */}
        <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-neutral-100 gap-2">
          <div className="text-neutral-500">
            Exibindo <span className="font-semibold text-neutral-900">{filteredList.length}</span> lançamentos
          </div>

          <div className="flex items-center gap-4 font-mono tabular-nums">
            <span className="text-emerald-700">
              Entradas: <strong>{formatCurrencyRaw(totals.income)}</strong>
            </span>
            <span aria-hidden="true" className="text-neutral-300">|</span>
            <span className="text-rose-700">
              Despesas: <strong>{formatCurrencyRaw(totals.expense)}</strong>
            </span>
            <span aria-hidden="true" className="text-neutral-300">|</span>
            <span className={getCurrencyColorClass(totals.balance)}>
              Saldo: <strong>{formatCurrencyAccounting(totals.balance)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Transactions Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50/75 border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-10 text-center">Status</th>
                <th
                  onClick={() => {
                    if (sortBy === 'date') setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                    else {
                      setSortBy('date');
                      setSortOrder('desc');
                    }
                  }}
                  className="py-3 px-3 cursor-pointer hover:text-neutral-900"
                >
                  <div className="flex items-center gap-1">
                    <span>Data</span>
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Descrição & Subcategoria</th>
                <th className="py-3 px-3">Categoria & Grupo</th>
                <th className="py-3 px-3">Forma de Pagamento</th>
                <th className="py-3 px-3">Titular</th>
                <th
                  onClick={() => {
                    if (sortBy === 'amount') setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                    else {
                      setSortBy('amount');
                      setSortOrder('desc');
                    }
                  }}
                  className="py-3 px-3 text-right cursor-pointer hover:text-neutral-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Valor (R$)</span>
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center w-20">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-neutral-500">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="text-3xl">📋</div>
                      <p className="text-xs font-bold text-neutral-800">Nenhum lançamento encontrado</p>
                      <p className="text-[11px] text-neutral-500">
                        Não há movimentações cadastradas para este mês ou filtros.
                      </p>
                      <button
                        onClick={onOpenNewTransaction}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Criar Primeiro Lançamento</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map(tx => {
                  const isExpense = tx.type === 'despesa';
                  const isProvisioned = tx.status === 'provisionado';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-neutral-50/80 transition-colors group"
                    >
                      {/* Status / Liquidar Action */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {isProvisioned ? (
                          <button
                            onClick={() => toggleTransactionStatus(tx.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                            title="Confirmar pagamento e dar baixa imediata (recalcula saldos bancários)"
                          >
                            <span>✔️</span>
                            <span>Dar Baixa</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleTransactionStatus(tx.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-2 py-0.5 rounded transition-colors cursor-pointer"
                            title="Conta efetivada (clique caso deseje estornar para provisionada)"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Efetivado</span>
                          </button>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-neutral-700 font-medium">
                        {formatDateBR(tx.date)}
                      </td>

                      {/* Description & Subcategory */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-neutral-900">
                          {tx.description}
                        </div>
                        {tx.subcategory && (
                          <div className="text-[11px] text-neutral-500">
                            {tx.subcategory}
                          </div>
                        )}
                        {tx.notes && (
                          <div className="text-[10px] text-neutral-400 italic mt-0.5">
                            Obs: {tx.notes}
                          </div>
                        )}
                      </td>

                      {/* Category & Group */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="text-neutral-900 font-medium">{tx.category}</div>
                        <div className="text-[11px] text-neutral-500">{tx.group}</div>
                      </td>

                      {/* Payment Method */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-neutral-700">
                        {tx.paymentMethod}
                      </td>

                      {/* Holder */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-medium text-neutral-800">{tx.holder}</span>
                      </td>

                      {/* Value (R$) formatted with accounting rules */}
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-semibold tabular-nums whitespace-nowrap ${
                          isExpense ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {isExpense
                          ? formatCurrencyAccounting(-tx.amount)
                          : formatCurrencyAccounting(tx.amount)}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            title="Editar lançamento"
                            className="p-1 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id, tx.description)}
                            title="Excluir lançamento"
                            className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
