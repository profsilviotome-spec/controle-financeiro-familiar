import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, CreditCard as CardIcon, DollarSign, Tag, User } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import {
  Transaction,
  TransactionType,
  TransactionGroup,
  Category,
  PaymentMethod,
  Holder,
  TransactionStatus,
} from '../types/finance';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
}

const EXPENSE_GROUPS: TransactionGroup[] = [
  'Despesa Rotineira',
  'Despesa Eventual',
  'Despesa Financeira',
  'Dívida ou Parcelamento',
];

const INCOME_GROUPS: TransactionGroup[] = [
  'Salário',
  'Renda Extra',
  'Outras Entradas',
];

const CATEGORIES: { [key in TransactionType]: Category[] } = {
  despesa: [
    'Casa',
    'Supermercado',
    'Transporte',
    'Saúde',
    'Educação',
    'Lazer & Cultura',
    'Empréstimos / Dívidas',
    'Vestuário & Pessoal',
    'Serviços & Assinaturas',
    'Outros',
  ],
  receita: ['Salário', 'Renda Extra', 'Outros'],
};

const PAYMENT_METHODS: PaymentMethod[] = [
  'Cartão BB - Silvio',
  'Cartão BB - Janaína',
  'Cartão Inter - Silvio',
  'Cartão Renner - Janaína',
  'Débito automático BB',
  'Débito automático Inter',
  'Desconto em folha',
  'PIX / Transferência',
  'Dinheiro em espécie',
];

