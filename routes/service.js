// ======================================================================
// routes/service.js — Service Request Routes
// Protected by session cookie verification, stored in Firestore
// ======================================================================

import { Router } from 'express';
import admin from 'firebase-admin';
import { body, validationResult } from 'express-validator';
import { csrfProtection } from '../middleware/security.js';

const router = Router();

// ── Firestore reference ──
const db = admin.firestore();

/**
 * Middleware: Verify Session Cookie
 * Ensures the user has a valid, non-revoked session.
 */
async function requireAuth(req, res, next) {
  const sessionCookie = req.cookies?.__session || '';

  if (!sessionCookie) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  try {
    const decoded = await admin.auth().verifySessionCookie(sessionCookie, true);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Session verification failed:', err.code || err.message);
    res.clearCookie('__session', { path: '/' });
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}

/**
 * Escape HTML entities to prevent XSS when data is later rendered.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Validate filename: only allow alphanumeric, dash, underscore, dot.
 * No path traversal, no special chars.
 */
function isSafeFilename(name) {
  if (typeof name !== 'string') return false;
  return /^[a-zA-Z0-9_\-][a-zA-Z0-9_\-. ]{0,98}[a-zA-Z0-9_\-.]$/.test(name) && !name.includes('..');
}

/**
 * POST /api/service-request
 * Protected endpoint — requires authenticated session.
 * Validates, sanitizes, and stores the service request in Firestore.
 */
router.post(
  '/service-request',
  csrfProtection,
  requireAuth,
  [
    body('fullName')
      .isString()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be 2-100 characters.')
      .escape(),

    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('A valid email address is required.'),

    body('phone')
      .optional({ checkFalsy: true })
      .isString()
      .trim()
      .matches(/^\+?[0-9\s\-()]{7,20}$/)
      .withMessage('Invalid phone number format.'),

    body('serviceType')
      .isString()
      .trim()
      .isIn([
        'Web Development',
        'AI/ML Solution',
        'Cybersecurity Audit',
        'Custom Software',
        'Other',
      ])
      .withMessage('Invalid service type selected.'),

    body('budgetRange')
      .isString()
      .trim()
      .isIn([
        'Under $500',
        '$500 - $1,000',
        '$1,000 - $5,000',
        '$5,000 - $10,000',
        '$10,000+',
        'Discuss Later',
      ])
      .withMessage('Invalid budget range selected.'),

    body('description')
      .isString()
      .trim()
      .isLength({ min: 20, max: 5000 })
      .withMessage('Project description must be 20-5000 characters.')
      .escape(),

    body('fileNames')
      .optional()
      .isArray({ max: 3 })
      .withMessage('Maximum 3 file names allowed.'),

    body('fileNames.*')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('File name too long.'),
  ],
  async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed.',
        details: errors.array().map((e) => ({
          field: e.path,
          message: e.msg,
        })),
      });
    }

    const { fullName, email, phone, serviceType, budgetRange, description, fileNames } = req.body;

    // Additional filename safety check
    const sanitizedFileNames = [];
    if (Array.isArray(fileNames)) {
      for (const name of fileNames.slice(0, 3)) {
        if (typeof name === 'string' && name.trim()) {
          const trimmed = name.trim();
          if (isSafeFilename(trimmed)) {
            sanitizedFileNames.push(escapeHtml(trimmed));
          } else {
            return res.status(400).json({
              error: `Invalid file name: "${escapeHtml(trimmed)}". Use only letters, numbers, dashes, underscores, and dots.`,
            });
          }
        }
      }
    }

    try {
      // Prepare the document
      const serviceRequest = {
        fullName: escapeHtml(fullName),
        email,
        phone: phone ? escapeHtml(phone) : null,
        serviceType,
        budgetRange,
        description: escapeHtml(description),
        fileNames: sanitizedFileNames,
        // Authenticated user metadata
        userId: req.user.uid,
        userEmail: req.user.email || null,
        authProvider: req.user.firebase?.sign_in_provider || 'unknown',
        // Timestamps and metadata
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'pending',
        ipAddress: req.ip,
      };

      // Store in Firestore
      const docRef = await db.collection('serviceRequests').add(serviceRequest);

      console.log(`📋 New service request: ${docRef.id} from ${email}`);

      res.status(201).json({
        success: true,
        message: 'Service request submitted successfully!',
        requestId: docRef.id,
      });
    } catch (err) {
      console.error('Failed to store service request:', err.message);
      res.status(500).json({ error: 'Failed to submit request. Please try again later.' });
    }
  }
);

export default router;
