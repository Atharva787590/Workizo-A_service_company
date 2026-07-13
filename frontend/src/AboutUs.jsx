import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import toast from 'react-hot-toast';
import { 
  Container, Typography, Button, Box, Avatar, Grid, IconButton, Tooltip, Paper
} from '@mui/material';
import { keyframes } from '@mui/system';
import { tokens } from './design/tokens';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import GoogleIcon from '@mui/icons-material/Google';
import DevicesIcon from '@mui/icons-material/Devices';
import RouterIcon from '@mui/icons-material/Router';
import SettingsIcon from '@mui/icons-material/Settings';
import StorageIcon from '@mui/icons-material/Storage';
import PaymentIcon from '@mui/icons-material/Payment';
import ljUniversityCampus from './assets/lj_university_campus.png';

// Subtle floating animations for tech background elements
const floatSubtle1 = keyframes`
  0% { transform: translate(0px, 0px) rotate(0deg); }
  50% { transform: translate(4px, -4px) rotate(3deg); }
  100% { transform: translate(0px, 0px) rotate(0deg); }
`;

const floatSubtle2 = keyframes`
  0% { transform: translate(0px, 0px) rotate(0deg); }
  50% { transform: translate(-4px, 4px) rotate(-3deg); }
  100% { transform: translate(0px, 0px) rotate(0deg); }
`;

// Dynamic line mapping animation for data flow packets
const animateDash = keyframes`
  from { stroke-dashoffset: 200; }
  to { stroke-dashoffset: 0; }
`;

// WORKIZO Branded Outline Icons
const serviceIcons = [
  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/></svg>,
  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .5 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>,
  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12v4H6z"/><path d="M19 7v5a2 2 0 0 1-2 2H9v7"/><path d="M5 21h8"/></svg>,
  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5 7 19"/><path d="M7 5 17 19"/><path d="M20 12H4"/><path d="m12 6 2-2M12 6l-2-2"/><path d="m12 18 2 2M12 18l-2 2"/><path d="m6 12-2 2M6 12l-2-2"/><path d="m18 12 2 2M18 12l-2-2"/></svg>,
  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-13-7-13S5 10.7 5 15a7 7 0 0 0 7 7z"/></svg>,
  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>,
  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/><path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/><path d="M16 12H8v4h8z"/></svg>,
  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5 4 4"/><path d="M21.5 12H16l-3.5 3.5L10 13l3.5-3.5V4z"/><path d="m9 16-5.5 5.5a1 1 0 0 1-1.4 0l-1.6-1.6a1 1 0 0 1 0-1.4L6 13"/></svg>,
  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 9c1.5-1.5 2-4 1-5s-3.5-.5-5 1c-1.5 1.5-.5 3.5 1 5c-1.5 1.5-4 1-5-1s-.5-3.5 1-5c1.5-1.5 3.5-.5 5 1c1.5-1.5 1-4-1-5s-3.5.5-5 2c-1.5 1.5-.5 3.5 1 5"/></svg>,
  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6"/><circle cx="10" cy="10" r="3"/><path d="M18 10h4v7a3 3 0 0 1-3 3h-9"/></svg>,
  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m14 6 4 4"/><path d="M16 4h4v4h-4z"/><path d="m15 9-9 9H2v-4l9-9"/></svg>
];

