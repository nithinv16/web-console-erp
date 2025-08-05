export interface User {
  id: string
  phone_number: string
  email?: string
  role: 'retailer' | 'seller' | 'wholesaler' | 'manufacturer'
  status: 'pending' | 'active' | 'suspended'
  business_details: {
    shopName?: string
    ownerName?: string
    address?: string
    pincode?: string
    [key: string]: any
  }
  created_at: string
  updated_at: string
}

export interface SellerDetails {
  id: string
  user_id: string
  business_name: string
  owner_name: string
  seller_type: 'wholesaler' | 'manufacturer'
  registration_number?: string
  gst_number?: string
  profile_image_url?: string
  address: {
    street: string
    city: string
    state: string
    pincode: string
  }
  location_address?: string
  latitude?: number
  longitude?: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  seller_id?: string
  name: string
  category: string
  subcategory?: string
  brand?: string
  description?: string
  price: number
  unit: string
  min_order_quantity?: number
  stock_available?: number
  stock?: number
  image_url?: string
  imageUrl?: string
  is_active?: boolean
  isActive?: boolean
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
}

export interface Order {
  id: string
  order_number: string
  retailer_id: string
  seller_id: string
  total_amount: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  delivery_address: string
  payment_method?: string
  payment_status?: 'pending' | 'paid' | 'failed'
  created_at: string
  updated_at: string
  retailer?: {
    business_details: {
      shopName: string
      ownerName: string
    }
    phone_number: string
  }
}

export interface Customer {
  id: string
  business_name: string
  owner_name: string
  phone_number: string
  email?: string
  address: string
  total_orders: number
  total_spent: number
  last_order_date: string
  status: 'active' | 'inactive'
}

export interface Delivery {
  id: string
  retailer_id?: string | null
  manual_retailer?: {
    business_name: string
    address: string
    phone: string
  } | null
  estimated_delivery_time: string
  delivery_status: 'pending' | 'in_transit' | 'delivered' | 'cancelled'
  amount_to_collect?: number | null
  created_at: string
  retailer?: {
    business_details: {
      shopName: string
    }
  }
}

export interface BusinessStats {
  totalOrders: number
  pendingOrders: number
  totalProducts: number
  lowStockProducts: number
  revenue: {
    today: number
    thisMonth: number
    thisYear: number
  }
  customers: {
    total: number
    new: number
    repeat: number
  }
}

export interface Analytics {
  revenue: {
    total: number
    growth: number
    data: number[]
    labels: string[]
  }
  orders: {
    total: number
    growth: number
    data: number[]
    pending: number
  }
  products: {
    total: number
    lowStock: number
    topSelling: Array<{
      id: string
      name: string
      quantity: number
    }>
  }
  customers: {
    total: number
    new: number
    repeat: number
  }
}