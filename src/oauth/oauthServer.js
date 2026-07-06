// Task 7.1: Investigate & implement OAuth 2.0 concepts for secure API auth.
//
// This is a real, working OAuth 2.0 "Authorization Code Grant" flow —
// the same flow used by "Sign in with Google/GitHub" buttons — implemented
// end-to-end (authorization server + token endpoint + protected resource)
// so the whole handshake can be demonstrated without depending on a
// third-party OAuth provider or registered app.
//
// Flow:
//  1. Client sends user to  GET /oauth/authorize?client_id=...&redirect_uri=...&state=...
//  2. User logs in + approves  ->  POST /oauth/authorize/confirm
//  3. Server redirects back to redirect_uri with a short-lived ?code=...
//  4. Client exchanges the code for an access token -> POST /oauth/token
//  5. Client calls a protected resource with "Authorization: Bearer <token>"

const express = require('express');
const bcrypt = require('bcryptjs');
const { randomUUID, randomBytes } = require('crypto');
const AppError = require('../utils/AppError');
const { asyncHandler } = require('../middleware/errorHandler');

function createOAuthRouter(db) {
  const router = express.Router();

  // Pre-registered demo OAuth client (in a real system this would be
  // created via a "developer portal" and stored in the database)
  const CLIENTS = {
    'demo-client': {
      clientId: 'demo-client',
      clientSecret: 'demo-client-secret',
      redirectUris: ['http://localhost:3000/oauth/callback'],
      name: 'Demo Third-Party App',
    },
  };

  const authCodes = new Map(); // code -> { userId, clientId, redirectUri, expiresAt }
  const accessTokens = new Map(); // token -> { userId, clientId, expiresAt }

  // Step 1: Show consent/login screen
  router.get('/oauth/authorize', (req, res) => {
    const { client_id, redirect_uri, state } = req.query;
    const client = CLIENTS[client_id];
    if (!client) return res.status(400).send('Unknown client_id');
    if (!client.redirectUris.includes(redirect_uri)) {
      return res.status(400).send('Invalid redirect_uri for this client');
    }

    res.send(`
      <html><body style="font-family:sans-serif;max-width:400px;margin:60px auto;">
        <h2>🔐 Authorize "${client.name}"</h2>
        <p>This app is requesting access to your account items.</p>
        <form method="POST" action="/oauth/authorize/confirm">
          <input type="hidden" name="client_id" value="${client_id}">
          <input type="hidden" name="redirect_uri" value="${redirect_uri}">
          <input type="hidden" name="state" value="${state || ''}">
          <input name="username" placeholder="Username" style="width:100%;padding:8px;margin:6px 0;" required>
          <input name="password" type="password" placeholder="Password" style="width:100%;padding:8px;margin:6px 0;" required>
          <button type="submit" style="width:100%;padding:10px;background:#22c55e;color:white;border:none;border-radius:6px;">Approve Access</button>
        </form>
      </body></html>
    `);
  });

  // Step 2: User approves -> validate credentials -> issue auth code -> redirect
  router.post('/oauth/authorize/confirm', express.urlencoded({ extended: true }), asyncHandler(async (req, res) => {
    const { client_id, redirect_uri, state, username, password } = req.body;
    const client = CLIENTS[client_id];
    if (!client) throw new AppError('Unknown client_id', 400);

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      throw new AppError('Invalid username or password', 401);
    }

    const code = randomBytes(16).toString('hex');
    authCodes.set(code, {
      userId: user.id,
      clientId: client_id,
      redirectUri: redirect_uri,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 min
    });

    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set('code', code);
    if (state) redirectUrl.searchParams.set('state', state);
    res.redirect(redirectUrl.toString());
  }));

  // Step 3: Exchange authorization code for an access token
  router.post('/oauth/token', asyncHandler(async (req, res) => {
    const { grant_type, code, client_id, client_secret, redirect_uri } = req.body;

    if (grant_type !== 'authorization_code') {
      throw new AppError('Unsupported grant_type', 400);
    }
    const client = CLIENTS[client_id];
    if (!client || client.clientSecret !== client_secret) {
      throw new AppError('Invalid client credentials', 401);
    }

    const codeEntry = authCodes.get(code);
    if (!codeEntry || codeEntry.expiresAt < Date.now()) {
      throw new AppError('Invalid or expired authorization code', 400);
    }
    if (codeEntry.clientId !== client_id || codeEntry.redirectUri !== redirect_uri) {
      throw new AppError('Authorization code does not match client/redirect_uri', 400);
    }

    authCodes.delete(code); // codes are single-use

    const accessToken = randomUUID() + randomUUID();
    accessTokens.set(accessToken, {
      userId: codeEntry.userId,
      clientId: client_id,
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
    });
  }));

  // Middleware to protect resources using an OAuth access token
  function requireOAuthToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'OAuth access token required' });

    const entry = accessTokens.get(token);
    if (!entry || entry.expiresAt < Date.now()) {
      return res.status(401).json({ error: 'Invalid or expired access token' });
    }
    req.oauthUserId = entry.userId;
    next();
  }

  // Step 4: Example protected resource, accessible only with a valid OAuth token
  router.get('/api/oauth/profile', requireOAuthToken, (req, res) => {
    const user = db.prepare('SELECT id, username, created_at FROM users WHERE id = ?').get(req.oauthUserId);
    res.json({ message: 'Accessed via OAuth 2.0 access token', user });
  });

  // Simple callback page so the demo flow has somewhere to land
  router.get('/oauth/callback', (req, res) => {
    res.send(`
      <html><body style="font-family:sans-serif;max-width:500px;margin:60px auto;">
        <h2>✅ Authorization Code Received</h2>
        <p>code = <code>${req.query.code || ''}</code></p>
        <p>state = <code>${req.query.state || ''}</code></p>
        <p>Exchange this code at <code>POST /oauth/token</code> for an access token.</p>
      </body></html>
    `);
  });

  return router;
}

module.exports = createOAuthRouter;
