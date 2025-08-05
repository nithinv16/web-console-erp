'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Fab,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  LinearProgress,
  Tooltip
} from '@mui/material'
import {
  Add,
  Search,
  FilterList,
  Edit,
  Delete,
  Visibility,
  MoreVert,
  Receipt,
  Person,
  CalendarToday,
  AttachMoney,
  CheckCircle,
  Cancel,
  Pending,
  Print,
  Email,
  Download,
  Payment,
  Warning,
  Schedule
} from '@mui/icons-material'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database, ERPInvoice, ERPCustomer } from '@/types/database'
import { useRouter } from 'next/navigation'

interface InvoiceWithCustomer extends ERPInvoice {
  customer?: ERPCustomer
  payment_status?: 'paid' | 'partial' | 'overdue' | 'pending'
  days_overdue?: number
}

interface InvoiceFilters {
  search: string
  status: string
  paymentStatus: string
  customer: string
  dateFrom: string
  dateTo: string
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceWithCustomer[]>([])
  const [customers, setCustomers] = useState<ERPCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [filters, setFilters] = useState<InvoiceFilters>({
    search: '',
    status: '',
    paymentStatus: '',
    customer: '',
    dateFrom: '',
    dateTo: ''
  })
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithCustomer | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('modern')
  
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()

  useEffect(() => {
    fetchInvoices()
    fetchCustomers()
  }, [page, rowsPerPage, filters])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      
      // Get company ID
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .limit(1)
        .single()
      
      if (!companies) {
        setError('No company found. Please setup your company first.')
        return
      }
      
