'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  TextField,
  Grid,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material'
import {
  ArrowBack,
  Edit,
  Save,
  Cancel,
  Business,
  Person,
  Email,
  Phone,
  LocationOn,
  Verified,
  Warning
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase'

interface Profile {
  id: string
  business_name: string
  owner_name: string
  email: string
  phone: string
  address: any
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, sellerDetails } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editForm, setEditForm] = useState({
    business_name: '',
    owner_name: '',
    email: '',
    phone: '',
    address: ''
  })

  const supabase = createClient()

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        setError('Failed to load profile')
        return
      }

      // Fetch seller details if user is a seller/wholesaler
      let sellerData = null
      if (profileData.role === 'seller' || profileData.role === 'wholesaler' || profileData.role === 'manufacturer') {
        const { data: sellerDetails, error: sellerError } = await supabase
          .from('seller_details')
          .select('*')
          .eq('user_id', user?.id)
          .single()
        
        if (!sellerError && sellerDetails) {
          sellerData = sellerDetails
        }
      }

      // Combine profile and seller data
      const combinedProfile = {
        ...profileData,
        // Use seller_details data if available, otherwise fall back to profile data
        business_name: sellerData?.business_name || profileData.business_details?.shopName || profileData.business_name || '',
        owner_name: sellerData?.owner_name || profileData.business_details?.ownerName || profileData.owner_name || '',
        email: profileData.email || '',
        phone: profileData.phone_number || '',
        address: sellerData?.location_address || profileData.business_details?.address || profileData.address || '',
        seller_details: sellerData
      }

      setProfile(combinedProfile)
      setEditForm({
        business_name: combinedProfile.business_name,
        owner_name: combinedProfile.owner_name,
        email: combinedProfile.email,
        phone: combinedProfile.phone,
        address: typeof combinedProfile.address === 'object' ? JSON.stringify(combinedProfile.address) : combinedProfile.address || ''
      })
    } catch (error) {
      console.error('Error in fetchProfile:', error)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [user?.id, supabase])

  useEffect(() => {
    if (user?.id) {
      fetchProfile()
    }
  }, [user?.id, fetchProfile])

  const handleEdit = () => {
    setEditing(true)
    setError('')
  }

  const handleCancel = () => {
    setEditing(false)
    if (profile) {
      setEditForm({
        business_name: profile.business_name || '',
        owner_name: profile.owner_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: typeof profile.address === 'object' ? JSON.stringify(profile.address) : profile.address || ''
      })
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')

      let addressData = editForm.address
      try {
        addressData = JSON.parse(editForm.address)
      } catch {
        // If not valid JSON, keep as string
      }

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          business_name: editForm.business_name,
          owner_name: editForm.owner_name,
          email: editForm.email,
          phone_number: editForm.phone,
          address: addressData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
        setError('Failed to update profile')
        return
      }

      // Update seller_details table if user has seller details
      if ((profile as any).seller_details || profile?.role === 'seller' || profile?.role === 'wholesaler' || profile?.role === 'manufacturer') {
        const { error: sellerError } = await supabase
          .from('seller_details')
          .upsert({
            user_id: user?.id,
            business_name: editForm.business_name,
            owner_name: editForm.owner_name,
            location_address: typeof addressData === 'string' ? addressData : JSON.stringify(addressData),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user?.id)

        if (sellerError) {
          console.error('Error updating seller details:', sellerError)
          // Don't return here, as profile update was successful
        }
      }

      await fetchProfile()
      setEditing(false)
    } catch (error) {
      console.error('Error in handleSave:', error)
      setError('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const formatAddress = (address: any) => {
    if (!address) return 'No address provided'
    if (typeof address === 'string') return address
    if (typeof address === 'object') {
      const { street, city, state, pincode } = address
      return [street, city, state, pincode].filter(Boolean).join(', ')
    }
    return 'No address provided'
  }

  const getInitials = (name: string) => {
    if (!name) return 'UN'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!profile) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Profile not found</Alert>
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
            Profile
          </Typography>
        </Box>
        {!editing && (
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={handleEdit}
          >
            Edit Profile
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                src={sellerDetails?.profile_image_url || ''}
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '2rem'
                }}
              >
                {getInitials(profile.business_name || profile.owner_name)}
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {profile.business_name || 'Business Name'}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {profile.owner_name || 'Owner Name'}
              </Typography>
              <Chip
                label={profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1) || 'User'}
                color="primary"
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                {profile.is_active ? (
                  <>
                    <Verified color="success" />
                    <Typography variant="body2" color="success.main">
                      Active Account
                    </Typography>
                  </>
                ) : (
                  <>
                    <Warning color="warning" />
                    <Typography variant="body2" color="warning.main">
                      Inactive Account
                    </Typography>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Details Card */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Profile Details
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {editing ? (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Business Name"
                      value={editForm.business_name}
                      onChange={(e) => setEditForm({ ...editForm, business_name: e.target.value })}
                      InputProps={{
                        startAdornment: <Business sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Owner Name"
                      value={editForm.owner_name}
                      onChange={(e) => setEditForm({ ...editForm, owner_name: e.target.value })}
                      InputProps={{
                        startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      InputProps={{
                        startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      InputProps={{
                        startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      multiline
                      rows={3}
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      InputProps={{
                        startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary', alignSelf: 'flex-start', mt: 1 }} />
                      }}
                      helperText="You can enter a simple address or JSON format"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        startIcon={<Cancel />}
                        onClick={handleCancel}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Business color="primary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Business Name
                        </Typography>
                        <Typography variant="body1">
                          {profile.business_name || 'Not provided'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Person color="primary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Owner Name
                        </Typography>
                        <Typography variant="body1">
                          {profile.owner_name || 'Not provided'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Email color="primary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Email
                        </Typography>
                        <Typography variant="body1">
                          {profile.email || 'Not provided'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Phone color="primary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Phone
                        </Typography>
                        <Typography variant="body1">
                          {profile.phone || 'Not provided'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                      <LocationOn color="primary" sx={{ mt: 0.5 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Address
                        </Typography>
                        <Typography variant="body1">
                          {formatAddress(profile.address)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      Account created: {new Date(profile.created_at).toLocaleDateString()}
                    </Typography>
                    {profile.updated_at && (
                      <Typography variant="body2" color="text.secondary">
                        Last updated: {new Date(profile.updated_at).toLocaleDateString()}
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}