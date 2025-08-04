'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Grid,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material'
import {
  ArrowBack,
  Notifications,
  DarkMode,
  Language,
  Security,
  Save,
  Refresh
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase'

interface UserSettings {
  notifications_enabled: boolean
  order_updates_enabled: boolean
  promotions_enabled: boolean
  dark_mode: boolean
  language: string
  email_notifications: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings>({
    notifications_enabled: true,
    order_updates_enabled: true,
    promotions_enabled: false,
    dark_mode: false,
    language: 'en',
    email_notifications: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const supabase = createClient()

  const fetchSettings = async () => {
    try {
      setLoading(true)
      
      // Check if user_settings table exists and fetch settings
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (error) {
        // If table doesn't exist, try to create it
        if (error.code === '42P01') {
          console.log('user_settings table does not exist, creating default settings...')
          // Use default settings for now
          setSettings({
            notifications_enabled: true,
            order_updates_enabled: true,
            promotions_enabled: false,
            dark_mode: false,
            language: 'en',
            email_notifications: true
          })
          setError('Settings table not found. Using default settings. Please contact administrator to set up the database.')
          return
        }
        
        if (error.code !== 'PGRST116') {
          console.error('Error fetching settings:', error)
          setError('Failed to load settings')
          return
        }
      }

      if (data) {
        setSettings({
          notifications_enabled: data.notifications_enabled ?? true,
          order_updates_enabled: data.order_updates_enabled ?? true,
          promotions_enabled: data.promotions_enabled ?? false,
          dark_mode: data.dark_mode ?? false,
          language: data.language ?? 'en',
          email_notifications: data.email_notifications ?? true
        })
      }
    } catch (error) {
      console.error('Error in fetchSettings:', error)
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id)

      if (error) {
        // If table doesn't exist, show helpful error
        if (error.code === '42P01') {
          setError('Settings table not found. Please contact administrator to set up the database. Your preferences have been saved locally for this session.')
          return
        }
        
        console.error('Error saving settings:', error)
        setError('Failed to save settings')
        return
      }

      setSuccess('Settings saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error in saveSettings:', error)
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchSettings()
    }
  }, [user?.id])

  // Function to create user_settings table if it doesn't exist
  const createUserSettingsTable = async () => {
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.user_settings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            notifications_enabled BOOLEAN DEFAULT TRUE,
            order_updates_enabled BOOLEAN DEFAULT TRUE,
            promotions_enabled BOOLEAN DEFAULT FALSE,
            dark_mode BOOLEAN DEFAULT FALSE,
            language VARCHAR(10) DEFAULT 'en',
            email_notifications BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          CREATE UNIQUE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
          
          ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY IF NOT EXISTS "Users can view their own settings" ON public.user_settings
            FOR SELECT USING (auth.uid() = user_id);
          
          CREATE POLICY IF NOT EXISTS "Users can insert their own settings" ON public.user_settings
            FOR INSERT WITH CHECK (auth.uid() = user_id);
          
          CREATE POLICY IF NOT EXISTS "Users can update their own settings" ON public.user_settings
            FOR UPDATE USING (auth.uid() = user_id);
        `
      });
      
      if (error) {
        console.error('Error creating table:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error creating table:', err);
      return false;
    }
  };

  const handleSettingChange = (key: keyof UserSettings, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading settings...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4">
            Settings
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={saving ? <Refresh className="animate-spin" /> : <Save />}
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Notifications Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Notifications color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Notifications
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications_enabled}
                    onChange={(e) => handleSettingChange('notifications_enabled', e.target.checked)}
                  />
                }
                label="Enable Notifications"
                sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', ml: 0 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.order_updates_enabled}
                    onChange={(e) => handleSettingChange('order_updates_enabled', e.target.checked)}
                    disabled={!settings.notifications_enabled}
                  />
                }
                label="Order Updates"
                sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', ml: 0 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.promotions_enabled}
                    onChange={(e) => handleSettingChange('promotions_enabled', e.target.checked)}
                    disabled={!settings.notifications_enabled}
                  />
                }
                label="Promotional Notifications"
                sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', ml: 0 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.email_notifications}
                    onChange={(e) => handleSettingChange('email_notifications', e.target.checked)}
                  />
                }
                label="Email Notifications"
                sx={{ display: 'flex', justifyContent: 'space-between', ml: 0 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Appearance Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DarkMode color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Appearance
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.dark_mode}
                    onChange={(e) => handleSettingChange('dark_mode', e.target.checked)}
                  />
                }
                label="Dark Mode"
                sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', ml: 0 }}
              />
              
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={settings.language}
                  label="Language"
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                  startAdornment={<Language sx={{ mr: 1, color: 'text.secondary' }} />}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="hi">हिंदी (Hindi)</MenuItem>
                  <MenuItem value="ml">മലയാളം (Malayalam)</MenuItem>
                  <MenuItem value="ta">தமிழ் (Tamil)</MenuItem>
                  <MenuItem value="te">తెలుగు (Telugu)</MenuItem>
                  <MenuItem value="kn">ಕನ್ನಡ (Kannada)</MenuItem>
                  <MenuItem value="mr">मराठी (Marathi)</MenuItem>
                  <MenuItem value="bn">বাংলা (Bengali)</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        {/* Account Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Security color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Account Information
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    User ID
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {user?.id || 'Not available'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {user?.email || 'Not available'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Account Status
                  </Typography>
                  <Chip
                    label="Active"
                    color="success"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}