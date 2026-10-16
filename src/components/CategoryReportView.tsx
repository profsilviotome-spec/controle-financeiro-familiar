import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Layers,
  Users,
  ChevronDown,
  ChevronUp,
  Plus,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import {
  formatCurrencyAccounting,
  formatCurrencyRaw,
  formatDateBR,
  formatMonthRef,
} from '../utils/formatters';
import { Category, Transaction } from '../types/finance';

interface CategoryReportViewProps {
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const CategoryReportView: React.FC<CategoryReportViewProps> = ({
  onOpenNewTransaction,
  onEditTransaction,
}) => {
  const {
    filteredTransactions,
    selectedMonth,
    monthlySummary,
    toggleTransactionStatus,
  } = useFinance();

  const [expandedCategories, setExpandedCategories] = useState<{ [cat: string]: boolean }>({});
  const [groupByMode, setGroupByMode] = useState<'category' | 'group' | 'holder'>('category');

  const totalExpense = monthlySummary.totalExpenseRealized + monthlySummary.totalExpenseProvisioned;

  const toggleExpand = (key: string) => {
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Calculate grouped structure
  const groupedData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'despesa');
    const map = new Map<
      string,
      {
        total: number;
        realized: number;
        provisioned: number;
        items: Transaction[];
      }
    >();

    expenses.forEach(t => {
      let groupKey: string = t.category;
      if (groupByMode === 'group') groupKey = t.group;
      if (groupByMode === 'holder') groupKey = t.holder;

      const current = map.get(groupKey) || {
        total: 0,
        realized: 0,
        provisioned: 0,
        items: [],
      };

      current.total += t.amount;
      current.items.push(t);
      if (t.status === 'efetivado') {
        current.realized += t.amount;
      } else {
        current.provisioned += t.amount;
      }

      map.set(groupKey, current);
    });

    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        ...data,
        percentage: totalExpense > 0 ? (data.total / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTransactions, groupByMode, totalExpense]);

  return (
    <div className="space-y-6">
      {/* Header and Grouping Selector */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-neutral-900">
            Relatórios e Detalhamento de Despesas
          </h2>
          <p className="text-xs text-neutral-500">
            Mês de Referência: {formatMonthRef(selectedMonth)} · Total de Despesas:{' '}
            <span className="font-semibold text-rose-600 font-mono">
              {formatCurrencyAccounting(-totalExpense)}
            </span>
          </p>
        </div>

        {/* Segmented Group By Switch */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setGroupByMode('category')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              groupByMode === 'category'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Por Categoria
          </button>
          <button
            onClick={() => setGroupByMode('group')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              groupByMode === 'group'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Por Grupo (Rotineira/Eventual)
          </button>
          <button
            onClick={() => setGroupByMode('holder')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              groupByMode === 'holder'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Por Titular
          </button>
        </div>
      </div>

      {/* Grouped Breakdown List */}
      {groupedData.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-neutral-200 text-neutral-500 text-xs">
          Nenhuma despesa para exibir no período selecionado.
        </div>
      ) : (
        <div className="space-y-3">
          {groupedData.map(group => {
            const isExpanded = !!expandedCategories[group.name];

            return (
              <div
                key={group.name}
                className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs"
              >
                {/* Header Row */}
                <div
                  onClick={() => toggleExpand(group.name)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-neutral-400 hover:text-neutral-700">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900">
                        {group.name}
                      </h3>
                      <p className="text-xs text-neutral-500">
                        {group.items.length} {group.items.length === 1 ? 'item' : 'itens'} ·{' '}
                        {group.percentage.toFixed(1)}% do total do mês
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-bold font-mono tabular-nums text-neutral-900">
                      {formatCurrencyRaw(group.total)}
                    </div>
                    <div className="flex items-center justify-end gap-2 text-xs text-neutral-500">
                      <span>Pago: {formatCurrencyRaw(group.realized)}</span>
                      {group.provisioned > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-700">A pagar: {formatCurrencyRaw(group.provisioned)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Distribution Bar */}
                <div className="px-4 pb-3 space-y-1.5">
                  <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden flex shadow-2xs">
                    <div
                      className="bg-emerald-600 h-full transition-all"
                      style={{
                        width: `${(group.realized / (group.total || 1)) * 100}%`,
                      }}
                      title={`Realizado / Pago: ${formatCurrencyRaw(group.realized)}`}
                    />
                    <div
                      className="bg-amber-400 h-full transition-all"
                      style={{
                        width: `${(group.provisioned / (group.total || 1)) * 100}%`,
                      }}
                      title={`Provisionado (A Pagar): ${formatCurrencyRaw(group.provisioned)}`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <span className="text-neutral-500 text-[11px]">
                      {group.items.length} {group.items.length === 1 ? 'lançamento' : 'lançamentos'}
                      {group.realized > 0 && ` (Pago: ${formatCurrencyRaw(group.realized)})`}
                    </span>
                    {group.provisioned === 0 ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        100% quitado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[11px]">
                        <Clock className="w-3 h-3 text-amber-600" />
                        A Pagar: {formatCurrencyRaw(group.provisioned)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Details Table */}
                {isExpanded && (
                  <div className="border-t border-neutral-100 bg-neutral-50/50 p-4">
                    <div className="space-y-2">
                      {group.items.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-xs py-2 px-3 bg-white rounded-lg border border-neutral-200/60"
                        >
                          <div className="flex items-center gap-3">
                            {item.status === 'provisionado' ? (
                              <button
                                onClick={() => toggleTransactionStatus(item.id)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
                                title="Confirmar pagamento e liquidar conta"
                              >
                                <span>✔️</span>
                                <span>Dar Baixa</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => toggleTransactionStatus(item.id)}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                title="Clique para estornar para provisionado"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Efetivado</span>
                              </button>
                            )}

                            <div>
                              <div className="font-semibold text-neutral-900">
                                {item.description}
                              </div>
                              <div className="text-[11px] text-neutral-500">
                                {formatDateBR(item.date)} · {item.paymentMethod} · {item.holder}
                                {item.subcategory && ` · ${item.subcategory}`}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono font-semibold text-neutral-900">
                              {formatCurrencyRaw(item.amount)}
                            </span>
                            <button
                              onClick={() => onEditTransaction(item)}
                              className="text-[11px] text-neutral-500 hover:text-neutral-900 underline"
                            >
                              Editar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