const patternIcons = [
  { x: 5, y: 15, rotate: 15, size: 28, iconIdx: 0, anim: floatSubtle1 },
  { x: 24, y: 8, rotate: -20, size: 24, iconIdx: 1, anim: floatSubtle2 },
  { x: 42, y: 18, rotate: 30, size: 32, iconIdx: 2, anim: floatSubtle1 },
  { x: 12, y: 48, rotate: 45, size: 22, iconIdx: 3, anim: floatSubtle2 },
  { x: 30, y: 42, rotate: -15, size: 36, iconIdx: 4, anim: floatSubtle1 },
  { x: 48, y: 52, rotate: 10, size: 28, iconIdx: 5, anim: floatSubtle2 },
  { x: 18, y: 78, rotate: -35, size: 30, iconIdx: 6, anim: floatSubtle1 },
  { x: 35, y: 82, rotate: 25, size: 26, iconIdx: 7, anim: floatSubtle2 },
  { x: 52, y: 88, rotate: 0, size: 34, iconIdx: 8, anim: floatSubtle1 },
  { x: 62, y: 12, rotate: 40, size: 30, iconIdx: 9, anim: floatSubtle2 },
  { x: 80, y: 6, rotate: -15, size: 24, iconIdx: 10, anim: floatSubtle1 },
  { x: 92, y: 18, rotate: 35, size: 32, iconIdx: 11, anim: floatSubtle2 },
  { x: 68, y: 45, rotate: -25, size: 22, iconIdx: 12, anim: floatSubtle1 },
  { x: 88, y: 50, rotate: 15, size: 28, iconIdx: 0, anim: floatSubtle2 },
  { x: 64, y: 76, rotate: 30, size: 36, iconIdx: 1, anim: floatSubtle1 },
  { x: 78, y: 88, rotate: -10, size: 26, iconIdx: 2, anim: floatSubtle2 },
  { x: 94, y: 80, rotate: 20, size: 30, iconIdx: 3, anim: floatSubtle1 }
];

