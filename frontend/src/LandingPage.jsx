import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from './services/api';
import {
  Container, Typography, Button, Box, Grid, Card, CardContent,
  Avatar, TextField, InputAdornment, Select, MenuItem, InputLabel,
  FormControl, CardActionArea, useTheme, Divider, Rating, Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RoomIcon from '@mui/icons-material/Room';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import PlumbingIcon from '@mui/icons-material/Plumbing';
import HandymanIcon from '@mui/icons-material/Handyman';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import BuildIcon from '@mui/icons-material/Build';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import StarsIcon from '@mui/icons-material/Stars';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

const ALL_CATEGORIES = [
  { id: '1', name: 'Electrician', icon: <ElectricalServicesIcon sx={{ fontSize: 32, color: '#f59e0b' }} />, bgColor: 'rgba(245, 158, 11, 0.08)', desc: 'Fan, lights & wiring repairs' },
  { id: '2', name: 'Plumber', icon: <PlumbingIcon sx={{ fontSize: 32, color: '#3b82f6' }} />, bgColor: 'rgba(59, 130, 246, 0.08)', desc: 'Taps, pipes & leak fixes' },
  { id: '3', name: 'Carpenter', icon: <HandymanIcon sx={{ fontSize: 32, color: '#10b981' }} />, bgColor: 'rgba(16, 185, 129, 0.08)', desc: 'Furniture, lock & door repairs' },
  { id: '4', name: 'AC Technician', icon: <AcUnitIcon sx={{ fontSize: 32, color: '#06b6d4' }} />, bgColor: 'rgba(6, 182, 212, 0.08)', desc: 'AC filter, gas & serving' },
  { id: '5', name: 'Mechanic', icon: <BuildIcon sx={{ fontSize: 32, color: '#ef4444' }} />, bgColor: 'rgba(239, 68, 68, 0.08)', desc: 'Bike & car engine checks' },
  { id: '6', name: 'Home Cleaning', icon: <CleaningServicesIcon sx={{ fontSize: 32, color: '#8b5cf6' }} />, bgColor: 'rgba(139, 92, 246, 0.08)', desc: 'Deep house & kitchen cleaning' },
];

const TESTIMONIALS = [
  { name: 'Kunal Patel', location: 'Satellite, Ahmedabad', text: 'Booked an AC servicing Captain. He arrived within an hour with proper tools and fixed the cooling immediately. Excellent service!', rating: 5 },
  { name: 'Aarushi Shah', location: 'Vastrapur, Ahmedabad', text: 'The deep kitchen cleaning was flawless. Vetted professional, safe background checks. Very reliable.', rating: 5 },
  { name: 'Mehul Mehta', location: 'Bopal, Ahmedabad', text: 'Quick carpenter booking to fix our entrance door latch. Fair pricing, no hassles. Fully satisfied.', rating: 4 },
];

import handymanHero from './assets/handyman_hero.png';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef(null);

  const handlePlayVideo = () => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Playback failed", err);
      });
    }
  };

  const [city, setCity] = useState('Ahmedabad');
  const [searchQuery, setSearchQuery] = useState('');
  const [dbCategories, setDbCategories] = useState([]);

  useEffect(() => {
    api.get('/api/services/categories/')
      .then(res => {
        setDbCategories(res.data);
      })
      .catch(err => {
        console.error('Failed to fetch categories:', err);
      });
  }, []);

  // GSAP ScrollTrigger implementation to reveal information on scroll
  useEffect(() => {
    // Set initial hidden states for Hero Section
    gsap.set('.landing-hero-title', { opacity: 0, y: 30 });
    gsap.set('.landing-hero-desc', { opacity: 0, y: 20 });
    gsap.set('.landing-hero-btn', { opacity: 0, scale: 0.95 });
    gsap.set('.landing-hero-highlight', { opacity: 0, y: 20 });
    gsap.set('.landing-hero-img', { opacity: 0, x: 40, scale: 0.95 });

    // Set initial hidden states for scroll reveals
    gsap.set('.timeline-step', { opacity: 0, x: -40 });
    gsap.set('.video-container-reveal', { opacity: 0, scale: 0.96 });
    gsap.set('.categories-header-reveal', { opacity: 0, y: 40 });
    gsap.set('.search-widget-reveal', { opacity: 0, y: 30 });
    gsap.set('.category-item-reveal', { opacity: 0, y: 40, scale: 0.96 });
    gsap.set('.safety-header-reveal', { opacity: 0, y: 40 });
    gsap.set('.safety-card-reveal', { opacity: 0, y: 50 });

    // Hero Section Load Timeline
    const heroTl = gsap.timeline({ defaults: { ease: 'power4.out', duration: 1.2 } });
    heroTl.to('.landing-hero-title', { opacity: 1, y: 0 })
          .to('.landing-hero-desc', { opacity: 1, y: 0 }, '-=0.8')
          .to('.landing-hero-btn', { opacity: 1, scale: 1 }, '-=0.8')
          .to('.landing-hero-highlight', { opacity: 1, y: 0, stagger: 0.15 }, '-=0.8')
          .to('.landing-hero-img', { opacity: 1, x: 0, scale: 1, duration: 1.4 }, '-=1.2');

    // 1. Timeline steps slide-in
    ScrollTrigger.batch('.timeline-step', {
      onEnter: batch => gsap.to(batch, { opacity: 1, x: 0, duration: 1.4, stagger: 0.35, ease: 'power4.out', overwrite: 'auto' }),
      start: 'top 85%',
      once: true
    });

    // 2. Video container zoom/fade-in
    ScrollTrigger.create({
      trigger: '.video-container-reveal',
      start: 'top 80%',
      onEnter: () => gsap.to('.video-container-reveal', { opacity: 1, scale: 1, duration: 1.6, ease: 'power4.out' }),
      once: true
    });

    // 3. Categories section header reveal
    ScrollTrigger.create({
      trigger: '.categories-header-reveal',
      start: 'top 85%',
      onEnter: () => gsap.to('.categories-header-reveal', { opacity: 1, y: 0, duration: 1.4, ease: 'power4.out' }),
      once: true
    });

    // 4. Categories search widget reveal
    ScrollTrigger.create({
      trigger: '.search-widget-reveal',
      start: 'top 85%',
      onEnter: () => gsap.to('.search-widget-reveal', { opacity: 1, y: 0, duration: 1.4, ease: 'power4.out' }),
      once: true
    });

    // 5. Staggered reveal for Category cards grid
    ScrollTrigger.batch('.category-item-reveal', {
      onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, scale: 1, duration: 1.2, stagger: 0.12, ease: 'power4.out', overwrite: 'auto' }),
      start: 'top 85%',
      once: true
    });

    // 6. Safety section header reveal
    ScrollTrigger.create({
      trigger: '.safety-header-reveal',
      start: 'top 85%',
      onEnter: () => gsap.to('.safety-header-reveal', { opacity: 1, y: 0, duration: 1.4, ease: 'power4.out' }),
      once: true
    });

    // 7. Safety cards staggered fade/slide-up
    ScrollTrigger.batch('.safety-card-reveal', {
      onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, duration: 1.4, stagger: 0.35, ease: 'power4.out', overwrite: 'auto' }),
      start: 'top 85%',
      once: true
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  const filteredCategories = ALL_CATEGORIES.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategoryClick = (catName) => {
    const matched = dbCategories.find(c => c.name.toLowerCase() === catName.toLowerCase());
    const catId = matched ? matched.id : null;

    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Please log in first to book a service');
      if (catId) {
        localStorage.setItem('redirect_after_login', `/customer/book?category=${catId}`);
      } else {
        localStorage.setItem('redirect_after_login', '/customer/book');
      }
      navigate('/customer/login');
    } else {
      if (catId) {
        navigate(`/customer/book?category=${catId}`);
      } else {
        navigate('/customer/book');
      }
    }
  };

  return (
    <Box sx={{ pb: 8 }}>

      {/* 1. Hero Section (First Look - Light Mode Boxy Style) */}
      <Box sx={{ background: '#ffffff', pt: { xs: 8, md: 10 }, pb: { xs: 8, md: 10 }, borderBottom: '1px solid #E5E7EB' }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: { xs: 6, md: 8 }
            }}
          >
            {/* Left Side: Copywriting and CTA */}
            <Box sx={{ width: { xs: '100%', md: '55%' }, display: 'flex', flexDirection: 'column' }}>
              <Typography
                variant="h1"
                component="h1"
                className="landing-hero-title"
                sx={{
                  fontSize: { xs: '2.5rem', sm: '3.2rem', md: '4rem' },
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.15,
                  mb: 2.5,
                  color: '#0F0F14',
                  fontFamily: 'Outfit, sans-serif'
                }}
              >
                One Request,<br />
                <span style={{ color: '#4f46e5' }}>One Skilled Solution</span>
              </Typography>

              <Typography
                variant="body1"
                className="landing-hero-desc"
                sx={{
                  mb: 4.5,
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  color: '#4B5563',
                  lineHeight: 1.6,
                  maxWidth: '480px'
                }}
              >
                At Workizo we ensure our customers get background-verified local service professionals quickly at the most affordable prices.
              </Typography>

              <Box sx={{ alignSelf: 'flex-start' }}>
                <Button
                  variant="contained"
                  className="landing-hero-btn"
                  onClick={() => {
                    const token = localStorage.getItem('access_token');
                    if (!token) {
                      toast.error('Please log in first to book a service');
                      localStorage.setItem('redirect_after_login', '/customer/book');
                      navigate('/customer/login');
                    } else {
                      navigate('/customer/book');
                    }
                  }}
                  sx={{
                    bgcolor: '#000000',
                    color: '#ffffff',
                    borderRadius: '30px',
                    fontWeight: 'bold',
                    fontSize: '1.05rem',
                    px: 4,
                    py: 1.8,
                    mb: 6,
                    textTransform: 'none',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                    '&:hover': {
                      bgcolor: '#222222',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
                    }
                  }}
                >
                  Book Service Now &rarr;
                </Button>
              </Box>

              {/* Three bottom highlights */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #E5E7EB',
                  pt: 3.5,
                  gap: 2
                }}
              >
                <Box className="landing-hero-highlight" sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#0F0F14' }}>
                    Verified
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, display: 'block', mt: 0.5 }}>
                    CAPTAIN PARTNERS
                  </Typography>
                </Box>
                <Box className="landing-hero-highlight" sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#0F0F14' }}>
                    Live
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, display: 'block', mt: 0.5 }}>
                    TRACKING TIMELINE
                  </Typography>
                </Box>
                <Box className="landing-hero-highlight" sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#0F0F14' }}>
                    Fixed
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, display: 'block', mt: 0.5 }}>
                    PRICE QUOTES
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Right Side: Handyman Portrait Image Card */}
            <Box
              className="landing-hero-img"
              sx={{
                width: { xs: '100%', md: '45%' },
                display: 'flex',
                justifyContent: { xs: 'center', md: 'flex-end' },
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <Box
                  component="img"
                  src={handymanHero}
                  alt="Professional Handyman"
                  sx={{
                    width: '100%',
                    maxWidth: '480px',
                    height: 'auto',
                    borderRadius: '24px',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
                    border: '1px solid rgba(229, 231, 235, 0.5)',
                    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': {
                      transform: 'scale(1.02) translateY(-4px)',
                      boxShadow: '0 30px 60px -15px rgba(0,0,0,0.25)',
                    }
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* 2. Timeline & Video Process Section (GSAP Scroll-Revealed) */}
      <Box sx={{ bgcolor: '#FAFAFB', py: 10, borderBottom: '1px solid #E5E7EB' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="caption" sx={{ color: '#000000', fontWeight: 700, letterSpacing: '0.1rem', textTransform: 'uppercase' }}>
              Simple Process
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, mt: 1, mb: 2, fontFamily: 'Outfit, sans-serif' }}>
              How It Works
            </Typography>
            <Typography variant="body1" sx={{ color: '#6B7280', maxWidth: '600px', mx: 'auto' }}>
              Get your home services completed in three easy steps. No complications, just results.
            </Typography>
          </Box>

          {/* 50/50 Flexbox Layout */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 4, md: '4%' },
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              mt: 6,
              mb: 4
            }}
          >
            {/* Left Column: 42% */}
            <Box sx={{ width: { xs: '100%', md: '42%', lg: '42%' }, flexShrink: 0 }}>
              {/* Centered Timeline Tree */}
              <Box sx={{ position: 'relative', py: 2 }}>
                {/* Vertical Center Line */}
                <Box
                  sx={{
                    display: { xs: 'none', md: 'block' },
                    position: 'absolute',
                    right: '33px',
                    top: '40px',
                    bottom: '40px',
                    width: '4px',
                    bgcolor: '#E5E7EB',
                    borderRadius: '2px',
                    zIndex: 1
                  }}
                />

                {/* Step 1 */}
                <Box
                  className="timeline-step"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: 'row',
                    position: 'relative',
                    zIndex: 2,
                    mb: '32px'
                  }}
                >
                  {/* Card */}
                  <Box sx={{ width: { xs: '100%', md: 'calc(100% - 70px)' }, flexShrink: 0 }}>
                    <Card sx={{ p: 4, borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', bgcolor: '#ffffff' }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: '#1A73E8' }}>01</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: '#0F0F14' }}>Choose Category</Typography>
                      <Typography variant="body2" sx={{ color: '#6B7280', lineHeight: 1.6 }}>
                        Select from our list of vetted experts (plumber, electrician, etc.) and search local providers.
                      </Typography>
                    </Card>
                  </Box>

                  {/* Circle Indicator */}
                  <Box
                    sx={{
                      display: { xs: 'none', md: 'flex' },
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '70px',
                      flexShrink: 0
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 48,
                        height: 48,
                        bgcolor: '#1A73E8',
                        color: '#ffffff',
                        borderRadius: '50%',
                        fontWeight: 'bold',
                        boxShadow: '0 0 0 6px #FAFAFB, 0 4px 12px rgba(0,0,0,0.08)',
                        zIndex: 3
                      }}
                    >
                      1
                    </Box>
                  </Box>
                </Box>

                {/* Step 2 */}
                <Box
                  className="timeline-step"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: 'row',
                    position: 'relative',
                    zIndex: 2,
                    mb: '32px'
                  }}
                >
                  {/* Card */}
                  <Box sx={{ width: { xs: '100%', md: 'calc(100% - 70px)' }, flexShrink: 0 }}>
                    <Card sx={{ p: 4, borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', bgcolor: '#ffffff' }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: '#34A853' }}>02</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: '#0F0F14' }}>Match Nearby</Typography>
                      <Typography variant="body2" sx={{ color: '#6B7280', lineHeight: 1.6 }}>
                        Our live dispatcher alerts all online Captains in your category and pairs you in under 5 minutes.
                      </Typography>
                    </Card>
                  </Box>

                  {/* Circle Indicator */}
                  <Box
                    sx={{
                      display: { xs: 'none', md: 'flex' },
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '70px',
                      flexShrink: 0
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 48,
                        height: 48,
                        bgcolor: '#34A853',
                        color: '#ffffff',
                        borderRadius: '50%',
                        fontWeight: 'bold',
                        boxShadow: '0 0 0 6px #FAFAFB, 0 4px 12px rgba(0,0,0,0.08)',
                        zIndex: 3
                      }}
                    >
                      2
                    </Box>
                  </Box>
                </Box>

                {/* Step 3 */}
                <Box
                  className="timeline-step"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: 'row',
                    position: 'relative',
                    zIndex: 2
                  }}
                >
                  {/* Card */}
                  <Box sx={{ width: { xs: '100%', md: 'calc(100% - 70px)' }, flexShrink: 0 }}>
                    <Card sx={{ p: 4, borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', bgcolor: '#ffffff' }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: '#FBBC05' }}>03</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: '#0F0F14' }}>Track Timeline</Typography>
                      <Typography variant="body2" sx={{ color: '#6B7280', lineHeight: 1.6 }}>
                        Track the assigned Captain live on the interactive timeline, verify via secure QR, and settle payments.
                      </Typography>
                    </Card>
                  </Box>

                  {/* Circle Indicator */}
                  <Box
                    sx={{
                      display: { xs: 'none', md: 'flex' },
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '70px',
                      flexShrink: 0
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 48,
                        height: 48,
                        bgcolor: '#FBBC05',
                        color: '#ffffff',
                        borderRadius: '50%',
                        fontWeight: 'bold',
                        boxShadow: '0 0 0 6px #FAFAFB, 0 4px 12px rgba(0,0,0,0.08)',
                        zIndex: 3
                      }}
                    >
                      3
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Right Column: 54% (Video Showcase Container) */}
            <Box sx={{ width: { xs: '100%', md: '54%', lg: '54%' }, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
              <Box
                className="video-container-reveal"
                sx={{
                  position: { xs: 'relative', lg: 'sticky' },
                  top: { xs: 'auto', lg: '180px' },
                  width: '100%',
                  aspectRatio: '16/9',
                  background: 'linear-gradient(135deg, #4F46E5, #60A5FA)',
                  padding: '2px',
                  borderRadius: '24px',
                  boxShadow: '0 25px 70px rgba(0, 0, 0, 0.15)',
                  zIndex: 5,
                  mb: { xs: 4, lg: 0 },
                  overflow: 'hidden'
                }}
              >
                {/* Inner Video Container */}
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#ffffff',
                    borderRadius: '22px',
                    overflow: 'hidden',
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  {/* Loop-friendly video playing inline */}
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
                      display: 'block'
                    }}
                  >
                    <source src="/videos/WORKIZO_Premium_Hero_Video_Obj.mp4" type="video/mp4" />
                    <source src="/videos/workizo-promo.mp4" type="video/mp4" />
                    <source src="https://assets.mixkit.co/videos/preview/mixkit-hand-of-a-plumber-with-a-wrench-fixing-a-sink-40919-large.mp4" type="video/mp4" />
                  </video>

                  {/* Overlay shown when video is paused / not playing */}
                  {!isPlaying && (
                    <Box
                      onClick={handlePlayVideo}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.85)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer',
                        zIndex: 10,
                        p: 4,
                        textAlign: 'center',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {/* Play Button */}
                      <Box
                        sx={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 8px 30px rgba(26, 115, 232, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                          transition: 'transform 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.1)'
                          }
                        }}
                      >
                        <PlayArrowIcon sx={{ color: '#1A73E8', fontSize: '48px', ml: 0.5 }} />
                      </Box>

                      {/* Title */}
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 800,
                          color: '#0F0F14',
                          fontFamily: 'Outfit, sans-serif',
                          mb: 1,
                          letterSpacing: '0.05em'
                        }}
                      >
                        WORKIZO IN ACTION
                      </Typography>

                      {/* Subtitle */}
                      <Typography
                        variant="body1"
                        sx={{
                          color: '#5F6368',
                          maxWidth: '400px',
                          lineHeight: 1.5,
                          fontSize: '0.9rem'
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

      {/* 3. Category Search & Selection Section (GSAP Scroll-Revealed) */}
      <Container maxWidth="md" sx={{ mt: 10 }} className="categories-header-reveal">
        <Typography variant="h4" fontWeight={700} align="center" sx={{ mb: 1.5, fontFamily: 'Outfit, sans-serif' }}>
          Select a Service Category
        </Typography>
        <Typography variant="body1" align="center" sx={{ color: '#6B7280', mb: 5 }}>
          Search for standard service providers in your neighborhood.
        </Typography>

        {/* Central Search Widget */}
        <Paper
          elevation={0}
          className="search-widget-reveal"
          sx={{
            p: 1,
            display: 'flex',
            alignItems: 'center',
            mx: 'auto',
            mb: 6,
            maxWidth: '650px',
            backgroundColor: '#ffffff',
            border: '1px solid #E5E7EB',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1.5, sm: 0 }
          }}
        >
          {/* Location selector */}
          <Box display="flex" alignItems="center" sx={{ pl: 1, minWidth: '160px', width: { xs: '100%', sm: 'auto' } }}>
            <RoomIcon sx={{ color: '#000000', mr: 1 }} />
            <Select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              variant="standard"
              disableUnderline
              sx={{
                color: '#0F0F14',
                fontWeight: 600,
                fontSize: '0.95rem',
                width: '100%',
                textAlign: 'left'
              }}
            >
              <MenuItem value="Ahmedabad">Ahmedabad</MenuItem>
              <MenuItem value="Mumbai">Mumbai</MenuItem>
              <MenuItem value="Delhi">Delhi NCR</MenuItem>
              <MenuItem value="Bangalore">Bangalore</MenuItem>
              <MenuItem value="Pune">Pune</MenuItem>
            </Select>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' }, mx: 2, borderColor: '#E5E7EB' }} />

          {/* Service Search Input */}
          <TextField
            placeholder="Search for 'AC service', 'plumber', 'electrician'..."
            variant="standard"
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              disableUnderline: true,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#6B7280', ml: { xs: 0, sm: 1 } }} />
                </InputAdornment>
              ),
              style: { color: '#0F0F14', fontSize: '0.95rem' }
            }}
            sx={{ width: '100%' }}
          />
        </Paper>

        <Grid container spacing={3} justifyContent="center">
          {filteredCategories.map((cat) => (
            <Grid item xs={6} sm={4} md={2} key={cat.id} sx={{ textAlign: 'center' }} className="category-item-reveal">
              <Box
                onClick={() => handleCategoryClick(cat.name)}
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  backgroundColor: cat.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 1.5,
                  cursor: 'pointer',
                  border: '1px solid transparent',
                  transition: 'transform 0.2s, border-color 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    borderColor: '#000000'
                  }
                }}
              >
                {cat.icon}
              </Box>
              <Typography variant="subtitle2" fontWeight="600" color="text.primary">
                {cat.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                {cat.desc}
              </Typography>
            </Grid>
          ))}
          {filteredCategories.length === 0 && (
            <Box sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}>
              No categories match your search. Try "AC", "electrician", etc.
            </Box>
          )}
        </Grid>
      </Container>

      {/* 4. Safety & Assurance Section (GSAP Scroll-Revealed) */}
      <Container maxWidth="lg" sx={{ mt: 10, pt: 8, borderTop: '1px solid #E5E7EB', pb: 10 }} className="safety-header-reveal">
        {/* Header Block */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, fontFamily: 'Outfit, sans-serif' }}>
            Workizo Quality & Safety Assurance
          </Typography>
          <Typography variant="body1" sx={{ color: '#6B7280', maxWidth: '700px', mx: 'auto', mb: 3 }}>
            Just like India's top home platforms, we prioritize trust, background verification, and quality of work.
          </Typography>
          <Button variant="outlined" color="primary" onClick={() => navigate('/captain/register')} sx={{ borderRadius: '24px', px: 4, py: 1, fontWeight: 700 }}>
            Become a Verified Captain
          </Button>
        </Box>

        {/* 3-Column Grid of Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4} className="safety-card-reveal">
            <Card sx={{ p: 3, height: '100%', backgroundColor: '#ffffff', borderColor: '#E5E7EB', boxShadow: 'none', border: '1px solid #E5E7EB', borderRadius: '16px' }}>
              <VerifiedUserIcon color="primary" sx={{ fontSize: 36, mb: 1.5 }} />
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                100% KYC Verified
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Every Captain is verified via Aadhaar & PAN background checks prior to platform listing.
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4} className="safety-card-reveal">
            <Card sx={{ p: 3, height: '100%', backgroundColor: '#ffffff', borderColor: '#E5E7EB', boxShadow: 'none', border: '1px solid #E5E7EB', borderRadius: '16px' }}>
              <MonetizationOnIcon color="primary" sx={{ fontSize: 36, mb: 1.5 }} />
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                Standardized Pricing
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                No bargaining. Get fixed, fair quotes for all categories before work begins.
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4} className="safety-card-reveal">
            <Card sx={{ p: 3, height: '100%', backgroundColor: '#ffffff', borderColor: '#E5E7EB', boxShadow: 'none', border: '1px solid #E5E7EB', borderRadius: '16px' }}>
              <StarsIcon sx={{ color: '#F59E0B', fontSize: 36, mb: 1.5 }} />
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                Elite Trained Captains
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Only experienced local experts are matched to guarantee 100% satisfaction.
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Container>

    </Box>
  );
};

// Simple Mock chip for promotions
const Chip = ({ label, size, sx }) => (
  <Box
    sx={{
      px: 1.5,
      py: 0.5,
      borderRadius: 1,
      display: 'inline-block',
      ...sx
    }}
  >
    <Typography variant="caption">{label}</Typography>
  </Box>
);

export default LandingPage;
