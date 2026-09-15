/**
 * Security Sanitization & Storage Integrity Utility
 * Prevents Cross-Site Scripting (XSS), script injection, and corrupted storage states.
 */

import { UserProfile } from '../types';

/**
 * Strips HTML tags, script blocks, dangerous attributes, and javascript: protocols.
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags & content
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // Remove style tags & content
    .replace(/<[^>]+>/g, '')                                            // Strip remaining HTML tags
    .replace(/javascript:/gi, '')                                       // Remove javascript: URI
    .replace(/vbscript:/gi, '')                                         // Remove vbscript: URI
    .replace(/data:text\/html/gi, '')                                   // Remove data:html URI
    .replace(/on\w+="[^"]*"/gi, '')                                     // Remove inline event handlers
    .replace(/on\w+='[^']*'/gi, '')
    .trim();
}

/**
 * Escapes characters for safe DOM or text display.
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Safely bounds and sanitizes numeric values, preventing NaN or null runtime crashes.
 */
export function sanitizeNumber(
  val: unknown, 
  fallback: number = 0, 
  min: number = 0, 
  max: number = Number.MAX_SAFE_INTEGER
): number {
  if (typeof val === 'number' && Number.isFinite(val)) {
    return Math.min(Math.max(val, min), max);
  }
  if (typeof val === 'string') {
    const parsed = Number(val);
    if (Number.isFinite(parsed)) {
      return Math.min(Math.max(parsed, min), max);
    }
  }
  return fallback;
}

/**
 * Sanitizes and validates an entire UserProfile object.
 */
export function sanitizeUserProfile(profile: Partial<UserProfile> | null | undefined): UserProfile {
  const safeId = profile?.id && typeof profile.id === 'string' ? sanitizeString(profile.id) : `user-${Date.now()}`;
  const safeName = sanitizeString(profile?.name || 'विद्यार्थी');
  const safeEmail = sanitizeString(profile?.email || '');
  const safePhone = sanitizeString(profile?.phone || '').replace(/[^\d+]/g, '');
  const safeProvince = sanitizeString(profile?.province || 'बागमती प्रदेश');
  const safeDistrict = sanitizeString(profile?.district || 'काठमाडौं');
  const safeTargetExam = sanitizeString(profile?.targetExam || 'नेपाल राष्ट्र बैंक - सहायक (तह ४)');
  const safeRank = sanitizeString(profile?.rank || 'तह ४: नयाँ प्रतियोगी (Aspirant)');

  // Validate avatarUrl to prevent javascript: or malformed URLs
  let safeAvatar = profile?.avatarUrl;
  if (typeof safeAvatar !== 'string' || 
      (!safeAvatar.startsWith('http://') && 
       !safeAvatar.startsWith('https://') && 
       !safeAvatar.startsWith('data:image/'))) {
    safeAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80';
  }

  return {
    id: safeId,
    name: safeName || 'विद्यार्थी',
    email: safeEmail,
    phone: safePhone,
    province: safeProvince,
    district: safeDistrict,
    targetExam: safeTargetExam,
    avatarUrl: safeAvatar,
    xp: sanitizeNumber(profile?.xp, 150, 0, 1000000),
    streak: sanitizeNumber(profile?.streak, 1, 0, 3650),
    lastActiveDate: sanitizeString(profile?.lastActiveDate || new Date().toISOString().split('T')[0]),
    questionsSolved: sanitizeNumber(profile?.questionsSolved, 0, 0, 100000),
    quizzesCompleted: sanitizeNumber(profile?.quizzesCompleted, 0, 0, 50000),
    accuracy: sanitizeNumber(profile?.accuracy, 100, 0, 100),
    rank: safeRank,
    level: sanitizeNumber(profile?.level, 1, 1, 100),
    totalQuestionsAnswered: sanitizeNumber(profile?.totalQuestionsAnswered, 0, 0, 100000),
    notesRead: sanitizeNumber(profile?.notesRead, 0, 0, 10000),
    registeredAt: sanitizeString(profile?.registeredAt || new Date().toISOString()),
    isRegistered: Boolean(profile?.isRegistered ?? true)
  };
}

/**
 * Checks whether an email matches the designated official administrator account.
 */
export const OFFICIAL_ADMIN_EMAIL = 'rishiramthapa3@gmail.com';
export const MASTER_ADMIN_PIN = '885522';

export function isUserAdmin(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase() === OFFICIAL_ADMIN_EMAIL.toLowerCase();
}
