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
  Person,
  Work,
  LocationOn,
  Email,
  Phone,
  Badge
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'

interface Employee {
  id: string
  employee_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  department: string
  position: string
  manager: string
  hire_date: string
  employment_type: 'full-time' | 'part-time' | 'contract' | 'intern'
  status: 'active' | 'inactive' | 'terminated'
  salary: number
  location: string
  avatar?: string
  birth_date: string
  address: string
}

const mockEmployees: Employee[] = [
  {
    id: '1',
    employee_id: 'EMP-001',
    first_name: 'Rajesh',
    last_name: 'Kumar',
    email: 'rajesh.kumar@company.com',
    phone: '+91 98765 43210',
    department: 'Engineering',
    position: 'Senior Software Engineer',
    manager: 'Priya Sharma',
    hire_date: '2022-01-15',
    employment_type: 'full-time',
    status: 'active',
    salary: 1200000,
    location: 'Mumbai',
    birth_date: '1990-05-20',
    address: '123 Tech Park, Andheri, Mumbai'
  },
  {
    id: '2',
    employee_id: 'EMP-002',
    first_name: 'Priya',
    last_name: 'Sharma',
    email: 'priya.sharma@company.com',
    phone: '+91 87654 32109',
    department: 'Engineering',
    position: 'Engineering Manager',
    manager: 'CEO',
    hire_date: '2021-03-10',
    employment_type: 'full-time',
    status: 'active',
    salary: 1800000,
    location: 'Mumbai',
    birth_date: '1988-08-15',
    address: '456 Business District, Bandra, Mumbai'
  },
  {
    id: '3',
    employee_id: 'EMP-003',
    first_name: 'Suresh',
    last_name: 'Reddy',
    email: 'suresh.reddy@company.com',
    phone: '+91 76543 21098',
    department: 'Sales',
    position: 'Sales Executive',
    manager: 'Anita Singh',
    hire_date: '2023-06-01',
    employment_type: 'full-time',
    status: 'active',
    salary: 800000,
    location: 'Bangalore',
    birth_date: '1992-12-03',
    address: '789 IT Park, Whitefield, Bangalore'
  },
  {
    id: '4',
    employee_id: 'EMP-004',
    first_name: 'Anita',
    last_name: 'Singh',
    email: 'anita.singh@company.com',
    phone: '+91 65432 10987',
    department: 'Sales',
    position: 'Sales Manager',
    manager: 'CEO',
    hire_date: '2020-09-15',
    employment_type: 'full-time',
    status: 'active',
    salary: 1500000,
    location: 'Delhi',
    birth_date: '1985-03-25',
    address: '321 Corporate Plaza, Connaught Place, Delhi'
  },
  {
    id: '5',
    employee_id: 'EMP-005',
    first_name: 'Vikram',
    last_name: 'Patel',
    email: 'vikram.patel@company.com',
    phone: '+91 54321 09876',
    department: 'HR',
    position: 'HR Specialist',
    manager: 'Sunita Gupta',
    hire_date: '2023-01-20',
    employment_type: 'contract',
    status: 'active',
    salary: 600000,
    location: 'Pune',
    birth_date: '1994-07-10',
    address: '555 HR Tower, Koregaon Park, Pune'
  },
  {
    id: '6',
    employee_id: 'EMP-006',
    first_name: 'Neha',
    last_name: 'Joshi',
    email: 'neha.joshi@company.com',
    phone: '+91 43210 98765',
    department: 'Marketing',
    position: 'Marketing Intern',
    manager: 'Rohit Mehta',
    hire_date: '2024-01-10',
    employment_type: 'intern',
    status: 'active',
    salary: 200000,
    location: 'Mumbai',
    birth_date: '2001-11-18',
    address: '777 Student Housing, Powai, Mumbai'
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'inactive': return 'warning'
    case 'terminated': return 'error'
    default: return 'default'
  }
}

const getEmploymentTypeColor = (type: string) => {
  switch (type) {
    case 'full-time': return 'primary'
    case 'part-time': return 'info'
    case 'contract': return 'warning'
    case 'intern': return 'secondary'
    default: return 'default'
  }
}

const getDepartmentColor = (department: string) => {
  switch (department) {
    case 'Engineering': return 'primary'
    case 'Sales': return 'success'
    case 'HR': return 'info'
    case 'Marketing': return 'warning'
    case 'Finance': return 'error'
    default: return 'default'
  }
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDepartment = !departmentFilter || employee.department === departmentFilter
    const matchesStatus = !statusFilter || employee.status === statusFilter
    const matchesEmploymentType = !employmentTypeFilter || employee.employment_type === employmentTypeFilter
    
    return matchesSearch && matchesDepartment && matchesStatus && matchesEmploymentType
  })

  const handleCreateEmployee = () => {
    router.push('/erp/hr/employees/new')
  }

  // Calculate summary statistics
  const totalEmployees = employees.length
  const activeEmployees = employees.filter(e => e.status === 'active').length
  const departments = [...new Set(employees.map(e => e.department))]
  const avgSalary = employees.reduce((sum, e) => sum + e.salary, 0) / employees.length

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Employees
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateEmployee}
        >
          Add Employee
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                <Person />
              </Avatar>
              <Typography variant="h4">{totalEmployees}</Typography>
              <Typography variant="body2" color="textSecondary">
                Total Employees
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                <Badge />
              </Avatar>
              <Typography variant="h4">{activeEmployees}</Typography>
              <Typography variant="body2" color="textSecondary">
                Active Employees
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1 }}>
                <Work />
              </Avatar>
              <Typography variant="h4">{departments.length}</Typography>
              <Typography variant="body2" color="textSecondary">
                Departments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                <LocationOn />
              </Avatar>
              <Typography variant="h4">₹{(avgSalary / 100000).toFixed(1)}L</Typography>
              <Typography variant="body2" color="textSecondary">
                Average Salary
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
            placeholder="Search employees..."
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
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="terminated">Terminated</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Employment Type</InputLabel>
            <Select
              value={employmentTypeFilter}
              label="Employment Type"
              onChange={(e) => setEmploymentTypeFilter(e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="full-time">Full-time</MenuItem>
              <MenuItem value="part-time">Part-time</MenuItem>
              <MenuItem value="contract">Contract</MenuItem>
              <MenuItem value="intern">Intern</MenuItem>
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
                  <TableCell>Contact</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Manager</TableCell>
                  <TableCell>Employment</TableCell>
                  <TableCell>Salary</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {employee.first_name[0]}{employee.last_name[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {employee.first_name} {employee.last_name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {employee.employee_id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <Email sx={{ fontSize: 14 }} color="action" />
                          <Typography variant="caption">{employee.email}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Phone sx={{ fontSize: 14 }} color="action" />
                          <Typography variant="caption">{employee.phone}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={employee.department}
                        color={getDepartmentColor(employee.department) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{employee.position}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{employee.manager}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Chip
                          label={employee.employment_type.replace('-', ' ').toUpperCase()}
                          color={getEmploymentTypeColor(employee.employment_type) as any}
                          size="small"
                        />
                        <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.5 }}>
                          Since: {employee.hire_date}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        ₹{(employee.salary / 100000).toFixed(1)}L
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        per annum
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={employee.status.toUpperCase()}
                        color={getStatusColor(employee.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" title="View">
                        <Visibility />
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

          {filteredEmployees.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No employees found matching your criteria.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}