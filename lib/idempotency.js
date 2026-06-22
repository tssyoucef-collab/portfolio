// ======================================================================
// lib/idempotency.js — Idempotency key management (7-day TTL)
// ======================================================================

import admin from 'firebase-admin';
const db = admin.firestore();
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function checkIdempotency(key) {
  try {
    const doc = await db.collection('idempotencyKeys').doc(key).get();
    if (doc.exists) {
      const data = doc.data();
      if (data.createdAt) {
        const age = Date.now() - data.createdAt.toMillis();
        if (age > TTL_MS) {
          await doc.ref.delete();
          return { exists: false };
        }
      }
      return { exists: true, result: data.result };
    }
    return { exists: false };
  } catch (_) {
    return { exists: false };
  }
}

export async function storeIdempotency(key, result) {
  try {
    await db.collection('idempotencyKeys').doc(key).set({
      result,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (_) {}
}