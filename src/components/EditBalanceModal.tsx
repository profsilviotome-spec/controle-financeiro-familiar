import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { BankAccount } from '../types/finance';

interface EditBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: BankAccount | null;
}

export const EditBalanceModal: React.FC<EditBalanceModalProps> = ({
  isOpen,
  onClose,
  account,
}) => {
  const { updateBankAccountInitialBalance } = useFinance();
  const [balance, setBalance] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (account) {
      setBalance(account.initialBalance.toString());
      setErrorMsg('');
    }
  }, [account, isOpen]);

  if (!isOpen || !account) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(balance.replace(',', '.'));
    if (isNaN(parsed)) {
      setErrorMsg('Informe um valor numérico válido.');
      return;
    }
    updateBankAccountInitialBalance(account.id, parsed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              Ajustar Saldo Inicial da Conta
            </h2>
            <p className="text-xs text-neutral-500">
              {account.bankName} - {account.holder}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg"
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
              Saldo Inicial do Mês (R$)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs text-neutral-400 font-mono">
                R$
              </span>
              <input
                type="text"
                value={balance}
                onChange={e => setBalance(e.target.value)}
                placeholder="0,00"
                className="w-full pl-9 pr-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <p className="mt-1 text-[11px] text-neutral-500">
              Define o saldo de partida da conta corrente para os cálculos do mês.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salvar Saldo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
