'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  LinearProgress,
  Avatar,
  Alert,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import {
  Search,
  FilterList,
  Edit,
  Add,
  Remove,
  Inventory,
  Warning,
  TrendingUp,
  TrendingDown,
  Refresh,
  Download,
  Upload
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { createClient } from '../../lib/supabase';
import { Product } from '../../types';
import { toast } from 'react-hot-toast';
import { MainLayout } from '../../components/Layout';

interface InventoryStats {
  totalProducts: number;
  totalValue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

interface StockAdjustment {
  productId: string;
  productName: string;
  currentStock: number;
  adjustment: number;
  reason: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`inventory-tabpanel-${index}`}
      aria-labelledby={`inventory-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const getStockStatus = (stock: number) => {
  if (stock === 0) return { label: 'Out of Stock', color: 'error' as const };
  if (stock < 10) return { label: 'Low Stock', color: 'warning' as const };
  if (stock < 50) return { label: 'Medium Stock', color: 'info' as const };
  return { label: 'In Stock', color: 'success' as const };
};

export default function InventoryPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [stockAdjustment, setStockAdjustment] = useState<StockAdjustment>({
    productId: '',
    productName: '',
    currentStock: 0,
    adjustment: 0,
    reason: ''
  });
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    totalValue: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0
  });
  const [categories, setCategories] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, stockFilter, categoryFilter]);

  const fetchProducts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user.id)
        .order('name');

      if (error) throw error;

      const productsData: Product[] = data?.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: product.price,
        category: product.category,
        stock: product.stock_available || 0,
        unit: product.unit || 'piece',
        imageUrl: product.image_url || '',
        isActive: product.is_active ?? true,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      })) || [];

      setProducts(productsData);
      calculateStats(productsData);
      extractCategories(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (productsData: Product[]) => {
    const stats = {
      totalProducts: productsData.length,
      totalValue: productsData.reduce((sum, p) => sum + (p.price * p.stock), 0),
      lowStockProducts: productsData.filter(p => p.stock > 0 && p.stock < 10).length,
      outOfStockProducts: productsData.filter(p => p.stock === 0).length
    };
    setStats(stats);
  };

  const extractCategories = (productsData: Product[]) => {
    const uniqueCategories = Array.from(new Set(productsData.map(p => p.category)));
    setCategories(uniqueCategories);
  };

  const filterProducts = () => {
    let filtered = products;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by stock status
    if (stockFilter !== 'all') {
      switch (stockFilter) {
        case 'in_stock':
          filtered = filtered.filter(p => p.stock >= 50);
          break;
        case 'low_stock':
          filtered = filtered.filter(p => p.stock > 0 && p.stock < 10);
          break;
        case 'out_of_stock':
          filtered = filtered.filter(p => p.stock === 0);
          break;
        case 'medium_stock':
          filtered = filtered.filter(p => p.stock >= 10 && p.stock < 50);
          break;
      }
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    setFilteredProducts(filtered);
  };

  const handleStockAdjustment = (product: Product) => {
    setSelectedProduct(product);
    setStockAdjustment({
      productId: product.id,
      productName: product.name,
      currentStock: product.stock,
      adjustment: 0,
      reason: ''
    });
    setAdjustmentOpen(true);
  };

  const handleSaveAdjustment = async () => {
    if (!stockAdjustment.reason.trim()) {
      toast.error('Please provide a reason for the adjustment');
      return;
    }

    try {
      const newStock = stockAdjustment.currentStock + stockAdjustment.adjustment;
      
      if (newStock < 0) {
        toast.error('Stock cannot be negative');
        return;
      }

      const { error } = await supabase
        .from('products')
        .update({ 
          stock_available: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', stockAdjustment.productId);

      if (error) throw error;

      // In a real app, you'd also log this adjustment to a stock_adjustments table
      toast.success('Stock adjusted successfully');
      setAdjustmentOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error('Failed to adjust stock');
    }
  };

  const handleQuickAdjustment = async (productId: string, adjustment: number) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const newStock = product.stock + adjustment;
      
      if (newStock < 0) {
        toast.error('Stock cannot be negative');
        return;
      }

      const { error } = await supabase
        .from('products')
        .update({ 
          stock_available: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;

      toast.success(`Stock ${adjustment > 0 ? 'increased' : 'decreased'} successfully`);
      fetchProducts();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error('Failed to adjust stock');
    }
  };

  const getLowStockProducts = () => {
    return products.filter(p => p.stock > 0 && p.stock < 10);
  };

  const getOutOfStockProducts = () => {
    return products.filter(p => p.stock === 0);
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ p: 3 }}>
          <LinearProgress />
          <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading inventory...</Typography>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Inventory Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Monitor and manage your product inventory
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
            >
              Export
            </Button>
            <Button
              variant="outlined"
              startIcon={<Upload />}
            >
              Import
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchProducts}
            >
              Refresh
            </Button>
          </Box>
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
                      {stats.totalProducts}
                    </Typography>
                  </Box>
                  <Inventory color="primary" sx={{ fontSize: 40 }} />
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
                      Total Value
                    </Typography>
                    <Typography variant="h4">
                      ₹{stats.totalValue.toLocaleString()}
                    </Typography>
                  </Box>
                  <TrendingUp color="success" sx={{ fontSize: 40 }} />
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
                    <Typography variant="h4" color="warning.main">
                      {stats.lowStockProducts}
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
                    <Typography variant="h4" color="error.main">
                      {stats.outOfStockProducts}
                    </Typography>
                  </Box>
                  <TrendingDown color="error" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label="All Products" />
              <Tab 
                label={
                  <Badge badgeContent={stats.lowStockProducts} color="warning">
                    Low Stock
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={stats.outOfStockProducts} color="error">
                    Out of Stock
                  </Badge>
                } 
              />
            </Tabs>
          </Box>

          {/* All Products Tab */}
          <TabPanel value={tabValue} index={0}>
            {/* Filters */}
            <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Stock Status</InputLabel>
                  <Select
                    value={stockFilter}
                    label="Stock Status"
                    onChange={(e) => setStockFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Products</MenuItem>
                    <MenuItem value="in_stock">In Stock (50+)</MenuItem>
                    <MenuItem value="medium_stock">Medium Stock (10-49)</MenuItem>
                    <MenuItem value="low_stock">Low Stock (1-9)</MenuItem>
                    <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={categoryFilter}
                    label="Category"
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {categories.map(category => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Products Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Stock</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Value</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product.stock);
                    return (
                      <TableRow key={product.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              src={product.imageUrl}
                              sx={{ width: 40, height: 40 }}
                            >
                              {product.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {product.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {product.unit}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={product.category} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            ₹{product.price.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {product.stock}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={stockStatus.label}
                            color={stockStatus.color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            ₹{(product.price * product.stock).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleQuickAdjustment(product.id, -1)}
                              disabled={product.stock === 0}
                              color="error"
                            >
                              <Remove fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleStockAdjustment(product)}
                              color="primary"
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleQuickAdjustment(product.id, 1)}
                              color="success"
                            >
                              <Add fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No products found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Low Stock Tab */}
          <TabPanel value={tabValue} index={1}>
            {getLowStockProducts().length > 0 ? (
              <>
                <Alert severity="warning" sx={{ mb: 3 }}>
                  You have {getLowStockProducts().length} products with low stock. Consider restocking soon.
                </Alert>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Current Stock</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getLowStockProducts().map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar src={product.imageUrl}>
                                {product.name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {product.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {product.category}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={product.stock}
                              color="warning"
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            ₹{product.price.toLocaleString()}
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleStockAdjustment(product)}
                            >
                              Restock
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Alert severity="success">
                Great! No products are currently low on stock.
              </Alert>
            )}
          </TabPanel>

          {/* Out of Stock Tab */}
          <TabPanel value={tabValue} index={2}>
            {getOutOfStockProducts().length > 0 ? (
              <>
                <Alert severity="error" sx={{ mb: 3 }}>
                  You have {getOutOfStockProducts().length} products that are out of stock. Restock immediately to avoid lost sales.
                </Alert>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getOutOfStockProducts().map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar src={product.imageUrl}>
                                {product.name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {product.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {product.category}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            ₹{product.price.toLocaleString()}
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              onClick={() => handleStockAdjustment(product)}
                            >
                              Restock Now
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Alert severity="success">
                Excellent! No products are currently out of stock.
              </Alert>
            )}
          </TabPanel>
        </Card>

        {/* Stock Adjustment Dialog */}
        <Dialog
          open={adjustmentOpen}
          onClose={() => setAdjustmentOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Adjust Stock - {stockAdjustment.productName}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Stock: {stockAdjustment.currentStock}
              </Typography>
              
              <TextField
                fullWidth
                label="Adjustment"
                type="number"
                value={stockAdjustment.adjustment}
                onChange={(e) => setStockAdjustment(prev => ({
                  ...prev,
                  adjustment: parseInt(e.target.value) || 0
                }))}
                helperText={`New stock will be: ${stockAdjustment.currentStock + stockAdjustment.adjustment}`}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Reason for Adjustment"
                multiline
                rows={3}
                value={stockAdjustment.reason}
                onChange={(e) => setStockAdjustment(prev => ({
                  ...prev,
                  reason: e.target.value
                }))}
                placeholder="e.g., Received new stock, Damaged goods, Inventory correction..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAdjustmentOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveAdjustment}
              disabled={!stockAdjustment.reason.trim()}
            >
              Save Adjustment
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
}