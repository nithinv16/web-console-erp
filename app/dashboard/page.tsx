'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Avatar,
  Chip,
  IconButton,
  Paper,
  LinearProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox
} from '@mui/material';
import {
  TrendingUp,
  ShoppingCart,
  Inventory,
  People,
  LocationOn,
  Phone,
  Email,
  Edit,
  Verified,
  Warning,
  Add,
  LocalShipping,
  Search,
  Close,
  Delete,
  CloudUpload,
  Business
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useOrderNotifications } from '../../contexts/OrderNotificationContext';
import { createClient } from '../../lib/supabase';
import { BusinessStats, Product, Order } from '../../types';
import { toast } from 'react-hot-toast';
import { MainLayout } from '../../components/Layout';

interface QuickAddItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  min_quantity: number;
  unit: string;
  selected?: boolean;
}

interface QuickAddProduct {
  id: string;
  brand: string;
  name: string;
  category: string;
  subcategory: string;
  selected: boolean;
  price: string;
  minQty: string;
  unit: string;
  stock?: string;
  quantities?: Array<{
    value: string;
    unit: string;
    selected: boolean;
    price: string;
  }>;
}

export default function DashboardPage() {
  const { user, sellerDetails } = useAuth();
  const { newOrdersCount } = useOrderNotifications();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickAddProducts, setQuickAddProducts] = useState<QuickAddProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    category: '',
    subcategory: '',
    price: '',
    minQty: '',
    unit: 'pcs',
    image: null as File | null,
    imagePreview: ''
  });
  const [newProductErrors, setNewProductErrors] = useState<{[key: string]: string}>({});
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchQuickAddProducts();
    }
  }, [user]);

  // Check for quickadd parameter to auto-open Quick Add modal
  useEffect(() => {
    const quickaddParam = searchParams.get('quickadd');
    if (quickaddParam === 'true') {
      setShowQuickAddModal(true);
    }
  }, [searchParams]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchBusinessStats(),
        fetchRecentOrders(),
        fetchLowStockProducts()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuickAddProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('master_products')
        .select('*');

      if (error) throw error;

      const formattedProducts: QuickAddProduct[] = data?.map(p => ({
        id: p.id.toString(),
        name: p.name,
        brand: p.brand,
        category: p.category,
        subcategory: p.subcategory,
        minQty: p.min_qty?.toString() || '1',
        selected: false,
        price: '0',
        stock: '0',
        unit: 'pcs'
      })) || [];

      setQuickAddProducts(formattedProducts);
    } catch (error) {
      console.error('Error fetching quick add products:', error);
      // If master_products table doesn't exist, use fallback data
      setQuickAddProducts([
        {
          id: '1',
          name: 'Sample Product 1',
          brand: 'Sample Brand',
          category: 'Food & Beverages',
          subcategory: 'Snacks',
          minQty: '10',
          selected: false,
          price: '0',
          stock: '0',
          unit: 'pcs'
        },
        {
          id: '2',
          name: 'Sample Product 2',
          brand: 'Sample Brand',
          category: 'Beverages',
          subcategory: 'Soft Drinks',
          minQty: '5',
          selected: false,
          price: '0',
          stock: '0',
          unit: 'pcs'
        }
      ]);
    }
  };

  const fetchBusinessStats = async () => {
    if (!user) return;

    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('seller_id', user.id);

    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', user.id);

    if (orders && products) {
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const totalRevenue = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const totalProducts = products.length;
      const lowStockProducts = products.filter(p => (p.stock_available || 0) < 10).length;

      setStats({
        totalOrders,
        pendingOrders,
        totalRevenue,
        totalProducts,
        lowStockProducts
      });
    }
  };

  const fetchRecentOrders = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        retailer:retailer_id(business_name, owner_name)
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      setRecentOrders(data);
    }
  };

  const fetchLowStockProducts = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', user.id)
      .lt('stock_available', 10)
      .order('stock_available', { ascending: true })
      .limit(5);

    if (data) {
      setLowStockProducts(data);
    }
  };

  const handleQuickAdd = async () => {
    const selectedProducts = quickAddProducts.filter(p => p.selected && parseFloat(p.price) > 0);
    
    if (selectedProducts.length === 0) {
      toast.error('Please select products and set prices');
      return;
    }

    if (!user) return;

    try {
      // Check if any products already exist in seller's inventory
      const { data: existingProducts, error: checkError } = await supabase
        .from('products')
        .select('name, brand')
        .eq('seller_id', user.id)
        .in('name', selectedProducts.map(p => p.name))
        .in('brand', selectedProducts.map(p => p.brand));

      if (checkError) throw checkError;

      // Filter out already existing products
      const existingProductKeys = existingProducts?.map(p => `${p.brand}-${p.name}`) || [];
      const newProducts = selectedProducts.filter(p => 
        !existingProductKeys.includes(`${p.brand}-${p.name}`)
      ).map(p => ({
        seller_id: user.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        subcategory: p.subcategory,
        price: parseFloat(p.price),
        min_quantity: parseInt(p.minQty),
        stock_available: parseInt(p.stock || '0'),
        status: 'active' as const,
        unit: p.unit,
        description: `Quick added ${p.name}`
      }));

      if (newProducts.length === 0) {
        toast.error('Selected products are already in your inventory');
        return;
      }

      // Insert new products into seller's inventory
      const { error: insertError } = await supabase
        .from('products')
        .insert(newProducts);

      if (insertError) throw insertError;

      toast.success(`Successfully added ${newProducts.length} products to your inventory`);
      setShowQuickAddModal(false);
      // Reset selections
      setQuickAddProducts(prev => prev.map(p => ({ ...p, selected: false, price: '0', stock: '0' })));
      fetchDashboardData();
    } catch (error) {
      console.error('Error adding products:', error);
      toast.error('Failed to add products to inventory');
    }
  };

  const getFilteredQuickAddProducts = () => {
    return quickAddProducts.filter(product => {
      const matchesSearch = searchQuery === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = !selectedCategory || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  };

  const getCategories = () => {
    const categories = new Set(quickAddProducts.map(p => p.category));
    return Array.from(categories).sort();
  };

  const validateNewProduct = () => {
    const errors: {[key: string]: string} = {};
    
    if (!newProduct.name) errors.name = 'Product name is required';
    else if (newProduct.name.length < 3) errors.name = 'Name must be at least 3 characters';
    
    if (!newProduct.brand) errors.brand = 'Brand is required';
    else if (newProduct.brand.length < 2) errors.brand = 'Brand must be at least 2 characters';
    
    if (!newProduct.category) errors.category = 'Category is required';
    if (!newProduct.subcategory) errors.subcategory = 'Subcategory is required';
    
    if (!newProduct.price) errors.price = 'Price is required';
    else if (isNaN(Number(newProduct.price))) errors.price = 'Price must be a number';
    else if (Number(newProduct.price) <= 0) errors.price = 'Price must be greater than 0';
    
    if (!newProduct.minQty) errors.minQty = 'Minimum quantity is required';
    else if (isNaN(Number(newProduct.minQty))) errors.minQty = 'Minimum quantity must be a number';
    else if (Number(newProduct.minQty) <= 0) errors.minQty = 'Minimum quantity must be greater than 0';
    
    setNewProductErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateNewProduct = async () => {
    if (!validateNewProduct()) return;

    try {
      let imageUrl = '';
      
      // Upload image if provided
      if (newProduct.image) {
        const fileName = `${newProduct.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(`master_products/${fileName}`, newProduct.image);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(`master_products/${fileName}`);
        
        imageUrl = publicUrl;
      }

      // Save to master_products table
      const { data: masterProduct, error: masterError } = await supabase
        .from('master_products')
        .insert({
          name: newProduct.name,
          brand: newProduct.brand,
          category: newProduct.category,
          subcategory: newProduct.subcategory,
          min_qty: parseInt(newProduct.minQty),
          image_url: imageUrl
        })
        .select()
        .single();

      if (masterError) throw masterError;

      // Add to local state
      const newProductData: QuickAddProduct = {
        id: masterProduct.id.toString(),
        name: masterProduct.name,
        brand: masterProduct.brand,
        category: masterProduct.category,
        subcategory: masterProduct.subcategory,
        minQty: masterProduct.min_qty.toString(),
        selected: true,
        price: newProduct.price,
        stock: '0',
        unit: newProduct.unit
      };

      setQuickAddProducts(prev => [...prev, newProductData]);
      setShowNewProductModal(false);
      setNewProduct({
        name: '',
        brand: '',
        category: '',
        subcategory: '',
        price: '',
        minQty: '',
        unit: 'pcs',
        image: null,
        imagePreview: ''
      });
      setNewProductErrors({});

      toast.success('Product created and selected successfully');
    } catch (error) {
      console.error('Error creating new product:', error);
      toast.error('Failed to create new product');
    }
  };

  const getDefaultCategories = () => [
    'Food & Beverages',
    'Beverages',
    'Dairy Products',
    'Snacks',
    'Personal Care',
    'Household Items',
    'Electronics',
    'Clothing',
    'Other'
  ];

  const getSubcategories = (category: string) => {
    const subcategoryMap: {[key: string]: string[]} = {
      'Food & Beverages': ['Snacks', 'Packaged Foods', 'Spices', 'Oils', 'Grains'],
      'Beverages': ['Soft Drinks', 'Juices', 'Tea', 'Coffee', 'Energy Drinks'],
      'Dairy Products': ['Milk', 'Cheese', 'Yogurt', 'Butter', 'Ice Cream'],
      'Snacks': ['Chips', 'Biscuits', 'Chocolates', 'Nuts', 'Candies'],
      'Personal Care': ['Soap', 'Shampoo', 'Toothpaste', 'Cosmetics', 'Skincare'],
      'Household Items': ['Cleaning', 'Kitchen', 'Bathroom', 'Storage', 'Decor'],
      'Electronics': ['Mobile', 'Accessories', 'Gadgets', 'Appliances'],
      'Clothing': ['Men', 'Women', 'Kids', 'Accessories'],
      'Other': ['General', 'Miscellaneous']
    };
    return subcategoryMap[category] || ['General'];
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setNewProduct(prev => ({ ...prev, image: file }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewProduct(prev => ({ ...prev, imagePreview: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setNewProduct(prev => ({ ...prev, image: null, imagePreview: '' }));
  };

  if (loading) {
    return (
      <MainLayout title="Dashboard">
        <Box sx={{ p: 3 }}>
          <LinearProgress />
          <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading dashboard...</Typography>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Dashboard">
      <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {sellerDetails?.owner_name || user?.email}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your business today
        </Typography>
      </Box>

      {/* Business Profile Card */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                sx={{ width: 80, height: 80, bgcolor: 'rgba(255,255,255,0.2)' }}
                src={sellerDetails?.image_url}
              >
                {sellerDetails?.business_name?.charAt(0) || 'B'}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h5" gutterBottom>
                {sellerDetails?.business_name || 'Your Business'}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 1 }}>
                {sellerDetails?.business_type || 'Wholesale Business'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                {sellerDetails?.address && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOn fontSize="small" />
                    <Typography variant="body2">
                      {typeof sellerDetails.address === 'object' 
                        ? `${sellerDetails.address.street || ''}, ${sellerDetails.address.city || ''}, ${sellerDetails.address.state || ''} ${sellerDetails.address.pincode || ''}`.replace(/^,\s*|,\s*$|,\s*,/g, '').trim()
                        : sellerDetails.address
                      }
                    </Typography>
                  </Box>
                )}
                {sellerDetails?.contact_phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Phone fontSize="small" />
                    <Typography variant="body2">{sellerDetails.contact_phone}</Typography>
                  </Box>
                )}
              </Box>
            </Grid>
            <Grid item>
              <Chip
                icon={sellerDetails?.is_verified ? <Verified /> : <Warning />}
                label={sellerDetails?.is_verified ? 'Verified' : 'Pending Verification'}
                color={sellerDetails?.is_verified ? 'success' : 'warning'}
                variant="outlined"
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Orders
                  </Typography>
                  <Typography variant="h4">
                    {stats?.totalOrders || 0}
                  </Typography>
                  <Typography variant="body2" color={newOrdersCount > 0 ? "error.main" : "text.secondary"}>
                    {newOrdersCount > 0 ? `${newOrdersCount} new orders!` : `${stats?.pendingOrders || 0} pending`}
                  </Typography>
                </Box>
                <ShoppingCart color="primary" sx={{ fontSize: 40 }} />
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
                    Revenue
                  </Typography>
                  <Typography variant="h4">
                    ₹{stats?.totalRevenue?.toLocaleString() || 0}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +12% from last month
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
                    Products
                  </Typography>
                  <Typography variant="h4">
                    {stats?.totalProducts || 0}
                  </Typography>
                  <Typography variant="body2" color="warning.main">
                    {stats?.lowStockProducts || 0} low stock
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
                    Customers
                  </Typography>
                  <Typography variant="h4">
                    {recentOrders.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active this month
                  </Typography>
                </Box>
                <People color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ERP System Access */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white' }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Business sx={{ fontSize: 40 }} />
              </Box>
            </Grid>
            <Grid item xs>
              <Typography variant="h5" gutterBottom>
                Enterprise Resource Planning (ERP)
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                Manage your complete business operations with our comprehensive ERP system
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                • Inventory Management • Sales & Purchase Orders • Accounting & Invoicing • HR Management
              </Typography>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                size="large"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.3)'
                  }
                }}
                onClick={() => router.push('/erp')}
              >
                Access ERP System
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Quick Add Products */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Quick Add Products
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add products from master catalog to your inventory
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowQuickAddModal(true)}
                >
                  Browse Products
                </Button>
              </Box>
              
              {quickAddProducts.filter(p => p.selected).length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected Products ({quickAddProducts.filter(p => p.selected).length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {quickAddProducts.filter(p => p.selected).slice(0, 3).map((product) => (
                      <Chip
                        key={product.id}
                        label={`${product.name} - ₹${product.price}`}
                        size="small"
                        onDelete={() => {
                          setQuickAddProducts(prev => 
                            prev.map(p => p.id === product.id ? { ...p, selected: false } : p)
                          );
                        }}
                      />
                    ))}
                    {quickAddProducts.filter(p => p.selected).length > 3 && (
                      <Chip
                        label={`+${quickAddProducts.filter(p => p.selected).length - 3} more`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    sx={{ mt: 1 }}
                    onClick={handleQuickAdd}
                  >
                    Add Selected to Inventory
                  </Button>
                </Box>
              )}
              
              {quickAddProducts.filter(p => p.selected).length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No products selected. Click "Browse Products" to get started.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Orders */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Orders
              </Typography>
              {recentOrders.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No recent orders
                </Typography>
              ) : (
                recentOrders.map((order, index) => (
                  <Box key={order.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
                      <Box>
                        <Typography variant="subtitle2">
                          Order #{order.id?.slice(-6)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {(order as any).retailer?.business_name || 'Customer'}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="subtitle2">
                          ₹{order.total_amount?.toLocaleString()}
                        </Typography>
                        <Chip
                          label={order.status}
                          size="small"
                          color={order.status === 'completed' ? 'success' : order.status === 'pending' ? 'warning' : 'default'}
                        />
                      </Box>
                    </Box>
                    {index < recentOrders.length - 1 && <Divider />}
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </Box>

      {/* Quick Add Modal */}
      <Dialog
        open={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Quick Add Products</Typography>
            <IconButton onClick={() => setShowQuickAddModal(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Search and Filters */}
          <Box sx={{ mb: 3 }}>
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
              sx={{ mb: 2 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory || ''}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value || null)}
              >
                <MenuItem value="">
                  <em>All Categories</em>
                </MenuItem>
                {getCategories().map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Products List */}
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {getFilteredQuickAddProducts().length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No products found. Try adjusting your search or filters.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {getFilteredQuickAddProducts().map((product) => (
                  <Grid item xs={12} key={product.id}>
                    <Paper
                      sx={{
                        p: 2,
                        border: product.selected ? '2px solid' : '1px solid',
                        borderColor: product.selected ? 'primary.main' : 'divider',
                        bgcolor: product.selected ? 'primary.50' : 'background.paper'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Checkbox
                          checked={product.selected}
                          onChange={(e) => {
                            setQuickAddProducts(prev =>
                              prev.map(p =>
                                p.id === product.id ? { ...p, selected: e.target.checked } : p
                              )
                            );
                          }}
                        />
                        
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {product.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {product.brand} • {product.category} • {product.subcategory}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Min Qty: {product.minQty} {product.unit}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <TextField
                            label="Price (₹)"
                            size="small"
                            type="number"
                            value={product.price}
                            onChange={(e) => {
                              setQuickAddProducts(prev =>
                                prev.map(p =>
                                  p.id === product.id ? { ...p, price: e.target.value } : p
                                )
                              );
                            }}
                            sx={{ width: 100 }}
                            disabled={!product.selected}
                          />
                          
                          <TextField
                            label="Stock"
                            size="small"
                            type="number"
                            value={product.stock}
                            onChange={(e) => {
                              setQuickAddProducts(prev =>
                                prev.map(p =>
                                  p.id === product.id ? { ...p, stock: e.target.value } : p
                                )
                              );
                            }}
                            sx={{ width: 80 }}
                            disabled={!product.selected}
                          />
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowNewProductModal(true)}
            variant="outlined"
            startIcon={<Add />}
          >
            Create New Product
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={() => setShowQuickAddModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleQuickAdd}
            disabled={quickAddProducts.filter(p => p.selected && parseFloat(p.price) > 0).length === 0}
          >
            Add Selected Products ({quickAddProducts.filter(p => p.selected && parseFloat(p.price) > 0).length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Product Creation Modal */}
      <Dialog
        open={showNewProductModal}
        onClose={() => setShowNewProductModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Create New Product</Typography>
            <IconButton onClick={() => setShowNewProductModal(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Product Name"
                value={newProduct.name}
                onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                error={!!newProductErrors.name}
                helperText={newProductErrors.name}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Brand"
                value={newProduct.brand}
                onChange={(e) => setNewProduct(prev => ({ ...prev, brand: e.target.value }))}
                error={!!newProductErrors.brand}
                helperText={newProductErrors.brand}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!newProductErrors.category}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newProduct.category}
                  label="Category"
                  onChange={(e) => {
                    setNewProduct(prev => ({ 
                      ...prev, 
                      category: e.target.value,
                      subcategory: '' // Reset subcategory when category changes
                    }));
                  }}
                >
                  {getDefaultCategories().map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
                {newProductErrors.category && (
                  <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                    {newProductErrors.category}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!newProductErrors.subcategory}>
                <InputLabel>Subcategory</InputLabel>
                <Select
                  value={newProduct.subcategory}
                  label="Subcategory"
                  onChange={(e) => setNewProduct(prev => ({ ...prev, subcategory: e.target.value }))}
                  disabled={!newProduct.category}
                >
                  {newProduct.category && getSubcategories(newProduct.category).map((subcategory) => (
                    <MenuItem key={subcategory} value={subcategory}>
                      {subcategory}
                    </MenuItem>
                  ))}
                </Select>
                {newProductErrors.subcategory && (
                  <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                    {newProductErrors.subcategory}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Price (₹)"
                type="number"
                value={newProduct.price}
                onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                error={!!newProductErrors.price}
                helperText={newProductErrors.price}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Min Quantity"
                type="number"
                value={newProduct.minQty}
                onChange={(e) => setNewProduct(prev => ({ ...prev, minQty: e.target.value }))}
                error={!!newProductErrors.minQty}
                helperText={newProductErrors.minQty}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={newProduct.unit}
                  label="Unit"
                  onChange={(e) => setNewProduct(prev => ({ ...prev, unit: e.target.value }))}
                >
                  <MenuItem value="pcs">Pieces</MenuItem>
                  <MenuItem value="kg">Kilograms</MenuItem>
                  <MenuItem value="g">Grams</MenuItem>
                  <MenuItem value="l">Liters</MenuItem>
                  <MenuItem value="ml">Milliliters</MenuItem>
                  <MenuItem value="box">Box</MenuItem>
                  <MenuItem value="pack">Pack</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Product Image (Optional)
                </Typography>
                
                {newProduct.imagePreview ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={newProduct.imagePreview}
                      sx={{ width: 80, height: 80, borderRadius: 2 }}
                      variant="rounded"
                    />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {newProduct.image?.name}
                      </Typography>
                      <Button
                        size="small"
                        color="error"
                        onClick={removeImage}
                        startIcon={<Delete />}
                      >
                        Remove
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="image-upload"
                      type="file"
                      onChange={handleImageUpload}
                    />
                    <label htmlFor="image-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<CloudUpload />}
                        sx={{ mb: 1 }}
                      >
                        Upload Image
                      </Button>
                    </label>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Supported formats: JPG, PNG, GIF (Max 5MB)
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewProductModal(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateNewProduct}
            variant="contained"
          >
            Create Product
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}