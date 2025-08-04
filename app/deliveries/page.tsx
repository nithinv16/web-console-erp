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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Alert
} from '@mui/material';
import {
  Search,
  FilterList,
  Visibility,
  LocalShipping,
  Cancel,
  CheckCircle,
  Schedule,
  LocationOn,
  Phone,
  Email,
  Refresh,
  Add
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { createClient } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { MainLayout } from '../../components/layout';
import Link from 'next/link';

interface Delivery {
  id: string;
  seller_id: string;
  retailer_id: string | null;
  manual_retailer: {
    business_name: string;
    address: string;
    phone: string;
    email?: string;
  } | null;
  delivery_date?: string;
  delivery_time?: string;
  notes?: string;
  amount_to_collect: number | null;
  delivery_status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  estimated_delivery_time: string;
  actual_delivery_time?: string;
  created_at: string;
  retailer?: {
    id: string;
    business_details: {
      shopName: string;
      address: string;
    };
    phone_number: string;
  };
}

interface DeliveryStats {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
}

const deliverySteps = [
  'Order Confirmed',
  'In Transit',
  'Delivered'
];

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'warning';
    case 'in_transit':
      return 'primary';
    case 'delivered':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const getActiveStep = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 0;
    case 'in_transit':
      return 1;
    case 'delivered':
      return 2;
    default:
      return 0;
  }
};

