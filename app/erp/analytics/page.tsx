'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Avatar,
  Chip,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fab,
  Badge,
  Divider,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TextField
} from '@mui/material'
import {
  Add,
  Analytics,
  Dashboard,
  TrendingUp,
  TrendingDown,
  Assessment,
  BarChart,
  PieChart,
  ShowChart,
  TableChart,
  Timeline,
  DateRange,
  FilterList,
  Download,
  Share,
  Refresh,
  Settings,
  Visibility,
  Edit,
  Delete,
  MoreVert,
  Schedule,
  NotificationsActive,
  Email,
  Print,
  CloudDownload,
  DataUsage,
  Speed,
  MonetizationOn,
  People,
  Inventory,
  ShoppingCart,
  AccountBalance,
  Business,
  InsertChart,
  DonutLarge,
  MultilineChart,
  ScatterPlot
} from '@mui/icons-material'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { useRouter } from 'next/navigation'
import { AnalyticsApi } from '@/lib/api/analytics-api'

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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [reports, setReports] = useState<any[]>([])
  const [dashboards, setDashboards] = useState<any[]>([])
  const [kpis, setKpis] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [schedules, setSchedules] = useState<any[]>([])
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [dateRange, setDateRange] = useState('30')
  
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()

  useEffect(() => {
    fetchAnalyticsData()
  }, [dateRange])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // Fetch analytics data
      const dashboard = await AnalyticsApi.getDashboardData({ dateRange })
      setDashboardData(dashboard)
      
      // Fetch recent data
      const [
        reportsData,
        dashboardsData,
        kpisData,
        alertsData,
        schedulesData
      ] = await Promise.all([
        AnalyticsApi.getReports({ limit: 10 }),
        AnalyticsApi.getDashboards({ limit: 10 }),
        AnalyticsApi.getKPIs({ limit: 10 }),
        AnalyticsApi.getAlerts({ limit: 10 }),
        AnalyticsApi.getSchedules({ limit: 10 })
      ])
      
      setReports(reportsData.data || [])
      setDashboards(dashboardsData.data || [])
      setKpis(kpisData.data || [])
      setAlerts(alertsData.data || [])
      setSchedules(schedulesData.data || [])
      
    } catch (err) {
      console.error('Error fetching analytics data:', err)
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getKPIColor = (trend: string) => {
    switch (trend?.toLowerCase()) {
      case 'up': case 'positive': case 'good': return 'success'
      case 'down': case 'negative': case 'poor': return 'error'
      case 'stable': case 'neutral': return 'warning'
      default: return 'default'
    }
  }

  const getKPIIcon = (trend: string) => {
    switch (trend?.toLowerCase()) {
      case 'up': case 'positive': case 'good': return <TrendingUp />
      case 'down': case 'negative': case 'poor': return <TrendingDown />
      case 'stable': case 'neutral': return <Timeline />
      default: return <Assessment />
    }
  }

  const getReportIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'chart': case 'line': return <ShowChart />
      case 'bar': return <BarChart />
      case 'pie': case 'donut': return <PieChart />
      case 'table': return <TableChart />
      case 'dashboard': return <Dashboard />
      default: return <Assessment />
    }
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, report: any) => {
    setAnchorEl(event.currentTarget)
    setSelectedReport(report)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedReport(null)
  }

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Business Intelligence & Analytics</Typography>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading analytics data...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Business Intelligence & Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive analytics, reporting, and business intelligence dashboard
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange}
              label="Date Range"
              onChange={(e) => setDateRange(e.target.value)}
            >
              <MenuItem value="7">Last 7 days</MenuItem>
              <MenuItem value="30">Last 30 days</MenuItem>
              <MenuItem value="90">Last 3 months</MenuItem>
              <MenuItem value="365">Last year</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={fetchAnalyticsData}>
            <Refresh />
          </IconButton>
          <Button
            variant="outlined"
            startIcon={<Dashboard />}
            onClick={() => router.push('/erp/analytics/dashboards/new')}
          >
            New Dashboard
          </Button>
          <Button
            variant="contained"
            startIcon={<Assessment />}
            onClick={() => router.push('/erp/analytics/reports/new')}
          >
            Create Report
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Key Metrics */}
      {dashboardData && (
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
                      {formatCurrency(dashboardData.totalRevenue || 0)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <TrendingUp color="success" fontSize="small" />
                      <Typography variant="body2" color="success.main">
                        {formatPercentage(dashboardData.revenueGrowth || 0)}
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: '#4CAF50' }}>
                    <MonetizationOn />
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
                      Active Users
                    </Typography>
                    <Typography variant="h5">
                      {dashboardData.activeUsers || 0}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <TrendingUp color="success" fontSize="small" />
                      <Typography variant="body2" color="success.main">
                        {formatPercentage(dashboardData.userGrowth || 0)}
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: '#2196F3' }}>
                    <People />
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
                      Data Processing
                    </Typography>
                    <Typography variant="h5">
                      {dashboardData.dataProcessed || 0}GB
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Speed color="info" fontSize="small" />
                      <Typography variant="body2" color="info.main">
                        {dashboardData.processingSpeed || 0}MB/s
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: '#FF9800' }}>
                    <DataUsage />
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
                      Active Reports
                    </Typography>
                    <Typography variant="h5">
                      {dashboardData.activeReports || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dashboardData.scheduledReports || 0} scheduled
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#9C27B0' }}>
                    <Assessment />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Quick Actions & Alerts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
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
                    onClick={() => router.push('/erp/analytics/reports/new')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#2196F3', mr: 1, width: 32, height: 32 }}>
                        <Assessment />
                      </Avatar>
                      <Typography variant="subtitle2">
                        New Report
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Create custom report
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
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
                    onClick={() => router.push('/erp/analytics/dashboards/new')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#4CAF50', mr: 1, width: 32, height: 32 }}>
                        <Dashboard />
                      </Avatar>
                      <Typography variant="subtitle2">
                        New Dashboard
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Build dashboard
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
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
                    onClick={() => router.push('/erp/analytics/kpis/new')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#FF9800', mr: 1, width: 32, height: 32 }}>
                        <Speed />
                      </Avatar>
                      <Typography variant="subtitle2">
                        Setup KPI
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Track metrics
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
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
                    onClick={() => router.push('/erp/analytics/alerts/new')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#F44336', mr: 1, width: 32, height: 32 }}>
                        <NotificationsActive />
                      </Avatar>
                      <Typography variant="subtitle2">
                        Create Alert
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Set up notifications
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Alerts
              </Typography>
              <List>
                {alerts.slice(0, 4).map((alert) => (
                  <ListItem key={alert.id}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getKPIColor(alert.severity), width: 32, height: 32 }}>
                        <NotificationsActive />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={alert.title}
                      secondary={
                        <Box>
                          <Typography variant="body2">{alert.message}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {alert.createdAt ? new Date(alert.createdAt).toLocaleDateString() : ''}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={alert.severity}
                        color={getKPIColor(alert.severity)}
                        size="small"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Reports" />
            <Tab label="Dashboards" />
            <Tab label="KPIs" />
            <Tab label="Alerts" />
            <Tab label="Schedules" />
          </Tabs>
        </Box>

        {/* Reports Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Recent Reports</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton size="small">
                <FilterList />
              </IconButton>
              <Button
                variant="outlined"
                onClick={() => router.push('/erp/analytics/reports')}
              >
                View All
              </Button>
            </Box>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Report</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Last Run</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                          {getReportIcon(report.type)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">{report.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {report.description}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={report.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{report.category}</TableCell>
                    <TableCell>
                      {report.lastRun ? new Date(report.lastRun).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.status}
                        color={getKPIColor(report.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => router.push(`/erp/analytics/reports/${report.id}`)}>
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" onClick={() => router.push(`/erp/analytics/reports/${report.id}/run`)}>
                        <Refresh />
                      </IconButton>
                      <IconButton size="small" onClick={(e) => handleMenuClick(e, report)}>
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Dashboards Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Analytics Dashboards</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/analytics/dashboards')}
            >
              View All
            </Button>
          </Box>
          <Grid container spacing={2}>
            {dashboards.map((dashboard) => (
              <Grid item xs={12} sm={6} md={4} key={dashboard.id}>
                <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ mr: 2, bgcolor: '#2196F3' }}>
                        <Dashboard />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">{dashboard.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {dashboard.description}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {dashboard.widgetCount || 0} widgets
                      </Typography>
                      <Box>
                        <IconButton size="small" onClick={() => router.push(`/erp/analytics/dashboards/${dashboard.id}`)}>
                          <Visibility />
                        </IconButton>
                        <IconButton size="small" onClick={() => router.push(`/erp/analytics/dashboards/${dashboard.id}/edit`)}>
                          <Edit />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* KPIs Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Key Performance Indicators</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/analytics/kpis')}
            >
              View All
            </Button>
          </Box>
          <Grid container spacing={2}>
            {kpis.map((kpi) => (
              <Grid item xs={12} sm={6} md={4} key={kpi.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">{kpi.name}</Typography>
                      <Avatar sx={{ bgcolor: getKPIColor(kpi.trend), width: 32, height: 32 }}>
                        {getKPIIcon(kpi.trend)}
                      </Avatar>
                    </Box>
                    <Typography variant="h4" gutterBottom>
                      {kpi.value}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Target: {kpi.target}
                      </Typography>
                      <Chip
                        label={formatPercentage(kpi.change || 0)}
                        color={getKPIColor(kpi.trend)}
                        size="small"
                        icon={getKPIIcon(kpi.trend)}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Alerts Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Alert Management</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/analytics/alerts')}
            >
              View All
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Alert</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Condition</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Last Triggered</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{alert.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {alert.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={alert.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{alert.condition}</TableCell>
                    <TableCell>
                      <Chip
                        label={alert.severity}
                        color={getKPIColor(alert.severity)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {alert.lastTriggered ? new Date(alert.lastTriggered).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={alert.status}
                        color={alert.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => router.push(`/erp/analytics/alerts/${alert.id}`)}>
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" onClick={() => router.push(`/erp/analytics/alerts/${alert.id}/edit`)}>
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Schedules Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Scheduled Reports</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/analytics/schedules')}
            >
              View All
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Schedule</TableCell>
                  <TableCell>Report</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Recipients</TableCell>
                  <TableCell>Next Run</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{schedule.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {schedule.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{schedule.reportName}</TableCell>
                    <TableCell>
                      <Chip label={schedule.frequency} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{schedule.recipientCount || 0} recipients</TableCell>
                    <TableCell>
                      {schedule.nextRun ? new Date(schedule.nextRun).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={schedule.status}
                        color={schedule.status === 'active' ? 'success' : 'default'}
                        size="small"
                        icon={<Schedule />}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => router.push(`/erp/analytics/schedules/${schedule.id}`)}>
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" onClick={() => router.push(`/erp/analytics/schedules/${schedule.id}/edit`)}>
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { router.push(`/erp/analytics/reports/${selectedReport?.id}`); handleMenuClose(); }}>
          <Visibility sx={{ mr: 1 }} /> View
        </MenuItem>
        <MenuItem onClick={() => { router.push(`/erp/analytics/reports/${selectedReport?.id}/edit`); handleMenuClose(); }}>
          <Edit sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => { router.push(`/erp/analytics/reports/${selectedReport?.id}/run`); handleMenuClose(); }}>
          <Refresh sx={{ mr: 1 }} /> Run Now
        </MenuItem>
        <MenuItem onClick={() => { router.push(`/erp/analytics/reports/${selectedReport?.id}/export`); handleMenuClose(); }}>
          <Download sx={{ mr: 1 }} /> Export
        </MenuItem>
        <MenuItem onClick={() => { router.push(`/erp/analytics/reports/${selectedReport?.id}/share`); handleMenuClose(); }}>
          <Share sx={{ mr: 1 }} /> Share
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { /* Handle delete */; handleMenuClose(); }}>
          <Delete sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => router.push('/erp/analytics/reports/new')}
      >
        <Add />
      </Fab>
    </Box>
  )
}