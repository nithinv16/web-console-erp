'use client'
import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  CircularProgress,
  Tabs,
  Tab,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Badge
} from '@mui/material'
import {
  Search,
  FilterList,
  MoreVert,
  Visibility,
  CheckCircle,
  Cancel,
  LocalShipping,
  Assignment,
  Refresh,
  ArrowBack,
  NotificationsActive,
  Phone,
  Email,
  LocationOn
} from '@mui/icons-material'
import { useAuth } from '../../../contexts/AuthContext'
import { createClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { MainLayout } from '../../../components/layout'

interface OrderItem {
  id: string
  product_id: string
  quantity: number
  price: number
  product: {
    name: string
    image_url?: string
    unit: string
  }
}

interface Order {
  id: string
  retailer_id: string
  seller_id: string
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  total_amount: number
  created_at: string
  updated_at: string
  delivery_address: any
  order_items: OrderItem[]
  retailer: {
    business_details: {
      shopName: string
      address: string
      phone: string
    }
  }
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`orders-tabpanel-${index}`}
      aria-labelledby={`orders-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

export default function WholesalerOrders() {
  const { user } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [tabValue, setTabValue] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' })
  const [newOrderCount, setNewOrderCount] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    if (!user?.id) return
    
    fetchOrders()
    
    // Set up real-time subscription for new orders
    const subscription = supabase
      .channel('orders_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `seller_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New order received:', payload)
          setNewOrderCount(prev => prev + 1)
          setSnackbar({
            open: true,
            message: 'New order received!',
            severity: 'info'
          })
          fetchOrders() // Refresh orders list
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `seller_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Order updated:', payload)
          fetchOrders() // Refresh orders list
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user?.id])

  useEffect(() => {
    filterOrders()
  }, [orders, searchQuery, filterStatus])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          retailer:profiles!retailer_id (
            business_details
          )
        `)
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error)
        setSnackbar({
          open: true,
          message: 'Error fetching orders',
          severity: 'error'
        })
        return
      }

      setOrders(data || [])
    } catch (error) {
      console.error('Error in fetchOrders:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filterOrders = () => {
    let filtered = orders

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === filterStatus)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(order => 
        order.retailer?.business_details?.shopName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredOrders(filtered)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    setNewOrderCount(0)
    fetchOrders()
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
    const statusMap = ['all', 'pending', 'confirmed', 'shipped', 'delivered']
    setFilterStatus(statusMap[newValue])
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, order: Order) => {
    setMenuAnchor(event.currentTarget)
    setSelectedOrder(order)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setSelectedOrder(null)
  }

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return

    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOrder.id)

      if (error) {
        console.error('Error updating order status:', error)
        setSnackbar({
          open: true,
          message: 'Error updating order status',
          severity: 'error'
        })
        return
      }

      // Create notification for retailer
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedOrder.retailer_id,
          title: 'Order Status Updated',
          message: `Your order #${selectedOrder.id.slice(-8)} has been ${newStatus}`,
          type: 'order_update',
          data: { order_id: selectedOrder.id, status: newStatus },
          read: false
        })

      setSnackbar({
        open: true,
        message: 'Order status updated successfully',
        severity: 'success'
      })
      
      fetchOrders()
      setStatusUpdateDialog(false)
      setNewStatus('')
    } catch (error) {
      console.error('Error in handleStatusUpdate:', error)
    }
  }

  const handleAcceptOrder = async (order: Order) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (error) {
        console.error('Error accepting order:', error)
        return
      }

      // Create notification for retailer
      await supabase
        .from('notifications')
        .insert({
          user_id: order.retailer_id,
          title: 'Order Confirmed',
          message: `Your order #${order.id.slice(-8)} has been confirmed and will be processed soon`,
          type: 'order_confirmed',
          data: { order_id: order.id },
          read: false
        })

      setSnackbar({
        open: true,
        message: 'Order accepted successfully',
        severity: 'success'
      })
      
      fetchOrders()
    } catch (error) {
      console.error('Error in handleAcceptOrder:', error)
    }
  }

  const handleRejectOrder = async (order: Order) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (error) {
        console.error('Error rejecting order:', error)
        return
      }

      // Create notification for retailer
      await supabase
        .from('notifications')
        .insert({
          user_id: order.retailer_id,
          title: 'Order Cancelled',
          message: `Your order #${order.id.slice(-8)} has been cancelled`,
          type: 'order_cancelled',
          data: { order_id: order.id },
          read: false
        })

      setSnackbar({
        open: true,
        message: 'Order rejected successfully',
        severity: 'success'
      })
      
      fetchOrders()
    } catch (error) {
      console.error('Error in handleRejectOrder:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'confirmed': return 'info'
      case 'shipped': return 'primary'
      case 'delivered': return 'success'
      case 'cancelled': return 'error'
      default: return 'default'
    }
  }

  const getOrderTotal = (orderItems: OrderItem[]) => {
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading orders...</Typography>
      </Box>
    )
  }

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            Orders Management
          </Typography>
          <Badge badgeContent={newOrderCount} color="error">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <CircularProgress size={24} /> : <Refresh />}
            </IconButton>
          </Badge>
        </Box>

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search orders by retailer name or order ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Total Orders: {filteredOrders.length}
              </Typography>
              {newOrderCount > 0 && (
                <Chip 
                  icon={<NotificationsActive />}
                  label={`${newOrderCount} new`}
                  color="error"
                  size="small"
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Status Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Orders" />
          <Tab label="Pending" />
          <Tab label="Confirmed" />
          <Tab label="Shipped" />
          <Tab label="Delivered" />
        </Tabs>
      </Paper>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No orders found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filterStatus === 'all' 
              ? "You haven't received any orders yet"
              : `No ${filterStatus} orders found`
            }
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredOrders.map((order) => (
            <Grid item xs={12} key={order.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        Order #{order.id.slice(-8)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {order.retailer?.business_details?.shopName || 'Unknown Retailer'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={order.status.toUpperCase()}
                        color={getStatusColor(order.status) as any}
                        size="small"
                      />
                      <IconButton 
                        size="small"
                        onClick={(e) => handleMenuOpen(e, order)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Order Items */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Items ({order.order_items?.length || 0}):
                    </Typography>
                    {order.order_items?.slice(0, 3).map((item, index) => (
                      <Typography key={index} variant="body2" color="text.secondary">
                        {item.quantity}x {item.product?.name} @ ₹{item.price}/{item.product?.unit}
                      </Typography>
                    ))}
                    {(order.order_items?.length || 0) > 3 && (
                      <Typography variant="body2" color="text.secondary">
                        +{(order.order_items?.length || 0) - 3} more items
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" color="primary">
                      Total: ₹{order.total_amount?.toLocaleString() || getOrderTotal(order.order_items || []).toLocaleString()}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {order.status === 'pending' && (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<Cancel />}
                            onClick={() => handleRejectOrder(order)}
                          >
                            Reject
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircle />}
                            onClick={() => handleAcceptOrder(order)}
                          >
                            Accept
                          </Button>
                        </>
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => router.push(`/wholesaler/orders/${order.id}`)}
                      >
                        View Details
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedOrder) {
            router.push(`/wholesaler/orders/${selectedOrder.id}`)
          }
          handleMenuClose()
        }}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          setStatusUpdateDialog(true)
          handleMenuClose()
        }}>
          <ListItemIcon>
            <Assignment fontSize="small" />
          </ListItemIcon>
          <ListItemText>Update Status</ListItemText>
        </MenuItem>
      </Menu>

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateDialog} onClose={() => setStatusUpdateDialog(false)}>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={newStatus}
              label="New Status"
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="shipped">Shipped</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusUpdateDialog(false)}>Cancel</Button>
          <Button onClick={handleStatusUpdate} variant="contained">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Box>
    </MainLayout>
  )
}