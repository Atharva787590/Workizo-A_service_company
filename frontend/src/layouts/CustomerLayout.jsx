import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  AppBar, Toolbar, Typography, Button, Container, Box,
  Avatar, Menu, MenuItem, IconButton, Tooltip, Grid, Divider, Link,
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Badge,
  useTheme, useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import HandymanIcon from '@mui/icons-material/Handyman';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PolicyIcon from '@mui/icons-material/Policy';
import CategoryIcon from '@mui/icons-material/Category';
import AddTaskIcon from '@mui/icons-material/AddTask';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { gsap } from 'gsap';
import { buildMediaUrl } from '../services/api';
import { NotificationCenterModal } from '../components/notification';

const CustomerLayout = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  React.useEffect(() => {
    // Set initial hidden states safely
    if (document.querySelector('.nav-logo-reveal')) gsap.set('.nav-logo-reveal', { opacity: 0, x: -20 });
    if (document.querySelector('.nav-link-reveal')) gsap.set('.nav-link-reveal', { opacity: 0, y: -10 });
    if (document.querySelector('.nav-action-reveal')) gsap.set('.nav-action-reveal', { opacity: 0, scale: 0.9 });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.8 } });
    if (document.querySelector('.nav-logo-reveal')) {
      tl.to('.nav-logo-reveal', { opacity: 1, x: 0 });
    }
    if (document.querySelector('.nav-link-reveal')) {
      tl.to('.nav-link-reveal', { opacity: 1, y: 0, stagger: 0.1 }, '-=0.5');
    }
    if (document.querySelector('.nav-action-reveal')) {
      tl.to('.nav-action-reveal', { opacity: 1, scale: 1, stagger: 0.1 }, '-=0.4');
    }
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    setMobileDrawerOpen(false);
    await logout();
    navigate('/home');
  };

  const getDashboardRoute = () => {
    if (!user) return '/home';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'worker') return '/captain/dashboard';
    return '/customer/dashboard';
  };

  const getProfileRoute = () => {
    if (!user) return '/home';
    if (user.role === 'worker') return '/captain/profile';
    return '/customer/profile';
  };

  const navLinks = [
    { label: 'Home', path: '/home' },
    { label: 'Services', path: '/services' },
    { label: 'Transparency Hub', path: '/transparency' },
    { label: 'Governance', path: '/governance' },
    ...((!isAuthenticated || user?.role === 'customer') ? [{ label: 'Book Service', path: '/customer/book', requiresAuth: true }] : []),
    ...((!isAuthenticated || user?.role === 'admin') ? [{ label: 'Admin', path: user?.role === 'admin' ? '/admin/dashboard' : '/admin/login' }] : []),
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      {/* UNNATI Top Navigation Bar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #E2E8F0',
          zIndex: (t) => t.zIndex.drawer + 1
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', minHeight: '68px' }}>
            {/* Branding Logo */}
            <Box
              onClick={() => navigate('/home')}
              className="nav-logo-reveal"
              sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 1.5 }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: '#0F172A',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.15)',
                  overflow: 'hidden',
                  p: 0.5
                }}
              >
                <Box component="img" src="/logo.png" sx={{ width: 32, height: 32, objectFit: 'contain' }} />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography
                    variant="h6"
                    noWrap
                    sx={{
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 900,
                      letterSpacing: '.04rem',
                      color: '#0F172A',
                      fontSize: '1.25rem',
                      lineHeight: 1.1
                    }}
                  >
                    UNNATI
                  </Typography>
                  <Box sx={{
                    px: 1,
                    py: 0.15,
                    bgcolor: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: '9999px',
                    color: '#B45309',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.02em'
                  }}>
                    उन्नति
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.7rem' }}>
                  Worker Cooperative Platform
                </Typography>
              </Box>
            </Box>

            {/* Desktop Navigation Links */}
            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {navLinks.map((link) => (
                  <Button
                    key={link.path}
                    variant="text"
                    className="nav-link-reveal"
                    onClick={() => {
                      if (link.requiresAuth && !isAuthenticated) {
                        toast.error('Please log in first to book a service');
                        localStorage.setItem('redirect_after_login', link.path);
                        navigate('/customer/login');
                      } else {
                        navigate(link.path);
                      }
                    }}
                    sx={{
                      color: location.pathname === link.path ? '#0F172A' : '#64748B',
                      fontWeight: location.pathname === link.path ? 700 : 600,
                      borderRadius: '8px',
                      px: 1.75,
                      py: 0.8,
                      minHeight: 44,
                      textTransform: 'none',
                      '&:hover': { color: '#0F172A', bgcolor: '#F1F5F9' }
                    }}
                  >
                    {link.label}
                  </Button>
                ))}

                {/* Worker Guild Link */}
                {!isAuthenticated && (
                  <Button
                    variant="outlined"
                    className="nav-link-reveal"
                    onClick={() => navigate('/captain/login')}
                    sx={{
                      borderColor: '#D97706',
                      color: '#B45309',
                      bgcolor: '#FFFBEB',
                      borderRadius: '8px',
                      fontWeight: 700,
                      px: 2.25,
                      py: 0.75,
                      minHeight: 44,
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#B45309',
                        bgcolor: '#FEF3C7'
                      }
                    }}
                  >
                    Join as Worker
                  </Button>
                )}

                {/* Notifications Trigger */}
                {isAuthenticated && (
                  <Tooltip title="UNNATI Notifications & Updates">
                    <IconButton
                      onClick={() => setIsNotificationOpen(true)}
                      aria-label="Open notifications center"
                      sx={{
                        p: 1,
                        bgcolor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        minWidth: 44,
                        minHeight: 44,
                        '&:hover': { bgcolor: '#F1F5F9' }
                      }}
                    >
                      <Badge color="error" variant="dot">
                        <NotificationsIcon sx={{ fontSize: 20, color: '#0F172A' }} />
                      </Badge>
                    </IconButton>
                  </Tooltip>
                )}

                {isAuthenticated ? (
                  <>
                    <Button
                      variant="contained"
                      onClick={() => navigate(getDashboardRoute())}
                      sx={{
                        bgcolor: '#0F172A',
                        color: '#ffffff',
                        fontWeight: 700,
                        borderRadius: '8px',
                        px: 2.25,
                        py: 0.8,
                        minHeight: 44,
                        textTransform: 'none',
                        boxShadow: 'none',
                        '&:hover': { bgcolor: '#1E293B', boxShadow: 'none' }
                      }}
                    >
                      Dashboard
                    </Button>

                    <Tooltip title="Account Settings">
                      <IconButton
                        onClick={handleMenuOpen}
                        aria-label="User account menu"
                        sx={{ p: 0.5, minWidth: 44, minHeight: 44 }}
                      >
                        <Avatar
                          src={buildMediaUrl(user.profile_photo)}
                          sx={{ bgcolor: '#0F172A', width: 38, height: 38, fontWeight: 700, fontSize: '0.95rem' }}
                        >
                          {user.full_name?.charAt(0).toUpperCase()}
                        </Avatar>
                      </IconButton>
                    </Tooltip>

                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={handleMenuClose}
                      PaperProps={{
                        sx: {
                          mt: 1.5,
                          minWidth: 200,
                          borderRadius: '12px',
                          border: '1px solid #E2E8F0',
                          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08)',
                        }
                      }}
                      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #E2E8F0' }}>
                        <Typography variant="subtitle2" noWrap fontWeight={700}>
                          {user.full_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block">
                          {user.email}
                        </Typography>
                      </Box>
                      <MenuItem onClick={() => { handleMenuClose(); navigate(getDashboardRoute()); }} sx={{ py: 1 }}>
                        <DashboardIcon fontSize="small" sx={{ mr: 1.5, color: '#64748B' }} />
                        Dashboard
                      </MenuItem>
                      {user.role !== 'admin' && (
                        <MenuItem onClick={() => { handleMenuClose(); navigate(getProfileRoute()); }} sx={{ py: 1 }}>
                          <PersonIcon fontSize="small" sx={{ mr: 1.5, color: '#64748B' }} />
                          Profile Settings
                        </MenuItem>
                      )}
                      <MenuItem onClick={handleLogout} sx={{ color: '#DC2626', py: 1 }}>
                        <LogoutIcon fontSize="small" sx={{ mr: 1.5, color: '#DC2626' }} />
                        Logout
                      </MenuItem>
                    </Menu>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    onClick={() => navigate('/customer/login')}
                    sx={{
                      bgcolor: '#0F172A',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontWeight: 700,
                      px: 3,
                      py: 0.8,
                      minHeight: 44,
                      textTransform: 'none',
                      boxShadow: 'none',
                      '&:hover': { bgcolor: '#1E293B', boxShadow: 'none' }
                    }}
                  >
                    Login / Sign Up
                  </Button>
                )}
              </Box>
            )}

            {/* Mobile Actions & Hamburger Toggle */}
            {isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isAuthenticated && (
                  <IconButton
                    onClick={() => setIsNotificationOpen(true)}
                    aria-label="Open notifications"
                    sx={{ minWidth: 48, minHeight: 48 }}
                  >
                    <Badge color="error" variant="dot">
                      <NotificationsIcon sx={{ fontSize: 22, color: '#0F172A' }} />
                    </Badge>
                  </IconButton>
                )}
                <IconButton
                  onClick={() => setMobileDrawerOpen(true)}
                  aria-label="Open mobile navigation menu"
                  sx={{
                    minWidth: 48,
                    minHeight: 48,
                    p: 1.25,
                    color: '#0F172A',
                    bgcolor: '#F1F5F9',
                    borderRadius: '8px'
                  }}
                >
                  <MenuIcon />
                </IconButton>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Responsive Navigation Drawer */}
      <Drawer
        anchor="right"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            p: 2.5,
            bgcolor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={800} color="#0F172A">
              Menu
            </Typography>
            <IconButton
              onClick={() => setMobileDrawerOpen(false)}
              aria-label="Close menu"
              sx={{ minWidth: 44, minHeight: 44 }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />

          <List sx={{ p: 0 }}>
            {navLinks.map((link) => (
              <ListItem key={link.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    if (link.requiresAuth && !isAuthenticated) {
                      toast.error('Please log in first to book a service');
                      navigate('/customer/login');
                    } else {
                      navigate(link.path);
                    }
                  }}
                  sx={{
                    borderRadius: '8px',
                    minHeight: 48,
                    bgcolor: location.pathname === link.path ? '#F1F5F9' : 'transparent'
                  }}
                >
                  <ListItemText
                    primary={link.label}
                    primaryTypographyProps={{
                      fontWeight: location.pathname === link.path ? 700 : 600,
                      color: location.pathname === link.path ? '#0F172A' : '#475569'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}

            {isAuthenticated ? (
              <>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      navigate(getDashboardRoute());
                    }}
                    sx={{ borderRadius: '8px', minHeight: 48 }}
                  >
                    <ListItemText primary="Dashboard" primaryTypographyProps={{ fontWeight: 600 }} />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      navigate(getProfileRoute());
                    }}
                    sx={{ borderRadius: '8px', minHeight: 48 }}
                  >
                    <ListItemText primary="Profile Settings" primaryTypographyProps={{ fontWeight: 600 }} />
                  </ListItemButton>
                </ListItem>
              </>
            ) : (
              <ListItem disablePadding sx={{ mt: 1 }}>
                <ListItemButton
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    navigate('/captain/login');
                  }}
                  sx={{
                    borderRadius: '8px',
                    minHeight: 48,
                    bgcolor: '#FFFBEB',
                    border: '1px solid #FDE68A'
                  }}
                >
                  <ListItemText
                    primary="Join as Worker Guild"
                    primaryTypographyProps={{ fontWeight: 700, color: '#B45309' }}
                  />
                </ListItemButton>
              </ListItem>
            )}
          </List>
        </Box>

        <Box sx={{ pt: 2, borderTop: '1px solid #E2E8F0' }}>
          {isAuthenticated ? (
            <Button
              fullWidth
              variant="outlined"
              color="error"
              onClick={handleLogout}
              sx={{ minHeight: 48, borderRadius: '8px', fontWeight: 700, textTransform: 'none' }}
            >
              Logout
            </Button>
          ) : (
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                setMobileDrawerOpen(false);
                navigate('/customer/login');
              }}
              sx={{
                minHeight: 48,
                borderRadius: '8px',
                bgcolor: '#0F172A',
                fontWeight: 700,
                textTransform: 'none'
              }}
            >
              Login / Sign Up
            </Button>
          )}
        </Box>
      </Drawer>

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      {/* Main Page Content */}
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: '#F4F6F9' }}>
        <Outlet />
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 8,
          px: 2,
          mt: 'auto',
          backgroundColor: '#111111',
          color: '#FFFFFF',
          borderTop: '1px solid #222222'
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: { xs: 4, sm: 3, md: 4 },
              flexWrap: 'wrap'
            }}
          >
            {/* Column 1: Brand Info & Socials */}
            <Box sx={{ flex: '1 1 250px', minWidth: '220px', maxWidth: '300px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    bgcolor: '#ffffff',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(255, 255, 255, 0.15)',
                    overflow: 'hidden'
                  }}
                >
                  <Box component="img" src="/logo.png" sx={{ width: 34, height: 34, objectFit: 'contain' }} />
                </Box>
                <Typography
                  variant="h6"
                  noWrap
                  sx={{
                    fontFamily: 'Outfit',
                    fontWeight: 900,
                    letterSpacing: '.04rem',
                    color: '#ffffff',
                    fontSize: '1.3rem'
                  }}
                >
                  UNNATI • उन्नति
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#94A3B8', mb: 3, lineHeight: 1.6 }}>
                India&apos;s worker-owned digital cooperative platform for certified trade professionals and households. Direct customer-to-worker payments with 0% platform extraction.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                {[
                  { icon: <FacebookIcon sx={{ fontSize: 20 }} />, url: 'https://facebook.com' },
                  { icon: <TwitterIcon sx={{ fontSize: 20 }} />, url: 'https://twitter.com' },
                  { icon: <InstagramIcon sx={{ fontSize: 20 }} />, url: 'https://instagram.com' },
                  { icon: <LinkedInIcon sx={{ fontSize: 20 }} />, url: 'https://linkedin.com' }
                ].map((social, idx) => (
                  <IconButton
                    key={idx}
                    component="a"
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: '#9CA3AF',
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      '&:hover': {
                        color: '#ffffff',
                        bgcolor: 'rgba(255, 255, 255, 0.15)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.2s ease-in-out',
                      width: 36,
                      height: 36
                    }}
                  >
                    {social.icon}
                  </IconButton>
                ))}
              </Box>
            </Box>

            {/* Column 2: Quick Links */}
            <Box sx={{ flex: '1 1 150px', minWidth: '150px', maxWidth: '200px' }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#ffffff', mb: 2.5, fontFamily: 'Outfit' }}>
                Quick Links
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { text: 'Home', path: '/home' },
                  { text: 'Services Catalog', path: '/services' },
                  { text: 'Transparency Hub', path: '/transparency' },
                  { text: 'Democratic Governance', path: '/governance' },
                  {
                    text: 'Book Service', path: '/customer/book', action: () => {
                      if (isAuthenticated) {
                        navigate('/customer/book');
                      } else {
                        toast.error('Please log in first to book a service');
                        localStorage.setItem('redirect_after_login', '/customer/book');
                        navigate('/customer/login');
                      }
                    }
                  },
                  { text: 'Join as Worker', path: '/captain/login' },
                  { text: 'Admin Login', path: '/admin/login' }
                ].map((link, idx) => (
                  <Link
                    key={idx}
                    component="button"
                    onClick={() => {
                      if (link.action) {
                        link.action();
                      } else {
                        navigate(link.path);
                      }
                    }}
                    underline="none"
                    sx={{
                      color: '#9CA3AF',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      '&:hover': {
                        color: '#ffffff',
                      },
                      transition: 'color 0.2s ease-in-out',
                      cursor: 'pointer',
                      background: 'none',
                      border: 'none',
                      p: 0,
                      fontFamily: 'inherit'
                    }}
                  >
                    {link.text}
                  </Link>
                ))}
              </Box>
            </Box>

            {/* Column 3: Services */}
            <Box sx={{ flex: '1 1 150px', minWidth: '150px', maxWidth: '200px' }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#ffffff', mb: 2.5, fontFamily: 'Outfit' }}>
                Services
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  'Electrician',
                  'Plumber',
                  'Carpenter',
                  'AC Technician',
                  'Mechanic',
                  'Home Cleaning'
                ].map((service, idx) => (
                  <Link
                    key={idx}
                    component="button"
                    onClick={() => {
                      if (isAuthenticated) {
                        navigate('/customer/book');
                      } else {
                        toast.error('Please log in first to book a service');
                        localStorage.setItem('redirect_after_login', '/customer/book');
                        navigate('/customer/login');
                      }
                    }}
                    underline="none"
                    sx={{
                      color: '#9CA3AF',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      '&:hover': {
                        color: '#ffffff',
                      },
                      transition: 'color 0.2s ease-in-out',
                      cursor: 'pointer',
                      background: 'none',
                      border: 'none',
                      p: 0,
                      fontFamily: 'inherit'
                    }}
                  >
                    {service}
                  </Link>
                ))}
              </Box>
            </Box>

            {/* Column 4: Contact Us */}
            <Box sx={{ flex: '1 1 250px', minWidth: '220px', maxWidth: '300px' }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#ffffff', mb: 2.5, fontFamily: 'Outfit' }}>
                Contact Us
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <PhoneIcon sx={{ color: '#9CA3AF', fontSize: 20, mt: 0.2 }} />
                  <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                    +91 9876543210
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <EmailIcon sx={{ color: '#9CA3AF', fontSize: 20, mt: 0.2 }} />
                  <Typography variant="body2" sx={{ color: '#9CA3AF', wordBreak: 'break-all' }}>
                    support@unnati.coop
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <LocationOnIcon sx={{ color: '#9CA3AF', fontSize: 20, mt: 0.2 }} />
                  <Typography variant="body2" sx={{ color: '#9CA3AF', lineHeight: 1.5, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    SIGNATURE-2, C-909, Sarkhej - Sanand Rd,<br />
                    Makarba, Sarkhej-Okaf, Ahmedabad,<br />
                    Gujarat 382210
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 5, borderColor: '#222222' }} />

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
              © {new Date().getFullYear()} UNNATI (उन्नति) Worker Cooperative Platform. All rights reserved.
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B7280', textAlign: { xs: 'center', sm: 'right' } }}>
              Worker-Owned Digital Cooperative • 100% Direct Payments • SIH 2026
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default CustomerLayout;
