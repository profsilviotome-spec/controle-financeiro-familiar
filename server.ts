import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { INITIAL_BANK_ACCOUNTS, INITIAL_CREDIT_CARDS, INITIAL_TRANSACTIONS } from './src/data/initialData';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'finfamilia_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial database shape
interface DatabaseShape {
  transactions: any[];
  bankAccounts: any[];
  creditCards: any[];
  sheetInvoices?: { [cardId: string]: number }; // Invoiced total from Google Sheets / invoices
  googleSheetConfig?: {
    webhookUrl?: string;
    sheetUrl?: string;
    lastSyncTime?: string;
  };
}

function loadDatabase(): DatabaseShape {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.transactions)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading database file, using initial data:', err);
  }

  // Fallback to clean initial state
  const initial: DatabaseShape = {
    transactions: INITIAL_TRANSACTIONS,
    bankAccounts: INITIAL_BANK_ACCOUNTS,
    creditCards: INITIAL_CREDIT_CARDS,
    sheetInvoices: {
      'card-bb-silvio': 0,
      'card-bb-janaina': 0,
      'card-inter-silvio': 0,
      'card-renner-janaina': 0,
    },
    googleSheetConfig: {
      sheetUrl: '',
      lastSyncTime: new Date().toISOString(),
    },
  };
  saveDatabase(initial);
  return initial;
}

function saveDatabase(data: DatabaseShape) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database file:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // API Routes
  // 1. GET full state
  app.get('/api/state', (req, res) => {
    const db = loadDatabase();
    res.json(db);
  });

  // 2. POST /api/transactions - Add transaction
  app.post('/api/transactions', (req, res) => {
    const db = loadDatabase();
    const newTx = {
      ...req.body,
      id: req.body.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: req.body.createdAt || new Date().toISOString(),
    };
    db.transactions.unshift(newTx);
    saveDatabase(db);
    res.status(201).json(newTx);
  });

  // 3. PUT /api/transactions/:id - Update transaction
  app.put('/api/transactions/:id', (req, res) => {
    const db = loadDatabase();
    const { id } = req.params;
    const index = db.transactions.findIndex((t: any) => t.id === id);
    if (index !== -1) {
      db.transactions[index] = { ...db.transactions[index], ...req.body };
      saveDatabase(db);
      res.json(db.transactions[index]);
    } else {
      res.status(404).json({ error: 'Transaction not found' });
    }
  });

  // 4. DELETE /api/transactions/:id - Delete transaction
  app.delete('/api/transactions/:id', (req, res) => {
    const db = loadDatabase();
    const { id } = req.params;
    db.transactions = db.transactions.filter((t: any) => t.id !== id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // 5. POST /api/transactions/:id/toggle - Toggle status
  app.post('/api/transactions/:id/toggle', (req, res) => {
    const db = loadDatabase();
    const { id } = req.params;
    const tx = db.transactions.find((t: any) => t.id === id);
    if (tx) {
      tx.status = tx.status === 'efetivado' ? 'provisionado' : 'efetivado';
      saveDatabase(db);
      res.json(tx);
    } else {
      res.status(404).json({ error: 'Transaction not found' });
    }
  });

  // 6. PUT /api/sheet-invoices - Update sheet reconciliation totals
  app.put('/api/sheet-invoices', (req, res) => {
    const db = loadDatabase();
    db.sheetInvoices = { ...(db.sheetInvoices || {}), ...req.body };
    saveDatabase(db);
    res.json(db.sheetInvoices);
  });

  // 7. POST /api/sheets/webhook - Endpoint designed for Google Apps Script Webhook
  app.post('/api/sheets/webhook', (req, res) => {
    const db = loadDatabase();
    const payload = req.body;

    // Check if it's an array of items or a single launch from Google Form/Sheet
    if (Array.isArray(payload)) {
      payload.forEach((item: any) => {
        if (item.description && item.amount) {
          db.transactions.unshift({
            id: `tx-sheet-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            createdAt: item.createdAt || new Date().toISOString(),
            date: item.date || new Date().toISOString().split('T')[0],
            monthRef: item.monthRef || (item.date ? item.date.substring(0, 7) : '2026-10'),
            description: item.description,
            type: item.type || 'despesa',
            group: item.group || 'Despesa Rotineira',
            category: item.category || 'Casa',
            subcategory: item.subcategory,
            amount: parseFloat(item.amount) || 0,
            paymentMethod: item.paymentMethod || 'PIX / Transferência',
            holder: item.holder || 'Família / Comum',
            status: item.status || 'efetivado',
            notes: item.notes || 'Importado via Google Sheets Webhook',
          });
        }
      });
    } else if (payload.description && payload.amount) {
      db.transactions.unshift({
        id: `tx-sheet-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: payload.createdAt || new Date().toISOString(),
        date: payload.date || new Date().toISOString().split('T')[0],
        monthRef: payload.monthRef || (payload.date ? payload.date.substring(0, 7) : '2026-10'),
        description: payload.description,
        type: payload.type || 'despesa',
        group: payload.group || 'Despesa Rotineira',
        category: payload.category || 'Casa',
        subcategory: payload.subcategory,
        amount: parseFloat(payload.amount) || 0,
        paymentMethod: payload.paymentMethod || 'PIX / Transferência',
        holder: payload.holder || 'Família / Comum',
        status: payload.status || 'efetivado',
        notes: payload.notes || 'Importado via Google Sheets Webhook',
      });
    }

    if (!db.googleSheetConfig) db.googleSheetConfig = {};
    db.googleSheetConfig.lastSyncTime = new Date().toISOString();
    saveDatabase(db);

    res.json({ success: true, count: db.transactions.length, lastSync: db.googleSheetConfig.lastSyncTime });
  });

  // 8. POST /api/reset - Reset to clean initial data
  app.post('/api/reset', (req, res) => {
    const initial: DatabaseShape = {
      transactions: [],
      bankAccounts: INITIAL_BANK_ACCOUNTS,
      creditCards: INITIAL_CREDIT_CARDS,
      sheetInvoices: {
        'card-bb-silvio': 0,
        'card-bb-janaina': 0,
        'card-inter-silvio': 0,
        'card-renner-janaina': 0,
      },
      googleSheetConfig: {
        sheetUrl: '',
        lastSyncTime: new Date().toISOString(),
      },
    };
    saveDatabase(initial);
    res.json(initial);
  });

  // Vite Integration (Dev or Prod)
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FinFamília server running on port ${PORT}`);
  });
}

startServer();
