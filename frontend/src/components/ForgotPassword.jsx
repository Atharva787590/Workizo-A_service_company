import React, { useState } from 'react';
import { useNavigate, Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  TextField, Button, Box, Link, CircularProgress, Typography
} from '@mui/material';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { tokens } from '../design/tokens';
import { AuthPageShell } from './dashboard';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isUpdateMode = searchParams.get('mode') === 'update';
  const { resetPassword, updatePassword, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const newPassword = watch('newPassword');

  const onSendResetEmail = async (data) => {
    setSubmitting(true);
    try {
      await resetPassword(data.email);
      setSentSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const onUpdatePassword = async (data) => {
    setSubmitting(true);
    try {
      await updatePassword(data.newPassword);
      toast.success('Your password has been reset. Please sign in with your new password.');
      navigate('/customer/login');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const loading = submitting || authLoading;

  if (isUpdateMode) {
    return (
      <AuthPageShell
        title="Set New Password"
        subtitle="Please enter your new UNNATI account password"
      >
        <Box component="form" onSubmit={handleSubmit(onUpdatePassword)} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            type="password"
            id="newPassword"
            label="New Password"
            autoFocus
            {...register('newPassword', {
              required: 'New password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
            error={!!errors.newPassword}
            helperText={errors.newPassword?.message}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            type="password"
            id="confirmPassword"
            label="Confirm New Password"
            {...register('confirmPassword', {
              required: 'Please confirm your new password',
              validate: (value) => value === newPassword || 'Passwords do not match',
            })}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              py: 1.2,
              mt: 2,
              mb: 2,
              bgcolor: tokens.colors.primary,
              color: '#ffffff',
              borderRadius: `${tokens.borderRadiusSm}px`,
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': { bgcolor: '#23232F' },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
          </Button>

          <Box display="flex" justifyContent="center">
            <Link component={RouterLink} to="/customer/login" color="primary" fontWeight={600}>
              Back to Sign In
            </Link>
          </Box>
        </Box>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      title="Reset Password"
      subtitle="Enter your verified email address and we'll send you a recovery link"
    >
      {sentSuccess ? (
        <Box sx={{ mt: 2, width: '100%', textAlign: 'center' }}>
          <Typography variant="body1" sx={{ mb: 3, color: '#374151' }}>
            A secure recovery link has been dispatched to your email. Please check your inbox and follow the instructions to set a new password.
          </Typography>
          <Button
            component={RouterLink}
            to="/customer/login"
            fullWidth
            variant="outlined"
            sx={{
              py: 1.2,
              borderRadius: `${tokens.borderRadiusSm}px`,
              textTransform: 'none',
              fontWeight: 700,
            }}
          >
            Back to Sign In
          </Button>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleSubmit(onSendResetEmail)} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            autoComplete="email"
            autoFocus
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            error={!!errors.email}
            helperText={errors.email?.message}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{
              py: 1.2,
              mt: 2,
              mb: 2,
              bgcolor: tokens.colors.primary,
              color: '#ffffff',
              borderRadius: `${tokens.borderRadiusSm}px`,
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': { bgcolor: '#23232F' },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
          </Button>

          <Box display="flex" justifyContent="center">
            <Link component={RouterLink} to="/customer/login" color="primary" fontWeight={600}>
              Back to Sign In
            </Link>
          </Box>
        </Box>
      )}
    </AuthPageShell>
  );
};

export default ForgotPassword;
