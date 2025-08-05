'use client';

import React, { useState } from 'react';
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
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useTheme,
  useMediaQuery,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Inventory,
  ShoppingCart,
  People,
  Analytics,
  LocalShipping,
  Settings,
  Logout,
  Notifications,
  AccountCircle,
  Store,
  TrendingUp
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const drawerWidth = 280;

interface NavigationItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  badge?: number;
}

const navigationItems: NavigationItem[] = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Products', icon: <Inventory />, path: '/products' },
  { text: 'Orders', icon: <ShoppingCart />, path: '/orders' },
  { text: 'Customers', icon: <People />, path: '/customers' },
  { text: 'Analytics', icon: <Analytics />, path: '/analytics' },
  { text: 'Deliveries', icon: <LocalShipping />, path: '/deliveries' },
  { text: 'Inventory', icon: <Store />, path: '/inventory' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const pathname = usePathname();
  const { user, sellerDetails, signOut } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      router.push('/login');
    } catch (error) {
      toast.error('Failed to sign out');
    }
    handleProfileMenuClose();
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box>
      <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h5" fontWeight="bold">
          DukaaOn
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Seller Console
        </Typography>
      </Box>
      
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2,
            bgcolor: 'grey.50',
            borderRadius: 2,
            mb: 2
          }}
        >
          <Avatar
            src={sellerDetails?.profile_image_url}
            sx={{ width: 40, height: 40 }}
          >
            {sellerDetails?.business_name?.charAt(0) || 'B'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap>
              {sellerDetails?.business_name || 'Your Business'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {sellerDetails?.seller_type || 'Wholesale'}
            </Typography>
          </Box>
          {sellerDetails?.status === 'approved' && (
            <Chip
              label="Verified"
              size="small"
              color="success"
              variant="outlined"
            />
          )}
        </Box>
      </Box>

      <Divider />
      
      <List sx={{ px: 2 }}>
        {navigationItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  bgcolor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'white' : 'text.primary',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.dark' : 'action.hover',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'white' : 'text.secondary',
                    minWidth: 40,
                  }}
                >
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ mt: 2 }} />
      
      <List sx={{ px: 2 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleNavigation('/settings')}
            sx={{ borderRadius: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Settings />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {navigationItems.find(item => item.path === pathname)?.text || 'Dashboard'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton color="inherit">
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            
            <IconButton
              onClick={handleProfileMenuOpen}
              color="inherit"
              sx={{ ml: 1 }}
            >
              <Avatar
                src={sellerDetails?.profile_image_url}
                sx={{ width: 32, height: 32 }}
              >
                {sellerDetails?.owner_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 200,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
            },
          },
        }}
      >
        <MenuItem onClick={() => handleNavigation('/profile')}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/settings')}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleSignOut}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Sign Out
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'grey.50',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}