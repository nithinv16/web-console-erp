'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Grid,
  Alert,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  Download,
  AccountBalance,
  TrendingUp,
  Person,
  AttachMoney,
  Receipt
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'

interface PayrollRecord {
  id: string
  employee_id: string
  employee_name: string
  department: string
  position: string
  pay_period: string
  basic_salary: number
  allowances: number
  overtime: number
  deductions: number
  tax_deduction: number
  net_salary: number
  status: 'draft' | 'processed' | 'paid' | 'cancelled'
  payment_date?: string
  payment_method: 'bank_transfer' | 'cash' | 'cheque'
  bank_account?: string
}

const mockPayrollRecords: PayrollRecord[] = [
  {
    id: '1',
    employee_id: 'EMP-001',
    employee_name: 'Rajesh Kumar',
    department: 'Engineering',
    position: 'Senior Software Engineer',
    pay_period: 'January 2024',
    basic_salary: 100000,
    allowances: 15000,
    overtime: 5000,
    deductions: 2000,
    tax_deduction: 18000,
    net_salary: 100000,
    status: 'paid',
    payment_date: '2024-01-31',
    payment_method: 'bank_transfer',
    bank_account: '****1234'
  },
  {
    id: '2',
    employee_id: 'EMP-002',
    employee_name: 'Priya Sharma',
    department: 'Engineering',
    position: 'Engineering Manager',
    pay_period: 'January 2024',
    basic_salary: 150000,
    allowances: 25000,
    overtime: 0,
    deductions: 3000,
    tax_deduction: 32000,
    net_salary: 140000,
    status: 'paid',
    payment_date: '2024-01-31',
    payment_method: 'bank_transfer',
    bank_account: '****5678'
  },
  {
    id: '3',
    employee_id: 'EMP-003',
    employee_name: 'Suresh Reddy',
    department: 'Sales',
    position: 'Sales Executive',
    pay_period: 'January 2024',
    basic_salary: 66667,
    allowances: 10000,
    overtime: 3000,
    deductions: 1000,
    tax_deduction: 12000,
    net_salary: 66667,
    status: 'processed',
    payment_method: 'bank_transfer',
    bank_account: '****9012'
  },
  {
    id: '4',
    employee_id: 'EMP-004',
    employee_name: 'Anita Singh',
    department: 'Sales',
    position: 'Sales Manager',
    pay_period: 'January 2024',
    basic_salary: 125000,
    allowances: 20000,
    overtime: 0,
    deductions: 2500,
    tax_deduction: 25000,
    net_salary: 117500,
    status: 'processed',
    payment_method: 'bank_transfer',
    bank_account: '****3456'
  },
  {
    id: '5',
    employee_id: 'EMP-005',
    employee_name: 'Vikram Patel',
    department: 'HR',
    position: 'HR Specialist',
    pay_period: 'January 2024',
    basic_salary: 50000,
    allowances: 8000,
    overtime: 2000,
    deductions: 1000,
    tax_deduction: 8000,
    net_salary: 51000,
    status: 'draft',
    payment_method: 'bank_transfer',
    bank_account: '****7890'
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'default'
    case 'processed': return 'warning'
    case 'paid': return 'success'
    case 'cancelled': return 'error'
    default: return 'default'
  }
}

const getPaymentMethodIcon = (method: string) => {
  switch (method) {
    case 'bank_transfer': return <AccountBalance />
    case 'cash': return <AttachMoney />
    case 'cheque': return <Receipt />
    default: return <AccountBalance />
  }
}

