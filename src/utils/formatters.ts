/**
 * Utilities for formatting Brazilian currency, dates, and month references
 */

export function formatCurrencyRaw(amount: number): string {
  const absVal = Math.abs(amount);
  return absVal.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats currency according to standard accounting rules specified by user:
 * Positive/Zero: R$ 1.250,00
 * Negative: (R$ 1.250,00) in parenthesis
 */
export function formatCurrencyAccounting(amount: number): string {
  const formattedRaw = formatCurrencyRaw(amount);
  if (amount < 0) {
    return `(${formattedRaw})`;
  }
  return formattedRaw;
}

export function getCurrencyColorClass(amount: number): string {
  if (amount < 0) {
    return 'text-rose-600';
  }
  if (amount > 0) {
    return 'text-emerald-600';
  }
  return 'text-neutral-600';
}

/**
 * Converts monthRef "2026-10" to readable Portuguese "Outubro de 2026"
 */
export function formatMonthRef(monthRef: string): string {
  if (!monthRef) return '';
  const [year, month] = monthRef.split('-');
  const monthNum = parseInt(month, 10);
  
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  const monthName = months[monthNum - 1] || month;
  return `${monthName} de ${year}`;
}

export function formatMonthRefShort(monthRef: string): string {
  if (!monthRef) return '';
  const [year, month] = monthRef.split('-');
  const monthNum = parseInt(month, 10);
  
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  
  const monthName = months[monthNum - 1] || month;
  return `${monthName}/${year}`;
}

/**
 * Converts YYYY-MM-DD to DD/MM/YYYY
 */
export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Formats an ISO timestamp to Brazilian date + time
 */
export function formatTimestampBR(isoString: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
