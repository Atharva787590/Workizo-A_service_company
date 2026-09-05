/** UNNATI Cooperative Design System Tokens */
export const tokens = {
  maxWidth: 1600,
  pagePadding: 32,
  cardPadding: 24,
  cardGap: 24,
  sectionGap: 32,
  borderRadius: 14,
  borderRadiusSm: 8,
  borderRadiusLg: 20,
  borderColor: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  shadow: '0 1px 3px rgba(15, 23, 42, 0.05), 0 4px 12px rgba(15, 23, 42, 0.03)',
  shadowHover: '0 6px 16px rgba(15, 23, 42, 0.06), 0 16px 32px rgba(15, 23, 42, 0.06)',
  shadowElevated: '0 12px 30px rgba(15, 23, 42, 0.10)',
  colors: {
    primary: '#0F172A',         // Slate 900
    accent: '#0284C7',          // Sky 600 (Trust Blue)
    accentLight: '#F0F9FF',     // Sky 50
    brandSaffron: '#D97706',    // Amber 600 (UNNATI Saffron)
    brandSaffronLight: '#FFFBEB',
    success: '#059669',         // Emerald 600 (Fair Wage Green)
    successLight: '#ECFDF5',
    warning: '#D97706',
    warningLight: '#FFFBEB',
    error: '#DC2626',
    errorLight: '#FEF2F2',
    bg: '#F8FAFC',              // Slate 50
    paper: '#FFFFFF',
    surfaceSubtle: '#F1F5F9',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',   // Slate 500
    textMuted: '#94A3B8',       // Slate 400
  },
  grid: {
    columns: { xs: 1, sm: 6, lg: 12 },
    gap: 24,
  },
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  transitionFast: 'all 0.15s ease-in-out',
};

export const span = {
  full: { gridColumn: { xs: '1 / -1' } },
  half: { gridColumn: { xs: '1 / -1', sm: 'span 3', lg: 'span 6' } },
  third: { gridColumn: { xs: '1 / -1', sm: 'span 3', lg: 'span 4' } },
  quarter: { gridColumn: { xs: '1 / -1', sm: 'span 3', lg: 'span 3' } },
  twoThirds: { gridColumn: { xs: '1 / -1', sm: 'span 6', lg: 'span 8' } },
  oneThird: { gridColumn: { xs: '1 / -1', sm: 'span 6', lg: 'span 4' } },
  threeQuarters: { gridColumn: { xs: '1 / -1', sm: 'span 6', lg: 'span 9' } },
  oneQuarter: { gridColumn: { xs: '1 / -1', sm: 'span 3', lg: 'span 3' } },
};
