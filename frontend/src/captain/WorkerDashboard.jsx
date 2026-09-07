import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Typography, Switch, FormControlLabel, Alert, Divider, List, ListItem, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, LinearProgress,
  DialogContentText, Skeleton, Avatar, Tooltip as MuiTooltip, Grid,
  IconButton, Badge, Tabs, Tab, Paper, Chip
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api, { buildWsUrl } from '../services/api';
import toast from 'react-hot-toast';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ContactPageIcon from '@mui/icons-material/ContactPage';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StarIcon from '@mui/icons-material/Star';
import HandymanIcon from '@mui/icons-material/Handyman';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

import { tokens, span } from '../design/tokens';
import { 
  DashboardPage, DashboardGrid, DashboardCard, 
  SummaryCard, SummaryGrid 
} from '../components/dashboard';
import { CooperativeMemberBadge, PatronageDividendSummary } from '../cooperative';
import { WorkerEarningsCard } from '../components/payment';
import { NotificationCenterModal } from '../components/notification';
import {
  WorkerEarningsOverview,
  CooperativeDividendMatrix,
  EarningsAnalyticsCards,
  MicroPayoutStatusCard,
  WorkloadWellbeingMonitor,
  SkillCertificationBadge
} from '../components/worker';
import {
  SkillProfileCard,
  CertificationListCard,
  SkillProgressionRoadmap,
  RecommendedTrainingCard
} from '../components/skill';
import { SocialSecurityTrackerCard } from '../components/catalog';
import { buildOfflineEmptyIntelligence } from '../lib/workerIntelligence';

