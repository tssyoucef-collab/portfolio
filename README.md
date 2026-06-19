# Youcef Boukhobza — Portfolio & Service Request Platform

> **Backend & AI Engineer | Cybersecurity Professional**
> El Bayadh, Algeria

A production-ready portfolio and secure service request platform built with Node.js, Express, Firebase Auth, and Firestore. Features a stunning glassmorphic UI with animated 3D canvas background, GSAP animations, and a multi-step authenticated service request flow.

---

## 🚀 Features

- **Animated Canvas Background** — 3D wireframe grid + particles reacting to mouse and scroll
- **Glassmorphism UI** — Frosted glass cards, buttons, and modals
- **Splash Screen** — Typewriter tagline effect with choice of Portfolio or Service Request
- **Portfolio Section** — Projects with filter tabs, testimonials carousel, animated skill bars/circles
- **Secure Service Request** — Firebase Auth (Google/GitHub/Facebook/Email) → Session cookie → Multi-step form → Firestore
- **Production Security** — Helmet CSP, CORS, rate limiting, CSRF protection, input validation, XSS prevention

---

## 📁 Project Structure

```
portfilo/
├── public/
│   └── index.html          # Single-file frontend (HTML + CSS + JS)
├── middleware/
│   └── security.js         # Helmet, CORS, rate limiting, CSRF
├── routes/
│   ├── auth.js             # Firebase token → session cookie
│   └── service.js          # Protected service request endpoint
├── server.js               # Express server entry point
├── package.json
├── .env.example            # Environment variable template
├── .gitignore
└── README.md
```

---

## ⚙️ Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable **Authentication** and activate the sign-in methods you want:
   - Google
   - GitHub (requires GitHub OAuth app setup)
   - Facebook (requires Facebook App setup)
   - Email/Password
4. Go to **Project Settings → General → Your Apps → Web App**
5. Register a web app and copy the `firebaseConfig` object

### 2. Generate a Service Account Key

1. In Firebase Console → **Project Settings → Service Accounts**
2. Click **"Generate new private key"**
3. Save the JSON file as `serviceAccountKey.json` in the project root
4. ⚠️ **Never commit this file to Git** (it's in `.gitignore`)

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```env
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-app.onrender.com
SESSION_SECRET=<generate with: openssl rand -hex 32>
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

### 4. Update Firebase Config in Frontend

Open `public/index.html` and replace the `firebaseConfig` object (search for `YOUR_FIREBASE_API_KEY`) with your actual Firebase web app config values.

### 5. Install Dependencies & Run

```bash
npm install
npm start
```

Visit `http://localhost:3000`

---

## 🌐 Deploy to Render.com

1. Push your code to a **GitHub repository**
2. Go to [Render Dashboard](https://dashboard.render.com/) → **New → Web Service**
3. Connect your GitHub repo

### Build & Start Commands

| Setting       | Value             |
|---------------|-------------------|
| Build Command | `npm install`     |
| Start Command | `node server.js`  |
| Environment   | `Node`            |

### Environment Variables on Render

Add these in the Render dashboard → Environment tab:

| Variable                         | Value                                    |
|----------------------------------|------------------------------------------|
| `NODE_ENV`                       | `production`                             |
| `FRONTEND_URL`                   | `https://your-app.onrender.com`          |
| `SESSION_SECRET`                 | `<your-generated-secret>`                |
| `FIREBASE_SERVICE_ACCOUNT_PATH`  | `./serviceAccountKey.json`               |

> **Important:** For the service account, either:
> - Include `serviceAccountKey.json` in your deploy (Render private repo), **or**
> - Use Render's **Secret Files** feature to upload it securely

### Firebase Auth Domain

In Firebase Console → Authentication → Settings → Authorized domains, add your Render URL:
```
your-app.onrender.com
```

---

## 🔒 Security Features

| Feature                   | Implementation                                          |
|---------------------------|---------------------------------------------------------|
| XSS Prevention            | HTML escaping, `textContent` usage, CSP headers         |
| CSRF Protection            | `SameSite=Strict` cookies + `X-Requested-With` header   |
| Session Management         | Firebase Admin `createSessionCookie()`, httpOnly cookies |
| Rate Limiting              | 30 req/min general, 5 req/min for service submissions    |
| Input Validation           | `express-validator` on all endpoints                     |
| Content Security Policy    | Strict CSP via Helmet, allowlisting only needed CDNs     |
| Hidden Server Identity     | `X-Powered-By` disabled                                 |
| Filename Sanitization      | Regex validation, path traversal prevention              |

---

## 📬 Contact

- **Email:** boukhobzayoucef7@gmail.com
- **Phone:** +213 562825570
- **GitHub:** [tssyoucef-collab](https://github.com/tssyoucef-collab)
- **Location:** El Bayadh, Algeria

---

## 📄 License

MIT © 2026 Youcef Boukhobza
