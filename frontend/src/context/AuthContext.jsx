import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

const mapSupabaseUser = (sbUser) => {
  if (!sbUser) return null;
  const meta = sbUser.user_metadata || {};
  return {
    id: sbUser.id,
    email: sbUser.email || '',
    full_name: meta.full_name || meta.name || sbUser.email?.split('@')[0] || 'User',
    phone: meta.phone || null,
    role: meta.role || 'customer',
    is_email_verified: Boolean(sbUser.email_confirmed_at),
    profile: null,
    created_at: sbUser.created_at,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session and listen for auth state transitions via Supabase
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        if (!isSupabaseConfigured()) {
          console.warn('[UNNATI Auth] Supabase is not configured. Real auth requires frontend/.env.local.');
          if (isMounted) setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[UNNATI Auth] Error retrieving session:', error.message);
        }

        if (isMounted) {
          if (data?.session?.user) {
            setSession(data.session);
            setUser(mapSupabaseUser(data.session.user));
            if (data.session.access_token) {
              localStorage.setItem('access_token', data.session.access_token);
            }
          } else {
            setSession(null);
            setUser(null);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('[UNNATI Auth] Unexpected error initializing session:', err);
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth state updates (sign in, sign out, token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(mapSupabaseUser(currentSession.user));
          if (currentSession.access_token) {
            localStorage.setItem('access_token', currentSession.access_token);
          }
        } else {
          setSession(null);
          setUser(null);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
        }
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Real Supabase Email/Password Login
  const login = async (email, password) => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        const errorMsg = 'Authentication service is not configured. Please set Supabase credentials in frontend/.env.local.';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        let userMessage = error.message;
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          userMessage = 'Incorrect email or password. Please try again.';
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          userMessage = 'Please confirm your email address before logging in.';
        }
        toast.error(userMessage);
        throw new Error(userMessage);
      }

      const appUser = mapSupabaseUser(data.user);
      setUser(appUser);
      setSession(data.session);
      if (data.session?.access_token) {
        localStorage.setItem('access_token', data.session.access_token);
      }
      toast.success(`Welcome back, ${appUser.full_name}!`);
      return appUser;
    } finally {
      setLoading(false);
    }
  };

  // Real Supabase Email/Password Registration
  const register = async (fullName, email, phone, password, role) => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        const errorMsg = 'Authentication service is not configured. Please set Supabase credentials in frontend/.env.local.';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone ? phone.trim() : '',
            role: role || 'customer',
          },
        },
      });

      if (error) {
        let userMessage = error.message;
        if (error.message.toLowerCase().includes('user already registered')) {
          userMessage = 'An account with this email already exists. Please sign in instead.';
        }
        toast.error(userMessage);
        throw new Error(userMessage);
      }

      const appUser = mapSupabaseUser(data.user);
      if (data.session) {
        setUser(appUser);
        setSession(data.session);
        if (data.session.access_token) {
          localStorage.setItem('access_token', data.session.access_token);
        }
        toast.success('Account created successfully!');
      } else {
        toast.success('Registration successful! Please check your email for confirmation instructions.');
      }
      return appUser;
    } finally {
      setLoading(false);
    }
  };

  // Google Login (Real OAuth only if configured, otherwise rejects fake mock)
  const googleLogin = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        toast.error('Supabase is not configured.');
        return;
      }
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        toast.error(error.message);
        throw error;
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  // Reset Password for Email
  const resetPassword = async (email) => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        toast.error('Supabase is not configured.');
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/forgot-password?mode=update`,
      });
      if (error) {
        toast.error(error.message);
        throw error;
      }
      toast.success('Password reset instructions sent to your email.');
    } finally {
      setLoading(false);
    }
  };

  // Update Password (when logged in or arrived via reset link)
  const updatePassword = async (newPassword) => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        toast.error('Supabase is not configured.');
        return;
      }
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        toast.error(error.message);
        throw error;
      }
      toast.success('Password updated successfully!');
    } finally {
      setLoading(false);
    }
  };

  // Update Profile State (retains Supabase identity)
  const updateProfileState = (updatedUserAndProfile) => {
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ...updatedUserAndProfile?.user,
        profile: updatedUserAndProfile?.profile ?? prev.profile,
      };
    });
  };

  // Real Supabase Logout
  const logout = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('[UNNATI Auth] Logout error:', err);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
      setSession(null);
      setLoading(false);
      toast.success('Logged out successfully');
    }
  };

  const value = {
    user,
    session,
    isAuthenticated: Boolean(user),
    loading,
    login,
    register,
    googleLogin,
    resetPassword,
    updatePassword,
    logout,
    updateProfileState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
