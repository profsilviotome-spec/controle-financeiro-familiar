import React, { useState } from 'react';
import {
  CreditCard as CardIcon,
  Building2,
  Calendar,
  AlertCircle,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  Edit3,
  Scale,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import {
  formatCurrencyAccounting,
  formatCurrencyRaw,
  getCurrencyColorClass,
  formatDateBR,
  formatMonthRef,
} from '../utils/formatters';
import { BankAccount, CreditCard, Transaction } from '../types/finance';

interface CardsAndBanksViewProps {
  onOpenPayInvoice: (card: CreditCard, defaultAmount: number) => void;
  onOpenEditBalance: (account: BankAccount) => void;
  onOpenNewTransaction: () => void;
}

export const CardsAndBanksView: React.FC<CardsAndBanksViewProps> = ({
  onOpenPayInvoice,
  onOpenEditBalance,
  onOpenNewTransaction,
}) => {
  const {
    bankAccounts,
    creditCards,
    accountBalances,
    cardInvoiceTotals,
    sheetInvoices,
    updateSheetInvoice,
    cardReconciliations,
    reconciliationSummary,
    transactions,
    selectedMonth,
    toggleTransactionStatus,
  } = useFinance();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [editingSheetCardId, setEditingSheetCardId] = useState<string | null>(null);
  const [editSheetValue, setEditSheetValue] = useState<string>('');

  // Aggregate total balance across all accounts
  const totalBankBalance = Object.values(accountBalances).reduce((acc, b) => acc + b.current, 0);
  const totalCardInvoices = Object.values(cardInvoiceTotals).reduce((acc, c) => acc + c.total, 0);

  // Filter items for the selected card
  const selectedCardItems = React.useMemo(() => {
    if (!selectedCardId) return [];
    return transactions.filter(
      t => t.creditCardId === selectedCardId && t.monthRef === selectedMonth
    );
  }, [transactions, selectedCardId, selectedMonth]);

  const handleStartEditSheet = (cardId: string, currentVal: number) => {
    setEditingSheetCardId(cardId);
    setEditSheetValue(currentVal.toString());
  };

  const handleSaveSheet = (cardId: string) => {
    const parsed = parseFloat(editSheetValue.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      updateSheetInvoice(cardId, parsed);
    }
    setEditingSheetCardId(null);
  };

  return (
    <div className="space-y-8">
      {/* Top Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Saldo Consolidado em Contas
            </span>
            <Building2 className="w-4 h-4 text-neutral-400" />
          </div>
          <div
            className={`text-2xl font-bold font-mono tabular-nums ${getCurrencyColorClass(
              totalBankBalance
            )}`}
          >
            {formatCurrencyAccounting(totalBankBalance)}
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Total disponível somando BB e Inter (Silvio e Janaína)
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Faturas Registradas no App
            </span>
            <CardIcon className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-rose-600">
            {formatCurrencyAccounting(-totalCardInvoices)}
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Faturas a vencer no mês ({formatMonthRef(selectedMonth)})
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Conciliação Geral Cartões
            </span>
            <Scale className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <div
              className={`text-2xl font-bold font-mono tabular-nums ${
                reconciliationSummary.isBalanced ? 'text-emerald-600' : 'text-amber-700'
              }`}
            >
              {reconciliationSummary.isBalanced
                ? 'Conciliado'
                : formatCurrencyAccounting(reconciliationSummary.totalDifference)}
            </div>
            <span className="text-xs text-neutral-500">
              {reconciliationSummary.isBalanced ? '100% batendo' : 'diferença'}
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            App: {formatCurrencyRaw(reconciliationSummary.totalApp)} vs. Planilha: {formatCurrencyRaw(reconciliationSummary.totalSheet)}
          </p>
        </div>
      </div>

      {/* BLOCO DE CONCILIAÇÃO DINÂMICA: SOMA DAS PLANILHAS VS. TOTAL REGISTRADO NO APP */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-neutral-200 bg-neutral-50/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-neutral-900">
                Atualização Dinâmica e Conciliação dos Cartões
              </h2>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Tempo Real
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Compare em tempo real a soma dos lançamentos do aplicativo contra a fatura/planilha de cada cartão.
            </p>
          </div>

          <button
            onClick={onOpenNewTransaction}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Lançar no Cartão</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Cartão / Banco</th>
                <th className="py-3 px-3">Titular</th>
                <th className="py-3 px-3 text-right">Total no App</th>
                <th className="py-3 px-4 text-right">Total da Planilha / Fatura</th>
                <th className="py-3 px-4 text-right">Diferença (App - Planilha)</th>
                <th className="py-3 px-4 text-center">Status Conciliação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {cardReconciliations.map(rec => {
                const isEditing = editingSheetCardId === rec.cardId;
                const isMatch = Math.abs(rec.difference) < 0.05;

                return (
                  <tr key={rec.cardId} className="hover:bg-neutral-50/70 transition-colors">
                    {/* Card Name */}
                    <td className="py-3 px-4 font-semibold text-neutral-900">
                      <div className="flex items-center gap-2">
                        <CardIcon className="w-4 h-4 text-neutral-500" />
                        <span>{rec.cardName}</span>
                      </div>
                    </td>

                    {/* Holder */}
                    <td className="py-3 px-3 text-neutral-700 font-medium">
                      {rec.holder}
                    </td>

                    {/* App Total (Dynamic) */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900 tabular-nums">
                      {formatCurrencyRaw(rec.appTotal)}
                    </td>

                    {/* Spreadsheet Total */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="text"
                            value={editSheetValue}
                            onChange={e => setEditSheetValue(e.target.value)}
                            className="w-24 px-1.5 py-0.5 text-xs text-right border border-emerald-500 rounded focus:outline-none"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveSheet(rec.cardId);
                              if (e.key === 'Escape') setEditingSheetCardId(null);
                            }}
                          />
                          <button
                            onClick={() => handleSaveSheet(rec.cardId)}
                            className="px-1.5 py-0.5 text-[11px] bg-emerald-600 text-white rounded font-semibold"
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5 group">
                          <span className="font-semibold text-neutral-700">
                            {formatCurrencyRaw(rec.sheetTotal)}
                          </span>
                          <button
                            onClick={() => handleStartEditSheet(rec.cardId, rec.sheetTotal)}
                            title="Editar valor da planilha/fatura para conferência"
                            className="text-neutral-400 hover:text-neutral-700 opacity-60 group-hover:opacity-100"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Difference */}
                    <td
                      className={`py-3 px-4 text-right font-mono font-bold tabular-nums ${
                        isMatch
                          ? 'text-emerald-600'
                          : rec.difference < 0
                          ? 'text-rose-600'
                          : 'text-amber-700'
                      }`}
                    >
                      {formatCurrencyAccounting(rec.difference)}
                    </td>

                    {/* Reconciliation Status Badge */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {isMatch ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>100% Conciliado</span>
                        </span>
                      ) : rec.difference < 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>Falta lançar no App ({formatCurrencyRaw(Math.abs(rec.difference))})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>App com gastos a mais ({formatCurrencyRaw(rec.difference)})</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-neutral-100/75 border-t border-neutral-300 font-bold text-xs">
                <td colSpan={2} className="py-3 px-4 text-neutral-900">
                  Total Geral Consolidado ({cardReconciliations.length} cartões)
                </td>
                <td className="py-3 px-3 text-right font-mono text-neutral-900">
                  {formatCurrencyRaw(reconciliationSummary.totalApp)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-neutral-800">
                  {formatCurrencyRaw(reconciliationSummary.totalSheet)}
                </td>
                <td
                  className={`py-3 px-4 text-right font-mono tabular-nums ${
                    reconciliationSummary.isBalanced
                      ? 'text-emerald-600'
                      : reconciliationSummary.totalDifference < 0
                      ? 'text-rose-600'
                      : 'text-amber-700'
                  }`}
                >
                  {formatCurrencyAccounting(reconciliationSummary.totalDifference)}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded ${
                      reconciliationSummary.isBalanced
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    {reconciliationSummary.isBalanced ? 'Tudo Conferido' : 'Verificar Diferenças'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* SECTION: CARTÕES DE CRÉDITO INDIVIDUAIS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-900">
              Cartões de Crédito por Titular e Banco
            </h2>
            <p className="text-xs text-neutral-500">
              Banco do Brasil (Silvio e Janaína), Inter (Silvio) e Renner (Janaína)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {creditCards.map(card => {
            const invoice = cardInvoiceTotals[card.id] || {
              total: 0,
              realized: 0,
              provisioned: 0,
              count: 0,
            };
            const availableLimit = Math.max(0, card.creditLimit - invoice.total);
            const limitUsedPct = (invoice.total / (card.creditLimit || 1)) * 100;

            return (
              <div
                key={card.id}
                className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs hover:border-neutral-300 transition-colors"
              >
                {/* Card Brand Header */}
                <div
                  className="px-5 py-3 text-white flex items-center justify-between"
                  style={{ backgroundColor: card.color }}
                >
                  <div className="flex items-center gap-2">
                    <CardIcon className="w-4 h-4 opacity-90" />
                    <span className="font-bold text-sm">{card.cardName}</span>
                  </div>
                  <span className="text-xs font-mono opacity-80">
                    •••• {card.last4} · {card.holder}
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  {/* Invoice Amount & Status */}
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xs font-medium text-neutral-500 block">
                        Fatura em Aberto (App):
                      </span>
                      <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
                        {formatCurrencyRaw(invoice.total)}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                        <span>Lançamentos: {formatCurrencyRaw(invoice.realized)}</span>
                        {invoice.provisioned > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-amber-700">Previsto: {formatCurrencyRaw(invoice.provisioned)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <button
                        onClick={() => onOpenPayInvoice(card, invoice.total)}
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Pagar Fatura
                      </button>
                    </div>
                  </div>

                  {/* Limit Usage Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-neutral-500">
                      <span>Limite Utilizado ({limitUsedPct.toFixed(0)}%)</span>
                      <span className="font-mono">
                        Disponível: {formatCurrencyRaw(availableLimit)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          limitUsedPct > 80 ? 'bg-rose-500' : 'bg-neutral-800'
                        }`}
                        style={{ width: `${Math.min(limitUsedPct, 100)}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-neutral-400 text-right">
                      Limite total: {formatCurrencyRaw(card.creditLimit)}
                    </div>
                  </div>

                  {/* Dates & Quick Items View */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs">
                    <div className="flex items-center gap-3 text-neutral-600">
                      <span>Fechamento: Dia {card.closingDay}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-neutral-900">
                        Vencimento: Dia {card.dueDay}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        setSelectedCardId(selectedCardId === card.id ? null : card.id)
                      }
                      className="text-emerald-700 hover:text-emerald-800 font-semibold text-xs cursor-pointer"
                    >
                      {selectedCardId === card.id
                        ? 'Ocultar Lançamentos'
                        : `Ver Lançamentos (${invoice.count})`}
                    </button>
                  </div>
                </div>

                {/* Sub-panel: Items of this Card */}
                {selectedCardId === card.id && (
                  <div className="border-t border-neutral-100 bg-neutral-50/60 p-4 space-y-2">
                    <div className="text-xs font-semibold text-neutral-700">
                      Gastos lançados no cartão em {formatMonthRef(selectedMonth)}:
                    </div>
                    {selectedCardItems.length === 0 ? (
                      <div className="text-xs text-neutral-500 italic py-2">
                        Nenhum lançamento no cartão neste mês.
                      </div>
                    ) : (
                      <div className="space-y-1.5 divide-y divide-neutral-100">
                        {selectedCardItems.map(item => (
                          <div
                            key={item.id}
                            className="pt-1.5 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-medium text-neutral-800">
                                {item.description}
                              </span>
                              <span className="text-neutral-400 ml-2">
                                {formatDateBR(item.date)} · {item.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold text-neutral-900">
                                {formatCurrencyRaw(item.amount)}
                              </span>
                              <button
                                onClick={() => toggleTransactionStatus(item.id)}
                                title="Alternar status"
                                className="text-neutral-400 hover:text-neutral-700"
                              >
                                {item.status === 'efetivado' ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION: CONTAS CORRENTES BANCÁRIAS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-900">
              Acompanhamento de Contas Correntes
            </h2>
            <p className="text-xs text-neutral-500">
              Banco do Brasil e Banco Inter para Silvio e Janaína
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bankAccounts.map(acc => {
            const balanceData = accountBalances[acc.id] || {
              initial: acc.initialBalance,
              in: 0,
              out: 0,
              current: acc.initialBalance,
            };

            return (
              <div
                key={acc.id}
                className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs hover:border-neutral-300 transition-colors"
              >
                {/* Bank Header Strip */}
                <div
                  className="px-5 py-3 flex items-center justify-between text-white"
                  style={{ backgroundColor: acc.color }}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 opacity-90" />
                    <span className="font-bold text-sm">{acc.bankName}</span>
                    <span className="text-xs opacity-75">·</span>
                    <span className="text-xs font-medium opacity-95">
                      Titular: {acc.holder}
                    </span>
                  </div>
                  <div className="text-xs font-mono opacity-80">
                    {acc.agencyNumber} / {acc.accountNumber}
                  </div>
                </div>

                {/* Account Balances Matrix */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-2 py-1 border-b border-neutral-100 text-center">
                    <div>
                      <div className="text-[11px] text-neutral-500 flex items-center justify-center gap-1">
                        <span>Saldo Inicial</span>
                        <button
                          onClick={() => onOpenEditBalance(acc)}
                          title="Ajustar saldo inicial"
                          className="text-neutral-400 hover:text-neutral-700"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-xs font-mono font-semibold text-neutral-700 mt-1">
                        {formatCurrencyAccounting(balanceData.initial)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] text-neutral-500">Entradas (+)</div>
                      <div className="text-xs font-mono font-semibold text-emerald-600 mt-1">
                        +{formatCurrencyRaw(balanceData.in)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] text-neutral-500">Saídas (-)</div>
                      <div className="text-xs font-mono font-semibold text-rose-600 mt-1">
                        -{formatCurrencyRaw(balanceData.out)}
                      </div>
                    </div>
                  </div>

                  {/* Real Balance Big Row */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
                        Saldo Atual / Real
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        Disponível em {formatMonthRef(selectedMonth)}
                      </span>
                    </div>

                    <div
                      className={`text-xl font-bold font-mono tabular-nums ${getCurrencyColorClass(
                        balanceData.current
                      )}`}
                    >
                      {formatCurrencyAccounting(balanceData.current)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
