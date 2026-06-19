// ======================================================================
// server.js — Main Express Server
// Youcef Boukhobza Portfolio & Service Request Platform
// ======================================================================

import express from 'express';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// ── Resolve __dirname for ES modules ──
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Environment defaults ──
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ── Firebase Admin Initialization ──
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './youcef-portfolio-firebase-adminsdk-fbsvc-5eb82197db.json';

try {
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('✅ Firebase Admin SDK initialized');
} catch (err) {
  console.warn('⚠️  Firebase Admin SDK not initialized — service account not found.');
  console.warn('   The app will run but auth endpoints will fail.');
  console.warn(`   Expected path: ${serviceAccountPath}`);
  // Initialize with default for static-only mode
  if (!admin.apps.length) {
    admin.initializeApp();
  }
}

// ── Create Express App ──
const app = express();

// ── Trust proxy (for Render.com / reverse proxies) ──
app.set('trust proxy', 1);

// ── Cookie Parser ──
app.use(cookieParser());

// ── Body Parser ──
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// ── Security Middleware ──
const { applySecurityMiddleware } = await import('./middleware/security.js');
applySecurityMiddleware(app);

// ── Static Files ──
app.use(express.static(join(__dirname, 'public'), {
  maxAge: NODE_ENV === 'production' ? '1d' : 0,
  etag: true,
}));

// ── API Routes ──
const authRoutes = (await import('./routes/auth.js')).default;
const serviceRoutes = (await import('./routes/service.js')).default;

app.use('/api', authRoutes);
app.use('/api', serviceRoutes);

// ── Health Check ──
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── SPA Fallback ──
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// ── Global Error Handler ──
app.use((err, _req, res, _next) => {
  console.error('❌ Unhandled error:', err.message);
  if (NODE_ENV === 'development') {
    console.error(err.stack);
  }
  res.status(err.status || 500).json({
    error: NODE_ENV === 'production'
      ? 'An internal server error occurred.'
      : err.message,
  });
});

// ── Start Server ──
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`   Environment: ${NODE_ENV}`);
  console.log(`   URL: http://localhost:${PORT}\n`);
});

export default app;
