'use client'
import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Paper,
  Tooltip
} from '@mui/material'
import {
  Search,
  MoreVert,
  Person,
  Business,
  Phone,
  Email,
  LocationOn,
  ShoppingCart,
  AttachMoney,
  ArrowBack,
  Refresh,
  Visibility,
  Block,
  CheckCircle,
  People
} from '@mui/icons-material'
import { useAuth } from '../../../contexts/AuthContext'
import { createClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

interface Customer {
  id: string
  business_name: string
  owner_name: string
  email: string
  phone: string
  address: any
  created_at: string
  is_active: boolean
  total_orders: number
  total_spent: number
  last_order_date: string | null
}

export default function Customers() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' })

  const supabase = createClient()

  const fetchCustomers = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      // Fetch all customers who have placed orders with this seller
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          retailer_id,
          total_amount,
          created_at,
          profiles!orders_retailer_id_fkey(
            id,
            business_name,
            owner_name,
            email,
            phone,
            address,
            created_at,
            is_active
          )
        `)
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false })

      if (ordersError) {
        console.error('Error fetching customers:', ordersError)
        setSnackbar({
          open: true,
          message: 'Error fetching customers',
          severity: 'error'
        })
        return
      }

      // Process customer data
      const customerMap = new Map<string, Customer>()
      
      ordersData?.forEach(order => {
        const profile = order.profiles
        const customerId = profile.id
        
        if (customerMap.has(customerId)) {
          const existing = customerMap.get(customerId)!
          customerMap.set(customerId, {
            ...existing,
            total_orders: existing.total_orders + 1,
            total_spent: existing.total_spent + (order.total_amount || 0),
            last_order_date: order.created_at > (existing.last_order_date || '') ? order.created_at : existing.last_order_date
          })
        } else {
          customerMap.set(customerId, {
            id: customerId,
            business_name: profile.business_name || '',
            owner_name: profile.owner_name || '',
            email: profile.email || '',
            phone: profile.phone || '',
            address: profile.address,
            created_at: profile.created_at,
            is_active: profile.is_active ?? true,
            total_orders: 1,
            total_spent: order.total_amount || 0,
            last_order_date: order.created_at
          })
        }
      })

      const customersArray = Array.from(customerMap.values())
        .sort((a, b) => b.total_spent - a.total_spent)
      
      setCustomers(customersArray)
      setFilteredCustomers(customersArray)
    } catch (error) {
      console.error('Error in fetchCustomers:', error)
      setSnackbar({
        open: true,
        message: 'Error fetching customers',
        severity: 'error'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchCustomers()
    }
  }, [user?.id])

  useEffect(() => {
    const filtered = customers.filter(customer =>
      customer.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
    )
    setFilteredCustomers(filtered)
    setTimeout(() => setPage(0), 0)
  }, [searchQuery, customers])

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, customer: Customer) => {
    setMenuAnchor(event.currentTarget)
    setSelectedCustomer(customer)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setSelectedCustomer(null)
  }

  const handleViewDetails = () => {
    setDetailsOpen(true)
    handleMenuClose()
  }

  const handleToggleStatus = async () => {
    if (!selectedCustomer) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !selectedCustomer.is_active })
        .eq('id', selectedCustomer.id)

      if (error) {
        console.error('Error updating customer status:', error)
        setSnackbar({
          open: true,
          message: 'Error updating customer status',
          severity: 'error'
        })
        return
      }

      setSnackbar({
        open: true,
        message: `Customer ${selectedCustomer.is_active ? 'blocked' : 'activated'} successfully`,
        severity: 'success'
      })
      
      fetchCustomers(true)
    } catch (error) {
      console.error('Error in handleToggleStatus:', error)
      setSnackbar({
        open: true,
        message: 'Error updating customer status',
        severity: 'error'
      })
    }
    handleMenuClose()
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

  const formatAddress = (address: any) => {
    if (!address) return 'No address'
    if (typeof address === 'string') return address
    if (typeof address === 'object') {
      const { street, city, state, pincode } = address
      return [street, city, state, pincode].filter(Boolean).join(', ')
    }
    return 'No address'
  }

  const getCustomerInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4">
            Customers
          </Typography>
        </Box>
        <Tooltip title="Refresh Data">
          <IconButton onClick={() => fetchCustomers(true)} disabled={refreshing}>
            {refreshing ? <CircularProgress size={20} /> : <Refresh />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Customers
                  </Typography>
                  <Typography variant="h5">
                    {customers.length}
                  </Typography>
                </Box>
                <People sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Customers
                  </Typography>
                  <Typography variant="h5">
                    {customers.filter(c => c.is_active).length}
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Orders
                  </Typography>
                  <Typography variant="h5">
                    {customers.reduce((sum, c) => sum + c.total_orders, 0)}
                  </Typography>
                </Box>
                <ShoppingCart sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(customers.reduce((sum, c) => sum + c.total_spent, 0))}
                  </Typography>
                </Box>
                <AttachMoney sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search customers by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Customers Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell align="center">Orders</TableCell>
                  <TableCell align="center">Total Spent</TableCell>
                  <TableCell align="center">Last Order</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCustomers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((customer) => (
                    <TableRow key={customer.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {getCustomerInitials(customer.business_name || customer.owner_name)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {customer.business_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {customer.owner_name}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Email sx={{ fontSize: 16 }} />
                            {customer.email}
                          </Typography>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <Phone sx={{ fontSize: 16 }} />
                            {customer.phone}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOn sx={{ fontSize: 16 }} />
                          {formatAddress(customer.address)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6">
                          {customer.total_orders}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6" color="primary">
                          {formatCurrency(customer.total_spent)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {customer.last_order_date ? formatDate(customer.last_order_date) : 'Never'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={customer.is_active ? 'Active' : 'Blocked'}
                          color={customer.is_active ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, customer)}
                          size="small"
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
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredCustomers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              const newRowsPerPage = parseInt(e.target.value, 10)
              setRowsPerPage(newRowsPerPage)
              setTimeout(() => setPage(0), 0)
            }}
          />
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleToggleStatus}>
          {selectedCustomer?.is_active ? (
            <><Block sx={{ mr: 1 }} />Block Customer</>
          ) : (
            <><CheckCircle sx={{ mr: 1 }} />Activate Customer</>
          )}
        </MenuItem>
      </Menu>

      {/* Customer Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Customer Details
        </DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Business Information
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 60, height: 60 }}>
                        {getCustomerInitials(selectedCustomer.business_name || selectedCustomer.owner_name)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {selectedCustomer.business_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Owner: {selectedCustomer.owner_name}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Email sx={{ fontSize: 16 }} />
                        {selectedCustomer.email}
                      </Typography>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Phone sx={{ fontSize: 16 }} />
                        {selectedCustomer.phone}
                      </Typography>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn sx={{ fontSize: 16 }} />
                        {formatAddress(selectedCustomer.address)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Order Statistics
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {selectedCustomer.total_orders}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Orders
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="success.main">
                            {formatCurrency(selectedCustomer.total_spent)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Spent
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Last Order: {selectedCustomer.last_order_date ? formatDate(selectedCustomer.last_order_date) : 'Never'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Customer Since: {formatDate(selectedCustomer.created_at)}
                          </Typography>
                          <Chip
                            label={selectedCustomer.is_active ? 'Active' : 'Blocked'}
                            color={selectedCustomer.is_active ? 'success' : 'error'}
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}