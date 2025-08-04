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
  MenuItem
} from '@mui/material'
import {
  Add,
  Description,
  Folder,
  CloudUpload,
  Share,
  Download,
  Visibility,
  Edit,
  Delete,
  MoreVert,
  PictureAsPdf,
  Image,
  VideoFile,
  AudioFile,
  InsertDriveFile,
  Archive,
  Lock,
  LockOpen,
  Schedule,
  Person,
  TrendingUp,
  Storage,
  Security,
  Analytics,
  Search,
  FilterList,
  Sort,
  Star,
  StarBorder,
  History,
  Approval,
  Assignment
} from '@mui/icons-material'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { useRouter } from 'next/navigation'
import { DocumentApi } from '@/lib/api/document-api'

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
      id={`document-tabpanel-${index}`}
      aria-labelledby={`document-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function DocumentsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [workflows, setWorkflows] = useState<any[]>([])
  const [approvals, setApprovals] = useState<any[]>([])
  const [versions, setVersions] = useState<any[]>([])
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch dashboard data
      const dashboard = await DocumentApi.getDashboardData()
      setDashboardData(dashboard)
      
      // Fetch recent data
      const [
        documentsData,
        foldersData,
        workflowsData,
        approvalsData,
        versionsData
      ] = await Promise.all([
        DocumentApi.getDocuments({ limit: 10 }),
        DocumentApi.getFolders({ limit: 10 }),
        DocumentApi.getWorkflows({ limit: 10 }),
        DocumentApi.getApprovals({ limit: 10 }),
        DocumentApi.getVersionHistory({ limit: 10 })
      ])
      
      setDocuments(documentsData.data || [])
      setFolders(foldersData.data || [])
      setWorkflows(workflowsData.data || [])
      setApprovals(approvalsData.data || [])
      setVersions(versionsData.data || [])
      
    } catch (err) {
      console.error('Error fetching document data:', err)
      setError('Failed to load document data')
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    const type = fileType?.toLowerCase()
    if (type?.includes('pdf')) return <PictureAsPdf />
    if (type?.includes('image')) return <Image />
    if (type?.includes('video')) return <VideoFile />
    if (type?.includes('audio')) return <AudioFile />
    return <InsertDriveFile />
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': case 'published': case 'approved': return 'success'
      case 'draft': case 'pending': case 'under_review': return 'warning'
      case 'archived': case 'expired': return 'default'
      case 'rejected': case 'locked': return 'error'
      case 'in_progress': return 'info'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': case 'published': case 'approved': return <LockOpen />
      case 'draft': case 'pending': case 'under_review': return <Schedule />
      case 'archived': case 'expired': return <Archive />
      case 'rejected': case 'locked': return <Lock />
      case 'in_progress': return <Assignment />
      default: return <Description />
    }
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, document: any) => {
    setAnchorEl(event.currentTarget)
    setSelectedDocument(document)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedDocument(null)
  }

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Document Management</Typography>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading document data...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Document Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Organize, share, and manage documents with version control and workflows
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Folder />}
            onClick={() => router.push('/erp/documents/folders/new')}
          >
            New Folder
          </Button>
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => router.push('/erp/documents/upload')}
          >
            Upload Document
          </Button>
        </Box>
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
                      Total Documents
                    </Typography>
                    <Typography variant="h5">
                      {dashboardData.totalDocuments || 0}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <TrendingUp color="success" fontSize="small" />
                      <Typography variant="body2" color="success.main">
                        +{dashboardData.documentGrowth || 0}% this month
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: '#2196F3' }}>
                    <Description />
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
                      Storage Used
                    </Typography>
                    <Typography variant="h5">
                      {formatFileSize(dashboardData.storageUsed || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      of {formatFileSize(dashboardData.storageLimit || 0)}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#4CAF50' }}>
                    <Storage />
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
                      Pending Approvals
                    </Typography>
                    <Typography variant="h5">
                      {dashboardData.pendingApprovals || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dashboardData.overdueApprovals || 0} overdue
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#FF9800' }}>
                    <Approval />
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
                      Active Workflows
                    </Typography>
                    <Typography variant="h5">
                      {dashboardData.activeWorkflows || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dashboardData.totalWorkflows || 0} total workflows
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#9C27B0' }}>
                    <Assignment />
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
                    onClick={() => router.push('/erp/documents/upload')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#2196F3', mr: 1, width: 32, height: 32 }}>
                        <CloudUpload />
                      </Avatar>
                      <Typography variant="subtitle2">
                        Upload File
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Add new document
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
                    onClick={() => router.push('/erp/documents/workflows/new')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#9C27B0', mr: 1, width: 32, height: 32 }}>
                        <Assignment />
                      </Avatar>
                      <Typography variant="subtitle2">
                        Create Workflow
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Document workflow
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
                    onClick={() => router.push('/erp/documents/search')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#4CAF50', mr: 1, width: 32, height: 32 }}>
                        <Search />
                      </Avatar>
                      <Typography variant="subtitle2">
                        Search Docs
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Find documents
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
                    onClick={() => router.push('/erp/documents/reports')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#FF9800', mr: 1, width: 32, height: 32 }}>
                        <Analytics />
                      </Avatar>
                      <Typography variant="subtitle2">
                        Usage Reports
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Document analytics
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
                Recent Activity
              </Typography>
              <List>
                {versions.slice(0, 4).map((activity) => (
                  <ListItem key={activity.id}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                        <History />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={activity.documentName}
                      secondary={
                        <Box>
                          <Typography variant="body2">{activity.action}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            by {activity.userName} • {activity.createdAt ? new Date(activity.createdAt).toLocaleDateString() : ''}
                          </Typography>
                        </Box>
                      }
                    />
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
            <Tab label="Documents" />
            <Tab label="Folders" />
            <Tab label="Workflows" />
            <Tab label="Approvals" />
            <Tab label="Version History" />
          </Tabs>
        </Box>

        {/* Documents Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Recent Documents</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton size="small">
                <Search />
              </IconButton>
              <IconButton size="small">
                <FilterList />
              </IconButton>
              <IconButton size="small">
                <Sort />
              </IconButton>
              <Button
                variant="outlined"
                onClick={() => router.push('/erp/documents')}
              >
                View All
              </Button>
            </Box>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Modified</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                          {getFileIcon(doc.fileType)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">{doc.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {doc.description}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={doc.fileType} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {formatFileSize(doc.fileSize || 0)}
                    </TableCell>
                    <TableCell>{doc.ownerName}</TableCell>
                    <TableCell>
                      {doc.modifiedAt ? new Date(doc.modifiedAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={doc.status}
                        color={getStatusColor(doc.status)}
                        size="small"
                        icon={getStatusIcon(doc.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => router.push(`/erp/documents/${doc.id}`)}>
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" onClick={() => router.push(`/erp/documents/${doc.id}/download`)}>
                        <Download />
                      </IconButton>
                      <IconButton size="small" onClick={(e) => handleMenuClick(e, doc)}>
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Folders Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Folder Structure</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/documents/folders')}
            >
              Manage Folders
            </Button>
          </Box>
          <Grid container spacing={2}>
            {folders.map((folder) => (
              <Grid item xs={12} sm={6} md={4} key={folder.id}>
                <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ mr: 2, bgcolor: '#FFC107' }}>
                        <Folder />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">{folder.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {folder.description}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {folder.documentCount || 0} documents
                      </Typography>
                      <Box>
                        <IconButton size="small" onClick={() => router.push(`/erp/documents/folders/${folder.id}`)}>
                          <Visibility />
                        </IconButton>
                        <IconButton size="small" onClick={() => router.push(`/erp/documents/folders/${folder.id}/edit`)}>
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

        {/* Workflows Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Document Workflows</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/documents/workflows')}
            >
              View All
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Workflow</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Documents</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workflows.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{workflow.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {workflow.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={workflow.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{workflow.documentCount || 0}</TableCell>
                    <TableCell>
                      <Chip
                        label={workflow.status}
                        color={getStatusColor(workflow.status)}
                        size="small"
                        icon={getStatusIcon(workflow.status)}
                      />
                    </TableCell>
                    <TableCell>
                      {workflow.createdAt ? new Date(workflow.createdAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => router.push(`/erp/documents/workflows/${workflow.id}`)}>
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" onClick={() => router.push(`/erp/documents/workflows/${workflow.id}/edit`)}>
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Approvals Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Pending Approvals</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/documents/approvals')}
            >
              View All
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document</TableCell>
                  <TableCell>Requested By</TableCell>
                  <TableCell>Approver</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {approvals.map((approval) => (
                  <TableRow key={approval.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{approval.documentName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {approval.requestType}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{approval.requesterName}</TableCell>
                    <TableCell>{approval.approverName}</TableCell>
                    <TableCell>
                      <Chip label={approval.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {approval.dueDate ? new Date(approval.dueDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={approval.status}
                        color={getStatusColor(approval.status)}
                        size="small"
                        icon={getStatusIcon(approval.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => router.push(`/erp/documents/approvals/${approval.id}`)}>
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" onClick={() => router.push(`/erp/documents/approvals/${approval.id}/approve`)}>
                        <Approval />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Version History Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Recent Version Changes</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/documents/versions')}
            >
              View All
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document</TableCell>
                  <TableCell>Version</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Comments</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {versions.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{version.documentName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={`v${version.versionNumber}`} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{version.action}</TableCell>
                    <TableCell>{version.userName}</TableCell>
                    <TableCell>
                      {version.createdAt ? new Date(version.createdAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {version.comments}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => router.push(`/erp/documents/versions/${version.id}`)}>
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" onClick={() => router.push(`/erp/documents/versions/${version.id}/restore`)}>
                        <History />
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
        <MenuItem onClick={() => { router.push(`/erp/documents/${selectedDocument?.id}`); handleMenuClose(); }}>
          <Visibility sx={{ mr: 1 }} /> View
        </MenuItem>
        <MenuItem onClick={() => { router.push(`/erp/documents/${selectedDocument?.id}/edit`); handleMenuClose(); }}>
          <Edit sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => { router.push(`/erp/documents/${selectedDocument?.id}/share`); handleMenuClose(); }}>
          <Share sx={{ mr: 1 }} /> Share
        </MenuItem>
        <MenuItem onClick={() => { router.push(`/erp/documents/${selectedDocument?.id}/download`); handleMenuClose(); }}>
          <Download sx={{ mr: 1 }} /> Download
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
        onClick={() => router.push('/erp/documents/upload')}
      >
        <CloudUpload />
      </Fab>
    </Box>
  )
}