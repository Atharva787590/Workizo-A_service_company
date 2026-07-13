import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Link, Container, Card } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

const SplineLanding = () => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef(null);

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

  const handlePlayVideo = () => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Playback failed", err);
      });
    }
  };

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

  // GSAP ScrollTrigger for How It Works reveals
  useEffect(() => {
    // Set initial hidden states for the scrollable elements
    gsap.set('.spline-timeline-step', { opacity: 0, x: -40 });
    gsap.set('.spline-video-reveal', { opacity: 0, scale: 0.96 });

    // 1. Timeline steps
    ScrollTrigger.batch('.spline-timeline-step', {
      onEnter: batch => gsap.to(batch, { opacity: 1, x: 0, duration: 1.4, stagger: 0.35, ease: 'power4.out', overwrite: 'auto' }),
      start: 'top 85%',
      once: true
    });

    // 2. Video container
    ScrollTrigger.create({
      trigger: '.spline-video-reveal',
      start: 'top 80%',
      onEnter: () => gsap.to('.spline-video-reveal', { opacity: 1, scale: 1, duration: 1.6, ease: 'power4.out' }),
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

          {/* Bottom Right: Entry Portal card */}
          <Box
            sx={{
              pointerEvents: 'auto',
              alignSelf: { xs: 'stretch', md: 'auto' },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2.5,
                p: 3,
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                bgcolor: 'rgba(9, 13, 22, 0.7)',
                backdropFilter: 'blur(16px)',
                maxWidth: { xs: '100%', md: '360px' },
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              }}
            >
              {/* Left thumbnail */}
              <Box
                sx={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '12px',
                  bgcolor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Box
                  component="img"
                  src="/logo.png"
                  alt="Workizo"
                  sx={{
                    width: '42px',
                    height: '42px',
                    objectFit: 'contain',
                  }}
                />
              </Box>

              {/* Right text links */}
              <Box>
                <Typography
                  sx={{
                    fontFamily: "'NewBlack', sans-serif",
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    color: '#ffffff',
                    mb: 0.5,
                  }}
                >
                  ENTER MAIN PORTAL
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "'NewBlack', sans-serif",
                    fontWeight: 400,
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    lineHeight: 1.3,
                    mb: 1.5,
                  }}
                >
                  Book background-verified local service Captains.
                </Typography>
                <Link
                  onClick={() => navigate('/home')}
                  sx={{
                    color: '#ffffff',
                    fontFamily: "'NewBlack', sans-serif",
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    display: 'inline-block',
                    borderBottom: '1px solid #ffffff',
                    pb: 0.2,
                    '&:hover': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      borderColor: 'rgba(255, 255, 255, 0.7)',
                    },
                  }}
                >
                  [ GO TO WEBSITE ]
                </Link>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* 3. How It Works Section (Overlay block with solid dark background and pointerEvents: auto) */}
      <Box
        sx={{
          bgcolor: '#090d16',
          py: 12,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'relative',
          zIndex: 10,
          pointerEvents: 'auto', // Keep fully interactive
          color: '#ffffff',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
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
              Simple Process
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
              Get your home services completed in three easy steps. No complications, just results.
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 6, md: '6%' },
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              mt: 6,
            }}
          >
            {/* Timeline tree */}
            <Box sx={{ width: { xs: '100%', md: '44%' }, flexShrink: 0 }}>
              <Box sx={{ position: 'relative', py: 2 }}>
                {/* Vertical Center Line */}
                <Box
                  sx={{
                    display: { xs: 'none', md: 'block' },
                    position: 'absolute',
                    right: '33px',
                    top: '40px',
                    bottom: '40px',
                    width: '2px',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    zIndex: 1,
                  }}
                />

                {/* Step 1 */}
                <Box
                  className="spline-timeline-step"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: 'row',
                    position: 'relative',
                    zIndex: 2,
                    mb: '32px',
                  }}
                >
                  <Box sx={{ width: { xs: '100%', md: 'calc(100% - 70px)' }, flexShrink: 0 }}>
                    <Card
                      sx={{
                        p: 4,
                        borderRadius: '20px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        bgcolor: 'rgba(255, 255, 255, 0.02)',
                        boxShadow: 'none',
                        color: '#ffffff',
                      }}
                    >
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 800,
                          mb: 1.5,
                          color: '#4F46E5',
                          fontFamily: "'NewBlack', sans-serif",
                        }}
                      >
                        01
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 800,
                          mb: 1,
                          fontFamily: "'NewBlack', sans-serif",
                          letterSpacing: '0.02em',
                        }}
                      >
                        Choose Category
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          lineHeight: 1.6,
                          fontFamily: "'NewBlack', sans-serif",
                        }}
                      >
                        Select from our list of vetted experts (plumber, electrician, etc.) and search local providers.
                      </Typography>
                    </Card>
                  </Box>
                  <Box
                    sx={{
                      display: { xs: 'none', md: 'flex' },
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '70px',
                      flexShrink: 0,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 48,
                        height: 48,
                        bgcolor: '#4F46E5',
                        color: '#ffffff',
                        borderRadius: '50%',
                        fontWeight: 'bold',
                        boxShadow: '0 0 0 6px #090d16, 0 4px 12px rgba(0,0,0,0.3)',
                        zIndex: 3,
                        fontFamily: "'NewBlack', sans-serif",
                      }}
                    >
                      1
                    </Box>
                  </Box>
                </Box>

                {/* Step 2 */}
                <Box
                  className="spline-timeline-step"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: 'row',
                    position: 'relative',
                    zIndex: 2,
                    mb: '32px',
                  }}
                >
                  <Box sx={{ width: { xs: '100%', md: 'calc(100% - 70px)' }, flexShrink: 0 }}>
                    <Card
                      sx={{
                        p: 4,
                        borderRadius: '20px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        bgcolor: 'rgba(255, 255, 255, 0.02)',
                        boxShadow: 'none',
                        color: '#ffffff',
                      }}
                    >
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 800,
                          mb: 1.5,
                          color: '#10B981',
                          fontFamily: "'NewBlack', sans-serif",
                        }}
                      >
                        02
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 800,
                          mb: 1,
                          fontFamily: "'NewBlack', sans-serif",
                          letterSpacing: '0.02em',
                        }}
                      >
                        Match Nearby
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          lineHeight: 1.6,
                          fontFamily: "'NewBlack', sans-serif",
                        }}
                      >
                        Our live dispatcher alerts all online Captains in your category and pairs you in under 5 minutes.
                      </Typography>
                    </Card>
                  </Box>
                  <Box
                    sx={{
                      display: { xs: 'none', md: 'flex' },
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '70px',
                      flexShrink: 0,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 48,
                        height: 48,
                        bgcolor: '#10B981',
                        color: '#ffffff',
                        borderRadius: '50%',
                        fontWeight: 'bold',
                        boxShadow: '0 0 0 6px #090d16, 0 4px 12px rgba(0,0,0,0.3)',
                        zIndex: 3,
                        fontFamily: "'NewBlack', sans-serif",
                      }}
                    >
                      2
                    </Box>
                  </Box>
                </Box>

                {/* Step 3 */}
                <Box
                  className="spline-timeline-step"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: 'row',
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  <Box sx={{ width: { xs: '100%', md: 'calc(100% - 70px)' }, flexShrink: 0 }}>
                    <Card
                      sx={{
                        p: 4,
                        borderRadius: '20px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        bgcolor: 'rgba(255, 255, 255, 0.02)',
                        boxShadow: 'none',
                        color: '#ffffff',
                      }}
                    >
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 800,
                          mb: 1.5,
                          color: '#F59E0B',
                          fontFamily: "'NewBlack', sans-serif",
                        }}
                      >
                        03
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 800,
                          mb: 1,
                          fontFamily: "'NewBlack', sans-serif",
                          letterSpacing: '0.02em',
                        }}
                      >
                        Track Timeline
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          lineHeight: 1.6,
                          fontFamily: "'NewBlack', sans-serif",
                        }}
                      >
                        Track the assigned Captain live on the interactive timeline, verify via secure QR, and settle payments.
                      </Typography>
                    </Card>
                  </Box>
                  <Box
                    sx={{
                      display: { xs: 'none', md: 'flex' },
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '70px',
                      flexShrink: 0,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 48,
                        height: 48,
                        bgcolor: '#F59E0B',
                        color: '#ffffff',
                        borderRadius: '50%',
                        fontWeight: 'bold',
                        boxShadow: '0 0 0 6px #090d16, 0 4px 12px rgba(0,0,0,0.3)',
                        zIndex: 3,
                        fontFamily: "'NewBlack', sans-serif",
                      }}
                    >
                      3
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Video Player */}
            <Box sx={{ width: { xs: '100%', md: '50%' }, flexShrink: 0, display: 'flex', justifyContent: 'center' }} className="spline-video-reveal">
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16/9',
                  background: 'linear-gradient(135deg, #4F46E5, #3b82f6)',
                  padding: '2px',
                  borderRadius: '24px',
                  boxShadow: '0 25px 70px rgba(0, 0, 0, 0.4)',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#090d16',
                    borderRadius: '22px',
                    overflow: 'hidden',
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    loop
                    playsInline
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: 'inherit',
                      display: 'block',
                    }}
                  >
                    <source src="/videos/WORKIZO_Premium_Hero_Video_Obj.mp4" type="video/mp4" />
                    <source src="/videos/workizo-promo.mp4" type="video/mp4" />
                    <source src="https://assets.mixkit.co/videos/preview/mixkit-hand-of-a-plumber-with-a-wrench-fixing-a-sink-40919-large.mp4" type="video/mp4" />
                  </video>

                  {!isPlaying && (
                    <Box
                      onClick={handlePlayVideo}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(9, 13, 22, 0.95)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer',
                        zIndex: 10,
                        p: 4,
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <Box
                        sx={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 8px 30px rgba(79, 70, 229, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                          transition: 'transform 0.2s ease',
                          '&:hover': { transform: 'scale(1.1)' },
                        }}
                      >
                        <PlayArrowIcon sx={{ color: '#4F46E5', fontSize: '48px', ml: 0.5 }} />
                      </Box>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 800,
                          color: '#ffffff',
                          fontFamily: "'NewBlack', sans-serif",
                          mb: 1,
                          letterSpacing: '0.05em',
                        }}
                      >
                        WORKIZO IN ACTION
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          maxWidth: '400px',
                          lineHeight: 1.5,
                          fontFamily: "'NewBlack', sans-serif",
                        }}
                      >
                        See how our Captains deliver trusted services right at your doorstep.
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default SplineLanding;
