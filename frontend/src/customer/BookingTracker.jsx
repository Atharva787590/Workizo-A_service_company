import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Box, Button, Typography, Divider, List, ListItem, ListItemText, 
  Dialog, DialogTitle, DialogContent, DialogActions, Rating, TextField, 
  LinearProgress, CircularProgress, Grid, ListItemIcon,
  IconButton, Avatar, Paper, Breadcrumbs, Chip
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import api, { buildWsUrl, buildApiUrl } from '../services/api';
import toast from 'react-hot-toast';

// Icons
import PhoneIcon from '@mui/icons-material/Phone';
import ChatIcon from '@mui/icons-material/Chat';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import TimelineIcon from '@mui/icons-material/Timeline';
import InfoIcon from '@mui/icons-material/Info';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import OpacityIcon from '@mui/icons-material/Opacity';
import CarpenterIcon from '@mui/icons-material/Carpenter';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ConstructionIcon from '@mui/icons-material/Construction';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import HandymanIcon from '@mui/icons-material/Handyman';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import RoomIcon from '@mui/icons-material/Room';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import StarIcon from '@mui/icons-material/Star';
import PrintIcon from '@mui/icons-material/Print';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';

import { tokens } from '../design/tokens';
import { DashboardPage, DashboardGrid, DashboardCard } from '../components/dashboard';



const CATEGORY_STYLES = {
  'Electrician': {
    icon: <FlashOnIcon sx={{ fontSize: 32, color: '#f59e0b' }} />,
    bgColor: 'rgba(245, 158, 11, 0.10)',
    borderColor: '#f59e0b',
  },
  'Plumber': {
    icon: <OpacityIcon sx={{ fontSize: 32, color: '#3b82f6' }} />,
    bgColor: 'rgba(59, 130, 246, 0.10)',
    borderColor: '#3b82f6',
  },
  'Carpenter': {
    icon: <CarpenterIcon sx={{ fontSize: 32, color: '#10b981' }} />,
    bgColor: 'rgba(16, 185, 129, 0.10)',
    borderColor: '#10b981',
  },
  'AC Technician': {
    icon: <AcUnitIcon sx={{ fontSize: 32, color: '#06b6d4' }} />,
    bgColor: 'rgba(6, 182, 212, 0.10)',
    borderColor: '#06b6d4',
  },
  'Mechanic': {
    icon: <ConstructionIcon sx={{ fontSize: 32, color: '#ef4444' }} />,
    bgColor: 'rgba(239, 68, 68, 0.10)',
    borderColor: '#ef4444',
  },
  'Home Cleaning': {
    icon: <CleaningServicesIcon sx={{ fontSize: 32, color: '#8b5cf6' }} />,
    bgColor: 'rgba(139, 92, 246, 0.10)',
    borderColor: '#8b5cf6',
  }
};

const STEPPER_STEPS = [
  { key: 'searching', label: 'Searching' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'on_the_way', label: 'On The Way' },
  { key: 'arrived', label: 'Arrived' },
  { key: 'repair_started', label: 'Work Started' },
  { key: 'ready_to_complete', label: 'Payment Confirmed' },
  { key: 'completed', label: 'Completed' }
];

const getStatusBadgeStyle = (status) => {
  switch (status) {
    case 'searching':
      return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' };
    case 'accepted':
    case 'on_the_way':
      return { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)' };
    case 'arrived':
    case 'verified':
      return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' };
    case 'inspection':
    case 'repair_started':
      return { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)' };
    case 'repair_completed':
    case 'waiting_approval':
      return { color: '#d97706', bg: 'rgba(217, 119, 6, 0.08)' };
    case 'WAITING_FOR_CASH_CONFIRMATION':
      return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' };
    case 'ready_to_complete':
      return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' };
    case 'completed':
      return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' };
    default:
      return { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.08)' };
  }
};

const getStatusIndex = (booking) => {
  if (!booking) return -1;
  const status = booking.status;

  switch (status) {
    case 'searching':
      return 0;
    case 'accepted':
      return 1;
    case 'on_the_way':
      return 2;
    case 'arrived':
    case 'verified':
      return 3;
    case 'inspection':
    case 'repair_started':
    case 'repair_completed':
    case 'waiting_approval':
    case 'WAITING_FOR_CASH_CONFIRMATION':
      return 4;
    case 'ready_to_complete':
      return 5;
    case 'completed':
      return 6;
    default:
      return -1;
  }
};

const STATUS_MILITARY_HIERARCHY = [
  'searching', 'accepted', 'on_the_way', 'arrived', 'verified', 
  'inspection', 'repair_started', 'repair_completed', 'waiting_approval', 
  'WAITING_FOR_CASH_CONFIRMATION', 'ready_to_complete', 'completed'
];

const isStatusAtLeast = (currentStatus, targetStatus) => {
  const currentIdx = STATUS_MILITARY_HIERARCHY.indexOf(currentStatus);
  const targetIdx = STATUS_MILITARY_HIERARCHY.indexOf(targetStatus);
  return currentIdx >= targetIdx;
};

