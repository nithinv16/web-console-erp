# Detailed ERP Implementation Plan - Odoo-like System for DukaaOn

## Executive Summary
This document outlines a comprehensive implementation plan for building an Odoo-like ERP system tailored for DukaaOn's multi-role marketplace (wholesalers, manufacturers, distributors). The system will be built using modern web technologies with a focus on scalability, modularity, and cost-effectiveness.

## System Architecture Overview

### Core Architecture Principles
- **Modular Design**: Each ERP module as independent but interconnected components
- **Multi-tenant**: Support for multiple businesses with data isolation
- **Role-based Access**: Granular permissions for different user types
- **API-first**: RESTful APIs with GraphQL for complex queries
- **Real-time**: WebSocket connections for live updates
- **Microservices**: Scalable backend services

### Technology Stack
```
Frontend: Next.js 14, TypeScript, Material-UI, Zustand
Backend: Supabase (PostgreSQL), Edge Functions
Real-time: Supabase Realtime
Caching: Redis (Upstash)
File Storage: Supabase Storage
Payments: Razorpay, Stripe
Deployment: Vercel, Supabase
```

## Phase 1: Core ERP Foundation (Months 1-3)

### 1.1 Database Schema Enhancement

#### New Tables Structure

```sql
-- Companies/Organizations
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  type ENUM('wholesaler', 'manufacturer', 'distributor'),
  registration_number VARCHAR(100),
  gst_number VARCHAR(15),
  pan_number VARCHAR(10),
  address JSONB,
  contact_info JSONB,
  settings JSONB DEFAULT '{}',
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  parent_id UUID REFERENCES departments(id),
  manager_id UUID REFERENCES profiles(id),
  budget DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Employees
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  company_id UUID REFERENCES companies(id),
  employee_code VARCHAR(50) UNIQUE NOT NULL,
  department_id UUID REFERENCES departments(id),
  position VARCHAR(255),
  salary DECIMAL(12,2),
  hire_date DATE,
  status ENUM('active', 'inactive', 'terminated') DEFAULT 'active',
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Suppliers
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address JSONB,
  payment_terms INTEGER DEFAULT 30,
  credit_limit DECIMAL(15,2),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  status ENUM('active', 'inactive', 'blacklisted') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Customers (Enhanced)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  type ENUM('individual', 'business'),
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address JSONB,
  credit_limit DECIMAL(15,2),
  payment_terms INTEGER DEFAULT 30,
  territory_id UUID,
  sales_rep_id UUID REFERENCES employees(id),
  status ENUM('active', 'inactive', 'blocked') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Warehouses
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  address JSONB,
  manager_id UUID REFERENCES employees(id),
  capacity DECIMAL(12,2),
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Product Categories (Enhanced)
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  parent_id UUID REFERENCES product_categories(id),
  description TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Products (Enhanced)
CREATE TABLE products_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES product_categories(id),
  brand VARCHAR(255),
  description TEXT,
  specifications JSONB,
  unit_of_measure VARCHAR(50),
  weight DECIMAL(10,3),
  dimensions JSONB,
  cost_price DECIMAL(12,2),
  selling_price DECIMAL(12,2),
  min_stock_level INTEGER DEFAULT 0,
  max_stock_level INTEGER,
  reorder_point INTEGER,
  lead_time_days INTEGER,
  is_serialized BOOLEAN DEFAULT FALSE,
  is_batch_tracked BOOLEAN DEFAULT FALSE,
  expiry_tracking BOOLEAN DEFAULT FALSE,
  status ENUM('active', 'inactive', 'discontinued') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Inventory Transactions
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  product_id UUID REFERENCES products_enhanced(id),
  warehouse_id UUID REFERENCES warehouses(id),
  transaction_type ENUM('in', 'out', 'transfer', 'adjustment'),
  quantity DECIMAL(12,3),
  unit_cost DECIMAL(12,2),
  reference_type VARCHAR(50),
  reference_id UUID,
  batch_number VARCHAR(100),
  serial_number VARCHAR(100),
  expiry_date DATE,
  notes TEXT,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Purchase Orders
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  po_number VARCHAR(100) UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  warehouse_id UUID REFERENCES warehouses(id),
  order_date DATE NOT NULL,
  expected_date DATE,
  status ENUM('draft', 'sent', 'confirmed', 'partial', 'received', 'cancelled') DEFAULT 'draft',
  subtotal DECIMAL(15,2),
  tax_amount DECIMAL(15,2),
  total_amount DECIMAL(15,2),
  notes TEXT,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Purchase Order Items
CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES purchase_orders(id),
  product_id UUID REFERENCES products_enhanced(id),
  quantity DECIMAL(12,3),
  unit_price DECIMAL(12,2),
  tax_rate DECIMAL(5,2),
  line_total DECIMAL(15,2),
  received_quantity DECIMAL(12,3) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sales Orders (Enhanced)
CREATE TABLE sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  so_number VARCHAR(100) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  warehouse_id UUID REFERENCES warehouses(id),
  order_date DATE NOT NULL,
  delivery_date DATE,
  status ENUM('draft', 'confirmed', 'partial', 'delivered', 'cancelled') DEFAULT 'draft',
  subtotal DECIMAL(15,2),
  discount_amount DECIMAL(15,2),
  tax_amount DECIMAL(15,2),
  total_amount DECIMAL(15,2),
  payment_status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
  sales_rep_id UUID REFERENCES employees(id),
  notes TEXT,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chart of Accounts
CREATE TABLE chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  account_code VARCHAR(20) UNIQUE NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  account_type ENUM('asset', 'liability', 'equity', 'revenue', 'expense'),
  parent_id UUID REFERENCES chart_of_accounts(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Journal Entries
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  entry_number VARCHAR(100) UNIQUE NOT NULL,
  entry_date DATE NOT NULL,
  reference VARCHAR(255),
  description TEXT,
  total_debit DECIMAL(15,2),
  total_credit DECIMAL(15,2),
  status ENUM('draft', 'posted', 'cancelled') DEFAULT 'draft',
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Journal Entry Lines
CREATE TABLE journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID REFERENCES journal_entries(id),
  account_id UUID REFERENCES chart_of_accounts(id),
  debit_amount DECIMAL(15,2) DEFAULT 0,
  credit_amount DECIMAL(15,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 1.2 API Layer Architecture

#### Core API Modules

```typescript
// types/erp.ts
export interface Company {
  id: string;
  name: string;
  code: string;
  type: 'wholesaler' | 'manufacturer' | 'distributor';
  registrationNumber?: string;
  gstNumber?: string;
  panNumber?: string;
  address: Address;
  contactInfo: ContactInfo;
  settings: CompanySettings;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  userId: string;
  companyId: string;
  employeeCode: string;
  departmentId: string;
  position: string;
  salary: number;
  hireDate: string;
  status: 'active' | 'inactive' | 'terminated';
  permissions: Record<string, boolean>;
}

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: Address;
  paymentTerms: number;
  creditLimit: number;
  rating: number;
  status: 'active' | 'inactive' | 'blacklisted';
}

