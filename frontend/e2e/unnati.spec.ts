import { test, expect } from '@playwright/test';

test.describe('UNNATI End-to-End User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept API routes with deterministic mock fixtures
    await page.route('**/api/services/categories/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            name: 'Plumber',
            name_hi: 'प्लंबर',
            description: 'Pipe repairs, drainage solutions and sanitary maintenance',
            base_labour_charge: '350.00',
            typical_duration_hours: '1.5',
            required_skills: ['pipe_threading', 'leak_detection', 'fixture_installation'],
            minimum_experience_level: 'SKILLED',
            is_restricted: false,
            is_active: true,
          },
          {
            id: 2,
            name: 'Electrician',
            name_hi: 'इलेक्ट्रीशियन',
            description: 'Wiring, circuit repairs, and appliance maintenance',
            base_labour_charge: '400.00',
            typical_duration_hours: '2.0',
            required_skills: ['circuit_testing', 'switchboard_wiring'],
            minimum_experience_level: 'SKILLED',
            is_restricted: false,
            is_active: true,
          }
        ]),
      });
    });

    await page.route('**/api/services/providers/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          service_category: 'Plumber',
          total_providers: 1,
          providers: [
            {
              worker_id: 101,
              name: 'Ramesh Patel',
              experience_level: 'CERTIFIED',
              overall_rating: '4.90',
              completed_jobs: 142,
              cooperative_member: true,
              cooperative_status: 'COOPERATIVE_MEMBER',
              approximate_distance_km: '1.8',
              approximate_area: 'Navrangpura, Ahmedabad',
              verified_skills: ['pipe_threading', 'fixture_installation'],
              verified_certifications: ['NSDC Plumber Level 4'],
              availability: 'AVAILABLE',
            }
          ]
        }),
      });
    });

    await page.route('**/api/workers/governance/proposals/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            proposal_id: 'UNN-PROP-001',
            title: 'Annual Equipment Subsidy & Health Reserve Allocation',
            title_hi: 'वार्षिक उपकरण सब्सिडी और स्वास्थ्य कोष आवंटन',
            description: 'Allocate 15% of annual surplus into worker healthcare insurance and zero-interest tool upgrades.',
            proposer_name: 'Ahmedabad Plumbers Guild',
            proposer_role: 'MEMBER',
            voting_options: ['FOR', 'AGAINST', 'ABSTAIN'],
            quorum_required_percentage: 25,
            current_status: 'ACTIVE',
            total_votes: 180,
            vote_tallies: { FOR: 165, AGAINST: 10, ABSTAIN: 5 },
            start_date: '2026-09-01T00:00:00Z',
            end_date: '2026-09-30T23:59:59Z',
            requires_active_membership: true,
            has_voted: false,
          }
        ]),
      });
    });

    await page.route('**/api/workers/governance/elections/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/workers/governance/cases/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
  });

  test('Landing Page renders SIH 2026 value proposition and demo launchpad', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Zero Platform Commission.')).toBeVisible();
    await expect(page.locator('text=100% Direct To Workers.')).toBeVisible();
    await expect(page.locator('button:has-text("Customer Demo")')).toBeVisible();
    await expect(page.locator('button:has-text("Worker Demo")')).toBeVisible();
  });

  test('Public Service Catalog displays categories and providers', async ({ page }) => {
    await page.goto('/services');
    await expect(page.locator('text=Fair-Wage Home & Trade Services')).toBeVisible();
    await expect(page.locator('text=Plumber').first()).toBeVisible();
  });

  test('Transparency Hub renders fair wage and non-custodial breakdown', async ({ page }) => {
    await page.goto('/transparency');
    await expect(page.locator('text=Democracy, Fair Wages & Zero Platform Exploitation')).toBeVisible();
    await expect(page.locator('text=Public Audit Transparency')).toBeVisible();
  });

  test('Democratic Governance Dashboard renders proposals', async ({ page }) => {
    await page.goto('/governance');
    await expect(page.locator('text=Cooperative Governance & Voting')).toBeVisible();
    await expect(page.locator('text=Table New Proposal').first()).toBeVisible();
  });

  test('Accessibility Toolbar opens and toggles preferences', async ({ page }) => {
    await page.goto('/home');
    const a11yButton = page.locator('aside[aria-label="Accessibility Assistance"] button');
    await expect(a11yButton).toBeVisible();
    await a11yButton.click();
    await expect(page.locator('#a11y-dialog-title')).toHaveText('Accessibility & Network');
  });

  test('Voice Assistant Button opens assistant modal', async ({ page }) => {
    await page.goto('/home');
    const voiceButton = page.locator('button[aria-label="Open UNNATI Voice Assistant"]');
    await expect(voiceButton).toBeVisible();
    await voiceButton.click();
    await expect(page.locator('text=UNNATI Voice Assistant')).toBeVisible();
  });
});
