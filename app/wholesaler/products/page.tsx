'use client'
import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Fab,
  Avatar
} from '@mui/material'
import {
  Search,
  Add,
  Edit,
  Delete,
  Visibility,
  MoreVert,
  ArrowBack,
  Inventory,
  Category,
  AttachMoney,
  Warning,
  CheckCircle,
  Refresh
} from '@mui/icons-material'
import { useAuth } from '../../../contexts/AuthContext'
import { createClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { MainLayout } from '../../../components/layout'
import { Product } from '../../../types'

export default function WholesalerProducts() {
  const { user } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' })

  const supabase = createClient()

  useEffect(() => {
    if (!user?.id) return
    fetchProducts()
  }, [user?.id])

  useEffect(() => {
    filterProducts()
  }, [products, searchQuery])

  const fetchProducts = async () => {
    try {
      setLoading(true)
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
    } catch (error) {
      console.error('Error in fetchProducts:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filterProducts = () => {
    let filtered = products

    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredProducts(filtered)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchProducts()
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, product: Product) => {
    setMenuAnchor(event.currentTarget)
    setSelectedProduct(product)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setSelectedProduct(null)
  }

  const handleDeleteProduct = async () => {
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
      
      fetchProducts()
      setDeleteDialog(false)
    } catch (error) {
      console.error('Error in handleDeleteProduct:', error)
    }
  }

  const toggleProductStatus = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          is_active: !product.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id)

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
        message: `Product ${!product.is_active ? 'activated' : 'deactivated'} successfully`,
        severity: 'success'
      })
      
      fetchProducts()
    } catch (error) {
      console.error('Error in toggleProductStatus:', error)
    }
  }

  const getStockStatus = (product: Product) => {
    const stockAvailable = product.stock_available || 0;
    const minOrderQuantity = product.min_order_quantity || 0;
    
    if (stockAvailable === 0) {
      return { label: 'Out of Stock', color: 'error' as const, icon: <Warning /> }
    } else if (stockAvailable <= minOrderQuantity) {
      return { label: 'Low Stock', color: 'warning' as const, icon: <Warning /> }
    } else {
      return { label: 'In Stock', color: 'success' as const, icon: <CheckCircle /> }
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading products...</Typography>
      </Box>
    )
  }

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Products Management
        </Typography>
        <IconButton onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? <CircularProgress size={24} /> : <Refresh />}
        </IconButton>
      </Box>

      {/* Search and Stats */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search products by name, category, or description"
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
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'flex-end' }}>
              <Typography variant="body2" color="text.secondary">
                Total Products: {filteredProducts.length}
              </Typography>
              <Typography variant="body2" color="success.main">
                Active: {filteredProducts.filter(p => p.is_active).length}
              </Typography>
              <Typography variant="body2" color="warning.main">
                Low Stock: {filteredProducts.filter(p => (p.stock_available || 0) <= (p.min_order_quantity || 0) && (p.stock_available || 0) > 0).length}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Inventory sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No products found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {searchQuery 
              ? "No products match your search criteria"
              : "You haven't added any products yet"
            }
          </Typography>
          <Button 
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push('/wholesaler/products/add')}
          >
            Add Your First Product
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product)
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: product.is_active ? 1 : 0.6
                  }}
                >
                  <CardMedia
                    component="div"
                    sx={{ 
                      height: 200,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.100'
                    }}
                  >
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover' 
                        }}
                      />
                    ) : (
                      <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
                        <Inventory sx={{ fontSize: 40 }} />
                      </Avatar>
                    )}
                  </CardMedia>
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
                        {product.name}
                      </Typography>
                      <IconButton 
                        size="small"
                        onClick={(e) => handleMenuOpen(e, product)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {product.description || 'No description'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Category fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {product.category}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <AttachMoney fontSize="small" color="action" />
                      <Typography variant="h6" color="primary">
                        ₹{product.price}/{product.unit}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2">
                        Stock: {product.stock_available} {product.unit}
                      </Typography>
                      <Chip 
                        label={stockStatus.label}
                        color={stockStatus.color}
                        size="small"
                        icon={stockStatus.icon}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip 
                        label={product.is_active ? 'Active' : 'Inactive'}
                        color={product.is_active ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

      {/* Floating Action Button */}
      <Fab 
        color="primary" 
        aria-label="add product"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => router.push('/wholesaler/products/add')}
      >
        <Add />
      </Fab>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedProduct) {
            router.push(`/wholesaler/products/${selectedProduct.id}`)
          }
          handleMenuClose()
        }}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedProduct) {
            router.push(`/wholesaler/products/edit/${selectedProduct.id}`)
          }
          handleMenuClose()
        }}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Product</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedProduct) {
            toggleProductStatus(selectedProduct)
          }
          handleMenuClose()
        }}>
          <ListItemIcon>
            {selectedProduct?.is_active ? <Warning fontSize="small" /> : <CheckCircle fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {selectedProduct?.is_active ? 'Deactivate' : 'Activate'}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          setDeleteDialog(true)
          handleMenuClose()
        }}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete Product</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteProduct} color="error" variant="contained">
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
    </MainLayout>
  )
}