export interface PurchaseOrder {
  id: string;
  companyId: string;
  poNumber: string;
  supplierId: string;
  warehouseId: string;
  orderDate: string;
  expectedDate: string;
  status: 'draft' | 'sent' | 'confirmed' | 'partial' | 'received' | 'cancelled';
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  items: PurchaseOrderItem[];
  notes?: string;
}
```

#### API Endpoints Structure

```typescript
// lib/api/erp-api.ts
export class ERPApi {
  // Company Management
  static async getCompany(id: string): Promise<Company> {}
  static async updateCompany(id: string, data: Partial<Company>): Promise<Company> {}
  
  // Employee Management
  static async getEmployees(companyId: string): Promise<Employee[]> {}
  static async createEmployee(data: CreateEmployeeData): Promise<Employee> {}
  static async updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {}
  
  // Supplier Management
  static async getSuppliers(companyId: string): Promise<Supplier[]> {}
  static async createSupplier(data: CreateSupplierData): Promise<Supplier> {}
  static async updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier> {}
  
  // Purchase Order Management
  static async getPurchaseOrders(companyId: string): Promise<PurchaseOrder[]> {}
  static async createPurchaseOrder(data: CreatePurchaseOrderData): Promise<PurchaseOrder> {}
  static async updatePurchaseOrder(id: string, data: Partial<PurchaseOrder>): Promise<PurchaseOrder> {}
  
  // Inventory Management
  static async getInventoryByWarehouse(warehouseId: string): Promise<InventoryItem[]> {}
  static async createInventoryTransaction(data: CreateInventoryTransactionData): Promise<InventoryTransaction> {}
  
  // Financial Management
  static async getChartOfAccounts(companyId: string): Promise<Account[]> {}
  static async createJournalEntry(data: CreateJournalEntryData): Promise<JournalEntry> {}
  static async getFinancialReports(companyId: string, type: string, period: string): Promise<FinancialReport> {}
}
```

### 1.3 Authentication & Authorization

#### Role-Based Access Control (RBAC)

```typescript
// lib/auth/permissions.ts
export const PERMISSIONS = {
  // Company Management
  COMPANY_VIEW: 'company:view',
  COMPANY_EDIT: 'company:edit',
  
  // Employee Management
  EMPLOYEE_VIEW: 'employee:view',
  EMPLOYEE_CREATE: 'employee:create',
  EMPLOYEE_EDIT: 'employee:edit',
  EMPLOYEE_DELETE: 'employee:delete',
  
  // Supplier Management
  SUPPLIER_VIEW: 'supplier:view',
  SUPPLIER_CREATE: 'supplier:create',
  SUPPLIER_EDIT: 'supplier:edit',
  
  // Purchase Management
  PURCHASE_VIEW: 'purchase:view',
  PURCHASE_CREATE: 'purchase:create',
  PURCHASE_APPROVE: 'purchase:approve',
  
  // Inventory Management
  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_EDIT: 'inventory:edit',
  INVENTORY_TRANSFER: 'inventory:transfer',
  
  // Financial Management
  FINANCE_VIEW: 'finance:view',
  FINANCE_EDIT: 'finance:edit',
  FINANCE_APPROVE: 'finance:approve',
  
  // Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
} as const;

export const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS),
  manager: [
    PERMISSIONS.COMPANY_VIEW,
    PERMISSIONS.EMPLOYEE_VIEW,
    PERMISSIONS.EMPLOYEE_CREATE,
    PERMISSIONS.SUPPLIER_VIEW,
    PERMISSIONS.SUPPLIER_CREATE,
    PERMISSIONS.PURCHASE_VIEW,
    PERMISSIONS.PURCHASE_CREATE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_EDIT,
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
  employee: [
    PERMISSIONS.COMPANY_VIEW,
    PERMISSIONS.SUPPLIER_VIEW,
    PERMISSIONS.PURCHASE_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
  viewer: [
    PERMISSIONS.COMPANY_VIEW,
    PERMISSIONS.SUPPLIER_VIEW,
    PERMISSIONS.PURCHASE_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
};
```

## Phase 2: Supply Chain Management (Months 4-6)

### 2.1 Supplier Management Module

#### Features Implementation

```typescript
// components/suppliers/SupplierManagement.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  DataGrid,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Rating,
} from '@mui/material';
import { Add, Edit, Delete, Visibility } from '@mui/icons-material';

interface SupplierManagementProps {
  companyId: string;
}

export const SupplierManagement: React.FC<SupplierManagementProps> = ({ companyId }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const columns = [
    { field: 'code', headerName: 'Code', width: 100 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'contactPerson', headerName: 'Contact Person', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'phone', headerName: 'Phone', width: 130 },
    {
      field: 'rating',
      headerName: 'Rating',
      width: 120,
      renderCell: (params) => <Rating value={params.value} readOnly size="small" />,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'active' ? 'success' : 'error'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Box>
          <Button size="small" onClick={() => handleView(params.row)}>
            <Visibility />
          </Button>
          <Button size="small" onClick={() => handleEdit(params.row)}>
            <Edit />
          </Button>
        </Box>
      ),
    },
  ];

  const handleView = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDialogOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDialogOpen(true);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Supplier Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setSelectedSupplier(null);
            setDialogOpen(true);
          }}
        >
          Add Supplier
        </Button>
      </Box>

      <Card>
        <CardContent>
          <DataGrid
            rows={suppliers}
            columns={columns}
            pageSize={25}
            loading={loading}
            autoHeight
            disableSelectionOnClick
          />
        </CardContent>
      </Card>

      <SupplierDialog
        open={dialogOpen}
        supplier={selectedSupplier}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveSupplier}
      />
    </Box>
  );
};
```

### 2.2 Purchase Order Management

#### Purchase Order Creation Workflow

```typescript
// components/purchase/PurchaseOrderForm.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Autocomplete,
} from '@mui/material';
import { Add, Delete, Save, Send } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';

