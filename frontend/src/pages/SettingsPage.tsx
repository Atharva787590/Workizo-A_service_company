import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Divider,
  Switch,
  Radio,
  Card,
  CardContent
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LanguageIcon from '@mui/icons-material/Language';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import toast from 'react-hot-toast';

import { tokens, span } from '../design/tokens';
import { DashboardPage as RawDashboardPage, DashboardGrid as RawDashboardGrid, DashboardCard as RawDashboardCard } from '../components/dashboard';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility, TextSize } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import { SupportedLanguage } from '../i18n/types';

const DashboardPage = RawDashboardPage as React.ComponentType<any>;
const DashboardGrid = RawDashboardGrid as React.ComponentType<any>;
const DashboardCard = RawDashboardCard as React.ComponentType<any>;

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth() as { user: any };
  const { language, setLanguage, t, supportedLanguages } = useLanguage();
  const {
    highContrast,
    textSize,
    reducedMotion,
    lowBandwidth,
    toggleHighContrast,
    setTextSize,
    toggleReducedMotion,
    toggleLowBandwidth,
    resetSettings: resetAccessibility
  } = useAccessibility();

  // Local sound alerts state persisted in localStorage
  const [soundAlerts, setSoundAlerts] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('unnati_sound_alerts');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const handleSoundAlertsToggle = (checked: boolean) => {
    setSoundAlerts(checked);
    try {
      localStorage.setItem('unnati_sound_alerts', JSON.stringify(checked));
    } catch {
      // ignore
    }
    toast.success(t('settings_save_success'));
  };

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    toast.success(t('settings_save_success'));
  };

  const handleResetDefaults = () => {
    resetAccessibility();
    toast.success(t('settings_reset_success'));
  };

  const getDashboardPath = () => {
    if (!user) return '/home';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'worker') return '/captain/dashboard';
    return '/customer/dashboard';
  };

  return (
    <DashboardPage
      breadcrumbs={[
        { label: t('nav_home'), path: '/home' },
        { label: t('nav_dashboard'), path: getDashboardPath() },
        { label: t('nav_settings') }
      ]}
      title={t('settings_page_title')}
      description={t('settings_page_subtitle')}
      actions={
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(getDashboardPath())}
          sx={{ color: tokens.colors.primary, textTransform: 'none', fontWeight: 700 }}
        >
          {t('settings_back_to_dashboard')}
        </Button>
      }
    >
      <DashboardGrid>
        {/* Left Column (2/3 width) */}
        <Box sx={span.twoThirds}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* 1. Language Selection */}
            <DashboardCard
              title={t('settings_language_section_title')}
              subtitle={t('settings_language_section_subtitle')}
              action={null}
            >
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                  {supportedLanguages.map((langOption) => {
                    const isSelected = language === langOption.code;
                    return (
                      <Card
                        key={langOption.code}
                        variant="outlined"
                        onClick={() => handleLanguageChange(langOption.code)}
                        sx={{
                          cursor: 'pointer',
                          p: 1.5,
                          borderRadius: '12px',
                          borderWidth: isSelected ? 2 : 1,
                          borderColor: isSelected ? tokens.colors.accent : '#E2E8F0',
                          bgcolor: isSelected ? '#F0FDF4' : '#FFFFFF',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: tokens.colors.accent,
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        <CardContent sx={{ p: '12px !important' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isSelected ? '#166534' : '#0F172A' }}>
                              {langOption.nativeName}
                            </Typography>
                            {isSelected ? (
                              <CheckCircleIcon sx={{ color: '#16A34A', fontSize: 20 }} />
                            ) : (
                              <Radio checked={false} size="small" sx={{ p: 0 }} />
                            )}
                          </Box>
                          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 600 }}>
                            {langOption.name}
                            {langOption.code === 'en' && ' (Default)'}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5, minHeight: 32 }}>
                            {langOption.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>

                <Box
                  sx={{
                    mt: 2.5,
                    p: 2,
                    borderRadius: '8px',
                    bgcolor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5
                  }}
                >
                  <LanguageIcon sx={{ color: '#64748B', fontSize: 20 }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('settings_language_explicit_note')}
                  </Typography>
                </Box>
              </Box>
            </DashboardCard>

            {/* 2. Accessibility Preferences */}
            <DashboardCard
              title={t('settings_accessibility_section_title')}
              subtitle={t('settings_accessibility_section_subtitle')}
              action={null}
            >
              <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* High Contrast Mode */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {t('settings_high_contrast_label')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {t('settings_high_contrast_desc')}
                    </Typography>
                  </Box>
                  <Switch
                    checked={highContrast}
                    onChange={toggleHighContrast}
                    aria-label={t('settings_high_contrast_label')}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: tokens.colors.accent,
                        '& + .MuiSwitch-track': {
                          backgroundColor: tokens.colors.accent,
                          opacity: 0.9
                        }
                      }
                    }}
                  />
                </Box>

                <Divider />

                {/* Typography Sizing */}
                <Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {t('settings_text_size_label')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {t('settings_text_size_desc')}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                    {(['normal', 'large', 'extra-large'] as TextSize[]).map((size) => {
                      const isSelected = textSize === size;
                      const label =
                        size === 'normal'
                          ? t('settings_text_size_normal')
                          : size === 'large'
                          ? t('settings_text_size_large')
                          : t('settings_text_size_xlarge');

                      return (
                        <Button
                          key={size}
                          fullWidth
                          variant={isSelected ? 'contained' : 'outlined'}
                          onClick={() => setTextSize(size)}
                          sx={{
                            py: 1.5,
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontWeight: 700,
                            bgcolor: isSelected ? tokens.colors.primary : 'transparent',
                            borderColor: isSelected ? tokens.colors.primary : '#CBD5E1',
                            color: isSelected ? '#FFFFFF' : '#334155',
                            '&:hover': {
                              bgcolor: isSelected ? '#1E293B' : '#F8FAFC'
                            }
                          }}
                        >
                          {label}
                        </Button>
                      );
                    })}
                  </Box>
                </Box>

                <Divider />

                {/* Reduced Motion */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {t('settings_reduced_motion_label')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {t('settings_reduced_motion_desc')}
                    </Typography>
                  </Box>
                  <Switch
                    checked={reducedMotion}
                    onChange={toggleReducedMotion}
                    aria-label={t('settings_reduced_motion_label')}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: tokens.colors.accent,
                        '& + .MuiSwitch-track': {
                          backgroundColor: tokens.colors.accent,
                          opacity: 0.9
                        }
                      }
                    }}
                  />
                </Box>

                <Divider />

                {/* Low Bandwidth Mode */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {t('settings_low_bandwidth_label')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {t('settings_low_bandwidth_desc')}
                    </Typography>
                  </Box>
                  <Switch
                    checked={lowBandwidth}
                    onChange={toggleLowBandwidth}
                    aria-label={t('settings_low_bandwidth_label')}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: tokens.colors.accent,
                        '& + .MuiSwitch-track': {
                          backgroundColor: tokens.colors.accent,
                          opacity: 0.9
                        }
                      }
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-start', pt: 1 }}>
                  <Button
                    startIcon={<RestartAltIcon />}
                    variant="text"
                    onClick={handleResetDefaults}
                    sx={{ textTransform: 'none', color: '#64748B', fontWeight: 600 }}
                  >
                    {t('settings_reset_accessibility')}
                  </Button>
                </Box>
              </Box>
            </DashboardCard>

            {/* 3. Notification Preferences */}
            <DashboardCard
              title={t('settings_notifications_section_title')}
              subtitle={t('settings_notifications_section_subtitle')}
              action={null}
            >
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {t('settings_sound_alerts_label')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {t('settings_sound_alerts_desc')}
                    </Typography>
                  </Box>
                  <Switch
                    checked={soundAlerts}
                    onChange={(e) => handleSoundAlertsToggle(e.target.checked)}
                    aria-label={t('settings_sound_alerts_label')}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: tokens.colors.accent,
                        '& + .MuiSwitch-track': {
                          backgroundColor: tokens.colors.accent,
                          opacity: 0.9
                        }
                      }
                    }}
                  />
                </Box>
              </Box>
            </DashboardCard>

            {/* 4. Policies & Terms */}
            <DashboardCard
              title={t('settings_legal_section_title')}
              subtitle="Platform terms, privacy standards, and cooperative operational policies"
              action={null}
            >
              <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                    {t('settings_legal_terms_title')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                    {t('settings_legal_terms_desc')}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                    {t('settings_legal_privacy_title')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                    {t('settings_legal_privacy_desc')}
                  </Typography>
                </Box>
              </Box>
            </DashboardCard>
          </Box>
        </Box>

        {/* Right Column (1/3 width) - Support Details */}
        <Box sx={span.oneThird}>
          <DashboardCard
            title={t('settings_support_section_title')}
            subtitle={t('settings_support_section_subtitle')}
            action={null}
          >
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                For inquiries regarding platform features, bookings, or account access, reach out to our team:
              </Typography>

              <Box sx={{ p: 2.5, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                    {t('settings_support_email_label')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', mt: 0.25 }}>
                    support@unnati.coop
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                    {t('settings_support_hours_label')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
                    {t('settings_support_hours_val')}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </DashboardCard>
        </Box>
      </DashboardGrid>
    </DashboardPage>
  );
};

export default SettingsPage;
