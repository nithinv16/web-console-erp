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
  CircularProgress
} from '@mui/material'
import {
  Add,
  TrendingUp,
  TrendingDown,
  Factory,
  Assignment,
  Schedule,
  CheckCircle,
  Warning,
  Error,
  PlayArrow,
  Pause,
  Stop,
  Edit,
  Visibility,
  Build,
  Inventory,
  Timeline,
  Speed,
  Engineering,
  QrCode,
  Analytics,
  Settings
} from '@mui/icons-material'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { useRouter } from 'next/navigation'
import { ManufacturingApi } from '@/lib/api/manufacturing-api'

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
      id={`manufacturing-tabpanel-${index}`}
      aria-labelledby={`manufacturing-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function ManufacturingPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [productionOrders, setProductionOrders] = useState<any[]>([])
  const [workOrders, setWorkOrders] = useState<any[]>([])
  const [boms, setBoms] = useState<any[]>([])
  const [workCenters, setWorkCenters] = useState<any[]>([])
  const [qualityChecks, setQualityChecks] = useState<any[]>([])
  
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Manufacturing API is currently disabled, using fallback data
      try {
        const dashboard = await ManufacturingApi.getDashboardData()
        setDashboardData(dashboard)
      } catch (err) {
        // Manufacturing API disabled, use fallback data
        setDashboardData({
          activeOrders: 0,
          orderGrowth: 0,
          efficiency: 0,
          qualityRate: 0,
          passedChecks: 0,
          activeWorkCenters: 0,
          totalWorkCenters: 0
        })
      }
      
      // Set empty arrays for disabled manufacturing features
      setProductionOrders([])
      setWorkOrders([])
      setBoms([])
      setWorkCenters([])
      setQualityChecks([])
      
    } catch (err) {
      console.error('Error fetching manufacturing data:', err)
      setError('Failed to load manufacturing data')
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'planned': return 'info'
      case 'in_progress': case 'running': return 'warning'
      case 'completed': case 'finished': return 'success'
      case 'cancelled': case 'stopped': return 'error'
      case 'on_hold': case 'paused': return 'default'
      case 'passed': return 'success'
      case 'failed': return 'error'
      case 'pending': return 'warning'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'planned': return <Schedule />
      case 'in_progress': case 'running': return <PlayArrow />
      case 'completed': case 'finished': return <CheckCircle />
      case 'cancelled': case 'stopped': return <Stop />
      case 'on_hold': case 'paused': return <Pause />
      case 'passed': return <CheckCircle />
      case 'failed': return <Error />
      case 'pending': return <Warning />
      default: return <Assignment />
    }
  }

  const getWorkCenterIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'assembly': return <Build />
      case 'machining': return <Engineering />
      case 'quality': return <CheckCircle />
      case 'packaging': return <Inventory />
      default: return <Factory />
    }
  }

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Manufacturing Management</Typography>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading manufacturing data...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Manufacturing Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage production orders, work centers, and manufacturing operations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push('/erp/manufacturing/production-orders/new')}
        >
          New Production Order
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Dashboard Cards */}
      {dashboardData && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Active Orders
                    </Typography>
                    <Typography variant="h5">
                      {dashboardData.activeOrders || 0}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <TrendingUp color="success" fontSize="small" />
                      <Typography variant="body2" color="success.main">
                        +{dashboardData.orderGrowth || 0}% this month
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: '#2196F3' }}>
                    <Assignment />
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
                      Production Efficiency
                    </Typography>
                    <Typography variant="h5">
                      {dashboardData.efficiency || 0}%
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Speed color="info" fontSize="small" />
                      <Typography variant="body2" color="info.main">
                        Target: 85%
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: '#4CAF50' }}>
                    <Speed />
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
                      Quality Rate
                    </Typography>
                    <Typography variant="h5">
                      {dashboardData.qualityRate || 0}%
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <CheckCircle color="success" fontSize="small" />
                      <Typography variant="body2" color="success.main">
                        {dashboardData.passedChecks || 0} passed today
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: '#FF9800' }}>
                    <CheckCircle />
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
                      Work Centers
                    </Typography>
                    <Typography variant="h5">
                      {dashboardData.activeWorkCenters || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dashboardData.totalWorkCenters || 0} total centers
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#9C27B0' }}>
                    <Factory />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Quick Actions */}
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
                    onClick={() => router.push('/erp/manufacturing/production-orders/new')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#2196F3', mr: 1, width: 32, height: 32 }}>
                        <Assignment />
                      </Avatar>
                      <Typography variant="subtitle2">
                        New Order
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Create production order
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
                    onClick={() => router.push('/erp/manufacturing/bom/new')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#4CAF50', mr: 1, width: 32, height: 32 }}>
                        <Engineering />
                      </Avatar>
                      <Typography variant="subtitle2">
                        Create BOM
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Bill of materials
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
                    onClick={() => router.push('/erp/manufacturing/quality/check')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#FF9800', mr: 1, width: 32, height: 32 }}>
                        <CheckCircle />
                      </Avatar>
                      <Typography variant="subtitle2">
                        Quality Check
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Perform inspection
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
                    onClick={() => router.push('/erp/manufacturing/reports')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#9C27B0', mr: 1, width: 32, height: 32 }}>
                        <Analytics />
                      </Avatar>
                      <Typography variant="subtitle2">
                        Reports
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Production analytics
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
                Work Center Status
              </Typography>
              <List>
                {workCenters.slice(0, 4).map((center) => (
                  <ListItem key={center.id}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getStatusColor(center.status) }}>
                        {getWorkCenterIcon(center.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={center.name}
                      secondary={
                        <Box>
                          <Typography variant="body2">{center.type}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <CircularProgress
                              variant="determinate"
                              value={center.utilization || 0}
                              size={16}
                              sx={{ mr: 1 }}
                            />
                            <Typography variant="caption">
                              {center.utilization || 0}% utilization
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={center.status}
                        color={getStatusColor(center.status)}
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
            <Tab label="Production Orders" />
            <Tab label="Work Orders" />
            <Tab label="Bill of Materials" />
            <Tab label="Quality Checks" />
          </Tabs>
        </Box>

        {/* Production Orders Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Recent Production Orders</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/manufacturing/production-orders')}
            >
              View All
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order Number</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {productionOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{order.orderNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                          <QrCode />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">{order.productName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {order.productCode}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {order.quantityProduced || 0} / {order.quantityPlanned || 0}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        color={getStatusColor(order.status)}
                        size="small"
                        icon={getStatusIcon(order.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LinearProgress
                          variant="determinate"
                          value={order.progress || 0}
                          sx={{ width: 60, mr: 1 }}
                        />
                        <Typography variant="body2">{order.progress || 0}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {order.dueDate ? new Date(order.dueDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => router.push(`/erp/manufacturing/production-orders/${order.id}`)}>
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" onClick={() => router.push(`/erp/manufacturing/production-orders/${order.id}/edit`)}>
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Work Orders Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Active Work Orders</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/manufacturing/work-orders')}
            >
              View All
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Work Order</TableCell>
                  <TableCell>Operation</TableCell>
                  <TableCell>Work Center</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workOrders.map((workOrder) => (
                  <TableRow key={workOrder.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{workOrder.workOrderNumber}</Typography>
                    </TableCell>
                    <TableCell>{workOrder.operationName}</TableCell>
                    <TableCell>{workOrder.workCenterName}</TableCell>
                    <TableCell>
                      <Chip
                        label={workOrder.status}
                        color={getStatusColor(workOrder.status)}
                        size="small"
                        icon={getStatusIcon(workOrder.status)}
                      />
                    </TableCell>
                    <TableCell>
                      {workOrder.actualDuration || workOrder.plannedDuration || 0} hrs
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => router.push(`/erp/manufacturing/work-orders/${workOrder.id}`)}>
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" onClick={() => router.push(`/erp/manufacturing/work-orders/${workOrder.id}/edit`)}>
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Bill of Materials Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Bill of Materials</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/manufacturing/bom')}
            >
              View All
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>BOM Code</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Version</TableCell>
                  <TableCell>Components</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {boms.map((bom) => (
                  <TableRow key={bom.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{bom.bomCode}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{bom.productName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {bom.productCode}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{bom.version}</TableCell>
                    <TableCell>{bom.componentCount || 0} items</TableCell>
                    <TableCell>
                      <Chip
                        label={bom.status}
                        color={getStatusColor(bom.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => router.push(`/erp/manufacturing/bom/${bom.id}`)}>
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" onClick={() => router.push(`/erp/manufacturing/bom/${bom.id}/edit`)}>
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Quality Checks Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Recent Quality Checks</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/manufacturing/quality')}
            >
              View All
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Check ID</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Inspector</TableCell>
                  <TableCell>Result</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {qualityChecks.map((check) => (
                  <TableRow key={check.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{check.checkNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{check.productName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Batch: {check.batchNumber}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{check.inspectorName}</TableCell>
                    <TableCell>
                      <Chip
                        label={check.result}
                        color={getStatusColor(check.result)}
                        size="small"
                        icon={getStatusIcon(check.result)}
                      />
                    </TableCell>
                    <TableCell>
                      {check.checkDate ? new Date(check.checkDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => router.push(`/erp/manufacturing/quality/${check.id}`)}>
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Card>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => router.push('/erp/manufacturing/production-orders/new')}
      >
        <Add />
      </Fab>
    </Box>
  )
}