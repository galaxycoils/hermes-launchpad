import { json, err } from '../worker.js';

const now = () => Math.floor(Date.now() / 1000);

function validUserId(id: string) {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{3,128}$/.test(id);
}

// ---- Sessions ----
export async function handleGetSessions(db: any, userId: string) {
  if (!validUserId(userId)) return err('invalid user_id', 400);
  const { results } = await db.prepare(
    'SELECT id, user_id, wallet, created_at, expires_at, revoked FROM sessions WHERE user_id = ? AND revoked = 0 ORDER BY created_at DESC'
  ).bind(userId).all();
  return json({ sessions: results });
}

export async function handleRevokeSession(db: any, userId: string, sessionId: string) {
  if (!validUserId(userId)) return err('invalid user_id', 400);
  const result = await db.prepare(
    'UPDATE sessions SET revoked = 1 WHERE id = ? AND user_id = ?'
  ).bind(sessionId, userId).run();
  if (result.meta.changes === 0) return err('session not found', 404);
  return json({ ok: true });
}

export async function handleRevokeAllSessions(db: any, userId: string) {
  if (!validUserId(userId)) return err('invalid user_id', 400);
  await db.prepare(
    'UPDATE sessions SET revoked = 1 WHERE user_id = ?'
  ).bind(userId).run();
  return json({ ok: true });
}

// ---- API Keys ----
export async function handleGetApiKeys(db: any, userId: string) {
  if (!validUserId(userId)) return err('invalid user_id', 400);
  const { results } = await db.prepare(
    'SELECT id, name, scopes, created_at, expires_at, revoked FROM api_keys WHERE user_id = ? AND revoked = 0 ORDER BY created_at DESC'
  ).bind(userId).all();
  return json({ apiKeys: results });
}

export async function handleCreateApiKey(db: any, userId: string, body: any) {
  if (!validUserId(userId)) return err('invalid user_id', 400);
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 64) : 'Default';
  const scopes = typeof body.scopes === 'string' ? body.scopes.trim().slice(0, 256) : 'read';
  const id = crypto.randomUUID();
  const key = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const keyHash = await sha256(key);
  const expiresAt = now() + 90 * 86400; // 90 days
  await db.prepare(
    'INSERT INTO api_keys (id, user_id, key_hash, name, scopes, created_at, expires_at, revoked) VALUES (?, ?, ?, ?, ?, ?, ?, 0)'
  ).bind(id, userId, keyHash, name, scopes, now(), expiresAt).run();
  return json({ ok: true, id, key, name, scopes }, 201);
}

export async function handleRevokeApiKey(db: any, userId: string, keyId: string) {
  if (!validUserId(userId)) return err('invalid user_id', 400);
  const result = await db.prepare(
    'UPDATE api_keys SET revoked = 1 WHERE id = ? AND user_id = ?'
  ).bind(keyId, userId).run();
  if (result.meta.changes === 0) return err('API key not found', 404);
  return json({ ok: true });
}

// ---- Notification Preferences ----
export async function handleGetNotificationPrefs(db: any, userId: string) {
  if (!validUserId(userId)) return err('invalid user_id', 400);
  const row = await db.prepare(
    'SELECT * FROM notification_prefs WHERE user_id = ?'
  ).bind(userId).first();
  if (!row) {
    return json({
      pushEnabled: false,
      emailEnabled: false,
      inAppEnabled: true,
      tradeConfirmed: true,
      questComplete: true,
      graduation: true,
      referralSignup: true,
    });
  }
  return json({
    pushEnabled: Boolean(row.push_enabled),
    emailEnabled: Boolean(row.email_enabled),
    inAppEnabled: Boolean(row.in_app_enabled),
    tradeConfirmed: Boolean(row.trade_confirmed),
    questComplete: Boolean(row.quest_complete),
    graduation: Boolean(row.graduation),
    referralSignup: Boolean(row.referral_signup),
    updatedAt: row.updated_at,
  });
}

export async function handleUpdateNotificationPrefs(db: any, userId: string, body: any) {
  if (!validUserId(userId)) return err('invalid user_id', 400);
  const fields: string[] = [];
  const values: any[] = [];
  const mappings: Record<string, string> = {
    pushEnabled: 'push_enabled',
    emailEnabled: 'email_enabled',
    inAppEnabled: 'in_app_enabled',
    tradeConfirmed: 'trade_confirmed',
    questComplete: 'quest_complete',
    graduation: 'graduation',
    referralSignup: 'referral_signup',
  };
  for (const [key, col] of Object.entries(mappings)) {
    if (body[key] !== undefined) {
      fields.push(`${col} = ?`);
      values.push(body[key] ? 1 : 0);
    }
  }
  if (fields.length === 0) return err('no valid fields to update', 400);
  fields.push('updated_at = ?');
  values.push(now());
  values.push(userId);
  await db.prepare(
    `INSERT INTO notification_prefs (user_id, ${fields.map(f => f.split(' = ')[0]).join(', ')}, updated_at)
     VALUES (?, ${fields.map(() => '?').join(', ')}, ?)
     ON CONFLICT(user_id) DO UPDATE SET ${fields.join(', ')}`
  ).bind(userId, ...values, now()).run();
  return json({ ok: true });
}

// ---- Account Deletion ----
export async function handleDeleteAccount(db: any, userId: string) {
  if (!validUserId(userId)) return err('invalid user_id', 400);
  // Revoke all sessions
  await db.prepare('UPDATE sessions SET revoked = 1 WHERE user_id = ?').bind(userId).run();
  // Revoke all API keys
  await db.prepare('UPDATE api_keys SET revoked = 1 WHERE user_id = ?').bind(userId).run();
  // Anonymize profile (keep trade history)
  await db.prepare('UPDATE profiles SET wallet = ?, ref_code = NULL, referred_by = NULL WHERE wallet = ?')
    .bind(`deleted_${userId.slice(0, 8)}`, userId).run();
  // Delete notification prefs
  await db.prepare('DELETE FROM notification_prefs WHERE user_id = ?').bind(userId).run();
  return json({ ok: true, message: 'Account deleted. Trades preserved.' });
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
