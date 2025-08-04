'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Paper,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Phone, Sms } from '@mui/icons-material';
import { createClient } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  const validatePhone = () => {
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    setError('');
    return true;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone()) return;
    
    setLoading(true);
    setError('');

    try {
      console.log('Sending OTP to phone:', phone);
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
      });
      
      if (error) {
        console.error('Supabase OTP error:', error);
        throw error;
      }
      
      console.log('OTP sent successfully');
      setOtpSent(true);
      setStep('otp');
      toast.success('OTP sent to your phone');
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      let errorMsg = err.message || 'Failed to send OTP';
      
      if (errorMsg.includes('rate')) {
        errorMsg = 'Too many requests. Please try again later.';
      } else if (errorMsg.includes('phone')) {
        errorMsg = 'Invalid phone number format. Please use 10 digits without country code.';
      }
      
      setError(errorMsg);
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      console.log('Verifying OTP for phone:', phone);
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: otp,
        type: 'sms'
      });
      
      if (error) {
        console.error('OTP verification error:', error);
        throw error;
      }
      
      if (!data.user) {
        throw new Error('No user data received');
      }
      
      console.log('OTP verification successful');
      
      // Check if user profile exists and is a seller
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw new Error('User profile not found');
      }
      
      // Only allow sellers, wholesalers, and manufacturers
      if (!['seller', 'wholesaler', 'manufacturer'].includes(profile.role)) {
        throw new Error('Access denied. This console is only for sellers, wholesalers, and manufacturers.');
      }
      
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      let errorMsg = err.message || 'Failed to verify OTP';
      
      if (errorMsg.includes('expired')) {
        errorMsg = 'OTP has expired. Please request a new code.';
      } else if (errorMsg.includes('invalid')) {
        errorMsg = 'Invalid OTP. Please check and try again.';
      }
      
      setError(errorMsg);
      toast.error('OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
      });
      
      if (error) throw error;
      
      toast.success('New OTP sent to your phone');
    } catch (err: any) {
      setError('Failed to resend OTP. Please try again.');
      toast.error('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp('');
    setError('');
    setOtpSent(false);
  };

  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper
        elevation={8}
        sx={{
          width: '100%',
          p: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)'
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom color="primary" fontWeight="bold">
            DukaaOn
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Seller Console
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {step === 'phone' ? 'Enter your phone number to continue' : `Enter OTP sent to ${phone}`}
          </Typography>
        </Box>

        {step === 'phone' ? (
          <form onSubmit={handleSendOTP}>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 10) {
                    setPhone(value);
                  }
                }}
                required
                variant="outlined"
                placeholder="9876543210"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
                helperText="Enter 10-digit phone number without country code"
              />
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || phone.length !== 10}
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 600
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Send OTP'
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="text"
                onClick={handleBackToPhone}
                sx={{ mb: 2, textTransform: 'none' }}
              >
                ← Change Phone Number
              </Button>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Enter OTP"
                type="text"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 6) {
                    setOtp(value);
                  }
                }}
                required
                variant="outlined"
                placeholder="123456"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Sms color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
                helperText="Enter the 6-digit OTP sent to your phone"
              />
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || otp.length < 6}
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 600,
                mb: 2
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Verify OTP'
              )}
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              onClick={handleResendOTP}
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem'
              }}
            >
              Resend OTP
            </Button>
          </form>
        )}

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Only for sellers, wholesalers, and manufacturers
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Need help? Contact support
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}