interface PurchaseOrderFormProps {
  companyId: string;
  orderId?: string;
}

export const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({
  companyId,
  orderId,
}) => {
  const [order, setOrder] = useState<Partial<PurchaseOrder>>({
    companyId,
    orderDate: new Date().toISOString().split('T')[0],
    status: 'draft',
    items: [],
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const addItem = () => {
    setOrder(prev => ({
      ...prev,
      items: [
        ...(prev.items || []),
        {
          id: `temp-${Date.now()}`,
          productId: '',
          quantity: 1,
          unitPrice: 0,
          taxRate: 18,
          lineTotal: 0,
        },
      ],
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setOrder(prev => {
      const items = [...(prev.items || [])];
      items[index] = { ...items[index], [field]: value };
      
      // Recalculate line total
      if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
        const item = items[index];
        const subtotal = item.quantity * item.unitPrice;
        const taxAmount = (subtotal * item.taxRate) / 100;
        item.lineTotal = subtotal + taxAmount;
      }
      
      return { ...prev, items };
    });
  };

  const removeItem = (index: number) => {
    setOrder(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index) || [],
    }));
  };

  const calculateTotals = () => {
    const items = order.items || [];
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      return sum + (itemSubtotal * item.taxRate) / 100;
    }, 0);
    const total = subtotal + taxAmount;
    
    return { subtotal, taxAmount, total };
  };

  const handleSave = async (status: 'draft' | 'sent') => {
    const totals = calculateTotals();
    const orderData = {
      ...order,
      status,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      totalAmount: totals.total,
    };
    
    try {
      if (orderId) {
        await ERPApi.updatePurchaseOrder(orderId, orderData);
      } else {
        await ERPApi.createPurchaseOrder(orderData);
      }
      // Handle success
    } catch (error) {
      // Handle error
    }
  };

  const totals = calculateTotals();

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        {orderId ? 'Edit' : 'Create'} Purchase Order
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={2}>
            <FormControl fullWidth>
              <InputLabel>Supplier</InputLabel>
              <Select
                value={order.supplierId || ''}
                onChange={(e) => setOrder(prev => ({ ...prev, supplierId: e.target.value }))}
              >
                {suppliers.map(supplier => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Warehouse</InputLabel>
              <Select
                value={order.warehouseId || ''}
                onChange={(e) => setOrder(prev => ({ ...prev, warehouseId: e.target.value }))}
              >
                {warehouses.map(warehouse => (
                  <MenuItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <DatePicker
              label="Expected Date"
              value={order.expectedDate}
              onChange={(date) => setOrder(prev => ({ ...prev, expectedDate: date }))}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Order Items</Typography>
            <Button startIcon={<Add />} onClick={addItem}>
              Add Item
            </Button>
          </Box>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Unit Price</TableCell>
                <TableCell>Tax Rate (%)</TableCell>
                <TableCell>Line Total</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(order.items || []).map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Autocomplete
                      options={products}
                      getOptionLabel={(option) => option.name}
                      value={products.find(p => p.id === item.productId) || null}
                      onChange={(_, product) => updateItem(index, 'productId', product?.id || '')}
                      renderInput={(params) => <TextField {...params} />}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={item.taxRate}
                      onChange={(e) => updateItem(index, 'taxRate', Number(e.target.value))}
                    />
                  </TableCell>
                  <TableCell>₹{item.lineTotal?.toFixed(2)}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => removeItem(index)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Box mt={3} display="flex" justifyContent="flex-end">
            <Box width={300}>
              <Box display="flex" justifyContent="space-between">
                <Typography>Subtotal:</Typography>
                <Typography>₹{totals.subtotal.toFixed(2)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography>Tax:</Typography>
                <Typography>₹{totals.taxAmount.toFixed(2)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" fontWeight="bold">
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6">₹{totals.total.toFixed(2)}</Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box display="flex" gap={2}>
        <Button
          variant="outlined"
          startIcon={<Save />}
          onClick={() => handleSave('draft')}
        >
          Save as Draft
        </Button>
        <Button
          variant="contained"
          startIcon={<Send />}
          onClick={() => handleSave('sent')}
        >
          Send to Supplier
        </Button>
      </Box>
    </Box>
  );
};
```

### 2.3 Advanced Inventory Management

#### Multi-Warehouse Inventory Tracking

```typescript
// components/inventory/InventoryDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Alert,
} from '@mui/material';
import { Warning, TrendingDown, TrendingUp } from '@mui/icons-material';

interface InventoryDashboardProps {
  companyId: string;
}

export const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ companyId }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [inventoryData, setInventoryData] = useState<InventoryData[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [expiringItems, setExpiringItems] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const getStockStatus = (current: number, min: number, max: number) => {
    if (current <= min) return { status: 'low', color: 'error' };
    if (current >= max) return { status: 'high', color: 'warning' };
    return { status: 'normal', color: 'success' };
  };

  const getStockPercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Inventory Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                Total Products
              </Typography>
              <Typography variant="h3">
                {inventoryData.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                Low Stock Items
              </Typography>
              <Typography variant="h3" color="error">
                {lowStockItems.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                Expiring Soon
              </Typography>
              <Typography variant="h3" color="warning">
                {expiringItems.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                Total Value
              </Typography>
              <Typography variant="h3">
                ₹{inventoryData.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0).toFixed(0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alerts */}
      {lowStockItems.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            {lowStockItems.length} items are running low on stock. Consider reordering.
          </Typography>
        </Alert>
      )}

      {expiringItems.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2">
            {expiringItems.length} items are expiring within 30 days.
          </Typography>
        </Alert>
      )}

      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
            <Tab label="All Inventory" />
            <Tab label="Low Stock" />
            <Tab label="Expiring Soon" />
            <Tab label="By Warehouse" />
          </Tabs>

          <Box mt={3}>
            {activeTab === 0 && (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell>Warehouse</TableCell>
                    <TableCell>Current Stock</TableCell>
                    <TableCell>Stock Level</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventoryData.map((item) => {
                    const stockStatus = getStockStatus(item.quantity, item.minStock, item.maxStock);
                    const stockPercentage = getStockPercentage(item.quantity, item.maxStock);
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.sku}</TableCell>
                        <TableCell>{item.warehouseName}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LinearProgress
                              variant="determinate"
                              value={stockPercentage}
                              color={stockStatus.color}
                              sx={{ width: 100, height: 8 }}
                            />
                            <Typography variant="body2">
                              {stockPercentage.toFixed(0)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>₹{(item.quantity * item.unitCost).toFixed(2)}</TableCell>
                        <TableCell>
                          <Chip
                            label={stockStatus.status}
                            color={stockStatus.color}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {activeTab === 1 && (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Current Stock</TableCell>
                    <TableCell>Min Stock</TableCell>
                    <TableCell>Reorder Point</TableCell>
                    <TableCell>Suggested Order Qty</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lowStockItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Warning color="error" fontSize="small" />
                          {item.quantity}
                        </Box>
                      </TableCell>
                      <TableCell>{item.minStock}</TableCell>
                      <TableCell>{item.reorderPoint}</TableCell>
                      <TableCell>{item.maxStock - item.quantity}</TableCell>
                      <TableCell>
                        <Button size="small" variant="contained">
                          Create PO
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
```

## Phase 3: Manufacturing Resource Planning (Months 7-9)

### 3.1 Bill of Materials (BOM) Management

#### BOM Structure and Components

```sql
-- Bill of Materials
CREATE TABLE bill_of_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  product_id UUID REFERENCES products_enhanced(id),
  bom_number VARCHAR(100) UNIQUE NOT NULL,
  version VARCHAR(20) DEFAULT '1.0',
  description TEXT,
  quantity DECIMAL(12,3) DEFAULT 1,
  unit_of_measure VARCHAR(50),
  status ENUM('draft', 'active', 'inactive') DEFAULT 'draft',
  effective_date DATE,
  expiry_date DATE,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- BOM Components
CREATE TABLE bom_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id UUID REFERENCES bill_of_materials(id),
  component_product_id UUID REFERENCES products_enhanced(id),
  quantity DECIMAL(12,3) NOT NULL,
  unit_of_measure VARCHAR(50),
  scrap_percentage DECIMAL(5,2) DEFAULT 0,
  operation_sequence INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Work Centers
CREATE TABLE work_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  capacity_per_hour DECIMAL(10,2),
  cost_per_hour DECIMAL(10,2),
  efficiency_percentage DECIMAL(5,2) DEFAULT 100,
  status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Production Routes
CREATE TABLE production_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id UUID REFERENCES bill_of_materials(id),
  operation_name VARCHAR(255) NOT NULL,
  sequence_number INTEGER NOT NULL,
  work_center_id UUID REFERENCES work_centers(id),
  setup_time_minutes INTEGER DEFAULT 0,
  cycle_time_minutes DECIMAL(8,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### BOM Management Interface

```typescript
// components/manufacturing/BOMManagement.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ExpandMore,
  PlayArrow,
  ContentCopy,
} from '@mui/icons-material';

interface BOMManagementProps {
  companyId: string;
}

export const BOMManagement: React.FC<BOMManagementProps> = ({ companyId }) => {
  const [boms, setBoms] = useState<BillOfMaterials[]>([]);
  const [selectedBOM, setSelectedBOM] = useState<BillOfMaterials | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);

  const BOMCard: React.FC<{ bom: BillOfMaterials }> = ({ bom }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">{bom.bomNumber}</Typography>
            <Typography variant="body2" color="textSecondary">
              {bom.productName} - Version {bom.version}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Chip
              label={bom.status}
              color={bom.status === 'active' ? 'success' : 'default'}
              size="small"
            />
            <IconButton onClick={() => handleEdit(bom)}>
              <Edit />
            </IconButton>
            <IconButton onClick={() => handleCopy(bom)}>
              <ContentCopy />
            </IconButton>
          </Box>
        </Box>

        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Components ({bom.components?.length || 0})</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Component</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Scrap %</TableCell>
                  <TableCell>Total Needed</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bom.components?.map((component) => (
                  <TableRow key={component.id}>
                    <TableCell>{component.componentName}</TableCell>
                    <TableCell>{component.quantity}</TableCell>
                    <TableCell>{component.unitOfMeasure}</TableCell>
                    <TableCell>{component.scrapPercentage}%</TableCell>
                    <TableCell>
                      {(component.quantity * (1 + component.scrapPercentage / 100)).toFixed(3)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Production Route ({bom.route?.length || 0} operations)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Sequence</TableCell>
                  <TableCell>Operation</TableCell>
                  <TableCell>Work Center</TableCell>
                  <TableCell>Setup Time</TableCell>
                  <TableCell>Cycle Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bom.route?.map((operation) => (
                  <TableRow key={operation.id}>
                    <TableCell>{operation.sequenceNumber}</TableCell>
                    <TableCell>{operation.operationName}</TableCell>
                    <TableCell>{operation.workCenterName}</TableCell>
                    <TableCell>{operation.setupTimeMinutes} min</TableCell>
                    <TableCell>{operation.cycleTimeMinutes} min</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Bill of Materials</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setSelectedBOM(null);
            setDialogOpen(true);
          }}
        >
          Create BOM
        </Button>
      </Box>

      {boms.map((bom) => (
        <BOMCard key={bom.id} bom={bom} />
      ))}

      <BOMDialog
        open={dialogOpen}
        bom={selectedBOM}
        products={products}
        workCenters={workCenters}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveBOM}
      />
    </Box>
  );
};
```

### 3.2 Production Planning & Scheduling

#### Production Order Management

```sql
-- Production Orders
CREATE TABLE production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  po_number VARCHAR(100) UNIQUE NOT NULL,
  bom_id UUID REFERENCES bill_of_materials(id),
  product_id UUID REFERENCES products_enhanced(id),
  quantity_to_produce DECIMAL(12,3) NOT NULL,
  quantity_produced DECIMAL(12,3) DEFAULT 0,
  planned_start_date DATE,
  planned_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  status ENUM('draft', 'planned', 'in_progress', 'completed', 'cancelled') DEFAULT 'draft',
  source_document VARCHAR(255),
  source_document_id UUID,
  notes TEXT,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Work Orders
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id UUID REFERENCES production_orders(id),
  operation_id UUID REFERENCES production_routes(id),
  work_center_id UUID REFERENCES work_centers(id),
  sequence_number INTEGER NOT NULL,
  planned_start_time TIMESTAMP,
  planned_end_time TIMESTAMP,
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  quantity_to_process DECIMAL(12,3),
  quantity_processed DECIMAL(12,3) DEFAULT 0,
  status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  assigned_to UUID REFERENCES employees(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Material Consumption
CREATE TABLE material_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id UUID REFERENCES production_orders(id),
  work_order_id UUID REFERENCES work_orders(id),
  product_id UUID REFERENCES products_enhanced(id),
  planned_quantity DECIMAL(12,3),
  consumed_quantity DECIMAL(12,3),
  warehouse_id UUID REFERENCES warehouses(id),
  batch_number VARCHAR(100),
  consumption_date TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES employees(id)
);
```

#### Production Planning Dashboard

```typescript
// components/manufacturing/ProductionPlanning.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add,
  PlayArrow,
  Pause,
  Stop,
  Schedule,
  TrendingUp,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { Gantt } from '@mui/x-charts';

interface ProductionPlanningProps {
  companyId: string;
}

export const ProductionPlanning: React.FC<ProductionPlanningProps> = ({ companyId }) => {
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [view, setView] = useState<'list' | 'gantt' | 'capacity'>('list');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'primary';
      case 'planned': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const calculateProgress = (produced: number, total: number) => {
    return (produced / total) * 100;
  };

  const ProductionOrderCard: React.FC<{ order: ProductionOrder }> = ({ order }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">{order.poNumber}</Typography>
            <Typography variant="body2" color="textSecondary">
              {order.productName} - {order.quantityToProduce} units
            </Typography>
          </Box>
          <Box display="flex" gap={1} alignItems="center">
            <Chip
              label={order.priority}
              color={getPriorityColor(order.priority)}
              size="small"
            />
            <Chip
              label={order.status}
              color={getStatusColor(order.status)}
              size="small"
            />
          </Box>
        </Box>

        <Box mt={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2">Progress</Typography>
            <Typography variant="body2">
              {order.quantityProduced} / {order.quantityToProduce}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={calculateProgress(order.quantityProduced, order.quantityToProduce)}
            color={getStatusColor(order.status)}
          />
        </Box>

        <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="caption" color="textSecondary">
              Planned: {order.plannedStartDate} - {order.plannedEndDate}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            {order.status === 'planned' && (
              <Button
                size="small"
                startIcon={<PlayArrow />}
                onClick={() => handleStartProduction(order.id)}
              >
                Start
              </Button>
            )}
            {order.status === 'in_progress' && (
              <>
                <Button
                  size="small"
                  startIcon={<Pause />}
                  onClick={() => handlePauseProduction(order.id)}
                >
                  Pause
                </Button>
                <Button
                  size="small"
                  startIcon={<Stop />}
                  onClick={() => handleCompleteProduction(order.id)}
                >
                  Complete
                </Button>
              </>
            )}
            <Button
              size="small"
              onClick={() => handleViewDetails(order)}
            >
              Details
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const CapacityView: React.FC = () => (
    <Grid container spacing={3}>
      {workCenters.map((workCenter) => (
        <Grid item xs={12} md={6} lg={4} key={workCenter.id}>
          <Card>
            <CardContent>
              <Typography variant="h6">{workCenter.name}</Typography>
              <Typography variant="body2" color="textSecondary" mb={2}>
                Capacity: {workCenter.capacityPerHour} units/hour
              </Typography>
              
              <Box mb={2}>
                <Typography variant="body2">Current Utilization</Typography>
                <LinearProgress
                  variant="determinate"
                  value={workCenter.currentUtilization}
                  color={workCenter.currentUtilization > 90 ? 'error' : 'primary'}
                />
                <Typography variant="caption">
                  {workCenter.currentUtilization}%
                </Typography>
              </Box>
              
              <Typography variant="body2">
                Scheduled Orders: {workCenter.scheduledOrders}
              </Typography>
              <Typography variant="body2">
                Available Capacity: {workCenter.availableCapacity} hours
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Production Planning</Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small">
            <InputLabel>View</InputLabel>
            <Select value={view} onChange={(e) => setView(e.target.value as any)}>
              <MenuItem value="list">List View</MenuItem>
              <MenuItem value="gantt">Gantt Chart</MenuItem>
              <MenuItem value="capacity">Capacity View</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setSelectedOrder(null);
              setDialogOpen(true);
            }}
          >
            Create Production Order
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                Active Orders
              </Typography>
              <Typography variant="h3">
                {productionOrders.filter(o => o.status === 'in_progress').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                Planned Orders
              </Typography>
              <Typography variant="h3">
                {productionOrders.filter(o => o.status === 'planned').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                Completed Today
              </Typography>
              <Typography variant="h3">
                {productionOrders.filter(o => 
                  o.status === 'completed' && 
                  new Date(o.actualEndDate).toDateString() === new Date().toDateString()
                ).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                Avg Efficiency
              </Typography>
              <Typography variant="h3" color="success">
                87%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {view === 'list' && (
        <Box>
          {productionOrders.map((order) => (
            <ProductionOrderCard key={order.id} order={order} />
          ))}
        </Box>
      )}

      {view === 'capacity' && <CapacityView />}

      <ProductionOrderDialog
        open={dialogOpen}
        order={selectedOrder}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveOrder}
      />
    </Box>
  );
};
```

### 3.3 Quality Control Management

#### Quality Control Workflows

```sql
-- Quality Control Plans
CREATE TABLE quality_control_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  product_id UUID REFERENCES products_enhanced(id),
  operation_id UUID REFERENCES production_routes(id),
  inspection_type ENUM('incoming', 'in_process', 'final', 'random') NOT NULL,
  sampling_method ENUM('full', 'statistical', 'random') DEFAULT 'statistical',
  sample_size INTEGER,
  acceptance_criteria JSONB,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quality Inspections
CREATE TABLE quality_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  inspection_number VARCHAR(100) UNIQUE NOT NULL,
  qc_plan_id UUID REFERENCES quality_control_plans(id),
  production_order_id UUID REFERENCES production_orders(id),
  work_order_id UUID REFERENCES work_orders(id),
  inspector_id UUID REFERENCES employees(id),
  inspection_date TIMESTAMP DEFAULT NOW(),
  batch_number VARCHAR(100),
  quantity_inspected DECIMAL(12,3),
  quantity_passed DECIMAL(12,3),
  quantity_failed DECIMAL(12,3),
  overall_result ENUM('pass', 'fail', 'conditional') NOT NULL,
  notes TEXT,
  status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quality Test Results
CREATE TABLE quality_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID REFERENCES quality_inspections(id),
  test_parameter VARCHAR(255) NOT NULL,
  expected_value VARCHAR(255),
  actual_value VARCHAR(255),
  tolerance_min VARCHAR(255),
  tolerance_max VARCHAR(255),
  result ENUM('pass', 'fail') NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Phase 4: Financial Management (Months 10-12)

### 4.1 General Ledger & Accounting

#### Double-Entry Bookkeeping System

```typescript
// lib/accounting/journal-entries.ts
export class AccountingService {
  static async createJournalEntry(data: CreateJournalEntryData): Promise<JournalEntry> {
    // Validate that debits equal credits
    const totalDebits = data.lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0);
    const totalCredits = data.lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0);
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new Error('Debits must equal credits');
    }
    
    const entry = await supabase
      .from('journal_entries')
      .insert({
        ...data,
        total_debit: totalDebits,
        total_credit: totalCredits,
        status: 'draft'
      })
      .select()
      .single();
    
    // Insert journal entry lines
    await supabase
      .from('journal_entry_lines')
      .insert(
        data.lines.map(line => ({
          journal_entry_id: entry.id,
          account_id: line.accountId,
          debit_amount: line.debitAmount || 0,
          credit_amount: line.creditAmount || 0,
          description: line.description
        }))
      );
    
    return entry;
  }
  
  static async postJournalEntry(entryId: string): Promise<void> {
    // Update entry status to posted
    await supabase
      .from('journal_entries')
      .update({ status: 'posted' })
      .eq('id', entryId);
    
    // Update account balances
    const { data: lines } = await supabase
      .from('journal_entry_lines')
      .select('*')
      .eq('journal_entry_id', entryId);
    
    for (const line of lines) {
      await this.updateAccountBalance(line.account_id, line.debit_amount, line.credit_amount);
    }
  }
  
  static async generateTrialBalance(companyId: string, asOfDate: string): Promise<TrialBalance[]> {
    const { data } = await supabase.rpc('generate_trial_balance', {
      company_id: companyId,
      as_of_date: asOfDate
    });
    
    return data;
  }
  
  static async generateIncomeStatement(
    companyId: string, 
    startDate: string, 
    endDate: string
  ): Promise<IncomeStatement> {
    const { data } = await supabase.rpc('generate_income_statement', {
      company_id: companyId,
      start_date: startDate,
      end_date: endDate
    });
    
    return data;
  }
  
  static async generateBalanceSheet(
    companyId: string, 
    asOfDate: string
  ): Promise<BalanceSheet> {
    const { data } = await supabase.rpc('generate_balance_sheet', {
      company_id: companyId,
      as_of_date: asOfDate
    });
    
    return data;
  }
}
```

### 4.2 Invoice Management

#### Automated Invoice Generation

```sql
-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  sales_order_id UUID REFERENCES sales_orders(id),
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  payment_terms INTEGER DEFAULT 30,
  subtotal DECIMAL(15,2) NOT NULL,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  balance_due DECIMAL(15,2) NOT NULL,
  status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
  notes TEXT,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Invoice Items
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id),
  product_id UUID REFERENCES products_enhanced(id),
  description TEXT,
  quantity DECIMAL(12,3) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  line_total DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  payment_number VARCHAR(100) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  payment_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_method ENUM('cash', 'check', 'bank_transfer', 'credit_card', 'online') NOT NULL,
  reference_number VARCHAR(255),
  notes TEXT,
  status ENUM('pending', 'cleared', 'bounced') DEFAULT 'pending',
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payment Allocations
CREATE TABLE payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id),
  invoice_id UUID REFERENCES invoices(id),
  allocated_amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.3 GST Compliance & Tax Management

#### GST Calculation and Reporting

```typescript
// lib/tax/gst-service.ts
export class GSTService {
  static calculateGST(amount: number, gstRate: number, isInclusive: boolean = false): GSTCalculation {
    if (isInclusive) {
      const gstAmount = (amount * gstRate) / (100 + gstRate);
      const baseAmount = amount - gstAmount;
      return {
        baseAmount,
        gstAmount,
        totalAmount: amount,
        cgst: gstAmount / 2,
        sgst: gstAmount / 2,
        igst: 0
      };
    } else {
      const gstAmount = (amount * gstRate) / 100;
      return {
        baseAmount: amount,
        gstAmount,
        totalAmount: amount + gstAmount,
        cgst: gstAmount / 2,
        sgst: gstAmount / 2,
        igst: 0
      };
    }
  }
  
  static async generateGSTR1Report(
    companyId: string,
    month: number,
    year: number
  ): Promise<GSTR1Report> {
    const { data: invoices } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items(*),
        customers(*)
      `)
      .eq('company_id', companyId)
      .gte('invoice_date', `${year}-${month.toString().padStart(2, '0')}-01`)
      .lt('invoice_date', `${year}-${(month + 1).toString().padStart(2, '0')}-01`);
    
    // Process invoices for GSTR1 format
    const b2bInvoices = invoices.filter(inv => inv.customers.type === 'business');
    const b2cInvoices = invoices.filter(inv => inv.customers.type === 'individual');
    
    return {
      b2b: this.formatB2BInvoices(b2bInvoices),
      b2c: this.formatB2CInvoices(b2cInvoices),
      summary: this.calculateGSTSummary(invoices)
    };
  }
  
  static async generateGSTR3BReport(
    companyId: string,
    month: number,
    year: number
  ): Promise<GSTR3BReport> {
    // Implementation for GSTR3B monthly return
    const outwardSupplies = await this.getOutwardSupplies(companyId, month, year);
    const inwardSupplies = await this.getInwardSupplies(companyId, month, year);
    const itcClaimed = await this.getITCClaimed(companyId, month, year);
    
    return {
      outwardSupplies,
      inwardSupplies,
      itcClaimed,
      taxPayable: this.calculateTaxPayable(outwardSupplies, itcClaimed)
    };
  }
}
```

## Phase 5: Advanced Analytics & Reporting (Months 13-15)

### 5.1 Business Intelligence Dashboard

#### Executive Dashboard

```typescript
// components/analytics/ExecutiveDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, AttachMoney, Inventory } from '@mui/icons-material';

interface ExecutiveDashboardProps {
  companyId: string;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ companyId }) => {
  const [period, setPeriod] = useState('month');
  const [kpis, setKpis] = useState<KPIData[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [inventoryData, setInventoryData] = useState<InventoryData[]>([]);
  const [profitabilityData, setProfitabilityData] = useState<ProfitabilityData[]>([]);

  const KPICard: React.FC<{ title: string; value: string; change: number; icon: React.ReactNode }> = ({
    title,
    value,
    change,
    icon
  }) => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" color="textSecondary">
              {title}
            </Typography>
            <Typography variant="h4">
              {value}
            </Typography>
            <Box display="flex" alignItems="center" mt={1}>
              {change >= 0 ? (
                <TrendingUp color="success" fontSize="small" />
              ) : (
                <TrendingDown color="error" fontSize="small" />
              )}
              <Typography
                variant="body2"
                color={change >= 0 ? 'success.main' : 'error.main'}
                ml={0.5}
              >
                {Math.abs(change)}%
              </Typography>
            </Box>
          </Box>
          <Box color="primary.main">
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Executive Dashboard</Typography>
        <FormControl size="small">
          <InputLabel>Period</InputLabel>
          <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="quarter">This Quarter</MenuItem>
            <MenuItem value="year">This Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <KPICard
            title="Total Revenue"
            value="₹12.5L"
            change={15.2}
            icon={<AttachMoney fontSize="large" />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <KPICard
            title="Gross Profit"
            value="₹4.2L"
            change={8.7}
            icon={<TrendingUp fontSize="large" />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <KPICard
            title="Inventory Value"
            value="₹8.9L"
            change={-2.1}
            icon={<Inventory fontSize="large" />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <KPICard
            title="Orders Processed"
            value="1,247"
            change={12.3}
            icon={<TrendingUp fontSize="large" />}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Sales Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stackId="1"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Product Categories
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={inventoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {inventoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
```

## Implementation Timeline & Cost Analysis

### Development Timeline (18 Months)

**Phase 1 (Months 1-3): Foundation**
- Database schema design and implementation
- Core API development
- Authentication and authorization
- Basic UI components

**Phase 2 (Months 4-6): Supply Chain**
- Supplier management
- Purchase order system
- Advanced inventory management
- Warehouse management

**Phase 3 (Months 7-9): Manufacturing**
- BOM management
- Production planning
- Work order management
- Quality control

**Phase 4 (Months 10-12): Financial**
- General ledger
- Invoice management
- Payment processing
- GST compliance

**Phase 5 (Months 13-15): Analytics**
- Business intelligence
- Advanced reporting
- Predictive analytics
- Performance optimization

**Phase 6 (Months 16-18): Integration & Testing**
- Third-party integrations
- Mobile app enhancements
- Performance testing
- User training

### Cost Breakdown (Free/Low-Cost Solutions)

**Infrastructure Costs (Monthly)**
- Supabase Pro: $25/month (up to 8GB database)
- Vercel Pro: $20/month (unlimited deployments)
- Upstash Redis: $0-10/month (based on usage)
- Domain & SSL: $15/year
- **Total: ~$50-60/month**

**Third-Party Services (Transaction-based)**
- Payment Gateway: 2-3% per transaction
- SMS/Email: $0.01-0.05 per message
- WhatsApp Business: Free for verified businesses
- Logistics APIs: Variable based on usage

**Development Resources**
- 2-3 Full-stack developers
- 1 UI/UX designer
- 1 DevOps engineer (part-time)
- 1 Business analyst

### Free Alternatives to Odoo

**Why Build Custom vs. Using Odoo:**

1. **Customization**: Full control over features and UI/UX
2. **Integration**: Seamless integration with existing DukaaOn ecosystem
3. **Scalability**: Built specifically for Indian B2B marketplace needs
4. **Cost**: No per-user licensing fees
5. **Data Ownership**: Complete control over data and hosting

**Odoo Comparison:**
- Odoo Community: Free but limited features
- Odoo Enterprise: $31/user/month (expensive for large teams)
- Customization costs: $150-200/hour for development
- Hosting: Additional $50-200/month

**Our Custom Solution Benefits:**
- One-time development cost
- No per-user fees
- Tailored for Indian market (GST, local integrations)
- Mobile-first approach
- Real-time capabilities
- Seamless marketplace integration

## Unique Value Propositions - Competitive Differentiators

### 🎯 Market-Specific Innovations

#### 1. AI-Powered Demand Forecasting for Indian Markets
**Implementation Timeline: Phase 5 (Months 13-15)**
- **Festival & Seasonal Intelligence**: ML models trained on Indian festivals (Diwali, Eid, regional festivals), monsoon patterns, and harvest cycles
- **GST Impact Prediction**: Automated demand forecasting based on GST rate changes and policy updates
- **Regional Market Dynamics**: State-wise demand patterns considering local preferences, economic conditions, and cultural factors
- **Technical Stack**: TensorFlow/PyTorch models, historical sales data, external APIs for weather/festival data

#### 2. Integrated Marketplace-to-ERP Ecosystem
**Implementation Timeline: Phase 1-2 (Months 1-6)**
- **Single Sign-On Experience**: Seamless transition between marketplace and ERP functions
- **Real-time Inventory Sync**: Automatic inventory updates across marketplace and ERP with conflict resolution
- **Unified Customer Journey**: Complete visibility from lead generation to order fulfillment and post-sales support
- **Cross-platform Analytics**: Combined insights from marketplace activity and ERP operations

#### 3. Hyperlocal Supply Chain Optimization
**Implementation Timeline: Phase 2-3 (Months 4-9)**
- **Pin-code Level Logistics**: Optimized delivery routes considering Indian infrastructure, traffic patterns, and regional constraints
- **Regional Supplier Networks**: AI-powered supplier recommendations based on location, reliability scores, and performance metrics
- **Multi-modal Transport Planning**: Integration with railways, roadways, waterways, and last-mile delivery options
- **Local Compliance Management**: State-specific regulations, permits, and documentation requirements

### 💡 Technology Innovation Differentiators

#### 4. Voice-Enabled ERP Operations (Hindi + Regional Languages)
**Implementation Timeline: Phase 3-4 (Months 7-12)**
- **Voice Commands**: "Inventory check karo Product ABC ka" or "Purchase order banao Supplier XYZ ke liye"
- **WhatsApp Business Integration**: Order management, inventory alerts, and customer communication through WhatsApp
- **Audio Reports**: Financial summaries, inventory status, and performance metrics in preferred regional languages
- **Technical Implementation**: Speech-to-text APIs, NLP processing, multilingual support

#### 5. Blockchain-Powered Authenticity Verification
**Implementation Timeline: Phase 4-5 (Months 10-15)**
- **Product Authenticity Tracking**: QR codes with blockchain verification for anti-counterfeiting
- **Supply Chain Transparency**: Complete product journey from manufacturer to end customer
- **Compliance Certificates**: Digital storage and verification of quality certifications, licenses
- **Smart Contracts**: Automated payments and compliance checks based on delivery confirmations

#### 6. Predictive Maintenance for Equipment & Vehicles
**Implementation Timeline: Phase 5-6 (Months 13-18)**
- **Vehicle Fleet Management**: Predictive maintenance alerts for delivery vehicles, fuel optimization
- **Warehouse Equipment Monitoring**: Automated maintenance scheduling for forklifts, conveyors, packaging machines
- **Energy Optimization**: Smart power management for warehouses, cold storage monitoring
- **IoT Integration**: Sensor data collection, anomaly detection, maintenance scheduling

### 🏢 Business Model Innovations

#### 7. Pay-Per-Transaction Pricing Model
**Implementation Timeline: Phase 1 (Months 1-3)**
- **Transaction-Based Pricing**: Pay only for processed orders/invoices instead of per-user licensing
- **Revenue-Sharing Model**: Percentage of GMV for high-volume customers
- **Freemium Tier**: Basic ERP features free up to 100 transactions/month
- **Scalable Pricing**: Automatic tier upgrades based on business growth

#### 8. Embedded Financial Services
**Implementation Timeline: Phase 4-5 (Months 10-15)**
- **Working Capital Loans**: AI-assessed credit based on ERP transaction history and cash flow patterns
- **Invoice Factoring**: Instant liquidity against pending invoices with competitive rates
- **Supplier Financing**: Extended payment terms through embedded lending partnerships
- **GST Credit Optimization**: Automated GST credit utilization strategies and compliance management
- **Digital Banking Integration**: Seamless integration with Indian digital payment systems

#### 9. Sustainability & ESG Compliance Dashboard
**Implementation Timeline: Phase 5-6 (Months 13-18)**
- **Carbon Footprint Tracking**: Automated calculation of transportation emissions, warehouse energy usage
- **Sustainable Sourcing Metrics**: Supplier sustainability scorecards, ethical sourcing verification
- **Waste Management Optimization**: Packaging waste reduction recommendations, recycling tracking
- **ESG Reporting Automation**: Ready-to-submit sustainability reports for compliance and investor relations
- **Green Supply Chain**: Eco-friendly logistics options, renewable energy integration

#### 10. Community-Driven Knowledge Sharing
**Implementation Timeline: Phase 6+ (Months 16+)**
- **Industry Best Practices Library**: Crowdsourced operational insights, process optimization tips
- **Peer Benchmarking**: Anonymous performance comparisons with similar businesses in the same industry
- **Expert Consultation Network**: On-demand access to industry specialists, business advisors
- **Training & Certification Programs**: ERP proficiency certifications for staff, skill development modules
- **Innovation Labs**: Beta testing new features with select customers, feedback-driven development

### 📊 Implementation Strategy & Revenue Impact

#### Phase-wise Integration:

**Phase 1-2 (Foundation + Supply Chain):**
- Integrated marketplace ecosystem
- Pay-per-transaction pricing
- Basic voice operations (Hindi/English)

**Phase 3-4 (Manufacturing + Financial):**
- Advanced voice commands (regional languages)
- Embedded financial services
- Hyperlocal supply chain optimization

**Phase 5-6 (Analytics + Integration):**
- AI-powered demand forecasting
- Blockchain authenticity verification
- Sustainability dashboard
- Community platform

#### Competitive Advantage Metrics:

**Cost Savings:**
- 30-40% lower total cost of ownership vs. traditional ERP
- 50-60% reduction in implementation time
- 25-35% improvement in operational efficiency

**Revenue Enhancement:**
- 15-20% increase through embedded financial services
- 10-15% improvement in demand forecasting accuracy
- 20-25% reduction in supply chain costs

**Market Differentiation:**
- Only ERP with native marketplace integration
- First multilingual voice-enabled ERP for Indian markets
- Comprehensive sustainability tracking for ESG compliance

## Conclusion

Building a custom ERP system for DukaaOn with these unique value propositions creates a significant competitive moat in the Indian B2B marketplace. The combination of market-specific innovations, cutting-edge technology, and innovative business models positions DukaaOn not just as an ERP provider, but as a comprehensive business growth partner.

The modular approach allows for incremental development and deployment, reducing risk while ensuring each unique feature meets specific market needs. The proposed solution leverages modern technologies while providing enterprise-grade functionality tailored for the Indian wholesale and distribution ecosystem.

**Strategic Advantages:**
1. **Market Leadership**: First-mover advantage in integrated marketplace-ERP solutions
2. **Technology Innovation**: Voice-enabled, AI-powered operations in local languages
3. **Financial Integration**: Embedded fintech services creating additional revenue streams
4. **Sustainability Focus**: ESG compliance for modern business requirements
5. **Community Ecosystem**: Knowledge sharing platform building customer loyalty

**Next Steps:**
1. Finalize technical specifications for Phase 1 with unique propositions
2. Set up development environment and CI/CD pipeline
3. Begin database schema implementation with blockchain integration points
4. Start with core authentication and integrated marketplace features
5. Implement pay-per-transaction pricing model
6. Develop voice command MVP for Hindi/English

This enhanced implementation plan provides a comprehensive roadmap for building a world-class ERP system that not only rivals commercial solutions but creates entirely new categories of value for Indian wholesalers and distributors.