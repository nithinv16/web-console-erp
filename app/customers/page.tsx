'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText as MuiListItemText
} from '@mui/material';
import {
  Search,
  MoreVert,
  Visibility,
  Phone,
  Message,
  LocationOn,
  People,
  TrendingUp,
  ShoppingCart,
  Star,
  History,
  Analytics
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { createClient } from '../../lib/supabase';
import { Customer, Order } from '../../types';
import { toast } from 'react-hot-toast';
import { MainLayout } from '../../components/layout';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`customer-tabpanel-${index}`}
      aria-labelledby={`customer-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerDetailsOpen, setCustomerDetailsOpen] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuCustomer, setMenuCustomer] = useState<Customer | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchCustomers();
    }
  }, [user]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      // Fetch orders with retailer information
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          retailer:retailer_id(id, business_name, owner_name, contact_phone, address, email)
        `)
        .eq('seller_id', user?.id);

      if (ordersError) throw ordersError;

      // Group orders by retailer and calculate customer metrics
      const customerMap = new Map<string, Customer>();
      
      ordersData?.forEach((order) => {
        const retailer = (order as any).retailer;
        if (!retailer) return;

        const customerId = retailer.id;
        const existingCustomer = customerMap.get(customerId);

        if (existingCustomer) {
          existingCustomer.total_orders += 1;
          existingCustomer.total_spent += order.total_amount || 0;
          existingCustomer.last_order_date = new Date(Math.max(
            new Date(existingCustomer.last_order_date).getTime(),
            new Date(order.created_at).getTime()
          )).toISOString();
        } else {
          customerMap.set(customerId, {
            id: customerId,
            business_name: retailer.business_name || 'Unknown Business',
            owner_name: retailer.owner_name || 'Unknown Owner',
            email: retailer.email || '',
            phone_number: retailer.contact_phone || '',
            address: retailer.address || '',
            total_orders: 1,
            total_spent: order.total_amount || 0,
            last_order_date: new Date(order.created_at).toISOString(),
            status: 'active'
          });
        }
      });

      const customersArray = Array.from(customerMap.values())
        .sort((a, b) => b.total_spent - a.total_spent);

      setCustomers(customersArray);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerOrders = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', user?.id)
        .eq('retailer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomerOrders(data || []);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      toast.error('Failed to load customer orders');
    }
  };

  const handleViewDetails = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerDetailsOpen(true);
    await fetchCustomerOrders(customer.id);
    handleMenuClose();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, customer: Customer) => {
    setAnchorEl(event.currentTarget);
    setMenuCustomer(customer);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuCustomer(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone_number.includes(searchTerm)
  );

  const getCustomerStats = () => {
    return {
      total: customers.length,
      active: customers.filter(c => {
        const daysSinceLastOrder = (Date.now() - new Date(c.last_order_date).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceLastOrder <= 30;
      }).length,
      topSpender: customers.length > 0 ? customers[0] : null,
      totalRevenue: customers.reduce((sum, c) => sum + c.total_spent, 0)
    };
  };

  const getCustomerTier = (totalSpent: number) => {
    if (totalSpent >= 100000) return { label: 'Platinum', color: 'secondary' as const };
    if (totalSpent >= 50000) return { label: 'Gold', color: 'warning' as const };
    if (totalSpent >= 20000) return { label: 'Silver', color: 'info' as const };
    return { label: 'Bronze', color: 'default' as const };
  };

  const getDaysSinceLastOrder = (lastOrderDate: Date) => {
    return Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const stats = getCustomerStats();

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Customers
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your customer relationships and analytics
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Customers
                    </Typography>
                    <Typography variant="h4">
                      {stats.total}
                    </Typography>
                  </Box>
                  <People color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Active Customers
                    </Typography>
                    <Typography variant="h4">
                      {stats.active}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Last 30 days
                    </Typography>
                  </Box>
                  <TrendingUp color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Revenue
                    </Typography>
                    <Typography variant="h4">
                      ₹{stats.totalRevenue.toLocaleString()}
                    </Typography>
                  </Box>
                  <ShoppingCart color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Top Spender
                    </Typography>
                    <Typography variant="h6" noWrap>
                      {stats.topSpender?.business_name || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ₹{stats.topSpender?.total_spent.toLocaleString() || 0}
                    </Typography>
                  </Box>
                  <Star color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <TextField
              fullWidth
              placeholder="Search customers by name, business, or phone..."
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
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ p: 3 }}>
                <LinearProgress />
                <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading customers...</Typography>
              </Box>
            ) : filteredCustomers.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <People sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No customers found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {customers.length === 0 ? 'Customers will appear here when they place orders' : 'Try adjusting your search'}
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Orders</TableCell>
                      <TableCell>Total Spent</TableCell>
                      <TableCell>Tier</TableCell>
                      <TableCell>Last Order</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCustomers.map((customer) => {
                      const tier = getCustomerTier(customer.total_spent);
                      const daysSinceLastOrder = getDaysSinceLastOrder(new Date(customer.last_order_date));
                      
                      return (
                        <TableRow key={customer.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ width: 40, height: 40 }}>
                                {customer.business_name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2">
                                  {customer.business_name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {customer.owner_name}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              {customer.phone_number && (
                                <Typography variant="body2">
                                  📞 {customer.phone_number}
                                </Typography>
                              )}
                              {customer.email && (
                                <Typography variant="body2" color="text.secondary">
                                  ✉️ {customer.email}
                                </Typography>
                              )}
                              {customer.address && (
                                <Typography variant="body2" color="text.secondary" noWrap>
                                  📍 {customer.address}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {customer.total_orders}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              orders
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2">
                              ₹{customer.total_spent.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={tier.label}
                              color={tier.color}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(customer.last_order_date).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {daysSinceLastOrder === 0 ? 'Today' : 
                               daysSinceLastOrder === 1 ? 'Yesterday' :
                               `${daysSinceLastOrder} days ago`}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              onClick={(e) => handleMenuOpen(e, customer)}
                            >
                              <MoreVert />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => menuCustomer && handleViewDetails(menuCustomer)}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          {menuCustomer?.phone_number && (
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <Phone fontSize="small" />
              </ListItemIcon>
              <ListItemText>Call Customer</ListItemText>
            </MenuItem>
          )}
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <Message fontSize="small" />
            </ListItemIcon>
            <ListItemText>Send Message</ListItemText>
          </MenuItem>
        </Menu>

        {/* Customer Details Dialog */}
        <Dialog
          open={customerDetailsOpen}
          onClose={() => setCustomerDetailsOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 48, height: 48 }}>
                {selectedCustomer?.business_name.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {selectedCustomer?.business_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedCustomer?.owner_name}
                </Typography>
              </Box>
              <Box sx={{ ml: 'auto' }}>
                <Chip
                  label={getCustomerTier(selectedCustomer?.total_spent || 0).label}
                  color={getCustomerTier(selectedCustomer?.total_spent || 0).color}
                  variant="outlined"
                />
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Overview" icon={<Analytics />} />
                <Tab label="Order History" icon={<History />} />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              {/* Customer Overview */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Contact Information
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {selectedCustomer?.phone_number && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Phone fontSize="small" color="action" />
                            <Typography>{selectedCustomer.phone_number}</Typography>
                          </Box>
                        )}
                        {selectedCustomer?.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Message fontSize="small" color="action" />
                            <Typography>{selectedCustomer.email}</Typography>
                          </Box>
                        )}
                        {selectedCustomer?.address && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationOn fontSize="small" color="action" />
                            <Typography>{selectedCustomer.address}</Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Customer Metrics
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Total Orders</Typography>
                          <Typography variant="h5">{selectedCustomer?.total_orders}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Total Spent</Typography>
                          <Typography variant="h5">₹{selectedCustomer?.total_spent.toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Average Order</Typography>
                          <Typography variant="h6">
                            ₹{selectedCustomer ? Math.round(selectedCustomer.total_spent / selectedCustomer.total_orders).toLocaleString() : 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Last Order</Typography>
                          <Typography variant="h6">
                            {selectedCustomer ? new Date(selectedCustomer.last_order_date).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {/* Order History */}
              {customerOrders.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <ShoppingCart sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No orders found
                  </Typography>
                </Box>
              ) : (
                <List>
                  {customerOrders.map((order, index) => (
                    <React.Fragment key={order.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar>
                            #{order.id.slice(-4)}
                          </Avatar>
                        </ListItemAvatar>
                        <MuiListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle1">
                                Order #{order.id.slice(-8).toUpperCase()}
                              </Typography>
                              <Typography variant="h6" color="primary">
                                ₹{order.total_amount?.toLocaleString()}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {new Date(order.created_at).toLocaleString()}
                              </Typography>
                              <Box sx={{ mt: 1 }}>
                                <Chip
                                  label={order.status}
                                  size="small"
                                  color={order.status === 'delivered' ? 'success' : order.status === 'pending' ? 'warning' : 'default'}
                                  variant="outlined"
                                />
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < customerOrders.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </TabPanel>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCustomerDetailsOpen(false)}>Close</Button>
            {selectedCustomer?.phone && (
              <Button startIcon={<Phone />} variant="outlined">
                Call Customer
              </Button>
            )}
            <Button startIcon={<Message />} variant="outlined">
              Send Message
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
}