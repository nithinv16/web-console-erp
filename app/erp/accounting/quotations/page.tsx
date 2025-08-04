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
  Alert
} from '@mui/material'
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  GetApp
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'

interface Quotation {
  id: string
  quotation_number: string
  customer_name: string
  date: string
  valid_until: string
  total_amount: number
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  items_count: number
}

const mockQuotations: Quotation[] = [
  {
    id: '1',
    quotation_number: 'QUO-2024-001',
    customer_name: 'ABC Corporation',
    date: '2024-01-15',
    valid_until: '2024-02-15',
    total_amount: 25000,
    status: 'sent',
    items_count: 5
  },
  {
    id: '2',
    quotation_number: 'QUO-2024-002',
    customer_name: 'XYZ Ltd',
    date: '2024-01-16',
    valid_until: '2024-02-16',
    total_amount: 18500,
    status: 'accepted',
    items_count: 3
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'default'
    case 'sent': return 'info'
    case 'accepted': return 'success'
    case 'rejected': return 'error'
    case 'expired': return 'warning'
    default: return 'default'
  }
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>(mockQuotations)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const filteredQuotations = quotations.filter(quotation =>
    quotation.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateQuotation = () => {
    router.push('/erp/accounting/quotations/new')
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Quotations
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateQuotation}
        >
          Create Quotation
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            placeholder="Search quotations..."
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
      </Grid>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Quotation #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Valid Until</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredQuotations.map((quotation) => (
                  <TableRow key={quotation.id}>
                    <TableCell>{quotation.quotation_number}</TableCell>
                    <TableCell>{quotation.customer_name}</TableCell>
                    <TableCell>{new Date(quotation.date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(quotation.valid_until).toLocaleDateString()}</TableCell>
                    <TableCell>{quotation.items_count}</TableCell>
                    <TableCell>₹{quotation.total_amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={quotation.status.toUpperCase()}
                        color={getStatusColor(quotation.status) as any}
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
                      <IconButton size="small" title="Download">
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

          {filteredQuotations.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No quotations found. Create your first quotation to get started.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}