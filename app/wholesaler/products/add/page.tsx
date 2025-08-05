'use client'
import React, { useState } from 'react'
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
  InputAdornment,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  CircularProgress,
  IconButton,
  Avatar,
  Paper
} from '@mui/material'
import {
  ArrowBack,
  Save,
  PhotoCamera,
  Inventory,
  AttachMoney,
  Category,
  Description
} from '@mui/icons-material'
import { useAuth } from '../../../../contexts/AuthContext'
import { createClient } from '../../../../lib/supabase'
import { useRouter } from 'next/navigation'

interface ProductForm {
  name: string
  description: string
  category: string
  price: number | ''
  unit: string
  stock_available: number | ''
  min_quantity: number | ''
  max_quantity: number | ''
  image_url: string
  status: 'active' | 'inactive'
}

interface ProductFormErrors {
  name?: string
  description?: string
  category?: string
  price?: string
  unit?: string
  stock_available?: string
  min_quantity?: string
  max_quantity?: string
  image_url?: string
  status?: string
}

const categories = [
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

const units = [
  'kg', 'g', 'lbs', 'oz',
  'litre', 'ml', 'gallon',
  'piece', 'dozen', 'pack',
  'box', 'carton', 'bag',
  'bottle', 'can', 'jar'
]

export default function AddProduct() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' })
  const [formData, setFormData] = useState<ProductForm>({
    name: '',
    description: '',
    category: '',
    price: '',
    unit: 'kg',
    stock_available: '',
    min_quantity: '',
    max_quantity: '',
    image_url: '',
    status: 'active'
  })
  const [errors, setErrors] = useState<ProductFormErrors>({})

  const supabase = createClient()

  const handleInputChange = (field: keyof ProductForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: ProductFormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required'
    }

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Valid price is required'
    }

    if (!formData.unit) {
      newErrors.unit = 'Unit is required'
    }

    if (formData.stock_available === '' || formData.stock_available < 0) {
      newErrors.stock_available = 'Valid stock quantity is required'
    }

    if (formData.min_quantity === '' || formData.min_quantity < 0) {
      newErrors.min_quantity = 'Valid minimum quantity is required'
    }

    if (formData.max_quantity !== '' && formData.max_quantity < (formData.min_quantity as number)) {
      newErrors.max_quantity = 'Maximum quantity must be greater than minimum quantity'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSnackbar({
        open: true,
        message: 'Please select a valid image file',
        severity: 'error'
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({
        open: true,
        message: 'Image size must be less than 5MB',
        severity: 'error'
      })
      return
    }

    try {
      setImageUploading(true)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`
      const filePath = `products/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Error uploading image:', uploadError)
        setSnackbar({
          open: true,
          message: 'Error uploading image',
          severity: 'error'
        })
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, image_url: publicUrl }))
      setSnackbar({
        open: true,
        message: 'Image uploaded successfully',
        severity: 'success'
      })
    } catch (error) {
      console.error('Error in handleImageUpload:', error)
      setSnackbar({
        open: true,
        message: 'Error uploading image',
        severity: 'error'
      })
    } finally {
      setImageUploading(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Please fix the errors in the form',
        severity: 'error'
      })
      return
    }

    try {
      setLoading(true)
      
      const productData = {
        seller_id: user?.id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        price: Number(formData.price),
        unit: formData.unit,
        stock_available: Number(formData.stock_available),
        min_quantity: Number(formData.min_quantity),
        image_url: formData.image_url || null,
        status: formData.status
      }

      const { error } = await supabase
        .from('products')
        .insert([productData])

      if (error) {
        console.error('Error creating product:', error)
        setSnackbar({
          open: true,
          message: 'Error creating product',
          severity: 'error'
        })
        return
      }

      setSnackbar({
        open: true,
        message: 'Product created successfully',
        severity: 'success'
      })
      
      // Redirect to products page after a short delay
      setTimeout(() => {
        router.push('/wholesaler/products')
      }, 1500)
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      setSnackbar({
        open: true,
        message: 'Error creating product',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">
          Add New Product
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Product Image */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Product Image
                </Typography>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar
                    src={formData.image_url}
                    sx={{ 
                      width: 200, 
                      height: 200, 
                      mx: 'auto', 
                      mb: 2,
                      bgcolor: 'grey.100'
                    }}
                  >
                    <Inventory sx={{ fontSize: 80, color: 'grey.400' }} />
                  </Avatar>
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
                      startIcon={imageUploading ? <CircularProgress size={20} /> : <PhotoCamera />}
                      disabled={imageUploading}
                      fullWidth
                    >
                      {imageUploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                  </label>
                  <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                    Max size: 5MB. Supported formats: JPG, PNG, GIF
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Product Details */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Product Details
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Product Name"
                      value={formData.name}
                      onChange={handleInputChange('name')}
                      error={!!errors.name}
                      helperText={errors.name}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Inventory />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={formData.description}
                      onChange={handleInputChange('description')}
                      multiline
                      rows={3}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Description />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={!!errors.category}>
                      <InputLabel>Category *</InputLabel>
                      <Select
                        value={formData.category}
                        label="Category *"
                        onChange={handleInputChange('category')}
                        startAdornment={
                          <InputAdornment position="start">
                            <Category />
                          </InputAdornment>
                        }
                      >
                        {categories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.category && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                          {errors.category}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={!!errors.unit}>
                      <InputLabel>Unit *</InputLabel>
                      <Select
                        value={formData.unit}
                        label="Unit *"
                        onChange={handleInputChange('unit')}
                      >
                        {units.map((unit) => (
                          <MenuItem key={unit} value={unit}>
                            {unit}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.unit && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                          {errors.unit}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Price per Unit"
                      type="number"
                      value={formData.price}
                      onChange={handleInputChange('price')}
                      error={!!errors.price}
                      helperText={errors.price}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AttachMoney />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Stock Available"
                      type="number"
                      value={formData.stock_available}
                      onChange={handleInputChange('stock_available')}
                      error={!!errors.stock_available}
                      helperText={errors.stock_available}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Minimum Quantity"
                      type="number"
                      value={formData.min_quantity}
                      onChange={handleInputChange('min_quantity')}
                      error={!!errors.min_quantity}
                      helperText={errors.min_quantity || 'Alert when stock falls below this level'}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Maximum Quantity (Optional)"
                      type="number"
                      value={formData.max_quantity}
                      onChange={handleInputChange('max_quantity')}
                      error={!!errors.max_quantity}
                      helperText={errors.max_quantity || 'Maximum quantity per order'}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.status === 'active'}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.checked ? 'active' : 'inactive' }))}
                          color="primary"
                        />
                      }
                      label="Product is active and available for orders"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Paper sx={{ p: 2, mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Product'}
          </Button>
        </Paper>
      </form>

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