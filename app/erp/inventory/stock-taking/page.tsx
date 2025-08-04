'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Alert,
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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  LinearProgress,
  Fab,
  Tooltip
} from '@mui/material'
import {
  QrCodeScanner,
  Add,
  Delete,
  Save,
  Inventory,
  CheckCircle,
  Warning,
  Clear,
  Download,
  Upload
} from '@mui/icons-material'
import BarcodeScanner from '@/components/barcode/BarcodeScanner'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database, ERPProduct } from '@/types/database'

interface StockItem {
  id: string
  product: ERPProduct
  scannedQuantity: number
  systemQuantity: number
  difference: number
  barcode?: string
}

interface StockTakingSession {
  id: string
  name: string
  status: 'active' | 'completed' | 'cancelled'
  items: StockItem[]
  createdAt: Date
}

export default function StockTakingPage() {
  const [session, setSession] = useState<StockTakingSession | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [newSessionDialog, setNewSessionDialog] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [manualProductDialog, setManualProductDialog] = useState(false)
  const [manualSku, setManualSku] = useState('')
  const [manualQuantity, setManualQuantity] = useState('')
  
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    // Load active session if exists
    loadActiveSession()
  }, [])

  const loadActiveSession = async () => {
    // In a real app, this would load from database
    const savedSession = localStorage.getItem('stockTakingSession')
    if (savedSession) {
      setSession(JSON.parse(savedSession))
    }
  }

  const createNewSession = () => {
    if (!sessionName.trim()) {
      setError('Please enter a session name')
      return
    }

    const newSession: StockTakingSession = {
      id: Date.now().toString(),
      name: sessionName,
      status: 'active',
      items: [],
      createdAt: new Date()
    }

    setSession(newSession)
    localStorage.setItem('stockTakingSession', JSON.stringify(newSession))
    setNewSessionDialog(false)
    setSessionName('')
    setSuccess('New stock taking session created')
  }

  const handleBarcodeScanned = async (barcode: string) => {
    if (!session) {
      setError('Please start a stock taking session first')
      return
    }

    setLoading(true)
    setScannerOpen(false)

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

      // Search for product by barcode or SKU
      const { data: products, error: productError } = await supabase
        .from('erp_products')
        .select('*')
        .eq('company_id', companies.id)
        .or(`barcode.eq.${barcode},sku.eq.${barcode}`)
        .limit(1)

      if (productError) throw productError

      if (!products || products.length === 0) {
        setError(`No product found with barcode/SKU: ${barcode}`)
        return
      }

      const product = products[0]

      // Get current system stock
      const { data: inventory } = await supabase
        .from('current_inventory')
        .select('quantity, available_quantity')
        .eq('product_id', product.id)
        .eq('company_id', companies.id)

      const systemQuantity = inventory?.reduce((sum, inv) => sum + inv.available_quantity, 0) || 0

      // Check if item already exists in session
      const existingItemIndex = session.items.findIndex(item => item.product.id === product.id)

      if (existingItemIndex >= 0) {
        // Increment scanned quantity
        const updatedSession = {
          ...session,
          items: session.items.map((item, index) => 
            index === existingItemIndex
              ? {
                  ...item,
                  scannedQuantity: item.scannedQuantity + 1,
                  difference: (item.scannedQuantity + 1) - item.systemQuantity
                }
              : item
          )
        }
        setSession(updatedSession)
        localStorage.setItem('stockTakingSession', JSON.stringify(updatedSession))
      } else {
        // Add new item
        const newItem: StockItem = {
          id: Date.now().toString(),
          product,
          scannedQuantity: 1,
          systemQuantity,
          difference: 1 - systemQuantity,
          barcode
        }

        const updatedSession = {
          ...session,
          items: [...session.items, newItem]
        }
        setSession(updatedSession)
        localStorage.setItem('stockTakingSession', JSON.stringify(updatedSession))
      }

      setSuccess(`Scanned: ${product.name}`)
      setTimeout(() => setSuccess(null), 2000)

    } catch (err) {
      console.error('Error processing barcode:', err)
      setError('Failed to process barcode scan')
    } finally {
      setLoading(false)
    }
  }

  const addManualProduct = async () => {
    if (!session || !manualSku.trim() || !manualQuantity.trim()) {
      setError('Please fill all fields')
      return
    }

    setLoading(true)

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

      // Search for product by SKU
      const { data: products, error: productError } = await supabase
        .from('erp_products')
        .select('*')
        .eq('company_id', companies.id)
        .eq('sku', manualSku)
        .limit(1)

      if (productError) throw productError

      if (!products || products.length === 0) {
        setError(`No product found with SKU: ${manualSku}`)
        return
      }

      const product = products[0]
      const quantity = parseInt(manualQuantity)

      // Get current system stock
      const { data: inventory } = await supabase
        .from('current_inventory')
        .select('quantity, available_quantity')
        .eq('product_id', product.id)
        .eq('company_id', companies.id)

      const systemQuantity = inventory?.reduce((sum, inv) => sum + inv.available_quantity, 0) || 0

      // Check if item already exists
      const existingItemIndex = session.items.findIndex(item => item.product.id === product.id)

      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedSession = {
          ...session,
          items: session.items.map((item, index) => 
            index === existingItemIndex
              ? {
                  ...item,
                  scannedQuantity: quantity,
                  difference: quantity - item.systemQuantity
                }
              : item
          )
        }
        setSession(updatedSession)
        localStorage.setItem('stockTakingSession', JSON.stringify(updatedSession))
      } else {
        // Add new item
        const newItem: StockItem = {
          id: Date.now().toString(),
          product,
          scannedQuantity: quantity,
          systemQuantity,
          difference: quantity - systemQuantity
        }

        const updatedSession = {
          ...session,
          items: [...session.items, newItem]
        }
        setSession(updatedSession)
        localStorage.setItem('stockTakingSession', JSON.stringify(updatedSession))
      }

      setManualProductDialog(false)
      setManualSku('')
      setManualQuantity('')
      setSuccess(`Added: ${product.name}`)
      setTimeout(() => setSuccess(null), 2000)

    } catch (err) {
      console.error('Error adding manual product:', err)
      setError('Failed to add product')
    } finally {
      setLoading(false)
    }
  }

  const removeItem = (itemId: string) => {
    if (!session) return

    const updatedSession = {
      ...session,
      items: session.items.filter(item => item.id !== itemId)
    }
    setSession(updatedSession)
    localStorage.setItem('stockTakingSession', JSON.stringify(updatedSession))
  }

  const completeSession = () => {
    if (!session) return

    const completedSession = {
      ...session,
      status: 'completed' as const
    }
    
    // In a real app, this would save to database
    localStorage.removeItem('stockTakingSession')
    setSession(null)
    setSuccess('Stock taking session completed successfully')
  }

  const cancelSession = () => {
    localStorage.removeItem('stockTakingSession')
    setSession(null)
    setSuccess('Stock taking session cancelled')
  }

  const getTotalItems = () => session?.items.length || 0
  const getTotalDiscrepancies = () => session?.items.filter(item => item.difference !== 0).length || 0

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Stock Taking
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Scan products to verify inventory levels
          </Typography>
        </Box>
        {!session && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setNewSessionDialog(true)}
          >
            Start New Session
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {session ? (
        <>
          {/* Session Info */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <Typography variant="h6">{session.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Started: {session.createdAt.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Typography variant="h4" color="primary">
                    {getTotalItems()}
                  </Typography>
                  <Typography variant="body2">Items Scanned</Typography>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Typography variant="h4" color={getTotalDiscrepancies() > 0 ? 'error' : 'success'}>
                    {getTotalDiscrepancies()}
                  </Typography>
                  <Typography variant="body2">Discrepancies</Typography>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      startIcon={<QrCodeScanner />}
                      onClick={() => setScannerOpen(true)}
                    >
                      Scan Barcode
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => setManualProductDialog(true)}
                    >
                      Add Manual
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={cancelSession}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={completeSession}
                      disabled={session.items.length === 0}
                    >
                      Complete
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Scanned Items */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Scanned Items ({session.items.length})
              </Typography>
              {session.items.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Inventory sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No items scanned yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start scanning barcodes or add items manually
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell>SKU</TableCell>
                        <TableCell align="right">System Qty</TableCell>
                        <TableCell align="right">Scanned Qty</TableCell>
                        <TableCell align="right">Difference</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {session.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {item.product.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.product.brand}
                            </Typography>
                          </TableCell>
                          <TableCell>{item.product.sku}</TableCell>
                          <TableCell align="right">{item.systemQuantity}</TableCell>
                          <TableCell align="right">{item.scannedQuantity}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={item.difference > 0 ? `+${item.difference}` : item.difference}
                              size="small"
                              color={item.difference === 0 ? 'success' : 'error'}
                              icon={item.difference === 0 ? <CheckCircle /> : <Warning />}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeItem(item.id)}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Inventory sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
            <Typography variant="h5" gutterBottom>
              No Active Stock Taking Session
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Start a new stock taking session to begin scanning and verifying inventory levels.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<Add />}
              onClick={() => setNewSessionDialog(true)}
            >
              Start New Session
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Floating Scan Button */}
      {session && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setScannerOpen(true)}
        >
          <QrCodeScanner />
        </Fab>
      )}

      {/* New Session Dialog */}
      <Dialog open={newSessionDialog} onClose={() => setNewSessionDialog(false)}>
        <DialogTitle>Start New Stock Taking Session</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Session Name"
            fullWidth
            variant="outlined"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="e.g., Monthly Stock Count - January 2024"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewSessionDialog(false)}>Cancel</Button>
          <Button onClick={createNewSession} variant="contained">
            Start Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manual Product Dialog */}
      <Dialog open={manualProductDialog} onClose={() => setManualProductDialog(false)}>
        <DialogTitle>Add Product Manually</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Product SKU"
                fullWidth
                variant="outlined"
                value={manualSku}
                onChange={(e) => setManualSku(e.target.value)}
                placeholder="Enter product SKU"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Quantity"
                fullWidth
                variant="outlined"
                type="number"
                value={manualQuantity}
                onChange={(e) => setManualQuantity(e.target.value)}
                placeholder="Enter counted quantity"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManualProductDialog(false)}>Cancel</Button>
          <Button onClick={addManualProduct} variant="contained">
            Add Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Barcode Scanner */}
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScanned}
        title="Scan Product for Stock Taking"
      />
    </Box>
  )
}