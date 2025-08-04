'use client'

import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  IconButton
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Inventory as InventoryIcon,
  LocalShipping as DeliveryIcon,
  Assignment as OrdersIcon,
  AccountCircle as AccountIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon,
  PlayCircle as PlayCircleIcon,
  Help as HelpIcon,
  Headset as HeadsetIcon
} from '@mui/icons-material'

interface FAQItem {
  question: string
  answer: string
  category: string
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const faqs: FAQItem[] = [
    {
      question: "How do I add products to my inventory?",
      answer: "To add products to your inventory, go to the 'Products' section from the sidebar and click 'Add Product'. Fill in the product details including name, category, price, and quantity. You can also add product images to make them more appealing to retailers.",
      category: "Inventory"
    },
    {
      question: "How do I update product prices?",
      answer: "To update product prices, go to 'Products', find the product you want to update, and click on it. Then click the 'Edit' button and update the price field. Don't forget to save your changes.",
      category: "Inventory"
    },
    {
      question: "How do I manage deliveries?",
      answer: "You can manage all your deliveries from the 'Deliveries' section. You can view delivery status, update tracking information, and schedule new deliveries from this section.",
      category: "Delivery"
    },
    {
      question: "How do I track my deliveries?",
      answer: "You can track all your deliveries from the 'Deliveries' section in the sidebar. Each delivery shows its current status (pending, in transit, delivered, or cancelled) along with tracking details.",
      category: "Delivery"
    },
    {
      question: "How do I view my customers?",
      answer: "To view your customers, click on 'Customers' in the sidebar. This will show you a list of all retailers who have purchased from you, along with their order history and contact information.",
      category: "Customers"
    },
    {
      question: "How do I view my sales analytics?",
      answer: "To view your sales analytics, click on 'Analytics' in the sidebar. This will show you key metrics like total sales, popular products, sales trends over time, and customer insights.",
      category: "Analytics"
    },
    {
      question: "How do I manage my orders?",
      answer: "To manage your orders, click on 'Orders' in the sidebar. You can view all incoming orders, update order status, process payments, and track fulfillment from this section.",
      category: "Orders"
    },
    {
      question: "How do I update my business profile?",
      answer: "To update your business profile, click on 'Profile' in the sidebar. From there, you can edit your business details, contact information, location, and upload business documents.",
      category: "Account"
    },
    {
      question: "How do I change my account settings?",
      answer: "To change your account settings, click on 'Settings' in the sidebar. You can update notification preferences, language settings, and other account preferences from this section.",
      category: "Account"
    },
    {
      question: "How do I get verified as a wholesaler?",
      answer: "To get verified, ensure your business details are complete in your profile. Upload required verification documents when prompted. Our team will review your information and update your verification status within 2-3 business days.",
      category: "Account"
    }
  ]

  const categories = [...new Set(faqs.map(faq => faq.category))]

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory ? faq.category === selectedCategory : true
    return matchesSearch && matchesCategory
  })

  const contactSupport = () => {
    window.open('mailto:support@dukaaon.com?subject=Web%20Console%20Support%20Request', '_blank')
  }

  const openWhatsapp = () => {
    window.open('https://wa.me/918086142552', '_blank')
  }

  const callSupport = () => {
    window.open('tel:+918086142552', '_blank')
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Help & Support
      </Typography>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search for help topics"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
      </Paper>

      {/* Category Filters */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip 
            label="All"
            variant={selectedCategory === null ? 'filled' : 'outlined'}
            onClick={() => setSelectedCategory(null)}
            color={selectedCategory === null ? 'primary' : 'default'}
          />
          {categories.map(category => (
            <Chip 
              key={category}
              label={category}
              variant={selectedCategory === category ? 'filled' : 'outlined'}
              onClick={() => setSelectedCategory(category)}
              color={selectedCategory === category ? 'primary' : 'default'}
            />
          ))}
        </Box>
      </Box>

      {/* Quick Help Cards */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
        Quick Help
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ cursor: 'pointer', '&:hover': { elevation: 4 } }}
            onClick={() => setSelectedCategory("Inventory")}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <InventoryIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="subtitle1" fontWeight={600}>
                Inventory Management
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ cursor: 'pointer', '&:hover': { elevation: 4 } }}
            onClick={() => setSelectedCategory("Delivery")}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <DeliveryIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="subtitle1" fontWeight={600}>
                Deliveries
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ cursor: 'pointer', '&:hover': { elevation: 4 } }}
            onClick={() => setSelectedCategory("Orders")}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <OrdersIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="subtitle1" fontWeight={600}>
                Orders
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ cursor: 'pointer', '&:hover': { elevation: 4 } }}
            onClick={() => setSelectedCategory("Account")}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <AccountIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="subtitle1" fontWeight={600}>
                Account
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* FAQs */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
        Frequently Asked Questions
      </Typography>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq, index) => (
              <Accordion key={faq.question} elevation={0}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <HelpIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="subtitle1" fontWeight={500}>
                      {faq.question}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography color="text.secondary" sx={{ pl: 4 }}>
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
                {index < filteredFAQs.length - 1 && <Divider />}
              </Accordion>
            ))
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No results found
              </Typography>
              <Typography color="text.disabled">
                Try a different search term or category
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
        Contact Support
      </Typography>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
              <HeadsetIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">Need more help?</Typography>
              <Typography color="text.secondary">
                Our support team is available 9AM-6PM, Monday to Saturday
              </Typography>
            </Box>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Button 
                fullWidth
                variant="contained" 
                startIcon={<EmailIcon />}
                onClick={contactSupport}
                sx={{ py: 1.5 }}
              >
                Email Support
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Button 
                fullWidth
                variant="contained" 
                startIcon={<WhatsAppIcon />}
                onClick={openWhatsapp}
                sx={{ py: 1.5, bgcolor: '#25D366', '&:hover': { bgcolor: '#1DA851' } }}
              >
                WhatsApp
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Button 
                fullWidth
                variant="contained" 
                startIcon={<PhoneIcon />}
                onClick={callSupport}
                color="secondary"
                sx={{ py: 1.5 }}
              >
                Call Support
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Video Tutorials */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
        Video Tutorials
      </Typography>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <List>
            <ListItem button>
              <ListItemIcon>
                <PlayCircleIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Getting Started with Dukaaon Seller Console"
                secondary="Learn the basics of using the Dukaaon seller console as a wholesaler"
              />
            </ListItem>
            <Divider />
            <ListItem button>
              <ListItemIcon>
                <PlayCircleIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Managing Your Inventory"
                secondary="How to add, edit, and organize your product inventory"
              />
            </ListItem>
            <Divider />
            <ListItem button>
              <ListItemIcon>
                <PlayCircleIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Handling Orders & Deliveries"
                secondary="Process orders and manage deliveries efficiently"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* App Version */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="caption" color="text.disabled">
          Dukaaon Seller Console v1.0.0
        </Typography>
      </Box>
    </Box>
  )
}