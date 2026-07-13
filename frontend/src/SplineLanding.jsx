import React, { useEffect } from 'react';
import { Box, Typography, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const SplineLanding = () => {
  const navigate = useNavigate();

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
          pointerEvents: 'auto', // Allows hover interaction with canvas
        }}
      />

      {/* 2. Brand Overlay - RELATIVE document layout allowing content to scroll */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: { xs: 4, md: 8 },
          pointerEvents: 'none', // Hover events bypass this layer to hit fixed iframe
          boxSizing: 'border-box',
          gap: 6,
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
                pointerEvents: 'auto', // Enabled clicking
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
              pointerEvents: 'auto', // Enabled links clicking
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
              pointerEvents: 'auto', // Enabled portal card clicking
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
    </Box>
  );
};

export default SplineLanding;
