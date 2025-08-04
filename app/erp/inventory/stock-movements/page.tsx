'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Grid,
  Alert,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  TrendingUp,
  TrendingDown,
  SwapHoriz,
  Inventory,
  FilterList
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'

interface StockMovement {
  id: string
  product_name: string
  product_code: string
  movement_type: 'in' | 'out' | 'transfer' | 'adjustment'
  quantity: number
  unit: string
  from_warehouse?: string
  to_warehouse?: string
  reference_number: string
  reference_type: 'purchase' | 'sale' | 'transfer' | 'adjustment' | 'return'
  date: string
  time: string
  user: string
  notes?: string
  cost_per_unit?: number
  total_value?: number
}

const mockStockMovements: StockMovement[] = [
  {
    id: '1',
    product_name: 'Laptop Dell Inspiron 15',
    product_code: 'DELL-INS-15',
    movement_type: 'in',
    quantity: 50,
    unit: 'pcs',
    to_warehouse: 'Main Warehouse',
    reference_number: 'PO-2024-001',
    reference_type: 'purchase',
    date: '2024-01-15',
    time: '10:30 AM',
    user: 'Rajesh Kumar',
    notes: 'New stock arrival from supplier',
    cost_per_unit: 45000,
    total_value: 2250000
  },
  {
    id: '2',
    product_name: 'Office Chair Ergonomic',
    product_code: 'CHAIR-ERG-001',
    movement_type: 'out',
    quantity: 25,
    unit: 'pcs',
    from_warehouse: 'Main Warehouse',
    reference_number: 'SO-2024-015',
    reference_type: 'sale',
    date: '2024-01-15',
    time: '02:15 PM',
    user: 'Priya Sharma',
    cost_per_unit: 8500,
    total_value: 212500
  },
  {
    id: '3',
    product_name: 'Wireless Mouse Logitech',
    product_code: 'LOGI-MOUSE-W1',
    movement_type: 'transfer',
    quantity: 100,
    unit: 'pcs',
    from_warehouse: 'Main Warehouse',
    to_warehouse: 'Secondary Warehouse',
    reference_number: 'TR-2024-003',
    reference_type: 'transfer',
    date: '2024-01-14',
    time: '11:45 AM',
    user: 'Suresh Reddy',
    notes: 'Stock redistribution',
    cost_per_unit: 1200,
    total_value: 120000
  },
  {
    id: '4',
    product_name: 'Printer HP LaserJet',
    product_code: 'HP-LJ-P1102',
    movement_type: 'adjustment',
    quantity: -5,
    unit: 'pcs',
    to_warehouse: 'Main Warehouse',
    reference_number: 'ADJ-2024-001',
    reference_type: 'adjustment',
    date: '2024-01-14',
    time: '04:20 PM',
    user: 'Admin User',
    notes: 'Stock count discrepancy adjustment',
    cost_per_unit: 15000,
    total_value: -75000
  },
  {
    id: '5',
    product_name: 'Monitor Samsung 24"',
    product_code: 'SAM-MON-24',
    movement_type: 'in',
    quantity: 30,
    unit: 'pcs',
    to_warehouse: 'Secondary Warehouse',
    reference_number: 'RT-2024-002',
    reference_type: 'return',
    date: '2024-01-13',
    time: '09:30 AM',
    user: 'Priya Sharma',
    notes: 'Customer return - defective items',
    cost_per_unit: 12000,
    total_value: 360000
  }
]

const getMovementTypeIcon = (type: string) => {
  switch (type) {
    case 'in': return <TrendingUp color="success" />
    case 'out': return <TrendingDown color="error" />
    case 'transfer': return <SwapHoriz color="info" />
    case 'adjustment': return <Edit color="warning" />
    default: return <Inventory />
  }
}

const getMovementTypeColor = (type: string) => {
  switch (type) {
    case 'in': return 'success'
    case 'out': return 'error'
    case 'transfer': return 'info'
    case 'adjustment': return 'warning'
    default: return 'default'
  }
}

