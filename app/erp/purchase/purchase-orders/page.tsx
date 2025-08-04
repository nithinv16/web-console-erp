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
  ShoppingCart,
  PendingActions,
  CheckCircle,
  Cancel,
  LocalShipping
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'

interface PurchaseOrder {
  id: string
  po_number: string
  supplier_name: string
  supplier_contact: string
  order_date: string
  expected_delivery: string
  status: 'draft' | 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled'
  total_amount: number
  currency: string
  items_count: number
  created_by: string
  notes?: string
  priority: 'low' | 'medium' | 'high'
}

const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: '1',
    po_number: 'PO-2024-001',
    supplier_name: 'Tech Solutions Ltd',
    supplier_contact: 'contact@techsolutions.com',
    order_date: '2024-01-15',
    expected_delivery: '2024-01-25',
    status: 'approved',
    total_amount: 2250000,
    currency: 'INR',
    items_count: 3,
    created_by: 'Rajesh Kumar',
    notes: 'Urgent requirement for Q1 projects',
    priority: 'high'
  },
  {
    id: '2',
    po_number: 'PO-2024-002',
    supplier_name: 'Office Supplies Co',
    supplier_contact: 'orders@officesupplies.com',
    order_date: '2024-01-14',
    expected_delivery: '2024-01-20',
    status: 'ordered',
    total_amount: 450000,
    currency: 'INR',
    items_count: 5,
    created_by: 'Priya Sharma',
    priority: 'medium'
  },
  {
    id: '3',
    po_number: 'PO-2024-003',
    supplier_name: 'Industrial Equipment Inc',
    supplier_contact: 'sales@industrial-eq.com',
    order_date: '2024-01-13',
    expected_delivery: '2024-02-15',
    status: 'pending',
    total_amount: 1800000,
    currency: 'INR',
    items_count: 2,
    created_by: 'Suresh Reddy',
    notes: 'Requires management approval',
    priority: 'high'
  },
  {
    id: '4',
    po_number: 'PO-2024-004',
    supplier_name: 'Stationery World',
    supplier_contact: 'info@stationeryworld.com',
    order_date: '2024-01-12',
    expected_delivery: '2024-01-18',
    status: 'received',
    total_amount: 125000,
    currency: 'INR',
    items_count: 8,
    created_by: 'Admin User',
    priority: 'low'
  },
  {
    id: '5',
    po_number: 'PO-2024-005',
    supplier_name: 'Electronics Hub',
    supplier_contact: 'purchase@electronicshub.com',
    order_date: '2024-01-10',
    expected_delivery: '2024-01-22',
    status: 'cancelled',
    total_amount: 750000,
    currency: 'INR',
    items_count: 4,
    created_by: 'Priya Sharma',
    notes: 'Cancelled due to budget constraints',
    priority: 'medium'
  }
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'draft': return <Edit color="disabled" />
    case 'pending': return <PendingActions color="warning" />
    case 'approved': return <CheckCircle color="success" />
    case 'ordered': return <LocalShipping color="info" />
    case 'received': return <CheckCircle color="success" />
    case 'cancelled': return <Cancel color="error" />
    default: return <ShoppingCart />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'default'
    case 'pending': return 'warning'
    case 'approved': return 'info'
    case 'ordered': return 'primary'
    case 'received': return 'success'
    case 'cancelled': return 'error'
    default: return 'default'
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'error'
    case 'medium': return 'warning'
    case 'low': return 'success'
    default: return 'default'
  }
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>(mockPurchaseOrders)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.created_by.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !statusFilter || order.status === statusFilter
    const matchesPriority = !priorityFilter || order.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const handleCreateOrder = () => {
    router.push('/erp/purchase/purchase-orders/new')
  }

  // Calculate summary statistics
  const totalOrders = orders.length
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const approvedOrders = orders.filter(o => o.status === 'approved').length
  const totalValue = orders.reduce((sum, o) => sum + o.total_amount, 0)

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Purchase Orders
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateOrder}
        >
          Create Purchase Order
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                <ShoppingCart />
              </Avatar>
              <Typography variant="h4">{totalOrders}</Typography>
              <Typography variant="body2" color="textSecondary">
                Total Orders
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                <PendingActions />
              </Avatar>
              <Typography variant="h4">{pendingOrders}</Typography>
              <Typography variant="body2" color="textSecondary">
                Pending Approval
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                <CheckCircle />
              </Avatar>
              <Typography variant="h4">{approvedOrders}</Typography>
              <Typography variant="body2" color="textSecondary">
                Approved Orders
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1 }}>
                <LocalShipping />
              </Avatar>
              <Typography variant="h4">₹{(totalValue / 1000000).toFixed(1)}M</Typography>
              <Typography variant="body2" color="textSecondary">
                Total Value
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
            placeholder="Search purchase orders..."
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
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="ordered">Ordered</MenuItem>
              <MenuItem value="received">Received</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={priorityFilter}
              label="Priority"
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <MenuItem value="">All Priorities</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
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
                  <TableCell>PO Number</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Order Date</TableCell>
                  <TableCell>Expected Delivery</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {order.po_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{order.supplier_name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {order.supplier_contact}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{order.order_date}</TableCell>
                    <TableCell>{order.expected_delivery}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(order.status)}
                        <Chip
                          label={order.status.toUpperCase()}
                          color={getStatusColor(order.status) as any}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.priority.toUpperCase()}
                        color={getPriorityColor(order.priority) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{order.items_count} items</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        ₹{order.total_amount.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>{order.created_by}</TableCell>
                    <TableCell>
                      <IconButton size="small" title="View">
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" title="Edit">
                        <Edit />
                      </IconButton>
                      <IconButton size="small" title="Download">
                        <Download />
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

          {filteredOrders.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No purchase orders found matching your criteria.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}