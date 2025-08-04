'use client'
import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Badge,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon
} from '@mui/material'
import {
  ArrowBack,
  Notifications,
  ShoppingCart,
  LocalShipping,
  CheckCircle,
  Cancel,
  Info,
  Warning,
  Error as ErrorIcon,
  MarkEmailRead,
  Delete,
  MoreVert,
  FilterList,
  Refresh
} from '@mui/icons-material'
import { useAuth } from '../../../contexts/AuthContext'
import { createClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'order_new' | 'order_update' | 'order_confirmed' | 'order_cancelled' | 'system' | 'info'
  data?: any
  read: boolean
  created_at: string
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notifications-tabpanel-${index}`}
      aria-labelledby={`notifications-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [detailDialog, setDetailDialog] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' })

  const supabase = createClient()

  useEffect(() => {
    if (!user?.id) return
    
    fetchNotifications()
    
    // Set up real-time subscription for new notifications
    const subscription = supabase
      .channel('notifications_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New notification received:', payload)
          fetchNotifications()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notification updated:', payload)
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user?.id])

  useEffect(() => {
    filterNotifications()
  }, [notifications, tabValue])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching notifications:', error)
        setSnackbar({
          open: true,
          message: 'Error fetching notifications',
          severity: 'error'
        })
        return
      }

      setNotifications(data || [])
    } catch (error) {
      console.error('Error in fetchNotifications:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filterNotifications = () => {
    let filtered = notifications

    switch (tabValue) {
      case 0: // All
        break
      case 1: // Unread
        filtered = filtered.filter(n => !n.read)
        break
      case 2: // Orders
        filtered = filtered.filter(n => n.type.includes('order'))
        break
      case 3: // System
        filtered = filtered.filter(n => n.type === 'system' || n.type === 'info')
        break
    }

    setFilteredNotifications(filtered)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchNotifications()
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as read:', error)
        return
      }

      fetchNotifications()
    } catch (error) {
      console.error('Error in markAsRead:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        setSnackbar({
          open: true,
          message: 'Error marking notifications as read',
          severity: 'error'
        })
        return
      }

      setSnackbar({
        open: true,
        message: 'All notifications marked as read',
        severity: 'success'
      })
      
      fetchNotifications()
    } catch (error) {
      console.error('Error in markAllAsRead:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) {
        console.error('Error deleting notification:', error)
        setSnackbar({
          open: true,
          message: 'Error deleting notification',
          severity: 'error'
        })
        return
      }

      setSnackbar({
        open: true,
        message: 'Notification deleted',
        severity: 'success'
      })
      
      fetchNotifications()
    } catch (error) {
      console.error('Error in deleteNotification:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }

    // Handle navigation based on notification type
    if (notification.type.includes('order') && notification.data?.order_id) {
      router.push(`/wholesaler/orders/${notification.data.order_id}`)
    } else {
      setSelectedNotification(notification)
      setDetailDialog(true)
    }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, notification: Notification) => {
    event.stopPropagation()
    setMenuAnchor(event.currentTarget)
    setSelectedNotification(notification)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setSelectedNotification(null)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_new':
      case 'order_update':
      case 'order_confirmed':
      case 'order_cancelled':
        return <ShoppingCart />
      case 'system':
        return <Info />
      case 'info':
        return <Notifications />
      default:
        return <Notifications />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order_new':
        return 'primary'
      case 'order_confirmed':
        return 'success'
      case 'order_cancelled':
        return 'error'
      case 'order_update':
        return 'info'
      case 'system':
        return 'warning'
      default:
        return 'default'
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length
  const orderNotificationsCount = notifications.filter(n => n.type.includes('order')).length
  const systemNotificationsCount = notifications.filter(n => n.type === 'system' || n.type === 'info').length

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading notifications...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Notifications
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={markAllAsRead}
            startIcon={<MarkEmailRead />}
            disabled={unreadCount === 0}
          >
            Mark All Read
          </Button>
          <IconButton onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? <CircularProgress size={24} /> : <Refresh />}
          </IconButton>
        </Box>
      </Box>

      {/* Stats */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {notifications.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="warning.main">
              {unreadCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Unread
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="info.main">
              {orderNotificationsCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Orders
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="success.main">
              {systemNotificationsCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              System
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Filter Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Notifications" />
          <Tab 
            label={
              <Badge badgeContent={unreadCount} color="error">
                Unread
              </Badge>
            } 
          />
          <Tab label="Order Notifications" />
          <Tab label="System Notifications" />
        </Tabs>
      </Paper>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Notifications sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No notifications found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tabValue === 1 
              ? "You're all caught up! No unread notifications."
              : "You don't have any notifications yet."
            }
          </Typography>
        </Paper>
      ) : (
        <Card>
          <List>
            {filteredNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  button
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    '&:hover': {
                      bgcolor: 'action.selected'
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        bgcolor: `${getNotificationColor(notification.type)}.main`,
                        color: 'white'
                      }}
                    >
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: notification.read ? 'normal' : 'bold',
                            flexGrow: 1
                          }}
                        >
                          {notification.title}
                        </Typography>
                        {!notification.read && (
                          <Chip 
                            label="New" 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            fontWeight: notification.read ? 'normal' : 'medium',
                            mb: 0.5
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(notification.created_at).toLocaleDateString()} at {new Date(notification.created_at).toLocaleTimeString()}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      onClick={(e) => handleMenuOpen(e, notification)}
                    >
                      <MoreVert />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredNotifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Card>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        {selectedNotification && !selectedNotification.read && (
          <MenuItem onClick={() => {
            if (selectedNotification) {
              markAsRead(selectedNotification.id)
            }
            handleMenuClose()
          }}>
            <ListItemIcon>
              <MarkEmailRead fontSize="small" />
            </ListItemIcon>
            Mark as Read
          </MenuItem>
        )}
        <MenuItem onClick={() => {
          setDetailDialog(true)
          handleMenuClose()
        }}>
          <ListItemIcon>
            <Info fontSize="small" />
          </ListItemIcon>
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedNotification) {
            deleteNotification(selectedNotification.id)
          }
          handleMenuClose()
        }}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      {/* Notification Detail Dialog */}
      <Dialog 
        open={detailDialog} 
        onClose={() => setDetailDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedNotification?.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            {selectedNotification?.message}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {selectedNotification && new Date(selectedNotification.created_at).toLocaleString()}
          </Typography>
          {selectedNotification?.data && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Additional Data:
              </Typography>
              <pre style={{ fontSize: '12px', margin: 0 }}>
                {JSON.stringify(selectedNotification.data, null, 2)}
              </pre>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>
            Close
          </Button>
          {selectedNotification?.type.includes('order') && selectedNotification?.data?.order_id && (
            <Button 
              variant="contained"
              onClick={() => {
                router.push(`/wholesaler/orders/${selectedNotification.data.order_id}`)
                setDetailDialog(false)
              }}
            >
              View Order
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}