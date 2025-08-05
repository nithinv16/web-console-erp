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
  MenuItem,
  Rating
} from '@mui/material'
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  Business,
  Phone,
  Email,
  LocationOn,
  Star,
  TrendingUp
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'

interface Supplier {
  id: string
  name: string
  code: string
  contact_person: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
  country: string
  category: string
  status: 'active' | 'inactive' | 'blacklisted'
  rating: number
  total_orders: number
  total_value: number
  payment_terms: string
  tax_id: string
  registration_date: string
  last_order_date?: string
}

const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Tech Solutions Ltd',
    code: 'SUP-001',
    contact_person: 'Amit Sharma',
    email: 'contact@techsolutions.com',
    phone: '+91 98765 43210',
    address: '123 Tech Park, Sector 5',
    city: 'Gurgaon',
    state: 'Haryana',
    pincode: '122001',
    country: 'India',
    category: 'Electronics',
    status: 'active',
    rating: 4.5,
    total_orders: 25,
    total_value: 5500000,
    payment_terms: 'Net 30',
    tax_id: 'GSTIN123456789',
    registration_date: '2023-01-15',
    last_order_date: '2024-01-15'
  },
  {
    id: '2',
    name: 'Office Supplies Co',
    code: 'SUP-002',
    contact_person: 'Priya Patel',
    email: 'orders@officesupplies.com',
    phone: '+91 87654 32109',
    address: '456 Business District',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    country: 'India',
    category: 'Office Supplies',
    status: 'active',
    rating: 4.2,
    total_orders: 18,
    total_value: 2800000,
    payment_terms: 'Net 15',
    tax_id: 'GSTIN987654321',
    registration_date: '2023-03-20',
    last_order_date: '2024-01-14'
  },
  {
    id: '3',
    name: 'Industrial Equipment Inc',
    code: 'SUP-003',
    contact_person: 'Rajesh Kumar',
    email: 'sales@industrial-eq.com',
    phone: '+91 76543 21098',
    address: '789 Industrial Zone',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600001',
    country: 'India',
    category: 'Machinery',
    status: 'active',
    rating: 4.8,
    total_orders: 12,
    total_value: 8200000,
    payment_terms: 'Net 45',
    tax_id: 'GSTIN456789123',
    registration_date: '2023-06-10',
    last_order_date: '2024-01-13'
  },
  {
    id: '4',
    name: 'Stationery World',
    code: 'SUP-004',
    contact_person: 'Sunita Singh',
    email: 'info@stationeryworld.com',
    phone: '+91 65432 10987',
    address: '321 Market Street',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    country: 'India',
    category: 'Stationery',
    status: 'active',
    rating: 3.8,
    total_orders: 32,
    total_value: 1200000,
    payment_terms: 'Net 7',
    tax_id: 'GSTIN789123456',
    registration_date: '2023-02-28',
    last_order_date: '2024-01-12'
  },
  {
    id: '5',
    name: 'Unreliable Supplies',
    code: 'SUP-005',
    contact_person: 'John Doe',
    email: 'contact@unreliable.com',
    phone: '+91 54321 09876',
    address: '999 Unknown Street',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700001',
    country: 'India',
    category: 'General',
    status: 'blacklisted',
    rating: 1.5,
    total_orders: 3,
    total_value: 150000,
    payment_terms: 'Advance',
    tax_id: 'GSTIN321654987',
    registration_date: '2023-08-15'
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'inactive': return 'warning'
    case 'blacklisted': return 'error'
    default: return 'default'
  }
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Electronics': return 'primary'
    case 'Office Supplies': return 'info'
    case 'Machinery': return 'warning'
    case 'Stationery': return 'success'
    default: return 'default'
  }
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.city.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !statusFilter || supplier.status === statusFilter
    const matchesCategory = !categoryFilter || supplier.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const handleCreateSupplier = () => {
    router.push('/erp/purchase/suppliers/new')
  }

  // Calculate summary statistics
  const totalSuppliers = suppliers.length
  const activeSuppliers = suppliers.filter(s => s.status === 'active').length
  const totalValue = suppliers.reduce((sum, s) => sum + s.total_value, 0)
  const avgRating = suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length

  const categories = Array.from(new Set(suppliers.map(s => s.category)))

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Suppliers
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateSupplier}
        >
          Add Supplier
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                <Business />
              </Avatar>
              <Typography variant="h4">{totalSuppliers}</Typography>
              <Typography variant="body2" color="textSecondary">
                Total Suppliers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                <TrendingUp />
              </Avatar>
              <Typography variant="h4">{activeSuppliers}</Typography>
              <Typography variant="body2" color="textSecondary">
                Active Suppliers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1 }}>
                <LocationOn />
              </Avatar>
              <Typography variant="h4">₹{(totalValue / 1000000).toFixed(1)}M</Typography>
              <Typography variant="body2" color="textSecondary">
                Total Business Value
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                <Star />
              </Avatar>
              <Typography variant="h4">{avgRating.toFixed(1)}</Typography>
              <Typography variant="body2" color="textSecondary">
                Average Rating
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            placeholder="Search suppliers..."
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
        <Grid item xs={12} md={4}>
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
              <MenuItem value="blacklisted">Blacklisted</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map(category => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
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
                  <TableCell>Supplier</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Orders</TableCell>
                  <TableCell>Total Value</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {supplier.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {supplier.code}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{supplier.contact_person}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <Phone sx={{ fontSize: 14 }} color="action" />
                          <Typography variant="caption">{supplier.phone}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Email sx={{ fontSize: 14 }} color="action" />
                          <Typography variant="caption">{supplier.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{supplier.city}, {supplier.state}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {supplier.pincode}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={supplier.category}
                        color={getCategoryColor(supplier.category) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Rating value={supplier.rating} readOnly size="small" precision={0.1} />
                        <Typography variant="caption">({supplier.rating})</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{supplier.total_orders}</Typography>
                      {supplier.last_order_date && (
                        <Typography variant="caption" color="textSecondary" display="block">
                          Last: {supplier.last_order_date}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        ₹{supplier.total_value.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={supplier.status.toUpperCase()}
                        color={getStatusColor(supplier.status) as any}
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

          {filteredSuppliers.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No suppliers found matching your criteria.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}