'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Fab,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  LinearProgress,
  Tooltip
} from '@mui/material'
import {
  Add,
  Search,
  FilterList,
  Edit,
  Delete,
  Visibility,
  MoreVert,
  ShoppingCart,
  Business,
  CalendarToday,
  AttachMoney,
  LocalShipping,
  CheckCircle,
  Cancel,
  Pending,
  Print,
  Email,
  Download,
  Receipt
} from '@mui/icons-material'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database, ERPPurchaseOrder, ERPSupplier } from '@/types/database'
import { useRouter } from 'next/navigation'

interface PurchaseOrderWithSupplier extends ERPPurchaseOrder {
  supplier?: ERPSupplier
  items_count?: number
  total_amount?: number
}

interface OrderFilters {
  search: string
  status: string
  supplier: string
  dateFrom: string
  dateTo: string
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrderWithSupplier[]>([])
  const [suppliers, setSuppliers] = useState<ERPSupplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [filters, setFilters] = useState<OrderFilters>({
    search: '',
    status: '',
    supplier: '',
    dateFrom: '',
    dateTo: ''
  })
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderWithSupplier | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()

  useEffect(() => {
    fetchOrders()
    fetchSuppliers()
  }, [page, rowsPerPage, filters])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      
      // Get company ID
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .limit(1)
        .single()
      
      if (!companies) {
        setError('No company found. Please setup your company first.')
        return
      }
      
      let query = supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .eq('company_id', companies.id)
      
      // Apply filters
      if (filters.search) {
        query = query.or(`order_number.ilike.%${filters.search}%,reference_number.ilike.%${filters.search}%`)
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      
      if (filters.supplier) {
        query = query.eq('supplier_id', filters.supplier)
      }
      
      if (filters.dateFrom) {
        query = query.gte('order_date', filters.dateFrom)
      }
      
      if (filters.dateTo) {
        query = query.lte('order_date', filters.dateTo)
      }
      
      // Get total count
      const countQuery = supabase
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companies.id)
      
      if (filters.search) {
        countQuery.or(`po_number.ilike.%${filters.search}%`)
      }
      if (filters.status) {
        countQuery.eq('status', filters.status)
      }
      if (filters.supplier) {
        countQuery.eq('supplier_id', filters.supplier)
      }
      if (filters.dateFrom) {
        countQuery.gte('order_date', filters.dateFrom)
      }
      if (filters.dateTo) {
        countQuery.lte('order_date', filters.dateTo)
      }
      
      const { count } = await countQuery
      setTotalCount(count || 0)
      
      // Get paginated results
      const { data, error } = await query
        .range(page * rowsPerPage, (page + 1) * rowsPerPage - 1)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setOrders(data || [])
      
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError('Failed to load purchase orders')
    } finally {
      setLoading(false)
    }
  }
  
  const fetchSuppliers = async () => {
    try {
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .limit(1)
        .single()
      
      if (!companies) return
      
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('company_id', companies.id)
        .eq('status', 'active')
        .order('name')
      
      if (error) throw error
      setSuppliers(data || [])
      
    } catch (err) {
      console.error('Error fetching suppliers:', err)
    }
  }
  
  const handleDeleteOrder = async () => {
    if (!selectedOrder) return
    
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', selectedOrder.id)
      
      if (error) throw error
      
      setDeleteDialogOpen(false)
      setSelectedOrder(null)
      fetchOrders()
      
    } catch (err) {
      console.error('Error deleting order:', err)
      setError('Failed to delete order')
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default'
      case 'sent': return 'info'
      case 'confirmed': return 'warning'
      case 'received': return 'primary'
      case 'completed': return 'success'
      case 'cancelled': return 'error'
      default: return 'default'
    }
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Pending />
      case 'sent': return <Email />
      case 'confirmed': return <CheckCircle />
      case 'received': return <LocalShipping />
      case 'completed': return <Receipt />
      case 'cancelled': return <Cancel />
      default: return <Pending />
    }
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  const handleFilterChange = (key: keyof OrderFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(0)
  }
  
  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      supplier: '',
      dateFrom: '',
      dateTo: ''
    })
    setPage(0)
  }

  if (loading && orders.length === 0) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Purchase Orders</Typography>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading purchase orders...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Purchase Orders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage supplier orders and procurement
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => {/* TODO: Implement export */}}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push('/erp/purchase/orders/new')}
          >
            New Purchase Order
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search orders..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="sent">Sent</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="received">Received</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Supplier</InputLabel>
                <Select
                  value={filters.supplier}
                  onChange={(e) => handleFilterChange('supplier', e.target.value)}
                  label="Supplier"
                >
                  <MenuItem value="">All Suppliers</MenuItem>
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="From Date"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="To Date"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={1}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={clearFilters}
                fullWidth
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Expected Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">
                        {order.po_number}
                      </Typography>

                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'secondary.light' }}>
                        <Business />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {order.supplier?.name || 'Unknown Supplier'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {order.supplier?.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarToday sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {formatDate(order.order_date)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      size="small"
                      color={getStatusColor(order.status) as any}
                      icon={getStatusIcon(order.status)}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AttachMoney sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="subtitle2">
                        {formatCurrency(order.total_amount || 0)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {order.expected_delivery_date ? (
                      <Typography variant="body2">
                        {formatDate(order.expected_delivery_date)}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No expected date
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => {
                        setActionMenuAnchor(e.currentTarget)
                        setSelectedOrderId(order.id)
                        setSelectedOrder(order)
                      }}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={() => setActionMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            router.push(`/erp/purchase/orders/${selectedOrderId}`)
            setActionMenuAnchor(null)
          }}
        >
          <ListItemIcon><Visibility /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            router.push(`/erp/purchase/orders/${selectedOrderId}/edit`)
            setActionMenuAnchor(null)
          }}
        >
          <ListItemIcon><Edit /></ListItemIcon>
          <ListItemText>Edit Order</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            // TODO: Implement print functionality
            setActionMenuAnchor(null)
          }}
        >
          <ListItemIcon><Print /></ListItemIcon>
          <ListItemText>Print Order</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            // TODO: Implement email functionality
            setActionMenuAnchor(null)
          }}
        >
          <ListItemIcon><Email /></ListItemIcon>
          <ListItemText>Email Supplier</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setDeleteDialogOpen(true)
            setActionMenuAnchor(null)
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><Delete color="error" /></ListItemIcon>
          <ListItemText>Delete Order</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Purchase Order</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete order "{selectedOrder?.po_number}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteOrder} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => router.push('/erp/purchase/orders/new')}
      >
        <Add />
      </Fab>
    </Box>
  )
}