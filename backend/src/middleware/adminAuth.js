import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'pawpawtrain-admin-secret-key-2024';
const ADMIN_TOKEN_EXPIRY = '4h'; // Admin token shorter expiry for security

// Default admin credentials (can be overridden via env vars)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
// Default password hash for 'Admin@PawPaw2024'
const DEFAULT_HASH = '$2a$10$LWud11DHOEb4x226SQuphOACbBU98MQwDHGi6ZPTk5U1W1n4tQIzC';

// Audit log storage (in-memory, persists to JSON)
let auditLogs = [];

/**
 * Admin authentication middleware - validates JWT token
 */
export function adminAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Admin authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    
    if (!decoded.isAdmin) {
      return res.status(403).json({ success: false, error: 'Admin privileges required' });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Admin session expired, please login again' });
    }
    return res.status(401).json({ success: false, error: 'Invalid admin token' });
  }
}

/**
 * Admin login handler
 */
export function adminLogin(req, res, adminPasswordHash) {
  const { username, password } = req.body;
  
  console.log('[AdminAuth] Login attempt - username:', username, 'password length:', password?.length, 'hasBody:', !!req.body);

  if (!username || !password) {
    console.log('[AdminAuth] Missing credentials');
    return res.status(400).json({ success: false, error: 'Username and password are required' });
  }

  if (username !== ADMIN_USERNAME) {
    console.log('[AdminAuth] Invalid username:', username, 'expected:', ADMIN_USERNAME);
    addAuditLog('LOGIN_FAILED', { username, reason: 'Invalid username' });
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  const hash = adminPasswordHash || DEFAULT_HASH;
  console.log('[AdminAuth] Using hash:', adminPasswordHash ? 'from env' : 'from DEFAULT');
  const isValid = bcrypt.compareSync(password, hash);
  console.log('[AdminAuth] Password valid:', isValid);

  if (!isValid) {
    addAuditLog('LOGIN_FAILED', { username, reason: 'Invalid password' });
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { username: ADMIN_USERNAME, isAdmin: true, role: 'superadmin' },
    ADMIN_JWT_SECRET,
    { expiresIn: ADMIN_TOKEN_EXPIRY }
  );

  addAuditLog('LOGIN_SUCCESS', { username });

  res.json({
    success: true,
    token,
    admin: { username: ADMIN_USERNAME, role: 'superadmin' },
    expiresIn: '4 hours'
  });
}

/**
 * Verify admin token validity
 */
export function adminVerify(req, res) {
  res.json({
    success: true,
    admin: req.admin,
    message: 'Token is valid'
  });
}

// ========== Audit Log ==========

export function addAuditLog(action, details = {}, performedBy = 'system') {
  const log = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    action,
    details,
    performedBy,
    timestamp: new Date().toISOString(),
    ip: details.ip || 'unknown'
  };
  auditLogs.push(log);
  // Keep only last 10000 logs
  if (auditLogs.length > 10000) {
    auditLogs = auditLogs.slice(-5000);
  }
  return log;
}

export function getAuditLogs(limit = 100, offset = 0) {
  const sorted = [...auditLogs].reverse();
  return sorted.slice(offset, offset + limit);
}

export function getAuditLogCount() {
  return auditLogs.length;
}

export function clearAuditLogs() {
  auditLogs = [];
}

/**
 * 获取内部审计日志数组引用（用于持久化同步）
 */
export function getRawAuditLogs() {
  return auditLogs;
}

/**
 * 从持久化数据恢复审计日志
 */
export function restoreAuditLogs(logs) {
  auditLogs = Array.isArray(logs) ? logs : [];
}

export { ADMIN_JWT_SECRET, ADMIN_TOKEN_EXPIRY, ADMIN_USERNAME };