export default function DeliveriesPage() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [stats, setStats] = useState<DeliveryStats>({
    total: 0,
    active: 0,
    completed: 0,
    cancelled: 0
  });
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchDeliveries();
    }
  }, [user]);

  useEffect(() => {
    filterDeliveries();
  }, [deliveries, searchTerm, statusFilter]);

  const fetchDeliveries = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch delivery orders with related retailer data
      const { data, error } = await supabase
        .from('delivery_orders')
        .select(`
          *,
          retailer:retailer_id (
            id,
            business_details,
            phone_number
          )
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDeliveries(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (deliveriesData: Delivery[]) => {
    const stats = {
      total: deliveriesData.length,
      active: deliveriesData.filter(d => 
        ['pending', 'in_transit'].includes(d.delivery_status.toLowerCase())
      ).length,
      completed: deliveriesData.filter(d => d.delivery_status.toLowerCase() === 'delivered').length,
      cancelled: deliveriesData.filter(d => d.delivery_status.toLowerCase() === 'cancelled').length
    };
    setStats(stats);
  };

  const filterDeliveries = () => {
    let filtered = deliveries;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(delivery => {
        const customerName = delivery.retailer?.business_details?.shopName || delivery.manual_retailer?.business_name || '';
        return customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               delivery.id.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(d => 
          ['pending', 'in_transit'].includes(d.delivery_status.toLowerCase())
        );
      } else {
        filtered = filtered.filter(d => d.delivery_status.toLowerCase() === statusFilter);
      }
    }

    setFilteredDeliveries(filtered);
  };

  const handleViewDetails = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setDetailsOpen(true);
  };

  const handleCancelDelivery = async (deliveryId: string) => {
    try {
      setUpdating(deliveryId);
      const { error } = await supabase
        .from('delivery_orders')
        .update({ 
          delivery_status: 'cancelled'
        })
        .eq('id', deliveryId);

      if (error) throw error;

      toast.success('Delivery cancelled successfully');
      fetchDeliveries();
    } catch (error) {
      console.error('Error cancelling delivery:', error);
      toast.error('Failed to cancel delivery');
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdateStatus = async (deliveryId: string, newStatus: string) => {
    try {
      setUpdating(deliveryId);
      const updateData: any = {
        delivery_status: newStatus
      };

      if (newStatus === 'delivered') {
        updateData.actual_delivery_time = new Date().toISOString();
      }

      const { error } = await supabase
        .from('delivery_orders')
        .update(updateData)
        .eq('id', deliveryId);

      if (error) throw error;

      toast.success('Delivery status updated successfully');
      fetchDeliveries();
      setDetailsOpen(false);
    } catch (error) {
      console.error('Error updating delivery status:', error);
      toast.error('Failed to update delivery status');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ p: 3 }}>
          <LinearProgress />
          <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading deliveries...</Typography>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Deliveries
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and track your delivery orders
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Link href="/deliveries/create" passHref>
              <Button
                variant="contained"
                startIcon={<Add />}
              >
                Create Delivery
              </Button>
            </Link>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchDeliveries}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Deliveries
                    </Typography>
                    <Typography variant="h4">
                      {stats.total}
                    </Typography>
                  </Box>
                  <LocalShipping color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Active Deliveries
                    </Typography>
                    <Typography variant="h4">
                      {stats.active}
                    </Typography>
                  </Box>
                  <Schedule color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Completed
                    </Typography>
                    <Typography variant="h4">
                      {stats.completed}
                    </Typography>
                  </Box>
                  <CheckCircle color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Cancelled
                    </Typography>
                    <Typography variant="h4">
                      {stats.cancelled}
                    </Typography>
                  </Box>
                  <Cancel color="error" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search by customer, tracking number, or order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status Filter</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status Filter"
                    onChange={(e) => setStatusFilter(e.target.value)}
                    startAdornment={<FilterList sx={{ mr: 1 }} />}
                  >
                    <MenuItem value="all">All Deliveries</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="in_transit">In Transit</MenuItem>
                    <MenuItem value="delivered">Delivered</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Deliveries Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Delivery Orders ({filteredDeliveries.length})
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Estimated Delivery</TableCell>
                    <TableCell>Tracking</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDeliveries.map((delivery) => {
                    const customerName = delivery.retailer?.business_details?.shopName || delivery.manual_retailer?.business_name || 'Unknown Customer';
                    const customerPhone = delivery.retailer?.phone_number || delivery.manual_retailer?.phone || '';
                    const address = delivery.retailer?.business_details?.address || delivery.manual_retailer?.address || 'No address provided';
                    
                    return (
                      <TableRow key={delivery.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            #{delivery.id.slice(-8)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(delivery.created_at).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32 }}>
                              {customerName.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {customerName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {customerPhone}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200 }}>
                            {address}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={delivery.delivery_status.replace('_', ' ').toUpperCase()}
                            color={getStatusColor(delivery.delivery_status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {delivery.estimated_delivery_time 
                              ? new Date(delivery.estimated_delivery_time).toLocaleDateString()
                              : 'TBD'
                            }
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {delivery.id.slice(-8)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(delivery)}
                            color="primary"
                          >
                            <Visibility />
                          </IconButton>
                          {['pending'].includes(delivery.delivery_status.toLowerCase()) && (
                            <IconButton
                              size="small"
                              onClick={() => handleCancelDelivery(delivery.id)}
                              color="error"
                              disabled={updating === delivery.id}
                            >
                              <Cancel />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredDeliveries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No deliveries found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Delivery Details Dialog */}
        <Dialog
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocalShipping />
              Delivery Details - #{selectedDelivery?.id.slice(-8)}
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedDelivery && (
              <Box sx={{ mt: 2 }}>
                {/* Customer Information */}
                <Typography variant="h6" gutterBottom>
                  Customer Information
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6}>
                    {(() => {
                      const customerName = selectedDelivery.retailer?.business_details?.shopName || selectedDelivery.manual_retailer?.business_name || 'Unknown Customer';
                      const customerPhone = selectedDelivery.retailer?.phone_number || selectedDelivery.manual_retailer?.phone || '';
                      const customerEmail = selectedDelivery.manual_retailer?.email || '';
                      
                      return (
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Avatar>{customerName.charAt(0)}</Avatar>
                            <Typography variant="body1" fontWeight="medium">
                              {customerName}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Phone fontSize="small" color="action" />
                            <Typography variant="body2">
                              {customerPhone || 'N/A'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Email fontSize="small" color="action" />
                            <Typography variant="body2">
                              {customerEmail || 'N/A'}
                            </Typography>
                          </Box>
                        </>
                      );
                    })()}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <LocationOn fontSize="small" color="action" sx={{ mt: 0.5 }} />
                      <Typography variant="body2">
                        {selectedDelivery.retailer?.business_details?.address || selectedDelivery.manual_retailer?.address || 'No address provided'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Delivery Progress */}
                <Typography variant="h6" gutterBottom>
                  Delivery Progress
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Stepper activeStep={getActiveStep(selectedDelivery.delivery_status)} alternativeLabel>
                    {deliverySteps.map((label) => (
                      <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </Box>

                {/* Delivery Information */}
                <Typography variant="h6" gutterBottom>
                  Delivery Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Tracking Number
                    </Typography>
                    <Typography variant="body1" fontFamily="monospace" gutterBottom>
                      {selectedDelivery.id.slice(-8)}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">
                      Estimated Delivery
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedDelivery.estimated_delivery_time 
                        ? new Date(selectedDelivery.estimated_delivery_time).toLocaleDateString()
                        : 'TBD'
                      }
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Amount to Collect
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      ₹{selectedDelivery.amount_to_collect || 0}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={selectedDelivery.delivery_status.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(selectedDelivery.delivery_status) as any}
                      size="small"
                    />
                  </Grid>
                </Grid>

                {selectedDelivery.notes && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography variant="body1">
                      {selectedDelivery.notes}
                    </Typography>
                  </Box>
                )}

                {selectedDelivery.actual_delivery_time && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    Delivered on {new Date(selectedDelivery.actual_delivery_time).toLocaleString()}
                  </Alert>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
            {selectedDelivery && ['pending', 'in_transit'].includes(selectedDelivery.delivery_status.toLowerCase()) && (
              <>
                {selectedDelivery.delivery_status.toLowerCase() === 'pending' && (
                  <Button
                    variant="contained"
                    onClick={() => handleUpdateStatus(selectedDelivery.id, 'in_transit')}
                    disabled={updating === selectedDelivery.id}
                  >
                    Mark In Transit
                  </Button>
                )}
                {selectedDelivery.delivery_status.toLowerCase() === 'in_transit' && (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => handleUpdateStatus(selectedDelivery.id, 'delivered')}
                    disabled={updating === selectedDelivery.id}
                  >
                    Mark as Delivered
                  </Button>
                )}
                {['pending'].includes(selectedDelivery.delivery_status.toLowerCase()) && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleCancelDelivery(selectedDelivery.id)}
                    disabled={updating === selectedDelivery.id}
                  >
                    Cancel Delivery
                  </Button>
                )}
              </>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
}