/**
 * UNNATI Skill & Micro-Certification Client Library
 * ------------------------------------------------
 * Client-side validation, badge metadata, expiry checks, and progression roadmap.
 */

import {
  SkillProficiency,
  CertificationStatus,
  WorkerSkillRecord,
  WorkerCertificationRecord,
  SkillProgressionMeta
} from '../types/skill';

export const PROFICIENCY_ORDER: Record<SkillProficiency, number> = {
  BEGINNER: 1,
  SKILLED: 2,
  CERTIFIED: 3,
  EXPERT: 4
};

/**
 * Validates skill form input on client.
 */
export function validateSkillForm(
  name: string,
  proficiency: SkillProficiency,
  years: number,
  hasVerifiedCert: boolean = false
): { valid: boolean; error?: string } {
  const cleanName = (name || '').trim();
  if (!cleanName || cleanName.length < 2) {
    return { valid: false, error: 'Skill name must be at least 2 characters long.' };
  }
  if (cleanName.length > 80) {
    return { valid: false, error: 'Skill name cannot exceed 80 characters.' };
  }
  if (years < 0 || years > 50) {
    return { valid: false, error: 'Years of experience must be between 0 and 50.' };
  }
  if (proficiency === 'CERTIFIED' && !hasVerifiedCert) {
    return {
      valid: false,
      error: "'CERTIFIED' level requires an approved vocational certification. Please upload your certificate first."
    };
  }
  if (proficiency === 'EXPERT' && years < 3) {
    return {
      valid: false,
      error: "'EXPERT' level requires at least 3 years of hands-on field experience."
    };
  }
  return { valid: true };
}

/**
 * Evaluates certification status considering expiry date.
 */
export function evaluateClientCertStatus(
  status: CertificationStatus,
  expiryDate?: string | null,
  referenceDate: Date = new Date()
): CertificationStatus {
  if (status === 'REJECTED') return 'REJECTED';

  if (expiryDate) {
    const exp = new Date(expiryDate);
    if (!isNaN(exp.getTime()) && exp < referenceDate) {
      return 'EXPIRED';
    }
  }

  return status;
}

/**
 * Returns badge styling and human readable labels for proficiency levels.
 */
export function getProficiencyBadge(proficiency: SkillProficiency): {
  label: string;
  hindiLabel: string;
  colorClass: string;
} {
  switch (proficiency) {
    case 'EXPERT':
      return {
        label: 'Expert Artisan',
        hindiLabel: 'वरिष्ठ विशेषज्ञ',
        colorClass: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300'
      };
    case 'CERTIFIED':
      return {
        label: 'Certified (NSDC/Govt)',
        hindiLabel: 'प्रमाणित कारीगर',
        colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
      };
    case 'SKILLED':
      return {
        label: 'Skilled Practitioner',
        hindiLabel: 'कुशल कारीगर',
        colorClass: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300'
      };
    case 'BEGINNER':
    default:
      return {
        label: 'Beginner / Apprentice',
        hindiLabel: 'प्रशिक्षु',
        colorClass: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
      };
  }
}

/**
 * Returns badge styling and human readable labels for certification statuses.
 */
export function getCertificationStatusBadge(
  status: CertificationStatus,
  expiryDate?: string | null
): {
  label: string;
  effectiveStatus: CertificationStatus;
  colorClass: string;
} {
  const effective = evaluateClientCertStatus(status, expiryDate);

  switch (effective) {
    case 'VERIFIED':
      return {
        label: 'Verified (सत्यापित)',
        effectiveStatus: 'VERIFIED',
        colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
      };
    case 'EXPIRED':
      return {
        label: 'Expired (समाप्त)',
        effectiveStatus: 'EXPIRED',
        colorClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300'
      };
    case 'REJECTED':
      return {
        label: 'Rejected (अस्वीकृत)',
        effectiveStatus: 'REJECTED',
        colorClass: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300'
      };
    case 'PENDING':
      return {
        label: 'Review Pending (लंबित)',
        effectiveStatus: 'PENDING',
        colorClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
      };
    case 'DEMO_UNVERIFIED':
    default:
      return {
        label: 'Demo / Unverified',
        effectiveStatus: 'DEMO_UNVERIFIED',
        colorClass: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400'
      };
  }
}

/**
 * Calculates overall worker skill progression level based on verified skills and certifications.
 */
export function calculateSkillProgression(
  skills: WorkerSkillRecord[],
  certifications: WorkerCertificationRecord[]
): SkillProgressionMeta {
  const activeVerifiedCerts = certifications.filter(
    (c) => evaluateClientCertStatus(c.verification_status, c.expiry_date) === 'VERIFIED'
  );

  const hasExpert = skills.some((s) => s.proficiency === 'EXPERT');
  const hasCertified = skills.some((s) => s.proficiency === 'CERTIFIED') || activeVerifiedCerts.length > 0;
  const hasSkilled = skills.some((s) => s.proficiency === 'SKILLED');

  if (hasExpert && activeVerifiedCerts.length >= 2) {
    return {
      level: 4,
      title: 'Master Craftsman (वरिष्ठ उस्ताद)',
      description: 'Highest cooperative guild tier with multi-trade certifications.',
      progressPercent: 100,
      nextMilestone: 'Eligible to mentor apprentices and serve on peer review board.'
    };
  }

  if (hasCertified) {
    return {
      level: 3,
      title: 'Certified Artisan (प्रमाणित कारीगर)',
      description: 'Verified vocational qualifications with access to high-value & commercial tasks.',
      progressPercent: 75,
      nextMilestone: 'Attain 3+ years experience and secondary trade certification for Master tier.'
    };
  }

  if (hasSkilled || skills.length >= 2) {
    return {
      level: 2,
      title: 'Skilled Practitioner (कुशल कारीगर)',
      description: 'Demonstrated field competencies with peer cooperative endorsements.',
      progressPercent: 50,
      nextMilestone: 'Submit recognized Skill India / NSDC micro-certification to unlock Certified status.'
    };
  }

  return {
    level: 1,
    title: 'Apprentice / Beginner (प्रशिक्षु)',
    description: 'Foundational trade capabilities building cooperative work history.',
    progressPercent: 25,
    nextMilestone: 'Log 5 completed service jobs or register verified skills to advance.'
  };
}
