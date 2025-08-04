'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from './AuthContext'

interface OrderNotificationContextType {
  newOrdersCount: number
  markOrdersAsViewed: () => void
  refreshOrderCount: () => void
}

const OrderNotificationContext = createContext<OrderNotificationContextType | undefined>(undefined)

export function OrderNotificationProvider({ children }: { children: React.ReactNode }) {
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const { user } = useAuth()
  const supabase = createClientComponentClient()

  const fetchNewOrdersCount = async () => {
    if (!user?.id) return

    try {
      // Get orders from the last 24 hours that are still pending
      const twentyFourHoursAgo = new Date()
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

      const { data, error } = await supabase
        .from('orders')
        .select('id')
        .eq('seller_id', user.id)
        .eq('status', 'pending')
        .gte('created_at', twentyFourHoursAgo.toISOString())

      if (error) {
        console.error('Error fetching new orders count:', error)
        return
      }

      setNewOrdersCount(data?.length || 0)
    } catch (error) {
      console.error('Error in fetchNewOrdersCount:', error)
    }
  }

  const markOrdersAsViewed = () => {
    setNewOrdersCount(0)
  }

  const refreshOrderCount = () => {
    fetchNewOrdersCount()
  }

  useEffect(() => {
    if (user?.id) {
      fetchNewOrdersCount()

      // Set up real-time subscription for new orders
      const channel = supabase
        .channel('new-orders')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `seller_id=eq.${user.id}`
          },
          (payload) => {
            console.log('New order received:', payload)
            fetchNewOrdersCount()
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `seller_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Order updated:', payload)
            fetchNewOrdersCount()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user?.id])

  return (
    <OrderNotificationContext.Provider value={{
      newOrdersCount,
      markOrdersAsViewed,
      refreshOrderCount
    }}>
      {children}
    </OrderNotificationContext.Provider>
  )
}

export function useOrderNotifications() {
  const context = useContext(OrderNotificationContext)
  if (context === undefined) {
    throw new Error('useOrderNotifications must be used within an OrderNotificationProvider')
  }
  return context
}