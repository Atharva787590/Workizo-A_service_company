import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from './services/api';
import { motion } from 'framer-motion';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
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
  const [city, setCity] = useState('Ahmedabad');
  const [searchQuery, setSearchQuery] = useState('');
  const [dbCategories, setDbCategories] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  const handlePlayVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.log("Autoplay / Play interrupted:", err);
        });
      }
    }
  };

  useEffect(() => {
    api.get('/api/services/categories/')
      .then(res => {
        setDbCategories(res.data);
      })
      .catch(err => {
        console.error('Failed to fetch categories:', err);
      });
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

      {/* Boxy-Style Split Hero Section */}
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
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#0F0F14' }}>
                    Verified
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, display: 'block', mt: 0.5 }}>
                    CAPTAIN PARTNERS
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#0F0F14' }}>
                    Live
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, display: 'block', mt: 0.5 }}>
                    TRACKING TIMELINE
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#0F0F14' }}>
                    Fixed
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, display: 'block', mt: 0.5 }}>
                    PRICE QUOTES
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Right Side: Generated Handyman Portrait Image Card */}
            <Box
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

      {/* Simple Process: How It Works Section */}
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

          {/* 60/40 Flexbox Container */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              gap: { xs: 4, lg: 6 },
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              mt: 6,
              mb: 4
            }}
          >
            {/* Left Column: 60% (Existing How It Works timeline) */}
            <Box sx={{ width: { xs: '100%', lg: '57%' }, flexShrink: 0 }}>
              {/* Centered Timeline Tree */}
              <Box sx={{ position: 'relative', py: 2 }}>
                {/* Vertical Center Line */}
                <Box
                  sx={{
                    position: 'absolute',
                    right: '22px',
                    top: '24px',
                    bottom: '24px',
                    width: '4px',
                    bgcolor: '#E5E7EB',
                    borderRadius: '2px',
                    zIndex: 1
                  }}
                />

                {/* Step 1 */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', position: 'relative', zIndex: 2, mb: 6 }}>
                  <Card sx={{ p: 4, maxWidth: '460px', width: '100%', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', bgcolor: '#ffffff', mr: '32px' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: '#1A73E8' }}>01</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: '#0F0F14' }}>Choose Category</Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280', lineHeight: 1.6 }}>
                      Select from our list of vetted experts (plumber, electrician, etc.) and search local providers.
                    </Typography>
                  </Card>
                  
                  {/* Circle Indicator */}
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
                      zIndex: 3,
                      flexShrink: 0
                    }}
                  >
                    1
                  </Box>
                </Box>

                {/* Step 2 */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', position: 'relative', zIndex: 2, mb: 6 }}>
                  <Card sx={{ p: 4, maxWidth: '460px', width: '100%', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', bgcolor: '#ffffff', mr: '32px' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: '#34A853' }}>02</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: '#0F0F14' }}>Match Nearby</Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280', lineHeight: 1.6 }}>
                      Our live dispatcher alerts all online Captains in your category and pairs you in under 5 minutes.
                    </Typography>
                  </Card>

                  {/* Circle Indicator */}
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
                      zIndex: 3,
                      flexShrink: 0
                    }}
                  >
                    2
                  </Box>
                </Box>

                {/* Step 3 */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', position: 'relative', zIndex: 2 }}>
                  <Card sx={{ p: 4, maxWidth: '460px', width: '100%', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', bgcolor: '#ffffff', mr: '32px' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: '#FBBC05' }}>03</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: '#0F0F14' }}>Track Timeline</Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280', lineHeight: 1.6 }}>
                      Track the assigned Captain live on the interactive timeline, verify via secure QR, and settle payments.
                    </Typography>
                  </Card>

                  {/* Circle Indicator */}
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
                      zIndex: 3,
                      flexShrink: 0
                    }}
                  >
                    3
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Right Column: 40% (Video Showcase Container) */}
            <Box sx={{ width: { xs: '100%', lg: '38%' }, flexShrink: 0 }}>
              <Box
                component={motion.div}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                sx={{
                  position: { xs: 'relative', lg: 'sticky' },
                  top: { xs: 'auto', lg: '120px' },
                  width: '100%',
                  height: '650px',
                  backgroundColor: '#ffffff',
                  borderRadius: '24px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.06)',
                  overflow: 'hidden',
                  zIndex: 5,
                  mb: { xs: 4, lg: 0 },
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  border: '1px solid #E5E7EB'
                }}
              >
                {/* Loop-friendly video playing inline */}
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 'inherit'
                  }}
                >
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
                        mb: 4,
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
                        mb: 1.5,
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
                        lineHeight: 1.6,
                        fontSize: '0.95rem'
                      }}
                    >
                      See how our Captains deliver trusted services right at your doorstep.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Redesigned Category Search & Selection Section */}
      <Container maxWidth="md" sx={{ mt: 10 }}>
        <Typography variant="h4" fontWeight={700} align="center" sx={{ mb: 1.5, fontFamily: 'Outfit, sans-serif' }}>
          Select a Service Category
        </Typography>
        <Typography variant="body1" align="center" sx={{ color: '#6B7280', mb: 5 }}>
          Search for standard service providers in your neighborhood.
        </Typography>

        {/* Central Search Widget */}
        <Paper
          elevation={0}
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
            <Grid item xs={6} sm={4} md={2} key={cat.id} sx={{ textAlign: 'center' }}>
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

      {/* Safety & Assurance Section */}
      <Container maxWidth="lg" sx={{ mt: 10, pt: 8, borderTop: '1px solid #E5E7EB', pb: 10 }}>
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
          <Grid item xs={12} sm={4}>
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

          <Grid item xs={12} sm={4}>
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

          <Grid item xs={12} sm={4}>
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
