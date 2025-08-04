import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { OrderNotificationProvider } from '@/contexts/OrderNotificationContext'
import theme from '@/theme'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DukaaOn Seller Console',
  description: 'Seller console for wholesalers, distributors, and manufacturers',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
              <OrderNotificationProvider>
                {children}
              </OrderNotificationProvider>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#4CAF50',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 4000,
                    iconTheme: {
                      primary: '#F44336',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </AuthProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}