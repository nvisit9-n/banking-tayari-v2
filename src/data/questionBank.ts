import { Question, QuizSet, DifficultyLevel } from '../types';
import { DbService } from '../services/dbService';
import { convertRawSetToQuizSet, allFiftySets } from './sangathitDatabase';

/**
 * LOK SEWA COMMISSION PUBLIC ENTERPRISES (सङ्गठित संस्था) PRE-QUALIFYING EXAM
 * Official Syllabus Allocation (50 Questions per Set, 100 Marks, 45 Minutes):
 * - Q1 to Q45: Bilingual (NEP + ENG) covering GK, Geography, History, Economics, Constitution, IT/AI, Management, Math, Banking
 * - Q46 to Q48: Pure English (Grammar, Vocabulary, Idioms)
 * - Q49 to Q50: Pure Nepali (शुद्ध/अशुद्ध, शब्दवर्ग, सन्धि-समास)
 * 
 * Complies with 2083/84 BS updated Loksewa & Banking facts:
 * - Prithvi Narayan Shah's "yam between two stones" = China & India
 * - Option distribution across A, B, C, D (indices 0, 1, 2, 3)
 * - Full explanations and tips
 */

export const TOTAL_SETS = 50;
export const QUESTIONS_PER_SET = 50;

export interface SangathitSetMeta {
  id: string;
  setNumber: number;
  title: string;
  nepaliTitle: string;
  totalQuestions: number;
  timeLimitMinutes: number;
  difficulty: DifficultyLevel;
  badge: string;
  targetLevel: string;
  description: string;
}

/**
 * Construct/Retrieve a specific 50-Question Practice Set
 * following the exact structure:
 * - Q1 to Q45: Bilingual (NEP + ENG)
 * - Q46 to Q48: Pure English
 * - Q49 to Q50: Pure Nepali
 * - Distributed correct answers (A, B, C, D)
 * - Complete explanations
 */
export function buildSangathitSet(setNumber: number): QuizSet {
  const safeNumber = Math.max(1, Math.min(TOTAL_SETS, setNumber));
  const rawSet = allFiftySets[safeNumber - 1];
  return convertRawSetToQuizSet(rawSet);
}

// Generate all 50 full practice sets (50 sets x 50 questions = 2,500 questions)
export const SANGATHIT_SASTHA_SETS: QuizSet[] = Array.from({ length: TOTAL_SETS }, (_, i) => buildSangathitSet(i + 1));

/**
 * Retrieve metadata for all 50 sets for UI display (from Database or prebuilt)
 */
export function getAllSangathitSasthaSetMetas(): SangathitSetMeta[] {
  try {
    const dbSets = DbService.getAllFiftySetsFromDatabase();
    if (dbSets && dbSets.length === TOTAL_SETS) {
      return dbSets.map((s) => ({
        id: `sangathit-set-${s.setId}`,
        setNumber: s.setId,
        title: `Set ${s.setId}: L4 (20 Marks) & L5 (10 Marks)`,
        nepaliTitle: s.setName,
        totalQuestions: s.totalQuestions || 50,
        timeLimitMinutes: s.timeLimitMinutes || 45,
        difficulty: (s.setId <= 15 ? 'Easy' : s.setId <= 35 ? 'Medium' : 'Hard') as DifficultyLevel,
        badge: `Set ${s.setId}`,
        targetLevel: 'तह ४ र तह ५ (L4 & L5)',
        description: 'Q1-Q45 द्विभाषी (Bilingual), Q46-Q48 अङ्ग्रेजी र Q49-Q50 नेपाली सहित ५० प्रश्नहरूको पूर्ण आधिकारिक सेट।'
      }));
    }
  } catch {
    // fallback
  }

  return SANGATHIT_SASTHA_SETS.map((set, idx) => {
    const setNum = idx + 1;
    return {
      id: set.id,
      setNumber: setNum,
      title: `Set ${setNum}: L4 (20 Marks) & L5 (10 Marks)`,
      nepaliTitle: `संगठित संस्था Pre-Test - सेट ${setNum}`,
      totalQuestions: set.questions.length,
      timeLimitMinutes: set.timeLimitMinutes,
      difficulty: set.difficulty,
      badge: `Set ${setNum}`,
      targetLevel: 'तह ४ र तह ५ (L4 & L5)',
      description: '१० वटै पाठ्यक्रम क्षेत्रहरू (भूगोल, इतिहास, अर्थतन्त्र, संविधान, सार्क/UN, IT/AI, व्यवस्थापन, गणित, संस्थान, भाषा) समावेश गरिएको ५० प्रश्नको सेट।'
    };
  });
}

/**
 * Fetch a specific set by set number (1 to 50) - reads from Database if initialized
 */
export function getSangathitSasthaSet(setNumber: number): QuizSet {
  const safeNumber = Math.max(1, Math.min(TOTAL_SETS, setNumber));
  try {
    const rawFromDb = DbService.getSangathitSetFromDatabase(safeNumber);
    if (rawFromDb) {
      return convertRawSetToQuizSet(rawFromDb);
    }
  } catch {
    // fallback
  }
  return SANGATHIT_SASTHA_SETS[safeNumber - 1];
}

/**
 * Get total available questions in Sangathit Sastha bank (2,500 MCQs)
 */
export function getSangathitTotalQuestionCount(): number {
  return TOTAL_SETS * QUESTIONS_PER_SET;
}
