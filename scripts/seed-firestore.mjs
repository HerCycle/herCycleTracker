/**
 * Safe standalone Firestore seeding script for HerCycle Care Products.
 * 
 * Security & Design Notice:
 * - This script runs only in a trusted Node.js administrative environment.
 * - Normal client users cannot write to /products because firestore.rules disables client writes:
 *     match /products/{productId} {
 *       allow read: if true;
 *       allow write: if false;
 *     }
 * - This script uses firebase-admin (bypasses security rules with service account credentials).
 * 
 * Usage:
 * 1. Download your Firebase Admin SDK service account key from:
 *    Firebase Console -> Project Settings -> Service accounts -> Generate new private key
 * 2. Set the environment variable:
 *    $env:GOOGLE_APPLICATION_CREDENTIALS = "path/to/serviceAccountKey.json"  (PowerShell)
 *    export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json" (Bash)
 * 3. Run:
 *    node scripts/seed-firestore.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  const jsonPath = path.join(__dirname, 'seed-products.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('seed-products.json not found at:', jsonPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, 'utf8');
  const products = JSON.parse(raw);

  console.log(`Loaded ${products.length} products to seed into Firestore collection 'products'.`);

  // Try loading firebase-admin dynamically
  let admin;
  try {
    admin = await import('firebase-admin');
  } catch (e) {
    console.error('\n[Notice] firebase-admin package is required to execute server-side seeding.');
    console.error('Install it with: npm install --save-dev firebase-admin');
    console.error('Alternatively, use the Firebase Console or Firestore emulator to import scripts/seed-products.json directly.\n');
    process.exit(1);
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIRESTORE_EMULATOR_HOST) {
    console.warn('\n[Warning] GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.');
    console.warn('Set GOOGLE_APPLICATION_CREDENTIALS to the path of your Firebase service account JSON key file.\n');
  }

  admin.default.initializeApp({
    projectId: 'hercycle-d6918'
  });

  const db = admin.default.firestore();
  const batch = db.batch();

  for (const prod of products) {
    const docId = prod.id || `prod-${String(prod.displayOrder).padStart(2, '0')}`;
    const ref = db.collection('products').doc(docId);
    const { id, ...docData } = prod;
    batch.set(ref, docData, { merge: true });
    console.log(`Prepared product ${prod.displayOrder}: ${prod.name.substring(0, 45)}...`);
  }

  await batch.commit();
  console.log(`\nSuccessfully seeded ${products.length} products into Firestore!`);
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
