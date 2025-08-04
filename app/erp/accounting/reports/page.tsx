'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert
} from '@mui/material'
import {
  Assessment,
  TrendingUp,
  AccountBalance,
  Receipt,
  PieChart,
  BarChart,
  GetApp,
  DateRange,
  AttachMoney,
  Business
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'

interface ReportType {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  category: 'financial' | 'tax' | 'analysis'
  action: () => void
}

interface FinancialSummary {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  grossMargin: number
  currentAssets: number
  currentLiabilities: number
  cashFlow: number
}

const mockFinancialSummary: FinancialSummary = {
  totalRevenue: 2500000,
  totalExpenses: 1800000,
  netProfit: 700000,
  grossMargin: 28,
  currentAssets: 1200000,
  currentLiabilities: 800000,
  cashFlow: 450000
}

export default function FinancialReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('current_month')
  const [selectedYear, setSelectedYear] = useState('2024')
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>(mockFinancialSummary)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const reportTypes: ReportType[] = [
    {
      id: 'profit_loss',
      title: 'Profit & Loss Statement',
      description: 'Comprehensive income statement showing revenues and expenses',
      icon: <TrendingUp />,
      category: 'financial',
      action: () => generateReport('profit_loss')
    },
    {
      id: 'balance_sheet',
      title: 'Balance Sheet',
      description: 'Statement of financial position showing assets, liabilities, and equity',
      icon: <AccountBalance />,
      category: 'financial',
      action: () => generateReport('balance_sheet')
    },
    {
      id: 'cash_flow',
      title: 'Cash Flow Statement',
      description: 'Analysis of cash inflows and outflows from operations',
      icon: <AttachMoney />,
      category: 'financial',
      action: () => generateReport('cash_flow')
    },
    {
      id: 'trial_balance',
      title: 'Trial Balance',
      description: 'Summary of all ledger account balances',
      icon: <Assessment />,
      category: 'financial',
      action: () => generateReport('trial_balance')
    },
    {
      id: 'gst_report',
      title: 'GST Report',
      description: 'Goods and Services Tax filing report',
      icon: <Receipt />,
      category: 'tax',
      action: () => generateReport('gst_report')
    },
    {
      id: 'tax_summary',
      title: 'Tax Summary',
      description: 'Comprehensive tax liability and payment summary',
      icon: <Business />,
      category: 'tax',
      action: () => generateReport('tax_summary')
    },
    {
      id: 'expense_analysis',
      title: 'Expense Analysis',
      description: 'Detailed breakdown of expenses by category and period',
      icon: <PieChart />,
      category: 'analysis',
      action: () => generateReport('expense_analysis')
    },
    {
      id: 'revenue_analysis',
      title: 'Revenue Analysis',
      description: 'Revenue trends and performance analysis',
      icon: <BarChart />,
      category: 'analysis',
      action: () => generateReport('revenue_analysis')
    }
  ]

  const generateReport = (reportType: string) => {
    // In a real application, this would generate and download the report
    console.log(`Generating ${reportType} report for ${selectedPeriod} ${selectedYear}`)
    alert(`Generating ${reportType} report. This feature will be implemented soon.`)
  }

  const getReportsByCategory = (category: string) => {
    return reportTypes.filter(report => report.category === category)
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Financial Reports
      </Typography>

      {/* Report Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Report Parameters
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Period</InputLabel>
                <Select
                  value={selectedPeriod}
                  label="Period"
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                  <MenuItem value="current_month">Current Month</MenuItem>
                  <MenuItem value="last_month">Last Month</MenuItem>
                  <MenuItem value="current_quarter">Current Quarter</MenuItem>
                  <MenuItem value="last_quarter">Last Quarter</MenuItem>
                  <MenuItem value="current_year">Current Year</MenuItem>
                  <MenuItem value="last_year">Last Year</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Financial Year</InputLabel>
                <Select
                  value={selectedYear}
                  label="Financial Year"
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <MenuItem value="2024">2024-25</MenuItem>
                  <MenuItem value="2023">2023-24</MenuItem>
                  <MenuItem value="2022">2022-23</MenuItem>
                  <MenuItem value="2021">2021-22</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Financial Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  ₹{(financialSummary.totalRevenue / 100000).toFixed(1)}L
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Revenue
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="error">
                  ₹{(financialSummary.totalExpenses / 100000).toFixed(1)}L
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Expenses
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  ₹{(financialSummary.netProfit / 100000).toFixed(1)}L
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Net Profit
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {financialSummary.grossMargin}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Gross Margin
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Report Categories */}
      <Grid container spacing={3}>
        {/* Financial Reports */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Assessment sx={{ mr: 1 }} />
                Financial Reports
              </Typography>
              <List>
                {getReportsByCategory('financial').map((report, index) => (
                  <React.Fragment key={report.id}>
                    <ListItem button onClick={report.action}>
                      <ListItemIcon>{report.icon}</ListItemIcon>
                      <ListItemText
                        primary={report.title}
                        secondary={report.description}
                      />
                      <GetApp />
                    </ListItem>
                    {index < getReportsByCategory('financial').length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Tax Reports */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Receipt sx={{ mr: 1 }} />
                Tax Reports
              </Typography>
              <List>
                {getReportsByCategory('tax').map((report, index) => (
                  <React.Fragment key={report.id}>
                    <ListItem button onClick={report.action}>
                      <ListItemIcon>{report.icon}</ListItemIcon>
                      <ListItemText
                        primary={report.title}
                        secondary={report.description}
                      />
                      <GetApp />
                    </ListItem>
                    {index < getReportsByCategory('tax').length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Analysis Reports */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <PieChart sx={{ mr: 1 }} />
                Analysis Reports
              </Typography>
              <List>
                {getReportsByCategory('analysis').map((report, index) => (
                  <React.Fragment key={report.id}>
                    <ListItem button onClick={report.action}>
                      <ListItemIcon>{report.icon}</ListItemIcon>
                      <ListItemText
                        primary={report.title}
                        secondary={report.description}
                      />
                      <GetApp />
                    </ListItem>
                    {index < getReportsByCategory('analysis').length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mt: 3 }}>
        Reports will be generated based on your current data and selected parameters. 
        All reports can be exported to PDF or Excel format.
      </Alert>
    </Box>
  )
}