import { UserProfile, AdminAnalyticsRecord, Question, StudyNote, RawSangathitSet, LeaderboardEntry } from '../types';
import { safeStorage } from '../utils/safeHelpers';
import { StorageService } from './storageService';
import { allFiftySets, generateAllFiftySets } from '../data/sangathitDatabase';

const DB_KEYS = {
  STUDENT_PROFILE: 'btn_student_profile_v2',
  ADMIN_ANALYTICS: 'btn_admin_analytics_v2',
  DYNAMIC_MCQS: 'btn_dynamic_mcqs_v2',
  DYNAMIC_NOTES: 'btn_dynamic_notes_v2',
  SYNC_CONFIG: 'btn_cloud_sync_config_v2',
  SANGATHIT_50_SETS: 'btn_sangathit_50_sets_v5_audited'
};

export interface SyncConfig {
  cloudEndpoint: string;
  autoSyncEnabled: boolean;
  lastSyncTimestamp: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
}

export interface AdminAnalyticsSummary {
  totalAttempts: number;
  totalStudents: number;
  averageNetScore: number;
  averageAccuracy: number;
  totalAttemptedQuestions: number;
  totalSkippedQuestions: number;
  attemptedToSkippedRatio: string; // e.g. "82% / 18%"
  totalCorrect: number;
  totalIncorrect: number;
  totalNegativeDeductions: number;
  averageTimeElapsedSeconds: number;
  districtDistribution: Record<string, number>;
  examDistribution: Record<string, number>;
  recentRecords: AdminAnalyticsRecord[];
}

export class DbService {
  // ==========================================
  // 1. STUDENT REGISTRATION & PROFILE SYNC
  // ==========================================

  /**
   * Dynamically calculates profile completion percentage (0% - 100%)
   * Full Name: 20%
   * Email: 20%
   * Mobile Number: 15%
   * Target Exam: 15%
   * Province: 15%
   * District: 15%
   */
  static calculateProfileCompletion(profile?: Partial<UserProfile>): {
    percentage: number;
    breakdown: Record<string, { label: string; completed: boolean; weight: number }>;
    missingFields: string[];
    isComplete: boolean;
  } {
    const p = profile || this.getStudentProfile();

    const hasName = Boolean(p.name && p.name.trim().length >= 2 && p.name.trim() !== 'विद्यार्थी');
    const hasEmail = Boolean(p.email && p.email.includes('@') && p.email.trim().length > 4);
    const hasPhone = Boolean(p.phone && p.phone.replace(/\D/g, '').length >= 10);
    const hasTargetExam = Boolean(p.targetExam && p.targetExam.trim().length >= 3);
    const hasProvince = Boolean(p.province && p.province.trim().length >= 2);
    const hasDistrict = Boolean(p.district && p.district.trim().length >= 2);

    const breakdown = {
      name: { label: 'पूरा नाम (Full Name)', completed: hasName, weight: 20 },
      email: { label: 'इमेल ठेगाना (Email)', completed: hasEmail, weight: 20 },
      phone: { label: 'मोबाइल नम्बर (Mobile Number)', completed: hasPhone, weight: 15 },
      targetExam: { label: 'लक्ष्यित परीक्षा (Target Exam)', completed: hasTargetExam, weight: 15 },
      province: { label: 'प्रदेश (Province)', completed: hasProvince, weight: 15 },
      district: { label: 'जिल्ला (District)', completed: hasDistrict, weight: 15 },
    };

    let percentage = 0;
    const missingFields: string[] = [];

    Object.entries(breakdown).forEach(([key, val]) => {
      if (val.completed) {
        percentage += val.weight;
      } else {
        missingFields.push(val.label);
      }
    });

    percentage = Math.min(100, Math.max(0, percentage));
    const isComplete = percentage === 100;

    return { percentage, breakdown, missingFields, isComplete };
  }

  static isProfileComplete(profile?: UserProfile): boolean {
    return this.calculateProfileCompletion(profile).isComplete;
  }

