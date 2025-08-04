'use client'

import React, { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
import {
  ArrowBack,
  Add,
  Delete
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'

interface PurchaseItem {
  id: string
  productName: string
  quantity: number
  unitPrice: number
  total: number
}

export default function NewPurchaseOrderPage() {
  const router = useRouter()
  const [orderData, setOrderData] = useState({
    supplierName: '',
    supplierEmail: '',
    orderNumber: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDelivery: '',
    status: 'draft',
    notes: ''
  })
  const [items, setItems] = useState<PurchaseItem[]>([
    { id: '1', productName: '', quantity: 1, unitPrice: 0, total: 0 }
  ])

  const addItem = () => {
    const newItem: PurchaseItem = {
      id: Date.now().toString(),
      productName: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const updateItem = (id: string, field: keyof PurchaseItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice
        }
        return updatedItem
      }
      return item
    }))
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const tax = subtotal * 0.18 // 18% GST
  const total = subtotal + tax

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Saving purchase order:', { orderData, items, subtotal, tax, total })
    router.push('/erp/purchase/orders')
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">Create New Purchase Order</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Order Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Purchase Order Number"
                    value={orderData.orderNumber}
                    onChange={(e) => setOrderData({ ...orderData, orderNumber: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Order Date"
                    type="date"
                    value={orderData.orderDate}
                    onChange={(e) => setOrderData({ ...orderData, orderDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Expected Delivery"
                    type="date"
                    value={orderData.expectedDelivery}
                    onChange={(e) => setOrderData({ ...orderData, expectedDelivery: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={orderData.status}
                      label="Status"
                      onChange={(e) => setOrderData({ ...orderData, status: e.target.value })}
                    >
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="sent">Sent</MenuItem>
                      <MenuItem value="confirmed">Confirmed</MenuItem>
                      <MenuItem value="received">Received</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Supplier Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Supplier Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Supplier Name"
                    value={orderData.supplierName}
                    onChange={(e) => setOrderData({ ...orderData, supplierName: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Supplier Email"
                    type="email"
                    value={orderData.supplierEmail}
                    onChange={(e) => setOrderData({ ...orderData, supplierEmail: e.target.value })}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Purchase Items */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Purchase Items
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={addItem}
                >
                  Add Item
                </Button>
              </Box>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product Name</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            value={item.productName}
                            onChange={(e) => updateItem(item.id, 'productName', e.target.value)}
                            placeholder="Product name"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          ₹{item.total.toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => removeItem(item.id)}
                            disabled={items.length === 1}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Order Summary */}
        <Grid item xs={12} md={6} sx={{ ml: 'auto' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal:</Typography>
                <Typography>₹{subtotal.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Tax (18%):</Typography>
                <Typography>₹{tax.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: 1, pt: 1 }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6">₹{total.toFixed(2)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Notes */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notes
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={orderData.notes}
                onChange={(e) => setOrderData({ ...orderData, notes: e.target.value })}
                placeholder="Additional notes or instructions..."
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Actions */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!orderData.supplierName || !orderData.orderNumber}
            >
              Save Order
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}