function BookingTracker() {
  const { bookingId } = useParams();
  const id = String(bookingId);
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi');
  const [onlinePaymentFailed, setOnlinePaymentFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');


  const ws = useRef(null);

  // Fetch initial details wrapped in useCallback to prevent infinite render loops
  const fetchDetails = useCallback(async () => {
    try {
      const res = await api.get(`/api/bookings/bookings/${id}/`);
      setBooking(res.data);
      
      // Fetch bill if status matches
      if (['repair_completed', 'waiting_approval', 'completed', 'WAITING_FOR_CASH_CONFIRMATION'].includes(res.data.status)) {
        try {
          const billRes = await api.get(`/api/billing/${id}/get-bill/`);
          setBill(billRes.data);
        } catch (e) {
          setBill(null);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchDetails();

    // Setup WebSocket connection
    let isActive = true;
    let socket = null;
    let reconnectTimer = null;

    const connect = () => {
      if (!isActive) return;

      const token = localStorage.getItem('access_token');
      const wsUrl = buildWsUrl(`/ws/bookings/${id}/`, `?token=${token}`);
      socket = new WebSocket(wsUrl);
      ws.current = socket;

      socket.onmessage = (event) => {
        if (!isActive) return;
        try {
          const payload = JSON.parse(event.data);
          const acceptedTypes = [
            'booking_created',
            'booking_accepted',
            'captain_arriving',
            'work_started',
            'work_completed',
            'payment_pending',
            'payment_completed',
            'booking_status'
          ];
          if (acceptedTypes.includes(payload.type)) {
            setBooking(payload.booking);
            if (payload.type === 'booking_accepted') {
              toast.success(`${payload.booking.worker?.full_name || 'Captain'} accepted your booking!`);
            }
            if (['repair_completed', 'waiting_approval', 'completed'].includes(payload.booking.status)) {
              api.get(`/api/billing/${id}/get-bill/`)
                .then(res => setBill(res.data))
                .catch(() => setBill(null));
            }
          }
        } catch (err) {
          console.error('[WS] Message parse error:', err);
        }
      };

      socket.onerror = () => {
        socket.close();
      };

      socket.onclose = () => {
        ws.current = null;
        if (isActive) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      isActive = false;
      clearTimeout(reconnectTimer);
      if (socket) socket.close();
    };
  }, [id]);

  const handleApproveRepair = async (approvalId, statusVal) => {
    try {
      await api.post(`/api/bookings/bookings/${id}/respond-major-repair/`, {
        approval_id: approvalId,
        status: statusVal
      });
      toast.success(`Repair estimate ${statusVal}`);
      fetchDetails();
    } catch (err) {
      toast.error('Failed to submit estimate response');
    }
  };

  const handleApproveBill = async () => {
    try {
      const res = await api.post(`/api/billing/${id}/approve-bill/`);
      setBill(res.data);
      toast.success('Bill invoice approved successfully.');
      fetchDetails();
    } catch (err) {
      toast.error('Failed to approve bill invoice');
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayOnline = async () => {
    setPaying(true);
    setOnlinePaymentFailed(false);
    setErrorMessage('');
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Razorpay SDK failed to load. Are you online?');
        setPaying(false);
        return;
      }

      const res = await api.post(`/api/billing/${id}/initiate-online-payment/`);
      const { order_id, amount, currency, key_id } = res.data;

      const options = {
        key: key_id,
        amount: amount,
        currency: currency,
        name: "WORKIZO",
        description: `Payment for Booking #${id}`,
        order_id: order_id,
        handler: async function (response) {
          setPaying(true);
          try {
            await api.post(`/api/billing/${id}/verify-online-payment/`, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
            toast.success('Payment completed successfully!');
            setPaymentSuccess(true);
            fetchDetails();
          } catch (err) {
            const errDetail = err.response?.data?.detail || 'Signature verification failed.';
            toast.error(errDetail);
            setOnlinePaymentFailed(true);
            setErrorMessage(errDetail);
          } finally {
            setPaying(false);
          }
        },
        prefill: {
          name: booking?.customer?.full_name || '',
          email: booking?.customer?.email || '',
          contact: booking?.customer?.phone || ''
        },
        theme: {
          color: "#0F0F14"
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
            toast.error('Payment cancelled.');
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error(err);
      const errDetail = err.response?.data?.detail || 'Initiating payment failed.';
      toast.error(errDetail);
      setOnlinePaymentFailed(true);
      setErrorMessage(errDetail);
      setPaying(false);
    }
  };

  const handlePayByCash = async () => {
    setPaying(true);
    try {
      await api.post(`/api/billing/${id}/select-cash-payment/`);
      toast.success('Cash payment option selected.');
      fetchDetails();
    } catch (err) {
      toast.error('Failed to select cash payment.');
    } finally {
      setPaying(false);
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      const response = await api.get(`/api/billing/${id}/download-receipt/`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      toast.error('Failed to download receipt');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleDownloadInvoice = async () => {
    try {
      const response = await api.get(`/api/billing/${id}/download-invoice/`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      toast.error('Failed to download invoice');
    }
  };


  const handleSubmitRating = async () => {
    setSubmittingRating(true);
    try {
      await api.post('/api/services/rate-booking/', {
        booking_id: id,
        rating,
        review
      });
      toast.success('Thank you for rating your experience!');
      fetchDetails();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmittingRating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Check-in OTP code copied!');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={48} sx={{ color: tokens.colors.primary }} />
      </Box>
    );
  }

  if (!booking) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error">Booking Details Not Found</Typography>
        <Button variant="contained" onClick={() => navigate('/customer/dashboard')} sx={{ mt: 3, bgcolor: tokens.colors.primary }}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  const categoryName = booking.service_category_detail?.name || 'Service Request';
  const catStyle = CATEGORY_STYLES[categoryName] || {
    icon: <HandymanIcon sx={{ fontSize: 32, color: tokens.colors.primary }} />,
    bgColor: 'rgba(0,0,0,0.05)',
    borderColor: tokens.borderColor,
  };

  const currentStepIdx = getStatusIndex(booking);
  const statusBadge = getStatusBadgeStyle(booking.status);

  // Generate dynamic event logs based on state
  const getEventLogs = () => {
    const events = [];
    const formattedDate = new Date(booking.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    
    events.push({
      time: formattedDate,
      title: "Booking Created",
      desc: `Service request placed successfully for ${categoryName}.`,
      active: true
    });

    if (booking.worker) {
      events.push({
        time: "Just now",
        title: "Captain Assigned",
        desc: `Captain ${booking.worker.full_name} is assigned to resolve your request.`,
        active: isStatusAtLeast(booking.status, 'accepted')
      });
    }

    if (isStatusAtLeast(booking.status, 'on_the_way')) {
      events.push({
        time: "Updated",
        title: "Captain Traveling",
        desc: "Captain has initiated the journey to your service address.",
        active: isStatusAtLeast(booking.status, 'on_the_way')
      });
    }

    if (isStatusAtLeast(booking.status, 'arrived')) {
      events.push({
        time: "Arrived",
        title: "Captain Arrived",
        desc: "Captain reached your destination. Pending secure check-in verification code.",
        active: isStatusAtLeast(booking.status, 'arrived')
      });
    }

    if (isStatusAtLeast(booking.status, 'verified')) {
      events.push({
        time: "Started",
        title: "Work Started",
        desc: "Secure check-in code verified. Diagnosis and repair works are underway.",
        active: isStatusAtLeast(booking.status, 'verified')
      });
    }

    if (isStatusAtLeast(booking.status, 'completed')) {
      events.push({
        time: "Completed",
        title: "Service Completed",
        desc: "Repair finished. Bill paid and booking closed successfully.",
        active: true
      });
    }

    return events.reverse();
  };

  return (
    <Box sx={{ maxWidth: '1300px', margin: '0 auto', px: { xs: 2, md: 4 }, py: 3 }}>
      {/* Top Header with Breadcrumbs & Action Buttons */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Breadcrumbs separator="›" aria-label="breadcrumb" sx={{ fontSize: '0.875rem' }}>
          <Link to="/customer/dashboard" style={{ textDecoration: 'none', color: tokens.colors.textSecondary, fontWeight: 500 }}>
            Home
          </Link>
          <Link to="/customer/dashboard" style={{ textDecoration: 'none', color: tokens.colors.textSecondary, fontWeight: 500 }}>
            My Bookings
          </Link>
          <Typography color="text.primary" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
            Booking Details
          </Typography>
        </Breadcrumbs>

        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/customer/dashboard')}
            sx={{ bgcolor: tokens.colors.primary, color: '#ffffff', px: 3, py: 1.25, borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.875rem', '&:hover': { bgcolor: '#23232F' } }}
          >
            Back to Dashboard
          </Button>
          <Button
            variant="outlined"
            startIcon={<HeadsetMicIcon />}
            onClick={() => toast.success('Connecting with Workizo Support...')}
            sx={{ borderColor: tokens.colors.primary, color: tokens.colors.primary, px: 3, py: 1.25, borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.875rem' }}
          >
            Contact Support
          </Button>
        </Box>
      </Box>

      {/* SECTION 2: Large Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, border: `1px solid ${tokens.borderColor}`, borderRadius: '18px', bgcolor: tokens.colors.paper, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={7} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tracking ID
              </Typography>
              <Typography variant="h3" fontWeight={900} sx={{ fontFamily: 'Outfit, sans-serif', color: tokens.colors.primary, fontSize: { xs: '1.75rem', md: '2.25rem' }, lineHeight: 1.2 }}>
                {booking.tracking_id || `WRK-${booking.id + 10000}`}
              </Typography>
            </Box>
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Service Category
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: tokens.colors.textSecondary }}>
                {categoryName}
              </Typography>
            </Box>
            <Box sx={{ alignSelf: 'flex-start', mt: 0.5 }}>
              <Box sx={{ px: 2, py: 0.75, borderRadius: '20px', bgcolor: statusBadge.bg, display: 'inline-flex', alignItems: 'center' }}>
                <Typography variant="caption" fontWeight={800} sx={{ color: statusBadge.color, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.75rem' }}>
                  {booking.status.replace('_', ' ')}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%', maxWidth: '340px', ml: { md: 'auto' } }}>
              {[
                { label: 'Booking Date', value: new Date(booking.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
                { label: 'Booking ID', value: `#${booking.id}` },
                { label: 'Payment Status', value: (booking.payment?.status === 'PAID' || ['ready_to_complete', 'completed'].includes(booking.status)) ? 'Paid' : 'Pending', color: (booking.payment?.status === 'PAID' || ['ready_to_complete', 'completed'].includes(booking.status)) ? '#10b981' : '#e11d48' },
                { label: 'Payment Method', value: booking.payment?.method ? booking.payment.method.toUpperCase() : 'N/A' },
                { label: 'Requested Time', value: new Date(booking.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }
              ].map((item, idx) => (
                <Box key={idx} display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    {item.label}
                  </Typography>
                  <Typography variant="body2" fontWeight={800} sx={{ color: item.color || tokens.colors.primary }}>
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* SECTION 3: Top Info Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Category', value: categoryName, icon: React.cloneElement(catStyle.icon, { sx: { fontSize: 36, color: '#8F00FF' } }) },
          { label: 'Service Status', value: booking.status.replace('_', ' ').toUpperCase(), icon: <TimelineIcon sx={{ fontSize: 36, color: statusBadge.color }} /> },
          { label: 'Mode', value: 'Instant', icon: <FlashOnIcon sx={{ fontSize: 36, color: '#f59e0b' }} /> },
          { label: 'Captain Assigned', value: booking.worker?.full_name || 'Searching...', icon: <PersonIcon sx={{ fontSize: 36, color: '#1A73E8' }} /> }
        ].map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Paper elevation={0} sx={{ p: 2, border: `1px solid ${tokens.borderColor}`, borderRadius: '18px', display: 'flex', alignItems: 'center', gap: 2, height: '100%', bgcolor: tokens.colors.paper, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <Box sx={{ p: 1.25, borderRadius: '12px', bgcolor: 'rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {card.icon}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {card.label}
                </Typography>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: tokens.colors.primary, fontFamily: 'Outfit', mt: 0.25 }}>
                  {card.value}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* SECTION 5: FULL WIDTH TIMELINE STEPPER */}
      <Paper elevation={0} sx={{ p: 4, mb: 4, border: `1px solid ${tokens.borderColor}`, borderRadius: '18px', bgcolor: tokens.colors.paper, minHeight: '240px', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 4, color: tokens.colors.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Service Tracking
        </Typography>
        <Box sx={{ width: '100%', position: 'relative', px: { xs: 1, md: 3 }, overflowX: { xs: 'auto', md: 'visible' } }}>
          <Box sx={{ minWidth: { xs: '840px', md: 'auto' }, position: 'relative', py: 1 }}>
            {/* Progress Connector Line */}
            <Box sx={{ 
              position: 'absolute', top: '22px', left: 'calc(100% / 14)', right: 'calc(100% / 14)', height: '4px', 
              bgcolor: '#E5E7EB', zIndex: 1 
            }}>
              <Box sx={{ 
                width: `${currentStepIdx >= 0 ? (currentStepIdx / 6) * 100 : 0}%`, 
                height: '100%', bgcolor: '#1E3A8A', transition: 'width 0.4s ease' 
              }} />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              {[
                { key: 'searching', label: 'Searching', desc: 'Finding nearby captain' },
                { key: 'accepted', label: 'Accepted', desc: 'Captain assigned' },
                { key: 'on_the_way', label: 'On The Way', desc: 'Traveling to location' },
                { key: 'arrived', label: 'Arrived', desc: 'Captain at site' },
                { key: 'repair_started', label: 'Work Started', desc: 'Repairs in progress' },
                { key: 'ready_to_complete', label: 'Payment Confirmed', desc: 'Payment received successfully' },
                { key: 'completed', label: 'Completed', desc: 'Service finished' }
              ].map((step, idx) => {
                const isActive = currentStepIdx === idx;
                const isCompleted = currentStepIdx > idx;

                let circleBg = '#ffffff';
                let circleBorder = '#D1D5DB';
                let circleColor = '#9CA3AF';
                let labelColor = tokens.colors.textSecondary;

                if (isActive) {
                  circleBg = '#1A73E8';
                  circleBorder = '#1A73E8';
                  circleColor = '#ffffff';
                  labelColor = '#1A73E8';
                } else if (isCompleted) {
                  circleBg = '#1E3A8A';
                  circleBorder = '#1E3A8A';
                  circleColor = '#ffffff';
                  labelColor = '#1E3A8A';
                }

                return (
                  <Box key={idx} sx={{ zIndex: 2, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 1 0', minWidth: 0 }}>
                    <motion.div
                      animate={isActive ? { scale: [1, 1.12, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <Box sx={{
                        width: '44px', height: '44px', borderRadius: '50%',
                        bgcolor: circleBg,
                        border: `2px solid ${circleBorder}`,
                        color: circleColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '1rem', mb: 1.5,
                        boxShadow: isActive ? '0 0 12px rgba(26, 115, 232, 0.4)' : 'none'
                      }}>
                        {isCompleted ? '✓' : idx + 1}
                      </Box>
                    </motion.div>
                    <Typography 
                      variant="body2" 
                      fontWeight={600} 
                      sx={{ color: labelColor, display: 'block', mb: 0.5, fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                    >
                      {step.label}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ color: '#6B7280', display: 'block', fontSize: '0.68rem', maxWidth: '100px', lineHeight: 1.3, mx: 'auto' }}
                    >
                      {step.desc}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* SECTION 4: Two Column Layout */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: '1fr 1fr',
            lg: '42% 1fr'
          },
          gap: 3,
          alignItems: 'start'
        }}
      >
        {/* RIGHT COLUMN - Activity, Progress & Payment */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, order: 2 }}>
            
            {/* Live Service Status Feed */}
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: -1 }}>
              Live Service Status Feed
            </Typography>

            {/* Service Progress Card */}
            <Paper elevation={0} sx={{ p: 3, border: `1px solid ${tokens.borderColor}`, borderRadius: '18px', bgcolor: tokens.colors.paper, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <Box display="flex" gap={2.5} alignItems="flex-start">
                <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                  <Box sx={{ p: 2, borderRadius: '16px', bgcolor: catStyle.bgColor, border: `1px solid ${catStyle.borderColor}`, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {catStyle.icon}
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: catStyle.borderColor, fontSize: '0.72rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {categoryName}
                  </Typography>
                </Box>
                <Box flex={1}>
                  <Typography variant="h6" fontWeight={800} color={tokens.colors.primary}>
                    {booking.status === 'searching' && "Broadcasting request to nearby Captains..."}
                    {booking.status === 'accepted' && `${booking.worker?.full_name || 'Captain'} accepted your booking.`}
                    {booking.status === 'on_the_way' && "Captain is en route to your place"}
                    {booking.status === 'arrived' && "Captain reached your location"}
                    {booking.status === 'verified' && "Check-in successful, diagnosing repair..."}
                    {['inspection', 'repair_started'].includes(booking.status) && "Service repairs are actively in progress..."}
                    {booking.status === 'repair_completed' && "Repairs done! Invoice pending checkout"}
                    {booking.status === 'waiting_approval' && "Invoice awaiting your checkout approval"}
                    {booking.status === 'WAITING_FOR_CASH_CONFIRMATION' && "Cash payment selected — awaiting confirmation"}
                    {booking.status === 'ready_to_complete' && "Payment confirmed! Awaiting captain checkout"}
                    {booking.status === 'completed' && "Booking finished and closed!"}
                    {booking.status === 'cancelled' && "Booking request was cancelled."}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                    {booking.status === 'searching' && "Our system is connecting with approved service partners in your vicinity. Standard pickup window is 2-5 minutes."}
                    {booking.status === 'accepted' && "Your assigned Captain has confirmed receipt. They are preparing specialized tools for the booking."}
                    {booking.status === 'on_the_way' && `Captain ${booking.worker?.full_name} is on the way. Estimated time of arrival is 15 minutes.`}
                    {booking.status === 'arrived' && "The partner has arrived at your address. Please provide the 8-digit check-in verification OTP code to unlock service."}
                    {booking.status === 'verified' && "Check-in complete. The partner has gained authorization and is running initial hardware inspection."}
                    {['inspection', 'repair_started'].includes(booking.status) && "The captain is actively implementing the repair tasks. Progress updates will sync here automatically."}
                    {booking.status === 'repair_completed' && "Service job finished successfully. The invoice statement has been built by the partner."}
                    {booking.status === 'waiting_approval' && "Captain is seeking estimate approval for spare parts. Please check details below to proceed."}
                    {booking.status === 'WAITING_FOR_CASH_CONFIRMATION' && "You selected cash payment. Please hand the payment to the captain for confirmation."}
                    {booking.status === 'ready_to_complete' && "Your payment has been confirmed. The captain is finalizing job details and will close the booking shortly."}
                    {booking.status === 'completed' && "Thank you for using WORKIZO! The billing invoice has been cleared and payment was successful."}
                    {booking.status === 'cancelled' && "This booking request was cancelled and terminated."}
                  </Typography>


                </Box>
              </Box>
            </Paper>

            {/* SECTION 6: OTP VERIFICATION CARD */}
            {booking.status === 'arrived' && (
              <Paper elevation={0} sx={{ p: 3, border: `1px solid ${tokens.borderColor}`, borderRadius: '18px', bgcolor: tokens.colors.paper, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <Box display="flex" flexDirection="column" alignItems="center">
                  <QrCode2Icon sx={{ fontSize: 56, color: tokens.colors.primary, mb: 1.5 }} />
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                    Service Check-In Code
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1.5} sx={{ bgcolor: 'rgba(0,0,0,0.02)', px: 3, py: 1.5, borderRadius: '12px', border: `1px solid ${tokens.borderColor}`, mb: 1.5 }}>
                    <Typography variant="h5" fontWeight={800} color="primary" sx={{ letterSpacing: 3, fontFamily: 'Outfit' }}>
                      {booking.qr_code_value ? String(booking.qr_code_value).substring(0, 8).toUpperCase() : 'N/A'}
                    </Typography>
                    <IconButton size="small" onClick={() => copyToClipboard(String(booking.qr_code_value).substring(0, 8).toUpperCase())}>
                      <FileCopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ maxWidth: '400px', lineHeight: 1.5 }}>
                    Provide this check-in OTP code to the Captain ONLY after they reach your location to securely start work.
                  </Typography>
                </Box>
              </Paper>
            )}

            {/* Major Repair Estimates Approval */}
            {booking.major_repairs && booking.major_repairs.length > 0 && (
              <Box>
                {booking.major_repairs.map((rep) => (
                  <Paper key={rep.id} elevation={0} sx={{ p: 3, mb: 2, border: `1px solid ${rep.status === 'pending' ? tokens.colors.primary : tokens.borderColor}`, borderRadius: '18px', bgcolor: tokens.colors.paper, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Major Repair Approval Estimate
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                      Captain requires authorization to install spare parts
                    </Typography>
                    <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: '12px', mb: 2 }}>
                      <Typography variant="h6" fontWeight={700} color="primary">
                        Cost Estimate: ₹{rep.estimated_cost}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Reason: {rep.reason}
                      </Typography>
                    </Box>
                    {rep.status === 'pending' ? (
                      <Box display="flex" gap={2}>
                        <Button variant="contained" color="success" onClick={() => handleApproveRepair(rep.id, 'approved')} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}>
                          Approve
                        </Button>
                        <Button variant="outlined" color="error" onClick={() => handleApproveRepair(rep.id, 'rejected')} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}>
                          Reject
                        </Button>
                      </Box>
                    ) : (
                      <Box sx={{ px: 2, py: 0.5, borderRadius: '20px', display: 'inline-block', bgcolor: rep.status === 'approved' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)' }}>
                        <Typography variant="caption" fontWeight={700} color={rep.status === 'approved' ? 'success.main' : 'error.main'}>
                          ESTIMATE {rep.status.toUpperCase()}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                ))}
              </Box>
            )}

            {/* SECTION 8: PAYMENT CARD & WORKFLOW */}
            {bill && (
              <Box sx={{ width: '100%', order: -1 }}>
                {booking.status === 'completed' ? (
                  /* PROFESSIONAL RECEIPT DISPLAY */
                  <Paper id="printable-receipt" elevation={0} sx={{ p: 4, border: `1.5px solid ${tokens.borderColor}`, borderRadius: '20px', bgcolor: tokens.colors.paper, boxShadow: '0 8px 30px rgba(0,0,0,0.04)', position: 'relative' }}>
                    <style dangerouslySetInnerHTML={{__html: `
                      @media print {
                        body * {
                          visibility: hidden;
                        }
                        #printable-receipt, #printable-receipt * {
                          visibility: visible;
                        }
                        #printable-receipt {
                          position: absolute;
                          left: 0;
                          top: 0;
                          width: 100%;
                          border: none !important;
                          box-shadow: none !important;
                          padding: 0 !important;
                        }
                        .no-print {
                          display: none !important;
                        }
                      }
                    `}} />
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                      <Typography variant="h5" fontWeight={800} sx={{ color: tokens.colors.primary, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
                        WORKIZO
                      </Typography>
                      <Chip label="PAYMENT RECEIPT" color="success" size="small" sx={{ fontWeight: 800, borderRadius: '6px' }} />
                    </Box>
                    
                    <Divider sx={{ mb: 3 }} />
                    
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>Receipt Number</Typography>
                        <Typography variant="body2" fontWeight={700}>{booking.payment?.receipt_number || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>Booking ID / Tracking ID</Typography>
                        <Typography variant="body2" fontWeight={700}>#{booking.id} / {booking.tracking_id || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>Customer Name</Typography>
                        <Typography variant="body2" fontWeight={700}>{booking.customer?.full_name}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>Assigned Captain</Typography>
                        <Typography variant="body2" fontWeight={700}>{booking.worker?.full_name || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>Service Category</Typography>
                        <Typography variant="body2" fontWeight={700}>{booking.service_category_detail?.name}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>Payment Method / Status</Typography>
                        <Typography variant="body2" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                          {booking.payment?.method || 'N/A'} / {booking.payment?.status || 'PAID'}
                        </Typography>
                      </Grid>
                      
                      {booking.payment?.method === 'ONLINE' && booking.payment?.transaction_id && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>Transaction ID (Online)</Typography>
                          <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>{booking.payment.transaction_id}</Typography>
                        </Grid>
                      )}
                      
                      {booking.payment?.method === 'CASH' && booking.payment?.cash_confirmation_timestamp && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cash Confirmation Time</Typography>
                          <Typography variant="body2" fontWeight={700}>{new Date(booking.payment.cash_confirmation_timestamp).toLocaleString()}</Typography>
                        </Grid>
                      )}
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>Payment Date & Time</Typography>
                        <Typography variant="body2" fontWeight={700}>{booking.payment?.payment_time ? new Date(booking.payment.payment_time).toLocaleString() : new Date().toLocaleString()}</Typography>
                      </Grid>
                    </Grid>
                    
                    <Divider sx={{ mb: 3 }} />
                    
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Payment Breakdowns
                    </Typography>
                    <List disablePadding>
                      <ListItem sx={{ py: 0.75, px: 0 }}>
                        <ListItemText primary="Service/Labour base charges" />
                        <Typography variant="body2" fontWeight={700}>₹{bill.labour_charges}</Typography>
                      </ListItem>
                      <ListItem sx={{ py: 0.75, px: 0 }}>
                        <ListItemText primary="Spare parts & materials charges" />
                        <Typography variant="body2" fontWeight={700}>₹{bill.parts_charges}</Typography>
                      </ListItem>
                      <ListItem sx={{ py: 0.75, px: 0 }}>
                        <ListItemText primary="GST (18% inclusive)" />
                        <Typography variant="body2" fontWeight={700}>₹{bill.gst}</Typography>
                      </ListItem>
                      {parseFloat(bill.discount) > 0 && (
                        <ListItem sx={{ py: 0.75, px: 0 }}>
                          <ListItemText primary="Promo Discount" sx={{ color: tokens.colors.success }} />
                          <Typography variant="body2" color="success.main" fontWeight={700}>-₹{bill.discount}</Typography>
                        </ListItem>
                      )}
                      <Divider sx={{ my: 1.5 }} />
                      <ListItem sx={{ py: 1, px: 0 }}>
                        <ListItemText primary="Total Amount Paid" primaryTypographyProps={{ fontWeight: 800 }} />
                        <Typography variant="h5" fontWeight={800} color="primary" sx={{ fontFamily: 'Outfit' }}>
                          ₹{booking.payment?.amount || bill.grand_total}
                        </Typography>
                      </ListItem>
                    </List>
                    
                    <Box className="no-print" display="flex" gap={2} sx={{ mt: 4, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownloadReceipt}
                        sx={{ bgcolor: tokens.colors.primary, color: '#ffffff', borderRadius: '8px', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#23232F' } }}
                      >
                        Download Receipt
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<PrintIcon />}
                        onClick={handlePrintReceipt}
                        sx={{ borderColor: tokens.colors.primary, color: tokens.colors.primary, borderRadius: '8px', textTransform: 'none', fontWeight: 700, '&:hover': { borderColor: tokens.colors.primary, bgcolor: tokens.colors.bg } }}
                      >
                        Print Receipt
                      </Button>
                    </Box>
                  </Paper>
                ) : booking.status === 'ready_to_complete' ? (
                  /* PAYMENT SUCCESSFUL WAITING STATE */
                  <Paper elevation={0} sx={{ p: 4, border: `1.5px solid ${tokens.colors.success || '#10b981'}`, borderRadius: '18px', bgcolor: 'rgba(16, 185, 129, 0.02)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                    <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                      <CheckCircleIcon sx={{ color: '#10b981', fontSize: 32 }} />
                      <Typography variant="h6" fontWeight={700} sx={{ color: '#10b981', fontFamily: 'Outfit, sans-serif' }}>
                        Payment Confirmed
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary', lineHeight: 1.6, fontWeight: 500 }}>
                      Your payment of ₹{booking.payment?.amount || bill.grand_total} has been confirmed. The captain is finalizing the job details. You will be able to review the final invoice receipt and rate the service shortly.
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1.5} sx={{ p: 2, bgcolor: 'rgba(16,185,129,0.06)', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
                      <CircularProgress size={16} sx={{ color: '#10b981' }} />
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#10b981' }}>
                        Awaiting captain's check-out confirmation...
                      </Typography>
                    </Box>
                  </Paper>
                ) : booking.status === 'WAITING_FOR_CASH_CONFIRMATION' ? (
                  /* CASH PAYMENT SELECTED STATE */
                  <Paper elevation={0} sx={{ p: 4, border: `1.5px solid ${tokens.colors.warning || '#D97706'}`, borderRadius: '18px', bgcolor: 'rgba(217, 119, 6, 0.02)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                    <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                      <HourglassEmptyIcon sx={{ color: '#D97706', fontSize: 32 }} />
                      <Typography variant="h6" fontWeight={700} sx={{ color: '#D97706', fontFamily: 'Outfit, sans-serif' }}>
                        Cash Payment Selected
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary', lineHeight: 1.6, fontWeight: 500 }}>
                      You have selected Cash Payment. Please pay the assigned captain after completion of the service.
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1.5} sx={{ p: 2, bgcolor: 'rgba(217,119,6,0.06)', borderRadius: '12px', borderLeft: '4px solid #D97706' }}>
                      <CircularProgress size={16} sx={{ color: '#D97706' }} />
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#D97706' }}>
                        Awaiting captain's cash confirmation...
                      </Typography>
                    </Box>
                  </Paper>
                ) : !bill.is_approved ? (
                  /* STEP 1: DEDICATED BILL SUMMARY SCREEN */
                  <Paper elevation={0} sx={{ p: 3, border: `1px solid ${tokens.borderColor}`, borderRadius: '18px', bgcolor: tokens.colors.paper, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, fontFamily: 'Outfit, sans-serif' }}>
                      Service Bill Summary
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 2.5, p: 2, bgcolor: tokens.colors.bg, borderRadius: '12px' }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Booking ID</Typography>
                        <Typography variant="body2" fontWeight={700}>#{booking.id}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Service Category</Typography>
                        <Typography variant="body2" fontWeight={700}>{booking.service_category_detail?.name}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">Captain Name</Typography>
                        <Typography variant="body2" fontWeight={700}>{booking.worker?.full_name || 'N/A'}</Typography>
                      </Grid>
                    </Grid>

                    <List disablePadding>
                      <ListItem sx={{ py: 1, px: 0 }}>
                        <ListItemText primary="Service charges (Labour)" />
                        <Typography variant="body2" fontWeight={700}>₹{bill.labour_charges}</Typography>
                      </ListItem>
                      <ListItem sx={{ py: 1, px: 0 }}>
                        <ListItemText primary="Spare parts & materials charges" />
                        <Typography variant="body2" fontWeight={700}>₹{bill.parts_charges}</Typography>
                      </ListItem>
                      <ListItem sx={{ py: 1, px: 0 }}>
                        <ListItemText primary="GST (18% inclusive)" />
                        <Typography variant="body2" fontWeight={700}>₹{bill.gst}</Typography>
                      </ListItem>
                      {parseFloat(bill.discount) > 0 && (
                        <ListItem sx={{ py: 1, px: 0 }}>
                          <ListItemText primary="Promo Discount" sx={{ color: tokens.colors.success }} />
                          <Typography variant="body2" color="success.main" fontWeight={700}>-₹{bill.discount}</Typography>
                        </ListItem>
                      )}
                      <Divider sx={{ my: 1.5 }} />
                      <ListItem sx={{ py: 1, px: 0 }}>
                        <ListItemText primary="Grand Total" primaryTypographyProps={{ fontWeight: 800 }} />
                        <Typography variant="h6" fontWeight={800} color="primary" sx={{ fontFamily: 'Outfit' }}>
                          ₹{bill.grand_total}
                        </Typography>
                      </ListItem>
                    </List>

                    <Box display="flex" gap={2} sx={{ mt: 3, flexWrap: 'wrap' }}>
                      <Button
                        variant="outlined"
                        onClick={() => navigate('/customer/dashboard')}
                        sx={{ borderColor: tokens.colors.primary, color: tokens.colors.primary, borderRadius: '8px', textTransform: 'none', fontWeight: 700, px: 3 }}
                      >
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleApproveBill}
                        sx={{ bgcolor: tokens.colors.primary, color: '#ffffff', borderRadius: '8px', textTransform: 'none', fontWeight: 700, px: 3, '&:hover': { bgcolor: '#23232F' } }}
                      >
                        Proceed to Payment
                      </Button>
                    </Box>
                  </Paper>
                ) : (
                  /* STEP 2: CHOOSE PAYMENT METHOD SCREEN */
                  <Paper elevation={0} sx={{ p: 4, border: `1px solid ${tokens.borderColor}`, borderRadius: '18px', bgcolor: tokens.colors.paper, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 3, fontFamily: 'Outfit, sans-serif', textAlign: 'center' }}>
                      Choose Payment Method
                    </Typography>

                    <Grid container spacing={3}>
                      {/* ONLINE PAYMENT CARD */}
                      <Grid item xs={12} md={6}>
                        <Paper 
                          variant="outlined"
                          sx={{ 
                            p: 3, 
                            textAlign: 'center', 
                            borderRadius: '16px', 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'space-between',
                            borderColor: tokens.colors.primary,
                            transition: 'all 0.2s',
                            '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }
                          }}
                        >
                          <Box sx={{ mb: 2 }}>
                            <CreditCardIcon sx={{ fontSize: 40, color: tokens.colors.primary, mb: 1 }} />
                            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                              ONLINE PAYMENT
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Secure online payment powered by Razorpay.
                            </Typography>
                          </Box>
                          <Button
                            fullWidth
                            variant="contained"
                            disabled={paying}
                            onClick={handlePayOnline}
                            sx={{ bgcolor: tokens.colors.primary, color: '#ffffff', py: 1.2, borderRadius: '8px', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#23232F' } }}
                          >
                            {paying ? <CircularProgress size={20} color="inherit" /> : 'Pay Online'}
                          </Button>
                        </Paper>
                      </Grid>

                      {/* CASH PAYMENT CARD */}
                      <Grid item xs={12} md={6}>
                        <Paper 
                          variant="outlined"
                          sx={{ 
                            p: 3, 
                            textAlign: 'center', 
                            borderRadius: '16px', 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'space-between',
                            borderColor: tokens.borderColor,
                            transition: 'all 0.2s',
                            '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }
                          }}
                        >
                          <Box sx={{ mb: 2 }}>
                            <LocalAtmIcon sx={{ fontSize: 40, color: '#16A34A', mb: 1 }} />
                            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                              CASH PAYMENT
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Pay the assigned captain directly after service completion.
                            </Typography>
                          </Box>
                          <Button
                            fullWidth
                            variant="outlined"
                            disabled={paying}
                            onClick={handlePayByCash}
                            sx={{ borderColor: tokens.colors.primary, color: tokens.colors.primary, py: 1.2, borderRadius: '8px', textTransform: 'none', fontWeight: 700, '&:hover': { borderColor: tokens.colors.primary, bgcolor: tokens.colors.bg } }}
                          >
                            Pay by Cash
                          </Button>
                        </Paper>
                      </Grid>
                    </Grid>

                    {onlinePaymentFailed && (
                      <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(220, 38, 38, 0.04)', borderRadius: '12px', borderLeft: '4px solid #DC2626', textAlign: 'center' }}>
                        <Typography variant="body2" color="error" fontWeight={700} sx={{ mb: 1 }}>
                          Payment Failed: {errorMessage || 'Could not verify your online transaction.'}
                        </Typography>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          onClick={handlePayOnline}
                          sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 700 }}
                        >
                          Retry Payment
                        </Button>
                      </Box>
                    )}
                  </Paper>
                )}
              </Box>
            )}


            {/* SECTION 7: LIVE STATUS EVENTS FEED */}
            <Paper elevation={0} sx={{ p: 3, border: `1px solid ${tokens.borderColor}`, borderRadius: '18px', bgcolor: tokens.colors.paper, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Live Service Status Feed
              </Typography>
              <Box display="flex" alignItems="center" gap={1.5} sx={{ p: 1.5, bgcolor: 'rgba(26,115,232,0.05)', borderRadius: '12px', borderLeft: '4px solid #1A73E8' }}>
                <CircularProgress size={16} sx={{ color: '#1A73E8' }} />
                <Typography variant="body2" fontWeight={600} color="primary">
                  {booking.status === 'searching' && "Listening for service captain coordinates..."}
                  {booking.status === 'accepted' && `${booking.worker?.full_name || 'Captain'} accepted your booking.`}
                  {booking.status === 'on_the_way' && "Captain en route to destination address."}
                  {booking.status === 'arrived' && "Captain at client site. Awaiting QR code authentication."}
                  {booking.status === 'verified' && "Diagnosis and repair operations initiated."}
                  {booking.status === 'repair_completed' && "Repair work successfully complete. Invoice compiled."}
                  {booking.status === 'completed' && "Service transaction completed and closed."}
                  {booking.status === 'cancelled' && "Request cancelled."}
                </Typography>
              </Box>
            </Paper>

            {/* SECTION 9: SERVICE HISTORY EVENT TRACKER */}
            <Paper elevation={0} sx={{ p: 3, border: `1px solid ${tokens.borderColor}`, borderRadius: '18px', bgcolor: tokens.colors.paper, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', order: -2 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2.5 }}>
                Activity Time Log
              </Typography>
              <Box sx={{ position: 'relative', pl: 3, borderLeft: `2px solid ${tokens.borderColor}` }}>
                {getEventLogs().map((log, idx) => (
                  <Box key={idx} sx={{ position: 'relative', mb: 3 }}>
                    {/* Event Dot */}
                    <Box sx={{ 
                      position: 'absolute', left: '-33px', top: '2px', width: '12px', height: '12px', 
                      borderRadius: '50%', bgcolor: log.active ? '#1A73E8' : '#D1D5DB',
                      border: '2px solid #ffffff'
                    }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                      {log.time}
                    </Typography>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: log.active ? tokens.colors.primary : 'text.secondary' }}>
                      {log.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {log.desc}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Rating/Feedback card */}
            {booking.status === 'completed' && !booking.rating && (
              <Paper elevation={0} sx={{ p: 3, border: `1px solid ${tokens.borderColor}`, borderRadius: '18px', bgcolor: tokens.colors.paper, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  Submit Service Feedback
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2.5 }}>
                  Let us know about your repair experience
                </Typography>
                <Box sx={{ mb: 2.5 }}>
                  <Rating 
                    value={rating} 
                    onChange={(e, val) => setRating(val)} 
                    size="large" 
                    sx={{ color: tokens.colors.primary }}
                  />
                </Box>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Review Details"
                  placeholder="Share details about the work done..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  sx={{ mb: 3 }}
                />

                <Button
                  variant="contained"
                  onClick={handleSubmitRating}
                  disabled={submittingRating}
                  sx={{ bgcolor: tokens.colors.primary, color: '#ffffff', borderRadius: '8px', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#23232F' } }}
                >
                  Submit Feedback
                </Button>
              </Paper>
            )}

            {/* Display submitted rating card */}
            {booking.status === 'completed' && booking.rating && (
              <Paper elevation={0} sx={{ p: 3, border: `1px solid ${tokens.borderColor}`, borderRadius: '18px', bgcolor: tokens.colors.paper, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                  Your Submitted Review
                </Typography>
                <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Rating 
                    value={booking.rating.rating} 
                    readOnly 
                    size="medium" 
                    sx={{ color: tokens.colors.primary }}
                  />
                  <Typography variant="subtitle2" fontWeight={700}>
                    ({booking.rating.rating}/5)
                  </Typography>
                </Box>
                {booking.rating.review && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', bgcolor: 'rgba(0,0,0,0.01)', p: 2, borderRadius: '8px', borderLeft: '3px solid #ccc' }}>
                    &ldquo;{booking.rating.review}&rdquo;
                  </Typography>
                )}
              </Paper>
            )}

        </Box>

        {/* LEFT COLUMN - Service Partner, Location & Details */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, order: 1 }}>
            
            {/* Captain Information */}
            <Paper elevation={0} sx={{ p: 3, border: `1px solid ${tokens.borderColor}`, borderRadius: '18px', bgcolor: tokens.colors.paper, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Service Partner
              </Typography>
              {booking.worker ? (
                <Box>
                  <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2.5 }}>
                    <Avatar 
                      src={booking.worker.profile?.profile_photo} 
                      sx={{ 
                        width: 56, height: 56, 
                        bgcolor: tokens.colors.accentLight, 
                        color: tokens.colors.primary,
                        fontWeight: 700,
                        fontSize: '1.25rem'
                      }}
                    >
                      {booking.worker.full_name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={800}>
                        {booking.worker.full_name}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ fontWeight: 700, color: tokens.colors.primary, mb: 0.5 }}>
                        {booking.service_category_detail?.name || 'AC Technician'}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <StarIcon sx={{ color: '#f59e0b', fontSize: 16 }} />
                        <Typography variant="body2" fontWeight={700}>
                          {booking.worker.profile?.rating || '4.8'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          • {booking.worker.profile?.experience || '3'} yrs experience
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                    Phone Contact: <b>{booking.worker.phone}</b>
                  </Typography>

                  <Box display="flex" gap={2}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<PhoneIcon />}
                      href={`tel:${booking.worker.phone}`}
                      sx={{ borderColor: tokens.colors.primary, color: tokens.colors.primary, borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
                    >
                      Call
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<ChatIcon />}
                      onClick={() => toast.success('Chat messaging feature loaded.')}
                      sx={{ bgcolor: tokens.colors.primary, color: '#ffffff', borderRadius: '8px', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#23232F' } }}
                    >
                      Chat
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No Captain assigned yet. Broadcast search is underway...
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Service Location */}
            <Paper elevation={0} sx={{ p: 3, border: `1px solid ${tokens.borderColor}`, borderRadius: '18px', bgcolor: tokens.colors.paper, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Service Location
              </Typography>
              <Box display="flex" gap={1.5} alignItems="flex-start">
                <RoomIcon sx={{ color: tokens.colors.primary, mt: 0.25 }} />
                <Box>
                  <Typography variant="body2" fontWeight={700}>
                    {booking.address}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    {booking.city}, {booking.state} - {booking.pincode}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Booking Information */}
            <Paper elevation={0} sx={{ p: 3, border: `1px solid ${tokens.borderColor}`, borderRadius: '18px', bgcolor: tokens.colors.paper, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Booking Details
              </Typography>
              <List disablePadding>
                <ListItem sx={{ py: 1, px: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                    Created Timestamp
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {new Date(booking.created_at).toLocaleString('en-IN')}
                  </Typography>
                </ListItem>
                <ListItem sx={{ py: 1, px: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                    Problem Description
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.5, mt: 0.5 }}>
                    {booking.problem_description}
                  </Typography>
                </ListItem>
              </List>
            </Paper>

        </Box>
      </Box>




    </Box>
  );
}

export default BookingTracker;
