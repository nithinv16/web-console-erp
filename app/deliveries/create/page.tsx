'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Autocomplete,
  Tabs,
  Tab,
  InputAdornment,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  ArrowBack,
  Search,
  LocationOn,
  Business,
  Phone,
  Schedule,
  Notes,
  AttachMoney
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { createClient } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { MainLayout } from '../../../components/Layout';

interface Retailer {
  id: string;
  business_name: string;
  address: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
  distance: number | null;
}

interface DeliveryForm {
  retailerId: string;
  date: string;
  time: string;
  isNow: boolean;
  notes: string;
  amountToCollect: string;
  manualRetailer: {
    businessName: string;
    address: string;
    phone: string;
    email?: string;
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`delivery-tabpanel-${index}`}
      aria-labelledby={`delivery-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function CreateDelivery() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
  const [loading, setLoading] = useState(true);
  const [entryMode, setEntryMode] = useState(0); // 0 = select, 1 = manual
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [form, setForm] = useState<DeliveryForm>({
    retailerId: '',
    date: '',
    time: '',
    isNow: true,
    notes: '',
    amountToCollect: '',
    manualRetailer: {
      businessName: '',
      address: '',
      phone: '',
      email: ''
    }
  });

  useEffect(() => {
    fetchRetailers();
  }, []);

  const fetchRetailers = async () => {
    try {
      setLoading(true);
      
      // Fetch retailers from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('id, business_details, phone_number, latitude, longitude')
        .eq('role', 'retailer');

      if (error) throw error;
      
      if (data) {
        const formattedRetailers = data.map(profile => {
          const businessDetails = profile.business_details || {};
          
          return {
            id: profile.id,
            business_name: businessDetails.shopName || 'Unnamed Shop',
            address: businessDetails.address || 'No address provided',
            phone: profile.phone_number || '',
            latitude: profile.latitude || null,
            longitude: profile.longitude || null,
            distance: null // We'll skip distance calculation for web version
          };
        });
        
        setRetailers(formattedRetailers);
      }
    } catch (error) {
      console.error('Error fetching retailers:', error);
      toast.error('Failed to load retailers');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setEntryMode(newValue);
    // Clear selected retailer when switching to manual mode
    if (newValue === 1) {
      setSelectedRetailer(null);
      setForm(f => ({ ...f, retailerId: '' }));
    }
  };

  const toggleNow = () => {
    setForm(f => {
      if (!f.isNow) {
        return { ...f, isNow: true, date: '', time: '' };
      }
      return { ...f, isNow: false };
    });
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setErrorMessage(null);
      
      const now = new Date();
      // Add 2 hours to current time for estimated delivery
      const estimatedDeliveryTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
      
      let deliveryDateTime;
      if (form.isNow) {
        deliveryDateTime = estimatedDeliveryTime.toISOString();
      } else {
        // Use the selected date and time
        const selectedDateTime = new Date(`${form.date}T${form.time}:00`);
        deliveryDateTime = selectedDateTime.toISOString();
      }
      
      // Base delivery data
      const deliveryData: any = {
        seller_id: user?.id,
        estimated_delivery_time: deliveryDateTime,
        delivery_status: 'pending',
        amount_to_collect: form.amountToCollect ? parseFloat(form.amountToCollect) : null,
        created_at: now.toISOString()
      };
      
      // Add retailer info based on entry mode
      if (entryMode === 0 && selectedRetailer) {
        deliveryData.retailer_id = selectedRetailer.id;
        deliveryData.manual_retailer = null;
      } else if (entryMode === 1) {
        deliveryData.retailer_id = null;
        deliveryData.manual_retailer = {
          business_name: form.manualRetailer.businessName,
          address: form.manualRetailer.address,
          phone: form.manualRetailer.phone,
          email: form.manualRetailer.email || null
        };
      }

      console.log('Submitting delivery data:', deliveryData);

      const { data, error: insertError } = await supabase
        .from('delivery_orders')
        .insert([deliveryData])
        .select();

      if (insertError) {
        console.error('Insert error details:', insertError);
        throw insertError;
      }

      console.log('Delivery created successfully:', data);
      toast.success('Delivery booked successfully!');
      router.push('/deliveries');
    } catch (error: any) {
      console.error('Full error object:', error);
      const errorMsg = error.message || 'Failed to book delivery. Please try again.';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRetailers = retailers.filter(r => 
    r.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isFormValid = () => {
    if (entryMode === 0 && !selectedRetailer) return false;
    if (entryMode === 1 && !form.manualRetailer.businessName) return false;
    if (!form.isNow && (!form.date || !form.time)) return false;
    return true;
  };

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.back()}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4">
            Create Delivery
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                {/* Entry Mode Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                  <Tabs value={entryMode} onChange={handleTabChange}>
                    <Tab label="Select Retailer" icon={<Search />} iconPosition="start" />
                    <Tab label="Manual Entry" icon={<Business />} iconPosition="start" />
                  </Tabs>
                </Box>

                {/* Select Retailer Tab */}
                <TabPanel value={entryMode} index={0}>
                  <TextField
                    fullWidth
                    placeholder="Search retailers by name or address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      )
                    }}
                    sx={{ mb: 3 }}
                  />

                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : filteredRetailers.length === 0 ? (
                    <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      No retailers found
                    </Typography>
                  ) : (
                    <Grid container spacing={2}>
                      {filteredRetailers.map((retailer) => (
                        <Grid item xs={12} key={retailer.id}>
                          <Card
                            sx={{
                              cursor: 'pointer',
                              border: selectedRetailer?.id === retailer.id ? 2 : 1,
                              borderColor: selectedRetailer?.id === retailer.id ? 'primary.main' : 'divider',
                              '&:hover': {
                                boxShadow: 2
                              }
                            }}
                            onClick={() => {
                              setSelectedRetailer(retailer);
                              setForm(f => ({ ...f, retailerId: retailer.id }));
                            }}
                          >
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="h6" gutterBottom>
                                    {retailer.business_name}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                    <Typography variant="body2" color="text.secondary">
                                      {retailer.address}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                    <Typography variant="body2" color="text.secondary">
                                      {retailer.phone}
                                    </Typography>
                                  </Box>
                                </Box>
                                {selectedRetailer?.id === retailer.id && (
                                  <Chip label="Selected" color="primary" size="small" />
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </TabPanel>

                {/* Manual Entry Tab */}
                <TabPanel value={entryMode} index={1}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Business Name"
                        value={form.manualRetailer.businessName}
                        onChange={(e) => setForm(f => ({
                          ...f,
                          manualRetailer: { ...f.manualRetailer, businessName: e.target.value }
                        }))}
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Business />
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Address"
                        value={form.manualRetailer.address}
                        onChange={(e) => setForm(f => ({
                          ...f,
                          manualRetailer: { ...f.manualRetailer, address: e.target.value }
                        }))}
                        multiline
                        rows={2}
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationOn />
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={form.manualRetailer.phone}
                        onChange={(e) => setForm(f => ({
                          ...f,
                          manualRetailer: { ...f.manualRetailer, phone: e.target.value }
                        }))}
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Phone />
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email (Optional)"
                        type="email"
                        value={form.manualRetailer.email}
                        onChange={(e) => setForm(f => ({
                          ...f,
                          manualRetailer: { ...f.manualRetailer, email: e.target.value }
                        }))}
                      />
                    </Grid>
                  </Grid>
                </TabPanel>
              </CardContent>
            </Card>

            {/* Delivery Details */}
            {(selectedRetailer || (entryMode === 1 && form.manualRetailer.businessName)) && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Delivery Details
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={form.isNow}
                            onChange={toggleNow}
                          />
                        }
                        label="Schedule for immediate delivery (within 2 hours)"
                      />
                    </Grid>
                    
                    {!form.isNow && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Delivery Date"
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                              min: new Date().toISOString().split('T')[0]
                            }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Schedule />
                                </InputAdornment>
                              )
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Delivery Time"
                            type="time"
                            value={form.time}
                            onChange={(e) => setForm(f => ({ ...f, time: e.target.value }))}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                      </>
                    )}
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Amount to Collect (Optional)"
                        type="number"
                        value={form.amountToCollect}
                        onChange={(e) => setForm(f => ({ ...f, amountToCollect: e.target.value }))}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <AttachMoney />
                            </InputAdornment>
                          )
                        }}
                        placeholder="0.00"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Delivery Notes"
                        value={form.notes}
                        onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                        multiline
                        rows={3}
                        placeholder="Add any special instructions or notes for the delivery..."
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Notes />
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Summary Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ position: 'sticky', top: 24 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Delivery Summary
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                {selectedRetailer ? (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Customer
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedRetailer.business_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedRetailer.address}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedRetailer.phone}
                    </Typography>
                  </Box>
                ) : entryMode === 1 && form.manualRetailer.businessName ? (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Customer
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {form.manualRetailer.businessName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {form.manualRetailer.address}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {form.manualRetailer.phone}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Please select a retailer or enter customer details
                  </Typography>
                )}
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Delivery Time
                  </Typography>
                  <Typography variant="body1">
                    {form.isNow ? 'Within 2 hours' : form.date && form.time ? `${form.date} at ${form.time}` : 'Not scheduled'}
                  </Typography>
                </Box>
                
                {form.amountToCollect && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Amount to Collect
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      ₹{form.amountToCollect}
                    </Typography>
                  </Box>
                )}
                
                {errorMessage && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {errorMessage}
                  </Alert>
                )}
                
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleSubmit}
                  disabled={!isFormValid() || submitting}
                  sx={{ mt: 2 }}
                >
                  {submitting ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Booking...
                    </>
                  ) : (
                    'Book Delivery'
                  )}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </MainLayout>
  );
}