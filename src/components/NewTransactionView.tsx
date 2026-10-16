import React, { useState } from 'react';
import {
  Check,
  Calendar,
  DollarSign,
  Tag,
  CreditCard as CardIcon,
  User,
  Clock,
  Sparkles,
  CloudCheck,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import {
  TransactionType,
  TransactionGroup,
  Category,
  PaymentMethod,
  Holder,
  TransactionStatus,
  Transaction,
} from '../types/finance';
import {
  formatCurrencyRaw,
  formatCurrencyAccounting,
  formatMonthRef,
  formatDateBR,
} from '../utils/formatters';

interface NewTransactionViewProps {
  onNavigateToDashboard: () => void;
  onNavigateToTransactions: () => void;
}

const EXPENSE_GROUPS: TransactionGroup[] = [
  'Despesa Rotineira',
  'Despesa Eventual',
  'Investimento',
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

export const NewTransactionView: React.FC<NewTransactionViewProps> = ({
  onNavigateToDashboard,
  onNavigateToTransactions,
}) => {
  const { addTransaction, selectedMonth, creditCards, bankAccounts, isCloudSynced } = useFinance();

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const [type, setType] = useState<TransactionType>('despesa');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayStr);
  const [monthRef, setMonthRef] = useState(selectedMonth || todayStr.substring(0, 7));
  const [group, setGroup] = useState<TransactionGroup>('Despesa Rotineira');
  const [category, setCategory] = useState<Category>('Supermercado');
  const [subcategory, setSubcategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cartão BB - Silvio');
  const [holder, setHolder] = useState<Holder>('Silvio');
  const [status, setStatus] = useState<TransactionStatus>('efetivado');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [recentAdded, setRecentAdded] = useState<Transaction[]>([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Quick preset shortcuts for fast mobile entry
  const presets = [
    { label: 'Supermercado', category: 'Supermercado' as Category, group: 'Despesa Rotineira' as TransactionGroup, desc: 'Supermercado ' },
    { label: 'Combustível', category: 'Transporte' as Category, group: 'Despesa Rotineira' as TransactionGroup, desc: 'Combustível Posto ' },
    { label: 'Farmácia', category: 'Saúde' as Category, group: 'Despesa Rotineira' as TransactionGroup, desc: 'Farmácia ' },
    { label: 'Restaurante / Lazer', category: 'Lazer & Cultura' as Category, group: 'Despesa Eventual' as TransactionGroup, desc: 'Restaurante ' },
    { label: 'Conta de Casa', category: 'Casa' as Category, group: 'Despesa Rotineira' as TransactionGroup, desc: 'Conta ' },
  ];

  const handleApplyPreset = (preset: typeof presets[0]) => {
    setType('despesa');
    setCategory(preset.category);
    setGroup(preset.group);
    setDescription(preset.desc);
  };

  const handleDateChange = (val: string) => {
    setDate(val);
    if (val) {
      setMonthRef(val.substring(0, 7));
    }
  };

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

  const getAssociatedIds = (method: PaymentMethod, currentHolder: Holder) => {
    let creditCardId: string | undefined;
    let bankAccountId: string | undefined;

    if (method === 'Cartão BB - Silvio') creditCardId = 'card-bb-silvio';
    else if (method === 'Cartão BB - Janaína') creditCardId = 'card-bb-janaina';
    else if (method === 'Cartão Inter - Silvio') creditCardId = 'card-inter-silvio';
    else if (method === 'Cartão Renner - Janaína') creditCardId = 'card-renner-janaina';
    else if (method === 'Débito automático BB') {
      bankAccountId = currentHolder === 'Janaína' ? 'acc-bb-janaina' : 'acc-bb-silvio';
    } else if (method === 'Débito automático Inter') {
      bankAccountId = currentHolder === 'Janaína' ? 'acc-inter-janaina' : 'acc-inter-silvio';
    } else if (method === 'PIX / Transferência') {
      bankAccountId = currentHolder === 'Janaína' ? 'acc-bb-janaina' : 'acc-bb-silvio';
    }

    return { creditCardId, bankAccountId };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));

    if (!description.trim()) {
      setErrorMsg('Informe uma descrição para o lançamento.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Informe um valor numérico válido.');
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

    setErrorMsg('');

    const { creditCardId, bankAccountId } = getAssociatedIds(paymentMethod, holder);

    const added = await addTransaction({
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

    setRecentAdded(prev => [added, ...prev]);
    setShowSuccessToast(true);

    // Reset some fields for next entry
    setDescription('');
    setAmount('');
    setSubcategory('');
    setNotes('');

    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-neutral-900">
              Formulário de Lançamento Integrado
            </h1>
            <span className="text-xs text-neutral-500 font-mono">
              · Timestamp Automático
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Modernize o registro familiar. Os dados salvos aqui atualizam o painel e os cartões em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sincronização em Nuvem Ativa</span>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Lançamento gravado com sucesso!</strong> Atualizado no painel demonstrativo e nas faturas de cartões.
            </span>
          </div>
          <button
            onClick={() => onNavigateToDashboard()}
            className="font-semibold underline hover:text-emerald-900 ml-4 shrink-0"
          >
            Ver no Painel
          </button>
        </div>
      )}

      {/* Error alert */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Main Interactive Form Card */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
        {/* Quick presets row */}
        <div className="px-6 py-3 bg-neutral-50 border-b border-neutral-200 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-neutral-500 shrink-0">
            Atalhos rápidos:
          </span>
          {presets.map(p => (
            <button
              key={p.label}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="px-2.5 py-1 text-xs bg-white hover:bg-neutral-100 border border-neutral-300 rounded-md text-neutral-700 whitespace-nowrap transition-colors"
            >
              + {p.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 1. Transaction Type Toggle */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
              Tipo do Lançamento
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 rounded-lg max-w-md">
              <button
                type="button"
                onClick={() => handleTypeChange('despesa')}
                className={`py-2 text-xs font-bold rounded-md transition-colors ${
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
                className={`py-2 text-xs font-bold rounded-md transition-colors ${
                  type === 'receita'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Receita (Entrada)
              </button>
            </div>
          </div>

          {/* 2. Description & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Descrição da {type === 'despesa' ? 'Despesa' : 'Receita'} *
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ex: Supermercado Muffato, Posto Shell, Sanepar, Salário..."
                className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Valor do Lançamento (R$) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs text-neutral-400 font-mono">
                  R$
                </span>
                <input
                  type="text"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono font-semibold border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* 3. Dates & Month of Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Data do Lançamento (DD/MM/AAAA) *
              </label>
              <input
                type="date"
                value={date}
                onChange={e => handleDateChange(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* 4. Group & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Grupo do Lançamento *
              </label>
              <select
                value={group}
                onChange={e => setGroup(e.target.value as TransactionGroup)}
                className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {CATEGORIES[type].map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Subcategory & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Subcategoria (Opcional)
              </label>
              <input
                type="text"
                value={subcategory}
                onChange={e => setSubcategory(e.target.value)}
                placeholder="Ex: Gasolina, Água, Hortifrúti, Carnes, Farmácia..."
                className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Forma de Pagamento / Origem do Recurso *
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {PAYMENT_METHODS.map(pm => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 6. Holder & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Titular / Responsável *
              </label>
              <select
                value={holder}
                onChange={e => setHolder(e.target.value as Holder)}
                className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="efetivado">Efetivado (Realizado / Pago)</option>
                <option value="provisionado">Provisionado (Pendente / Previsto a pagar)</option>
              </select>
            </div>
          </div>

          {/* 7. Notes */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Observações / Detalhes Adicionais (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Parcela 2 de 5, comprado na promoção, comprovante no app..."
              className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-xs text-neutral-400">
              * Todos os lançamentos são salvos com timestamp de auditoria e persistência contínua.
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setDescription('');
                  setAmount('');
                  setSubcategory('');
                  setNotes('');
                }}
                className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Limpar Campos
              </button>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Lançamento</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Recently Added in this Session */}
      {recentAdded.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-neutral-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900">
              Lançamentos Recentes Salvos Nesta Sessão ({recentAdded.length})
            </h3>
            <button
              onClick={onNavigateToTransactions}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Ver todos os lançamentos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-neutral-100">
            {recentAdded.map(item => (
              <div
                key={item.id}
                className="py-2.5 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-neutral-900">{item.description}</span>
                  <span className="text-neutral-400 ml-2">
                    {formatDateBR(item.date)} · {item.category} · {item.paymentMethod} ({item.holder})
                  </span>
                </div>
                <span
                  className={`font-mono font-bold ${
                    item.type === 'despesa' ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {item.type === 'despesa'
                    ? formatCurrencyAccounting(-item.amount)
                    : formatCurrencyAccounting(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
