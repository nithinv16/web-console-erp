'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
  TableRow,
  Switch,
  FormControlLabel,
  Divider,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  ArrowBack,
  Add,
  Delete,
  Refresh,
  PersonAdd
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  cgst: number
  sgst: number
  total: number
}

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: any
}

interface Company {
  id: string
  name: string
}

export default function NewInvoicePage() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()
  
  const [invoiceData, setInvoiceData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: ''
  })
  
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, taxRate: 18, cgst: 9, sgst: 9, total: 0 }
  ])
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [taxMode, setTaxMode] = useState<'line' | 'bill'>('bill')
  const [globalTaxRate, setGlobalTaxRate] = useState(18)
  const [loading, setLoading] = useState(false)
  const [addCustomerOpen, setAddCustomerOpen] = useState(false)
  const [newCustomerData, setNewCustomerData] = useState({
    customer_code: '',
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    gst_number: '',
    pan_number: '',
    customer_type: 'regular',
    credit_limit: '',
    payment_terms: '',
    status: 'active'
  })

  // Fetch company and customers on component mount
  useEffect(() => {
    fetchCompanyAndCustomers()
  }, [user])

  const fetchCompanyAndCustomers = async () => {
    if (!user) return
    
    try {
      // Fetch companies and use the first one (or filter by user if needed)
      const { data: companiesData, error: companyError } = await supabase
        .from('companies')
        .select('id, name')
        .limit(1)
      
      if (companyError) throw companyError
      
      if (!companiesData || companiesData.length === 0) {
        toast.error('No company found. Please create a company first.')
        return
      }
      
      const companyData = companiesData[0]
      setCompany(companyData)
      
      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, name, email, phone, address')
        .eq('company_id', companyData.id)
      
      if (customersError) throw customersError
      setCustomers(customersData || [])
      
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load company data')
    }
  }

  const generateInvoiceNumber = () => {
    const today = new Date()
    const year = today.getFullYear().toString().slice(-2)
    const month = (today.getMonth() + 1).toString().padStart(2, '0')
    const day = today.getDate().toString().padStart(2, '0')
    const companyCode = company?.name.substring(0, 3).toUpperCase() || 'COM'
    const randomToken = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    
    const invoiceNumber = `INV-${year}${month}${day}-${companyCode}-${randomToken}`
    setInvoiceData(prev => ({ ...prev, invoiceNumber }))
  }

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: taxMode === 'line' ? 18 : globalTaxRate,
      cgst: taxMode === 'line' ? 9 : globalTaxRate / 2,
      sgst: taxMode === 'line' ? 9 : globalTaxRate / 2,
      total: 0
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        
        // Update tax rates when tax rate changes
        if (field === 'taxRate') {
          updatedItem.cgst = value / 2
          updatedItem.sgst = value / 2
        }
        
        // Recalculate total when quantity, unitPrice, or taxRate changes
        if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
          const subtotal = updatedItem.quantity * updatedItem.unitPrice
          const taxAmount = (subtotal * updatedItem.taxRate) / 100
          updatedItem.total = subtotal + taxAmount
        }
        
        return updatedItem
      }
      return item
    }))
  }

  const handleCustomerSelect = (customer: Customer | string | null) => {
    if (typeof customer === 'string') {
      setSelectedCustomer(null)
      setInvoiceData(prev => ({ ...prev, customerName: customer }))
    } else {
      setSelectedCustomer(customer)
      if (customer) {
        setInvoiceData(prev => ({
          ...prev,
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          customerAddress: customer.address || {
            street: '',
            city: '',
            state: '',
            pincode: '',
            country: 'India'
          }
        }))
      }
    }
  }

  const generateCustomerCode = (customerName: string) => {
    // Extract first 2 characters from customer name (uppercase, letters only)
    const nameChars = customerName.replace(/[^A-Za-z]/g, '').substring(0, 2).toUpperCase().padEnd(2, 'X')
    
    // Generate 4 digits: 2 from current date + 2 random/sequence
    const today = new Date()
    const dateDigits = today.getDate().toString().padStart(2, '0')
    const randomDigits = Math.floor(Math.random() * 100).toString().padStart(2, '0')
    
    return `${nameChars}${dateDigits}${randomDigits}`
  }

  const handleAddCustomer = async () => {
    if (!company || !newCustomerData.name.trim()) {
      toast.error('Please fill in customer name')
      return
    }

    try {
      // Auto-generate customer code if not provided
      const customerCode = newCustomerData.customer_code.trim() || generateCustomerCode(newCustomerData.name)
      
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert({
          company_id: company.id,
          customer_code: customerCode,
          name: newCustomerData.name,
          contact_person: newCustomerData.contact_person || null,
          email: newCustomerData.email || null,
          phone: newCustomerData.phone || null,
          address: newCustomerData.address,
          gst_number: newCustomerData.gst_number || null,
          pan_number: newCustomerData.pan_number || null,
          customer_type: newCustomerData.customer_type,
          credit_limit: newCustomerData.credit_limit ? parseFloat(newCustomerData.credit_limit) : null,
          payment_terms: newCustomerData.payment_terms || null,
          status: newCustomerData.status
        })
        .select()
        .single()

      if (error) throw error

      // Add to customers list
      setCustomers(prev => [...prev, newCustomer])
      
      // Select the new customer
      handleCustomerSelect(newCustomer)
      
      // Reset form and close modal
      setNewCustomerData({
        customer_code: '',
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India'
        },
        gst_number: '',
        pan_number: '',
        customer_type: 'regular',
        credit_limit: '',
        payment_terms: '',
        status: 'active'
      })
      setAddCustomerOpen(false)
      
      toast.success('Customer added successfully!')
    } catch (error) {
      console.error('Error adding customer:', error)
      toast.error('Failed to add customer')
    }
  }

  const applyGlobalTaxRate = () => {
    setItems(items.map(item => {
      const updatedItem = {
        ...item,
        taxRate: globalTaxRate,
        cgst: globalTaxRate / 2,
        sgst: globalTaxRate / 2
      }
      const subtotal = updatedItem.quantity * updatedItem.unitPrice
      const taxAmount = (subtotal * updatedItem.taxRate) / 100
      updatedItem.total = subtotal + taxAmount
      return updatedItem
    }))
  }

  // Calculate totals based on tax mode
  const calculateTotals = () => {
    if (!items || items.length === 0) {
      return { subtotal: 0, tax: 0, cgst: 0, sgst: 0, total: 0 }
    }
    
    if (taxMode === 'line') {
      const subtotal = items.reduce((sum, item) => {
        const itemSubtotal = (item.quantity || 0) * (item.unitPrice || 0)
        return sum + itemSubtotal
      }, 0)
      const tax = items.reduce((sum, item) => {
        const itemSubtotal = (item.quantity || 0) * (item.unitPrice || 0)
        return sum + (itemSubtotal * (item.taxRate || 0)) / 100
      }, 0)
      const cgst = items.reduce((sum, item) => {
        const itemSubtotal = (item.quantity || 0) * (item.unitPrice || 0)
        return sum + (itemSubtotal * (item.cgst || 0)) / 100
      }, 0)
      const sgst = items.reduce((sum, item) => {
        const itemSubtotal = (item.quantity || 0) * (item.unitPrice || 0)
        return sum + (itemSubtotal * (item.sgst || 0)) / 100
      }, 0)
      return { subtotal, tax, cgst, sgst, total: subtotal + tax }
    } else {
      const subtotal = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0)
      const tax = (subtotal * (globalTaxRate || 0)) / 100
      const cgst = tax / 2
      const sgst = tax / 2
      return { subtotal, tax, cgst, sgst, total: subtotal + tax }
    }
  }

  const totals = calculateTotals()

  const handleSave = async () => {
    if (!company || !invoiceData.customerName || !invoiceData.invoiceNumber) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      // Create or get customer
      let customerId = selectedCustomer?.id
      
      if (!customerId) {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            company_id: company.id,
            name: invoiceData.customerName,
            email: invoiceData.customerEmail,
            phone: invoiceData.customerPhone,
            address: invoiceData.customerAddress
          })
          .select()
          .single()
        
        if (customerError) throw customerError
        customerId = newCustomer.id
      }

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          company_id: company.id,
          invoice_number: invoiceData.invoiceNumber,
          invoice_type: 'sales',
          customer_id: customerId,
          invoice_date: invoiceData.invoiceDate,
          due_date: invoiceData.dueDate,
          subtotal: totals?.subtotal || 0,
          tax_amount: totals?.tax || 0,
          total_amount: totals?.total || 0,
          notes: invoiceData.notes,
          status: 'draft'
        })
        .select()
        .single()
      
      if (invoiceError) throw invoiceError

      // Create invoice items
      const invoiceItems = items.map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate,
        tax_amount: (item.quantity * item.unitPrice * item.taxRate) / 100,
        total_amount: item.total
      }))

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems)
      
      if (itemsError) throw itemsError

      toast.success('Invoice created successfully!')
      router.push('/erp/accounting/invoices')
      
    } catch (error) {
      console.error('Error saving invoice:', error)
      toast.error('Failed to save invoice')
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
        <Typography variant="h4">Create New Invoice</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Tax Mode Selection */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h6">Tax Configuration</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={taxMode === 'line'}
                      onChange={(e) => setTaxMode(e.target.checked ? 'line' : 'bill')}
                    />
                  }
                  label={taxMode === 'line' ? 'Line Level Tax (Enabled)' : 'Bill Level Tax (Default)'}
                />
              </Box>
              
              {taxMode === 'bill' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TextField
                    label="Global Tax Rate (%)"
                    type="number"
                    value={globalTaxRate}
                    onChange={(e) => setGlobalTaxRate(Number(e.target.value))}
                    sx={{ width: 150 }}
                  />
                  <Button variant="outlined" onClick={applyGlobalTaxRate}>
                    Apply to All Items
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Invoice Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Invoice Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    label="Invoice Number"
                    value={invoiceData.invoiceNumber}
                    onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                  />
                </Grid>
                <Grid item xs={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={generateInvoiceNumber}
                    disabled={!company}
                    sx={{ height: '56px' }}
                  >
                    Generate
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Invoice Date"
                    type="date"
                    value={invoiceData.invoiceDate}
                    onChange={(e) => setInvoiceData({ ...invoiceData, invoiceDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Due Date"
                    type="date"
                    value={invoiceData.dueDate}
                    onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Customer Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Customer Details
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<PersonAdd />}
                  onClick={() => setAddCustomerOpen(true)}
                  size="small"
                >
                  Add Customer
                </Button>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={customers}
                    getOptionLabel={(option) => {
                      if (typeof option === 'string') return option;
                      return option?.name || '';
                    }}
                    value={selectedCustomer}
                    onChange={(_, newValue) => handleCustomerSelect(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Customer"
                        placeholder="Choose existing customer or type new name"
                      />
                    )}
                    freeSolo
                    onInputChange={(_, newInputValue) => {
                      if (!selectedCustomer) {
                        setInvoiceData(prev => ({ ...prev, customerName: newInputValue }))
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Customer Name"
                    value={invoiceData.customerName}
                    onChange={(e) => setInvoiceData({ ...invoiceData, customerName: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Customer Email"
                    type="email"
                    value={invoiceData.customerEmail}
                    onChange={(e) => setInvoiceData({ ...invoiceData, customerEmail: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Customer Phone"
                    value={invoiceData.customerPhone}
                    onChange={(e) => setInvoiceData({ ...invoiceData, customerPhone: e.target.value })}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Customer Address</Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    value={invoiceData.customerAddress.street}
                    onChange={(e) => setInvoiceData({
                      ...invoiceData,
                      customerAddress: { ...invoiceData.customerAddress, street: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={invoiceData.customerAddress.city}
                    onChange={(e) => setInvoiceData({
                      ...invoiceData,
                      customerAddress: { ...invoiceData.customerAddress, city: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="State"
                    value={invoiceData.customerAddress.state}
                    onChange={(e) => setInvoiceData({
                      ...invoiceData,
                      customerAddress: { ...invoiceData.customerAddress, state: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Pincode"
                    value={invoiceData.customerAddress.pincode}
                    onChange={(e) => setInvoiceData({
                      ...invoiceData,
                      customerAddress: { ...invoiceData.customerAddress, pincode: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={invoiceData.customerAddress.country}
                    onChange={(e) => setInvoiceData({
                      ...invoiceData,
                      customerAddress: { ...invoiceData.customerAddress, country: e.target.value }
                    })}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Invoice Items */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Invoice Items
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
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      {taxMode === 'line' && (
                        <>
                          <TableCell align="right">Tax %</TableCell>
                          <TableCell align="right">CGST %</TableCell>
                          <TableCell align="right">SGST %</TableCell>
                        </>
                      )}
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
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            placeholder="Item description"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                            sx={{ width: 70 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                            sx={{ width: 90 }}
                          />
                        </TableCell>
                        {taxMode === 'line' && (
                          <>
                            <TableCell align="right">
                              <FormControl size="small" sx={{ width: 80 }}>
                                <Select
                                  value={item.taxRate}
                                  onChange={(e) => updateItem(item.id, 'taxRate', Number(e.target.value))}
                                >
                                  <MenuItem value={0}>0%</MenuItem>
                                  <MenuItem value={5}>5%</MenuItem>
                                  <MenuItem value={12}>12%</MenuItem>
                                  <MenuItem value={18}>18%</MenuItem>
                                  <MenuItem value={28}>28%</MenuItem>
                                </Select>
                              </FormControl>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">{item.cgst}%</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">{item.sgst}%</Typography>
                            </TableCell>
                          </>
                        )}
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            ₹{(item.total || 0).toFixed(2)}
                          </Typography>
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

        {/* Invoice Summary */}
        <Grid item xs={12} md={6} sx={{ ml: 'auto' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Invoice Summary
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal:</Typography>
                <Typography>₹{(totals?.subtotal || 0).toFixed(2)}</Typography>
              </Box>
              
              {/* Tax Section - Editable */}
              <Box sx={{ mb: 2 }}>
                {taxMode === 'bill' ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography sx={{ minWidth: 60 }}>Tax:</Typography>
                    <FormControl size="small" sx={{ minWidth: 80 }}>
                      <Select
                        value={globalTaxRate}
                        onChange={(e) => {
                          setGlobalTaxRate(Number(e.target.value));
                          applyGlobalTaxRate();
                        }}
                      >
                        <MenuItem value={0}>0%</MenuItem>
                        <MenuItem value={5}>5%</MenuItem>
                        <MenuItem value={12}>12%</MenuItem>
                        <MenuItem value={18}>18%</MenuItem>
                        <MenuItem value={28}>28%</MenuItem>
                      </Select>
                    </FormControl>
                    <Typography sx={{ ml: 'auto' }}>₹{(totals?.tax || 0).toFixed(2)}</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Tax (Line-wise):</Typography>
                    <Typography>₹{(totals?.tax || 0).toFixed(2)}</Typography>
                  </Box>
                )}
                
                {/* CGST/SGST Breakdown */}
                {(totals?.cgst || 0) > 0 && (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, pl: 2 }}>
                      <Typography variant="body2" color="text.secondary">CGST:</Typography>
                      <Typography variant="body2">₹{(totals?.cgst || 0).toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, pl: 2 }}>
                      <Typography variant="body2" color="text.secondary">SGST:</Typography>
                      <Typography variant="body2">₹{(totals?.sgst || 0).toFixed(2)}</Typography>
                    </Box>
                  </>
                )}
              </Box>
              
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6">₹{(totals?.total || 0).toFixed(2)}</Typography>
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
                value={invoiceData.notes}
                onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
                placeholder="Additional notes or terms..."
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
              disabled={!invoiceData.customerName || !invoiceData.invoiceNumber}
            >
              Save Invoice
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Add Customer Modal */}
      <Dialog open={addCustomerOpen} onClose={() => setAddCustomerOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Customer</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Customer Code (Auto-generated)"
                value={newCustomerData.customer_code}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, customer_code: e.target.value })}
                placeholder={newCustomerData.name ? `Preview: ${generateCustomerCode(newCustomerData.name)}` : "Will be auto-generated from name"}
                helperText="Leave empty for auto-generation or enter custom code"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Customer Name *"
                value={newCustomerData.name}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Contact Person"
                value={newCustomerData.contact_person}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, contact_person: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newCustomerData.email}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Phone"
                value={newCustomerData.phone}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Customer Type</InputLabel>
                <Select
                  value={newCustomerData.customer_type}
                  label="Customer Type"
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, customer_type: e.target.value })}
                >
                  <MenuItem value="regular">Regular</MenuItem>
                  <MenuItem value="wholesale">Wholesale</MenuItem>
                  <MenuItem value="retail">Retail</MenuItem>
                  <MenuItem value="corporate">Corporate</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Address</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={newCustomerData.address.street}
                onChange={(e) => setNewCustomerData({
                  ...newCustomerData,
                  address: { ...newCustomerData.address, street: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="City"
                value={newCustomerData.address.city}
                onChange={(e) => setNewCustomerData({
                  ...newCustomerData,
                  address: { ...newCustomerData.address, city: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="State"
                value={newCustomerData.address.state}
                onChange={(e) => setNewCustomerData({
                  ...newCustomerData,
                  address: { ...newCustomerData.address, state: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Pincode"
                value={newCustomerData.address.pincode}
                onChange={(e) => setNewCustomerData({
                  ...newCustomerData,
                  address: { ...newCustomerData.address, pincode: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Country"
                value={newCustomerData.address.country}
                onChange={(e) => setNewCustomerData({
                  ...newCustomerData,
                  address: { ...newCustomerData.address, country: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>Business Information</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="GST Number"
                value={newCustomerData.gst_number}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, gst_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="PAN Number"
                value={newCustomerData.pan_number}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, pan_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Credit Limit"
                type="number"
                value={newCustomerData.credit_limit}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, credit_limit: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Payment Terms"
                value={newCustomerData.payment_terms}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, payment_terms: e.target.value })}
                placeholder="e.g., Net 30, Cash on Delivery"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newCustomerData.status}
                  label="Status"
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, status: e.target.value })}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddCustomerOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddCustomer} 
            variant="contained"
            disabled={!newCustomerData.name.trim()}
          >
            Add Customer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}