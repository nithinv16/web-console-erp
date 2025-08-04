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
  Avatar,
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
  Tooltip,
  LinearProgress,
  Badge
} from '@mui/material'
import {
  Add,
  Search,
  FilterList,
  Edit,
  Delete,
  Visibility,
  MoreVert,
  Inventory,
  Warning,
  CheckCircle,
  Category,
  QrCode,
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Download,
  Upload,
  Print,
  QrCodeScanner
} from '@mui/icons-material'
import BarcodeScanner from '@/components/barcode/BarcodeScanner'
import { searchProductByBarcode } from '@/services/barcodeService'
import { validateBarcode, detectBarcodeFormat } from '@/utils/barcode'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database, ERPProduct, ERPProductCategory } from '@/types/database'
import { useRouter } from 'next/navigation'

interface ProductWithCategory extends ERPProduct {
  category?: ERPProductCategory
  current_stock?: number
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock'
}

interface ProductFilters {
  search: string
  category: string
  status: string
  stockStatus: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [categories, setCategories] = useState<ERPProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: '',
    status: '',
    stockStatus: ''
  })
  const [selectedProduct, setSelectedProduct] = useState<ProductWithCategory | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [page, rowsPerPage, filters])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      
      // Get company ID (assuming first company for now)
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
        .from('erp_products')
        .select(`
          *,
          category:product_categories(*)
        `)
        .eq('company_id', companies.id)
      
      // Apply filters
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,brand.ilike.%${filters.search}%`)
      }
      
      if (filters.category) {
        query = query.eq('category_id', filters.category)
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      
      // Get total count
      const { count } = await query.select('*', { count: 'exact', head: true })
      setTotalCount(count || 0)
      
      // Get paginated results
      const { data, error } = await query
        .range(page * rowsPerPage, (page + 1) * rowsPerPage - 1)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Enhance products with stock information
      const enhancedProducts = await Promise.all(
        (data || []).map(async (product) => {
          // Get current stock from inventory
          const { data: inventory } = await supabase
            .from('current_inventory')
            .select('quantity, available_quantity')
            .eq('product_id', product.id)
            .eq('company_id', companies.id)
          
          const totalStock = inventory?.reduce((sum, inv) => sum + inv.available_quantity, 0) || 0
          
          let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'out_of_stock'
          if (totalStock > product.min_stock_level) {
            stockStatus = 'in_stock'
          } else if (totalStock > 0) {
            stockStatus = 'low_stock'
          }
          
          return {
            ...product,
            current_stock: totalStock,
            stock_status: stockStatus
          }
        })
      )
      
      setProducts(enhancedProducts)
      
    } catch (err) {
      console.error('Error fetching products:', err)
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }
  
  const fetchCategories = async () => {
    try {
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .limit(1)
        .single()
      
      if (!companies) return
      
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('company_id', companies.id)
        .eq('status', 'active')
        .order('name')
      
      if (error) throw error
      setCategories(data || [])
      
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }
  
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return
    
    try {
      const { error } = await supabase
        .from('erp_products')
        .delete()
        .eq('id', selectedProduct.id)
      
      if (error) throw error
      
      setDeleteDialogOpen(false)
      setSelectedProduct(null)
      fetchProducts()
      
    } catch (err) {
      console.error('Error deleting product:', err)
      setError('Failed to delete product')
    }
  }
  
  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'success'
      case 'low_stock': return 'warning'
      case 'out_of_stock': return 'error'
      default: return 'default'
    }
  }
  
  const getStockStatusText = (status: string) => {
    switch (status) {
      case 'in_stock': return 'In Stock'
      case 'low_stock': return 'Low Stock'
      case 'out_of_stock': return 'Out of Stock'
      default: return 'Unknown'
    }
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }
  
  const handleFilterChange = (key: keyof ProductFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(0) // Reset to first page when filtering
  }
  
  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      status: '',
      stockStatus: ''
    })
    setPage(0)
  }

  const handleBarcodeScanned = async (barcode: string) => {
    setScanResult(barcode)
    setScannerOpen(false)
    
    // Validate barcode format
    const isValid = validateBarcode(barcode)
    const format = detectBarcodeFormat(barcode)
    
    if (!isValid) {
      setError('Invalid barcode format detected')
      setScanResult(null)
      return
    }
    
    try {
      // Get company ID
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .limit(1)
        .single()
      
      if (!companies) {
        setError('No company found')
        return
      }
      
      // Search for products using barcode service
      const { products, error: searchError } = await searchProductByBarcode(
        supabase,
        barcode,
        companies.id
      )
      
      if (searchError) {
        setError('Error searching for product: ' + searchError.message)
        return
      }
      
      if (products.length === 0) {
        setError(`No products found with barcode: ${barcode}`)
        // Still update search term to show the barcode
        setFilters(prev => ({ ...prev, search: barcode }))
      } else {
        // Update search filter with scanned barcode
        setFilters(prev => ({ ...prev, search: barcode }))
        setError(null)
      }
    } catch (err) {
      console.error('Error in barcode search:', err)
      setError('Failed to search for product')
    }
    
    setPage(0)
    
    // Show scan result temporarily
    setTimeout(() => {
      setScanResult(null)
    }, 5000)
  }

  if (loading && products.length === 0) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Products</Typography>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading products...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Products
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your product catalog and inventory
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<QrCodeScanner />}
            onClick={() => setScannerOpen(true)}
          >
            Scan Barcode
          </Button>
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
            onClick={() => router.push('/erp/inventory/products/new')}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {scanResult && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Barcode scanned: {scanResult} - Searching products...
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search products..."
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
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Stock Status</InputLabel>
                <Select
                  value={filters.stockStatus}
                  onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
                  label="Stock Status"
                >
                  <MenuItem value="">All Stock</MenuItem>
                  <MenuItem value="in_stock">In Stock</MenuItem>
                  <MenuItem value="low_stock">Low Stock</MenuItem>
                  <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        src={product.images?.[0]}
                        sx={{ mr: 2, bgcolor: 'primary.light' }}
                      >
                        <Inventory />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {product.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {product.brand}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <QrCode sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {product.sku}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {product.category ? (
                      <Chip
                        label={product.category.name}
                        size="small"
                        variant="outlined"
                        icon={<Category />}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No category
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">
                        {formatCurrency(product.selling_price || 0)}
                      </Typography>
                      {product.cost_price && (
                        <Typography variant="body2" color="text.secondary">
                          Cost: {formatCurrency(product.cost_price)}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        {product.current_stock || 0}
                      </Typography>
                      <Chip
                        label={getStockStatusText(product.stock_status || 'out_of_stock')}
                        size="small"
                        color={getStockStatusColor(product.stock_status || 'out_of_stock') as any}
                        icon={
                          product.stock_status === 'low_stock' ? <Warning /> :
                          product.stock_status === 'in_stock' ? <CheckCircle /> :
                          <Warning />
                        }
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={product.status}
                      size="small"
                      color={product.status === 'active' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => {
                        setActionMenuAnchor(e.currentTarget)
                        setSelectedProductId(product.id)
                        setSelectedProduct(product)
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
            router.push(`/erp/inventory/products/${selectedProductId}`)
            setActionMenuAnchor(null)
          }}
        >
          <ListItemIcon><Visibility /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            router.push(`/erp/inventory/products/${selectedProductId}/edit`)
            setActionMenuAnchor(null)
          }}
        >
          <ListItemIcon><Edit /></ListItemIcon>
          <ListItemText>Edit Product</ListItemText>
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
          <ListItemText>Delete Product</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteProduct} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => router.push('/erp/inventory/products/new')}
      >
        <Add />
      </Fab>

      {/* Barcode Scanner */}
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScanned}
        title="Scan Product Barcode"
      />
    </Box>
  )
}