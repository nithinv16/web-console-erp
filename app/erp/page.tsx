'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  LinearProgress,
  Alert,
  Fab,
  Menu,
  MenuItem,

} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  TrendingUp,
  TrendingDown,
  Inventory,
  ShoppingCart,
  Receipt,
  People,
  Warehouse,
  Add,
  MoreVert,
  Notifications,
  Settings,
  Business,
  Analytics,
  Assignment,
  LocalShipping,
  AttachMoney,
  Warning,
  CheckCircle,
  Schedule
} from '@mui/icons-material'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database, ERPCompany, ERPProduct, ERPPurchaseOrder, ERPSalesOrder, ERPInvoice } from '@/types/database'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface ERPStats {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  lowStockProducts: number
  pendingInvoices: number
  revenueGrowth: number
  ordersGrowth: number
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  action: () => void
}

interface RecentActivity {
  id: string
  type: 'order' | 'invoice' | 'payment' | 'inventory'
  title: string
  description: string
  timestamp: string
  status: 'success' | 'warning' | 'error' | 'info'
  amount?: number
}

export default function ERPDashboard() {
  const [stats, setStats] = useState<ERPStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    lowStockProducts: 0,
    pendingInvoices: 0,
    revenueGrowth: 0,
    ordersGrowth: 0
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [currentCompany, setCurrentCompany] = useState<ERPCompany | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [quickActionAnchor, setQuickActionAnchor] = useState<null | HTMLElement>(null)
  
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()
  const { user, sellerDetails, session, loading: authLoading } = useAuth()

  const quickActions: QuickAction[] = [
    {
      id: 'new-sale',
      title: 'New Sales Order',
      description: 'Create a new sales order',
      icon: <ShoppingCart />,
      color: '#4CAF50',
      action: () => router.push('/erp/sales/orders/new')
    },
    {
      id: 'new-purchase',
      title: 'New Purchase Order',
      description: 'Create a new purchase order',
      icon: <Assignment />,
      color: '#2196F3',
      action: () => router.push('/erp/purchase/orders/new')
    },
    {
      id: 'add-product',
      title: 'Add Product',
      description: 'Add a new product to inventory',
      icon: <Inventory />,
      color: '#FF9800',
      action: () => router.push('/erp/inventory/products/new')
    },
    {
      id: 'create-invoice',
      title: 'Create Invoice',
      description: 'Generate a new invoice',
      icon: <Receipt />,
      color: '#9C27B0',
      action: () => router.push('/erp/accounting/invoices/new')
    }
  ]

  useEffect(() => {
    console.log('ERP useEffect triggered, auth loading:', authLoading)
    // Only fetch data when auth context is loaded and user is authenticated
    if (!authLoading && session && user) {
      console.log('Auth loaded, fetching dashboard data...')
      fetchDashboardData()
    }
  }, [authLoading, session, user])

  const fetchDashboardData = async () => {
    try {
      console.log('Starting fetchDashboardData...')
      setLoading(true)
      
      // Check if company exists
      const { data: companies, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .limit(1)
        .single()
      
      console.log('Company check result:', { companies, companyError })
      
      if (companyError && companyError.code !== 'PGRST116') {
        throw companyError
      }
      
      let currentCompanyData = companies
      
      if (!companies) {
        console.log('No company found, checking seller details...')
        // Check if seller details exist to auto-create company
        if (sellerDetails && user) {
          console.log('Found seller details from context:', sellerDetails)
          // Auto-create company from seller details
          const { data: newCompany, error: createError } = await supabase
            .from('companies')
            .insert({
              name: sellerDetails.business_name || 'My Business',
              gst_number: sellerDetails.gst_number || '',
              registration_number: sellerDetails.registration_number || '',
              address: sellerDetails.address || {},
              phone: '',
              email: user.email || '',
              subscription_plan: 'basic',
              subscription_status: 'active',
              settings: {}
            })
            .select()
            .single()
          
          if (createError) {
            console.error('Error auto-creating company:', createError)
            setError('Failed to setup company automatically')
            setLoading(false)
            return
          }
          
          currentCompanyData = newCompany
        } else {
          setError('Unable to setup company - missing seller details')
          setLoading(false)
          return
        }
      }
      
      // Use the company data (either existing or newly created)
      setCurrentCompany(currentCompanyData)
      
      // Fetch dashboard statistics
      const [salesOrders, purchaseOrders, products, customers, invoices] = await Promise.all([
        supabase.from('sales_orders').select('total_amount, created_at').eq('company_id', currentCompanyData.id),
        supabase.from('purchase_orders').select('total_amount, created_at').eq('company_id', currentCompanyData.id),
        supabase.from('erp_products').select('id, min_stock_level').eq('company_id', currentCompanyData.id),
        supabase.from('customers').select('id').eq('company_id', currentCompanyData.id),
        supabase.from('invoices').select('total_amount, status, created_at').eq('company_id', currentCompanyData.id)
      ])
      
      // Calculate statistics
      const totalRevenue = salesOrders.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
      const totalOrders = salesOrders.data?.length || 0
      const totalProducts = products.data?.length || 0
      const totalCustomers = customers.data?.length || 0
      const pendingInvoices = invoices.data?.filter(inv => inv.status === 'pending').length || 0
      
      // Calculate growth (simplified - comparing last 30 days vs previous 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const sixtyDaysAgo = new Date()
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
      
      const recentRevenue = salesOrders.data?.filter(order => 
        new Date(order.created_at) > thirtyDaysAgo
      ).reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
      
      const previousRevenue = salesOrders.data?.filter(order => 
        new Date(order.created_at) > sixtyDaysAgo && new Date(order.created_at) <= thirtyDaysAgo
      ).reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
      
      const revenueGrowth = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0
      
      setStats({
        totalRevenue,
        totalOrders,
        totalProducts,
        totalCustomers,
        lowStockProducts: 0, // TODO: Implement inventory checking
        pendingInvoices,
        revenueGrowth,
        ordersGrowth: 0 // TODO: Implement orders growth calculation
      })
      
      // Generate recent activities
      const activities: RecentActivity[] = [
        ...salesOrders.data?.slice(0, 3).map(order => ({
          id: `so-${Math.random()}`,
          type: 'order' as const,
          title: 'New Sales Order',
          description: `Sales order created`,
          timestamp: order.created_at,
          status: 'success' as const,
          amount: order.total_amount
        })) || [],
        ...invoices.data?.slice(0, 2).map(invoice => ({
          id: `inv-${Math.random()}`,
          type: 'invoice' as const,
          title: 'Invoice Generated',
          description: `Invoice ${invoice.status}`,
          timestamp: invoice.created_at,
          status: invoice.status === 'paid' ? 'success' as const : 'warning' as const,
          amount: invoice.total_amount
        })) || []
      ]
      
      setRecentActivities(activities.slice(0, 5))
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }
  

  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCart />
      case 'invoice': return <Receipt />
      case 'payment': return <AttachMoney />
      case 'inventory': return <Inventory />
      default: return <Notifications />
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#4CAF50'
      case 'warning': return '#FF9800'
      case 'error': return '#F44336'
      default: return '#2196F3'
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>ERP Dashboard</Typography>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading dashboard data...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            ERP Dashboard
          </Typography>
          {currentCompany && (
            <Typography variant="subtitle1" color="text.secondary">
              {currentCompany.name}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton>
            <Notifications />
          </IconButton>
          <IconButton>
            <Settings />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(stats.totalRevenue)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {stats.revenueGrowth >= 0 ? <TrendingUp color="success" /> : <TrendingDown color="error" />}
                    <Typography variant="body2" color={stats.revenueGrowth >= 0 ? 'success.main' : 'error.main'}>
                      {Math.abs(stats.revenueGrowth).toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: '#4CAF50' }}>
                  <AttachMoney />
                </Avatar>
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
                    Total Orders
                  </Typography>
                  <Typography variant="h5">
                    {stats.totalOrders}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {stats.ordersGrowth >= 0 ? <TrendingUp color="success" /> : <TrendingDown color="error" />}
                    <Typography variant="body2" color={stats.ordersGrowth >= 0 ? 'success.main' : 'error.main'}>
                      {Math.abs(stats.ordersGrowth).toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: '#2196F3' }}>
                  <ShoppingCart />
                </Avatar>
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
                    Products
                  </Typography>
                  <Typography variant="h5">
                    {stats.totalProducts}
                  </Typography>
                  {stats.lowStockProducts > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Warning color="warning" fontSize="small" />
                      <Typography variant="body2" color="warning.main">
                        {stats.lowStockProducts} low stock
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Avatar sx={{ bgcolor: '#FF9800' }}>
                  <Inventory />
                </Avatar>
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
                    Customers
                  </Typography>
                  <Typography variant="h5">
                    {stats.totalCustomers}
                  </Typography>
                  {stats.pendingInvoices > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Schedule color="info" fontSize="small" />
                      <Typography variant="body2" color="info.main">
                        {stats.pendingInvoices} pending invoices
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Avatar sx={{ bgcolor: '#9C27B0' }}>
                  <People />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                {quickActions.map((action) => (
                  <Grid item xs={6} key={action.id}>
                    <Paper
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 3
                        }
                      }}
                      onClick={action.action}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ bgcolor: action.color, mr: 1, width: 32, height: 32 }}>
                          {action.icon}
                        </Avatar>
                        <Typography variant="subtitle2">
                          {action.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {action.description}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activities
              </Typography>
              <List>
                {recentActivities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getStatusColor(activity.status) }}>
                          {getActivityIcon(activity.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {activity.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(activity.timestamp).toLocaleDateString()}
                            </Typography>
                            {activity.amount && (
                              <Typography variant="body2" color="primary">
                                {formatCurrency(activity.amount)}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
              {recentActivities.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No recent activities
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={(e) => setQuickActionAnchor(e.currentTarget)}
      >
        <Add />
      </Fab>

      {/* Quick Action Menu */}
      <Menu
        anchorEl={quickActionAnchor}
        open={Boolean(quickActionAnchor)}
        onClose={() => setQuickActionAnchor(null)}
      >
        {quickActions.map((action) => (
          <MenuItem
            key={action.id}
            onClick={() => {
              action.action()
              setQuickActionAnchor(null)
            }}
          >
            <Avatar sx={{ bgcolor: action.color, mr: 2, width: 24, height: 24 }}>
              {action.icon}
            </Avatar>
            {action.title}
          </MenuItem>
        ))}
      </Menu>


    </Box>
  )
}