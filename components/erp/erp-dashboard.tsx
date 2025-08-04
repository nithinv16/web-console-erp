'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Activity,
  AlertCircle,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Package,
  Settings,
  ShoppingCart,
  TrendingUp,
  Users,
  Zap,
  Bell,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { MainERPApi, ERPDashboardData, ERPSystemHealth } from '@/lib/api/main-erp-api';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';

interface ERPDashboardProps {
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const moduleIcons = {
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
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

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

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (value < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading ERP Dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2" 
            onClick={handleRefresh}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!dashboardData || !systemHealth) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No dashboard data available.
        </AlertDescription>
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

  const moduleUsageData = systemHealth.modules.map(module => ({
    name: module.module,
    usage: Math.floor(Math.random() * 100),
    status: module.status
  }));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ERP Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive overview of your business operations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>System Health</span>
            <Badge variant={getStatusBadgeVariant(systemHealth.overall_status)}>
              {systemHealth.overall_status.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{systemHealth.active_users}</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{systemHealth.api_response_time}ms</div>
              <div className="text-sm text-muted-foreground">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{systemHealth.system_load.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">System Load</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {systemHealth.database_status === 'connected' ? '✓' : '✗'}
              </div>
              <div className="text-sm text-muted-foreground">Database</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardData.sales.total_revenue)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(dashboardData.sales.monthly_growth)}
              <span className="ml-1">
                {formatPercentage(dashboardData.sales.monthly_growth)} from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Opportunities</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(dashboardData.sales.active_opportunities)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>Conversion rate: {dashboardData.sales.conversion_rate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardData.financial.net_profit)}
            </div>
            <div className="text-xs text-muted-foreground">
              Cash flow: {formatCurrency(dashboardData.financial.cash_flow)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(dashboardData.hr.total_employees)}
            </div>
            <div className="text-xs text-muted-foreground">
              Satisfaction: {dashboardData.hr.employee_satisfaction.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue and order volume</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(value as number) : value,
                        name === 'revenue' ? 'Revenue' : 'Orders'
                      ]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Operations Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Operations Performance</CardTitle>
                <CardDescription>Key operational indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Production Efficiency</span>
                    <span>{dashboardData.operations.production_efficiency.toFixed(1)}%</span>
                  </div>
                  <Progress value={dashboardData.operations.production_efficiency} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Quality Score</span>
                    <span>{dashboardData.operations.quality_score.toFixed(1)}%</span>
                  </div>
                  <Progress value={dashboardData.operations.quality_score} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>On-Time Delivery</span>
                    <span>{dashboardData.operations.on_time_delivery.toFixed(1)}%</span>
                  </div>
                  <Progress value={dashboardData.operations.on_time_delivery} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Inventory Turnover</span>
                    <span>{dashboardData.operations.inventory_turnover.toFixed(1)}x</span>
                  </div>
                  <Progress value={Math.min(dashboardData.operations.inventory_turnover * 10, 100)} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Performance</CardTitle>
              </CardHeader>
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

            <Card>
              <CardHeader>
                <CardTitle>Order Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Total Assets</span>
                  <span className="font-medium">
                    {formatCurrency(dashboardData.financial.total_assets)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Liabilities</span>
                  <span className="font-medium">
                    {formatCurrency(dashboardData.financial.total_liabilities)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Net Worth</span>
                  <span className="font-medium">
                    {formatCurrency(dashboardData.financial.total_assets - dashboardData.financial.total_liabilities)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>HR Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Total Employees</span>
                  <span className="font-medium">{dashboardData.hr.total_employees}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Turnover Rate</span>
                  <span className="font-medium">{dashboardData.hr.turnover_rate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Training Completion</span>
                  <span className="font-medium">{dashboardData.hr.training_completion.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {dashboardData.alerts.map((alert) => (
                      <Alert key={alert.id} variant={alert.type === 'error' ? 'destructive' : 'default'}>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          <div className="font-medium">{alert.message}</div>
                          <div className="text-muted-foreground">
                            {alert.module} • {formatDate(alert.timestamp)}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemHealth.modules.map((module) => {
              const IconComponent = moduleIcons[module.module.toLowerCase().replace(' ', '_')] || Settings;
              return (
                <Card key={module.module}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center space-x-2">
                      <IconComponent className="h-4 w-4" />
                      <span>{module.module}</span>
                    </CardTitle>
                    <Badge variant={getStatusBadgeVariant(module.status)}>
                      {module.status}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground">
                      Version: {module.version}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Updated: {formatDate(module.last_updated)}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest system activities and user actions</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {dashboardData.recent_activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                      <div className="flex-shrink-0">
                        <Activity className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{activity.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {activity.user} • {activity.type} • {formatDate(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ERPDashboard;