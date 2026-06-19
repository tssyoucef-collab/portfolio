// ======================================================================
// middleware/security.js — Security Middleware Stack
// Helmet CSP, CORS, Rate Limiting, CSRF Protection
// ======================================================================

import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

/**
 * Applies all security middleware to the Express app.
 * @param {import('express').Express} app
 */
export function applySecurityMiddleware(app) {
  // ── Hide X-Powered-By ──
  app.disable('x-powered-by');

  // ── Helmet with strict CSP ──
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://cdn.jsdelivr.net",
            "https://cdnjs.cloudflare.com",
            "https://www.gstatic.com",
            "https://apis.google.com",
            "https://*.firebaseapp.com",
            "https://*.firebaseio.com",
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
            "https://cdnjs.cloudflare.com",
          ],
          fontSrc: [
            "'self'",
            "https://fonts.gstatic.com",
            "https://cdnjs.cloudflare.com",
          ],
          imgSrc: [
            "'self'",
            "data:",
            "blob:",
            "https://picsum.photos",
            "https://fastly.picsum.photos",
            "https://i.picsum.photos",
            "https://*.googleusercontent.com",
            "https://lh3.googleusercontent.com",
          ],
          connectSrc: [
            "'self'",
            "https://*.googleapis.com",
            "https://*.firebaseio.com",
            "https://*.firebaseapp.com",
            "https://identitytoolkit.googleapis.com",
            "https://securetoken.googleapis.com",
            "https://www.googleapis.com",
            "https://firestore.googleapis.com",
            "wss://*.firebaseio.com",
          ],
          frameSrc: [
            "'self'",
            "https://*.firebaseapp.com",
            "https://*.firebaseio.com",
            "https://accounts.google.com",
            "https://www.facebook.com",
            "https://github.com",
          ],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    })
  );

  // ── CORS ──
  const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5000']
    : ['http://localhost:3000', 'http://localhost:5000'];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, same-origin)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // ── General Rate Limiting: 30 requests per minute ──
  const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
    keyGenerator: (req) => req.ip,
  });
  app.use('/api', generalLimiter);

  // ── Strict Rate Limiting for Service Submissions: 5 per minute per IP ──
  const serviceLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many service requests. Please wait before submitting again.' },
    keyGenerator: (req) => req.ip,
  });
  app.use('/api/service-request', serviceLimiter);
}

/**
 * CSRF Protection middleware.
 * Checks for the X-Requested-With header on state-changing requests.
 * Combined with SameSite=Strict cookies, this prevents CSRF attacks.
 */
export function csrfProtection(req, res, next) {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    const xRequestedWith = req.headers['x-requested-with'];
    if (xRequestedWith !== 'XMLHttpRequest') {
      return res.status(403).json({ error: 'Forbidden: Missing CSRF header.' });
    }
  }
  next();
}