const getReferenceTypeColor = (type: string) => {
  switch (type) {
    case 'purchase': return 'primary'
    case 'sale': return 'success'
    case 'transfer': return 'info'
    case 'adjustment': return 'warning'
    case 'return': return 'error'
    default: return 'default'
  }
}

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>(mockStockMovements)
  const [searchTerm, setSearchTerm] = useState('')
  const [movementTypeFilter, setMovementTypeFilter] = useState('')
  const [referenceTypeFilter, setReferenceTypeFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const filteredMovements = movements.filter(movement => {
    const matchesSearch = movement.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.user.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesMovementType = !movementTypeFilter || movement.movement_type === movementTypeFilter
    const matchesReferenceType = !referenceTypeFilter || movement.reference_type === referenceTypeFilter
    
    return matchesSearch && matchesMovementType && matchesReferenceType
  })

  const handleCreateMovement = () => {
    router.push('/erp/inventory/stock-movements/new')
  }

  // Calculate summary statistics
  const totalInbound = movements.filter(m => m.movement_type === 'in').reduce((sum, m) => sum + m.quantity, 0)
  const totalOutbound = movements.filter(m => m.movement_type === 'out').reduce((sum, m) => sum + Math.abs(m.quantity), 0)
  const totalTransfers = movements.filter(m => m.movement_type === 'transfer').length
  const totalAdjustments = movements.filter(m => m.movement_type === 'adjustment').length

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Stock Movements
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateMovement}
        >
          Add Movement
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                <TrendingUp />
              </Avatar>
              <Typography variant="h4">{totalInbound}</Typography>
              <Typography variant="body2" color="textSecondary">
                Total Inbound
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'error.main', mx: 'auto', mb: 1 }}>
                <TrendingDown />
              </Avatar>
              <Typography variant="h4">{totalOutbound}</Typography>
              <Typography variant="body2" color="textSecondary">
                Total Outbound
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1 }}>
                <SwapHoriz />
              </Avatar>
              <Typography variant="h4">{totalTransfers}</Typography>
              <Typography variant="body2" color="textSecondary">
                Total Transfers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                <Edit />
              </Avatar>
              <Typography variant="h4">{totalAdjustments}</Typography>
              <Typography variant="body2" color="textSecondary">
                Total Adjustments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            placeholder="Search movements..."
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
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Movement Type</InputLabel>
            <Select
              value={movementTypeFilter}
              label="Movement Type"
              onChange={(e) => setMovementTypeFilter(e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="in">Inbound</MenuItem>
              <MenuItem value="out">Outbound</MenuItem>
              <MenuItem value="transfer">Transfer</MenuItem>
              <MenuItem value="adjustment">Adjustment</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Reference Type</InputLabel>
            <Select
              value={referenceTypeFilter}
              label="Reference Type"
              onChange={(e) => setReferenceTypeFilter(e.target.value)}
            >
              <MenuItem value="">All References</MenuItem>
              <MenuItem value="purchase">Purchase</MenuItem>
              <MenuItem value="sale">Sale</MenuItem>
              <MenuItem value="transfer">Transfer</MenuItem>
              <MenuItem value="adjustment">Adjustment</MenuItem>
              <MenuItem value="return">Return</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Movement</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Warehouse</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{movement.product_name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {movement.product_code}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getMovementTypeIcon(movement.movement_type)}
                        <Chip
                          label={movement.movement_type.toUpperCase()}
                          color={getMovementTypeColor(movement.movement_type) as any}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={movement.quantity >= 0 ? 'success.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        {movement.quantity >= 0 ? '+' : ''}{movement.quantity} {movement.unit}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {movement.from_warehouse && (
                          <Typography variant="caption" color="textSecondary">
                            From: {movement.from_warehouse}
                          </Typography>
                        )}
                        {movement.to_warehouse && (
                          <Typography variant="caption" color="textSecondary" display="block">
                            To: {movement.to_warehouse}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{movement.reference_number}</Typography>
                        <Chip
                          label={movement.reference_type.toUpperCase()}
                          color={getReferenceTypeColor(movement.reference_type) as any}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{movement.date}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {movement.time}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{movement.user}</TableCell>
                    <TableCell>
                      {movement.total_value && (
                        <Typography 
                          variant="body2" 
                          color={movement.total_value >= 0 ? 'success.main' : 'error.main'}
                          fontWeight="bold"
                        >
                          ₹{Math.abs(movement.total_value).toLocaleString()}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" title="View">
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" title="Edit">
                        <Edit />
                      </IconButton>
                      <IconButton size="small" title="Delete">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredMovements.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No stock movements found matching your criteria.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}