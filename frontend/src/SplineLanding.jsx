import React, { useEffect } from 'react';
import { Box, Grid, Typography, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const SplineLanding = () => {
  const navigate = useNavigate();

  // Load Playfair Display Serif font dynamically
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Outfit:wght@300;400;600;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        margin: 0,
        padding: 0,
        bgcolor: '#090d16', // Fallback color matching Spline theme
      }}
    >
      {/* 1. Spline interactive background */}
      <iframe
        src="https://my.spline.design/particles-YTBDLEkKYDerayq5gxeww7yv/"
        frameBorder="0"
        width="100%"
        height="100%"
        title="Spline Particles"
        allow="autoplay; fullscreen"
        style={{
          border: 'none',
          width: '100%',
          height: '100%',
          display: 'block',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
        }}
      />

      {/* 2. Brand Overlay (Interaction passes through to Spline canvas via pointerEvents: 'none') */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: { xs: 4, md: 8 },
          pointerEvents: 'none',
          color: '#ffffff',
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
                fontFamily: 'Outfit, sans-serif',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
              }}
            >
              [ EN ] &nbsp; [ HI ]
            </Typography>
            <Typography
              onClick={() => navigate('/home')}
              sx={{
                fontFamily: "'Playfair Display', serif",
                fontSize: { xs: '1.8rem', md: '2.5rem' },
                fontWeight: 600,
                letterSpacing: '0.05em',
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
                  fontFamily: 'Outfit, sans-serif',
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
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
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
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
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
                  fontFamily: 'Outfit, sans-serif',
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
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
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
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
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
                fontFamily: "'Playfair Display', serif",
                fontWeight: 900,
                fontSize: { xs: '1.8rem', sm: '2.8rem', md: '3.6rem' },
                lineHeight: 1.15,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
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
                    fontFamily: 'Outfit, sans-serif',
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
                    fontFamily: 'Outfit, sans-serif',
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
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '0.8rem',
                    fontWeight: 600,
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
