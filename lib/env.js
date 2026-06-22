// ======================================================================
// lib/env.js — Environment Validation
// ======================================================================

import { readFileSync } from 'fs';

export function validateEnv() {
  const required = [
    'FIREBASE_SERVICE_ACCOUNT_PATH',
    'SESSION_SECRET',
    'FRONTEND_URL',
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(
      `❌ Missing required env vars:\n  ${missing.join('\n  ')}\n` +
      'Please set them in .env or Render environment variables.'
    );
  }

  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  try {
    readFileSync(path, 'utf8');
  } catch (_) {
    throw new Error(`❌ Firebase service account file not found at: ${path}`);
  }

  if (process.env.SESSION_SECRET.length < 32) {
    console.warn(
      '⚠️  SESSION_SECRET is too short. Generate: openssl rand -hex 32'
    );
  }

  console.log('✅ Environment validated successfully.');
}