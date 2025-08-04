'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
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
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  Badge,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  Visibility,
  Edit,
  LocalShipping,
  CheckCircle,
  Cancel,
  Pending,
  ShoppingCart,
  TrendingUp,
  Phone,
  Message,
  Print
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { createClient } from '../../lib/supabase';
import { Order } from '../../types';
import { toast } from 'react-hot-toast';
import { MainLayout } from '../../components/Layout';

const orderStatuses = [
  { value: 'pending', label: 'Pending', color: 'warning' as const, icon: <Pending /> },
  { value: 'confirmed', label: 'Confirmed', color: 'info' as const, icon: <CheckCircle /> },
  { value: 'processing', label: 'Processing', color: 'primary' as const, icon: <Edit /> },
  { value: 'shipped', label: 'Shipped', color: 'secondary' as const, icon: <LocalShipping /> },
  { value: 'delivered', label: 'Delivered', color: 'success' as const, icon: <CheckCircle /> },
  { value: 'cancelled', label: 'Cancelled', color: 'error' as const, icon: <Cancel /> }
];

const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuOrder, setMenuOrder] = useState<Order | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchOrders();
      // Set up real-time subscription
      const subscription = supabase
        .channel('orders')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `seller_id=eq.${user.id}`
        }, () => {
          fetchOrders();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          retailer:retailer_id(business_name, owner_name, contact_phone, address)
        `)
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
    handleMenuClose();
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setOrderDetailsOpen(true);
    handleMenuClose();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, order: Order) => {
    setAnchorEl(event.currentTarget);
    setMenuOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuOrder(null);
  };

  const getFilteredOrders = () => {
    return orders.filter(order => {
      const matchesSearch = 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order as any).retailer?.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order as any).retailer?.owner_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      const matchesDate = (() => {
        if (dateFilter === 'all') return true;
        const orderDate = new Date(order.created_at);
        const now = new Date();
        
        switch (dateFilter) {
          case 'today':
            return orderDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return orderDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return orderDate >= monthAgo;
          default:
            return true;
        }
      })();
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  };

  const getOrderStats = () => {
    const filteredOrders = getFilteredOrders();
    return {
      total: filteredOrders.length,
      pending: filteredOrders.filter(o => o.status === 'pending').length,
      processing: filteredOrders.filter(o => ['confirmed', 'processing', 'shipped'].includes(o.status)).length,
      completed: filteredOrders.filter(o => o.status === 'delivered').length,
      revenue: filteredOrders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0)
    };
  };

  const getStatusConfig = (status: string) => {
    return orderStatuses.find(s => s.value === status) || orderStatuses[0];
  };

  const getCurrentStepIndex = (status: string) => {
    return statusSteps.indexOf(status);
  };

  const stats = getOrderStats();
  const filteredOrders = getFilteredOrders();

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Orders
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and track your customer orders
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Orders
                    </Typography>
                    <Typography variant="h4">
                      {stats.total}
                    </Typography>
                  </Box>
                  <ShoppingCart color="primary" sx={{ fontSize: 40 }} />
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
                      Pending
                    </Typography>
                    <Typography variant="h4">
                      <Badge badgeContent={stats.pending} color="warning" max={999}>
                        <span>{stats.pending}</span>
                      </Badge>
                    </Typography>
                  </Box>
                  <Pending color="warning" sx={{ fontSize: 40 }} />
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
                      Processing
                    </Typography>
                    <Typography variant="h4">
                      {stats.processing}
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
                      Revenue
                    </Typography>
                    <Typography variant="h4">
                      ₹{stats.revenue.toLocaleString()}
                    </Typography>
                  </Box>
                  <TrendingUp color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Orders</MenuItem>
                    {orderStatuses.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Date Range</InputLabel>
                  <Select
                    value={dateFilter}
                    label="Date Range"
                    onChange={(e) => setDateFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Time</MenuItem>
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="week">This Week</MenuItem>
                    <MenuItem value="month">This Month</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ p: 3 }}>
                <LinearProgress />
                <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading orders...</Typography>
              </Box>
            ) : filteredOrders.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <ShoppingCart sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No orders found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {orders.length === 0 ? 'Orders will appear here when customers place them' : 'Try adjusting your filters'}
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const statusConfig = getStatusConfig(order.status);
                      return (
                        <TableRow key={order.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2">
                              #{order.id.slice(-8).toUpperCase()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {order.items?.length || 0} items
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ width: 32, height: 32 }}>
                                {(order as any).retailer?.business_name?.charAt(0) || 'C'}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2">
                                  {(order as any).retailer?.business_name || 'Unknown Customer'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {(order as any).retailer?.owner_name}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {new Date(order.created_at).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(order.created_at).toLocaleTimeString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2">
                              ₹{order.total_amount?.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={statusConfig.icon}
                              label={statusConfig.label}
                              color={statusConfig.color}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              onClick={(e) => handleMenuOpen(e, order)}
                            >
                              <MoreVert />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => menuOrder && handleViewDetails(menuOrder)}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          <Divider />
          {orderStatuses.map((status) => (
            <MenuItem
              key={status.value}
              onClick={() => menuOrder && handleStatusUpdate(menuOrder.id, status.value)}
              disabled={menuOrder?.status === status.value}
            >
              <ListItemIcon>
                {status.icon}
              </ListItemIcon>
              <ListItemText>Mark as {status.label}</ListItemText>
            </MenuItem>
          ))}
        </Menu>

        {/* Order Details Dialog */}
        <Dialog
          open={orderDetailsOpen}
          onClose={() => setOrderDetailsOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Order #{selectedOrder?.id.slice(-8).toUpperCase()}
              </Typography>
              <Chip
                icon={getStatusConfig(selectedOrder?.status || '').icon}
                label={getStatusConfig(selectedOrder?.status || '').label}
                color={getStatusConfig(selectedOrder?.status || '').color}
                variant="outlined"
              />
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedOrder && (
              <Box>
                {/* Order Progress */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Order Progress
                  </Typography>
                  <Stepper activeStep={getCurrentStepIndex(selectedOrder.status)} alternativeLabel>
                    {statusSteps.map((step) => (
                      <Step key={step}>
                        <StepLabel>{getStatusConfig(step).label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Customer Information */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Customer Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">Business Name</Typography>
                      <Typography variant="body1">
                        {(selectedOrder as any).retailer?.business_name || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">Owner Name</Typography>
                      <Typography variant="body1">
                        {(selectedOrder as any).retailer?.owner_name || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">Phone</Typography>
                      <Typography variant="body1">
                        {(selectedOrder as any).retailer?.contact_phone || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">Address</Typography>
                      <Typography variant="body1">
                        {(selectedOrder as any).retailer?.address || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Order Summary */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Order Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">Order Date</Typography>
                      <Typography variant="body1">
                        {new Date(selectedOrder.created_at).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">Total Amount</Typography>
                      <Typography variant="h6" color="primary">
                        ₹{selectedOrder.total_amount?.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Items</Typography>
                      <Typography variant="body1">
                        {selectedOrder.items?.length || 0} items
                      </Typography>
                    </Grid>
                    {selectedOrder.notes && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Notes</Typography>
                        <Typography variant="body1">
                          {selectedOrder.notes}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOrderDetailsOpen(false)}>Close</Button>
            <Button startIcon={<Print />} variant="outlined">
              Print
            </Button>
            {(selectedOrder as any)?.retailer?.contact_phone && (
              <Button startIcon={<Phone />} variant="outlined">
                Call Customer
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
}