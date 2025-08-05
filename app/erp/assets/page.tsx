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
  Computer,
  Build,
  DirectionsCar,
  Home,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error,
  Schedule,
  Visibility,
  Edit,
  Delete,
  Assignment,
  Inventory,
  Analytics,
  Settings,
  QrCode,
  LocationOn,
  Person,
  CalendarToday,
  AttachMoney,
  Timeline,
  Engineering,
  Handyman
} from '@mui/icons-material'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { useRouter } from 'next/navigation'
import { AssetApi } from '@/lib/api/asset-api'

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
      id={`asset-tabpanel-${index}`}
      aria-labelledby={`asset-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function AssetsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [assets, setAssets] = useState<any[]>([])
  const [maintenance, setMaintenance] = useState<any[]>([])
  const [depreciation, setDepreciation] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [transfers, setTransfers] = useState<any[]>([])
  
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch dashboard data
      const dashboard = await AssetApi.getDashboardData()
      setDashboardData(dashboard)
      
      // Fetch recent data
      const [
        assetsData,
        maintenanceData,
        depreciationData,
        locationsData,
        transfersData
      ] = await Promise.all([
        AssetApi.getAssets({ limit: 10 }),
        AssetApi.getMaintenance({ limit: 10 }),
        AssetApi.getDepreciation({ limit: 10 }),
        AssetApi.getLocations({ limit: 10 }),
        AssetApi.getAssetTransfers({ limit: 10 })
      ])
      
      setAssets(assetsData.data || [])
      setMaintenance(maintenanceData.data || [])
      setDepreciation(depreciationData.data || [])
      setLocations(locationsData.data || [])
      setTransfers(transfersData.data || [])
      
    } catch (err) {
      console.error('Error fetching asset data:', err)
      setError('Failed to load asset data')
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
      case 'active': case 'operational': case 'available': return 'success'
      case 'maintenance': case 'under_repair': return 'warning'
      case 'retired': case 'disposed': case 'sold': return 'default'
      case 'damaged': case 'broken': return 'error'
      case 'pending': case 'scheduled': return 'info'
      case 'overdue': return 'error'
      case 'completed': return 'success'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': case 'operational': case 'available': return <CheckCircle />
      case 'maintenance': case 'under_repair': return <Build />
      case 'retired': case 'disposed': case 'sold': return <Assignment />
      case 'damaged': case 'broken': return <Error />
      case 'pending': case 'scheduled': return <Schedule />
      case 'overdue': return <Warning />
      case 'completed': return <CheckCircle />
      default: return <Assignment />
    }
  }

  const getAssetTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'computer': case 'laptop': case 'server': return <Computer />
      case 'vehicle': case 'car': case 'truck': return <DirectionsCar />
      case 'machinery': case 'equipment': return <Engineering />
      case 'furniture': case 'office': return <Home />
      case 'tools': return <Handyman />
      default: return <Inventory />
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case 'excellent': case 'new': return 'success'
      case 'good': return 'info'
      case 'fair': case 'average': return 'warning'
      case 'poor': case 'damaged': return 'error'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Asset Management</Typography>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading asset data...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Asset Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track and manage company assets, maintenance, and depreciation
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push('/erp/assets/new')}
        >
          Add Asset
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
                      Total Assets
                    </Typography>
                    <Typography variant="h5">
                      {dashboardData.totalAssets || 0}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <TrendingUp color="success" fontSize="small" />
                      <Typography variant="body2" color="success.main">
                        +{dashboardData.assetGrowth || 0}% this month
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: '#2196F3' }}>
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
                      Asset Value
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(dashboardData.totalValue || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Book value
                    </Typography>
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
                      Maintenance Due
                    </Typography>
                    <Typography variant="h5">
                      {dashboardData.maintenanceDue || 0}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Warning color="warning" fontSize="small" />
                      <Typography variant="body2" color="warning.main">
                        {dashboardData.overdueMaintenance || 0} overdue
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: '#FF9800' }}>
                    <Build />
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
                      Utilization Rate
                    </Typography>
                    <Typography variant="h5">
                      {dashboardData.utilizationRate || 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dashboardData.activeAssets || 0} active assets
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#9C27B0' }}>
                    <Timeline />
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
                    onClick={() => router.push('/erp/assets/new')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#2196F3', mr: 1, width: 32, height: 32 }}>
                        <Add />
                      </Avatar>
                      <Typography variant="subtitle2">
                        Add Asset
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Register new asset
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
                    onClick={() => router.push('/erp/assets/maintenance/schedule')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#FF9800', mr: 1, width: 32, height: 32 }}>
                        <Build />
                      </Avatar>
                      <Typography variant="subtitle2">
                        Schedule Maintenance
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Plan maintenance
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
                    onClick={() => router.push('/erp/assets/transfer')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#4CAF50', mr: 1, width: 32, height: 32 }}>
                        <LocationOn />
                      </Avatar>
                      <Typography variant="subtitle2">
                        Transfer Asset
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Change location
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
                    onClick={() => router.push('/erp/assets/reports')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#9C27B0', mr: 1, width: 32, height: 32 }}>
                        <Analytics />
                      </Avatar>
                      <Typography variant="subtitle2">
                        Asset Reports
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Analytics & insights
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
                Maintenance Alerts
              </Typography>
              <List>
                {maintenance.filter(m => m.status === 'overdue' || m.status === 'due_soon').slice(0, 4).map((item) => (
                  <ListItem key={item.id}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: item.status === 'overdue' ? 'error.main' : 'warning.main' }}>
                        {item.status === 'overdue' ? <Error /> : <Warning />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={item.assetName}
                      secondary={
                        <Box>
                          <Typography variant="body2">{item.maintenanceType}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : ''}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={item.status}
                        color={getStatusColor(item.status)}
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
            <Tab label="Assets" />
            <Tab label="Maintenance" />
            <Tab label="Depreciation" />
            <Tab label="Transfers" />
            <Tab label="Locations" />
          </Tabs>
        </Box>

        {/* Assets Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Asset Inventory</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/assets')}
            >
              View All
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Asset</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Condition</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                          {getAssetTypeIcon(asset.type)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">{asset.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {asset.assetTag}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={asset.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{asset.locationName}</TableCell>
                    <TableCell>
                      <Chip
                        label={asset.condition}
                        color={getConditionColor(asset.condition)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {formatCurrency(asset.currentValue || 0)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={asset.status}
                        color={getStatusColor(asset.status)}
                        size="small"
                        icon={getStatusIcon(asset.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => router.push(`/erp/assets/${asset.id}`)}>
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" onClick={() => router.push(`/erp/assets/${asset.id}/edit`)}>
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Maintenance Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Maintenance Schedule</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/assets/maintenance')}
            >
              View All
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Asset</TableCell>
                  <TableCell>Maintenance Type</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Cost</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {maintenance.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{item.assetName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.assetTag}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.maintenanceType} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{item.assignedTo}</TableCell>
                    <TableCell>
                      {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.status}
                        color={getStatusColor(item.status)}
                        size="small"
                        icon={getStatusIcon(item.status)}
                      />
                    </TableCell>
                    <TableCell>
                      {item.estimatedCost ? formatCurrency(item.estimatedCost) : '-'}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => router.push(`/erp/assets/maintenance/${item.id}`)}>
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" onClick={() => router.push(`/erp/assets/maintenance/${item.id}/edit`)}>
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Depreciation Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Depreciation Records</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/assets/depreciation')}
            >
              View All
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Asset</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Original Value</TableCell>
                  <TableCell>Current Value</TableCell>
                  <TableCell>Annual Rate</TableCell>
                  <TableCell>Remaining Life</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {depreciation.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{record.assetName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {record.assetTag}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={record.method} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {formatCurrency(record.originalValue || 0)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(record.currentValue || 0)}
                    </TableCell>
                    <TableCell>{record.annualRate || 0}%</TableCell>
                    <TableCell>
                      {record.remainingLife || 0} years
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => router.push(`/erp/assets/depreciation/${record.id}`)}>
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Transfers Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Recent Transfers</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/assets/transfers')}
            >
              View All
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Asset</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Transferred By</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{transfer.assetName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {transfer.assetTag}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{transfer.fromLocation}</TableCell>
                    <TableCell>{transfer.toLocation}</TableCell>
                    <TableCell>{transfer.transferredBy}</TableCell>
                    <TableCell>
                      {transfer.transferDate ? new Date(transfer.transferDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transfer.status}
                        color={getStatusColor(transfer.status)}
                        size="small"
                        icon={getStatusIcon(transfer.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => router.push(`/erp/assets/transfers/${transfer.id}`)}>
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Locations Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Asset Locations</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/assets/locations')}
            >
              Manage Locations
            </Button>
          </Box>
          <Grid container spacing={2}>
            {locations.map((location) => (
              <Grid item xs={12} sm={6} md={4} key={location.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ mr: 2, bgcolor: '#2196F3' }}>
                        <LocationOn />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">{location.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {location.type}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {location.address}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {location.assetCount || 0} assets
                      </Typography>
                      <Box>
                        <IconButton size="small" onClick={() => router.push(`/erp/assets/locations/${location.id}`)}>
                          <Visibility />
                        </IconButton>
                        <IconButton size="small" onClick={() => router.push(`/erp/assets/locations/${location.id}/edit`)}>
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
      </Card>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => router.push('/erp/assets/new')}
      >
        <Add />
      </Fab>
    </Box>
  )
}