import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Link, Container, Grid, Card, Button, Avatar, IconButton, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import StarsIcon from '@mui/icons-material/Stars';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import GoogleIcon from '@mui/icons-material/Google';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

const SplineLanding = () => {
  const navigate = useNavigate();

  // Dynamic iframe pointer events state to solve trackpad & touch scroll hijacking
  const [iframePointerEvents, setIframePointerEvents] = useState('auto');
  const scrollTimeoutRef = useRef(null);

  useEffect(() => {
    const handleScrollGestureStart = () => {
      // Temporarily disable pointer events on the iframe so gestures scroll the parent document
      setIframePointerEvents('none');

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Restore pointer events 150ms after scroll gesture pauses/stops
      scrollTimeoutRef.current = setTimeout(() => {
        setIframePointerEvents('auto');
      }, 150);
    };

    window.addEventListener('wheel', handleScrollGestureStart, { passive: true });
    window.addEventListener('touchstart', handleScrollGestureStart, { passive: true });
    window.addEventListener('touchmove', handleScrollGestureStart, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleScrollGestureStart);
      window.removeEventListener('touchstart', handleScrollGestureStart);
      window.removeEventListener('touchmove', handleScrollGestureStart);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Load Valeran's exact custom fonts (Maltiner Display & NewBlack) dynamically
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      @font-face {
        font-family: 'Maltiner Display';
        src: url('https://cdn.prod.website-files.com/6a2988625ed1354394490132/6a2988625ed135439449014d_Maltiner%20Display.woff2') format('woff2');
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'NewBlack';
        src: url('https://cdn.prod.website-files.com/6a2988625ed1354394490132/6a2988625ed1354394490159_NewBlackTypeface-UltraLight.woff2') format('woff2');
        font-weight: 200;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'NewBlack';
        src: url('https://cdn.prod.website-files.com/6a2988625ed1354394490132/6a2988625ed1354394490157_NewBlackTypeface-Regular.woff2') format('woff2');
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'NewBlack';
        src: url('https://cdn.prod.website-files.com/6a2988625ed1354394490132/6a2988625ed135439449015b_NewBlackTypeface-Medium.woff2') format('woff2');
        font-weight: 500;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'NewBlack';
        src: url('https://cdn.prod.website-files.com/6a2988625ed1354394490132/6a2988625ed135439449015c_NewBlackTypeface-ExtraBold.woff2') format('woff2');
        font-weight: 800;
        font-style: normal;
        font-display: swap;
      }
    `;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // GSAP ScrollTrigger for alternating timeline, safety and team reveals
  useEffect(() => {
    // Set initial hidden states for the scrollable elements
    gsap.set('.spline-timeline-step-left', { opacity: 0, x: -60 });
    gsap.set('.spline-timeline-step-right', { opacity: 0, x: 60 });
    gsap.set('.spline-safety-header', { opacity: 0, y: 35 });
    gsap.set('.spline-safety-card', { opacity: 0, y: 40 });
    gsap.set('.spline-team-header', { opacity: 0, y: 35 });
    gsap.set('.spline-team-card', { opacity: 0, y: 50 });

    // Left slide-ins
    ScrollTrigger.batch('.spline-timeline-step-left', {
      onEnter: batch => gsap.to(batch, { opacity: 1, x: 0, duration: 1.4, stagger: 0.35, ease: 'power4.out', overwrite: 'auto' }),
      start: 'top 85%',
      once: true
    });

    // Right slide-ins
    ScrollTrigger.batch('.spline-timeline-step-right', {
      onEnter: batch => gsap.to(batch, { opacity: 1, x: 0, duration: 1.4, stagger: 0.35, ease: 'power4.out', overwrite: 'auto' }),
      start: 'top 85%',
      once: true
    });

    // Safety Header Reveal
    ScrollTrigger.create({
      trigger: '.spline-safety-header',
      start: 'top 85%',
      onEnter: () => gsap.to('.spline-safety-header', { opacity: 1, y: 0, duration: 1.4, ease: 'power4.out' }),
      once: true
    });

    // Safety Cards Staggered Reveal
    ScrollTrigger.batch('.spline-safety-card', {
      onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, duration: 1.4, stagger: 0.25, ease: 'power4.out', overwrite: 'auto' }),
      start: 'top 85%',
      once: true
    });

    // Team Header Reveal
    ScrollTrigger.create({
      trigger: '.spline-team-header',
      start: 'top 85%',
      onEnter: () => gsap.to('.spline-team-header', { opacity: 1, y: 0, duration: 1.2, ease: 'power4.out' }),
      once: true
    });

    // Team Cards Staggered Reveal
    ScrollTrigger.batch('.spline-team-card', {
      onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, duration: 1.4, stagger: 0.25, ease: 'power4.out', overwrite: 'auto' }),
      start: 'top 85%',
      once: true
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        position: 'relative',
        margin: 0,
        padding: 0,
        bgcolor: '#090d16',
      }}
    >
      {/* 1. Spline interactive background - FIXED to the screen */}
      <iframe
        src="https://my.spline.design/particles-YTBDLEkKYDerayq5gxeww7yv/"
        frameBorder="0"
        width="100%"
        height="100%"
        title="Spline Particles"
        allow="autoplay; fullscreen"
        style={{
          border: 'none',
          width: '100vw',
          height: '100vh',
          display: 'block',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1,
          pointerEvents: iframePointerEvents, // Dynamically toggled on scrolling/swiping
          transition: 'pointer-events 0.1s ease',
        }}
      />

      {/* 2. Brand Overlay - Hero Fold (pointerEvents: none to let hover reach iframe) */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: { xs: 4, md: 8 },
          pointerEvents: 'none', // Hover events bypass this layer to hit fixed iframe
          boxSizing: 'border-box',
        }}
      >
        {/* Top Navigation Row */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            width: '100%',
          }}
        >
          {/* Top Left: Logo & Language Selector */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.4)',
                fontFamily: "'NewBlack', sans-serif",
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.1em',
              }}
            >
              [ EN ] &nbsp; [ HI ]
            </Typography>
            <Typography
              onClick={() => navigate('/home')}
              sx={{
                fontFamily: "'Maltiner Display', Georgia, serif",
                fontSize: { xs: '2rem', md: '3rem' },
                fontWeight: 400,
                letterSpacing: '0.04em',
                lineHeight: 1,
                cursor: 'pointer',
                pointerEvents: 'auto',
                color: '#ffffff',
                transition: 'opacity 0.2s',
                '&:hover': {
                  opacity: 0.8,
                },
              }}
            >
              WORKIZO
            </Typography>
          </Box>

          {/* Top Right: Columns matching Valeran */}
          <Box
            sx={{
              display: 'flex',
              gap: { xs: 4, md: 8 },
              pointerEvents: 'auto',
              textAlign: 'left',
            }}
          >
            {/* Column 1: Services */}
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontFamily: "'NewBlack', sans-serif",
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  letterSpacing: '0.15em',
                  display: 'block',
                  mb: 1.5,
                }}
              >
                SERVICES
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Link
                  onClick={() => navigate('/home')}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: "'NewBlack', sans-serif",
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    letterSpacing: '0.02em',
                    cursor: 'pointer',
                    '&:hover': { color: '#ffffff' },
                  }}
                >
                  [ BOOK REPAIR ]
                </Link>
                <Link
                  onClick={() => navigate('/captain/register')}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: "'NewBlack', sans-serif",
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    letterSpacing: '0.02em',
                    cursor: 'pointer',
                    '&:hover': { color: '#ffffff' },
                  }}
                >
                  [ BECOME A CAPTAIN ]
                </Link>
              </Box>
            </Box>

            {/* Column 2: Platform Links */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontFamily: "'NewBlack', sans-serif",
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  letterSpacing: '0.15em',
                  display: 'block',
                  mb: 1.5,
                }}
              >
                WORKIZO
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Link
                  onClick={() => navigate('/about')}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: "'NewBlack', sans-serif",
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    letterSpacing: '0.02em',
                    cursor: 'pointer',
                    '&:hover': { color: '#ffffff' },
                  }}
                >
                  [ ABOUT US ]
                </Link>
                <Link
                  onClick={() => navigate('/home')}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: "'NewBlack', sans-serif",
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    letterSpacing: '0.02em',
                    cursor: 'pointer',
                    '&:hover': { color: '#ffffff' },
                  }}
                >
                  [ GO TO PORTAL ]
                </Link>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Bottom Section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'flex-end' },
            gap: 4,
            width: '100%',
          }}
        >
          {/* Bottom Left: Huge Luxury serif title */}
          <Box sx={{ maxWidth: '650px' }}>
            <Typography
              variant="h2"
              sx={{
                fontFamily: "'Maltiner Display', Georgia, serif",
                fontWeight: 400,
                fontSize: { xs: '1.8rem', sm: '2.8rem', md: '3.6rem' },
                lineHeight: 1.15,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              One request,
              <br />
              one skilled solution to
              <br />
              live with peace of mind.
            </Typography>
          </Box>

          {/* Bottom Right: Go to Website link */}
          <Box
            sx={{
              pointerEvents: 'auto',
              alignSelf: { xs: 'stretch', md: 'auto' },
            }}
          >
            <Link
              onClick={() => navigate('/home')}
              sx={{
                color: '#ffffff',
                fontFamily: "'NewBlack', sans-serif",
                fontSize: { xs: '0.9rem', md: '1rem' },
                fontWeight: 800,
                textDecoration: 'none',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                display: 'inline-block',
                transition: 'opacity 0.2s',
                '&:hover': {
                  opacity: 0.7,
                },
              }}
            >
              [ GO TO WEBSITE ]
            </Link>
          </Box>
        </Box>
      </Box>

      {/* Elegant long empty space showing the Spline particles */}
      <Box sx={{ height: { xs: '20vh', md: '35vh' } }} />

      {/* 3. How It Works Section (Alternating Transparent Timeline layout) */}
      <Box
        sx={{
          bgcolor: 'transparent',
          py: 12,
          position: 'relative',
          zIndex: 10,
          pointerEvents: 'auto',
          color: '#ffffff',
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <Box sx={{ textAlign: 'center', mb: 10 }}>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.4)',
                fontFamily: "'NewBlack', sans-serif",
                fontWeight: 800,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
              }}
            >
              Platform Core
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 400,
                mt: 1.5,
                mb: 2,
                fontFamily: "'Maltiner Display', Georgia, serif",
                letterSpacing: '0.03em',
              }}
            >
              How It Works
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontFamily: "'NewBlack', sans-serif",
                maxWidth: '600px',
                mx: 'auto',
                fontSize: '0.9rem',
                lineHeight: 1.6,
              }}
            >
              Robust digital architecture ensuring secure, real-time coordination for home services.
            </Typography>
          </Box>

          {/* Timeline Flex Wrapper (Left Column, Spine, Right Column) */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              position: 'relative',
              width: '100%',
            }}
          >
            {/* Center vertical line */}
            <Box
              sx={{
                display: { xs: 'none', md: 'block' },
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                top: 0,
                bottom: 0,
                width: '2px',
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                zIndex: 1,
              }}
            />

            {/* Left Column (Points 1 & 3) */}
            <Box
              sx={{
                width: { xs: '100%', md: '50%' },
                display: 'flex',
                flexDirection: 'column',
                alignItems: { xs: 'center', md: 'flex-end' },
                gap: { xs: 4, md: 12 },
                pr: { md: 6 }, // Exactly 48px gutter spacing from the center line
                boxSizing: 'border-box',
                zIndex: 2,
              }}
            >
              {/* Step 1 */}
              <Card
                className="spline-timeline-step-left"
                sx={{
                  p: 4,
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  bgcolor: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: 'none',
                  color: '#ffffff',
                  width: '100%',
                  maxWidth: '480px',
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 800,
                    mb: 1.5,
                    fontFamily: "'NewBlack', sans-serif",
                    fontSize: '1.1rem',
                    letterSpacing: '0.02em',
                  }}
                >
                  Real-Time Dispatching (WebSockets)
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    lineHeight: 1.6,
                    fontFamily: "'NewBlack', sans-serif",
                    fontSize: '0.85rem',
                  }}
                >
                  WebSocket pathways connect available Captains and Customers instantly. Real-time notifications push booking requests directly based on status and geographical proximity.
                </Typography>
              </Card>

              {/* Step 3 */}
              <Card
                className="spline-timeline-step-left"
                sx={{
                  p: 4,
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  bgcolor: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: 'none',
                  color: '#ffffff',
                  width: '100%',
                  maxWidth: '480px',
                  mt: { md: 12 },
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 800,
                    mb: 1.5,
                    fontFamily: "'NewBlack', sans-serif",
                    fontSize: '1.1rem',
                    letterSpacing: '0.02em',
                  }}
                >
                  Secure Razorpay Payments & Billing
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    lineHeight: 1.6,
                    fontFamily: "'NewBlack', sans-serif",
                    fontSize: '0.85rem',
                  }}
                >
                  Built-in transaction flow with Razorpay integration. Auto-generates transactional logs, triggers database payment status transitions, and compiles downloadable billing invoices.
                </Typography>
              </Card>
            </Box>

            {/* Right Column (Points 2 & 4) */}
            <Box
              sx={{
                width: { xs: '100%', md: '50%' },
                display: 'flex',
                flexDirection: 'column',
                alignItems: { xs: 'center', md: 'flex-start' },
                gap: { xs: 4, md: 12 },
                pl: { md: 6 }, // Exactly 48px gutter spacing from the center line
                pt: { md: 16 }, // Offset columns to make it alternate
                boxSizing: 'border-box',
                zIndex: 2,
              }}
            >
              {/* Step 2 */}
              <Card
                className="spline-timeline-step-right"
                sx={{
                  p: 4,
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  bgcolor: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: 'none',
                  color: '#ffffff',
                  width: '100%',
                  maxWidth: '480px',
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 800,
                    mb: 1.5,
                    fontFamily: "'NewBlack', sans-serif",
                    fontSize: '1.1rem',
                    letterSpacing: '0.02em',
                  }}
                >
                  Role-Based Dashboard Core
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    lineHeight: 1.6,
                    fontFamily: "'NewBlack', sans-serif",
                    fontSize: '0.85rem',
                  }}
                >
                  Segmented custom control panels. Customers book, track, and pay, while Captains accept bookings, upload work completion metadata, and manage online status.
                </Typography>
              </Card>

              {/* Step 4 */}
              <Card
                className="spline-timeline-step-right"
                sx={{
                  p: 4,
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  bgcolor: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: 'none',
                  color: '#ffffff',
                  width: '100%',
                  maxWidth: '480px',
                  mt: { md: 12 },
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 800,
                    mb: 1.5,
                    fontFamily: "'NewBlack', sans-serif",
                    fontSize: '1.1rem',
                    letterSpacing: '0.02em',
                  }}
                >
                  Automated KYC & Safety Verification
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    lineHeight: 1.6,
                    fontFamily: "'NewBlack', sans-serif",
                    fontSize: '0.85rem',
                  }}
                >
                  Specialized onboarding channels for Captains. Captures document uploads, enables admin KYC status reviews, and verifies service credentials to guarantee user protection.
                </Typography>
              </Card>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* 4. Safety & Assurance Section (Left aligned, text-only, pointwise) */}
      <Box
        sx={{
          bgcolor: 'transparent',
          pb: 12,
          pt: 4,
          position: 'relative',
          zIndex: 10,
          pointerEvents: 'auto',
          color: '#ffffff',
        }}
      >
        <Container maxWidth="lg">
          {/* Header Block */}
          <Box
            className="spline-safety-header"
            sx={{
              textAlign: 'left',
              mb: 8,
              width: '100%',
              maxWidth: '700px',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.4)',
                fontFamily: "'NewBlack', sans-serif",
                fontWeight: 800,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                display: 'block',
                mb: 1.5,
              }}
            >
              TRUST & SAFETY
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 400,
                mb: 2.5,
                fontFamily: "'Maltiner Display', Georgia, serif",
                letterSpacing: '0.03em',
                fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3.2rem' },
                textTransform: 'uppercase',
              }}
            >
              Workizo Quality & Safety Assurance
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontFamily: "'NewBlack', sans-serif",
                fontSize: '1rem',
                lineHeight: 1.6,
                mb: 4,
              }}
            >
              Just like India's top home platforms, we prioritize trust, background verification, and quality of work.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate('/captain/register')}
              sx={{
                borderRadius: '24px',
                px: 4,
                py: 1.2,
                fontWeight: 800,
                fontFamily: "'NewBlack', sans-serif",
                fontSize: '0.8rem',
                color: '#ffffff',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                letterSpacing: '0.05em',
                '&:hover': {
                  borderColor: '#ffffff',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              BECOME A VERIFIED CAPTAIN
            </Button>
          </Box>

          {/* Pointwise Text-only guarantees */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              width: '100%',
              maxWidth: '750px',
            }}
          >
            <Box className="spline-safety-card">
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  fontFamily: "'NewBlack', sans-serif",
                  fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.2rem' },
                  letterSpacing: '0.04em',
                  color: '#ffffff',
                  textTransform: 'uppercase',
                }}
              >
                100% KYC Verified
              </Typography>
            </Box>

            <Box className="spline-safety-card">
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  fontFamily: "'NewBlack', sans-serif",
                  fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.2rem' },
                  letterSpacing: '0.04em',
                  color: '#ffffff',
                  textTransform: 'uppercase',
                }}
              >
                Standardized Pricing
              </Typography>
            </Box>

            <Box className="spline-safety-card">
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  fontFamily: "'NewBlack', sans-serif",
                  fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.2rem' },
                  letterSpacing: '0.04em',
                  color: '#ffffff',
                  textTransform: 'uppercase',
                }}
              >
                Elite Trained Captains
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Elegant long empty space showing the Spline particles */}
      <Box sx={{ height: { xs: '20vh', md: '35vh' } }} />

      {/* 5. Champions of the Startup Idea Section (Founding Team profiles) */}
      <Box
        sx={{
          bgcolor: 'transparent',
          pb: 16,
          pt: 4,
          position: 'relative',
          zIndex: 10,
          pointerEvents: 'auto',
          color: '#ffffff',
        }}
      >
        <Container maxWidth="lg">
          {/* Header Block */}
          <Box
            className="spline-team-header"
            sx={{
              textAlign: 'left',
              mb: 8,
              width: '100%',
              maxWidth: '700px',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.4)',
                fontFamily: "'NewBlack', sans-serif",
                fontWeight: 800,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                display: 'block',
                mb: 1.5,
              }}
            >
              FOUNDING TEAM
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 400,
                mb: 2.5,
                fontFamily: "'Maltiner Display', Georgia, serif",
                letterSpacing: '0.03em',
                fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3.2rem' },
                textTransform: 'uppercase',
              }}
            >
              Champions of the Startup Idea
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontFamily: "'NewBlack', sans-serif",
                fontSize: '1rem',
                lineHeight: 1.6,
              }}
            >
              The minds behind Workizo, dedicated to bridging local home services with modern web architecture.
            </Typography>
          </Box>

          {/* Staggered Founder Cards (Glassmorphic dark design) */}
          <Grid container spacing={4} sx={{ width: '100%' }}>
            {/* Card 1: Ambariya Vivek */}
            <Grid item xs={12} md={6} className="spline-team-card">
              <Card
                sx={{
                  p: 5,
                  borderRadius: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  bgcolor: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: 'none',
                  color: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  height: '100%',
                }}
              >
                <Box
                  sx={{
                    display: 'inline-block',
                    p: '4px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    mb: 3,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      bgcolor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      fontFamily: "'NewBlack', sans-serif",
                      fontSize: '2rem',
                      fontWeight: 800,
                    }}
                  >
                    AV
                  </Avatar>
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: "'NewBlack', sans-serif",
                    fontWeight: 800,
                    color: '#ffffff',
                    mb: 0.5,
                  }}
                >
                  Ambariya Vivek
                </Typography>
                <Box
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    px: 2,
                    py: 0.5,
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    fontFamily: "'NewBlack', sans-serif",
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    mb: 2.5,
                  }}
                >
                  Project Leader & Architect
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    lineHeight: 1.6,
                    fontFamily: "'NewBlack', sans-serif",
                    fontSize: '0.9rem',
                    mb: 3,
                    flexGrow: 1,
                  }}
                >
                  Designed the database structures, set up JWT-based custom session flows, developed role permissions, and integrated notifications via SMTP and WebSockets.
                </Typography>
                {/* Social links */}
                <Box sx={{ display: 'flex', gap: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)', pt: 2, width: '100%', justifyContent: 'center' }}>
                  <IconButton
                    component="a"
                    href="https://linkedin.com/in/vivek-ambariya"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                      '&:hover': {
                        color: '#0A66C2',
                        bgcolor: 'rgba(10, 102, 194, 0.1)',
                      },
                    }}
                  >
                    <LinkedInIcon />
                  </IconButton>
                  <IconButton
                    component="a"
                    href="https://github.com/vivek-ambariya"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                      '&:hover': {
                        color: '#ffffff',
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    <GitHubIcon />
                  </IconButton>
                  <IconButton
                    component="a"
                    href="mailto:ambariyavivek5@gmail.com"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                      '&:hover': {
                        color: '#DB4437',
                        bgcolor: 'rgba(219, 68, 55, 0.1)',
                      },
                    }}
                  >
                    <GoogleIcon />
                  </IconButton>
                </Box>
              </Card>
            </Grid>

            {/* Card 2: Ved Goyani */}
            <Grid item xs={12} md={6} className="spline-team-card">
              <Card
                sx={{
                  p: 5,
                  borderRadius: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  bgcolor: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: 'none',
                  color: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  height: '100%',
                }}
              >
                <Box
                  sx={{
                    display: 'inline-block',
                    p: '4px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    mb: 3,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      bgcolor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      fontFamily: "'NewBlack', sans-serif",
                      fontSize: '2rem',
                      fontWeight: 800,
                    }}
                  >
                    VG
                  </Avatar>
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: "'NewBlack', sans-serif",
                    fontWeight: 800,
                    color: '#ffffff',
                    mb: 0.5,
                  }}
                >
                  Ved Goyani
                </Typography>
                <Box
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    px: 2,
                    py: 0.5,
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    fontFamily: "'NewBlack', sans-serif",
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    mb: 2.5,
                  }}
                >
                  Frontend & UI Developer
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    lineHeight: 1.6,
                    fontFamily: "'NewBlack', sans-serif",
                    fontSize: '0.9rem',
                    mb: 3,
                    flexGrow: 1,
                  }}
                >
                  Crafted high-fidelity web views, interactive booking timelines, worker toggle panels, client dashboard lists, and dynamic maps.
                </Typography>
                {/* Social links */}
                <Box sx={{ display: 'flex', gap: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)', pt: 2, width: '100%', justifyContent: 'center' }}>
                  <IconButton
                    component="a"
                    href="https://linkedin.com/in/ved-goyani"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                      '&:hover': {
                        color: '#0A66C2',
                        bgcolor: 'rgba(10, 102, 194, 0.1)',
                      },
                    }}
                  >
                    <LinkedInIcon />
                  </IconButton>
                  <IconButton
                    component="a"
                    href="https://github.com/ved-goyani"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                      '&:hover': {
                        color: '#ffffff',
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    <GitHubIcon />
                  </IconButton>
                  <IconButton
                    component="a"
                    href="mailto:goyanived@gmail.com"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                      '&:hover': {
                        color: '#DB4437',
                        bgcolor: 'rgba(219, 68, 55, 0.1)',
                      },
                    }}
                  >
                    <GoogleIcon />
                  </IconButton>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Elegant long empty space showing the Spline particles at the bottom */}
      <Box sx={{ height: { xs: '20vh', md: '35vh' } }} />
    </Box>
  );
};

export default SplineLanding;
