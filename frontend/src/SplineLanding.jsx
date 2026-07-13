import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Link, Container, Grid, Card, Button, Avatar, IconButton, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import StarsIcon from '@mui/icons-material/Stars';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import GoogleIcon from '@mui/icons-material/Google';
import VerifiedIcon from '@mui/icons-material/Verified';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import CodeIcon from '@mui/icons-material/Code';
import handymanHero from './assets/handyman_hero.png';
import slide1 from './assets/slide1.jpg';
import slide2 from './assets/slide2.jpg';
import slide3 from './assets/slide3.jpg';
import slide4 from './assets/slide4.jpg';
import slide5 from './assets/slide5.jpg';
import slide6 from './assets/slide6.jpg';
import slide7 from './assets/slide7.jpg';
import slide8 from './assets/slide8.jpg';
import slide9 from './assets/slide9.jpg';
import slide10 from './assets/slide10.jpg';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

const SplineLanding = () => {
  const navigate = useNavigate();

  // Dynamic iframe pointer events state to solve trackpad & touch scroll hijacking
  const [iframePointerEvents, setIframePointerEvents] = useState('auto');
  const scrollTimeoutRef = useRef(null);

  // Slideshow state
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideIntervalRef = useRef(null);
  const TOTAL_SLIDES = 10;

  // Auto-advance slideshow every 4 seconds, loops
  useEffect(() => {
    slideIntervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % TOTAL_SLIDES);
    }, 4000);
    return () => clearInterval(slideIntervalRef.current);
  }, []);

  const goToSlide = (index) => {
    clearInterval(slideIntervalRef.current);
    setCurrentSlide((index + TOTAL_SLIDES) % TOTAL_SLIDES);
    slideIntervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % TOTAL_SLIDES);
    }, 4000);
  };

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

  // GSAP ScrollTrigger animations
  useEffect(() => {
    // 1. Pinned Horizontal text reveal sentence animation & oval mask slide-in
    const textTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.pinned-text-section',
        start: 'top top',
        end: '+=250%', // Extended scroll trackpad space
        pin: true,
        scrub: true,
        anticipatePin: 1,
      }
    });

    // Set initial offscreen state for the half-oval background mask
    gsap.set('.pinned-oval-mask', { x: -380, opacity: 0 });

    textTl
      // 1. Fade in trusted
      .to('.word-comma-trusted', { opacity: 1, duration: 1.2, ease: 'power1.inOut' })
      // 2. Fade in professional
      .to('.word-professional', { opacity: 1, duration: 1.4, ease: 'power1.inOut' })
      // 3. Pause briefly to showcase the full tagline sentence
      .to({}, { duration: 0.8 })
      // 4. Slide up the text and fade it out
      .to('.reveal-text-line', {
        y: -150,
        opacity: 0,
        duration: 1.5,
        ease: 'power2.inOut',
      })
      // 5. Slowly slide in the half-oval image mask from the left side
      .to('.pinned-oval-mask', {
        x: 0,
        opacity: 1,
        duration: 2.0,
        ease: 'power2.out',
      }, '-=0.5'); // Overlap slightly with text slide-up for premium fluidity

    // 2. Set initial hidden states for headers
    gsap.set('.spline-safety-header', { opacity: 0, y: 35 });

    // Left steps scroll-scrub
    gsap.utils.toArray('.spline-timeline-step-left').forEach((card) => {
      gsap.fromTo(card,
        { opacity: 0.15, x: -60 },
        {
          opacity: 1,
          x: 0,
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            end: 'top 55%',
            scrub: 1,
          }
        }
      );
    });

    // Right steps scroll-scrub
    gsap.utils.toArray('.spline-timeline-step-right').forEach((card) => {
      gsap.fromTo(card,
        { opacity: 0.15, x: 60 },
        {
          opacity: 1,
          x: 0,
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            end: 'top 55%',
            scrub: 1,
          }
        }
      );
    });

    // Safety Header Reveal
    ScrollTrigger.create({
      trigger: '.spline-safety-header',
      start: 'top 85%',
      onEnter: () => gsap.to('.spline-safety-header', { opacity: 1, y: 0, duration: 1.4, ease: 'power4.out' }),
      once: true
    });

    // Safety points scroll-scrub
    gsap.utils.toArray('.spline-safety-card').forEach((point) => {
      gsap.fromTo(point,
        { opacity: 0.15, y: 30 },
        {
          opacity: 1,
          y: 0,
          scrollTrigger: {
            trigger: point,
            start: 'top 85%',
            end: 'top 60%',
            scrub: 1,
          }
        }
      );
    });

    // Pinned scroll team reveal timeline
    const teamTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.pinned-team-section',
        start: 'top top',
        end: '+=180%',
        pin: true,
        scrub: true,
        anticipatePin: 1,
      }
    });

    // Set initial card states
    gsap.set('.spline-team-card-left', { opacity: 0.15, x: -120 });
    gsap.set('.spline-team-card-right', { opacity: 0.15, x: 120 });

    teamTl
      .to('.spline-team-card-left', { opacity: 1, x: 0, duration: 1.5, ease: 'power2.out' })
      .to('.spline-team-card-right', { opacity: 1, x: 0, duration: 1.5, ease: 'power2.out' }, '+=0.5');

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

      {/* Pinned Scroll-Reveal Text Section (Apple-style scroll scrubbing sentence) */}
      <Box
        className="pinned-text-section"
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'transparent',
          position: 'relative',
          zIndex: 10,
          pointerEvents: 'none',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Left side half-oval image background mask (hides Spline) */}
        <Box
          className="pinned-oval-mask"
          sx={{
            position: 'absolute',
            left: 0,
            top: '18vh',
            width: { xs: '200px', md: '360px' },
            height: { xs: '350px', md: '580px' },
            bgcolor: '#090d16',
            borderTopRightRadius: { xs: '175px 175px', md: '290px 290px' },
            borderBottomRightRadius: { xs: '175px 175px', md: '290px 290px' },
            zIndex: 2, // above Spline iframe (z-index 1)
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderLeft: 'none',
            pointerEvents: 'none', // let mouse clicks pass through
          }}
        >
          <Box
            component="img"
            src={handymanHero}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.7,
              filter: 'grayscale(20%) brightness(90%)',
            }}
          />
        </Box>

        <Container maxWidth="lg" sx={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <Typography
            className="reveal-text-line"
            sx={{
              fontFamily: "'Maltiner Display', Georgia, serif",
              fontSize: { xs: '1.8rem', sm: '3.2rem', md: '4.8rem' },
              fontWeight: 400,
              lineHeight: 1.25,
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'inline-block',
              maxWidth: '90%',
              mx: 'auto',
            }}
          >
            <span className="word-fast" style={{ opacity: 1 }}>FAST</span>
            <span className="word-comma-trusted" style={{ opacity: 0.15 }}>, TRUSTED</span>
            <span className="word-professional" style={{ opacity: 0.15 }}>, AND PROFESSIONAL HOME SERVICES.</span>
          </Typography>
        </Container>
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

      {/* Elegant long empty space showing the Spline particles */}
      <Box sx={{ height: { xs: '20vh', md: '35vh' } }} />

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
        className="pinned-team-section"
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          bgcolor: 'transparent',
          position: 'relative',
          zIndex: 10,
          pointerEvents: 'auto',
          color: '#ffffff',
          boxSizing: 'border-box',
          overflow: 'hidden',
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

          <Grid container spacing={4} justifyContent="center" alignItems="stretch">
            {/* Card 1: Ambariya Vivek */}
            <Grid item xs={12} md={6} className="spline-team-card-left" sx={{ display: 'flex', justifyContent: 'center' }}>
              <Card
                sx={{
                  p: 4,
                  width: { xs: '100%', sm: '440px' },
                  mx: 'auto',
                  borderRadius: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: 'none',
                  color: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  height: '100%',
                  position: 'relative',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: 'rgba(255, 255, 255, 0.25)',
                    boxShadow: '0 0 25px rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                {/* Avatar with styled scope double-ring */}
                <Box
                  sx={{
                    display: 'inline-block',
                    p: '8px',
                    border: '1px dashed rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    mb: 3.5,
                    mt: 2,
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      p: '4px',
                      border: '2px solid rgba(255, 255, 255, 0.4)',
                      borderRadius: '50%',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 96,
                        height: 96,
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
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
                </Box>

                {/* Name & Role */}
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: "'NewBlack', sans-serif",
                    fontWeight: 800,
                    color: '#ffffff',
                    mb: 0.5,
                    fontSize: '1.4rem',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                  }}
                >
                  Ambariya Vivek
                </Typography>
                <Typography
                  sx={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    fontFamily: "'NewBlack', sans-serif",
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    mb: 4,
                  }}
                >
                  Project Leader & Architect
                </Typography>

                {/* Parameters list (Department, Student, Specialization) */}
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2.5,
                    textAlign: 'left',
                    mb: 4,
                    flexGrow: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <WorkIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 18, mt: 0.3 }} />
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 800, fontFamily: "'NewBlack', sans-serif", letterSpacing: '0.05em' }}>
                        DEPARTMENT
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: '#ffffff', fontFamily: "'NewBlack', sans-serif" }}>
                        Platform Development Unit
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <SchoolIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 18, mt: 0.3 }} />
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 800, fontFamily: "'NewBlack', sans-serif", letterSpacing: '0.05em' }}>
                        STUDENT
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: '#ffffff', fontFamily: "'NewBlack', sans-serif" }}>
                        Computer Engineering (CE)
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <CodeIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 18, mt: 0.3 }} />
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 800, fontFamily: "'NewBlack', sans-serif", letterSpacing: '0.05em' }}>
                        SPECIALIZATION
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: '#ffffff', fontFamily: "'NewBlack', sans-serif" }}>
                        MERN Stack, JWT Auth, WebSockets, Razorpay
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* ID Bar */}
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    pt: 2.5,
                    mb: 3,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.4)',
                      fontWeight: 800,
                      fontFamily: "'NewBlack', sans-serif",
                      letterSpacing: '0.05em',
                    }}
                  >
                    ID: WKZ-001
                  </Typography>
                </Box>

                {/* Social Quick Access Square Buttons */}
                <Box sx={{ display: 'flex', gap: 2, width: '100%', justifyContent: 'center' }}>
                  <IconButton
                    component="a"
                    href="https://linkedin.com/in/vivek-ambariya"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                      color: 'rgba(255, 255, 255, 0.6)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        color: '#ffffff',
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                        transform: 'scale(1.08)',
                      },
                    }}
                  >
                    <LinkedInIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                  <IconButton
                    component="a"
                    href="https://github.com/vivek-ambariya"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                      color: 'rgba(255, 255, 255, 0.6)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        color: '#ffffff',
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                        transform: 'scale(1.08)',
                      },
                    }}
                  >
                    <GitHubIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                  <IconButton
                    component="a"
                    href="mailto:ambariyavivek5@gmail.com"
                    sx={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                      color: 'rgba(255, 255, 255, 0.6)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        color: '#ffffff',
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                        transform: 'scale(1.08)',
                      },
                    }}
                  >
                    <GoogleIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Box>
              </Card>
            </Grid>

            {/* Card 2: Ved Goyani */}
            <Grid item xs={12} md={6} className="spline-team-card-right" sx={{ display: 'flex', justifyContent: 'center' }}>
              <Card
                sx={{
                  p: 4,
                  width: { xs: '100%', sm: '440px' },
                  mx: 'auto',
                  borderRadius: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: 'none',
                  color: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  height: '100%',
                  position: 'relative',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: 'rgba(255, 255, 255, 0.25)',
                    boxShadow: '0 0 25px rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                {/* Avatar with styled scope double-ring */}
                <Box
                  sx={{
                    display: 'inline-block',
                    p: '8px',
                    border: '1px dashed rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    mb: 3.5,
                    mt: 2,
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      p: '4px',
                      border: '2px solid rgba(255, 255, 255, 0.4)',
                      borderRadius: '50%',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 96,
                        height: 96,
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
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
                </Box>

                {/* Name & Role */}
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: "'NewBlack', sans-serif",
                    fontWeight: 800,
                    color: '#ffffff',
                    mb: 0.5,
                    fontSize: '1.4rem',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                  }}
                >
                  Ved Goyani
                </Typography>
                <Typography
                  sx={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    fontFamily: "'NewBlack', sans-serif",
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    mb: 4,
                  }}
                >
                  Frontend & UI Developer
                </Typography>

                {/* Parameters list (Department, Student, Specialization) */}
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2.5,
                    textAlign: 'left',
                    mb: 4,
                    flexGrow: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <WorkIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 18, mt: 0.3 }} />
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 800, fontFamily: "'NewBlack', sans-serif", letterSpacing: '0.05em' }}>
                        DEPARTMENT
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: '#ffffff', fontFamily: "'NewBlack', sans-serif" }}>
                        Frontend & UI Division
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <SchoolIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 18, mt: 0.3 }} />
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 800, fontFamily: "'NewBlack', sans-serif", letterSpacing: '0.05em' }}>
                        STUDENT
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: '#ffffff', fontFamily: "'NewBlack', sans-serif" }}>
                        Computer Engineering (CE)
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <CodeIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 18, mt: 0.3 }} />
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 800, fontFamily: "'NewBlack', sans-serif", letterSpacing: '0.05em' }}>
                        SPECIALIZATION
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: '#ffffff', fontFamily: "'NewBlack', sans-serif" }}>
                        React, UI/UX Design, GSAP, Spline, Maps
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* ID Bar */}
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    pt: 2.5,
                    mb: 3,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.4)',
                      fontWeight: 800,
                      fontFamily: "'NewBlack', sans-serif",
                      letterSpacing: '0.05em',
                    }}
                  >
                    ID: WKZ-002
                  </Typography>
                </Box>

                {/* Social Quick Access Square Buttons */}
                <Box sx={{ display: 'flex', gap: 2, width: '100%', justifyContent: 'center' }}>
                  <IconButton
                    component="a"
                    href="https://linkedin.com/in/ved-goyani"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                      color: 'rgba(255, 255, 255, 0.6)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        color: '#ffffff',
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                        transform: 'scale(1.08)',
                      },
                    }}
                  >
                    <LinkedInIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                  <IconButton
                    component="a"
                    href="https://github.com/ved-goyani"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                      color: 'rgba(255, 255, 255, 0.6)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        color: '#ffffff',
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                        transform: 'scale(1.08)',
                      },
                    }}
                  >
                    <GitHubIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                  <IconButton
                    component="a"
                    href="mailto:goyanived@gmail.com"
                    sx={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                      color: 'rgba(255, 255, 255, 0.6)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        color: '#ffffff',
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                        transform: 'scale(1.08)',
                      },
                    }}
                  >
                    <GoogleIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 6. Project Highlights Slideshow Section */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 10,
          py: { xs: 8, md: 12 },
          px: { xs: 2, md: 8 },
          pointerEvents: 'auto',
        }}
      >
        <Container maxWidth="lg">
          {/* Section header */}
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.4)',
                fontFamily: "'NewBlack', sans-serif",
                fontWeight: 800,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                display: 'block',
                mb: 1.5,
              }}
            >
              GALLERY
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 400,
                fontFamily: "'Maltiner Display', Georgia, serif",
                letterSpacing: '0.03em',
                fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' },
                textTransform: 'uppercase',
                color: '#ffffff',
              }}
            >
              Project Highlights
            </Typography>
          </Box>

          {/* 16:9 slideshow container */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              paddingTop: '56.25%', // 16:9 aspect ratio
              borderRadius: '20px',
              overflow: 'hidden',
              bgcolor: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 0 60px rgba(0,0,0,0.6)',
            }}
          >
            {/* Slides — all 10 real project highlight photos */}
            {[slide1, slide2, slide3, slide4, slide5, slide6, slide7, slide8, slide9, slide10].map((src, i) => (
              <Box
                key={i}
                sx={{
                  position: 'absolute',
                  inset: 0,
                  opacity: currentSlide === i ? 1 : 0,
                  transition: 'opacity 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {src ? (
                  <>
                    {/* Blurred background fills letterbox sides for portrait photos */}
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url(${src})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(24px) brightness(0.3)',
                        transform: 'scale(1.1)',
                        zIndex: 0,
                      }}
                    />
                    {/* Actual image — objectFit contain so portrait photos never crop */}
                    <Box
                      component="img"
                      src={src}
                      alt={`Project highlight ${i + 1}`}
                      sx={{
                        position: 'relative',
                        zIndex: 1,
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: '100%',
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />
                  </>
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      bgcolor: `rgba(255,255,255,${0.01 + i * 0.005})`,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "'Maltiner Display', Georgia, serif",
                        fontSize: { xs: '1.2rem', md: '2rem' },
                        color: 'rgba(255,255,255,0.2)',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        userSelect: 'none',
                      }}
                    >
                      Slide {i + 1}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "'NewBlack', sans-serif",
                        fontSize: '0.75rem',
                        color: 'rgba(255,255,255,0.12)',
                        letterSpacing: '0.08em',
                      }}
                    >
                      Add your photo here
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}

            {/* Prev arrow */}
            <Box
              onClick={() => goToSlide(currentSlide - 1)}
              sx={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 20,
                width: 44,
                height: 44,
                borderRadius: '50%',
                bgcolor: 'rgba(0,0,0,0.45)',
                border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
              }}
            >
              <Typography sx={{ color: '#fff', fontSize: '1.1rem', lineHeight: 1 }}>‹</Typography>
            </Box>

            {/* Next arrow */}
            <Box
              onClick={() => goToSlide(currentSlide + 1)}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 20,
                width: 44,
                height: 44,
                borderRadius: '50%',
                bgcolor: 'rgba(0,0,0,0.45)',
                border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
              }}
            >
              <Typography sx={{ color: '#fff', fontSize: '1.1rem', lineHeight: 1 }}>›</Typography>
            </Box>

            {/* Dot indicators */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 18,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 1,
                zIndex: 20,
              }}
            >
              {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
                <Box
                  key={i}
                  onClick={() => goToSlide(i)}
                  sx={{
                    width: currentSlide === i ? 24 : 7,
                    height: 7,
                    borderRadius: '4px',
                    bgcolor: currentSlide === i ? '#ffffff' : 'rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.35s ease',
                  }}
                />
              ))}
            </Box>

            {/* Slide counter */}
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 20,
                zIndex: 20,
              }}
            >
              <Typography
                sx={{
                  fontFamily: "'NewBlack', sans-serif",
                  fontSize: '0.7rem',
                  color: 'rgba(255,255,255,0.35)',
                  letterSpacing: '0.12em',
                }}
              >
                {String(currentSlide + 1).padStart(2, '0')} / {String(TOTAL_SLIDES).padStart(2, '0')}
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Elegant long empty space showing the Spline particles at the bottom */}
      <Box sx={{ height: { xs: '20vh', md: '35vh' } }} />
    </Box>
  );
};

export default SplineLanding;