      let query = supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(*)
        `)
        .eq('company_id', companies.id)
      
      // Apply filters
      if (filters.search) {
        query = query.or(`invoice_number.ilike.%${filters.search}%`)
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      
      if (filters.customer) {
        query = query.eq('customer_id', filters.customer)
      }
      
      if (filters.dateFrom) {
        query = query.gte('invoice_date', filters.dateFrom)
      }
      
      if (filters.dateTo) {
        query = query.lte('invoice_date', filters.dateTo)
      }
      
      // Get total count with same filters
      let countQuery = supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companies.id)
      
      // Apply same filters to count query
      if (filters.search) {
        countQuery = countQuery.or(`invoice_number.ilike.%${filters.search}%`)
      }
      
      if (filters.status) {
        countQuery = countQuery.eq('status', filters.status)
      }
      
      if (filters.customer) {
        countQuery = countQuery.eq('customer_id', filters.customer)
      }
      
      if (filters.dateFrom) {
        countQuery = countQuery.gte('invoice_date', filters.dateFrom)
      }
      
      if (filters.dateTo) {
        countQuery = countQuery.lte('invoice_date', filters.dateTo)
      }
      
      const { count } = await countQuery
      setTotalCount(count || 0)
      
      // Get paginated results
      const { data, error } = await query
        .range(page * rowsPerPage, (page + 1) * rowsPerPage - 1)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Enhance invoices with payment status
      const enhancedInvoices = (data || []).map(invoice => {
        const totalAmount = invoice.total_amount || 0
        const paidAmount = invoice.paid_amount || 0
        const dueDate = new Date(invoice.due_date || invoice.invoice_date)
        const today = new Date()
        const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
        
        let paymentStatus: 'paid' | 'partial' | 'overdue' | 'pending' = 'pending'
        
        if (paidAmount >= totalAmount) {
          paymentStatus = 'paid'
        } else if (paidAmount > 0) {
          paymentStatus = 'partial'
        } else if (daysOverdue > 0 && invoice.status === 'sent') {
          paymentStatus = 'overdue'
        }
        
        return {
          ...invoice,
          payment_status: paymentStatus,
          days_overdue: daysOverdue
        }
      })
      
      // Apply payment status filter
      const filteredInvoices = filters.paymentStatus 
        ? enhancedInvoices.filter(inv => inv.payment_status === filters.paymentStatus)
        : enhancedInvoices
      
      setInvoices(filteredInvoices)
      
    } catch (err) {
      console.error('Error fetching invoices:', err)
      setError('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }
  
  const fetchCustomers = async () => {
    try {
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .limit(1)
        .single()
      
      if (!companies) return
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('company_id', companies.id)
        .eq('status', 'active')
        .order('name')
      
      if (error) throw error
      setCustomers(data || [])
      
    } catch (err) {
      console.error('Error fetching customers:', err)
    }
  }
  
  const handleDeleteInvoice = async () => {
    if (!selectedInvoice) return
    
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', selectedInvoice.id)
      
      if (error) throw error
      
      setDeleteDialogOpen(false)
      setSelectedInvoice(null)
      fetchInvoices()
      
    } catch (err) {
      console.error('Error deleting invoice:', err)
      setError('Failed to delete invoice')
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default'
      case 'sent': return 'info'
      case 'paid': return 'success'
      case 'cancelled': return 'error'
      default: return 'default'
    }
  }
  
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success'
      case 'partial': return 'warning'
      case 'overdue': return 'error'
      case 'pending': return 'default'
      default: return 'default'
    }
  }
  
  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle />
      case 'partial': return <Schedule />
      case 'overdue': return <Warning />
      case 'pending': return <Pending />
      default: return <Pending />
    }
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  const handleFilterChange = (key: keyof InvoiceFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(0)
  }
  
  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      paymentStatus: '',
      customer: '',
      dateFrom: '',
      dateTo: ''
    })
    setPage(0)
  }

  const handlePrintInvoice = async (template = 'modern') => {
    if (!selectedInvoice) {
      console.error('No invoice selected for printing')
      return
    }
    
    console.log('Starting print process for invoice:', selectedInvoice.id, 'with template:', template)
    
    try {
      // Fetch complete invoice data with items and company
      const { data: invoiceData, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(*),
          invoice_items(*),
          company:companies(*)
        `)
        .eq('id', selectedInvoice.id)
        .single()
      
      if (error) {
        console.error('Database error:', error)
        throw error
      }
      
      console.log('Invoice data fetched:', invoiceData)
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        console.error('Failed to open print window - popup blocked?')
        alert('Please allow popups for this site to enable printing')
        return
      }
      
      console.log('Print window opened successfully')
      
      // Generate print HTML with selected template
      const printHTML = generateInvoicePrintHTML(invoiceData, false, template)
      
      console.log('Generated HTML length:', printHTML.length)
      
      printWindow.document.write(printHTML)
      printWindow.document.close()
      
      // Wait for content to load then print
      setTimeout(() => {
        console.log('Triggering print dialog')
        printWindow.print()
        // Don't close immediately to allow user to see the content
        setTimeout(() => printWindow.close(), 1000)
      }, 500)
      
    } catch (err) {
      console.error('Error printing invoice:', err)
      setError('Failed to print invoice: ' + (err as Error).message)
    }
  }

  const handleDownloadPDF = async (template = 'modern') => {
    if (!selectedInvoice) {
      console.error('No invoice selected for PDF generation')
      return
    }
    
    console.log('Starting PDF generation for invoice:', selectedInvoice.id, 'with template:', template)
    
    try {
      // Fetch complete invoice data with items and company
      const { data: invoiceData, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(*),
          invoice_items(*),
          company:companies(*)
        `)
        .eq('id', selectedInvoice.id)
        .single()
      
      if (error) {
        console.error('Database error:', error)
        throw error
      }
      
      console.log('Invoice data fetched for PDF:', invoiceData)
      
      // Generate PDF using browser's print to PDF functionality
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        console.error('Failed to open PDF window - popup blocked?')
        alert('Please allow popups for this site to enable PDF generation')
        return
      }
      
      console.log('PDF window opened successfully')
      
      const printHTML = generateInvoicePrintHTML(invoiceData, true, template)
      
      console.log('Generated PDF HTML length:', printHTML.length)
      
      printWindow.document.write(printHTML)
      printWindow.document.close()
      
      // Add instructions for PDF generation
      setTimeout(() => {
        console.log('PDF content loaded, user can now print to PDF')
        // Add a message to the PDF window
        const messageDiv = printWindow.document.createElement('div')
        messageDiv.innerHTML = `
          <div style="position: fixed; top: 10px; right: 10px; background: #2196f3; color: white; padding: 10px 15px; border-radius: 5px; z-index: 9999; font-family: Arial; font-size: 14px; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
            💡 Press Ctrl+P and select "Save as PDF" to download
          </div>
        `
        printWindow.document.body.appendChild(messageDiv)
        
        // Auto-trigger print dialog after a short delay
        setTimeout(() => {
          printWindow.print()
        }, 1000)
      }, 500)
      
    } catch (err) {
      console.error('Error generating PDF:', err)
      setError('Failed to generate PDF: ' + (err as Error).message)
    }
  }

  const handleTemplateSelection = (action: 'print' | 'pdf') => {
    setTemplateDialogOpen(true)
    // Store the action for later use
    setSelectedInvoice({...selectedInvoice, pendingAction: action} as any)
  }

  const executeTemplateAction = () => {
    if (!selectedInvoice) return
    
    if ((selectedInvoice as any).pendingAction === 'print') {
      handlePrintInvoice(selectedTemplate)
    } else if ((selectedInvoice as any).pendingAction === 'pdf') {
      handleDownloadPDF(selectedTemplate)
    }
    
    setTemplateDialogOpen(false)
    setActionMenuAnchor(null)
  }

  const generateInvoicePrintHTML = (invoice: any, isPDF = false, template = 'modern') => {
    const items = invoice.invoice_items || [];
    const customer = invoice.customer || {};
    const company = invoice.company || {};
    let companyAddress = {};
    try {
      companyAddress = company.address ? (typeof company.address === 'string' ? JSON.parse(company.address) : company.address) : {};
    } catch (error) {
      console.warn('Error parsing company address:', error);
      companyAddress = {};
    }
    
    const getTemplateStyles = () => {
      switch (template) {
        case 'classic':
          return `
            body {
              font-family: 'Times New Roman', serif;
              margin: 0;
              padding: 30px;
              color: #000;
              line-height: 1.6;
            }
            .invoice-header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 3px double #000;
              padding-bottom: 20px;
            }
            .invoice-title {
              font-size: 36px;
              font-weight: bold;
              margin-bottom: 10px;
              text-decoration: underline;
            }
            .company-info {
              margin-bottom: 20px;
            }
            .invoice-details {
              display: flex;
              justify-content: space-between;
              margin: 30px 0;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 15px;
              text-decoration: underline;
            }
            .customer-info {
              border: 2px solid #000;
              padding: 20px;
              margin: 20px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              border: 2px solid #000;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border: 1px solid #000;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .total-section {
              margin-top: 30px;
              border-top: 2px solid #000;
              padding-top: 20px;
            }
            .grand-total {
              font-size: 20px;
              font-weight: bold;
              border: 2px solid #000;
              padding: 15px;
              background-color: #f9f9f9;
            }
          `
        case 'minimal':
          return `
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              margin: 0;
              padding: 40px;
              color: #333;
              line-height: 1.5;
            }
            .invoice-header {
              margin-bottom: 50px;
            }
            .invoice-title {
              font-size: 24px;
              font-weight: 300;
              margin-bottom: 30px;
              color: #666;
            }
            .invoice-details {
              display: flex;
              justify-content: space-between;
              margin: 40px 0;
            }
            .section-title {
              font-size: 14px;
              font-weight: 600;
              margin-bottom: 10px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .customer-info {
              padding: 0;
              margin: 20px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 30px 0;
            }
            th, td {
              padding: 15px 0;
              text-align: left;
              border-bottom: 1px solid #eee;
            }
            th {
              font-weight: 600;
              color: #666;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .total-section {
              margin-top: 40px;
              padding-top: 20px;
            }
            .grand-total {
              font-size: 18px;
              font-weight: 600;
              padding-top: 15px;
              border-top: 2px solid #333;
            }
          `
        default: // modern
          return `
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
            }
            .invoice-container {
              background: white;
              border-radius: 15px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            .invoice-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 40px;
              padding-bottom: 30px;
              border-bottom: 3px solid #667eea;
              position: relative;
            }
            .invoice-header::after {
              content: '';
              position: absolute;
              bottom: -3px;
              left: 0;
              width: 100px;
              height: 3px;
              background: #764ba2;
            }
            .invoice-title {
              font-size: 32px;
              font-weight: 700;
              background: linear-gradient(135deg, #667eea, #764ba2);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              margin-bottom: 15px;
            }
            .company-info {
              flex: 1;
            }
            .invoice-info {
              text-align: right;
              flex: 1;
              background: linear-gradient(135deg, #f8f9ff, #e8ecff);
              padding: 20px;
              border-radius: 10px;
              border-left: 4px solid #667eea;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 15px;
              color: #667eea;
              position: relative;
              padding-left: 20px;
            }
            .section-title::before {
              content: '';
              position: absolute;
              left: 0;
              top: 50%;
              transform: translateY(-50%);
              width: 4px;
              height: 20px;
              background: linear-gradient(135deg, #667eea, #764ba2);
              border-radius: 2px;
            }
            .customer-info {
              background: linear-gradient(135deg, #f8f9ff, #e8ecff);
              padding: 25px;
              border-radius: 12px;
              border: 1px solid #e0e7ff;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            th, td {
              padding: 15px;
              text-align: left;
            }
            th {
              background: linear-gradient(135deg, #667eea, #764ba2);
              color: white;
              font-weight: 600;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            tr:nth-child(even) {
              background-color: #f8f9ff;
            }
            tr:hover {
              background-color: #e8ecff;
            }
            .amount {
              text-align: right;
              font-weight: 600;
            }
            .total-section {
              margin-top: 30px;
              background: linear-gradient(135deg, #f8f9ff, #e8ecff);
              padding: 25px;
              border-radius: 12px;
              border: 1px solid #e0e7ff;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
              padding: 8px 0;
            }
            .total-label {
              font-weight: 600;
            }
            .grand-total {
              font-size: 20px;
              font-weight: 700;
              border-top: 2px solid #667eea;
              padding-top: 15px;
              margin-top: 15px;
              color: #667eea;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              padding: 25px;
              background: linear-gradient(135deg, #667eea, #764ba2);
              color: white;
              border-radius: 12px;
              font-size: 14px;
            }
            @media print {
              body { 
                margin: 0; 
                background: white !important;
                -webkit-print-color-adjust: exact;
              }
              .invoice-container {
                box-shadow: none;
                border-radius: 0;
              }
              .no-print { display: none; }
            }
          `
      }
    }
    
    const renderContent = () => {
      if (template === 'classic') {
        return `
          <div class="invoice-header">
            <div class="invoice-title">INVOICE</div>
            <div class="company-info">
              <div><strong>${company.name || 'Company Name'}</strong></div>
              <div>${(companyAddress as any)?.street || company.address || 'Company Address'}</div>
              <div>${(companyAddress as any)?.city || 'City'}, ${(companyAddress as any)?.state || 'State'} ${(companyAddress as any)?.postal_code || 'Postal Code'}</div>
              <div>Phone: ${company.phone || 'N/A'}</div>
              <div>Email: ${company.email || 'N/A'}</div>
              <div>GST: ${company.gst_number || company.tax_id || 'N/A'}</div>
            </div>
          </div>
          
          <div class="invoice-details">
            <div>
              <div><strong>Invoice Number:</strong> ${invoice.invoice_number}</div>
              <div><strong>Invoice Date:</strong> ${formatDate(invoice.invoice_date)}</div>
              ${invoice.due_date ? `<div><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</div>` : ''}
            </div>
            <div>
              <div><strong>Status:</strong> ${invoice.status.toUpperCase()}</div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">BILL TO:</div>
            <div class="customer-info">
              <div><strong>${customer.name || 'N/A'}</strong></div>
              ${customer.email ? `<div>Email: ${customer.email}</div>` : ''}
              ${customer.phone ? `<div>Phone: ${customer.phone}</div>` : ''}
              ${customer.address ? `<div>${customer.address}</div>` : ''}
              ${customer.city ? `<div>${customer.city}, ${customer.state || ''} ${customer.postal_code || ''}</div>` : ''}
            </div>
          </div>
        `
      } else if (template === 'minimal') {
        return `
          <div class="invoice-header">
            <div class="invoice-details">
              <div>
                <div class="invoice-title">Invoice</div>
                <div>${company.name || 'Company Name'}</div>
                <div>${company.email || 'company@email.com'}</div>
              </div>
              <div>
                <div>${invoice.invoice_number}</div>
                <div>${formatDate(invoice.invoice_date)}</div>
                ${invoice.due_date ? `<div>Due: ${formatDate(invoice.due_date)}</div>` : ''}
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Bill To</div>
            <div class="customer-info">
              <div><strong>${customer.name || 'N/A'}</strong></div>
              ${customer.email ? `<div>${customer.email}</div>` : ''}
              ${customer.phone ? `<div>${customer.phone}</div>` : ''}
              ${customer.address ? `<div>${customer.address}</div>` : ''}
              ${customer.city ? `<div>${customer.city}, ${customer.state || ''} ${customer.postal_code || ''}</div>` : ''}
            </div>
          </div>
        `
      } else {
        return `
          <div class="invoice-header">
            <div class="company-info">
              <div class="invoice-title">INVOICE</div>
              <div><strong>${company.name || 'Company Name'}</strong></div>
              <div>${company.tagline || company.description || 'Your Business Partner'}</div>
              <div>📍 ${(companyAddress as any)?.street || company.address || 'Company Address'}, ${(companyAddress as any)?.city || 'City'}, ${(companyAddress as any)?.state || 'State'} ${(companyAddress as any)?.postal_code || 'Postal Code'}</div>
              <div>📞 ${company.phone || 'N/A'} | ✉️ ${company.email || 'company@email.com'}</div>
              <div>🏢 GST: ${company.gst_number || company.tax_id || 'N/A'}</div>
            </div>
            <div class="invoice-info">
              <div><strong>Invoice #:</strong> ${invoice.invoice_number}</div>
              <div><strong>Date:</strong> ${formatDate(invoice.invoice_date)}</div>
              ${invoice.due_date ? `<div><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</div>` : ''}
              <div><strong>Status:</strong> <span style="padding: 4px 12px; border-radius: 20px; background: ${invoice.status === 'paid' ? '#4caf50' : invoice.status === 'sent' ? '#2196f3' : '#ff9800'}; color: white; font-size: 12px;">${invoice.status.toUpperCase()}</span></div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Bill To</div>
            <div class="customer-info">
              <div><strong>👤 ${customer.name || 'N/A'}</strong></div>
              ${customer.email ? `<div>✉️ ${customer.email}</div>` : ''}
              ${customer.phone ? `<div>📞 ${customer.phone}</div>` : ''}
              ${customer.address ? `<div>📍 ${customer.address}</div>` : ''}
              ${customer.city ? `<div>🏙️ ${customer.city}, ${customer.state || ''} ${customer.postal_code || ''}</div>` : ''}
            </div>
          </div>
        `
      }
    }
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoice_number}</title>
        <meta charset="UTF-8">
        <style>
          ${getTemplateStyles()}
        </style>
      </head>
      <body>
        ${template === 'modern' ? '<div class="invoice-container">' : ''}
        ${renderContent()}
        
        <div class="section">
          <div class="section-title">${template === 'minimal' ? 'Items' : 'Invoice Items'}</div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Tax Rate</th>
                <th>Tax Amount</th>
                <th class="amount">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item: any) => `
                <tr>
                  <td>${item.description || 'N/A'}</td>
                  <td>${item.quantity || 0}</td>
                  <td class="amount">${formatCurrency(item.unit_price || 0)}</td>
                  <td class="amount">${item.tax_rate || 0}%</td>
                  <td class="amount">${formatCurrency(item.tax_amount || 0)}</td>
                  <td class="amount"><strong>${formatCurrency(item.total_amount || 0)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="total-section">
          <div class="total-row">
            <span class="total-label">Subtotal:</span>
            <span>${formatCurrency(invoice.subtotal || 0)}</span>
          </div>
          <div class="total-row">
            <span class="total-label">Tax Amount:</span>
            <span>${formatCurrency(invoice.tax_amount || 0)}</span>
          </div>
          <div class="total-row grand-total">
            <span class="total-label">Total Amount:</span>
            <span>${formatCurrency(invoice.total_amount || 0)}</span>
          </div>
          ${invoice.paid_amount > 0 ? `
            <div class="total-row">
              <span class="total-label">Paid Amount:</span>
              <span style="color: #4caf50;">${formatCurrency(invoice.paid_amount)}</span>
            </div>
            <div class="total-row">
              <span class="total-label">Balance Due:</span>
              <span style="color: ${(invoice.total_amount || 0) - (invoice.paid_amount || 0) > 0 ? '#f44336' : '#4caf50'};">${formatCurrency((invoice.total_amount || 0) - (invoice.paid_amount || 0))}</span>
            </div>
          ` : ''}
        </div>
        
        ${invoice.notes ? `
          <div class="section">
            <div class="section-title">Notes</div>
            <div style="padding: 15px; background: #f9f9f9; border-radius: 8px; border-left: 4px solid #667eea;">${invoice.notes}</div>
          </div>
        ` : ''}
        
        <div class="footer">
          <p><strong>Thank you for your business!</strong></p>
          <p>For any queries, contact us at contact@dukaaon.in</p>
          ${isPDF ? '<p style="margin-top: 15px; font-size: 12px; opacity: 0.8;">📄 This invoice was generated electronically and is valid without signature.</p>' : ''}
        </div>
        ${template === 'modern' ? '</div>' : ''}
      </body>
      </html>
    `
  }

  if (loading && invoices.length === 0) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Invoices</Typography>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading invoices...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Invoices
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage customer invoices and track payments
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => {/* TODO: Implement export */}}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push('/erp/accounting/invoices/new')}
          >
            New Invoice
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                placeholder="Search invoices..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={1.5}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="sent">Sent</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1.5}>
              <FormControl fullWidth>
                <InputLabel>Payment</InputLabel>
                <Select
                  value={filters.paymentStatus}
                  onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                  label="Payment"
                >
                  <MenuItem value="">All Payments</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="partial">Partial</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Customer</InputLabel>
                <Select
                  value={filters.customer}
                  onChange={(e) => handleFilterChange('customer', e.target.value)}
                  label="Customer"
                >
                  <MenuItem value="">All Customers</MenuItem>
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1.5}>
              <TextField
                fullWidth
                label="From Date"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={1.5}>
              <TextField
                fullWidth
                label="To Date"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={1}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={clearFilters}
                fullWidth
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No invoices found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {loading ? 'Loading invoices...' : 'Get started by creating your first invoice or adding sample data for testing.'}
                      </Typography>
                      {!loading && (
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                          <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => router.push('/erp/accounting/invoices/new')}
                          >
                            Create Invoice
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => {
                              // Show instructions for adding sample data
                              alert('To add sample data:\n\n1. Go to Supabase Dashboard > SQL Editor\n2. Copy content from insert-sample-data.sql\n3. Run the script\n\nOr check SETUP_SAMPLE_DATA.md for detailed instructions.')
                            }}
                          >
                            Add Sample Data
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">
                        {invoice.invoice_number}
                      </Typography>

                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.light' }}>
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {invoice.customer?.name || 'Unknown Customer'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {invoice.customer?.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarToday sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {formatDate(invoice.invoice_date)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {invoice.due_date ? (
                      <Box>
                        <Typography variant="body2">
                          {formatDate(invoice.due_date)}
                        </Typography>
                        {invoice.days_overdue && invoice.days_overdue > 0 && (
                          <Typography variant="caption" color="error">
                            {invoice.days_overdue} days overdue
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No due date
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">
                        {formatCurrency(invoice.total_amount || 0)}
                      </Typography>
                      {invoice.paid_amount && invoice.paid_amount > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          Paid: {formatCurrency(invoice.paid_amount)}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={invoice.status}
                      size="small"
                      color={getStatusColor(invoice.status) as any}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={invoice.payment_status}
                      size="small"
                      color={getPaymentStatusColor(invoice.payment_status || 'pending') as any}
                      icon={getPaymentStatusIcon(invoice.payment_status || 'pending')}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => {
                        setActionMenuAnchor(e.currentTarget)
                        setSelectedInvoiceId(invoice.id)
                        setSelectedInvoice(invoice)
                      }}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={() => setActionMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            router.push(`/erp/accounting/invoices/${selectedInvoiceId}`)
            setActionMenuAnchor(null)
          }}
        >
          <ListItemIcon><Visibility /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            router.push(`/erp/accounting/invoices/${selectedInvoiceId}/edit`)
            setActionMenuAnchor(null)
          }}
        >
          <ListItemIcon><Edit /></ListItemIcon>
          <ListItemText>Edit Invoice</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleTemplateSelection('print')
          }}
        >
          <ListItemIcon><Print /></ListItemIcon>
          <ListItemText>Print Invoice</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleTemplateSelection('pdf')
          }}
        >
          <ListItemIcon><Download /></ListItemIcon>
          <ListItemText>Download PDF</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            // TODO: Implement email functionality
            setActionMenuAnchor(null)
          }}
        >
          <ListItemIcon><Email /></ListItemIcon>
          <ListItemText>Email Customer</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            router.push(`/erp/accounting/invoices/${selectedInvoiceId}/payment`)
            setActionMenuAnchor(null)
          }}
        >
          <ListItemIcon><Payment /></ListItemIcon>
          <ListItemText>Record Payment</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setDeleteDialogOpen(true)
            setActionMenuAnchor(null)
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><Delete color="error" /></ListItemIcon>
          <ListItemText>Delete Invoice</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Invoice</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete invoice "{selectedInvoice?.invoice_number}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteInvoice} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Selection Dialog */}
      <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Select Invoice Template</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  cursor: 'pointer', 
                  border: selectedTemplate === 'modern' ? 3 : 1,
                  borderColor: selectedTemplate === 'modern' ? 'primary.main' : 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  }
                }}
                onClick={() => setSelectedTemplate('modern')}
              >
                <Box sx={{ p: 2, bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', minHeight: 120 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>🏢 INVOICE</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Dukaaon Business Solutions</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Invoice #INV-001</Typography>
                  <Box sx={{ mt: 2, p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                    <Typography variant="caption">💰 Total: ₹1,000.00</Typography>
                  </Box>
                </Box>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">Modern Template</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gradient design with card-style layout, emoji icons, and modern typography
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Chip label="Gradient" size="small" color="primary" variant="outlined" />
                    <Chip label="Modern" size="small" color="secondary" variant="outlined" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  cursor: 'pointer', 
                  border: selectedTemplate === 'classic' ? 3 : 1,
                  borderColor: selectedTemplate === 'classic' ? 'primary.main' : 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  }
                }}
                onClick={() => setSelectedTemplate('classic')}
              >
                <Box sx={{ p: 2, bgcolor: '#f8f9fa', border: '3px double #333', minHeight: 120 }}>
                  <Typography variant="h5" sx={{ fontFamily: 'serif', textAlign: 'center', fontWeight: 'bold', mb: 1 }}>INVOICE</Typography>
                  <Typography variant="body2" sx={{ textAlign: 'center', fontFamily: 'serif' }}>DUKAAON BUSINESS SOLUTIONS</Typography>
                  <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>Invoice #INV-001</Typography>
                  <Box sx={{ mt: 2, textAlign: 'center', p: 1, border: '1px solid #333' }}>
                    <Typography variant="caption" sx={{ fontFamily: 'serif' }}>Total: ₹1,000.00</Typography>
                  </Box>
                </Box>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">Classic Template</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Traditional business layout with serif fonts and formal double borders
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Chip label="Traditional" size="small" color="primary" variant="outlined" />
                    <Chip label="Formal" size="small" color="secondary" variant="outlined" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  cursor: 'pointer', 
                  border: selectedTemplate === 'minimal' ? 3 : 1,
                  borderColor: selectedTemplate === 'minimal' ? 'primary.main' : 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  }
                }}
                onClick={() => setSelectedTemplate('minimal')}
              >
                <Box sx={{ p: 3, bgcolor: '#ffffff', minHeight: 120, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 300, mb: 2, color: '#333' }}>Invoice</Typography>
                  <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>Dukaaon Business Solutions</Typography>
                  <Typography variant="caption" sx={{ color: '#999' }}>INV-001</Typography>
                  <Box sx={{ mt: 3, pt: 1, borderTop: '1px solid #f0f0f0' }}>
                    <Typography variant="body2" sx={{ color: '#333', fontWeight: 500 }}>₹1,000.00</Typography>
                  </Box>
                </Box>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">Minimal Template</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Clean typography with ample whitespace and subtle color schemes
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Chip label="Clean" size="small" color="primary" variant="outlined" />
                    <Chip label="Simple" size="small" color="secondary" variant="outlined" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={executeTemplateAction} 
            variant="contained"
            disabled={!selectedTemplate}
            startIcon={selectedInvoice && (selectedInvoice as any).pendingAction === 'print' ? <Print /> : <Download />}
          >
            {selectedInvoice && (selectedInvoice as any).pendingAction === 'print' ? 'Print Invoice' : 'Download PDF'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => router.push('/erp/accounting/invoices/new')}
      >
        <Add />
      </Fab>
    </Box>
  )
}