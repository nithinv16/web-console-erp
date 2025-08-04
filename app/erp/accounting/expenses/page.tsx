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
  GetApp,
  Receipt
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'

interface Expense {
  id: string
  expense_number: string
  description: string
  category: string
  date: string
  amount: number
  payment_method: 'cash' | 'bank_transfer' | 'cheque' | 'card' | 'upi'
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  vendor?: string
  receipt_url?: string
}

const mockExpenses: Expense[] = [
  {
    id: '1',
    expense_number: 'EXP-2024-001',
    description: 'Office Supplies Purchase',
    category: 'Office Supplies',
    date: '2024-01-15',
    amount: 5000,
    payment_method: 'card',
    status: 'paid',
    vendor: 'Office Mart',
    receipt_url: '/receipts/exp-001.pdf'
  },
  {
    id: '2',
    expense_number: 'EXP-2024-002',
    description: 'Travel Expenses - Client Meeting',
    category: 'Travel',
    date: '2024-01-16',
    amount: 8500,
    payment_method: 'cash',
    status: 'approved',
    vendor: 'Travel Agency'
  },
  {
    id: '3',
    expense_number: 'EXP-2024-003',
    description: 'Software License Renewal',
    category: 'Software',
    date: '2024-01-17',
    amount: 25000,
    payment_method: 'bank_transfer',
    status: 'pending',
    vendor: 'Tech Solutions Inc'
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'warning'
    case 'approved': return 'info'
    case 'paid': return 'success'
    case 'rejected': return 'error'
    default: return 'default'
  }
}

const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case 'cash': return 'Cash'
    case 'bank_transfer': return 'Bank Transfer'
    case 'cheque': return 'Cheque'
    case 'card': return 'Card'
    case 'upi': return 'UPI'
    default: return method
  }
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const categories = ['Office Supplies', 'Travel', 'Software', 'Marketing', 'Utilities', 'Equipment']

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.expense_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (expense.vendor && expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const handleCreateExpense = () => {
    router.push('/erp/accounting/expenses/new')
  }

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Expenses
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateExpense}
        >
          Add Expense
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            placeholder="Search expenses..."
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
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categories.map(category => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card sx={{ textAlign: 'center', p: 1 }}>
            <Typography variant="caption" color="textSecondary">
              Total Amount
            </Typography>
            <Typography variant="h6" color="primary">
              ₹{totalExpenses.toLocaleString()}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Expense #</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Vendor</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.expense_number}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{expense.vendor || '-'}</TableCell>
                    <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell>₹{expense.amount.toLocaleString()}</TableCell>
                    <TableCell>{getPaymentMethodLabel(expense.payment_method)}</TableCell>
                    <TableCell>
                      <Chip
                        label={expense.status.toUpperCase()}
                        color={getStatusColor(expense.status) as any}
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
                      {expense.receipt_url && (
                        <IconButton size="small" title="Receipt">
                          <Receipt />
                        </IconButton>
                      )}
                      <IconButton size="small" title="Delete">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredExpenses.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No expenses found. Add your first expense to get started.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}