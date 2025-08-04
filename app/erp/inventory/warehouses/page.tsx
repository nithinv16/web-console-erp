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
  LinearProgress
} from '@mui/material'
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  Warehouse,
  LocationOn,
  Inventory,
  TrendingUp
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'

interface WarehouseData {
  id: string
  name: string
  code: string
  address: string
  city: string
  state: string
  pincode: string
  manager: string
  phone: string
  email: string
  capacity: number
  current_stock: number
  total_products: number
  status: 'active' | 'inactive' | 'maintenance'
  created_date: string
}

const mockWarehouses: WarehouseData[] = [
  {
    id: '1',
    name: 'Main Warehouse',
    code: 'WH-001',
    address: '123 Industrial Area, Sector 5',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    manager: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    email: 'rajesh@company.com',
    capacity: 10000,
    current_stock: 7500,
    total_products: 450,
    status: 'active',
    created_date: '2023-01-15'
  },
  {
    id: '2',
    name: 'Secondary Warehouse',
    code: 'WH-002',
    address: '456 Logistics Hub, Phase 2',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    manager: 'Priya Sharma',
    phone: '+91 87654 32109',
    email: 'priya@company.com',
    capacity: 8000,
    current_stock: 5200,
    total_products: 320,
    status: 'active',
    created_date: '2023-03-20'
  },
  {
    id: '3',
    name: 'Regional Warehouse - South',
    code: 'WH-003',
    address: '789 Export Zone, IT Park',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560001',
    manager: 'Suresh Reddy',
    phone: '+91 76543 21098',
    email: 'suresh@company.com',
    capacity: 6000,
    current_stock: 3800,
    total_products: 280,
    status: 'maintenance',
    created_date: '2023-06-10'
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'inactive': return 'error'
    case 'maintenance': return 'warning'
    default: return 'default'
  }
}

const getCapacityUtilization = (current: number, capacity: number) => {
  return Math.round((current / capacity) * 100)
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseData[]>(mockWarehouses)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const filteredWarehouses = warehouses.filter(warehouse =>
    warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.manager.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateWarehouse = () => {
    router.push('/erp/inventory/warehouses/new')
  }

  const totalCapacity = warehouses.reduce((sum, wh) => sum + wh.capacity, 0)
  const totalCurrentStock = warehouses.reduce((sum, wh) => sum + wh.current_stock, 0)
  const totalProducts = warehouses.reduce((sum, wh) => sum + wh.total_products, 0)
  const overallUtilization = Math.round((totalCurrentStock / totalCapacity) * 100)

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Warehouses
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateWarehouse}
        >
          Add Warehouse
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                <Warehouse />
              </Avatar>
              <Typography variant="h4">{warehouses.length}</Typography>
              <Typography variant="body2" color="textSecondary">
                Total Warehouses
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1 }}>
                <Inventory />
              </Avatar>
              <Typography variant="h4">{totalProducts}</Typography>
              <Typography variant="body2" color="textSecondary">
                Total Products
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                <TrendingUp />
              </Avatar>
              <Typography variant="h4">{totalCapacity.toLocaleString()}</Typography>
              <Typography variant="body2" color="textSecondary">
                Total Capacity (sq ft)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                <LocationOn />
              </Avatar>
              <Typography variant="h4">{overallUtilization}%</Typography>
              <Typography variant="body2" color="textSecondary">
                Overall Utilization
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            placeholder="Search warehouses..."
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
      </Grid>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Warehouse</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Manager</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>Current Stock</TableCell>
                  <TableCell>Utilization</TableCell>
                  <TableCell>Products</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredWarehouses.map((warehouse) => {
                  const utilization = getCapacityUtilization(warehouse.current_stock, warehouse.capacity)
                  return (
                    <TableRow key={warehouse.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">{warehouse.name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {warehouse.code}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{warehouse.city}, {warehouse.state}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {warehouse.pincode}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{warehouse.manager}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {warehouse.phone}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{warehouse.capacity.toLocaleString()} sq ft</TableCell>
                      <TableCell>{warehouse.current_stock.toLocaleString()} sq ft</TableCell>
                      <TableCell>
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={utilization} 
                                color={utilization > 80 ? 'error' : utilization > 60 ? 'warning' : 'primary'}
                              />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                              <Typography variant="body2" color="text.secondary">
                                {utilization}%
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{warehouse.total_products}</TableCell>
                      <TableCell>
                        <Chip
                          label={warehouse.status.toUpperCase()}
                          color={getStatusColor(warehouse.status) as any}
                          size="small"
                        />
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
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredWarehouses.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No warehouses found. Add your first warehouse to get started.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}