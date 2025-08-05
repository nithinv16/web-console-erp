'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  TextField,
  Divider,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tab,
  Tabs
} from '@mui/material'
import {
  Settings,
  Business,
  Security,
  Notifications,
  Language,
  Palette,
  Storage,
  CloudSync,
  Edit,
  Delete,
  Add,
  Save,
  Refresh,
  Download,
  Upload,
  Backup,
  RestoreFromTrash,
  VpnKey,
  Group,
  AdminPanelSettings
} from '@mui/icons-material'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  }
}

interface CompanySettings {
  name: string
  address: string
  phone: string
  email: string
  website: string
  tax_id: string
  currency: string
  timezone: string
  fiscal_year_start: string
}

interface UserRole {
  id: string
  name: string
  description: string
  permissions: string[]
  users_count: number
}

const mockCompanySettings: CompanySettings = {
  name: 'TechCorp Solutions Pvt Ltd',
  address: '123 Business Park, Sector 18, Gurgaon, Haryana 122015',
  phone: '+91-124-4567890',
  email: 'info@techcorp.com',
  website: 'https://www.techcorp.com',
  tax_id: 'GSTIN123456789',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  fiscal_year_start: 'April'
}

const mockUserRoles: UserRole[] = [
  {
    id: '1',
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    permissions: ['all'],
    users_count: 2
  },
  {
    id: '2',
    name: 'Manager',
    description: 'Department management and reporting access',
    permissions: ['read', 'write', 'approve'],
    users_count: 8
  },
  {
    id: '3',
    name: 'Employee',
    description: 'Basic access to assigned modules',
    permissions: ['read', 'write'],
    users_count: 45
  },
  {
    id: '4',
    name: 'Accountant',
    description: 'Financial modules access',
    permissions: ['accounting_read', 'accounting_write'],
    users_count: 3
  },
  {
    id: '5',
    name: 'HR Specialist',
    description: 'Human resources management access',
    permissions: ['hr_read', 'hr_write', 'payroll'],
    users_count: 2
  }
]

