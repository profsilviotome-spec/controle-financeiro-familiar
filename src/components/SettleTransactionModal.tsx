import React, { useState, useEffect } from 'react';
import { X, Check, Building2, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Transaction } from '../types/finance';
import { formatCurrencyRaw, formatDateBR } from '../utils/formatters';

interface SettleTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const SettleTransactionModal: React.FC<SettleTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  const { settleTransaction, bankAccounts, accountBalances } = useFinance();

  const [date, setDate] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (transaction && isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);

      // Pre-select account
      if (transaction.bankAccountId) {
        setSelectedAccountId(transaction.bankAccountId);
      } else {
        // Fallback matching holder
        const match =
          bankAccounts.find(b => b.holder === transaction.holder) || bankAccounts[0];
        if (match) setSelectedAccountId(match.id);
      }
      setIsSubmitting(false);
    }
  }, [transaction, isOpen, bankAccounts]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await settleTransaction(transaction.id, date, selectedAccountId || undefined);
    setIsSubmitting(false);
    onClose();
  };

  const selectedAccount = bankAccounts.find(b => b.id === selectedAccountId);
  const currentBalance = selectedAccount ? accountBalances[selectedAccount.id]?.current || 0 : 0;
  const simulatedAfterBalance =
    transaction.type === 'despesa'
      ? currentBalance - transaction.amount
      : currentBalance + transaction.amount;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-50/70">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
              <span className="text-emerald-700">✔️</span>
              <span>Liquidar / Dar Baixa no Lançamento</span>
            </h2>
            <p className="text-xs text-neutral-500">
              Confirmar quitação e atualizar saldos bancários imediatamente
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Transaction Summary Card */}
          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="font-bold text-neutral-900 text-sm">
                {transaction.description}
              </span>
              <span className="font-mono font-bold text-sm text-neutral-900">
                {formatCurrencyRaw(transaction.amount)}
              </span>
            </div>
            <div className="text-[11px] text-neutral-500">
              {transaction.category} · {transaction.group} · Titular: {transaction.holder}
            </div>
          </div>

          {/* Settlement Date */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Data da Efetivação / Pagamento Real:
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Account to Debit or Credit */}
          {transaction.type === 'despesa' && (
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Conta Corrente de Saída (Débito):
              </label>
              <select
                value={selectedAccountId}
                onChange={e => setSelectedAccountId(e.target.value)}
                className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Nenhuma / Pagamento via Cartão de Crédito</option>
                {bankAccounts.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} - {b.holder} (Saldo: {formatCurrencyRaw(accountBalances[b.id]?.current || 0)})
                  </option>
                ))}
              </select>

              {selectedAccount && (
                <div className="mt-2 p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-md text-[11px] text-emerald-900 flex items-center justify-between">
                  <span>Saldo após liquidação:</span>
                  <span className="font-mono font-bold">
                    {formatCurrencyRaw(simulatedAfterBalance)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-800 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirmar Liquidação (✔️)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
