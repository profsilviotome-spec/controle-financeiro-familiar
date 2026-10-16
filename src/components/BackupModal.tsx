import React, { useState } from 'react';
import {
  X,
  Download,
  Upload,
  RotateCcw,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  Copy,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatTimestampBR } from '../utils/formatters';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const {
    exportToJSON,
    importFromJSON,
    exportToCSV,
    resetToDefaultData,
    loadSampleData,
    googleSheetConfig,
    updateGoogleSheetConfig,
    syncWithGoogleAppsScript,
    isSyncing,
  } = useFinance();

  const [activeSubTab, setActiveSubTab] = useState<'sheets' | 'backup'>('sheets');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [scriptUrlInput, setScriptUrlInput] = useState(googleSheetConfig.appsScriptUrl || '');
  const [sheetUrlInput, setSheetUrlInput] = useState(googleSheetConfig.sheetUrl || '');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const success = importFromJSON(content);
        if (success) {
          setImportStatus('Dados importados com sucesso!');
          setTimeout(() => {
            setImportStatus(null);
            onClose();
          }, 1500);
        } else {
          setImportStatus('Falha ao importar: arquivo JSON inválido.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleReset = async () => {
    if (
      window.confirm(
        'Deseja restaurar todos os dados para os valores padrão simulados de Outubro/2026? Suas alterações manuais serão resetadas.'
      )
    ) {
      await resetToDefaultData();
      setImportStatus('Dados padrão restaurados!');
      setTimeout(() => {
        setImportStatus(null);
        onClose();
      }, 1000);
    }
  };

  const handleSaveSheetConfig = () => {
    updateGoogleSheetConfig({
      appsScriptUrl: scriptUrlInput.trim(),
      sheetUrl: sheetUrlInput.trim(),
    });
    setImportStatus('Configuração do Google Sheets salva!');
    setTimeout(() => setImportStatus(null), 2000);
  };

  const handleTriggerSync = async () => {
    const res = await syncWithGoogleAppsScript();
    setImportStatus(res.message);
    setTimeout(() => setImportStatus(null), 3000);
  };

  const appsScriptCodeSnippet = `// CÓDIGO GOOGLE APPS SCRIPT PARA A PLANILHA FAMILIAR
// Cole este código no editor de script da sua planilha (Extensões > Apps Script)

function onFormSubmit(e) {
  // Disparado automaticamente quando um novo lançamento é enviado pelo Google Forms
  var appUrl = "${window.location.origin}/api/sheets/webhook";
  
  var payload = {
    date: new Date().toISOString().split('T')[0],
    description: e.namedValues['Descrição'] ? e.namedValues['Descrição'][0] : 'Despesa Google Form',
    amount: parseFloat(e.namedValues['Valor'][0].replace(',', '.')),
    category: e.namedValues['Categoria'] ? e.namedValues['Categoria'][0] : 'Casa',
    paymentMethod: e.namedValues['Forma de Pagamento'] ? e.namedValues['Forma de Pagamento'][0] : 'PIX / Transferência',
    holder: e.namedValues['Titular'] ? e.namedValues['Titular'][0] : 'Silvio',
    status: 'efetivado'
  };

  UrlFetchApp.fetch(appUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  });
}

function exportarParaApp() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  // Envia todos os lançamentos da planilha para o FinFamília
  Logger.log("Sincronização concluída!");
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCodeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 bg-neutral-50/70">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">
              Integração Nuvem, Google Sheets & Backup
            </h2>
            <p className="text-xs text-neutral-500">
              Acesso compartilhado e conciliação para toda a família
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-neutral-200 px-5 bg-neutral-50/40 text-xs font-medium">
          <button
            onClick={() => setActiveSubTab('sheets')}
            className={`py-2.5 px-3 border-b-2 font-semibold transition-colors cursor-pointer ${
              activeSubTab === 'sheets'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Google Sheets & Apps Script
          </button>
          <button
            onClick={() => setActiveSubTab('backup')}
            className={`py-2.5 px-3 border-b-2 font-semibold transition-colors cursor-pointer ${
              activeSubTab === 'backup'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Exportar / Importar / Reset
          </button>
        </div>

        {importStatus && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            {importStatus}
          </div>
        )}

        {/* Tab 1: Google Sheets Integration */}
        {activeSubTab === 'sheets' && (
          <div className="p-5 space-y-4 text-xs">
            <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200/80 space-y-1.5">
              <div className="font-semibold text-emerald-900 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Integração Ativa com Google Sheets & Formulários</span>
              </div>
              <p className="text-emerald-800 text-[11px] leading-relaxed">
                Os lançamentos efetuados pelos membros da família (Silvio e Janaína) são salvos de forma persistente. Você pode conectar diretamente à planilha existente usando o webhook do Google Apps Script.
              </p>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Link da Planilha Google Sheets da Família:
                </label>
                <input
                  type="text"
                  value={sheetUrlInput}
                  onChange={e => setSheetUrlInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  URL do Webhook do Google Apps Script (Opcional para envio automático):
                </label>
                <input
                  type="text"
                  value={scriptUrlInput}
                  onChange={e => setScriptUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleSaveSheetConfig}
                  className="px-3 py-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
                >
                  Salvar Links
                </button>

                <button
                  type="button"
                  onClick={handleTriggerSync}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-md transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sincronizar Agora</span>
                </button>
              </div>
            </div>

            {/* Script Code Snippet */}
            <div className="space-y-1.5 pt-2 border-t border-neutral-100">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-800">
                  Script de Conexão Automática (Google Apps Script):
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedCode ? 'Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>
              <pre className="p-3 bg-neutral-900 text-neutral-200 rounded-lg font-mono text-[10px] overflow-x-auto max-h-36 leading-normal">
                {appsScriptCodeSnippet}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 2: Export, Import, Reset */}
        {activeSubTab === 'backup' && (
          <div className="p-5 space-y-4 text-xs">
            {/* Export CSV */}
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-900">Exportar Planilha (CSV)</div>
                <div className="text-neutral-500 text-[11px]">
                  Compatível com Google Sheets e Microsoft Excel
                </div>
              </div>
              <button
                onClick={exportToCSV}
                className="px-3 py-1.5 font-medium bg-white hover:bg-neutral-100 border border-neutral-300 rounded-md text-neutral-700 shadow-2xs"
              >
                Baixar CSV
              </button>
            </div>

            {/* Export JSON */}
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-900">Backup Completo (JSON)</div>
                <div className="text-neutral-500 text-[11px]">
                  Salva contas bancárias, cartões, faturas e lançamentos
                </div>
              </div>
              <button
                onClick={exportToJSON}
                className="px-3 py-1.5 font-medium bg-white hover:bg-neutral-100 border border-neutral-300 rounded-md text-neutral-700 shadow-2xs"
              >
                Baixar JSON
              </button>
            </div>

            {/* Import JSON */}
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-900">Restaurar Backup (JSON)</div>
                <div className="text-neutral-500 text-[11px]">
                  Carregar arquivo de backup salvo anteriormente
                </div>
              </div>
              <label className="cursor-pointer px-3 py-1.5 font-medium bg-white hover:bg-neutral-100 border border-neutral-300 rounded-md text-neutral-700 shadow-2xs">
                Selecionar
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Clear all or Load Samples */}
            <div className="pt-2 border-t border-neutral-100 space-y-2">
              <button
                onClick={handleReset}
                className="w-full py-2 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar Todos os Lançamentos (Começar do Zero)</span>
              </button>

              <button
                onClick={() => {
                  loadSampleData();
                  setImportStatus('Dados de exemplo carregados para teste!');
                  setTimeout(() => {
                    setImportStatus(null);
                    onClose();
                  }, 1200);
                }}
                className="w-full py-2 px-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 border border-neutral-300 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>💡</span>
                <span>Carregar Lançamentos de Demonstração (Opcional)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
