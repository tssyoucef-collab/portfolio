// ======================================================================
// lib/auditLog.js — Audit logging to Firestore
// ======================================================================

import admin from 'firebase-admin';
const db = admin.firestore();

export async function logAuditEvent({
  eventType,
  userId = 'anonymous',
  email = null,
  ip = 'unknown',
  userAgent = 'unknown',
  metadata = {},
}) {
  try {
    let maskedEmail = email;
    if (email && typeof email === 'string' && email.includes('@')) {
      const [local, domain] = email.split('@');
      const maskedLocal = local.length > 2
        ? local[0] + '****' + local.slice(-1)
        : '****';
      maskedEmail = `${maskedLocal}@${domain}`;
    }

    await db.collection('auditLogs').add({
      eventType,
      userId,
      email: maskedEmail,
      ip,
      userAgent,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: metadata || {},
    });
  } catch (err) {
    console.error('⚠️ Audit log failed:', err.message);
  }
}