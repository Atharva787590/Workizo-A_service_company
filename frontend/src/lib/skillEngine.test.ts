import { describe, it, expect } from 'vitest';
import {
  validateSkillForm,
  evaluateClientCertStatus,
  getProficiencyBadge,
  getCertificationStatusBadge,
  calculateSkillProgression
} from './skillEngine';
import { WorkerSkillRecord, WorkerCertificationRecord } from '../types/skill';

describe('UNNATI Skill & Micro-Certification Engine Client Library', () => {
  describe('Skill Form Validation', () => {
    it('validates a valid skill entry', () => {
      const res = validateSkillForm('Submersible Pump Fitting', 'SKILLED', 2);
      expect(res.valid).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it('rejects blank or short skill names', () => {
      const res = validateSkillForm('  ', 'SKILLED', 2);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('at least 2 characters');
    });

    it('rejects excessive experience values', () => {
      const res = validateSkillForm('Plumbing', 'SKILLED', 60);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('between 0 and 50');
    });

    it('blocks CERTIFIED level if worker has no verified certificate', () => {
      const res = validateSkillForm('High Voltage Wiring', 'CERTIFIED', 4, false);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('requires an approved vocational certification');
    });

    it('allows CERTIFIED level if worker has verified certificate', () => {
      const res = validateSkillForm('High Voltage Wiring', 'CERTIFIED', 4, true);
      expect(res.valid).toBe(true);
    });

    it('blocks EXPERT level if worker has less than 3 years experience', () => {
      const res = validateSkillForm('Solar Installation', 'EXPERT', 1, true);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('at least 3 years');
    });
  });

  describe('Certification Expiry & Status Evaluation', () => {
    const today = new Date(2026, 8, 6); // Sep 6, 2026

    it('keeps active verified certificate as VERIFIED', () => {
      const status = evaluateClientCertStatus('VERIFIED', '2027-12-31', today);
      expect(status).toBe('VERIFIED');
    });

    it('automatically transitions expired certificate to EXPIRED', () => {
      const status = evaluateClientCertStatus('VERIFIED', '2025-01-01', today);
      expect(status).toBe('EXPIRED');
    });

    it('keeps REJECTED status even if not expired', () => {
      const status = evaluateClientCertStatus('REJECTED', '2028-01-01', today);
      expect(status).toBe('REJECTED');
    });

    it('handles certificate with no expiry date', () => {
      const status = evaluateClientCertStatus('VERIFIED', null, today);
      expect(status).toBe('VERIFIED');
    });
  });

  describe('Badge Metadata Formatting', () => {
    it('returns appropriate badge for EXPERT proficiency', () => {
      const badge = getProficiencyBadge('EXPERT');
      expect(badge.label).toBe('Expert Artisan');
      expect(badge.colorClass).toContain('purple');
    });

    it('returns appropriate badge for expired certification', () => {
      const badge = getCertificationStatusBadge('VERIFIED', '2020-01-01');
      expect(badge.effectiveStatus).toBe('EXPIRED');
      expect(badge.colorClass).toContain('rose');
    });
  });

  describe('Skill Progression Calculation', () => {
    it('calculates Level 1 Apprentice for beginner workers with few skills', () => {
      const skills: WorkerSkillRecord[] = [
        { id: 1, name: 'Basic Assistance', proficiency: 'BEGINNER', years_of_experience: 0, is_verified: false }
      ];
      const progression = calculateSkillProgression(skills, []);
      expect(progression.level).toBe(1);
      expect(progression.progressPercent).toBe(25);
    });

    it('calculates Level 2 Skilled Practitioner for workers with multiple skilled competencies', () => {
      const skills: WorkerSkillRecord[] = [
        { id: 1, name: 'Pipe Repair', proficiency: 'SKILLED', years_of_experience: 2, is_verified: true },
        { id: 2, name: 'Tap Installation', proficiency: 'SKILLED', years_of_experience: 2, is_verified: false }
      ];
      const progression = calculateSkillProgression(skills, []);
      expect(progression.level).toBe(2);
      expect(progression.progressPercent).toBe(50);
    });

    it('calculates Level 3 Certified Artisan when verified vocational certificate exists', () => {
      const skills: WorkerSkillRecord[] = [
        { id: 1, name: 'Electrical Wiring', proficiency: 'CERTIFIED', years_of_experience: 3, is_verified: true }
      ];
      const certs: WorkerCertificationRecord[] = [
        {
          id: 10,
          certification_name: 'NCVT Wireman Certificate',
          issuing_organization: 'NCVT',
          issue_date: '2024-01-01',
          expiry_date: '2029-01-01',
          verification_status: 'VERIFIED'
        }
      ];
      const progression = calculateSkillProgression(skills, certs);
      expect(progression.level).toBe(3);
      expect(progression.progressPercent).toBe(75);
    });

    it('calculates Level 4 Master Craftsman for expert artisans with multi-trade certifications', () => {
      const skills: WorkerSkillRecord[] = [
        { id: 1, name: 'Industrial Wiring', proficiency: 'EXPERT', years_of_experience: 6, is_verified: true }
      ];
      const certs: WorkerCertificationRecord[] = [
        {
          id: 10,
          certification_name: 'NCVT Wireman',
          issuing_organization: 'NCVT',
          issue_date: '2023-01-01',
          expiry_date: '2029-01-01',
          verification_status: 'VERIFIED'
        },
        {
          id: 11,
          certification_name: 'Solar PV Master Installer',
          issuing_organization: 'Skill India',
          issue_date: '2024-01-01',
          expiry_date: '2030-01-01',
          verification_status: 'VERIFIED'
        }
      ];
      const progression = calculateSkillProgression(skills, certs);
      expect(progression.level).toBe(4);
      expect(progression.progressPercent).toBe(100);
    });
  });
});