const AboutUs = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleBookServiceClick = () => {
    if (isAuthenticated) {
      navigate('/customer/book');
    } else {
      toast.error('Please log in first to book a service');
      localStorage.setItem('redirect_after_login', '/customer/book');
      navigate('/customer/login');
    }
  };

  return (
    <Box sx={{ bgcolor: tokens.colors.bg, minHeight: '100vh', color: tokens.colors.primary, fontFamily: 'Outfit', pb: 10 }}>
      
      {/* 1. Hero Section with Repeating Branded Service Wallpaper */}
      <Box 
        sx={{ 
          position: 'relative',
          overflow: 'hidden',
          pt: { xs: 8, md: 12 }, 
          pb: { xs: 8, md: 12 },
          background: 'radial-gradient(circle at 0% 0%, rgba(79, 70, 229, 0.05) 0%, rgba(255, 255, 255, 1) 70%)',
          borderBottom: '1px solid #E5E7EB'
        }}
      >
        {patternIcons.map((node, index) => (
          <Box 
            key={index}
            sx={{ 
              position: 'absolute',
              left: `${node.x}%`,
              top: `${node.y}%`,
              width: `${node.size}px`,
              height: `${node.size}px`,
              color: '#4f46e5',
              opacity: 0.08,
              transform: `rotate(${node.rotate}deg)`,
              animation: `${node.anim} 15s ease-in-out infinite`,
              zIndex: 0,
              pointerEvents: 'none',
              display: { 
                xs: index < 6 ? 'block' : 'none', 
                sm: 'block' 
              }
            }}
          >
            {serviceIcons[node.iconIdx]}
          </Box>
        ))}

        <Container 
          maxWidth={false} 
          sx={{ 
            position: 'relative',
            zIndex: 1,
            maxWidth: '1280px', 
            mx: 'auto',
            px: { xs: 3, md: 4 }
          }}
        >
          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: '58% 42%'
              },
              gap: { xs: '48px', md: '64px' },
              alignItems: 'center'
            }}
          >
            {/* Hero Left Content */}
            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Typography 
                variant="overline" 
                sx={{ 
                  color: '#4f46e5',
                  fontWeight: 800, 
                  letterSpacing: '0.25em',
                  display: 'block',
                  mb: 2,
                  fontSize: '0.8rem'
                }}
              >
                DISCOVER WORKIZO
              </Typography>
              
              <Typography 
                variant="h1" 
                sx={{ 
                  fontFamily: 'Outfit', 
                  fontWeight: 900, 
                  color: '#0F0F14',
                  lineHeight: 1.15,
                  mb: 3,
                  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '3.75rem' }
                }}
              >
                Connecting Customers with{' '}
                <Box 
                  component="span" 
                  sx={{ 
                    position: 'relative', 
                    display: 'inline-block',
                    color: '#4f46e5',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 4,
                      left: 0,
                      width: '100%',
                      height: '6px',
                      borderRadius: '4px',
                      bgcolor: 'rgba(79, 70, 229, 0.15)',
                      zIndex: -1
                    }
                  }}
                >
                  Trusted Local
                </Box>{' '}
                Professionals.
              </Typography>
              
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#4B5563', 
                  lineHeight: 1.8, 
                  fontSize: '1.1rem', 
                  mb: 4,
                  maxWidth: '640px',
                  mx: { xs: 'auto', md: 0 }
                }}
              >
                WORKIZO is an advanced, technology-driven local service portal designed to simplify home services. We bridge the gap between verified household experts—electricians, plumbers, carpenters, and technicians—and customers who value efficiency, transparency, and top-tier service.
              </Typography>

              <Box 
                sx={{ 
                  display: 'flex', 
                  gap: 2, 
                  justifyContent: { xs: 'center', md: 'flex-start' },
                  flexWrap: 'wrap'
                }}
              >
                <Button 
                  variant="contained" 
                  onClick={handleBookServiceClick}
                  sx={{ 
                    bgcolor: '#0F0F14', 
                    color: '#ffffff', 
                    borderRadius: '24px', 
                    fontWeight: 700,
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem',
                    boxShadow: '0 4px 14px rgba(15, 15, 20, 0.15)',
                    '&:hover': {
                      bgcolor: '#222222',
                      boxShadow: '0 6px 20px rgba(15, 15, 20, 0.25)'
                    }
                  }}
                >
                  Book a Service
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/captain/login')}
                  sx={{ 
                    borderColor: '#0F0F14', 
                    color: '#0F0F14', 
                    borderRadius: '24px', 
                    fontWeight: 700,
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem',
                    borderWidth: '2px',
                    '&:hover': {
                      borderColor: '#4f46e5',
                      borderWidth: '2px',
                      color: '#4f46e5',
                      bgcolor: 'rgba(79, 70, 229, 0.04)'
                    }
                  }}
                >
                  Become a Captain
                </Button>
              </Box>
            </Box>

            {/* Hero Right: University Showcase Card */}
            <Box 
              sx={{ 
                position: 'relative',
                width: '100%',
                maxWidth: '480px',
                mx: 'auto'
              }}
            >
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2,
                  bgcolor: '#ffffff',
                  borderRadius: '28px', 
                  border: '1px solid rgba(229, 231, 235, 1)',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.05)',
                  position: 'relative',
                  zIndex: 2,
                  overflow: 'hidden',
                  transition: tokens.transition,
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 30px 60px rgba(79, 70, 229, 0.1)'
                  }
                }}
              >
                {/* Modern Badges */}
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: 24, 
                    left: 24, 
                    zIndex: 3, 
                    bgcolor: 'rgba(15, 15, 20, 0.85)', 
                    color: '#ffffff', 
                    backdropFilter: 'blur(8px)',
                    px: 2, 
                    py: 0.75, 
                    borderRadius: '20px',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }}
                >
                  Project Incubation Hub
                </Box>
                
                <Box 
                  component="img" 
                  src={ljUniversityCampus} 
                  alt="LJ University Campus"
                  sx={{ 
                    width: '100%',
                    aspectRatio: '1.25',
                    objectFit: 'cover',
                    borderRadius: '20px',
                    mb: 3
                  }}
                />

                <Box sx={{ px: 1, pb: 1 }}>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontFamily: 'Outfit', 
                      fontWeight: 800, 
                      color: '#0F0F14',
                      mb: 1
                    }}
                  >
                    LJ University
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#6B7280',
                      lineHeight: 1.6,
                      fontWeight: 500
                    }}
                  >
                    Designed, developed, and tested at LJ University Campus. Our university foster innovation, tech exploration, and entrepreneurship to help students build systems that solve real-life workflow problems.
                  </Typography>
                </Box>
              </Paper>

              {/* Glowing Background Blur */}
              <Box 
                sx={{ 
                  position: 'absolute',
                  top: '15%',
                  left: '15%',
                  width: '80%',
                  height: '80%',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, rgba(255,255,255,0) 70%)',
                  filter: 'blur(40px)',
                  zIndex: 1,
                  pointerEvents: 'none'
                }}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* 2. Platform Modules & Technical Highlights (Redesigned with Visual Architecture) */}
      <Box sx={{ py: 12, bgcolor: '#ffffff' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 9 }}>
            <Typography variant="overline" sx={{ color: '#4f46e5', fontWeight: 800, letterSpacing: '0.2em' }}>
              HOW IT WORKS
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, mt: 1.5, mb: 2, fontFamily: 'Outfit' }}>
              Platform Architecture & Features
            </Typography>
            <Typography variant="body1" sx={{ color: '#6B7280', maxWidth: '600px', mx: 'auto', lineHeight: 1.7 }}>
              WORKIZO combines a robust backend framework, secure role-based portals, and live WebSocket routing to orchestrate instant local services.
            </Typography>
          </Box>

          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: '48% 52%'
              },
              gap: '48px',
              alignItems: 'center'
            }}
          >
            {/* Left: Interactive Visual Flow Canvas */}
            <Box 
              sx={{ 
                position: 'relative', 
                height: { xs: '380px', sm: '420px' }, 
                background: 'radial-gradient(circle at 50% 50%, rgba(79, 70, 229, 0.04) 0%, rgba(255, 255, 255, 0.9) 100%)',
                border: '1px solid #E5E7EB',
                borderRadius: '28px',
                p: 3,
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.02)',
                overflow: 'hidden'
              }}
            >
              {/* Dynamic SVG Flows */}
              <svg 
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%', 
                  pointerEvents: 'none', 
                  zIndex: 1 
                }}
              >
                {/* Connecting Lines */}
                <path d="M 20% 15% L 50% 45%" stroke="#E5E7EB" strokeWidth="2" strokeDasharray="5,5" fill="none" />
                <path d="M 80% 15% L 50% 45%" stroke="#E5E7EB" strokeWidth="2" strokeDasharray="5,5" fill="none" />
                <path d="M 50% 45% L 50% 70%" stroke="#E5E7EB" strokeWidth="2" strokeDasharray="5,5" fill="none" />
                <path d="M 50% 70% L 20% 85%" stroke="#E5E7EB" strokeWidth="2" strokeDasharray="5,5" fill="none" />
                <path d="M 50% 70% L 80% 85%" stroke="#E5E7EB" strokeWidth="2" strokeDasharray="5,5" fill="none" />

                {/* Animated Data Packets */}
                <path d="M 20% 15% L 50% 45%" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" fill="none"
                      strokeDasharray="10 100" style={{ animation: `${animateDash} 4s linear infinite` }} />
                <path d="M 80% 15% L 50% 45%" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" fill="none"
                      strokeDasharray="10 100" style={{ animation: `${animateDash} 4s linear infinite`, animationDelay: '2s' }} />
                <path d="M 50% 45% L 50% 70%" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" fill="none"
                      strokeDasharray="10 50" style={{ animation: `${animateDash} 2s linear infinite` }} />
                <path d="M 50% 70% L 20% 85%" stroke="#1A73E8" strokeWidth="3" strokeLinecap="round" fill="none"
                      strokeDasharray="10 100" style={{ animation: `${animateDash} 3s linear infinite` }} />
                <path d="M 50% 70% L 80% 85%" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" fill="none"
                      strokeDasharray="10 100" style={{ animation: `${animateDash} 3s linear infinite`, animationDelay: '1.5s' }} />
              </svg>

              {/* Node Overlay (Interactive Visual elements) */}
              {[
                { label: 'Customer App', icon: <DevicesIcon sx={{ fontSize: '1.5rem' }} />, left: '20%', top: '15%', color: '#4f46e5' },
                { label: 'Captain App', icon: <DevicesIcon sx={{ fontSize: '1.5rem' }} />, left: '80%', top: '15%', color: '#4f46e5' },
                { label: 'Daphne Gateway', icon: <RouterIcon sx={{ fontSize: '1.5rem' }} />, left: '50%', top: '45%', color: '#4f46e5' },
                { label: 'Django Engine', icon: <SettingsIcon sx={{ fontSize: '1.5rem' }} />, left: '50%', top: '70%', color: '#4f46e5' },
                { label: 'MySQL DB', icon: <StorageIcon sx={{ fontSize: '1.5rem' }} />, left: '20%', top: '85%', color: '#1A73E8' },
                { label: 'Razorpay API', icon: <PaymentIcon sx={{ fontSize: '1.5rem' }} />, left: '80%', top: '85%', color: '#16A34A' }
              ].map((node, i) => (
                <Box
                  key={i}
                  sx={{
                    position: 'absolute',
                    left: node.left,
                    top: node.top,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: { xs: 70, sm: 80 },
                    height: { xs: 70, sm: 80 },
                    bgcolor: '#ffffff',
                    border: `2px solid ${node.color}`,
                    borderRadius: '20px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.05)',
                    transition: tokens.transition,
                    cursor: 'default',
                    '&:hover': {
                      transform: 'translate(-50%, -55%) scale(1.06)',
                      boxShadow: `0 12px 24px ${node.color}25`
                    }
                  }}
                >
                  <Box sx={{ color: node.color, display: 'flex', mb: 0.5 }}>
                    {node.icon}
                  </Box>
                  <Typography 
                    sx={{ 
                      fontSize: '0.65rem', 
                      fontWeight: 800, 
                      color: '#0F0F14',
                      fontFamily: 'Outfit',
                      textAlign: 'center',
                      px: 0.5
                    }}
                  >
                    {node.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Right: Technical Features List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[
                {
                  title: 'Real-Time Dispatching (WebSockets)',
                  desc: 'WebSocket pathways connect available Captains and Customers instantly. Real-time notifications push booking requests directly based on status and geographical proximity.',
                  color: '#4F46E5'
                },
                {
                  title: 'Role-Based Dashboard Core',
                  desc: 'Segmented custom control panels. Customers book, track, and pay, while Captains accept bookings, upload work completion metadata, and manage online status.',
                  color: '#1A73E8'
                },
                {
                  title: 'Secure Razorpay Payments & Billing',
                  desc: 'Built-in transaction flow with Razorpay integration. Auto-generates transactional logs, triggers database payment status transitions, and compiles downloadable billing invoices.',
                  color: '#16A34A'
                },
                {
                  title: 'Automated KYC & Safety Verification',
                  desc: 'Specialized onboarding channels for Captains. Captures document uploads, enables admin KYC status reviews, and verifies service credentials to guarantee user protection.',
                  color: '#EA4335'
                }
              ].map((feat, idx) => (
                <Paper
                  key={idx}
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '20px',
                    border: '1px solid #E5E7EB',
                    bgcolor: '#FFFFFF',
                    transition: tokens.transition,
                    display: 'flex',
                    gap: 2.5,
                    alignItems: 'flex-start',
                    '&:hover': {
                      borderColor: feat.color,
                      boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
                      transform: 'translateX(4px)'
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      width: 8, 
                      height: 48, 
                      borderRadius: '4px', 
                      bgcolor: feat.color,
                      flexShrink: 0
                    }}
                  />
                  <Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 800, 
                        mb: 0.75, 
                        fontFamily: 'Outfit', 
                        fontSize: '1.05rem',
                        color: '#0F0F14'
                      }}
                    >
                      {feat.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280', lineHeight: 1.6 }}>
                      {feat.desc}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* 3. Champions of our Startup Project (Team Section) */}
      <Box 
        sx={{ 
          position: 'relative',
          overflow: 'hidden',
          py: 12,
          bgcolor: tokens.colors.bg
        }}
      >
        <Container 
          maxWidth={false} 
          sx={{ 
            position: 'relative',
            zIndex: 1,
            maxWidth: '1280px', 
            mx: 'auto',
            px: { xs: 3, md: 4 }
          }}
        >
          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: '40% 60%'
              },
              gap: '64px',
              alignItems: 'center'
            }}
          >
            {/* Team Left: Title & Description */}
            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Typography 
                variant="h2" 
                sx={{ 
                  fontFamily: 'Outfit', 
                  fontWeight: 900, 
                  color: '#0F0F14',
                  lineHeight: 1.15,
                  mb: 4,
                  fontSize: { xs: '2.5rem', md: '3.5rem' }
                }}
              >
                Meet the{' '}
                <Box 
                  component="span" 
                  sx={{ 
                    color: '#4f46e5',
                    position: 'relative',
                    display: 'inline-block',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '100%',
                      height: '4px',
                      bgcolor: '#4f46e5'
                    }
                  }}
                >
                  Champions
                </Box>{' '}
                of WORKIZO
              </Typography>
              
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#4B5563', 
                  lineHeight: 1.8, 
                  mb: 3,
                  fontSize: '1.05rem'
                }}
              >
                WORKIZO was designed and developed as a collaborative semester project at LJ University. Our mission was to build a secure, real-world ready system that solves everyday coordination issues.
              </Typography>

              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#4B5563', 
                  lineHeight: 1.8,
                  fontSize: '1.05rem'
                }}
              >
                Through this project, we expanded our skills in relational databases, Django REST framework integration, secure tokens, real-time messaging, and high-fidelity interface design.
              </Typography>
            </Box>

            {/* Team Right: Premium Developer Profile Cards with Social Links */}
            <Box 
              sx={{ 
                position: 'relative',
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' }, 
                justifyContent: 'center',
                alignItems: 'stretch',
                gap: '40px',
                width: '100%'
              }}
            >
              {/* Profile 1: Ambariya Vivek */}
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  p: 4,
                  borderRadius: '24px',
                  bgcolor: '#ffffff',
                  border: '1px solid #E5E7EB',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative',
                  transition: tokens.transition,
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 20px 40px rgba(79, 70, 229, 0.08)',
                    borderColor: '#4f46e5'
                  }
                }}
              >
                {/* Avatar with styled border ring */}
                <Box 
                  sx={{
                    display: 'inline-block',
                    p: '5px',
                    border: '3px solid #4f46e5',
                    borderRadius: '50%',
                    mb: 3,
                    transition: tokens.transition
                  }}
                >
                  <Avatar 
                    sx={{ 
                      width: 110, 
                      height: 110, 
                      bgcolor: 'radial-gradient(circle, #4f46e5 0%, #312e81 100%)',
                      color: '#ffffff',
                      fontFamily: 'Outfit',
                      fontSize: '2.2rem',
                      fontWeight: 900
                    }}
                  >
                    AV
                  </Avatar>
                </Box>

                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontFamily: 'Outfit', 
                    fontWeight: 950, 
                    color: '#0F0F14',
                    mb: 0.5,
                    fontSize: '1.25rem'
                  }}
                >
                  Ambariya Vivek
                </Typography>

                <Box 
                  sx={{ 
                    bgcolor: 'rgba(79, 70, 229, 0.08)', 
                    color: '#4f46e5',
                    px: 2,
                    py: 0.5,
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                    mb: 2.5
                  }}
                >
                  Project Leader & Architect
                </Box>

                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#4B5563', 
                    lineHeight: 1.6,
                    fontSize: '0.9rem',
                    mb: 3,
                    flexGrow: 1
                  }}
                >
                  Designed the database structures, set up JWT-based custom session flows, developed role permissions, and integrated notifications via SMTP and WebSockets.
                </Typography>

                {/* Social Quick Access Bar */}
                <Box sx={{ display: 'flex', gap: 1.5, borderTop: '1px solid #F3F4F6', pt: 2, width: '100%', justifyContent: 'center' }}>
                  <Tooltip title="View LinkedIn Profile" arrow>
                    <IconButton 
                      component="a" 
                      href="https://linkedin.com/in/vivek-ambariya" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      sx={{ 
                        color: '#6B7280', 
                        bgcolor: '#F9FAFB',
                        transition: tokens.transition,
                        '&:hover': { 
                          color: '#0A66C2', 
                          bgcolor: 'rgba(10, 102, 194, 0.1)',
                          transform: 'scale(1.15)'
                        } 
                      }}
                    >
                      <LinkedInIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="View GitHub Repositories" arrow>
                    <IconButton 
                      component="a" 
                      href="https://github.com/vivek-ambariya" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      sx={{ 
                        color: '#6B7280', 
                        bgcolor: '#F9FAFB',
                        transition: tokens.transition,
                        '&:hover': { 
                          color: '#24292F', 
                          bgcolor: 'rgba(36, 41, 47, 0.1)',
                          transform: 'scale(1.15)'
                        } 
                      }}
                    >
                      <GitHubIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Google Email Contact" arrow>
                    <IconButton 
                      component="a" 
                      href="mailto:ambariyavivek5@gmail.com" 
                      sx={{ 
                        color: '#6B7280', 
                        bgcolor: '#F9FAFB',
                        transition: tokens.transition,
                        '&:hover': { 
                          color: '#DB4437', 
                          bgcolor: 'rgba(219, 68, 55, 0.1)',
                          transform: 'scale(1.15)'
                        } 
                      }}
                    >
                      <GoogleIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>

              {/* Profile 2: Ved Goyani */}
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  p: 4,
                  borderRadius: '24px',
                  bgcolor: '#ffffff',
                  border: '1px solid #E5E7EB',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative',
                  transition: tokens.transition,
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 20px 40px rgba(79, 70, 229, 0.08)',
                    borderColor: '#4f46e5'
                  }
                }}
              >
                {/* Avatar with styled border ring */}
                <Box 
                  sx={{
                    display: 'inline-block',
                    p: '5px',
                    border: '3px solid #4f46e5',
                    borderRadius: '50%',
                    mb: 3,
                    transition: tokens.transition
                  }}
                >
                  <Avatar 
                    sx={{ 
                      width: 110, 
                      height: 110, 
                      bgcolor: 'radial-gradient(circle, #4f46e5 0%, #312e81 100%)',
                      color: '#ffffff',
                      fontFamily: 'Outfit',
                      fontSize: '2.2rem',
                      fontWeight: 900
                    }}
                  >
                    VG
                  </Avatar>
                </Box>

                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontFamily: 'Outfit', 
                    fontWeight: 950, 
                    color: '#0F0F14',
                    mb: 0.5,
                    fontSize: '1.25rem'
                  }}
                >
                  Ved Goyani
                </Typography>

                <Box 
                  sx={{ 
                    bgcolor: 'rgba(79, 70, 229, 0.08)', 
                    color: '#4f46e5',
                    px: 2,
                    py: 0.5,
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                    mb: 2.5
                  }}
                >
                  Frontend & UI Developer
                </Box>

                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#4B5563', 
                    lineHeight: 1.6,
                    fontSize: '0.9rem',
                    mb: 3,
                    flexGrow: 1
                  }}
                >
                  Crafted high-fidelity web views, interactive booking timelines, worker toggle panels, client dashboard lists, and dynamic maps.
                </Typography>

                {/* Social Quick Access Bar */}
                <Box sx={{ display: 'flex', gap: 1.5, borderTop: '1px solid #F3F4F6', pt: 2, width: '100%', justifyContent: 'center' }}>
                  <Tooltip title="View LinkedIn Profile" arrow>
                    <IconButton 
                      component="a" 
                      href="https://linkedin.com/in/ved-goyani" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      sx={{ 
                        color: '#6B7280', 
                        bgcolor: '#F9FAFB',
                        transition: tokens.transition,
                        '&:hover': { 
                          color: '#0A66C2', 
                          bgcolor: 'rgba(10, 102, 194, 0.1)',
                          transform: 'scale(1.15)'
                        } 
                      }}
                    >
                      <LinkedInIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="View GitHub Repositories" arrow>
                    <IconButton 
                      component="a" 
                      href="https://github.com/ved-goyani" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      sx={{ 
                        color: '#6B7280', 
                        bgcolor: '#F9FAFB',
                        transition: tokens.transition,
                        '&:hover': { 
                          color: '#24292F', 
                          bgcolor: 'rgba(36, 41, 47, 0.1)',
                          transform: 'scale(1.15)'
                        } 
                      }}
                    >
                      <GitHubIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Google Email Contact" arrow>
                    <IconButton 
                      component="a" 
                      href="mailto:vedgoyani@gmail.com" 
                      sx={{ 
                        color: '#6B7280', 
                        bgcolor: '#F9FAFB',
                        transition: tokens.transition,
                        '&:hover': { 
                          color: '#DB4437', 
                          bgcolor: 'rgba(219, 68, 55, 0.1)',
                          transform: 'scale(1.15)'
                        } 
                      }}
                    >
                      <GoogleIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Container>
      </Box>

    </Box>
  );
};

export default AboutUs;