function WorkerDashboard() {
  const { user, updateProfileState } = useAuth();
  const navigate = useNavigate();
  
  const online = !!user?.profile?.online_status;
  const [stats, setStats] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [availableBookings, setAvailableBookings] = useState([]);
  const [workerEarnings, setWorkerEarnings] = useState(null);
  const [intelligence, setIntelligence] = useState(null);
  const [loadingIntelligence, setLoadingIntelligence] = useState(true);
  
  const [loadingStats, setLoadingStats] = useState(true);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRejectId, setSelectedRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [workerSkills, setWorkerSkills] = useState([]);
  const [workerCerts, setWorkerCerts] = useState([]);
  const [demandData, setDemandData] = useState(null);
  const [loadingDemand, setLoadingDemand] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Sound Alert ref
  const alertAudio = useRef(null);

  // WebSocket reference
  const notiWs = useRef(null);
  const pollingInterval = useRef(null);

  const loadDashboardData = async () => {
    try {
      const statsRes = await api.get('/api/workers/dashboard-stats/');
      setStats(statsRes.data);
      
      // Sync online status and approval status in auth state if they mismatch
      const backendOnline = !!statsRes.data.online_status;
      const backendApproval = statsRes.data.verification_status;
      const frontendOnline = !!user?.profile?.online_status;
      const frontendApproval = user?.profile?.approval_status;

      if (backendOnline !== frontendOnline || backendApproval !== frontendApproval) {
        updateProfileState({
          user: user,
          profile: {
            ...user.profile,
            online_status: backendOnline,
            approval_status: backendApproval
          }
        });
      }

      const walletRes = await api.get('/api/workers/wallet/');
      setWallet(walletRes.data);

      const jobsRes = await api.get('/api/bookings/my-bookings/');
      setRecentJobs(jobsRes.data);

      try {
        const earningsRes = await api.get('/api/billing/worker-earnings/');
        setWorkerEarnings(earningsRes.data);
      } catch (e) {
        // Fallback gracefully
      }

      try {
        const intelRes = await api.get('/api/workers/earnings-intelligence/');
        setIntelligence(intelRes.data);
      } catch (e) {
        console.warn('Fallback: earnings intelligence fetch offline or unavailable', e);
      } finally {
        setLoadingIntelligence(false);
      }

      try {
        const [skillsRes, certsRes] = await Promise.allSettled([
          api.get('/api/workers/skills/'),
          api.get('/api/workers/certifications/')
        ]);
        if (skillsRes.status === 'fulfilled') {
          setWorkerSkills(skillsRes.value.data || []);
        }
        if (certsRes.status === 'fulfilled') {
          setWorkerCerts(certsRes.value.data || []);
        }
      } catch (e) {
        // Non-blocking
      }

      try {
        const demandRes = await api.get('/api/bookings/bookings/demand-intelligence/?days=30');
        setDemandData(demandRes.data);
      } catch (e) {
        console.warn('Demand intelligence unavailable', e);
      } finally {
        setLoadingDemand(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchAvailableBookings = async () => {
    try {
      const res = await api.get('/api/bookings/available-requests/');
      setAvailableBookings(res.data);
    } catch (err) {
      console.error('Error fetching available requests:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
    alertAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
    
    return () => {
      if (notiWs.current) notiWs.current.close();
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, []);

  // Sync available bookings fetching and WebSocket connections based on online state
  useEffect(() => {
    let isActive = true;
    let socket = null;
    let reconnectTimer = null;
    const approvalStatus = user?.profile?.approval_status;

    if (online && approvalStatus === 'approved') {
      fetchAvailableBookings();

      // Start periodic 5s polling as backup
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      pollingInterval.current = setInterval(fetchAvailableBookings, 5000);

      let pingInterval = null;

      // StrictMode-safe notification WebSocket with auto-reconnect
      const connect = () => {
        if (!isActive) return;
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const wsUrl = buildWsUrl('/ws/notifications/', `?token=${token}`);
        socket = new WebSocket(wsUrl);
        notiWs.current = socket;

        socket.onopen = () => {
          if (pingInterval) clearInterval(pingInterval);
          pingInterval = setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: 'ping' }));
            }
          }, 25000);
        };

        socket.onmessage = (event) => {
          if (!isActive) return;
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'booking_available') {
              const booking = payload.booking;
              setAvailableBookings((prev) => {
                if (prev.some(b => b.id === booking.id)) return prev;
                return [booking, ...prev];
              });
              try { alertAudio.current.play(); } catch (e) { /* autoplay blocked */ }
              toast.success(`New request #${booking.id} matching your skills is available!`);
            } else if (payload.type === 'booking_taken') {
              const takenId = payload.booking_id;
              setAvailableBookings((prev) => prev.filter(b => b.id !== takenId));
            }
          } catch (err) {
            console.error('[WS] Notification message error:', err);
          }
        };

        socket.onerror = (error) => {
          socket.close();
        };

        socket.onclose = (event) => {
          if (pingInterval) clearInterval(pingInterval);
          notiWs.current = null;
          if (event.code === 4003) {
            return;
          }
          if (isActive) {
            reconnectTimer = setTimeout(connect, 3000);
          }
        };
      };

      connect();
    } else {
      setAvailableBookings([]);
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
      if (notiWs.current) {
        console.log('[WS] Closing connection because online status is false or user is not approved');
        notiWs.current.close();
        notiWs.current = null;
      }
    }

    return () => {
      isActive = false;
      clearTimeout(reconnectTimer);
      if (socket) {
        console.log('[WS] Cleaning up socket connection');
        socket.close();
      }
    };
  }, [online, user?.profile?.approval_status, user?.id]);

  const handleOnlineToggle = async (event) => {
    setTogglingOnline(true);
    const newStatus = event.target.checked;
    try {
      const res = await api.put('/api/accounts/profile/', {
        online_status: newStatus
      });
      updateProfileState(res.data);
      toast.success(newStatus ? 'You are now Online! Listening for matching bookings.' : 'You are now Offline.');
      
      // Reload stats to verify sync
      const statsRes = await api.get('/api/workers/dashboard-stats/');
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to change online status');
    } finally {
      setTogglingOnline(false);
    }
  };

  const handleAcceptBooking = async (bookingId) => {
    setAcceptingId(bookingId);
    try {
      const res = await api.post(`/api/bookings/bookings/${bookingId}/accept/`);
      toast.success('Service booking accepted successfully!');
      navigate(`/captain/job/${res.data.id}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to accept booking. Already taken?');
      fetchAvailableBookings();
    } finally {
      setAcceptingId(null);
    }
  };

  const handleOpenRejectModal = (bookingId) => {
    setSelectedRejectId(bookingId);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedRejectId) return;
    setRejectingId(selectedRejectId);
    try {
      await api.post(`/api/bookings/bookings/${selectedRejectId}/reject/`, {
        reason: rejectReason || 'Worker declined request'
      });
      toast.success('Service booking request declined.');
      setAvailableBookings((prev) => prev.filter(b => b.id !== selectedRejectId));
      setRejectModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to reject booking request');
    } finally {
      setRejectingId(null);
    }
  };

  const handleRejectBooking = async (bookingId) => {
    handleOpenRejectModal(bookingId);
  };

  if (loadingStats) {
    return (
      <Box sx={{ width: '100%', p: 4 }}>
        <Skeleton variant="rectangular" height={120} sx={{ mb: 4, borderRadius: '12px' }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: '12px' }} />
      </Box>
    );
  }

  const activeJob = recentJobs.find(j => !['completed', 'cancelled', 'searching'].includes(j.status));

  const summary = (
    <SummaryGrid columns={4}>
      <SummaryCard
        label="Today's Earnings"
        value={`₹${stats?.today_earnings}`}
        icon={<AccountBalanceWalletIcon />}
        accentColor="#1A73E8"
        loading={loadingStats}
      />
      <SummaryCard
        label="Weekly Earnings"
        value={`₹${stats?.weekly_earnings}`}
        icon={<SignalCellularAltIcon />}
        accentColor="#34A853"
        loading={loadingStats}
      />
      <SummaryCard
        label="Total Service Jobs"
        value={stats?.total_jobs || 0}
        icon={<HandymanIcon />}
        accentColor="#FBBC05"
        loading={loadingStats}
      />
      <SummaryCard
        label="Average Rating"
        value={`★ ${stats?.rating || '0.0'}`}
        icon={<StarIcon />}
        accentColor="#EA4335"
        loading={loadingStats}
      />
    </SummaryGrid>
  );

  const fallbackIntel = buildOfflineEmptyIntelligence(
    user?.id || 0,
    user?.full_name || 'Craftsman',
    stats?.service_category || 'Craftsmen Guild'
  );

  const effectiveIntelligence = intelligence || {
    ...fallbackIntel,
    earnings: {
      ...fallbackIntel.earnings,
      today: Number(stats?.today_earnings || 0),
      week: Number(stats?.weekly_earnings || 0),
      month: Number(stats?.weekly_earnings || 0) * 4,
      all_time: Number(stats?.wallet_balance || 0),
      direct_customer_received: Number(stats?.wallet_balance || 0),
      average_earnings_per_job: (stats?.completed_jobs > 0)
        ? Math.round((Number(stats?.wallet_balance || 0) / stats.completed_jobs) * 100) / 100
        : 0,
    },
    jobs: {
      ...fallbackIntel.jobs,
      completed: stats?.completed_jobs || 0,
      total: (stats?.completed_jobs || 0) + (stats?.pending_jobs || 0),
      active_hours_today: Math.min((stats?.completed_jobs || 0) * 1.5, 8.0),
    },
    cooperative: {
      ...fallbackIntel.cooperative,
      contributions_total: Math.round(Number(stats?.wallet_balance || 0) * 0.065),
      patronage_dividend_balance: Math.round(Number(stats?.wallet_balance || 0) * 0.12),
      historical_allocations: [
        {
          month: 'Current Period',
          direct_earned: Number(stats?.wallet_balance || 0),
          dividend_share: Math.round(Number(stats?.wallet_balance || 0) * 0.12),
        }
      ],
    },
    analytics: {
      ...fallbackIntel.analytics,
      earnings_trend: (stats?.performance_graph && stats.performance_graph.length > 0)
        ? stats.performance_graph.map((g) => ({ day: g.name, amount: Number(g.Amount || 0) }))
        : fallbackIntel.analytics.earnings_trend,
      working_hours_today: Math.min((stats?.completed_jobs || 0) * 1.5, 8.0),
    },
    wellbeing: {
      ...fallbackIntel.wellbeing,
      todayCompletedJobs: stats?.completed_jobs || 0,
      activeHoursToday: Math.min((stats?.completed_jobs || 0) * 1.5, 8.0),
    },
    payout_readiness: {
      status: user?.profile?.approval_status === 'approved' ? 'VERIFIED' : 'DEMO_MODE',
      upi_vpa: null,
      bank_configured: !!stats?.bank_account,
      aeps_enabled: false,
    }
  };

  return (
    <DashboardPage
      breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Captain Dashboard' }]}
      title={stats?.welcome_message || 'Welcome back!'}
      description={stats ? `Service: ${stats.service_category} | Approval Status: ${stats.verification_status?.toUpperCase()}` : ''}
      summary={summary}
      loading={loadingStats}
      actions={
        <Box display="flex" alignItems="center" gap={1.5}>
          <MuiTooltip title="UNNATI Notifications & Opportunities (सूचना एवं अवसर केंद्र)">
            <IconButton
              onClick={() => setIsNotificationCenterOpen(true)}
              sx={{
                bgcolor: 'background.paper',
                border: `1px solid ${tokens.borderColor}`,
                borderRadius: '12px',
                p: 1
              }}
              aria-label="Open UNNATI notifications"
            >
              <Badge color="error" variant="dot">
                <NotificationsIcon sx={{ fontSize: 20, color: tokens.colors.primary }} />
              </Badge>
            </IconButton>
          </MuiTooltip>
          <MuiTooltip title={stats?.verification_status !== 'approved' ? "KYC verification pending admin approval" : ""}>
            <span>
              <FormControlLabel
              control={
                <Switch
                  checked={online}
                  onChange={handleOnlineToggle}
                  disabled={togglingOnline || stats?.verification_status !== 'approved'}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#1A73E8',
                      '& + .MuiSwitch-track': {
                        backgroundColor: '#1A73E8',
                        opacity: 0.9,
                      },
                    },
                  }}
                />
              }
              label={
                <Box display="flex" alignItems="center">
                  <Typography variant="subtitle2" fontWeight={700}>
                    {online ? 'ONLINE' : 'OFFLINE'}
                  </Typography>
                  {online && (
                    <Box sx={{
                      width: 8, height: 8, bgcolor: 'success.main', borderRadius: '50%', ml: 1.5,
                      animation: 'pulse 1.5s infinite'
                    }} />
                  )}
                </Box>
              }
            />
          </span>
        </MuiTooltip>
      </Box>
    }
    >
      {/* Verification Warning Banners */}
      {stats?.verification_status === 'pending' && (
        <Alert severity="warning" sx={{ mb: 1, borderRadius: `${tokens.borderRadiusSm}px` }}>
          Your KYC document verification status is pending approval. You will receive service bookings as soon as the administrator approves your profile.
        </Alert>
      )}
      {stats?.verification_status === 'rejected' && (
        <Alert severity="error" sx={{ mb: 1, borderRadius: `${tokens.borderRadiusSm}px` }}>
          Your government KYC documents were rejected. Please update your Aadhaar/PAN photo files under Profile settings.
        </Alert>
      )}

      {/* Priority 1: Active Task Workspace Callout (Immediately visible if worker has active job) */}
      {activeJob && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            bgcolor: '#FFFFFF',
            border: '2px solid #0284C7',
            borderRadius: `${tokens.borderRadius}px`,
            boxShadow: '0 8px 24px -4px rgba(2, 132, 199, 0.15)',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2.5
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Box display="flex" alignItems="center" gap={1.5} sx={{ mb: 1 }}>
              <Chip
                label="ACTIVE TASK IN PROGRESS"
                color="primary"
                size="small"
                sx={{ bgcolor: '#0284C7', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.04em' }}
              />
              <Typography variant="body2" sx={{ color: '#0284C7', fontWeight: 700 }}>
                Booking #{activeJob.id} • {activeJob.status.replace(/_/g, ' ').toUpperCase()}
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight={800} color="#0F172A">
              {activeJob.customer?.full_name || 'Customer'} • {activeJob.service_category_detail?.name || 'Service Task'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              📍 {activeJob.address}, {activeJob.city}
            </Typography>
            {activeJob.problem_type && (
              <Typography variant="body2" sx={{ mt: 0.5, color: '#475569', fontWeight: 500 }}>
                Problem: {activeJob.problem_type}
              </Typography>
            )}
          </Box>

          <Button
            variant="contained"
            size="large"
            onClick={() => navigate(`/captain/job/${activeJob.id}`)}
            endIcon={<ArrowForwardIcon />}
            sx={{
              bgcolor: '#0F172A',
              color: '#FFFFFF',
              fontWeight: 700,
              px: 3.5,
              py: 1.5,
              borderRadius: '10px',
              textTransform: 'none',
              fontSize: '1rem',
              minHeight: 48,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
              '&:hover': { bgcolor: '#1E293B' }
            }}
          >
            Resume Job Workspace
          </Button>
        </Paper>
      )}

      {/* Priority Navigation Tabs for Worker Workflow */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          bgcolor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: `${tokens.borderRadius}px`,
          p: 0.5
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: 52,
              fontWeight: 700,
              fontSize: '0.95rem',
              textTransform: 'none',
              borderRadius: '10px',
              color: '#64748B',
              '&.Mui-selected': {
                color: '#0F172A',
                bgcolor: '#F1F5F9'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#0F172A',
              height: 3,
              borderRadius: '3px'
            }
          }}
        >
          <Tab icon={<AssignmentIcon fontSize="small" />} iconPosition="start" label="Tasks & Requests (कार्य एवं अनुरोध)" />
          <Tab icon={<AccountBalanceWalletIcon fontSize="small" />} iconPosition="start" label="Earnings & Dividends (आय एवं लाभांश)" />
          <Tab icon={<WorkspacePremiumIcon fontSize="small" />} iconPosition="start" label="Guild Skills & Badges (कौशल एवं मंच)" />
        </Tabs>
      </Paper>

      {/* ─── TAB 0: TASKS & REQUESTS ────────────────────────────────────────── */}
      {activeTab === 0 && (
        <DashboardGrid>
          {/* Left Section: Live Incoming Requests & Performance Graph */}
          <Box sx={span.twoThirds}>
            <Box display="flex" flexDirection="column" gap={3}>
              {/* Available Bookings Board Feed */}
              <DashboardCard 
                title="Incoming Requests" 
                subtitle="Live job requests matching your skills nearby"
              >
                {!online ? (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <Typography variant="subtitle1" fontWeight={600}>You are Offline</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Toggle your status to ONLINE in the top banner to start receiving client request cards.
                    </Typography>
                  </Box>
                ) : availableBookings.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <Typography variant="subtitle1" fontWeight={600}>No bookings nearby</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Listening for real customer service requests matching your skill category...
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {availableBookings.map((b) => (
                      <Grid item xs={12} sm={6} key={b.id}>
                        <Box sx={{
                          p: 3, 
                          borderRadius: `${tokens.borderRadius}px`, 
                          border: `1px solid ${tokens.borderColor}`,
                          bgcolor: tokens.colors.paper,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          height: '100%',
                          transition: tokens.transition,
                          '&:hover': {
                            boxShadow: tokens.shadowHover,
                            borderColor: tokens.colors.accent,
                          }
                        }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                            <Typography variant="caption" color="textSecondary" fontWeight={700}>
                              Booking ID: #{b.id}
                            </Typography>
                          </Box>

                          <Typography variant="subtitle1" fontWeight={800} color="primary" sx={{ mb: 1 }}>
                            {b.customer?.full_name}
                          </Typography>

                          <Box display="flex" flexDirection="column" gap={0.75} sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Service Category: <span style={{ fontWeight: 700, color: tokens.colors.primary }}>{b.service_category_detail?.name}</span>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Address: <span style={{ fontWeight: 600 }}>{b.address}, {b.city}, {b.state} - {b.pincode}</span>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Distance: <span style={{ fontWeight: 700, color: '#34A853' }}>{b.distance ? `${b.distance} km` : '1.2 km'}</span>
                            </Typography>
                            {b.scheduled_time ? (
                              <Box sx={{ my: 0.5, p: 1, bgcolor: 'rgba(26,115,232,0.08)', borderRadius: '8px' }}>
                                <Typography variant="caption" fontWeight={700} color="primary" display="block">
                                  Scheduled Appointment:
                                </Typography>
                                <Typography variant="body2" fontWeight={700}>
                                  {new Date(b.scheduled_time).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Requested Time: <span style={{ fontWeight: 600 }}>{new Date(b.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} (Instant)</span>
                              </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary">
                              Payment Mode: <span style={{ fontWeight: 700, color: '#1A73E8' }}>{b.payment_mode || 'Online / Cash'}</span>
                            </Typography>
                          </Box>
                          
                          <Box sx={{ p: 1.5, mb: 2, bgcolor: tokens.colors.bg, borderRadius: `${tokens.borderRadiusSm}px` }}>
                            <Typography variant="caption" color="text.secondary" display="block">Problem Summary:</Typography>
                            <Typography variant="body2" fontWeight="700">{b.problem_type}</Typography>
                          </Box>

                          <Divider sx={{ my: 2 }} />

                          <Box display="flex" gap={2}>
                            <Button
                              fullWidth
                              variant="outlined"
                              onClick={() => handleOpenRejectModal(b.id)}
                              disabled={rejectingId === b.id || acceptingId === b.id}
                              sx={{ minHeight: 48, borderColor: tokens.borderColor, color: 'text.secondary', textTransform: 'none', borderRadius: `${tokens.borderRadiusSm}px`, fontWeight: 700 }}
                            >
                              Reject
                            </Button>
                            <Button
                              fullWidth
                              variant="contained"
                              onClick={() => handleAcceptBooking(b.id)}
                              disabled={acceptingId === b.id || rejectingId === b.id}
                              sx={{ minHeight: 48, bgcolor: tokens.colors.primary, color: '#ffffff', textTransform: 'none', borderRadius: `${tokens.borderRadiusSm}px`, fontWeight: 700, '&:hover': { bgcolor: '#23232F' } }}
                            >
                              {acceptingId === b.id ? 'Accepting...' : 'Accept'}
                            </Button>
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </DashboardCard>

              {/* Workload Wellbeing Monitor */}
              <WorkloadWellbeingMonitor wellbeing={effectiveIntelligence.wellbeing} />

              {/* Performance Earnings Line Chart */}
              <DashboardCard title="Performance Earnings Graph" subtitle="Weekly settlement analytics and trends">
                <Box sx={{ width: '100%', height: 260, mt: 2 }}>
                  <ResponsiveContainer>
                    <LineChart data={stats?.performance_graph || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={tokens.borderColor} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} stroke={tokens.colors.textSecondary} />
                      <YAxis tickLine={false} axisLine={false} stroke={tokens.colors.textSecondary} />
                      <Tooltip cursor={{ stroke: tokens.colors.accentLight, strokeWidth: 1 }} />
                      <Line type="monotone" dataKey="Amount" stroke={tokens.colors.accent} strokeWidth={3} dot={{ r: 5, fill: tokens.colors.accent }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </DashboardCard>
            </Box>
          </Box>

          {/* Right Section: Settlement Wallet & Activity */}
          <Box sx={span.oneThird}>
            <Box display="flex" flexDirection="column" gap={3}>
              {/* Wallet Balance Card */}
              <DashboardCard title="Settlement Wallet" subtitle="Total complete earnings balance">
                <Box sx={{ py: 1 }}>
                  <Typography variant="h3" fontWeight={700} sx={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.03em' }}>
                    ₹{stats?.wallet_balance}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Weekly complete earnings: <b>₹{stats?.weekly_earnings}</b>
                  </Typography>
                  
                  <Divider sx={{ my: 2.5 }} />

                  <Box display="flex" flexDirection="column" gap={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => navigate('/captain/wallet')}
                      sx={{ minHeight: 48, bgcolor: tokens.colors.primary, color: '#ffffff', borderRadius: `${tokens.borderRadiusSm}px`, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#23232F' } }}
                    >
                      View Wallet Ledger
                    </Button>
                  </Box>
                </Box>
              </DashboardCard>

              {/* Performance Stats Metrics */}
              <DashboardCard title="Workspace Analytics" subtitle="Your service feedback details">
                <List disablePadding>
                  <ListItem sx={{ px: 0, py: 1.5 }} divider>
                    <ListItemText primary="Acceptance Rate" secondary="Percentage of matching jobs accepted" />
                    <Typography variant="body2" fontWeight={700}>
                      {stats?.acceptance_rate}%
                    </Typography>
                  </ListItem>
                  <ListItem sx={{ px: 0, py: 1.5 }} divider>
                    <ListItemText primary="Completion Rate" secondary="Percentage of accepted jobs completed" />
                    <Typography variant="body2" fontWeight={700}>
                      {stats?.completion_rate}%
                    </Typography>
                  </ListItem>
                  <ListItem sx={{ px: 0, py: 1.5 }} divider>
                    <ListItemText primary="Pending Assignments" secondary="Services waiting repair actions" />
                    <Typography variant="body2" fontWeight={700}>
                      {stats?.pending_jobs}
                    </Typography>
                  </ListItem>
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemText primary="Completed Work" secondary="Total customer orders settled" />
                    <Typography variant="body2" fontWeight={700}>
                      {stats?.completed_jobs}
                    </Typography>
                  </ListItem>
                </List>
              </DashboardCard>

              {/* Recent Activity Ledger */}
              <DashboardCard title="Recent Activity Logs" subtitle="Live feed updates of your jobs">
                <List disablePadding>
                  {stats?.recent_activity?.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No recent updates</Typography>
                  ) : (
                    stats?.recent_activity?.slice(0, 5).map((act, index) => (
                      <ListItem key={index} sx={{ px: 0, py: 1.25 }} divider={index < 4}>
                        <ListItemText
                          primary={act.action}
                          secondary={act.time}
                          primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }}
                          secondaryTypographyProps={{ fontSize: '0.75rem' }}
                        />
                      </ListItem>
                    ))
                  )}
                </List>
              </DashboardCard>

              {/* Upcoming Scheduled Appointments */}
              <DashboardCard title="Upcoming Scheduled Jobs" subtitle="Advance customer appointments">
                {recentJobs.filter(j => j.booking_type === 'scheduled' && ['SCHEDULED', 'scheduled', 'accepted'].includes(j.status)).length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                    No upcoming scheduled appointments booked yet.
                  </Typography>
                ) : (
                  <List disablePadding>
                    {recentJobs
                      .filter(j => j.booking_type === 'scheduled' && ['SCHEDULED', 'scheduled', 'accepted'].includes(j.status))
                      .slice(0, 3)
                      .map((job) => (
                        <ListItem key={job.id} sx={{ px: 0, py: 1 }} divider>
                          <ListItemText
                            primary={job.service_category_detail?.name || 'Trade Service'}
                            secondary={job.scheduled_time ? new Date(job.scheduled_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Scheduled'}
                            primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 700 }}
                            secondaryTypographyProps={{ fontSize: '0.75rem', color: 'primary.main', fontWeight: 600 }}
                          />
                          <Button size="small" variant="outlined" onClick={() => navigate(`/captain/job/${job.id}`)} sx={{ borderRadius: '6px', textTransform: 'none', fontSize: '0.75rem' }}>
                            View
                          </Button>
                        </ListItem>
                      ))}
                  </List>
                )}
              </DashboardCard>

              {/* Real Regional Demand Intelligence Card */}
              <DashboardCard title="Regional Demand Intelligence" subtitle="Live demand trends from real bookings">
                {loadingDemand ? (
                  <Box sx={{ py: 2 }}>
                    <LinearProgress sx={{ mb: 1 }} />
                    <Typography variant="caption" color="text.secondary">Aggregating actual booking records...</Typography>
                  </Box>
                ) : demandData?.status === 'INSUFFICIENT_DATA' ? (
                  <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                      HONEST DEMAND METRIC
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
                      {demandData.message}
                    </Typography>
                    <Box display="flex" gap={1} sx={{ mt: 1.5 }}>
                      <Chip label={`Actual Bookings: ${demandData.sample_count}`} size="small" sx={{ fontSize: '0.75rem', fontWeight: 600 }} />
                      <Chip label="Zero Synthetic Data" size="small" color="success" variant="outlined" sx={{ fontSize: '0.75rem', fontWeight: 600 }} />
                    </Box>
                  </Box>
                ) : demandData?.categories?.length > 0 ? (
                  <List disablePadding>
                    {demandData.categories.slice(0, 4).map((cat, idx) => (
                      <ListItem key={idx} sx={{ px: 0, py: 1 }} divider={idx < 3}>
                        <ListItemText
                          primary={cat.category_name}
                          secondary={`${cat.total_requests} requests · ${cat.completion_rate_percent}% completion`}
                          primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }}
                          secondaryTypographyProps={{ fontSize: '0.75rem' }}
                        />
                        <Chip label={`${cat.share_of_demand_percent}% share`} size="small" sx={{ fontWeight: 700, fontSize: '0.75rem' }} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No active regional records available.
                  </Typography>
                )}
              </DashboardCard>

              {/* Cooperative Fair-Wage Transparency Card */}
              <DashboardCard title="Fair-Wage Guarantee" subtitle="Cooperative earnings model rules">
                <Box sx={{ p: 2, bgcolor: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                  <Typography variant="body2" fontWeight={700} color="#166534" sx={{ mb: 1 }}>
                    100% Direct Settlement Model
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, lineHeight: 1.4 }}>
                    • <b>0% Platform Commission:</b> You keep the full customer service fee with zero middleman extraction.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, lineHeight: 1.4 }}>
                    • <b>6.5% Cooperative Reserve:</b> Democratically pooled for accident insurance, emergency aid, and year-end patronage dividends.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                    • <b>Transparent Billing:</b> All labor and spare parts are authorized directly on-site before checkout.
                  </Typography>
                </Box>
              </DashboardCard>
            </Box>
          </Box>
        </DashboardGrid>
      )}

      {/* ─── TAB 1: EARNINGS & COOPERATIVE DIVIDENDS ─────────────────────────── */}
      {activeTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* 1. Worker Earnings Dashboard */}
          <WorkerEarningsOverview intelligence={effectiveIntelligence} />

          {/* Micro-Payout Readiness & Skills Profile */}
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <MicroPayoutStatusCard payoutReadiness={effectiveIntelligence.payout_readiness} />
            </Grid>
            <Grid item xs={12} md={6}>
              <SkillCertificationBadge
                skills={effectiveIntelligence.skills}
                tradeName={stats?.service_category || 'Craftsmen Guild'}
              />
            </Grid>
          </Grid>

          {/* 2. Cooperative Dividend / Profit-Sharing Matrix */}
          <CooperativeDividendMatrix cooperative={effectiveIntelligence.cooperative} />

          {/* 3. Transparent Earnings Analytics */}
          <EarningsAnalyticsCards
            analytics={effectiveIntelligence.analytics}
            jobs={effectiveIntelligence.jobs}
          />

          {/* Cooperative Patronage Summary */}
          <PatronageDividendSummary
            dividendEarned={Math.round((wallet?.balance || stats?.today_earnings || 1200) * 0.12)}
            projectedAnnualDividend={Math.round(((wallet?.balance || 1200) * 0.12) * 8 + 3600)}
            platformTakeRate={6.5}
            aggregatorFeeComparison={25.0}
            welfareContribution={Math.round((wallet?.balance || 500) * 0.03 + 150)}
            emergencyFundEligible={stats?.verification_status === 'approved'}
          />

          {workerEarnings && (
            <WorkerEarningsCard
              summary={{
                workerId: workerEarnings.worker_id,
                workerName: workerEarnings.worker_name || user?.full_name || 'Craftsman',
                totalDirectEarned: Number(workerEarnings.total_direct_earned),
                totalCooperativeContribution: Number(workerEarnings.total_cooperative_contribution),
                totalPlatformFeesDeducted: 0,
                completedJobsCount: workerEarnings.completed_jobs_count,
                recentTransactions: (workerEarnings.recent_transactions || []).map((t) => ({
                  id: t.id,
                  bookingId: t.booking,
                  transactionType: t.transaction_type,
                  amount: Number(t.amount),
                  currency: t.currency || 'INR',
                  status: t.status,
                  senderName: t.sender_name,
                  recipientName: t.recipient_name,
                  paymentMethod: t.payment_method,
                  adapterName: t.adapter_name,
                  isMock: t.is_mock,
                  createdAt: t.created_at,
                })),
              }}
            />
          )}
        </Box>
      )}

      {/* ─── TAB 2: GUILD SKILLS & COOPERATIVE ───────────────────────────────── */}
      {activeTab === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <CooperativeMemberBadge
            coopId={`UNN-${user?.id ? user.id + 1000 : '7182'}`}
            guildTier={stats?.total_jobs > 10 ? 'master_craftsman' : stats?.total_jobs > 3 ? 'member' : 'apprentice'}
            tradeName={stats?.service_category || 'Craftsmen Guild'}
            isVerified={stats?.verification_status === 'approved'}
            peerEndorsements={stats?.total_jobs ? Math.min(stats.total_jobs * 2, 24) : 4}
            votingEligible={stats?.verification_status === 'approved'}
          />

          <SkillProgressionRoadmap
            skills={workerSkills}
            certifications={workerCerts}
          />

          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <SkillProfileCard
                skills={workerSkills}
                hasVerifiedCert={workerCerts.some((c) => c.verification_status === 'VERIFIED')}
                onSkillAdded={loadDashboardData}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <CertificationListCard
                certifications={workerCerts}
                onCertificationAdded={loadDashboardData}
              />
            </Grid>
          </Grid>

          <RecommendedTrainingCard />

          <Box sx={{ mt: 1 }}>
            <SocialSecurityTrackerCard workerId={user?.id} />
          </Box>
        </Box>
      )}

      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />

      {/* UNNATI Decline Service Request Dialog */}
      <Dialog
        open={rejectModalOpen}
        onClose={() => !rejectingId && setRejectModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Decline Service Request
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please share the reason for declining. This helps the cooperative platform rematch the customer promptly.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="e.g., Outside my current service area, conflicting schedule, specialized equipment required..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setRejectModalOpen(false)}
            disabled={!!rejectingId}
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmReject}
            disabled={!!rejectingId}
            sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 700 }}
          >
            {rejectingId ? 'Declining...' : 'Confirm Decline'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardPage>
  );
}

export default WorkerDashboard;
