'use client';

import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Avatar,
  Divider,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Dashboard,
  ShoppingCart,
  Inventory,
  People,
  Analytics,
  LocalShipping,
  Notifications,
  Person,
  Settings,
  Help,
  AccountBalance,
  Add,
  Chat,
  Store
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOrderNotifications } from '@/contexts/OrderNotificationContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant?: 'permanent' | 'persistent' | 'temporary';
}

interface NavigationItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
  disabled?: boolean;
}

const DRAWER_WIDTH = 280;

export default function Sidebar({ open, onClose, variant = 'permanent' }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const { user, sellerDetails } = useAuth();
  const { newOrdersCount, markOrdersAsViewed } = useOrderNotifications();

  const navigationItems: NavigationItem[] = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: <Dashboard />
    },
    {
      title: 'Wholesaler Hub',
      path: '/wholesaler',
      icon: <Store />
    },
    {
      title: 'Orders',
      path: '/wholesaler/orders',
      icon: <ShoppingCart />,
      badge: newOrdersCount > 0 ? newOrdersCount : undefined
    },
    {
      title: 'Products',
      path: '/wholesaler/products',
      icon: <Inventory />
    },
    {
      title: 'Inventory',
      path: '/wholesaler/inventory',
      icon: <Inventory />
    },
    {
      title: 'Customers',
      path: '/wholesaler/customers',
      icon: <People />
    },
    {
      title: 'Analytics',
      path: '/wholesaler/analytics',
      icon: <Analytics />
    },
    {
      title: 'Deliveries',
      path: '/deliveries',
      icon: <LocalShipping />
    },
    {
      title: 'Notifications',
      path: '/wholesaler/notifications',
      icon: <Notifications />
    },
    {
      title: 'Quick Add',
      path: '/dashboard?quickadd=true',
      icon: <Add />
    },
    {
      title: 'Chat',
      path: '/chat',
      icon: <Chat />,
      disabled: true
    },
    {
      title: 'Loans',
      path: '/loans',
      icon: <AccountBalance />,
      disabled: true
    },
    {
      title: 'Profile',
      path: '/profile',
      icon: <Person />
    },
    {
      title: 'Settings',
      path: '/settings',
      icon: <Settings />
    },
    {
      title: 'Help',
      path: '/help',
      icon: <Help />
    }
  ];

  const handleNavigation = (path: string, disabled?: boolean) => {
    if (disabled) return;
    
    // Mark orders as viewed when navigating to orders page
    if (path === '/wholesaler/orders') {
      markOrdersAsViewed();
    }
    
    router.push(path);
    if (variant === 'temporary') {
      onClose();
    }
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={sellerDetails?.profile_image_url}
            sx={{ 
              width: 48, 
              height: 48, 
              mr: 2,
              bgcolor: theme.palette.primary.main
            }}
          >
            {sellerDetails?.business_name?.[0] || user?.email?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" noWrap>
              {sellerDetails?.business_name || 'Business'}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {sellerDetails?.owner_name || user?.email}
            </Typography>
          </Box>
        </Box>
        
        {sellerDetails?.status === 'approved' ? (
          <Chip
            label="Verified"
            color="success"
            size="small"
            sx={{ fontSize: '0.75rem' }}
          />
        ) : (
          <Chip
            label="Pending Verification"
            color="warning"
            size="small"
            sx={{ fontSize: '0.75rem' }}
          />
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ px: 2, py: 1 }}>
          {navigationItems.map((item) => {
            const active = isActive(item.path);
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path, item.disabled)}
                  disabled={item.disabled}
                  sx={{
                    borderRadius: 2,
                    minHeight: 48,
                    backgroundColor: active 
                      ? alpha(theme.palette.primary.main, 0.12)
                      : 'transparent',
                    color: active 
                      ? theme.palette.primary.main
                      : theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: active 
                        ? alpha(theme.palette.primary.main, 0.16)
                        : alpha(theme.palette.action.hover, 0.04),
                    },
                    '&.Mui-disabled': {
                      opacity: 0.5
                    }
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: active 
                        ? theme.palette.primary.main
                        : theme.palette.text.secondary,
                      minWidth: 40
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.title}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: active ? 600 : 400
                    }}
                  />
                  {item.badge && (
                    <Chip
                      label={item.badge}
                      size="small"
                      color="error"
                      sx={{ height: 20, fontSize: '0.75rem' }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          DukaaOn Seller Console v1.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}

export { DRAWER_WIDTH };