  static getStudentProfile(): UserProfile {
    try {
      const stored = localStorage.getItem('user_profile') || safeStorage.getItem(DB_KEYS.STUDENT_PROFILE);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return StorageService.getUserProfile();
  }

  static async saveStudentProfile(profileUpdates: Partial<UserProfile>): Promise<UserProfile> {
    const current = this.getStudentProfile();
    const targetUid = profileUpdates.authUid || profileUpdates.id || current.authUid || current.id || `uid_${Date.now()}`;

    // If logging in as a different user or authenticating afresh, do not carry over obsolete identity from previous session
    const isDifferentUser = Boolean(
      profileUpdates.email && 
      current?.email && 
      profileUpdates.email.trim().toLowerCase() !== current.email.trim().toLowerCase()
    );
    const base = isDifferentUser ? {} : current;

    // Check completion before & after
    const priorCompletion = this.calculateProfileCompletion(current);
    const draft = { ...base, ...profileUpdates, authUid: targetUid, id: targetUid };
    const newCompletion = this.calculateProfileCompletion(draft);

    let xpBonusToAdd = 0;
    let bonusJustClaimed = false;

    // Award +50 Bonus XP when reaching 100% completion for the first time
    if (newCompletion.isComplete && !current.hasReceivedCompletionBonus && !profileUpdates.hasReceivedCompletionBonus) {
      xpBonusToAdd = 50;
      bonusJustClaimed = true;
    }

    const updatedXp = (draft.xp || 0) + xpBonusToAdd;
    const updatedLevel = Math.max(1, Math.floor(updatedXp / 500) + 1);

    const updated: UserProfile = {
      ...draft,
      xp: updatedXp,
      level: updatedLevel,
      profileCompletion: newCompletion.percentage,
      hasReceivedCompletionBonus: current.hasReceivedCompletionBonus || bonusJustClaimed,
      isRegistered: true,
      registeredAt: current.registeredAt || new Date().toISOString(),
      lastActiveDate: new Date().toISOString()
    };

    try {
      const serialized = JSON.stringify(updated);
      localStorage.setItem('user_profile', serialized);
      safeStorage.setItem('user_profile', serialized);
      safeStorage.setItem(DB_KEYS.STUDENT_PROFILE, serialized);
      safeStorage.setItem('btn_registration_completed_v1', 'true');
      StorageService.saveUserProfile(updated);
    } catch (e) {
      console.error('Error persisting student profile locally', e);
    }

    // Direct persistence to Central Database linked to unique Auth UID
    this.pushProfileToCentralDatabase(updated).catch(() => {});

    // If bonus just claimed, dispatch window event for celebrations
    if (bonusJustClaimed && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('btn:bonus-xp-awarded', { 
        detail: { amount: 50, reason: 'प्रोफाइल १००% पूरा भएकोमा +५० बोनस XP प्राप्त भयो!' }
      }));
    }

    return updated;
  }

