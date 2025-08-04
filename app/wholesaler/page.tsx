'use client'
import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Badge
} from '@mui/material'
import {
  LocationOn,
  Phone,
  Verified,
  Warning,
  ShoppingCart,
  TrendingUp,
  Inventory,
  People,
  Add,
  Notifications,
  Store,
  Analytics,
  LocalShipping,
  AccountGroup,
  ChartBar,

} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { MainLayout } from '../../components/Layout'

interface BusinessStats {
  totalOrders: number
  pendingOrders: number
  totalProducts: number
  lowStockProducts: number
  revenue: {
    today: number
    thisMonth: number
  }
}

interface Delivery {
  id: string
  retailer_id: string | null
  manual_retailer: {
    business_name: string
    address: string
    phone: string
  } | null
  estimated_delivery_time: string
  delivery_status: 'pending' | 'in_transit' | 'delivered' | 'cancelled'
  amount_to_collect: number | null
  created_at: string
  retailer?: {
    business_details: {
      shopName: string
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
      id={`wholesaler-tabpanel-${index}`}
      aria-labelledby={`wholesaler-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

export default function WholesalerDashboard() {
  const { user, sellerDetails } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<BusinessStats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    revenue: {
      today: 0,
      thisMonth: 0,
    },
  })
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loadingDeliveries, setLoadingDeliveries] = useState(true)
  const [deliveryFilter, setDeliveryFilter] = useState<'upcoming' | 'completed'>('upcoming')
  const [tabValue, setTabValue] = useState(0)
  const [notificationCount, setNotificationCount] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    if (!user?.id) return
    
    const initializeComponent = async () => {
      setLoading(true)
      
      try {
        // Polyfill for Promise.allSettled if not available
        const promiseAllSettled = Promise.allSettled || ((promises) => {
          return Promise.all(
            promises.map(promise =>
              Promise.resolve(promise)
                .then(value => ({ status: 'fulfilled', value }))
                .catch(reason => ({ status: 'rejected', reason }))
            )
          );
        });
        
        await promiseAllSettled([
          fetchBusinessStats(),
          fetchDeliveries(),
          fetchNotificationCount()
        ])
      } catch (error) {
        console.error('Error during initialization:', error)
      } finally {
        setLoading(false)
      }
    }
    
    initializeComponent()
  }, [user?.id])

  const fetchBusinessStats = async () => {
    try {
      const [ordersResponse, productsResponse, revenueResponse] = await Promise.all([
        supabase.from('orders').select('*').eq('seller_id', user?.id),
        supabase.from('products').select('*').eq('seller_id', user?.id),
        supabase.from('orders')
          .select('total_amount')
          .eq('seller_id', user?.id)
          .gte('created_at', new Date().toISOString().split('T')[0]),
      ])

      if (ordersResponse.error) {
        console.error('Error fetching orders:', ordersResponse.error)
        return
      }
      
      if (productsResponse.error) {
        console.error('Error fetching products:', productsResponse.error)
        return
      }
      
      if (revenueResponse.error) {
        console.error('Error fetching revenue:', revenueResponse.error)
        return
      }

      setStats({
        totalOrders: ordersResponse.data?.length || 0,
        pendingOrders: ordersResponse.data?.filter(o => o.status === 'pending').length || 0,
        totalProducts: productsResponse.data?.length || 0,
        lowStockProducts: productsResponse.data?.filter(p => p.stock_available > 0 && p.stock_available <= p.min_order_quantity).length || 0,
        revenue: {
          today: revenueResponse.data?.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0) || 0,
          thisMonth: 0,
        },
      })
    } catch (error) {
      console.error('Error in fetchBusinessStats:', error)
    }
  }

  const fetchDeliveries = async () => {
    try {
      setLoadingDeliveries(true)
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        console.error('Error fetching deliveries:', error)
        return
      }

      setDeliveries(data || [])
    } catch (error) {
      console.error('Error in fetchDeliveries:', error)
    } finally {
      setLoadingDeliveries(false)
    }
  }

  const fetchNotificationCount = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user?.id)
        .eq('read', false)

      if (error) {
        console.error('Error fetching notifications:', error)
        return
      }

      setNotificationCount(data?.length || 0)
    } catch (error) {
      console.error('Error in fetchNotificationCount:', error)
    }
  }

  const getRetailerName = (delivery: Delivery) => {
    if (delivery.manual_retailer) {
      return delivery.manual_retailer.business_name
    }
    return delivery.retailer?.business_details?.shopName || 'Unknown Retailer'
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading wholesaler dashboard...</Typography>
      </Box>
    )
  }

  return (
    <MainLayout>
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {sellerDetails?.owner_name || 'Wholesaler'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your wholesale business today
        </Typography>
      </Box>

      {/* Business Profile Card */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                sx={{ width: 80, height: 80, bgcolor: 'rgba(255,255,255,0.2)' }}
                src={sellerDetails?.image_url}
              >
                {sellerDetails?.business_name?.charAt(0) || 'W'}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h5" gutterBottom>
                {sellerDetails?.business_name || 'Your Wholesale Business'}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 1 }}>
                {sellerDetails?.business_type || 'Wholesale Business'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                {sellerDetails?.address && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOn fontSize="small" />
                    <Typography variant="body2">
                      {typeof sellerDetails.address === 'object' 
                        ? `${sellerDetails.address.street || ''}, ${sellerDetails.address.city || ''}, ${sellerDetails.address.state || ''} ${sellerDetails.address.pincode || ''}`.replace(/^,\s*|,\s*$|,\s*,/g, '').trim()
                        : sellerDetails.address
                      }
                    </Typography>
                  </Box>
                )}
                {sellerDetails?.contact_phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Phone fontSize="small" />
                    <Typography variant="body2">{sellerDetails.contact_phone}</Typography>
                  </Box>
                )}
              </Box>
            </Grid>
            <Grid item>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge badgeContent={notificationCount} color="error">
                  <IconButton 
                    sx={{ color: 'white' }}
                    onClick={() => router.push('/wholesaler/notifications')}
                  >
                    <Notifications />
                  </IconButton>
                </Badge>
                <Chip
                  icon={sellerDetails?.is_verified ? <Verified /> : <Warning />}
                  label={sellerDetails?.is_verified ? 'Verified' : 'Pending Verification'}
                  color={sellerDetails?.is_verified ? 'success' : 'warning'}
                  variant="outlined"
                  sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Today's Revenue
                  </Typography>
                  <Typography variant="h4">
                    ₹{stats.revenue.today.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +12% from yesterday
                  </Typography>
                </Box>
                <TrendingUp color="success" sx={{ fontSize: 40 }} />
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
                    Pending Orders
                  </Typography>
                  <Typography variant="h4">
                    {stats.pendingOrders}
                  </Typography>
                  <Typography variant="body2" color="warning.main">
                    Needs attention
                  </Typography>
                </Box>
                <ShoppingCart color="warning" sx={{ fontSize: 40 }} />
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
                    Low Stock Items
                  </Typography>
                  <Typography variant="h4">
                    {stats.lowStockProducts}
                  </Typography>
                  <Typography variant="body2" color="error.main">
                    Restock needed
                  </Typography>
                </Box>
                <Inventory color="error" sx={{ fontSize: 40 }} />
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
                    Total Products
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalProducts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In inventory
                  </Typography>
                </Box>
                <Store color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4} md={2}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => router.push('/wholesaler/products/add')}
              >
                <Add color="primary" sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="body2">Add Product</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => router.push('/wholesaler/inventory')}
              >
                <Inventory color="primary" sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="body2">Inventory</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => router.push('/wholesaler/customers')}
              >
                <People color="primary" sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="body2">Customers</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => router.push('/wholesaler/analytics')}
              >
                <Analytics color="primary" sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="body2">Analytics</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => router.push('/wholesaler/orders')}
              >
                <LocalShipping color="primary" sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="body2">Orders</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => router.push('/wholesaler/delivery/book')}
              >
                <LocalShipping color="primary" sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="body2">Book Delivery</Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Booked Deliveries */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Booked Deliveries
            </Typography>
            <Button 
              variant="text"
              onClick={() => router.push('/wholesaler/deliveries')}
            >
              View All
            </Button>
          </Box>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Upcoming" />
              <Tab label="Completed" />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            {loadingDeliveries ? (
              <CircularProgress />
            ) : deliveries.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <LocalShipping sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No upcoming deliveries
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  You haven't placed any orders for delivery
                </Typography>
                <Button 
                  variant="outlined"
                  onClick={() => router.push('/wholesaler/delivery/book')}
                >
                  Book a Delivery
                </Button>
              </Box>
            ) : (
              deliveries.map(delivery => (
                <Card 
                  key={delivery.id}
                  sx={{ mb: 2, cursor: 'pointer' }}
                  onClick={() => router.push(`/wholesaler/delivery/${delivery.id}`)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1">
                          {getRetailerName(delivery)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(delivery.estimated_delivery_time).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Chip 
                        label={delivery.delivery_status}
                        color={delivery.delivery_status === 'delivered' ? 'success' : 'primary'}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Completed deliveries will appear here
              </Typography>
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
    </MainLayout>
  )
}