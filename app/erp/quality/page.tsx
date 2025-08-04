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
  CheckCircle,
  Error,
  Warning,
  TrendingUp,
  TrendingDown,
  Assignment,
  Science,
  Visibility,
  Edit,
  Delete,
  Assessment,
  VerifiedUser,
  BugReport,
  Timeline,
  Analytics,
  Settings,
  QrCode,
  Inventory,
  Schedule,
  PlayArrow,
  Pause,
  Stop
} from '@mui/icons-material'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { useRouter } from 'next/navigation'
import { QualityApi } from '@/lib/api/quality-api'

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
      id={`quality-tabpanel-${index}`}
      aria-labelledby={`quality-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function QualityPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [qualityChecks, setQualityChecks] = useState<any[]>([])
  const [inspections, setInspections] = useState<any[]>([])
  const [nonConformances, setNonConformances] = useState<any[]>([])
  const [auditReports, setAuditReports] = useState<any[]>([])
  const [correctives, setCorrectives] = useState<any[]>([])
  
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch dashboard data
      const dashboard = await QualityApi.getDashboardData()
      setDashboardData(dashboard)
      
      // Fetch recent data
      const [
        qualityChecksData,
        inspectionsData,
        nonConformancesData,
        auditReportsData,
        correctivesData
      ] = await Promise.all([
        QualityApi.getQualityChecks({ limit: 10 }),
        QualityApi.getInspections({ limit: 10 }),
        QualityApi.getNonConformances({ limit: 10 }),
        QualityApi.getAuditReports({ limit: 10 }),
        QualityApi.getCorrectiveActions({ limit: 10 })
      ])
      
      setQualityChecks(qualityChecksData.data || [])
      setInspections(inspectionsData.data || [])
      setNonConformances(nonConformancesData.data || [])
      setAuditReports(auditReportsData.data || [])
      setCorrectives(correctivesData.data || [])
      
    } catch (err) {
      console.error('Error fetching quality data:', err)
      setError('Failed to load quality data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'passed': case 'approved': case 'completed': return 'success'
      case 'failed': case 'rejected': case 'non_conforming': return 'error'
      case 'pending': case 'in_progress': case 'under_review': return 'warning'
      case 'cancelled': case 'closed': return 'default'
      case 'open': case 'active': return 'info'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'passed': case 'approved': case 'completed': return <CheckCircle />
      case 'failed': case 'rejected': case 'non_conforming': return <Error />
      case 'pending': case 'in_progress': case 'under_review': return <Warning />
      case 'cancelled': case 'closed': return <Stop />
      case 'open': case 'active': return <PlayArrow />
      default: return <Assignment />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': case 'high': return 'error'
      case 'medium': return 'warning'
      case 'low': return 'info'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Quality Management</Typography>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading quality data...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Quality Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage quality control, inspections, and compliance processes
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push('/erp/quality/checks/new')}
        >
          New Quality Check
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
                      Quality Rate
                    </Typography>
                    <Typography variant="h5">
                      {dashboardData.qualityRate || 0}%
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <TrendingUp color="success" fontSize="small" />
                      <Typography variant="body2" color="success.main">
                        +{dashboardData.qualityGrowth || 0}% this month
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: '#4CAF50' }}>
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
                      Active Inspections
                    </Typography>
                    <Typography variant="h5">
                      {dashboardData.activeInspections || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dashboardData.pendingInspections || 0} pending
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#2196F3' }}>
                    <Science />
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
                      Non-Conformances
                    </Typography>
                    <Typography variant="h5">
                      {dashboardData.openNonConformances || 0}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Error color="error" fontSize="small" />
                      <Typography variant="body2" color="error.main">
                        {dashboardData.criticalNCs || 0} critical
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: '#F44336' }}>
                    <BugReport />
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
                      Audit Score
                    </Typography>
                    <Typography variant="h5">
                      {dashboardData.auditScore || 0}/100
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Last audit: {dashboardData.lastAuditDate || 'N/A'}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#FF9800' }}>
                    <VerifiedUser />
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
                    onClick={() => router.push('/erp/quality/checks/new')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#4CAF50', mr: 1, width: 32, height: 32 }}>
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
                    onClick={() => router.push('/erp/quality/non-conformances/new')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#F44336', mr: 1, width: 32, height: 32 }}>
                        <BugReport />
                      </Avatar>
                      <Typography variant="subtitle2">
                        Report NC
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Non-conformance
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
                    onClick={() => router.push('/erp/quality/audits/new')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#FF9800', mr: 1, width: 32, height: 32 }}>
                        <VerifiedUser />
                      </Avatar>
                      <Typography variant="subtitle2">
                        Schedule Audit
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Quality audit
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
                    onClick={() => router.push('/erp/quality/reports')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#9C27B0', mr: 1, width: 32, height: 32 }}>
                        <Analytics />
                      </Avatar>
                      <Typography variant="subtitle2">
                        Quality Reports
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Analytics & trends
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
                Critical Non-Conformances
              </Typography>
              <List>
                {nonConformances.filter(nc => nc.severity === 'critical').slice(0, 4).map((nc) => (
                  <ListItem key={nc.id}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'error.main' }}>
                        <Error />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={nc.title}
                      secondary={
                        <Box>
                          <Typography variant="body2">{nc.productName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {nc.createdAt ? new Date(nc.createdAt).toLocaleDateString() : ''}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={nc.status}
                        color={getStatusColor(nc.status)}
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
            <Tab label="Quality Checks" />
            <Tab label="Inspections" />
            <Tab label="Non-Conformances" />
            <Tab label="Audit Reports" />
            <Tab label="Corrective Actions" />
          </Tabs>
        </Box>

        {/* Quality Checks Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Recent Quality Checks</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/quality/checks')}
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
                  <TableCell>Score</TableCell>
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
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                          <QrCode />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">{check.productName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Batch: {check.batchNumber}
                          </Typography>
                        </Box>
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
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CircularProgress
                          variant="determinate"
                          value={check.score || 0}
                          size={24}
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="body2">{check.score || 0}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {check.checkDate ? new Date(check.checkDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => router.push(`/erp/quality/checks/${check.id}`)}>
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" onClick={() => router.push(`/erp/quality/checks/${check.id}/edit`)}>
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Inspections Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Active Inspections</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/quality/inspections')}
            >
              View All
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Inspection ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Product/Process</TableCell>
                  <TableCell>Inspector</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inspections.map((inspection) => (
                  <TableRow key={inspection.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{inspection.inspectionNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={inspection.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">{inspection.subjectName}</Typography>
                    </TableCell>
                    <TableCell>{inspection.inspectorName}</TableCell>
                    <TableCell>
                      <Chip
                        label={inspection.status}
                        color={getStatusColor(inspection.status)}
                        size="small"
                        icon={getStatusIcon(inspection.status)}
                      />
                    </TableCell>
                    <TableCell>
                      {inspection.dueDate ? new Date(inspection.dueDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => router.push(`/erp/quality/inspections/${inspection.id}`)}>
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" onClick={() => router.push(`/erp/quality/inspections/${inspection.id}/edit`)}>
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Non-Conformances Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Open Non-Conformances</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/quality/non-conformances')}
            >
              View All
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>NC Number</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reporter</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {nonConformances.map((nc) => (
                  <TableRow key={nc.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{nc.ncNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">{nc.title}</Typography>
                    </TableCell>
                    <TableCell>{nc.productName}</TableCell>
                    <TableCell>
                      <Chip
                        label={nc.severity}
                        color={getSeverityColor(nc.severity)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={nc.status}
                        color={getStatusColor(nc.status)}
                        size="small"
                        icon={getStatusIcon(nc.status)}
                      />
                    </TableCell>
                    <TableCell>{nc.reporterName}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => router.push(`/erp/quality/non-conformances/${nc.id}`)}>
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" onClick={() => router.push(`/erp/quality/non-conformances/${nc.id}/edit`)}>
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Audit Reports Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Recent Audit Reports</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/quality/audits')}
            >
              View All
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Audit ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Scope</TableCell>
                  <TableCell>Auditor</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditReports.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{audit.auditNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={audit.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{audit.scope}</TableCell>
                    <TableCell>{audit.auditorName}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CircularProgress
                          variant="determinate"
                          value={audit.score || 0}
                          size={24}
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="body2">{audit.score || 0}/100</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={audit.status}
                        color={getStatusColor(audit.status)}
                        size="small"
                        icon={getStatusIcon(audit.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => router.push(`/erp/quality/audits/${audit.id}`)}>
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" onClick={() => router.push(`/erp/quality/audits/${audit.id}/edit`)}>
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Corrective Actions Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Active Corrective Actions</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/quality/corrective-actions')}
            >
              View All
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>CA Number</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Related NC</TableCell>
                  <TableCell>Assignee</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {correctives.map((ca) => (
                  <TableRow key={ca.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{ca.caNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">{ca.title}</Typography>
                    </TableCell>
                    <TableCell>{ca.relatedNCNumber}</TableCell>
                    <TableCell>{ca.assigneeName}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LinearProgress
                          variant="determinate"
                          value={ca.progress || 0}
                          sx={{ width: 60, mr: 1 }}
                        />
                        <Typography variant="body2">{ca.progress || 0}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {ca.dueDate ? new Date(ca.dueDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => router.push(`/erp/quality/corrective-actions/${ca.id}`)}>
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" onClick={() => router.push(`/erp/quality/corrective-actions/${ca.id}/edit`)}>
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

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => router.push('/erp/quality/checks/new')}
      >
        <Add />
      </Fab>
    </Box>
  )
}