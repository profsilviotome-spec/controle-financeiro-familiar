import React, { useState, useEffect } from 'react';
import { X, Check, CreditCard as CardIcon, Building2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { CreditCard, BankAccount } from '../types/finance';
import { formatCurrencyRaw } from '../utils/formatters';

interface PayInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: CreditCard | null;
  defaultAmount?: number;
}

export const PayInvoiceModal: React.FC<PayInvoiceModalProps> = ({
  isOpen,
  onClose,
  card,
  defaultAmount = 0,
}) => {
  const { bankAccounts, payCreditCardInvoice, accountBalances } = useFinance();

  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && card) {
      setAmount(defaultAmount.toString());
      const today = new Date().toISOString().split('T')[0];
      setDate(today);

      // Pre-select account based on bank and holder
      const matchingAccount = bankAccounts.find(
        b => b.holder === card.holder && b.bankName === card.bankName
      ) || bankAccounts.find(b => b.holder === card.holder) || bankAccounts[0];

      if (matchingAccount) {
        setSelectedAccountId(matchingAccount.id);
      }
      setErrorMsg('');
    }
  }, [isOpen, card, defaultAmount, bankAccounts]);

  if (!isOpen || !card) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Informe um valor de pagamento válido.');
      return;
    }
    if (!selectedAccountId) {
      setErrorMsg('Selecione a conta bancária para débito.');
      return;
    }
    if (!date) {
      setErrorMsg('Informe a data do pagamento.');
      return;
    }

    payCreditCardInvoice(card.id, selectedAccountId, parsedAmount, date);
    onClose();
  };

  const selectedAccount = bankAccounts.find(b => b.id === selectedAccountId);
  const selectedBalance = selectedAccount ? accountBalances[selectedAccount.id]?.current || 0 : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              Registrar Pagamento de Fatura
            </h2>
            <p className="text-xs text-neutral-500">
              {card.cardName} · Titular: {card.holder}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-5 mt-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Conta de Débito (Origem do Recurso) *
            </label>
            <select
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              {bankAccounts.map(b => (
                <option key={b.id} value={b.id}>
                  {b.bankName} - {b.holder} (Saldo Atual: {formatCurrencyRaw(accountBalances[b.id]?.current || 0)})
                </option>
              ))}
            </select>
            {selectedAccount && (
              <p className="mt-1 text-[11px] text-neutral-500">
                Saldo disponível na conta: <span className="font-semibold text-neutral-800">{formatCurrencyRaw(selectedBalance)}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Valor do Pagamento (R$) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs text-neutral-400 font-mono">
                R$
              </span>
              <input
                type="text"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="flex gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setAmount(defaultAmount.toString())}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium underline"
              >
                Pagar Valor Total da Fatura ({formatCurrencyRaw(defaultAmount)})
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Data do Pagamento *
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-800 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirmar Quitação</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
