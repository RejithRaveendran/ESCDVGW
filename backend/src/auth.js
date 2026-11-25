import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { one } from './db/index.js';

export const COOKIE = 'esc_session';
export const STAFF_ROLES = ['consultant', 'certification_manager', 'admin'];
export const MANAGER_ROLES = ['certification_manager', 'admin'];

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const isStaff = (u) => STAFF_ROLES.includes(u.role);
export const isManager = (u) => MANAGER_ROLES.includes(u.role);

const cookieOpts = () => ({
  httpOnly: true,
  sameSite: 'strict',
  secure: config.isProd,
  path: '/',
});

export function issueSession(res, user) {
  const token = jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtTtl });
  res.cookie(COOKIE, token, { ...cookieOpts(), maxAge: 8 * 60 * 60 * 1000 });
}

export function clearSession(res) {
  res.clearCookie(COOKIE, cookieOpts());
}

// Constant-time-ish failure path: compare against a dummy hash when the user doesn't exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

export async function verifyLogin(email, password) {
  const user = await one(
    `SELECT u.id, u.name, u.email, u.role, u.designation, u.organization_id, u.password_hash, u.active, o.name AS organization_name
       FROM users u LEFT JOIN organizations o ON o.id = u.organization_id
      WHERE u.email = $1`,
    [email.toLowerCase().trim()],
  );
  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok || !user.active) return null;
  delete user.password_hash;
  return user;
}

/** Populates req.user from the session cookie, or rejects with 401. */
export async function requireAuth(req, _res, next) {
  try {
    const token = req.cookies?.[COOKIE];
    if (!token) throw new HttpError(401, 'Not signed in');
    let payload;
    try {
      payload = jwt.verify(token, config.jwtSecret);
    } catch {
      throw new HttpError(401, 'Session expired');
    }
    const user = await one(
      `SELECT u.id, u.name, u.email, u.role, u.designation, u.organization_id, u.active, o.name AS organization_name
         FROM users u LEFT JOIN organizations o ON o.id = u.organization_id WHERE u.id = $1`,
      [payload.sub],
    );
    if (!user || !user.active) throw new HttpError(401, 'Account not available');
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}

export const requireRole =
  (...roles) =>
  (req, _res, next) =>
    roles.includes(req.user?.role) ? next() : next(new HttpError(403, 'You do not have permission for this action'));

/**
 * Loads a project the current user may access, or throws 404.
 * - manufacturer: own organisation only
 * - consultant: projects assigned to them
 * - certification_manager / admin: all projects
 */
export async function loadProjectFor(user, projectId) {
  const id = Number(projectId);
  if (!Number.isInteger(id)) throw new HttpError(404, 'Project not found');
  const p = await one(
    `SELECT p.*, o.name AS organization_name,
            c.name AS consultant_name, c.email AS consultant_email,
            m.name AS manager_name
       FROM projects p
       JOIN organizations o ON o.id = p.organization_id
       LEFT JOIN users c ON c.id = p.consultant_id
       LEFT JOIN users m ON m.id = p.manager_id
      WHERE p.id = $1`,
    [id],
  );
  if (!p) throw new HttpError(404, 'Project not found');
  const allowed =
    isManager(user) ||
    (user.role === 'consultant' && p.consultant_id === user.id) ||
    (user.role === 'manufacturer' && p.organization_id === user.organization_id);
  if (!allowed) throw new HttpError(404, 'Project not found');
  return p;
}

/** Staff who may change a project: its consultant, managers, admins. */
export function assertCanManage(user, project) {
  if (isManager(user) || (user.role === 'consultant' && project.consultant_id === user.id)) return;
  throw new HttpError(403, 'Only ESC staff assigned to this project can do this');
}

/** SQL fragment + params restricting projects (alias p) to what the user may see. */
export function projectScope(user, startIndex = 1) {
  if (isManager(user)) return { where: 'TRUE', params: [] };
  if (user.role === 'consultant') return { where: `p.consultant_id = $${startIndex}`, params: [user.id] };
  return { where: `p.organization_id = $${startIndex}`, params: [user.organization_id ?? -1] };
}
