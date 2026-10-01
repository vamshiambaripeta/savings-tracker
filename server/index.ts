import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://priyamshi.onrender.com'
  ]
}));

app.use(express.json());

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine whether to use Render's Secret File path or local file path
const renderSecretPath = '/etc/secrets/credentials.json';
const localSecretPath = path.join(__dirname, 'credentials.json');

const keyFilePath = fs.existsSync(renderSecretPath)
  ? renderSecretPath
  : localSecretPath;

const auth = new google.auth.GoogleAuth({
  keyFile: keyFilePath,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });

// GET: fetch savings rows (Columns A:N)
// Note: When a new column is added, this needs updating
app.get('/api/savings', async (req: Request, res: Response) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Numbers!A:N'
    });

    const rows = response.data.values || [];
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: fetch Roth IRA rows (Columns O:U)
// Note: When a new column is added, this needs updating
app.get('/api/roth', async (req: Request, res: Response) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Numbers!A:U', // Extended to include Column A for month labels
    });

    const rows = response.data.values || [];
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: fetch Net Worth data (Columns A:AA)
// Note: When a new column is added, this needs updating
app.get('/api/net-worth', async (req: Request, res: Response) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Numbers!A:AB', // Extended to include Column A for month/year labels and Net Worth data
    });

    const rows = response.data.values || [];
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST: Add a new entry to google sheets
app.post('/api/savings', async (req: Request, res: Response) => {
  const { date, category, amount, notes } = req.body;

  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[date, category, amount, notes]]
      }
    });

    res.json({ success: true, updatedRange: response.data.updates?.updatedRange });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server running on http://localhost:${PORT}`));