export default function PayrollPage() {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(mockPayrollRecords)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [payPeriodFilter, setPayPeriodFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const filteredRecords = payrollRecords.filter(record => {
    const matchesSearch = record.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.position.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDepartment = !departmentFilter || record.department === departmentFilter
    const matchesStatus = !statusFilter || record.status === statusFilter
    const matchesPayPeriod = !payPeriodFilter || record.pay_period === payPeriodFilter
    
    return matchesSearch && matchesDepartment && matchesStatus && matchesPayPeriod
  })

  const handleCreatePayroll = () => {
    router.push('/erp/hr/payroll/new')
  }

  const handleProcessPayroll = () => {
    // Process all draft payroll records
    setPayrollRecords(prev => 
      prev.map(record => 
        record.status === 'draft' ? { ...record, status: 'processed' as const } : record
      )
    )
  }

  // Calculate summary statistics
  const totalRecords = payrollRecords.length
  const totalPayroll = payrollRecords.reduce((sum, r) => sum + r.net_salary, 0)
  const paidRecords = payrollRecords.filter(r => r.status === 'paid').length
  const pendingRecords = payrollRecords.filter(r => r.status === 'draft' || r.status === 'processed').length

  const departments = [...new Set(payrollRecords.map(r => r.department))]
  const payPeriods = [...new Set(payrollRecords.map(r => r.pay_period))]

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Payroll Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleProcessPayroll}
            disabled={!payrollRecords.some(r => r.status === 'draft')}
          >
            Process Payroll
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreatePayroll}
          >
            Generate Payroll
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                <Person />
              </Avatar>
              <Typography variant="h4">{totalRecords}</Typography>
              <Typography variant="body2" color="textSecondary">
                Total Records
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                <AttachMoney />
              </Avatar>
              <Typography variant="h4">₹{(totalPayroll / 100000).toFixed(1)}L</Typography>
              <Typography variant="body2" color="textSecondary">
                Total Payroll
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1 }}>
                <TrendingUp />
              </Avatar>
              <Typography variant="h4">{paidRecords}</Typography>
              <Typography variant="body2" color="textSecondary">
                Paid Records
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                <Receipt />
              </Avatar>
              <Typography variant="h4">{pendingRecords}</Typography>
              <Typography variant="body2" color="textSecondary">
                Pending Records
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            placeholder="Search payroll records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Department</InputLabel>
            <Select
              value={departmentFilter}
              label="Department"
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <MenuItem value="">All Departments</MenuItem>
              {departments.map(dept => (
                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="processed">Processed</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Pay Period</InputLabel>
            <Select
              value={payPeriodFilter}
              label="Pay Period"
              onChange={(e) => setPayPeriodFilter(e.target.value)}
            >
              <MenuItem value="">All Periods</MenuItem>
              {payPeriods.map(period => (
                <MenuItem key={period} value={period}>{period}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Pay Period</TableCell>
                  <TableCell>Basic Salary</TableCell>
                  <TableCell>Allowances</TableCell>
                  <TableCell>Deductions</TableCell>
                  <TableCell>Net Salary</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {record.employee_name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {record.employee_id} • {record.department}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" display="block">
                          {record.position}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{record.pay_period}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">₹{record.basic_salary.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" color="success.main">
                          +₹{(record.allowances + record.overtime).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Allowances + OT
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" color="error.main">
                          -₹{(record.deductions + record.tax_deduction).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Deductions + Tax
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="primary.main">
                        ₹{record.net_salary.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getPaymentMethodIcon(record.payment_method)}
                        <Box>
                          <Typography variant="caption" display="block">
                            {record.payment_method.replace('_', ' ').toUpperCase()}
                          </Typography>
                          {record.bank_account && (
                            <Typography variant="caption" color="textSecondary">
                              {record.bank_account}
                            </Typography>
                          )}
                          {record.payment_date && (
                            <Typography variant="caption" color="textSecondary" display="block">
                              Paid: {record.payment_date}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={record.status.toUpperCase()}
                        color={getStatusColor(record.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" title="View">
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" title="Download Payslip">
                        <Download />
                      </IconButton>
                      <IconButton size="small" title="Edit">
                        <Edit />
                      </IconButton>
                      <IconButton size="small" title="Delete">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredRecords.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No payroll records found matching your criteria.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}