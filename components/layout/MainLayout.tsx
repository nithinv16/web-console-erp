'use client';

import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  Badge
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  Logout,
  Settings,
  Person
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar, { DRAWER_WIDTH } from './Sidebar';
import toast from 'react-hot-toast';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function MainLayout({ children, title }: MainLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const router = useRouter();
  const { user, sellerDetails, signOut } = useAuth();
  
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
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
      router.push('/login');
    } catch (error) {
      toast.error('Failed to sign out');
    }
    handleProfileMenuClose();
  };

  const handleProfileClick = () => {
    router.push('/profile');
    handleProfileMenuClose();
  };

  const handleSettingsClick = () => {
    router.push('/settings');
    handleProfileMenuClose();
  };

  const handleNotificationsClick = () => {
    router.push('/wholesaler/notifications');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        variant={isMobile ? 'temporary' : 'permanent'}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: { lg: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh'
        }}
      >
        {/* Top App Bar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`,
            color: theme.palette.text.primary,
            zIndex: theme.zIndex.drawer + 1
          }}
        >
          <Toolbar>
            {/* Menu Button for Mobile */}
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleSidebarToggle}
              sx={{ mr: 2, display: { lg: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            {/* Page Title */}
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {title || 'DukaaOn Console'}
            </Typography>

            {/* Notifications */}
            <IconButton
              color="inherit"
              onClick={handleNotificationsClick}
              sx={{ mr: 1 }}
            >
              <Badge badgeContent={0} color="error">
                <Notifications />
              </Badge>
            </IconButton>

            {/* Profile Menu */}
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleProfileMenuOpen}
              sx={{ ml: 1 }}
            >
              <Avatar
                src={sellerDetails?.profile_image_url}
                sx={{ width: 32, height: 32 }}
              >
                {sellerDetails?.business_name?.[0] || user?.email?.[0]?.toUpperCase()}
              </Avatar>
            </IconButton>

            {/* Profile Menu Dropdown */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              onClick={handleProfileMenuClose}
              PaperProps={{
                elevation: 3,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                  mt: 1.5,
                  minWidth: 200,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              {/* User Info */}
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" noWrap>
                  {sellerDetails?.business_name || 'Business'}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {sellerDetails?.owner_name || user?.email}
                </Typography>
              </Box>
              
              <Divider />
              
              <MenuItem onClick={handleProfileClick}>
                <Person sx={{ mr: 2 }} />
                Profile
              </MenuItem>
              
              <MenuItem onClick={handleSettingsClick}>
                <Settings sx={{ mr: 2 }} />
                Settings
              </MenuItem>
              
              <Divider />
              
              <MenuItem onClick={handleSignOut}>
                <Logout sx={{ mr: 2 }} />
                Sign Out
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box
          sx={{
            flexGrow: 1,
            backgroundColor: theme.palette.background.default,
            overflow: 'auto'
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export type { MainLayoutProps };