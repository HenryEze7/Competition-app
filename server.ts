import express from 'express';
import path from 'path';
import cors from 'cors';
import axios from 'axios';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { createServer as createViteServer } from 'vite';

// Ensure dotenv is loaded if running locally
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initialize Firebase Admin lazily
let db: any = null;
function getAdminDb() {
  if (!db) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Missing Firebase Admin credentials in environment variables.");
    }

    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey
        })
      });
    }
    db = getFirestore();
  }
  return db;
}

// API Route for Paystack verification
app.post('/api/verify-payment', async (req, res) => {
  const { reference, userId } = req.body;

  if (!reference || !userId) {
    return res.status(400).json({ error: 'Missing reference or userId' });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'PAYSTACK_SECRET_KEY is not configured on the server.' });
  }

  try {
    // 1. Verify payment with Paystack
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`
      }
    });

    const data = response.data;

    if (!data.status || data.data.status !== 'success') {
      return res.status(400).json({ error: 'Payment was not successful according to Paystack' });
    }

    // Amount is in kobo, convert to standard currency units (e.g. NGN)
    // Paystack usually sends amount * 100.
    const amountPaid = data.data.amount / 100;

    // 2. Update user balance in Firestore
    const firestore = getAdminDb();
    
    // Check if we've already processed this transaction to prevent double-crediting
    const transactionRef = firestore.collection('transactions').doc(reference);
    const transactionSnap = await transactionRef.get();
    
    if (transactionSnap.exists) {
      return res.status(400).json({ error: 'Transaction already processed' });
    }

    // Process using a batch to ensure atomicity
    const batch = firestore.batch();
    
    // Create transaction record
    batch.set(transactionRef, {
      reference,
      userId,
      amount: amountPaid,
      status: 'success',
      type: 'deposit',
      createdAt: FieldValue.serverTimestamp()
    });

    // Update user balance
    const userRef = firestore.collection('users').doc(userId);
    batch.update(userRef, {
      balance: FieldValue.increment(amountPaid)
    });

    await batch.commit();

    return res.json({ success: true, amount: amountPaid });
  } catch (error: any) {
    console.error('Error verifying payment:', error.response?.data || error.message);
    
    // If it's a firebase admin auth error, give a friendly message
    if (error.message?.includes('Missing Firebase Admin credentials')) {
       return res.status(500).json({ error: 'Server configuration error: Firebase Admin credentials not set up.' });
    }

    res.status(500).json({ error: 'Failed to verify payment or update balance.' });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
