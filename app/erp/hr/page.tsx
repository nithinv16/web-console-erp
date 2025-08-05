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
  Divider
} from '@mui/material'
import {
  People,
  PersonAdd,
  TrendingUp,
  TrendingDown,
  Business,
  Schedule,
  AttachMoney,
  Assignment,
  CheckCircle,
  Warning,
  Add,
  Edit,
  Visibility,
  Work,
  AccessTime,
  CalendarToday,
  AccountBalance,
  School,
  Star,
  Phone,
  Email
} from '@mui/icons-material'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { useRouter } from 'next/navigation'
import { HRApi } from '@/lib/api/hr-api'
import { useAuth } from '@/contexts/AuthContext'

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
      id={`hr-tabpanel-${index}`}
      aria-labelledby={`hr-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function HRPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [payroll, setPayroll] = useState<any[]>([])
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])
  
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()
  const { user } = useAuth()

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
      const dashboard = await HRApi.getDashboardData(companyId)
      setDashboardData(dashboard)
      
      // Fetch recent data
      const [employeesData, departmentsData, attendanceData, payrollData, leaveData] = await Promise.all([
        HRApi.getEmployees(companyId),
        HRApi.getDepartments(companyId),
        HRApi.getAttendance(companyId),
        HRApi.getPayroll(companyId),
        HRApi.getLeaveRequests(companyId)
      ])
      
      setEmployees(employeesData || [])
      setDepartments(departmentsData || [])
      setAttendance(attendanceData || [])
      setPayroll(payrollData || [])
      setLeaveRequests(leaveData || [])
      
    } catch (err) {
      console.error('Error fetching HR data:', err)
      setError('Failed to load HR data')
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
      case 'active': return 'success'
      case 'inactive': return 'default'
      case 'on_leave': return 'warning'
      case 'terminated': return 'error'
      case 'present': return 'success'
      case 'absent': return 'error'
      case 'late': return 'warning'
      case 'approved': return 'success'
      case 'pending': return 'warning'
      case 'rejected': return 'error'
      case 'paid': return 'success'
      case 'unpaid': return 'error'
      default: return 'default'
    }
  }

  const getDepartmentIcon = (department: string) => {
    switch (department?.toLowerCase()) {
      case 'sales': return <AttachMoney />
      case 'marketing': return <Star />
      case 'hr': case 'human resources': return <People />
      case 'it': case 'technology': return <Work />
      case 'finance': return <AccountBalance />
      case 'operations': return <Business />
      default: return <Business />
    }
  }

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Human Resources Management</Typography>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading HR data...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Human Resources Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage employees, attendance, payroll, and HR operations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => router.push('/erp/hr/employees/new')}
        >
          Add Employee
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
                      Total Employees
                    </Typography>
                    <Typography variant="h5">
                      {dashboardData.totalEmployees || 0}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <TrendingUp color="success" fontSize="small" />
                      <Typography variant="body2" color="success.main">
                        +{dashboardData.employeeGrowth || 0}% this month
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
                      Present Today
                    </Typography>
                    <Typography variant="h5">
                      {dashboardData.presentToday || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dashboardData.attendanceRate || 0}% attendance rate
                    </Typography>
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
                      On Leave
                    </Typography>
                    <Typography variant="h5">
                      {dashboardData.onLeave || 0}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Warning color="warning" fontSize="small" />
                      <Typography variant="body2" color="warning.main">
                        {dashboardData.pendingLeaveRequests || 0} pending requests
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: '#FF9800' }}>
                    <Schedule />
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
                      Monthly Payroll
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(dashboardData.monthlyPayroll || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dashboardData.payrollProcessed ? 'Processed' : 'Pending'}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#9C27B0' }}>
                    <AttachMoney />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
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
                    onClick={() => router.push('/erp/hr/attendance/mark')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#4CAF50', mr: 1, width: 32, height: 32 }}>
                        <AccessTime />
                      </Avatar>
                      <Typography variant="subtitle2">
                        Mark Attendance
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Record employee attendance
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
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
                    onClick={() => router.push('/erp/hr/payroll/process')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#9C27B0', mr: 1, width: 32, height: 32 }}>
                        <AttachMoney />
                      </Avatar>
                      <Typography variant="subtitle2">
                        Process Payroll
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Generate salary payments
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
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
                    onClick={() => router.push('/erp/hr/leave/request')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#FF9800', mr: 1, width: 32, height: 32 }}>
                        <CalendarToday />
                      </Avatar>
                      <Typography variant="subtitle2">
                        Leave Request
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Apply for leave
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
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
                    onClick={() => router.push('/erp/hr/reports')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#2196F3', mr: 1, width: 32, height: 32 }}>
                        <Assignment />
                      </Avatar>
                      <Typography variant="subtitle2">
                        HR Reports
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Generate HR analytics
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pending Approvals
              </Typography>
              <List>
                {leaveRequests.filter(req => req.status === 'pending').slice(0, 5).map((request) => (
                  <ListItem key={request.id}>
                    <ListItemAvatar>
                      <Avatar>
                        <CalendarToday />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${request.employeeName} - ${request.leaveType}`}
                      secondary={`${new Date(request.startDate).toLocaleDateString()} - ${new Date(request.endDate).toLocaleDateString()}`}
                    />
                    <ListItemSecondaryAction>
                      <Badge badgeContent="!" color="warning">
                        <IconButton size="small" onClick={() => router.push(`/erp/hr/leave/${request.id}`)}>
                          <Visibility />
                        </IconButton>
                      </Badge>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                {leaveRequests.filter(req => req.status === 'pending').length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No pending approvals
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Employees" />
            <Tab label="Departments" />
            <Tab label="Attendance" />
            <Tab label="Payroll" />
          </Tabs>
        </Box>

        {/* Employees Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Employee Directory</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/hr/employees')}
            >
              View All
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2 }}>
                          {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {employee.firstName} {employee.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {employee.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{employee.departmentName}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>
                      <Chip
                        label={employee.status}
                        color={getStatusColor(employee.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => router.push(`/erp/hr/employees/${employee.id}`)}>
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" onClick={() => router.push(`/erp/hr/employees/${employee.id}/edit`)}>
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Departments Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Departments</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/hr/departments')}
            >
              Manage Departments
            </Button>
          </Box>
          <Grid container spacing={2}>
            {departments.map((department) => (
              <Grid item xs={12} sm={6} md={4} key={department.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ mr: 2, bgcolor: '#2196F3' }}>
                        {getDepartmentIcon(department.name)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">{department.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {department.employeeCount || 0} employees
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Manager: {department.managerName || 'Not assigned'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {department.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Attendance Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Today's Attendance</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/hr/attendance')}
            >
              View All
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Check In</TableCell>
                  <TableCell>Check Out</TableCell>
                  <TableCell>Hours Worked</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2 }}>
                          {record.employeeName?.charAt(0)}
                        </Avatar>
                        <Typography variant="subtitle2">{record.employeeName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}
                    </TableCell>
                    <TableCell>
                      {record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}
                    </TableCell>
                    <TableCell>{record.hoursWorked || 0} hrs</TableCell>
                    <TableCell>
                      <Chip
                        label={record.status}
                        color={getStatusColor(record.status)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Payroll Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Recent Payroll</Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/erp/hr/payroll')}
            >
              View All
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell>Gross Salary</TableCell>
                  <TableCell>Deductions</TableCell>
                  <TableCell>Net Salary</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payroll.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2 }}>
                          {record.employeeName?.charAt(0)}
                        </Avatar>
                        <Typography variant="subtitle2">{record.employeeName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {new Date(record.payPeriodStart).toLocaleDateString()} - {new Date(record.payPeriodEnd).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{formatCurrency(record.grossSalary || 0)}</TableCell>
                    <TableCell>{formatCurrency(record.totalDeductions || 0)}</TableCell>
                    <TableCell>{formatCurrency(record.netSalary || 0)}</TableCell>
                    <TableCell>
                      <Chip
                        label={record.status}
                        color={getStatusColor(record.status)}
                        size="small"
                      />
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
        onClick={() => router.push('/erp/hr/employees/new')}
      >
        <Add />
      </Fab>
    </Box>
  )
}