
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
  Fab
} from '@mui/material'
import {
  People,
  PersonAdd,
  TrendingUp,
  TrendingDown,
  Phone,
  Email,
  Business,
  LocationOn,
  Add,
  Edit,
  Visibility,
  Star,
  StarBorder,
  AttachMoney,
  Assignment,
  Schedule,
  CheckCircle
} from '@mui/icons-material'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { useRouter } from 'next/navigation'
import { CRMApi } from '@/lib/api/crm-api'

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
      id={`crm-tabpanel-${index}`}
      aria-labelledby={`crm-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function CRMPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Get company_id - first check if company exists, if not use default
      const { data: companies, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .limit(1)
        .single()
      
      const companyId = companies?.id || '1'
      
      // Fetch dashboard data
      const dashboard = await CRMApi.getDashboardData(companyId)
      setDashboardData(dashboard)
      
      // Fetch recent data
      const [customersData, leadsData, opportunitiesData, activitiesData] = await Promise.all([
        CRMApi.getCustomers(companyId, {}),
        CRMApi.getLeads(companyId, {}),
        CRMApi.getOpportunities(companyId, {}),
        CRMApi.getActivities(companyId, {})
      ])
      
      setCustomers(customersData?.data || [])
      setLeads(leadsData || [])
      setOpportunities(opportunitiesData || [])
      setActivities(activitiesData || [])
      
    } catch (err) {
      console.error('Error fetching CRM data:', err)
      setError('Failed to load CRM data')
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
      case 'hot': return 'error'
      case 'warm': return 'warning'
      case 'cold': return 'info'
      case 'won': return 'success'
      case 'lost': return 'error'
      case 'active': return 'success'
      case 'inactive': return 'default'
      default: return 'default'
    }
  }

  const getLeadIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'hot': return <Star color="error" />
      case 'warm': return <Star color="warning" />
      case 'cold': return <StarBorder color="info" />
      default: return <StarBorder />
    }
  }

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Customer Relationship Management</Typography>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading CRM data...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Customer Relationship Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage customers, leads, and sales opportunities
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => router.push('/erp/crm/customers/new')}
        >
          Add Customer
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
                      Total Customers
                    </Typography>
                    <Typography variant="h5">
                      {dashboardData.totalCustomers || 0}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <TrendingUp color="success" fontSize="small" />
                      <Typography variant="body2" color="success.main">
                        +{dashboardData.customerGrowth || 0}% this month
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
                      Active Leads
                    </Typography>
                    <Typography variant="h5">
                      {dashboardData.activeLeads || 0}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Star color="warning" fontSize="small" />
                      <Typography variant="body2" color="warning.main">
                        {dashboardData.hotLeads || 0} hot leads
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: '#FF9800' }}>
                    <Star />
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
                      Opportunities
                    </Typography>
                    <Typography variant="h5">
                      {dashboardData.totalOpportunities || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatCurrency(dashboardData.opportunityValue || 0)}
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
                      Conversion Rate
                    </Typography>
                    <Typography variant="h5">
                      {dashboardData.conversionRate || 0}%
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <TrendingUp color="success" fontSize="small" />
                      <Typography variant="body2" color="success.main">
                        +{dashboardData.conversionGrowth || 0}%
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: '#9C27B0' }}>
                    <CheckCircle />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Customers" />
            <Tab label="Leads" />
            <Tab label="Opportunities" />
            <Tab label="Activities" />
          </Tabs>
        </Box>

        {/* Customers Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Recent Customers</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/crm/customers')}
            >
              View All
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Total Orders</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2 }}>
                          {customer.name?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">{customer.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {customer.company}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{customer.email}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {customer.phone}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={customer.status}
                        color={getStatusColor(customer.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{customer.totalOrders || 0}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => router.push(`/erp/crm/customers/${customer.id}`)}>
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" onClick={() => router.push(`/erp/crm/customers/${customer.id}/edit`)}>
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Leads Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Active Leads</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/crm/leads')}
            >
              View All
            </Button>
          </Box>
          <List>
            {leads.map((lead) => (
              <ListItem key={lead.id}>
                <ListItemAvatar>
                  <Avatar>
                    {getLeadIcon(lead.status)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={lead.name}
                  secondary={
                    <Box>
                      <Typography variant="body2">{lead.company}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {lead.source} • {new Date(lead.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Chip
                    label={lead.status}
                    color={getStatusColor(lead.status)}
                    size="small"
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </TabPanel>

        {/* Opportunities Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Sales Opportunities</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/crm/opportunities')}
            >
              View All
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Opportunity</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Stage</TableCell>
                  <TableCell>Close Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {opportunities.map((opportunity) => (
                  <TableRow key={opportunity.id}>
                    <TableCell>{opportunity.name}</TableCell>
                    <TableCell>{opportunity.customerName}</TableCell>
                    <TableCell>{formatCurrency(opportunity.value || 0)}</TableCell>
                    <TableCell>
                      <Chip
                        label={opportunity.stage}
                        color={getStatusColor(opportunity.stage)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {opportunity.expectedCloseDate ? 
                        new Date(opportunity.expectedCloseDate).toLocaleDateString() : 
                        'Not set'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Activities Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Recent Activities</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/crm/activities')}
            >
              View All
            </Button>
          </Box>
          <List>
            {activities.map((activity) => (
              <ListItem key={activity.id}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: getStatusColor(activity.type) }}>
                    {activity.type === 'call' ? <Phone /> : 
                     activity.type === 'email' ? <Email /> : 
                     activity.type === 'meeting' ? <Business /> : <Assignment />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={activity.subject}
                  secondary={
                    <Box>
                      <Typography variant="body2">{activity.description}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.customerName} • {new Date(activity.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </TabPanel>
      </Card>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => router.push('/erp/crm/leads/new')}
      >
        <Add />
      </Fab>
    </Box>
  )
}