export default function SettingsPage() {
  const [tabValue, setTabValue] = useState(0)
  const [companySettings, setCompanySettings] = useState<CompanySettings>(mockCompanySettings)
  const [userRoles, setUserRoles] = useState<UserRole[]>(mockUserRoles)
  const [loading, setLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  // System preferences
  const [darkMode, setDarkMode] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [autoBackup, setAutoBackup] = useState(true)
  const [twoFactorAuth, setTwoFactorAuth] = useState(false)
  
  // Dialog states
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<UserRole | null>(null)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleSaveCompanySettings = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaveSuccess(true)
    setLoading(false)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handleBackupData = () => {
    // Simulate backup process
    console.log('Starting data backup...')
  }

  const handleRestoreData = () => {
    // Simulate restore process
    console.log('Starting data restore...')
  }

  const handleExportSettings = () => {
    // Simulate settings export
    const settingsData = {
      company: companySettings,
      preferences: {
        darkMode,
        emailNotifications,
        pushNotifications,
        autoBackup,
        twoFactorAuth
      }
    }
    const blob = new Blob([JSON.stringify(settingsData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'erp-settings.json'
    a.click()
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          System Settings
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportSettings}
          >
            Export Settings
          </Button>
          <Button
            variant="outlined"
            startIcon={<Backup />}
            onClick={handleBackupData}
          >
            Backup Data
          </Button>
        </Box>
      </Box>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
            <Tab icon={<Business />} label="Company" {...a11yProps(0)} />
            <Tab icon={<AdminPanelSettings />} label="User Roles" {...a11yProps(1)} />
            <Tab icon={<Security />} label="Security" {...a11yProps(2)} />
            <Tab icon={<Notifications />} label="Notifications" {...a11yProps(3)} />
            <Tab icon={<Palette />} label="Appearance" {...a11yProps(4)} />
            <Tab icon={<Storage />} label="Data Management" {...a11yProps(5)} />
          </Tabs>
        </Box>

        {/* Company Settings Tab */}
        <CustomTabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Company Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Name"
                value={companySettings.name}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tax ID / GSTIN"
                value={companySettings.tax_id}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, tax_id: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={3}
                value={companySettings.address}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, address: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={companySettings.phone}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, phone: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={companySettings.email}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Website"
                value={companySettings.website}
                onChange={(e) => setCompanySettings(prev => ({ ...prev, website: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={companySettings.currency}
                  label="Currency"
                  onChange={(e) => setCompanySettings(prev => ({ ...prev, currency: e.target.value }))}
                >
                  <MenuItem value="INR">Indian Rupee (INR)</MenuItem>
                  <MenuItem value="USD">US Dollar (USD)</MenuItem>
                  <MenuItem value="EUR">Euro (EUR)</MenuItem>
                  <MenuItem value="GBP">British Pound (GBP)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Timezone</InputLabel>
                <Select
                  value={companySettings.timezone}
                  label="Timezone"
                  onChange={(e) => setCompanySettings(prev => ({ ...prev, timezone: e.target.value }))}
                >
                  <MenuItem value="Asia/Kolkata">Asia/Kolkata (IST)</MenuItem>
                  <MenuItem value="America/New_York">America/New_York (EST)</MenuItem>
                  <MenuItem value="Europe/London">Europe/London (GMT)</MenuItem>
                  <MenuItem value="Asia/Tokyo">Asia/Tokyo (JST)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Fiscal Year Start</InputLabel>
                <Select
                  value={companySettings.fiscal_year_start}
                  label="Fiscal Year Start"
                  onChange={(e) => setCompanySettings(prev => ({ ...prev, fiscal_year_start: e.target.value }))}
                >
                  <MenuItem value="January">January</MenuItem>
                  <MenuItem value="April">April</MenuItem>
                  <MenuItem value="July">July</MenuItem>
                  <MenuItem value="October">October</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSaveCompanySettings}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </CustomTabPanel>

        {/* User Roles Tab */}
        <CustomTabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              User Roles & Permissions
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setRoleDialogOpen(true)}
            >
              Add Role
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {userRoles.map((role) => (
              <Grid item xs={12} md={6} key={role.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {role.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          {role.description}
                        </Typography>
                        <Typography variant="caption" color="primary">
                          {role.users_count} users assigned
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton size="small" onClick={() => setEditingRole(role)}>
                          <Edit />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {role.permissions.map((permission) => (
                        <Chip
                          key={permission}
                          label={permission}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CustomTabPanel>

        {/* Security Tab */}
        <CustomTabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Security Settings
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Two-Factor Authentication"
                secondary="Add an extra layer of security to your account"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={twoFactorAuth}
                  onChange={(e) => setTwoFactorAuth(e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Session Timeout"
                secondary="Automatically log out inactive users"
              />
              <ListItemSecondaryAction>
                <FormControl size="small">
                  <Select value="30" displayEmpty>
                    <MenuItem value="15">15 minutes</MenuItem>
                    <MenuItem value="30">30 minutes</MenuItem>
                    <MenuItem value="60">1 hour</MenuItem>
                    <MenuItem value="120">2 hours</MenuItem>
                  </Select>
                </FormControl>
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Password Policy"
                secondary="Enforce strong password requirements"
              />
              <ListItemSecondaryAction>
                <Button variant="outlined" size="small">
                  Configure
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CustomTabPanel>

        {/* Notifications Tab */}
        <CustomTabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Notification Preferences
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Email Notifications"
                secondary="Receive notifications via email"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Push Notifications"
                secondary="Receive browser push notifications"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={pushNotifications}
                  onChange={(e) => setPushNotifications(e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="System Alerts"
                secondary="Get notified about system maintenance and updates"
              />
              <ListItemSecondaryAction>
                <Switch defaultChecked />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CustomTabPanel>

        {/* Appearance Tab */}
        <CustomTabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            Appearance Settings
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Dark Mode"
                secondary="Switch to dark theme"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Language"
                secondary="Select your preferred language"
              />
              <ListItemSecondaryAction>
                <FormControl size="small">
                  <Select value="en" displayEmpty>
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="hi">Hindi</MenuItem>
                    <MenuItem value="es">Spanish</MenuItem>
                    <MenuItem value="fr">French</MenuItem>
                  </Select>
                </FormControl>
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Date Format"
                secondary="Choose how dates are displayed"
              />
              <ListItemSecondaryAction>
                <FormControl size="small">
                  <Select value="dd/mm/yyyy" displayEmpty>
                    <MenuItem value="dd/mm/yyyy">DD/MM/YYYY</MenuItem>
                    <MenuItem value="mm/dd/yyyy">MM/DD/YYYY</MenuItem>
                    <MenuItem value="yyyy-mm-dd">YYYY-MM-DD</MenuItem>
                  </Select>
                </FormControl>
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CustomTabPanel>

        {/* Data Management Tab */}
        <CustomTabPanel value={tabValue} index={5}>
          <Typography variant="h6" gutterBottom>
            Data Management
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <Backup />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">Data Backup</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Last backup: 2 hours ago
                      </Typography>
                    </Box>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoBackup}
                        onChange={(e) => setAutoBackup(e.target.checked)}
                      />
                    }
                    label="Automatic daily backup"
                  />
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button variant="outlined" size="small" onClick={handleBackupData}>
                      Backup Now
                    </Button>
                    <Button variant="outlined" size="small">
                      Schedule
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                      <RestoreFromTrash />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">Data Restore</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Restore from backup files
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" size="small" onClick={handleRestoreData}>
                      Restore Data
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<Upload />}>
                      Upload Backup
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Storage Usage
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Database: 2.4 GB / 10 GB available
                  </Typography>
                  <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, height: 8, mb: 2 }}>
                    <Box sx={{ width: '24%', bgcolor: 'primary.main', height: '100%', borderRadius: 1 }} />
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Files: 1.8 GB • Documents: 0.6 GB
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CustomTabPanel>
      </Card>
    </Box>
  )
}