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
  Payment
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'

interface PaymentRecord {
  id: string
  payment_number: string
  customer_name: string
  invoice_number: string
  date: string
  amount: number
  payment_method: 'cash' | 'bank_transfer' | 'cheque' | 'card' | 'upi'
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  reference_number?: string
}

const mockPayments: PaymentRecord[] = [
  {
    id: '1',
    payment_number: 'PAY-2024-001',
    customer_name: 'ABC Corporation',
    invoice_number: 'INV-2024-001',
    date: '2024-01-15',
    amount: 25000,
    payment_method: 'bank_transfer',
    status: 'completed',
    reference_number: 'TXN123456789'
  },
  {
    id: '2',
    payment_number: 'PAY-2024-002',
    customer_name: 'XYZ Ltd',
    invoice_number: 'INV-2024-002',
    date: '2024-01-16',
    amount: 18500,
    payment_method: 'upi',
    status: 'completed',
    reference_number: 'UPI987654321'
  },
  {
    id: '3',
    payment_number: 'PAY-2024-003',
    customer_name: 'DEF Industries',
    invoice_number: 'INV-2024-003',
    date: '2024-01-17',
    amount: 12000,
    payment_method: 'cheque',
    status: 'pending',
    reference_number: 'CHQ001234'
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'warning'
    case 'completed': return 'success'
    case 'failed': return 'error'
    case 'cancelled': return 'default'
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

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>(mockPayments)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.payment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreatePayment = () => {
    router.push('/erp/accounting/payments/new')
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Payments
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreatePayment}
        >
          Record Payment
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            placeholder="Search payments..."
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
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
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
                  <TableCell>Payment #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.payment_number}</TableCell>
                    <TableCell>{payment.customer_name}</TableCell>
                    <TableCell>{payment.invoice_number}</TableCell>
                    <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                    <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                    <TableCell>{getPaymentMethodLabel(payment.payment_method)}</TableCell>
                    <TableCell>{payment.reference_number || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={payment.status.toUpperCase()}
                        color={getStatusColor(payment.status) as any}
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
                      <IconButton size="small" title="Receipt">
                        <GetApp />
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

          {filteredPayments.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No payments found. Record your first payment to get started.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}