'use client';

import React, { useState, useEffect } from 'react';
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
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Inventory,
  People,
  AttachMoney,
  Star,
  Warning
} from '@mui/icons-material';
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
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { createClient } from '../../lib/supabase';
import { Analytics, Product, Order } from '../../types';
import { toast } from 'react-hot-toast';
import { MainLayout } from '../../components/Layout';

interface ChartData {
  name: string;
  value: number;
  revenue?: number;
  orders?: number;
}

interface TopProduct {
  id: string;
  name: string;
  category: string;
  totalSold: number;
  revenue: number;
  stock: number;
}

const COLORS = ['#FF6B35', '#004E89', '#1A936F', '#F18F01', '#C73E1D', '#7209B7'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [revenueData, setRevenueData] = useState<ChartData[]>([]);
  const [categoryData, setCategoryData] = useState<ChartData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<ChartData[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchBusinessAnalytics(),
        fetchRevenueData(),
        fetchCategoryData(),
        fetchTopProducts(),
        fetchOrderStatusData()
      ]);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessAnalytics = async () => {
    if (!user) return;

    const dateFilter = getDateFilter();

    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('seller_id', user.id)
      .gte('created_at', dateFilter);

    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', user.id);

    if (orders && products) {
      const totalRevenue = orders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);
      
      const previousPeriodFilter = getPreviousPeriodFilter();
      const { data: previousOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', user.id)
        .gte('created_at', previousPeriodFilter)
        .lt('created_at', dateFilter);

      const previousRevenue = previousOrders
        ?.filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

      const revenueGrowth = previousRevenue > 0 
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;

      const uniqueCustomers = new Set(orders.map(o => o.retailer_id)).size;
      const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
      const lowStockProducts = products.filter(p => (p.stock_available || 0) < 10).length;

      setAnalytics({
        totalRevenue,
        totalOrders: orders.length,
        totalProducts: products.length,
        totalCustomers: uniqueCustomers,
        averageOrderValue,
        revenueGrowth,
        lowStockProducts
      });
    }
  };

  const fetchRevenueData = async () => {
    if (!user) return;

    const dateFilter = getDateFilter();
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('seller_id', user.id)
      .eq('status', 'delivered')
      .gte('created_at', dateFilter)
      .order('created_at');

    if (orders) {
      const groupedData = groupDataByPeriod(orders, timeRange);
      setRevenueData(groupedData);
    }
  };

  const fetchCategoryData = async () => {
    if (!user) return;

    const { data: products } = await supabase
      .from('products')
      .select('category, price, stock_available')
      .eq('seller_id', user.id);

    if (products) {
      const categoryMap = new Map<string, { count: number; value: number }>();
      
      products.forEach(product => {
        const existing = categoryMap.get(product.category) || { count: 0, value: 0 };
        categoryMap.set(product.category, {
          count: existing.count + 1,
          value: existing.value + (product.price * (product.stock_available || 0))
        });
      });

      const data = Array.from(categoryMap.entries()).map(([name, data]) => ({
        name,
        value: data.value,
        count: data.count
      }));

      setCategoryData(data);
    }
  };

  const fetchTopProducts = async () => {
    if (!user) return;

    // This is a simplified version - in a real app, you'd track actual sales
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', user.id)
      .order('stock_available', { ascending: false })
      .limit(10);

    if (products) {
      const topProductsData = products.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        totalSold: Math.floor(Math.random() * 100) + 10, // Mock data
        revenue: product.price * (Math.floor(Math.random() * 100) + 10),
        stock: product.stock_available || 0
      }));

      setTopProducts(topProductsData);
    }
  };

  const fetchOrderStatusData = async () => {
    if (!user) return;

    const { data: orders } = await supabase
      .from('orders')
      .select('status')
      .eq('seller_id', user.id);

    if (orders) {
      const statusMap = new Map<string, number>();
      orders.forEach(order => {
        statusMap.set(order.status, (statusMap.get(order.status) || 0) + 1);
      });

      const data = Array.from(statusMap.entries()).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }));

      setOrderStatusData(data);
    }
  };

  const getDateFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const getPreviousPeriodFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case 'week':
        return new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
      case 'month':
        return new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
      case 'year':
        return new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const groupDataByPeriod = (orders: Order[], period: string): ChartData[] => {
    const groupedData = new Map<string, { revenue: number; orders: number }>();
    
    orders.forEach(order => {
      const date = new Date(order.created_at);
      let key: string;
      
      switch (period) {
        case 'week':
          key = date.toLocaleDateString('en-US', { weekday: 'short' });
          break;
        case 'month':
          key = date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
          break;
        case 'year':
          key = date.toLocaleDateString('en-US', { month: 'short' });
          break;
        default:
          key = date.toLocaleDateString();
      }
      
      const existing = groupedData.get(key) || { revenue: 0, orders: 0 };
      groupedData.set(key, {
        revenue: existing.revenue + (order.total_amount || 0),
        orders: existing.orders + 1
      });
    });
    
    return Array.from(groupedData.entries()).map(([name, data]) => ({
      name,
      value: data.revenue,
      revenue: data.revenue,
      orders: data.orders
    }));
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ p: 3 }}>
          <LinearProgress />
          <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading analytics...</Typography>
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
              Analytics
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Business insights and performance metrics
            </Typography>
          </Box>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Key Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Revenue
                    </Typography>
                    <Typography variant="h4">
                      ₹{analytics?.totalRevenue.toLocaleString() || 0}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {(analytics?.revenueGrowth || 0) >= 0 ? (
                        <TrendingUp color="success" fontSize="small" />
                      ) : (
                        <TrendingDown color="error" fontSize="small" />
                      )}
                      <Typography
                        variant="body2"
                        color={(analytics?.revenueGrowth || 0) >= 0 ? 'success.main' : 'error.main'}
                        sx={{ ml: 0.5 }}
                      >
                        {Math.abs(analytics?.revenueGrowth || 0).toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                  <AttachMoney color="primary" sx={{ fontSize: 40 }} />
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
                    <Typography variant="h4">
                      {analytics?.totalOrders || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg: ₹{analytics?.averageOrderValue.toLocaleString() || 0}
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
                      Total Customers
                    </Typography>
                    <Typography variant="h4">
                      {analytics?.totalCustomers || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active customers
                    </Typography>
                  </Box>
                  <People color="primary" sx={{ fontSize: 40 }} />
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
                    <Typography variant="h4">
                      {analytics?.totalProducts || 0}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Warning color="warning" fontSize="small" />
                      <Typography variant="body2" color="warning.main" sx={{ ml: 0.5 }}>
                        {analytics?.lowStockProducts || 0} low stock
                      </Typography>
                    </Box>
                  </Box>
                  <Inventory color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Revenue Trend */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Revenue Trend
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#FF6B35"
                        fill="#FF6B35"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Order Status Distribution */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Order Status
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {orderStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Category Performance */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Category Performance
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Value']} />
                      <Bar dataKey="value" fill="#004E89" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Products */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Products
                </Typography>
                <TableContainer sx={{ maxHeight: 300 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Sold</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                        <TableCell align="right">Stock</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topProducts.map((product, index) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                {index + 1}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {product.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {product.category}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {product.totalSold}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              ₹{product.revenue.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={product.stock}
                              size="small"
                              color={product.stock < 10 ? 'error' : product.stock < 50 ? 'warning' : 'success'}
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </MainLayout>
  );
}