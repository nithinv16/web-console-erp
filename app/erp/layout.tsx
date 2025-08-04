'use client'

import React, { useState } from 'react'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Breadcrumbs,
  Link
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard,
  Inventory,
  ShoppingCart,
  Receipt,
  People,
  Business,
  Warehouse,
  Analytics,
  Settings,
  ExpandLess,
  ExpandMore,
  Assignment,
  LocalShipping,
  AttachMoney,
  AccountBalance,
  Category,
  PersonAdd,
  Store,
  Notifications,
  AccountCircle,
  Logout,
  Help,
  Home
} from '@mui/icons-material'
import { useRouter, usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'

const drawerWidth = 280

interface NavigationItem {
  id: string
  title: string
  icon: React.ReactNode
  path?: string
  children?: NavigationItem[]
  badge?: number
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: <Dashboard />,
    path: '/erp'
  },
  {
    id: 'sales',
    title: 'Sales',
    icon: <ShoppingCart />,
    children: [
      { id: 'sales-orders', title: 'Sales Orders', icon: <Assignment />, path: '/erp/sales/orders' },
      { id: 'quotations', title: 'Quotations', icon: <Receipt />, path: '/erp/sales/quotations' },
      { id: 'customers', title: 'Customers', icon: <People />, path: '/erp/sales/customers' }
    ]
  },
  {
    id: 'purchase',
    title: 'Purchase',
    icon: <LocalShipping />,
    children: [
      { id: 'purchase-orders', title: 'Purchase Orders', icon: <Assignment />, path: '/erp/purchase/orders' },
      { id: 'suppliers', title: 'Suppliers', icon: <Business />, path: '/erp/purchase/suppliers' },
      { id: 'rfq', title: 'RFQ', icon: <Receipt />, path: '/erp/purchase/rfq' }
    ]
  },
  {
    id: 'inventory',
    title: 'Inventory',
    icon: <Inventory />,
    children: [
      { id: 'products', title: 'Products', icon: <Category />, path: '/erp/inventory/products' },
      { id: 'warehouses', title: 'Warehouses', icon: <Warehouse />, path: '/erp/inventory/warehouses' },
      { id: 'stock-movements', title: 'Stock Movements', icon: <Assignment />, path: '/erp/inventory/movements' },
      { id: 'stock-adjustments', title: 'Stock Adjustments', icon: <Settings />, path: '/erp/inventory/adjustments' }
    ]
  },
  {
    id: 'accounting',
    title: 'Accounting',
    icon: <AttachMoney />,
    children: [
      { id: 'invoices', title: 'Invoices', icon: <Receipt />, path: '/erp/accounting/invoices' },
      { id: 'payments', title: 'Payments', icon: <AccountBalance />, path: '/erp/accounting/payments' },
      { id: 'expenses', title: 'Expenses', icon: <AttachMoney />, path: '/erp/accounting/expenses' },
      { id: 'reports', title: 'Financial Reports', icon: <Analytics />, path: '/erp/accounting/reports' }
    ]
  },
  {
    id: 'hr',
    title: 'Human Resources',
    icon: <People />,
    children: [
      { id: 'employees', title: 'Employees', icon: <PersonAdd />, path: '/erp/hr/employees' },
      { id: 'departments', title: 'Departments', icon: <Business />, path: '/erp/hr/departments' },
      { id: 'attendance', title: 'Attendance', icon: <Assignment />, path: '/erp/hr/attendance' },
      { id: 'payroll', title: 'Payroll', icon: <AttachMoney />, path: '/erp/hr/payroll' }
    ]
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: <Analytics />,
    path: '/erp/analytics'
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: <Settings />,
    children: [
      { id: 'company', title: 'Company Settings', icon: <Business />, path: '/erp/settings/company' },
      { id: 'users', title: 'User Management', icon: <People />, path: '/erp/settings/users' },
      { id: 'integrations', title: 'Integrations', icon: <Settings />, path: '/erp/settings/integrations' }
    ]
  }
]

export default function ERPLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>(['sales', 'purchase', 'inventory'])
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null)
  
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient<Database>()

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleExpandClick = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleNavigation = (path: string) => {
    router.push(path)
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const isActiveRoute = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/')
  }

  const getBreadcrumbs = () => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const breadcrumbs = []
    
    // Add home
    breadcrumbs.push({ title: 'Home', path: '/dashboard' })
    
    // Add ERP
    if (pathSegments.length > 1) {
      breadcrumbs.push({ title: 'ERP', path: '/erp' })
    }
    
    // Add specific sections
    if (pathSegments.length > 2) {
      const section = pathSegments[2]
      const sectionTitle = section.charAt(0).toUpperCase() + section.slice(1)
      breadcrumbs.push({ title: sectionTitle, path: `/erp/${section}` })
    }
    
    return breadcrumbs
  }

  const renderNavigationItem = (item: NavigationItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.id)
    const isActive = item.path ? isActiveRoute(item.path) : false

    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding>
          <ListItemButton
            sx={{
              pl: 2 + depth * 2,
              backgroundColor: isActive ? 'action.selected' : 'transparent',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
            onClick={() => {
              if (hasChildren) {
                handleExpandClick(item.id)
              } else if (item.path) {
                handleNavigation(item.path)
              }
            }}
          >
            <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'inherit' }}>
              {item.badge ? (
                <Badge badgeContent={item.badge} color="error">
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )}
            </ListItemIcon>
            <ListItemText 
              primary={item.title} 
              sx={{ color: isActive ? 'primary.main' : 'inherit' }}
            />
            {hasChildren && (
              isExpanded ? <ExpandLess /> : <ExpandMore />
            )}
          </ListItemButton>
        </ListItem>
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map(child => renderNavigationItem(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    )
  }

  const drawer = (
    <Box>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Store sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" noWrap component="div" color="primary">
            DukaaOn ERP
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {navigationItems.map(item => renderNavigationItem(item))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Breadcrumbs */}
          <Box sx={{ flexGrow: 1 }}>
            <Breadcrumbs aria-label="breadcrumb">
              {getBreadcrumbs().map((crumb, index) => (
                <Link
                  key={index}
                  color="inherit"
                  href={crumb.path}
                  onClick={(e) => {
                    e.preventDefault()
                    handleNavigation(crumb.path)
                  }}
                  sx={{ 
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  {crumb.title}
                </Link>
              ))}
            </Breadcrumbs>
          </Box>

          {/* Right side icons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton color="inherit">
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            
            <IconButton
              color="inherit"
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
            >
              <AccountCircle />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        {children}
      </Box>

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={() => setUserMenuAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleNavigation('/erp/settings/profile')}>
          <AccountCircle sx={{ mr: 1 }} />
          Profile
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/erp/settings')}>
          <Settings sx={{ mr: 1 }} />
          Settings
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/help')}>
          <Help sx={{ mr: 1 }} />
          Help
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <Logout sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>
    </Box>
  )
}