  private static async pushProfileToCentralDatabase(profile: UserProfile): Promise<void> {
    try {
      const uid = profile.authUid || profile.id;
      if (!uid) return;

      await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authUid: uid, profile })
      });
    } catch {
      // Local database fallback guarantees continuous offline operation
    }
  }

  static async fetchUserProfileFromCloud(authUid: string): Promise<UserProfile | null> {
    try {
      const res = await fetch(`/api/user/profile/${encodeURIComponent(authUid)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.profile) {
          return data.profile;
        }
      }
    } catch {
      // offline fallback
    }
    return null;
  }

  static async fetchLeaderboard(filters: { province?: string; district?: string; exam?: string; currentUid?: string }): Promise<{
    leaderboard: LeaderboardEntry[];
    currentUserRank: LeaderboardEntry | null;
  }> {
    try {
      const params = new URLSearchParams();
      if (filters.province && filters.province !== 'All') params.append('province', filters.province);
      if (filters.district && filters.district !== 'All') params.append('district', filters.district);
      if (filters.exam && filters.exam !== 'All') params.append('exam', filters.exam);
      if (filters.currentUid) params.append('currentUid', filters.currentUid);

      const res = await fetch(`/api/leaderboard?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.leaderboard)) {
          return {
            leaderboard: data.leaderboard,
            currentUserRank: data.currentUserRank || null
          };
        }
      }
    } catch (e) {
      console.warn('Failed to fetch remote leaderboard, using local records:', e);
    }

    // Offline / Local fallback
    const current = this.getStudentProfile();
    const fallbackEntry: LeaderboardEntry = {
      rank: 1,
      authUid: current.authUid || current.id || 'current_user',
      name: current.name || 'विद्यार्थी',
      email: current.email,
      avatarUrl: current.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      province: current.province || 'बागमती प्रदेश',
      district: current.district || 'काठमाडौँ',
      targetExam: current.targetExam || 'नेपाल राष्ट्र बैंक (NRB Level 4/5)',
      xp: current.xp || 100,
      level: current.level || 1,
      accuracy: current.accuracy || 84,
      quizzesCompleted: current.quizzesCompleted || 1,
      isCurrentUser: true
    };

    return {
      leaderboard: [fallbackEntry],
      currentUserRank: fallbackEntry
    };
  }

  // ==========================================
  // 2. ADMIN ANALYTICS TRACKER
  // ==========================================

  static recordQuizAnalytics(data: Omit<AdminAnalyticsRecord, 'id' | 'timestamp'>): AdminAnalyticsRecord {
    const record: AdminAnalyticsRecord = {
      ...data,
      id: `ana-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString()
    };

    try {
      const existing = this.getAnalyticsRecords();
      existing.unshift(record);
      // Keep up to 500 recent attempts in storage
      safeStorage.setItem(DB_KEYS.ADMIN_ANALYTICS, JSON.stringify(existing.slice(0, 500)));
    } catch (e) {
      console.error('Failed to save analytics record', e);
    }

    // Background push to Cloud Database if configured
    this.pushAnalyticsToCloud(record).catch(() => {});

    return record;
  }

  static getAnalyticsRecords(): AdminAnalyticsRecord[] {
    try {
      const raw = safeStorage.getItem(DB_KEYS.ADMIN_ANALYTICS);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // fallback
    }
    return [];
  }

  static getAnalyticsSummary(): AdminAnalyticsSummary {
    const records = this.getAnalyticsRecords();
    const student = this.getStudentProfile();

    if (records.length === 0) {
      return {
        totalAttempts: 0,
        totalStudents: student.name ? 1 : 0,
        averageNetScore: 0,
        averageAccuracy: 0,
        totalAttemptedQuestions: 0,
        totalSkippedQuestions: 0,
        attemptedToSkippedRatio: '0% / 0%',
        totalCorrect: 0,
        totalIncorrect: 0,
        totalNegativeDeductions: 0,
        averageTimeElapsedSeconds: 0,
        districtDistribution: student.district ? { [student.district]: 1 } : {},
        examDistribution: student.targetExam ? { [student.targetExam]: 1 } : {},
        recentRecords: []
      };
    }

    let totalNetScore = 0;
    let totalAccuracy = 0;
    let totalAttempted = 0;
    let totalSkipped = 0;
    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalNegativeDeductions = 0;
    let totalTime = 0;

    const districtDistribution: Record<string, number> = {};
    const examDistribution: Record<string, number> = {};
    const uniqueUserIds = new Set<string>();

    records.forEach(r => {
      uniqueUserIds.add(r.userId);
      totalNetScore += r.netScore;
      totalAccuracy += r.accuracy;
      totalAttempted += r.attemptedCount;
      totalSkipped += r.skippedCount;
      totalCorrect += r.correctAnswers;
      totalIncorrect += r.incorrectAnswers;
      totalNegativeDeductions += r.negativeDeduction;
      totalTime += r.timeElapsedSeconds;

      const dist = r.district || 'अज्ञात (Not Specified)';
      districtDistribution[dist] = (districtDistribution[dist] || 0) + 1;

      const exam = r.targetExam || 'General Banking';
      examDistribution[exam] = (examDistribution[exam] || 0) + 1;
    });

    const totalQuestionsOverall = totalAttempted + totalSkipped;
    const attemptedPercent = totalQuestionsOverall > 0 
      ? Math.round((totalAttempted / totalQuestionsOverall) * 100) 
      : 0;
    const skippedPercent = 100 - attemptedPercent;

    return {
      totalAttempts: records.length,
      totalStudents: Math.max(1, uniqueUserIds.size),
      averageNetScore: Number((totalNetScore / records.length).toFixed(2)),
      averageAccuracy: Math.round(totalAccuracy / records.length),
      totalAttemptedQuestions: totalAttempted,
      totalSkippedQuestions: totalSkipped,
      attemptedToSkippedRatio: `${attemptedPercent}% हल / ${skippedPercent}% छोडिएको`,
      totalCorrect,
      totalIncorrect,
      totalNegativeDeductions: Number(totalNegativeDeductions.toFixed(2)),
      averageTimeElapsedSeconds: Math.round(totalTime / records.length),
      districtDistribution,
      examDistribution,
      recentRecords: records.slice(0, 50)
    };
  }

  private static async pushAnalyticsToCloud(record: AdminAnalyticsRecord): Promise<void> {
    // Send to central user score tracker linked to unique authUid
    try {
      await fetch('/api/user/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authUid: record.userId,
          scoreData: {
            userId: record.userId,
            userName: record.userName,
            province: record.province || '',
            district: record.district,
            targetExam: record.targetExam,
            accuracy: record.accuracy,
            xpEarned: Math.round(record.netScore * 10),
            totalQuestions: record.totalQuestions,
            correctAnswers: record.correctAnswers
          }
        })
      });
    } catch {
      // Local fallback
    }

    const config = this.getSyncConfig();
    if (!config.autoSyncEnabled || !config.cloudEndpoint) return;

    try {
      await fetch(`${config.cloudEndpoint}/api/analytics/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
    } catch {
      // Silently queue offline
    }
  }

  // ==========================================
  // 3. DYNAMIC CLOUD SYNC FOR MCQS & NOTES
  // ==========================================

  static getSyncConfig(): SyncConfig {
    try {
      const raw = safeStorage.getItem(DB_KEYS.SYNC_CONFIG);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // fallback
    }
    return {
      cloudEndpoint: 'https://api.bankingtayari.np.internal',
      autoSyncEnabled: true,
      lastSyncTimestamp: new Date().toISOString(),
      syncStatus: 'idle'
    };
  }

  static updateSyncConfig(updates: Partial<SyncConfig>): SyncConfig {
    const current = this.getSyncConfig();
    const updated = { ...current, ...updates };
    try {
      safeStorage.setItem(DB_KEYS.SYNC_CONFIG, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update sync config', e);
    }
    return updated;
  }

  static async syncDynamicMCQs(cloudQuestions?: Question[]): Promise<{ count: number; status: string }> {
    try {
      let questionsToSync: Question[] = cloudQuestions || [];

      if (!cloudQuestions) {
        const config = this.getSyncConfig();
        const res = await fetch(`${config.cloudEndpoint}/api/mcqs/latest`);
        if (res.ok) {
          questionsToSync = await res.json();
        }
      }

      if (questionsToSync.length > 0) {
        const existing = this.getDynamicMCQs();
        const mergedMap = new Map<string, Question>();
        existing.forEach(q => mergedMap.set(q.id, q));
        questionsToSync.forEach(q => mergedMap.set(q.id, q));

        safeStorage.setItem(DB_KEYS.DYNAMIC_MCQS, JSON.stringify(Array.from(mergedMap.values())));
        this.updateSyncConfig({
          lastSyncTimestamp: new Date().toISOString(),
          syncStatus: 'success'
        });
        return { count: questionsToSync.length, status: 'success' };
      }
    } catch (e: any) {
      this.updateSyncConfig({
        syncStatus: 'error',
        errorMessage: e?.message || 'Sync failed'
      });
    }
    return { count: 0, status: 'synced_offline' };
  }

  static getDynamicMCQs(): Question[] {
    try {
      const raw = safeStorage.getItem(DB_KEYS.DYNAMIC_MCQS);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return [];
  }

  static async syncDynamicNotes(cloudNotes?: StudyNote[]): Promise<{ count: number; status: string }> {
    try {
      let notesToSync: StudyNote[] = cloudNotes || [];

      if (!cloudNotes) {
        const config = this.getSyncConfig();
        const res = await fetch(`${config.cloudEndpoint}/api/notes/latest`);
        if (res.ok) {
          notesToSync = await res.json();
        }
      }

      if (notesToSync.length > 0) {
        const existing = this.getDynamicNotes();
        const mergedMap = new Map<string, StudyNote>();
        existing.forEach(n => mergedMap.set(n.id, n));
        notesToSync.forEach(n => mergedMap.set(n.id, n));

        safeStorage.setItem(DB_KEYS.DYNAMIC_NOTES, JSON.stringify(Array.from(mergedMap.values())));
        return { count: notesToSync.length, status: 'success' };
      }
    } catch {
      // fallback
    }
    return { count: 0, status: 'synced_offline' };
  }

  static getDynamicNotes(): StudyNote[] {
    try {
      const raw = safeStorage.getItem(DB_KEYS.DYNAMIC_NOTES);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return [];
  }

  // ==========================================
  // 4. EXPORT & BACKUP
  // ==========================================

  static exportAnalyticsCSV(): string {
    const records = this.getAnalyticsRecords();
    if (records.length === 0) return 'No analytics records available';

    const headers = [
      'Record ID',
      'User ID',
      'Name',
      'District',
      'Target Exam',
      'Quiz Title',
      'Category',
      'Total Questions',
      'Attempted',
      'Skipped',
      'Correct',
      'Incorrect',
      'Net Score (-20%)',
      'Accuracy %',
      'Time Spent (s)',
      'Date & Time'
    ];

    const rows = records.map(r => [
      r.id,
      r.userId,
      `"${r.userName || ''}"`,
      `"${r.district || ''}"`,
      `"${r.targetExam || ''}"`,
      `"${r.quizTitle || ''}"`,
      `"${r.category || ''}"`,
      r.totalQuestions,
      r.attemptedCount,
      r.skippedCount,
      r.correctAnswers,
      r.incorrectAnswers,
      r.netScore,
      r.accuracy,
      r.timeElapsedSeconds,
      r.timestamp
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  static clearAnalytics(): void {
    try {
      safeStorage.removeItem(DB_KEYS.ADMIN_ANALYTICS);
    } catch {
      // fallback
    }
  }

  // ==========================================
  // 5. PUBLIC ENTERPRISE 50 SETS BULK DATABASE
  // ==========================================

  /**
   * Database मा Bulk Upload / Save गर्ने फन्क्सन
   * Saves all 50 practice sets into the persistent database
   */
  static async uploadAll50SetsToDatabase(setsToUpload?: RawSangathitSet[]): Promise<{ count: number; success: boolean }> {
    try {
      const sets = setsToUpload && setsToUpload.length > 0 ? setsToUpload : allFiftySets;
      safeStorage.setItem(DB_KEYS.SANGATHIT_50_SETS, JSON.stringify(sets));

      console.log("SUCCESS: सेट १ देखि ५० वटै अद्यावधिक भई Database मा सेभ भयो!");
      
      // Attempt background push to cloud/server API if available
      try {
        await fetch('/api/sets/bulk-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sets })
        });
      } catch {
        // Local database persistence succeeded
      }

      return { count: sets.length, success: true };
    } catch (error) {
      console.error("Error updating sets in database:", error);
      return { count: 0, success: false };
    }
  }

  /**
   * Retrieve all 50 sets from Database. If not yet initialized, automatically
   * runs bulk upload and returns the 50 sets.
   */
  static getAllFiftySetsFromDatabase(): RawSangathitSet[] {
    try {
      const stored = safeStorage.getItem(DB_KEYS.SANGATHIT_50_SETS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length >= 50) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not read sets from database, initializing defaults:", e);
    }

    // Auto-initialize into database
    const freshSets = generateAllFiftySets();
    try {
      safeStorage.setItem(DB_KEYS.SANGATHIT_50_SETS, JSON.stringify(freshSets));
      console.log("SUCCESS: सेट १ देखि ५० वटै अद्यावधिक भई Database मा सेभ भयो!");
    } catch (err) {
      console.error("Failed to seed 50 sets in database", err);
    }
    return freshSets;
  }

  /**
   * Retrieve a single set from Database by its set number (1 to 50)
   */
  static getSangathitSetFromDatabase(setId: number): RawSangathitSet {
    const all = this.getAllFiftySetsFromDatabase();
    const safeId = Math.max(1, Math.min(50, setId));
    const found = all.find(s => s.setId === safeId);
    return found || all[safeId - 1] || allFiftySets[safeId - 1];
  }
}

