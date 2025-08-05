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
  Divider,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Avatar,
  TextField
} from '@mui/material'
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab'
import {
  ArrowBack,
  CheckCircle,
  Cancel,
  LocalShipping,
  Assignment,
  Phone,
  LocationOn,
  Store,
  Schedule,
  Inventory,
  Receipt,
  Done,
  HourglassEmpty,
  Error as ErrorIcon
} from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

interface OrderItem {
  id: string
  product_id: string
  quantity: number
  price: number
  product: {
    name: string
    image_url?: string
    unit: string
    description?: string
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
  notes?: string
  order_items: OrderItem[]
  retailer: {
    business_details: {
      shopName: string
      address: string
      phone: string
      ownerName?: string
    }
  }
}

interface OrderStatusHistory {
  id: string
  order_id: string
  status: string
  notes?: string
  created_at: string
}

export default function OrderDetails() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  
  const [order, setOrder] = useState<Order | null>(null)
  const [statusHistory, setStatusHistory] = useState<OrderStatusHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [statusNotes, setStatusNotes] = useState('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' })

  const supabase = createClient()

  useEffect(() => {
    if (!orderId || !user?.id) return
    fetchOrderDetails()
    fetchStatusHistory()
  }, [orderId, user?.id])

  const fetchOrderDetails = async () => {
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
        .eq('id', orderId)
        .eq('seller_id', user?.id)
        .single()

      if (error) {
        console.error('Error fetching order details:', error)
        setSnackbar({
          open: true,
          message: 'Error fetching order details',
          severity: 'error'
        })
        return
      }

      setOrder(data)
    } catch (error) {
      console.error('Error in fetchOrderDetails:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStatusHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching status history:', error)
        return
      }

      setStatusHistory(data || [])
    } catch (error) {
      console.error('Error in fetchStatusHistory:', error)
    }
  }

  const handleStatusUpdate = async () => {
    if (!order || !newStatus) return

    try {
      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (orderError) {
        console.error('Error updating order status:', orderError)
        setSnackbar({
          open: true,
          message: 'Error updating order status',
          severity: 'error'
        })
        return
      }

      // Add to status history
      const { error: historyError } = await supabase
        .from('order_status_history')
        .insert({
          order_id: order.id,
          status: newStatus,
          notes: statusNotes,
          created_at: new Date().toISOString()
        })

      if (historyError) {
        console.error('Error adding status history:', historyError)
      }

      // Create notification for retailer
      await supabase
        .from('notifications')
        .insert({
          user_id: order.retailer_id,
          title: 'Order Status Updated',
          message: `Your order #${order.id.slice(-8)} has been ${newStatus}${statusNotes ? `: ${statusNotes}` : ''}`,
          type: 'order_update',
          data: { order_id: order.id, status: newStatus },
          read: false
        })

      setSnackbar({
        open: true,
        message: 'Order status updated successfully',
        severity: 'success'
      })
      
      fetchOrderDetails()
      fetchStatusHistory()
      setStatusUpdateDialog(false)
      setNewStatus('')
      setStatusNotes('')
    } catch (error) {
      console.error('Error in handleStatusUpdate:', error)
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <HourglassEmpty />
      case 'confirmed': return <CheckCircle />
      case 'shipped': return <LocalShipping />
      case 'delivered': return <Done />
      case 'cancelled': return <ErrorIcon />
      default: return <Schedule />
    }
  }

  const getOrderTotal = (orderItems: OrderItem[]) => {
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const formatAddress = (address: any) => {
    if (typeof address === 'string') return address
    if (typeof address === 'object' && address) {
      return `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.pincode || ''}`.replace(/^,\s*|,\s*$|,\s*,/g, '').trim()
    }
    return 'Address not provided'
  }

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading order details...</Typography>
      </Box>
    )
  }

  if (!order) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">Order not found</Typography>
        <Button onClick={() => router.back()} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Order #{order.id.slice(-8)}
        </Typography>
        <Chip 
          label={order.status.toUpperCase()}
          color={getStatusColor(order.status) as any}
          icon={getStatusIcon(order.status)}
        />
      </Box>

      <Grid container spacing={3}>
        {/* Order Information */}
        <Grid item xs={12} md={8}>
          {/* Retailer Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Retailer Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Store />
                  </Avatar>
                </Grid>
                <Grid item xs>
                  <Typography variant="subtitle1">
                    {order.retailer?.business_details?.shopName || 'Unknown Shop'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {order.retailer?.business_details?.ownerName || 'Owner'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {order.retailer?.business_details?.address || 'Address not provided'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Phone fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {order.retailer?.business_details?.phone || 'Phone not provided'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Items ({order.order_items?.length || 0})
              </Typography>
              {order.order_items?.map((item: any, index: number) => (
                <Box key={item.id}>
                  <Grid container spacing={2} alignItems="center" sx={{ py: 2 }}>
                    <Grid item>
                      <Avatar 
                        sx={{ width: 56, height: 56 }}
                      >
                        <Inventory />
                      </Avatar>
                    </Grid>
                    <Grid item xs>
                      <Typography variant="subtitle1">
                        {item.name || 'Unknown Product'}
                      </Typography>
                      <Typography variant="body2">
                        Quantity: {item.quantity} {item.unit || 'units'}
                      </Typography>
                      <Typography variant="body2">
                        Price: ₹{item.price} per {item.unit || 'unit'}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant="h6" color="primary">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                  {index < (order.order_items?.length || 0) - 1 && <Divider />}
                </Box>
              ))}
              
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Total Amount:
                </Typography>
                <Typography variant="h5" color="primary">
                  ₹{order.total_amount?.toLocaleString() || getOrderTotal(order.order_items || []).toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Delivery Address
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <LocationOn color="action" sx={{ mt: 0.5 }} />
                <Typography variant="body1">
                  {formatAddress(order.delivery_address)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Order Status & Actions */}
        <Grid item xs={12} md={4}>
          {/* Order Summary */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Order Date
                </Typography>
                <Typography variant="body1">
                  {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body1">
                  {new Date(order.updated_at).toLocaleDateString()} at {new Date(order.updated_at).toLocaleTimeString()}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Current Status
                </Typography>
                <Chip 
                  label={order.status.toUpperCase()}
                  color={getStatusColor(order.status) as any}
                  icon={getStatusIcon(order.status)}
                  sx={{ mt: 1 }}
                />
              </Box>
              {order.notes && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Notes
                  </Typography>
                  <Typography variant="body1">
                    {order.notes}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {order.status === 'pending' && (
                  <>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircle />}
                      onClick={() => {
                        setNewStatus('confirmed')
                        setStatusUpdateDialog(true)
                      }}
                    >
                      Accept Order
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      startIcon={<Cancel />}
                      onClick={() => {
                        setNewStatus('cancelled')
                        setStatusUpdateDialog(true)
                      }}
                    >
                      Reject Order
                    </Button>
                  </>
                )}
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Assignment />}
                  onClick={() => setStatusUpdateDialog(true)}
                >
                  Update Status
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Receipt />}
                  onClick={() => window.print()}
                >
                  Print Order
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Status History */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status History
              </Typography>
              {statusHistory.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No status updates yet
                </Typography>
              ) : (
                <Timeline>
                  {statusHistory.map((history, index) => (
                    <TimelineItem key={history.id}>
                      <TimelineOppositeContent sx={{ flex: 0.3 }}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(history.created_at).toLocaleDateString()}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(history.created_at).toLocaleTimeString()}
                        </Typography>
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot color={getStatusColor(history.status) as any}>
                          {getStatusIcon(history.status)}
                        </TimelineDot>
                        {index < statusHistory.length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent>
                        <Typography variant="subtitle2">
                          {history.status.toUpperCase()}
                        </Typography>
                        {history.notes && (
                          <Typography variant="body2" color="text.secondary">
                            {history.notes}
                          </Typography>
                        )}
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateDialog} onClose={() => setStatusUpdateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={newStatus}
              label="New Status"
              onChange={(e: any) => setNewStatus(e.target.value)}
            >
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="shipped">Shipped</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes (Optional)"
            value={statusNotes}
            onChange={(e: any) => setStatusNotes(e.target.value)}
            placeholder="Add any notes about this status update..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setStatusUpdateDialog(false)
            setNewStatus('')
            setStatusNotes('')
          }}>
            Cancel
          </Button>
          <Button onClick={handleStatusUpdate} variant="contained" disabled={!newStatus}>
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
  )
}