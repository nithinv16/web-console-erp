'use client'
import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Inventory,
  AttachMoney,
  People,
  ArrowBack,
  Refresh
} from '@mui/icons-material'
import { useAuth } from '../../../contexts/AuthContext'
import { createClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { MainLayout } from '../../../components/layout'

interface AnalyticsData {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  revenueGrowth: number
  ordersGrowth: number
  topProducts: Array<{
    id: string
    name: string
    total_sold: number
    revenue: number
  }>
  topCustomers: Array<{
    id: string
    business_name: string
    total_orders: number
    total_spent: number
  }>
  revenueChart: Array<{
    date: string
    revenue: number
    orders: number
  }>
  categoryChart: Array<{
    category: string
    value: number
    count: number
  }>
  orderStatusChart: Array<{
    status: string
    count: number
    percentage: number
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function Analytics() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('30')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)

  const supabase = createClient()

  const fetchAnalytics = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const daysAgo = parseInt(timeRange)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysAgo)
      const startDateStr = startDate.toISOString().split('T')[0]

      // Fetch total revenue and orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, created_at, status')
        .eq('seller_id', user?.id)
        .gte('created_at', startDateStr)

      if (ordersError) throw ordersError

      // Fetch products count
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', user?.id)

      if (productsError) throw productsError

      // Fetch customers count
      const { data: customersData, error: customersError } = await supabase
        .from('orders')
        .select('retailer_id')
        .eq('seller_id', user?.id)
        .gte('created_at', startDateStr)

      if (customersError) throw customersError

      // Process top products from orders items
      const topProductsData: any[] = []
      ordersData?.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            topProductsData.push({
              product_id: item.product_id || item.id,
              quantity: item.quantity,
              price: item.price,
              name: item.name
            })
          })
        }
      })

      // Fetch top customers
      const { data: topCustomersData, error: topCustomersError } = await supabase
        .from('orders')
        .select(`
          retailer_id,
          total_amount,
          profiles!retailer_id(business_name)
        `)
        .eq('seller_id', user?.id)
        .gte('created_at', startDateStr)

      if (topCustomersError) throw topCustomersError

      // Process data
      const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
      const totalOrders = ordersData?.length || 0
      const totalProducts = productsData?.length || 0
      const uniqueCustomers = new Set(customersData?.map(order => order.retailer_id)).size

      // Calculate growth (compare with previous period)
      const prevStartDate = new Date(startDate)
      prevStartDate.setDate(prevStartDate.getDate() - daysAgo)
      const prevStartDateStr = prevStartDate.toISOString().split('T')[0]

      const { data: prevOrdersData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('seller_id', user?.id)
        .gte('created_at', prevStartDateStr)
        .lt('created_at', startDateStr)

      const prevRevenue = prevOrdersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
      const prevOrders = prevOrdersData?.length || 0

      const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0
      const ordersGrowth = prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders) * 100 : 0

      // Process top products
      const productStats = new Map()
      topProductsData?.forEach(item => {
        const productId = item.product_id
        const productName = item.name || 'Unknown'
        const quantity = item.quantity || 0
        const revenue = (item.quantity || 0) * (item.price || 0)

        if (productStats.has(productId)) {
          const existing = productStats.get(productId)
          productStats.set(productId, {
            ...existing,
            total_sold: existing.total_sold + quantity,
            revenue: existing.revenue + revenue
          })
        } else {
          productStats.set(productId, {
            id: productId,
            name: productName,
            total_sold: quantity,
            revenue: revenue
          })
        }
      })

      const topProducts = Array.from(productStats.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      // Process top customers
      const customerStats = new Map()
      topCustomersData?.forEach(order => {
        const customerId = order.retailer_id
        const customerName = order.profiles?.business_name || 'Unknown'
        const amount = order.total_amount || 0

        if (customerStats.has(customerId)) {
          const existing = customerStats.get(customerId)
          customerStats.set(customerId, {
            ...existing,
            total_orders: existing.total_orders + 1,
            total_spent: existing.total_spent + amount
          })
        } else {
          customerStats.set(customerId, {
            id: customerId,
            business_name: customerName,
            total_orders: 1,
            total_spent: amount
          })
        }
      })

      const topCustomers = Array.from(customerStats.values())
        .sort((a, b) => b.total_spent - a.total_spent)
        .slice(0, 5)

      // Generate revenue chart data
      const revenueChart = []
      for (let i = daysAgo - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        const dayOrders = ordersData?.filter(order => 
          order.created_at?.startsWith(dateStr)
        ) || []
        
        const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
        
        revenueChart.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: dayRevenue,
          orders: dayOrders.length
        })
      }

      // Generate category chart data
      const { data: categoryData } = await supabase
        .from('products')
        .select('category')
        .eq('seller_id', user?.id)

      const categoryStats = new Map()
      categoryData?.forEach(product => {
        const category = product.category || 'Other'
        categoryStats.set(category, (categoryStats.get(category) || 0) + 1)
      })

      const categoryChart = Array.from(categoryStats.entries()).map(([category, count]) => ({
        category,
        value: count,
        count
      }))

      // Generate order status chart
      const statusStats = new Map()
      ordersData?.forEach(order => {
        const status = order.status || 'pending'
        statusStats.set(status, (statusStats.get(status) || 0) + 1)
      })

      const orderStatusChart = Array.from(statusStats.entries()).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        percentage: totalOrders > 0 ? (count / totalOrders) * 100 : 0
      }))

      setAnalyticsData({
        totalRevenue,
        totalOrders,
        totalProducts,
        totalCustomers: uniqueCustomers,
        revenueGrowth,
        ordersGrowth,
        topProducts,
        topCustomers,
        revenueChart,
        categoryChart,
        orderStatusChart
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchAnalytics()
    }
  }, [user?.id, timeRange])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {isPositive ? (
          <TrendingUp sx={{ color: 'success.main', fontSize: 16 }} />
        ) : (
          <TrendingDown sx={{ color: 'error.main', fontSize: 16 }} />
        )}
        <Typography
          variant="body2"
          sx={{ color: isPositive ? 'success.main' : 'error.main' }}
        >
          {Math.abs(growth).toFixed(1)}%
        </Typography>
      </Box>
    )
  }

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4">
            Analytics Dashboard
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="7">Last 7 days</MenuItem>
              <MenuItem value="30">Last 30 days</MenuItem>
              <MenuItem value="90">Last 3 months</MenuItem>
              <MenuItem value="365">Last year</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => fetchAnalytics(true)} disabled={refreshing}>
              {refreshing ? <CircularProgress size={20} /> : <Refresh />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {analyticsData && (
        <>
          {/* Key Metrics */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Total Revenue
                      </Typography>
                      <Typography variant="h5">
                        {formatCurrency(analyticsData.totalRevenue)}
                      </Typography>
                      {formatGrowth(analyticsData.revenueGrowth)}
                    </Box>
                    <AttachMoney sx={{ fontSize: 40, color: 'primary.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Total Orders
                      </Typography>
                      <Typography variant="h5">
                        {analyticsData.totalOrders}
                      </Typography>
                      {formatGrowth(analyticsData.ordersGrowth)}
                    </Box>
                    <ShoppingCart sx={{ fontSize: 40, color: 'success.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Total Products
                      </Typography>
                      <Typography variant="h5">
                        {analyticsData.totalProducts}
                      </Typography>
                    </Box>
                    <Inventory sx={{ fontSize: 40, color: 'warning.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Active Customers
                      </Typography>
                      <Typography variant="h5">
                        {analyticsData.totalCustomers}
                      </Typography>
                    </Box>
                    <People sx={{ fontSize: 40, color: 'info.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Revenue Chart */}
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Revenue & Orders Trend
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.revenueChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <RechartsTooltip />
                      <Legend />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.3}
                        name="Revenue (₹)"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="orders"
                        stroke="#82ca9d"
                        strokeWidth={2}
                        name="Orders"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Order Status Chart */}
            <Grid item xs={12} lg={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Order Status Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.orderStatusChart}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, percentage }) => `${status} (${percentage.toFixed(1)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analyticsData.orderStatusChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Top Products and Customers */}
          <Grid container spacing={3}>
            {/* Top Products */}
            <Grid item xs={12} lg={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Selling Products
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell align="right">Sold</TableCell>
                          <TableCell align="right">Revenue</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analyticsData.topProducts.map((product, index) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  label={index + 1}
                                  size="small"
                                  color={index < 3 ? 'primary' : 'default'}
                                />
                                {product.name}
                              </Box>
                            </TableCell>
                            <TableCell align="right">{product.total_sold}</TableCell>
                            <TableCell align="right">{formatCurrency(product.revenue)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Top Customers */}
            <Grid item xs={12} lg={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Customers
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Customer</TableCell>
                          <TableCell align="right">Orders</TableCell>
                          <TableCell align="right">Total Spent</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analyticsData.topCustomers.map((customer, index) => (
                          <TableRow key={customer.id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  label={index + 1}
                                  size="small"
                                  color={index < 3 ? 'primary' : 'default'}
                                />
                                {customer.business_name}
                              </Box>
                            </TableCell>
                            <TableCell align="right">{customer.total_orders}</TableCell>
                            <TableCell align="right">{formatCurrency(customer.total_spent)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
      </Box>
    </MainLayout>
  )
}