const HOLDERS: Holder[] = ['Silvio', 'Janaína', 'Família / Comum'];

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  transactionToEdit,
}) => {
  const { addTransaction, updateTransaction, selectedMonth, creditCards, bankAccounts } = useFinance();

  const [type, setType] = useState<TransactionType>('despesa');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [monthRef, setMonthRef] = useState(selectedMonth);
  const [group, setGroup] = useState<TransactionGroup>('Despesa Rotineira');
  const [category, setCategory] = useState<Category>('Supermercado');
  const [subcategory, setSubcategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cartão BB - Silvio');
  const [holder, setHolder] = useState<Holder>('Silvio');
  const [status, setStatus] = useState<TransactionStatus>('efetivado');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-fill form when editing or resetting
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setDescription(transactionToEdit.description);
      setAmount(transactionToEdit.amount.toString());
      setDate(transactionToEdit.date);
      setMonthRef(transactionToEdit.monthRef);
      setGroup(transactionToEdit.group);
      setCategory(transactionToEdit.category);
      setSubcategory(transactionToEdit.subcategory || '');
      setPaymentMethod(transactionToEdit.paymentMethod);
      setHolder(transactionToEdit.holder);
      setStatus(transactionToEdit.status);
      setNotes(transactionToEdit.notes || '');
    } else {
      // Default initial values for new entry
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      setType('despesa');
      setDescription('');
      setAmount('');
      setDate(today);
      setMonthRef(selectedMonth || today.substring(0, 7));
      setGroup('Despesa Rotineira');
      setCategory('Supermercado');
      setSubcategory('');
      setPaymentMethod('Cartão BB - Silvio');
      setHolder('Silvio');
      setStatus('efetivado');
      setNotes('');
    }
    setErrorMsg('');
  }, [transactionToEdit, isOpen, selectedMonth]);

  // When date changes, automatically suggest the matching month reference
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (newDate) {
      setMonthRef(newDate.substring(0, 7));
    }
  };

  // Adjust group and category default when type toggles
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'receita') {
      setGroup('Salário');
      setCategory('Salário');
      setPaymentMethod('PIX / Transferência');
    } else {
      setGroup('Despesa Rotineira');
      setCategory('Supermercado');
      setPaymentMethod('Cartão BB - Silvio');
    }
  };

  // Associate bankAccountId or creditCardId based on payment method
  const getAssociatedIds = (method: PaymentMethod, currentHolder: Holder) => {
    let creditCardId: string | undefined;
    let bankAccountId: string | undefined;

    if (method === 'Cartão BB - Silvio') {
      creditCardId = creditCards.find(c => c.id === 'card-bb-silvio')?.id;
    } else if (method === 'Cartão BB - Janaína') {
      creditCardId = creditCards.find(c => c.id === 'card-bb-janaina')?.id;
    } else if (method === 'Cartão Inter - Silvio') {
      creditCardId = creditCards.find(c => c.id === 'card-inter-silvio')?.id;
    } else if (method === 'Cartão Renner - Janaína') {
      creditCardId = creditCards.find(c => c.id === 'card-renner-janaina')?.id;
    } else if (method === 'Débito automático BB') {
      bankAccountId = currentHolder === 'Janaína' ? 'acc-bb-janaina' : 'acc-bb-silvio';
    } else if (method === 'Débito automático Inter') {
      bankAccountId = currentHolder === 'Janaína' ? 'acc-inter-janaina' : 'acc-inter-silvio';
    } else if (method === 'PIX / Transferência') {
      if (currentHolder === 'Janaína') bankAccountId = 'acc-bb-janaina';
      else bankAccountId = 'acc-bb-silvio';
    }

    return { creditCardId, bankAccountId };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));

    if (!description.trim()) {
      setErrorMsg('Por favor, informe uma descrição para o lançamento.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Informe um valor numérico válido maior que zero.');
      return;
    }
    if (!date) {
      setErrorMsg('Informe a data do lançamento.');
      return;
    }
    if (!monthRef) {
      setErrorMsg('Informe o mês de referência.');
      return;
    }

    const { creditCardId, bankAccountId } = getAssociatedIds(paymentMethod, holder);

    if (transactionToEdit) {
      updateTransaction({
        ...transactionToEdit,
        type,
        description: description.trim(),
        amount: parsedAmount,
        date,
        monthRef,
        group,
        category,
        subcategory: subcategory.trim() || undefined,
        paymentMethod,
        holder,
        status,
        notes: notes.trim() || undefined,
        creditCardId,
        bankAccountId,
      });
    } else {
      addTransaction({
        type,
        description: description.trim(),
        amount: parsedAmount,
        date,
        monthRef,
        group,
        category,
        subcategory: subcategory.trim() || undefined,
        paymentMethod,
        holder,
        status,
        notes: notes.trim() || undefined,
        creditCardId,
        bankAccountId,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">
              {transactionToEdit ? 'Editar Lançamento' : 'Novo Lançamento Financeiro'}
            </h2>
            <p className="text-xs text-neutral-500">
              Timestamp gerado automaticamente · Registro no livro de caixa
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Transaction Type Segmented Toggle */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
              Tipo de Movimentação
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 rounded-lg">
              <button
                type="button"
                onClick={() => handleTypeChange('despesa')}
                className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                  type === 'despesa'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Despesa (Saída)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('receita')}
                className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                  type === 'receita'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Receita (Entrada)
              </button>
            </div>
          </div>

          {/* Description & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Descrição do Lançamento *
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ex: Supermercado Muffato, Sanepar, Combustível..."
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Valor (R$) *
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
                  className="w-full pl-9 pr-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Date & Month of Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Data do Lançamento *
              </label>
              <input
                type="date"
                value={date}
                onChange={e => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Mês de Referência (ex: 2026-10) *
              </label>
              <input
                type="month"
                value={monthRef}
                onChange={e => setMonthRef(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Group & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Grupo da {type === 'despesa' ? 'Despesa' : 'Receita'} *
              </label>
              <select
                value={group}
                onChange={e => setGroup(e.target.value as TransactionGroup)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {(type === 'despesa' ? EXPENSE_GROUPS : INCOME_GROUPS).map(g => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Categoria Principal *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {CATEGORIES[type].map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subcategory & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Subcategoria (Opcional)
              </label>
              <input
                type="text"
                value={subcategory}
                onChange={e => setSubcategory(e.target.value)}
                placeholder="Ex: Gasolina, Água, Hortifrúti, Copel..."
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Forma de Pagamento *
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {PAYMENT_METHODS.map(pm => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Holder & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Titular / Responsável *
              </label>
              <select
                value={holder}
                onChange={e => setHolder(e.target.value as Holder)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {HOLDERS.map(h => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Status da Operação *
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TransactionStatus)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="efetivado">Efetivado (Realizado / Pago)</option>
                <option value="provisionado">Provisionado (Pendente / Previsto)</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Observações (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Anotações adicionais, parcelas, comprovante..."
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{transactionToEdit ? 'Salvar Alterações' : 'Confirmar Lançamento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
