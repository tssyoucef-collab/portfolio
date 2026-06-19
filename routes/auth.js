// ======================================================================
// routes/auth.js — Authentication Routes
// Firebase ID Token → Session Cookie Exchange
// ======================================================================

import { Router } from 'express';
import admin from 'firebase-admin';
import { body, validationResult } from 'express-validator';
import { csrfProtection } from '../middleware/security.js';

const router = Router();

// Session cookie max age: 5 days (default) or from env
const SESSION_MAX_AGE = parseInt(process.env.SESSION_MAX_AGE, 10) || 5 * 24 * 60 * 60 * 1000;

/**
 * POST /api/verify-token
 * Receives a Firebase ID token from the client,
 * verifies it, and creates a secure session cookie.
 */
router.post(
  '/verify-token',
  csrfProtection,
  [
    body('idToken')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('ID token is required.')
      .isLength({ min: 100, max: 5000 })
      .withMessage('Invalid token format.'),
  ],
  async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed.',
        details: errors.array().map((e) => e.msg),
      });
    }

    const { idToken } = req.body;

    try {
      // Verify the ID token first (check revocation)
      const decodedToken = await admin.auth().verifyIdToken(idToken, true);

      // Only allow tokens that were issued recently (within 5 minutes)
      const tokenAge = Date.now() / 1000 - decodedToken.auth_time;
      if (tokenAge > 5 * 60) {
        return res.status(401).json({ error: 'Token too old. Please re-authenticate.' });
      }

      // Create a session cookie
      const sessionCookie = await admin.auth().createSessionCookie(idToken, {
        expiresIn: SESSION_MAX_AGE,
      });

      // Set the session cookie
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('__session', sessionCookie, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: SESSION_MAX_AGE,
        path: '/',
      });

      res.json({
        success: true,
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email || null,
          name: decodedToken.name || null,
          picture: decodedToken.picture || null,
        },
      });
    } catch (err) {
      console.error('Token verification failed:', err.code || err.message);

      // Map Firebase error codes to user-friendly messages
      const errorMessages = {
        'auth/id-token-expired': 'Session expired. Please sign in again.',
        'auth/id-token-revoked': 'Session revoked. Please sign in again.',
        'auth/argument-error': 'Invalid authentication token.',
      };

      const message = errorMessages[err.code] || 'Authentication failed.';
      res.status(401).json({ error: message });
    }
  }
);

/**
 * POST /api/logout
 * Clears the session cookie.
 */
router.post('/logout', csrfProtection, async (req, res) => {
  const sessionCookie = req.cookies?.__session || '';

  // Clear the cookie first
  res.clearCookie('__session', { path: '/' });

  if (sessionCookie) {
    try {
      // Verify and revoke the session
      const decoded = await admin.auth().verifySessionCookie(sessionCookie);
      await admin.auth().revokeRefreshTokens(decoded.uid);
    } catch (err) {
      // Cookie was invalid — still clear it, no error to client
      console.warn('Logout: session cookie invalid or already expired.');
    }
  }

  res.json({ success: true, message: 'Logged out successfully.' });
});

/**
 * GET /api/session-status
 * Checks if the current session cookie is valid.
 */
router.get('/session-status', async (req, res) => {
  const sessionCookie = req.cookies?.__session || '';

  if (!sessionCookie) {
    return res.json({ authenticated: false });
  }

  try {
    const decoded = await admin.auth().verifySessionCookie(sessionCookie, true);
    res.json({
      authenticated: true,
      user: {
        uid: decoded.uid,
        email: decoded.email || null,
        name: decoded.name || null,
        picture: decoded.picture || null,
      },
    });
  } catch (err) {
    res.clearCookie('__session', { path: '/' });
    res.json({ authenticated: false });
  }
});

export default router;
