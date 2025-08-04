'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Menu,
  ListItemIcon,
  ListItemText,
  Fab,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  Warning,
  CheckCircle,
  Inventory2
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { createClient } from '../../lib/supabase';
import { Product } from '../../types';
import { toast } from 'react-hot-toast';
import { MainLayout } from '../../components/Layout';

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  stock_available: number;
  unit: string;
  min_order_quantity: number;
  status: 'active' | 'inactive';
}

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  category: '',
  price: 0,
  stock_available: 0,
  unit: 'piece',
  min_order_quantity: 1,
  status: 'active'
};

const categories = [
  'Grains & Cereals',
  'Pulses & Legumes',
  'Spices & Seasonings',
  'Oils & Fats',
  'Dairy Products',
  'Beverages',
  'Snacks & Confectionery',
  'Personal Care',
  'Household Items',
  'Other'
];

const units = ['piece', 'kg', 'gram', 'liter', 'ml', 'packet', 'box', 'dozen'];

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!formData.category) {
      toast.error('Category is required');
      return;
    }
    if (formData.price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }
    if (formData.stock_available < 0) {
      toast.error('Stock quantity cannot be negative');
      return;
    }
    if (formData.min_order_quantity <= 0) {
      toast.error('Minimum order quantity must be greater than 0');
      return;
    }

    try {
      const productData = {
        ...formData,
        seller_id: user.id,
        updated_at: new Date().toISOString()
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        toast.success('Product updated successfully');
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select();

        if (error) {
          console.error('Supabase error:', error);
          if (error.code === '23505') {
            toast.error('A product with this name already exists');
          } else if (error.code === '23502') {
            toast.error('Missing required field: ' + error.details);
          } else {
            toast.error('Error creating product: ' + (error.message || 'Unknown error'));
          }
          return;
        }
        toast.success('Product added successfully');
      }

      setOpenDialog(false);
      setEditingProduct(null);
      setFormData(initialFormData);
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error('Error creating product: ' + (error.message || 'Unknown error'));
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category,
      price: product.price,
      stock_available: product.stock_available || 0,
      unit: product.unit,
      min_order_quantity: product.min_order_quantity || 1,
      status: product.status
    });
    setOpenDialog(true);
    handleMenuClose();
  };

  const handleDelete = async (product: Product) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
    handleMenuClose();
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      const newStatus = product.status === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('id', product.id);

      if (error) throw error;
      toast.success(`Product ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product status:', error);
      toast.error('Failed to update product status');
    }
    handleMenuClose();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, product: Product) => {
    setAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProduct(null);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && product.status === 'active') ||
                         (statusFilter === 'inactive' && product.status === 'inactive') ||
                         (statusFilter === 'low_stock' && (product.stock_available || 0) < 10);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'error' as const };
    if (quantity < 10) return { label: 'Low Stock', color: 'warning' as const };
    return { label: 'In Stock', color: 'success' as const };
  };

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Products
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your product inventory
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
            size="large"
          >
            Add Product
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Products
                    </Typography>
                    <Typography variant="h4">
                      {products.length}
                    </Typography>
                  </Box>
                  <Inventory2 color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Active Products
                    </Typography>
                    <Typography variant="h4">
                      {products.filter(p => p.status === 'active').length}
                    </Typography>
                  </Box>
                  <CheckCircle color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Low Stock
                    </Typography>
                    <Typography variant="h4">
                      {products.filter(p => (p.stock_available || 0) < 10).length}
                    </Typography>
                  </Box>
                  <Warning color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Out of Stock
                    </Typography>
                    <Typography variant="h4">
                      {products.filter(p => (p.stock_available || 0) === 0).length}
                    </Typography>
                  </Box>
                  <Warning color="error" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search products..."
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
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={categoryFilter}
                    label="Category"
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <MenuItem value="">All Categories</MenuItem>
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
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Products</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="low_stock">Low Stock</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ p: 3 }}>
                <LinearProgress />
                <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading products...</Typography>
              </Box>
            ) : filteredProducts.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <Inventory2 sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No products found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {products.length === 0 ? 'Start by adding your first product' : 'Try adjusting your filters'}
                </Typography>
                {products.length === 0 && (
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setOpenDialog(true)}
                  >
                    Add Product
                  </Button>
                )}
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Stock</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.stock_available || 0);
                      return (
                        <TableRow key={product.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar
                                src={product.image_url}
                                sx={{ width: 40, height: 40 }}
                              >
                                {product.name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2">
                                  {product.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {product.description}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={product.category} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2">
                              ₹{product.price.toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              per {product.unit}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle2">
                                {product.stock_available || 0} {product.unit}s
                              </Typography>
                              <Chip
                                label={stockStatus.label}
                                size="small"
                                color={stockStatus.color}
                                variant="outlined"
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={product.status === 'active' ? 'Active' : 'Inactive'}
                              size="small"
                              color={product.status === 'active' ? 'success' : 'default'}
                              variant={product.status === 'active' ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              onClick={(e) => handleMenuOpen(e, product)}
                            >
                              <MoreVert />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => selectedProduct && handleEdit(selectedProduct)}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => selectedProduct && handleToggleStatus(selectedProduct)}>
            <ListItemIcon>
              {selectedProduct?.status === 'active' ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
            </ListItemIcon>
            <ListItemText>
              {selectedProduct?.status === 'active' ? 'Deactivate' : 'Activate'}
            </ListItemText>
          </MenuItem>
          <MenuItem onClick={() => selectedProduct && handleDelete(selectedProduct)}>
            <ListItemIcon>
              <Delete fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>

        {/* Add/Edit Product Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Product Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    label="Category"
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Stock Quantity"
                  type="number"
                  value={formData.stock_available}
                      onChange={(e) => setFormData({ ...formData, stock_available: Number(e.target.value) })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Unit</InputLabel>
                  <Select
                    value={formData.unit}
                    label="Unit"
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    {units.map((unit) => (
                      <MenuItem key={unit} value={unit}>
                        {unit}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Minimum Order Quantity"
                  type="number"
                  value={formData.min_order_quantity}
                  onChange={(e) => setFormData({ ...formData, min_order_quantity: Number(e.target.value) })}
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingProduct ? 'Update' : 'Add'} Product
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
}