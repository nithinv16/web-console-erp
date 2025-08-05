'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Chip,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  Divider,
  Box,
  Paper,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  Timeline as Activity,
  Warning as AlertCircle,
  BarChart as BarChart3,
  Business as Building2,
  CalendarToday as Calendar,
  CheckCircle,
  AccessTime as Clock,
  AttachMoney as DollarSign,
  Description as FileText,
  Inventory as Package,
  Settings,
  ShoppingCart,
  TrendingUp,
  People as Users,
  FlashOn as Zap,
  Notifications as Bell,
  Search,
  FilterList as Filter,
  Download,
  Refresh as RefreshCw,
  Visibility as Eye,
  TrendingUp as ArrowUpRight,
  TrendingDown as ArrowDownRight,
  Remove as Minus
} from '@mui/icons-material';
import { MainERPApi, ERPDashboardData, ERPSystemHealth } from '@/lib/api/main-erp-api';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';

interface ERPDashboardProps {
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const moduleIcons: { [key: string]: any } = {
  sales: ShoppingCart,
  accounting: DollarSign,
  inventory: Package,
  crm: Users,
  hr: Users,
  manufacturing: Settings,
  supply_chain: Package,
  projects: Calendar,
  quality: CheckCircle,
  assets: Building2,
  documents: FileText,
  bi: BarChart3,
  communication: Bell
};

export function ERPDashboard({ className }: ERPDashboardProps) {
  const [dashboardData, setDashboardData] = useState<ERPDashboardData | null>(null);
  const [systemHealth, setSystemHealth] = useState<ERPSystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const [dashData, healthData] = await Promise.all([
        MainERPApi.getDashboardData(),
        MainERPApi.getSystemHealth()
      ]);
      setDashboardData(dashData);
      setSystemHealth(healthData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight sx={{ color: 'green' }} />;
    if (value < 0) return <ArrowDownRight sx={{ color: 'red' }} />;
    return <Minus sx={{ color: 'gray' }} />;
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={24} />
          <Typography>Loading ERP Dashboard...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography>{error}</Typography>
          <Button variant="outlined" size="small" onClick={handleRefresh}>
            Retry
          </Button>
        </Box>
      </Alert>
    );
  }

  if (!dashboardData || !systemHealth) {
    return (
      <Alert severity="info">
        <Typography>No dashboard data available.</Typography>
      </Alert>
    );
  }

  const salesChartData = [
    { name: 'Jan', revenue: 45000, orders: 120 },
    { name: 'Feb', revenue: 52000, orders: 135 },
    { name: 'Mar', revenue: 48000, orders: 128 },
    { name: 'Apr', revenue: 61000, orders: 155 },
    { name: 'May', revenue: 55000, orders: 142 },
    { name: 'Jun', revenue: 67000, orders: 168 }
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            ERP Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive overview of your business operations
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Download />}>
            Export
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<RefreshCw />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* System Health Status */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Activity />
              <Typography variant="h6">System Health</Typography>
              <Chip 
                label={systemHealth.overall_status.toUpperCase()} 
                color={getStatusColor(systemHealth.overall_status) as any}
                size="small"
              />
            </Box>
          }
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4">{systemHealth.active_users}</Typography>
                <Typography variant="body2" color="text.secondary">Active Users</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4">{systemHealth.api_response_time}ms</Typography>
                <Typography variant="body2" color="text.secondary">Response Time</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4">{systemHealth.system_load.toFixed(1)}%</Typography>
                <Typography variant="body2" color="text.secondary">System Load</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4">
                  {systemHealth.database_status === 'connected' ? '✓' : '✗'}
                </Typography>
                <Typography variant="body2" color="text.secondary">Database</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(dashboardData.sales.total_revenue)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {getTrendIcon(dashboardData.sales.monthly_growth)}
                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                      {formatPercentage(dashboardData.sales.monthly_growth)} from last month
                    </Typography>
                  </Box>
                </Box>
                <DollarSign color="action" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Active Opportunities
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(dashboardData.sales.active_opportunities)}
                  </Typography>
                  <Typography variant="caption">
                    Conversion rate: {dashboardData.sales.conversion_rate.toFixed(1)}%
                  </Typography>
                </Box>
                <TrendingUp color="action" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Net Profit
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(dashboardData.financial.net_profit)}
                  </Typography>
                  <Typography variant="caption">
                    Cash flow: {formatCurrency(dashboardData.financial.cash_flow)}
                  </Typography>
                </Box>
                <BarChart3 color="action" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Employees
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(dashboardData.hr.total_employees)}
                  </Typography>
                  <Typography variant="caption">
                    Satisfaction: {dashboardData.hr.employee_satisfaction.toFixed(1)}%
                  </Typography>
                </Box>
                <Users color="action" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Card>
        <CardHeader title="Sales Performance" />
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#8884d8" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ERPDashboard;