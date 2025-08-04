'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
  InputAdornment,
  Chip,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  Save,
  Cancel,
  Add,
  Delete,
  Upload,
  Image as ImageIcon,
  QrCode,
  AttachMoney,
  Inventory,
  Category,
  Info
} from '@mui/icons-material'
import BarcodeInput from '@/components/barcode/BarcodeInput'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database, ERPProductCategory } from '@/types/database'
import { useRouter } from 'next/navigation'

interface ProductFormData {
  name: string
  description: string
  sku: string
  barcode: string
  ean_code: string
  upc_code: string
  gtin: string
  brand: string
  category_id: string
  unit_of_measure: string
  cost_price: number
  selling_price: number
  min_stock_level: number
  max_stock_level: number
  reorder_point: number
  weight: number
  dimensions: string
  status: 'active' | 'inactive'
  is_trackable: boolean
  has_variants: boolean
  tax_rate: number
  images: string[]
  tags: string[]
  notes: string
}

interface ProductVariant {
  name: string
  sku: string
  price: number
  cost: number
  attributes: Record<string, string>
}

export default function NewProductPage() {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    sku: '',
    barcode: '',
    ean_code: '',
    upc_code: '',
    gtin: '',
    brand: '',
    category_id: '',
    unit_of_measure: 'pcs',
    cost_price: 0,
    selling_price: 0,
    min_stock_level: 0,
    max_stock_level: 0,
    reorder_point: 0,
    weight: 0,
    dimensions: '',
    status: 'active',
    is_trackable: true,
    has_variants: false,
    tax_rate: 18,
    images: [],
    tags: [],
    notes: ''
  })
  
  const [categories, setCategories] = useState<ERPProductCategory[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [newTag, setNewTag] = useState('')
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()

  useEffect(() => {
    fetchCategories()
    generateSKU()
  }, [])

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
  
  const generateSKU = () => {
    const timestamp = Date.now().toString().slice(-6)
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase()
    setFormData(prev => ({ ...prev, sku: `PRD-${timestamp}-${randomStr}` }))
  }
  
  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }
  
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }
  
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }
  
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    
    try {
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .limit(1)
        .single()
      
      if (!companies) throw new Error('No company found')
      
      const { data, error } = await supabase
        .from('product_categories')
        .insert({
          name: newCategoryName.trim(),
          company_id: companies.id,
          status: 'active'
        })
        .select()
        .single()
      
      if (error) throw error
      
      setCategories(prev => [...prev, data])
      setFormData(prev => ({ ...prev, category_id: data.id }))
      setCategoryDialogOpen(false)
      setNewCategoryName('')
      
    } catch (err) {
      console.error('Error creating category:', err)
      setError('Failed to create category')
    }
  }
  
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Product name is required')
      return false
    }
    
    if (!formData.sku.trim()) {
      setError('SKU is required')
      return false
    }
    
    if (formData.selling_price <= 0) {
      setError('Selling price must be greater than 0')
      return false
    }
    
    if (formData.cost_price < 0) {
      setError('Cost price cannot be negative')
      return false
    }
    
    return true
  }
  
  const handleSubmit = async () => {
    if (!validateForm()) return
    
    try {
      setLoading(true)
      setError(null)
      
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .limit(1)
        .single()
      
      if (!companies) throw new Error('No company found')
      
      // Check if SKU already exists
      const { data: existingProduct } = await supabase
        .from('erp_products')
        .select('id')
        .eq('sku', formData.sku)
        .eq('company_id', companies.id)
        .single()
      
      if (existingProduct) {
        setError('SKU already exists. Please use a different SKU.')
        return
      }
      
      // Create the product
      const { data: product, error: productError } = await supabase
        .from('erp_products')
        .insert({
          company_id: companies.id,
          name: formData.name.trim(),
          description: formData.description.trim(),
          sku: formData.sku.trim(),
          barcode: formData.barcode.trim() || null,
          ean_code: formData.ean_code.trim() || null,
          upc_code: formData.upc_code.trim() || null,
          gtin: formData.gtin.trim() || null,
          brand: formData.brand.trim() || null,
          category_id: formData.category_id || null,
          unit_of_measure: formData.unit_of_measure,
          cost_price: formData.cost_price,
          selling_price: formData.selling_price,
          min_stock_level: formData.min_stock_level,
          max_stock_level: formData.max_stock_level,
          reorder_point: formData.reorder_point,
          weight: formData.weight || null,
          dimensions: formData.dimensions.trim() || null,
          status: formData.status,
          is_trackable: formData.is_trackable,
          has_variants: formData.has_variants,
          tax_rate: formData.tax_rate,
          images: formData.images.length > 0 ? formData.images : null,
          tags: formData.tags.length > 0 ? formData.tags : null,
          notes: formData.notes.trim() || null
        })
        .select()
        .single()
      
      if (productError) throw productError
      
      setSuccess('Product created successfully!')
      
      // Redirect to product list after a short delay
      setTimeout(() => {
        router.push('/erp/inventory/products')
      }, 1500)
      
    } catch (err) {
      console.error('Error creating product:', err)
      setError('Failed to create product. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleCancel = () => {
    router.push('/erp/inventory/products')
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Add New Product
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create a new product in your inventory
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Product Name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    placeholder="Enter product name"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    multiline
                    rows={3}
                    placeholder="Enter product description"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="SKU"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <QrCode />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button size="small" onClick={generateSKU}>
                            Generate
                          </Button>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <BarcodeInput
                    value={formData.barcode}
                    onChange={(value) => handleInputChange('barcode', value)}
                    label="Barcode"
                    placeholder="Enter barcode (optional)"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="EAN Code"
                    value={formData.ean_code}
                    onChange={(e) => handleInputChange('ean_code', e.target.value)}
                    placeholder="Enter EAN code (optional)"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="UPC Code"
                    value={formData.upc_code}
                    onChange={(e) => handleInputChange('upc_code', e.target.value)}
                    placeholder="Enter UPC code (optional)"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="GTIN"
                    value={formData.gtin}
                    onChange={(e) => handleInputChange('gtin', e.target.value)}
                    placeholder="Enter GTIN (optional)"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Brand"
                    value={formData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    placeholder="Enter brand name"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.category_id}
                      onChange={(e) => handleInputChange('category_id', e.target.value)}
                      label="Category"
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setCategoryDialogOpen(true)}
                            size="small"
                          >
                            <Add />
                          </IconButton>
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="">No Category</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Unit of Measure</InputLabel>
                    <Select
                      value={formData.unit_of_measure}
                      onChange={(e) => handleInputChange('unit_of_measure', e.target.value)}
                      label="Unit of Measure"
                    >
                      <MenuItem value="pcs">Pieces</MenuItem>
                      <MenuItem value="kg">Kilograms</MenuItem>
                      <MenuItem value="g">Grams</MenuItem>
                      <MenuItem value="l">Liters</MenuItem>
                      <MenuItem value="ml">Milliliters</MenuItem>
                      <MenuItem value="m">Meters</MenuItem>
                      <MenuItem value="cm">Centimeters</MenuItem>
                      <MenuItem value="box">Box</MenuItem>
                      <MenuItem value="pack">Pack</MenuItem>
                      <MenuItem value="dozen">Dozen</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value as 'active' | 'inactive')}
                      label="Status"
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Pricing & Stock */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pricing & Stock
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Cost Price"
                    type="number"
                    value={formData.cost_price}
                    onChange={(e) => handleInputChange('cost_price', parseFloat(e.target.value) || 0)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          ₹
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Selling Price"
                    type="number"
                    value={formData.selling_price}
                    onChange={(e) => handleInputChange('selling_price', parseFloat(e.target.value) || 0)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          ₹
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tax Rate (%)"
                    type="number"
                    value={formData.tax_rate}
                    onChange={(e) => handleInputChange('tax_rate', parseFloat(e.target.value) || 0)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          %
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Stock Levels
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Minimum Stock Level"
                    type="number"
                    value={formData.min_stock_level}
                    onChange={(e) => handleInputChange('min_stock_level', parseInt(e.target.value) || 0)}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Maximum Stock Level"
                    type="number"
                    value={formData.max_stock_level}
                    onChange={(e) => handleInputChange('max_stock_level', parseInt(e.target.value) || 0)}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Reorder Point"
                    type="number"
                    value={formData.reorder_point}
                    onChange={(e) => handleInputChange('reorder_point', parseInt(e.target.value) || 0)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Additional Details */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Additional Details
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Weight (kg)"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                    placeholder="Enter weight in kg"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Dimensions"
                    value={formData.dimensions}
                    onChange={(e) => handleInputChange('dimensions', e.target.value)}
                    placeholder="e.g., 10cm x 5cm x 2cm"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.is_trackable}
                          onChange={(e) => handleInputChange('is_trackable', e.target.checked)}
                        />
                      }
                      label="Track Inventory"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.has_variants}
                          onChange={(e) => handleInputChange('has_variants', e.target.checked)}
                        />
                      }
                      label="Has Variants"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                    {formData.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        onDelete={() => handleRemoveTag(tag)}
                        size="small"
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      size="small"
                      placeholder="Add tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag()
                        }
                      }}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleAddTag}
                      disabled={!newTag.trim()}
                    >
                      Add
                    </Button>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    multiline
                    rows={3}
                    placeholder="Additional notes about the product"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={handleCancel}
          disabled={loading}
          startIcon={<Cancel />}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={<Save />}
        >
          {loading ? 'Creating...' : 'Create Product'}
        </Button>
      </Box>

      {/* Create Category Dialog */}
      <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)}>
        <DialogTitle>Create New Category</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Category Name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            margin="normal"
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateCategory}
            variant="contained"
            disabled={!newCategoryName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}