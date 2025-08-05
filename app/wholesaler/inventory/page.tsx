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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  MenuItem as MenuItemComponent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Paper,
  Chip,
  Avatar,
  Tooltip,
  Badge
} from '@mui/material'
import {
  Search,
  FilterList,
  MoreVert,
  Add,
  Edit,
  Delete,
  Visibility,
  Warning,
  CheckCircle,
  Cancel,
  ArrowBack,
  Refresh,
  Inventory2,
  TrendingUp,
  TrendingDown,
  AttachMoney
} from '@mui/icons-material'
import { useAuth } from '../../../contexts/AuthContext'
import { createClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  description: string
  category: string
  price: number
  unit: string
  stock_available: number
  min_quantity: number
  max_quantity: number | null
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface StockUpdateData {
  product_id: string
  old_stock: number
  new_stock: number
  reason: string
}

const categories = [
  'All Categories',
  'Fruits & Vegetables',
  'Grains & Cereals',
  'Dairy Products',
  'Meat & Poultry',
  'Seafood',
  'Spices & Condiments',
  'Beverages',
  'Snacks & Confectionery',
  'Bakery Items',
  'Frozen Foods',
  'Canned & Packaged Foods',
  'Personal Care',
  'Household Items',
  'Other'
]

const stockFilters = [
  { value: 'all', label: 'All Products' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
  { value: 'inactive', label: 'Inactive' }
]

export default function Inventory() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All Categories')
  const [stockFilter, setStockFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [stockUpdateOpen, setStockUpdateOpen] = useState(false)
  const [stockUpdateData, setStockUpdateData] = useState<StockUpdateData>({
    product_id: '',
    old_stock: 0,
    new_stock: 0,
    reason: ''
  })
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' })

  const supabase = createClient()

  const fetchProducts = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching products:', error)
        setSnackbar({
          open: true,
          message: 'Error fetching products',
          severity: 'error'
        })
        return
      }

      setProducts(data || [])
      setFilteredProducts(data || [])
    } catch (error) {
      console.error('Error in fetchProducts:', error)
      setSnackbar({
        open: true,
        message: 'Error fetching products',
        severity: 'error'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchProducts()
    }
  }, [user?.id])

  useEffect(() => {
    let filtered = products

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply category filter
    if (categoryFilter !== 'All Categories') {
      filtered = filtered.filter(product => product.category === categoryFilter)
    }

    // Apply stock filter
    switch (stockFilter) {
      case 'in_stock':
        filtered = filtered.filter(product => product.stock_available > product.min_quantity && product.is_active)
        break
      case 'low_stock':
        filtered = filtered.filter(product => product.stock_available <= product.min_quantity && product.stock_available > 0 && product.is_active)
        break
      case 'out_of_stock':
        filtered = filtered.filter(product => product.stock_available === 0 && product.is_active)
        break
      case 'inactive':
        filtered = filtered.filter(product => !product.is_active)
        break
    }

    setFilteredProducts(filtered)
    setPage(0)
  }, [searchQuery, categoryFilter, stockFilter, products])

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, product: Product) => {
    setMenuAnchor(event.currentTarget)
    setSelectedProduct(product)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setSelectedProduct(null)
  }

  const handleEditProduct = () => {
    if (selectedProduct) {
      router.push(`/wholesaler/products/edit/${selectedProduct.id}`)
    }
    handleMenuClose()
  }

  const handleUpdateStock = () => {
    if (selectedProduct) {
      setStockUpdateData({
        product_id: selectedProduct.id,
        old_stock: selectedProduct.stock_available,
        new_stock: selectedProduct.stock_available,
        reason: ''
      })
      setStockUpdateOpen(true)
    }
    handleMenuClose()
  }

  const handleToggleStatus = async () => {
    if (!selectedProduct) return

    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          is_active: !selectedProduct.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProduct.id)

      if (error) {
        console.error('Error updating product status:', error)
        setSnackbar({
          open: true,
          message: 'Error updating product status',
          severity: 'error'
        })
        return
      }

      setSnackbar({
        open: true,
        message: `Product ${selectedProduct.is_active ? 'deactivated' : 'activated'} successfully`,
        severity: 'success'
      })
      
      fetchProducts(true)
    } catch (error) {
      console.error('Error in handleToggleStatus:', error)
      setSnackbar({
        open: true,
        message: 'Error updating product status',
        severity: 'error'
      })
    }
    handleMenuClose()
  }

  const handleDeleteProduct = () => {
    setDeleteConfirmOpen(true)
    handleMenuClose()
  }

  const confirmDeleteProduct = async () => {
    if (!selectedProduct) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', selectedProduct.id)

      if (error) {
        console.error('Error deleting product:', error)
        setSnackbar({
          open: true,
          message: 'Error deleting product',
          severity: 'error'
        })
        return
      }

      setSnackbar({
        open: true,
        message: 'Product deleted successfully',
        severity: 'success'
      })
      
      fetchProducts(true)
    } catch (error) {
      console.error('Error in confirmDeleteProduct:', error)
      setSnackbar({
        open: true,
        message: 'Error deleting product',
        severity: 'error'
      })
    }
    setDeleteConfirmOpen(false)
  }

  const handleStockUpdate = async () => {
    if (!stockUpdateData.reason.trim()) {
      setSnackbar({
        open: true,
        message: 'Please provide a reason for stock update',
        severity: 'error'
      })
      return
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          stock_available: stockUpdateData.new_stock,
          updated_at: new Date().toISOString()
        })
        .eq('id', stockUpdateData.product_id)

      if (error) {
        console.error('Error updating stock:', error)
        setSnackbar({
          open: true,
          message: 'Error updating stock',
          severity: 'error'
        })
        return
      }

      // Log stock update history (you can create a separate table for this)
      const { error: historyError } = await supabase
        .from('stock_history')
        .insert({
          product_id: stockUpdateData.product_id,
          old_stock: stockUpdateData.old_stock,
          new_stock: stockUpdateData.new_stock,
          reason: stockUpdateData.reason,
          updated_by: user?.id,
          created_at: new Date().toISOString()
        })

      if (historyError) {
        console.warn('Error logging stock history:', historyError)
      }

      setSnackbar({
        open: true,
        message: 'Stock updated successfully',
        severity: 'success'
      })
      
      setStockUpdateOpen(false)
      fetchProducts(true)
    } catch (error) {
      console.error('Error in handleStockUpdate:', error)
      setSnackbar({
        open: true,
        message: 'Error updating stock',
        severity: 'error'
      })
    }
  }

  const getStockStatus = (product: Product) => {
    if (!product.is_active) {
      return { label: 'Inactive', color: 'default' as const, icon: <Cancel /> }
    }
    if (product.stock_available === 0) {
      return { label: 'Out of Stock', color: 'error' as const, icon: <Warning /> }
    }
    if (product.stock_available <= product.min_quantity) {
      return { label: 'Low Stock', color: 'warning' as const, icon: <Warning /> }
    }
    return { label: 'In Stock', color: 'success' as const, icon: <CheckCircle /> }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const getInventoryStats = () => {
    const totalProducts = products.length
    const activeProducts = products.filter(p => p.is_active).length
    const lowStockProducts = products.filter(p => p.stock_available <= p.min_quantity && p.stock_available > 0 && p.is_active).length
    const outOfStockProducts = products.filter(p => p.stock_available === 0 && p.is_active).length
    const totalValue = products.reduce((sum, p) => sum + (p.stock_available * p.price), 0)

    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalValue
    }
  }

  const stats = getInventoryStats()

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
            Inventory Management
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => fetchProducts(true)} disabled={refreshing}>
              {refreshing ? <CircularProgress size={20} /> : <Refresh />}
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push('/wholesaler/products/add')}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Products
                  </Typography>
                  <Typography variant="h5">
                    {stats.totalProducts}
                  </Typography>
                </Box>
                <Inventory2 sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Products
                  </Typography>
                  <Typography variant="h5">
                    {stats.activeProducts}
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Low Stock
                  </Typography>
                  <Typography variant="h5">
                    <Badge badgeContent={stats.lowStockProducts} color="warning">
                      {stats.lowStockProducts}
                    </Badge>
                  </Typography>
                </Box>
                <Warning sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Out of Stock
                  </Typography>
                  <Typography variant="h5">
                    <Badge badgeContent={stats.outOfStockProducts} color="error">
                      {stats.outOfStockProducts}
                    </Badge>
                  </Typography>
                </Box>
                <Cancel sx={{ fontSize: 40, color: 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Value
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(stats.totalValue)}
                  </Typography>
                </Box>
                <AttachMoney sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search products..."
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
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Stock Status</InputLabel>
              <Select
                value={stockFilter}
                label="Stock Status"
                onChange={(e) => setStockFilter(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <FilterList />
                  </InputAdornment>
                }
              >
                {stockFilters.map((filter) => (
                  <MenuItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Products Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="center">Price</TableCell>
                  <TableCell align="center">Stock</TableCell>
                  <TableCell align="center">Min Qty</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Value</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((product) => {
                    const stockStatus = getStockStatus(product)
                    return (
                      <TableRow key={product.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              src={product.image_url || undefined}
                              sx={{ bgcolor: 'grey.100' }}
                            >
                              <Inventory2 />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2">
                                {product.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {product.unit}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={product.category} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="h6">
                            {formatCurrency(product.price)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography 
                            variant="h6" 
                            color={product.stock_available <= product.min_quantity ? 'error' : 'inherit'}
                          >
                            {product.stock_available}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {product.min_quantity}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={stockStatus.label}
                            color={stockStatus.color}
                            size="small"
                            icon={stockStatus.icon}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {formatCurrency(product.stock_available * product.price)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            onClick={(e) => handleMenuOpen(e, product)}
                            size="small"
                          >
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredProducts.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10))
              setPage(0)
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
        <MenuItemComponent onClick={handleEditProduct}>
          <Edit sx={{ mr: 1 }} />
          Edit Product
        </MenuItemComponent>
        <MenuItemComponent onClick={handleUpdateStock}>
          <TrendingUp sx={{ mr: 1 }} />
          Update Stock
        </MenuItemComponent>
        <MenuItemComponent onClick={handleToggleStatus}>
          {selectedProduct?.is_active ? (
            <><Cancel sx={{ mr: 1 }} />Deactivate</>
          ) : (
            <><CheckCircle sx={{ mr: 1 }} />Activate</>
          )}
        </MenuItemComponent>
        <MenuItemComponent onClick={handleDeleteProduct} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete Product
        </MenuItemComponent>
      </Menu>

      {/* Stock Update Dialog */}
      <Dialog
        open={stockUpdateOpen}
        onClose={() => setStockUpdateOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Update Stock - {selectedProduct?.name}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Current Stock"
                value={stockUpdateData.old_stock}
                disabled
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="New Stock"
                type="number"
                value={stockUpdateData.new_stock}
                onChange={(e) => setStockUpdateData({
                  ...stockUpdateData,
                  new_stock: parseInt(e.target.value) || 0
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason for Update"
                multiline
                rows={3}
                value={stockUpdateData.reason}
                onChange={(e) => setStockUpdateData({
                  ...stockUpdateData,
                  reason: e.target.value
                })}
                placeholder="e.g., New stock received, Damaged goods removed, etc."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStockUpdateOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleStockUpdate} variant="contained">
            Update Stock
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </Button>
          <Button onClick={confirmDeleteProduct} color="error" variant="contained">
            Delete
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