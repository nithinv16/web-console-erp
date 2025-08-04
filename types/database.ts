export interface Database {
  public: {
    Tables: {
      // Existing tables
      profiles: {
        Row: {
          id: string
          fire_id?: string | null
          phone_number: string
          email?: string | null
          role: 'retailer' | 'seller' | 'wholesaler' | 'manufacturer'
          status?: 'pending' | 'active' | 'suspended'
          language?: string
          business_details: {
            shopName?: string
            ownerName?: string
            address?: string
            pincode?: string
            company_id?: string
            [key: string]: any
          }
          latitude?: number
          longitude?: number
          location_address?: string
          location_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          fire_id?: string | null
          phone_number: string
          email?: string | null
          role: 'retailer' | 'seller' | 'wholesaler' | 'manufacturer'
          status?: 'pending' | 'active' | 'suspended'
          language?: string
          business_details?: any
          latitude?: number
          longitude?: number
          location_address?: string
          location_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          fire_id?: string | null
          phone_number?: string
          email?: string | null
          role?: 'retailer' | 'seller' | 'wholesaler' | 'manufacturer'
          status?: 'pending' | 'active' | 'suspended'
          language?: string
          business_details?: any
          latitude?: number
          longitude?: number
          location_address?: string
          location_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      seller_details: {
        Row: {
          id: string
          user_id: string
          business_name: string
          owner_name: string
          seller_type: 'wholesaler' | 'manufacturer'
          registration_number?: string
          gst_number?: string
          profile_image_url?: string
          address: any
          location_address?: string
          latitude?: number
          longitude?: number
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name: string
          owner_name: string
          seller_type: 'wholesaler' | 'manufacturer'
          registration_number?: string
          gst_number?: string
          profile_image_url?: string
          address?: any
          location_address?: string
          latitude?: number
          longitude?: number
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string
          owner_name?: string
          seller_type?: 'wholesaler' | 'manufacturer'
          registration_number?: string
          gst_number?: string
          profile_image_url?: string
          address?: any
          location_address?: string
          latitude?: number
          longitude?: number
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          seller_id: string
          name: string
          category: string
          subcategory?: string
          brand?: string
          description?: string
          price: number
          unit: string
          min_quantity: number
          stock_available: number
          image_url?: string
          barcode?: string
          ean_code?: string
          upc_code?: string
          gtin?: string
          master_product_id?: string
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          seller_id: string
          name: string
          category: string
          subcategory?: string
          brand?: string
          description?: string
          price: number
          unit: string
          min_quantity: number
          stock_available: number
          image_url?: string
          barcode?: string
          ean_code?: string
          upc_code?: string
          gtin?: string
          master_product_id?: string
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          seller_id?: string
          name?: string
          category?: string
          subcategory?: string
          brand?: string
          description?: string
          price?: number
          unit?: string
          min_quantity?: number
          stock_available?: number
          image_url?: string
          barcode?: string
          ean_code?: string
          upc_code?: string
          gtin?: string
          master_product_id?: string
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
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
        }
        Insert: {
          id?: string
          order_number: string
          retailer_id: string
          seller_id: string
          total_amount: number
          status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
          delivery_address: string
          payment_method?: string
          payment_status?: 'pending' | 'paid' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          retailer_id?: string
          seller_id?: string
          total_amount?: number
          status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
          delivery_address?: string
          payment_method?: string
          payment_status?: 'pending' | 'paid' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
      delivery_orders: {
        Row: {
          id: string
          seller_id: string
          retailer_id?: string | null
          manual_retailer?: any | null
          estimated_delivery_time: string
          delivery_status: 'pending' | 'in_transit' | 'delivered' | 'cancelled'
          amount_to_collect?: number | null
          created_at: string
          updated_at?: string
        }
        Insert: {
          id?: string
          seller_id: string
          retailer_id?: string | null
          manual_retailer?: any | null
          estimated_delivery_time: string
          delivery_status?: 'pending' | 'in_transit' | 'delivered' | 'cancelled'
          amount_to_collect?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          seller_id?: string
          retailer_id?: string | null
          manual_retailer?: any | null
          estimated_delivery_time?: string
          delivery_status?: 'pending' | 'in_transit' | 'delivered' | 'cancelled'
          amount_to_collect?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      // New ERP Tables
      companies: {
        Row: {
          id: string
          name: string
          registration_number?: string
          gst_number?: string
          pan_number?: string
          address?: any
          phone?: string
          email?: string
          website?: string
          logo_url?: string
          subscription_plan: string
          subscription_status: string
          settings: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          registration_number?: string
          gst_number?: string
          pan_number?: string
          address?: any
          phone?: string
          email?: string
          website?: string
          logo_url?: string
          subscription_plan?: string
          subscription_status?: string
          settings?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          registration_number?: string
          gst_number?: string
          pan_number?: string
          address?: any
          phone?: string
          email?: string
          website?: string
          logo_url?: string
          subscription_plan?: string
          subscription_status?: string
          settings?: any
          created_at?: string
          updated_at?: string
        }
      }
      departments: {
        Row: {
          id: string
          company_id: string
          name: string
          description?: string
          manager_id?: string
          budget?: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string
          manager_id?: string
          budget?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          description?: string
          manager_id?: string
          budget?: number
          created_at?: string
          updated_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          company_id: string
          department_id?: string
          employee_code?: string
          first_name: string
          last_name: string
          email?: string
          phone?: string
          position?: string
          salary?: number
          hire_date?: string
          status: string
          permissions: any
          address?: any
          emergency_contact?: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          department_id?: string
          employee_code?: string
          first_name: string
          last_name: string
          email?: string
          phone?: string
          position?: string
          salary?: number
          hire_date?: string
          status?: string
          permissions?: any
          address?: any
          emergency_contact?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          department_id?: string
          employee_code?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string
          position?: string
          salary?: number
          hire_date?: string
          status?: string
          permissions?: any
          address?: any
          emergency_contact?: any
          created_at?: string
          updated_at?: string
        }
      }
      suppliers: {
        Row: {
          id: string
          company_id: string
          supplier_code?: string
          name: string
          contact_person?: string
          email?: string
          phone?: string
          address?: any
          gst_number?: string
          pan_number?: string
          payment_terms?: string
          credit_limit?: number
          rating?: number
          status: string
          bank_details?: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          supplier_code?: string
          name: string
          contact_person?: string
          email?: string
          phone?: string
          address?: any
          gst_number?: string
          pan_number?: string
          payment_terms?: string
          credit_limit?: number
          rating?: number
          status?: string
          bank_details?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          supplier_code?: string
          name?: string
          contact_person?: string
          email?: string
          phone?: string
          address?: any
          gst_number?: string
          pan_number?: string
          payment_terms?: string
          credit_limit?: number
          rating?: number
          status?: string
          bank_details?: any
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          company_id: string
          customer_code?: string
          name: string
          contact_person?: string
          email?: string
          phone?: string
          address?: any
          gst_number?: string
          pan_number?: string
          customer_type: string
          credit_limit?: number
          payment_terms?: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          customer_code?: string
          name: string
          contact_person?: string
          email?: string
          phone?: string
          address?: any
          gst_number?: string
          pan_number?: string
          customer_type?: string
          credit_limit?: number
          payment_terms?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          customer_code?: string
          name?: string
          contact_person?: string
          email?: string
          phone?: string
          address?: any
          gst_number?: string
          pan_number?: string
          customer_type?: string
          credit_limit?: number
          payment_terms?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      warehouses: {
        Row: {
          id: string
          company_id: string
          name: string
          code?: string
          address?: any
          manager_id?: string
          capacity?: number
          current_utilization: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          code?: string
          address?: any
          manager_id?: string
          capacity?: number
          current_utilization?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          code?: string
          address?: any
          manager_id?: string
          capacity?: number
          current_utilization?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      product_categories: {
        Row: {
          id: string
          company_id: string
          name: string
          description?: string
          parent_id?: string
          image_url?: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string
          parent_id?: string
          image_url?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          description?: string
          parent_id?: string
          image_url?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      erp_products: {
        Row: {
          id: string
          company_id: string
          category_id?: string
          sku: string
          name: string
          description?: string
          brand?: string
          unit_of_measure?: string
          weight?: number
          dimensions?: any
          cost_price?: number
          selling_price?: number
          mrp?: number
          tax_rate?: number
          hsn_code?: string
          barcode?: string
          min_stock_level: number
          max_stock_level?: number
          reorder_point?: number
          lead_time_days?: number
          status: string
          images: any
          attributes: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          category_id?: string
          sku: string
          name: string
          description?: string
          brand?: string
          unit_of_measure?: string
          weight?: number
          dimensions?: any
          cost_price?: number
          selling_price?: number
          mrp?: number
          tax_rate?: number
          hsn_code?: string
          barcode?: string
          min_stock_level?: number
          max_stock_level?: number
          reorder_point?: number
          lead_time_days?: number
          status?: string
          images?: any
          attributes?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          category_id?: string
          sku?: string
          name?: string
          description?: string
          brand?: string
          unit_of_measure?: string
          weight?: number
          dimensions?: any
          cost_price?: number
          selling_price?: number
          mrp?: number
          tax_rate?: number
          hsn_code?: string
          barcode?: string
          min_stock_level?: number
          max_stock_level?: number
          reorder_point?: number
          lead_time_days?: number
          status?: string
          images?: any
          attributes?: any
          created_at?: string
          updated_at?: string
        }
      }
      inventory_transactions: {
        Row: {
          id: string
          company_id: string
          product_id: string
          warehouse_id: string
          transaction_type: string
          quantity: number
          unit_cost?: number
          reference_type?: string
          reference_id?: string
          batch_number?: string
          expiry_date?: string
          notes?: string
          created_by?: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          product_id: string
          warehouse_id: string
          transaction_type: string
          quantity: number
          unit_cost?: number
          reference_type?: string
          reference_id?: string
          batch_number?: string
          expiry_date?: string
          notes?: string
          created_by?: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          product_id?: string
          warehouse_id?: string
          transaction_type?: string
          quantity?: number
          unit_cost?: number
          reference_type?: string
          reference_id?: string
          batch_number?: string
          expiry_date?: string
          notes?: string
          created_by?: string
          created_at?: string
        }
      }
      current_inventory: {
        Row: {
          id: string
          company_id: string
          product_id: string
          warehouse_id: string
          quantity: number
          reserved_quantity: number
          available_quantity: number
          average_cost?: number
          last_updated: string
        }
        Insert: {
          id?: string
          company_id: string
          product_id: string
          warehouse_id: string
          quantity?: number
          reserved_quantity?: number
          average_cost?: number
          last_updated?: string
        }
        Update: {
          id?: string
          company_id?: string
          product_id?: string
          warehouse_id?: string
          quantity?: number
          reserved_quantity?: number
          average_cost?: number
          last_updated?: string
        }
      }
      purchase_orders: {
        Row: {
          id: string
          company_id: string
          po_number: string
          supplier_id?: string
          warehouse_id?: string
          order_date: string
          expected_delivery_date?: string
          status: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          payment_terms?: string
          notes?: string
          created_by?: string
          approved_by?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          po_number: string
          supplier_id?: string
          warehouse_id?: string
          order_date: string
          expected_delivery_date?: string
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          payment_terms?: string
          notes?: string
          created_by?: string
          approved_by?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          po_number?: string
          supplier_id?: string
          warehouse_id?: string
          order_date?: string
          expected_delivery_date?: string
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          payment_terms?: string
          notes?: string
          created_by?: string
          approved_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      purchase_order_items: {
        Row: {
          id: string
          purchase_order_id: string
          product_id?: string
          quantity: number
          unit_price: number
          tax_rate?: number
          tax_amount?: number
          total_amount?: number
          received_quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          purchase_order_id: string
          product_id?: string
          quantity: number
          unit_price: number
          tax_rate?: number
          tax_amount?: number
          total_amount?: number
          received_quantity?: number
          created_at?: string
        }
        Update: {
          id?: string
          purchase_order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          tax_rate?: number
          tax_amount?: number
          total_amount?: number
          received_quantity?: number
          created_at?: string
        }
      }
      sales_orders: {
        Row: {
          id: string
          company_id: string
          so_number: string
          customer_id?: string
          warehouse_id?: string
          order_date: string
          delivery_date?: string
          status: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          payment_terms?: string
          shipping_address?: any
          notes?: string
          created_by?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          so_number: string
          customer_id?: string
          warehouse_id?: string
          order_date: string
          delivery_date?: string
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          payment_terms?: string
          shipping_address?: any
          notes?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          so_number?: string
          customer_id?: string
          warehouse_id?: string
          order_date?: string
          delivery_date?: string
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          payment_terms?: string
          shipping_address?: any
          notes?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      sales_order_items: {
        Row: {
          id: string
          sales_order_id: string
          product_id?: string
          quantity: number
          unit_price: number
          tax_rate?: number
          tax_amount?: number
          total_amount?: number
          shipped_quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          sales_order_id: string
          product_id?: string
          quantity: number
          unit_price: number
          tax_rate?: number
          tax_amount?: number
          total_amount?: number
          shipped_quantity?: number
          created_at?: string
        }
        Update: {
          id?: string
          sales_order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          tax_rate?: number
          tax_amount?: number
          total_amount?: number
          shipped_quantity?: number
          created_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          company_id: string
          invoice_number: string
          invoice_type: string
          customer_id?: string
          supplier_id?: string
          sales_order_id?: string
          purchase_order_id?: string
          invoice_date: string
          due_date?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          paid_amount: number
          balance_amount: number
          status: string
          payment_terms?: string
          notes?: string
          created_by?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          invoice_number: string
          invoice_type: string
          customer_id?: string
          supplier_id?: string
          sales_order_id?: string
          purchase_order_id?: string
          invoice_date: string
          due_date?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          paid_amount?: number
          status?: string
          payment_terms?: string
          notes?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          invoice_number?: string
          invoice_type?: string
          customer_id?: string
          supplier_id?: string
          sales_order_id?: string
          purchase_order_id?: string
          invoice_date?: string
          due_date?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          paid_amount?: number
          status?: string
          payment_terms?: string
          notes?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          product_id?: string
          description?: string
          quantity: number
          unit_price: number
          tax_rate?: number
          tax_amount?: number
          total_amount?: number
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          product_id?: string
          description?: string
          quantity: number
          unit_price: number
          tax_rate?: number
          tax_amount?: number
          total_amount?: number
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          product_id?: string
          description?: string
          quantity?: number
          unit_price?: number
          tax_rate?: number
          tax_amount?: number
          total_amount?: number
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          company_id: string
          payment_number: string
          payment_type: string
          customer_id?: string
          supplier_id?: string
          invoice_id?: string
          amount: number
          payment_method?: string
          payment_date: string
          reference_number?: string
          notes?: string
          status: string
          created_by?: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          payment_number: string
          payment_type: string
          customer_id?: string
          supplier_id?: string
          invoice_id?: string
          amount: number
          payment_method?: string
          payment_date: string
          reference_number?: string
          notes?: string
          status?: string
          created_by?: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          payment_number?: string
          payment_type?: string
          customer_id?: string
          supplier_id?: string
          invoice_id?: string
          amount?: number
          payment_method?: string
          payment_date?: string
          reference_number?: string
          notes?: string
          status?: string
          created_by?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Additional ERP Types
export interface ERPCompany {
  id: string
  name: string
  registration_number?: string
  gst_number?: string
  pan_number?: string
  address?: any
  phone?: string
  email?: string
  website?: string
  logo_url?: string
  subscription_plan: string
  subscription_status: string
  settings: any
  created_at: string
  updated_at: string
}

export interface ERPProduct {
  id: string
  company_id: string
  category_id?: string
  sku: string
  name: string
  description?: string
  brand?: string
  unit_of_measure?: string
  weight?: number
  dimensions?: any
  cost_price?: number
  selling_price?: number
  mrp?: number
  tax_rate?: number
  hsn_code?: string
  barcode?: string
  ean_code?: string
  upc_code?: string
  gtin?: string
  master_product_id?: string
  min_stock_level: number
  max_stock_level?: number
  reorder_point?: number
  lead_time_days?: number
  status: string
  images: any
  attributes: any
  created_at: string
  updated_at: string
}

export interface ERPInventory {
  id: string
  company_id: string
  product_id: string
  warehouse_id: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
  average_cost?: number
  last_updated: string
}

export interface ERPPurchaseOrder {
  id: string
  company_id: string
  po_number: string
  supplier_id?: string
  warehouse_id?: string
  order_date: string
  expected_delivery_date?: string
  status: string
  subtotal?: number
  tax_amount?: number
  total_amount?: number
  payment_terms?: string
  notes?: string
  created_by?: string
  approved_by?: string
  created_at: string
  updated_at: string
  items?: ERPPurchaseOrderItem[]
}

export interface ERPPurchaseOrderItem {
  id: string
  purchase_order_id: string
  product_id?: string
  quantity: number
  unit_price: number
  tax_rate?: number
  tax_amount?: number
  total_amount?: number
  received_quantity: number
  created_at: string
}

export interface ERPSalesOrder {
  id: string
  company_id: string
  so_number: string
  customer_id?: string
  warehouse_id?: string
  order_date: string
  delivery_date?: string
  status: string
  subtotal?: number
  tax_amount?: number
  total_amount?: number
  payment_terms?: string
  shipping_address?: any
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  items?: ERPSalesOrderItem[]
}

export interface ERPSalesOrderItem {
  id: string
  sales_order_id: string
  product_id?: string
  quantity: number
  unit_price: number
  tax_rate?: number
  tax_amount?: number
  total_amount?: number
  shipped_quantity: number
  created_at: string
}

export interface ERPInvoice {
  id: string
  company_id: string
  invoice_number: string
  invoice_type: string
  customer_id?: string
  supplier_id?: string
  sales_order_id?: string
  purchase_order_id?: string
  invoice_date: string
  due_date?: string
  subtotal?: number
  tax_amount?: number
  total_amount?: number
  paid_amount: number
  balance_amount: number
  status: string
  payment_terms?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  items?: ERPInvoiceItem[]
}

export interface ERPInvoiceItem {
  id: string
  invoice_id: string
  product_id?: string
  description?: string
  quantity: number
  unit_price: number
  tax_rate?: number
  tax_amount?: number
  total_amount?: number
  created_at: string
}

export interface ERPPayment {
  id: string
  company_id: string
  payment_number: string
  payment_type: string
  customer_id?: string
  supplier_id?: string
  invoice_id?: string
  amount: number
  payment_method?: string
  payment_date: string
  reference_number?: string
  notes?: string
  status: string
  created_by?: string
  created_at: string
}

export interface ERPSupplier {
  id: string
  company_id: string
  supplier_code?: string
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: any
  gst_number?: string
  pan_number?: string
  payment_terms?: string
  credit_limit?: number
  rating?: number
  status: string
  bank_details?: any
  created_at: string
  updated_at: string
}

export interface ERPCustomer {
  id: string
  company_id: string
  customer_code?: string
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: any
  gst_number?: string
  pan_number?: string
  customer_type: string
  credit_limit?: number
  payment_terms?: string
  status: string
  created_at: string
  updated_at: string
}

export interface ERPWarehouse {
  id: string
  company_id: string
  name: string
  code?: string
  address?: any
  manager_id?: string
  capacity?: number
  current_utilization: number
  status: string
  created_at: string
  updated_at: string
}

export interface ERPEmployee {
  id: string
  company_id: string
  department_id?: string
  employee_code?: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  position?: string
  salary?: number
  hire_date?: string
  status: string
  permissions: any
  address?: any
  emergency_contact?: any
  created_at: string
  updated_at: string
}

export interface ERPDepartment {
  id: string
  company_id: string
  name: string
  description?: string
  manager_id?: string
  budget?: number
  created_at: string
  updated_at: string
}

export interface ERPProductCategory {
  id: string
  company_id: string
  name: string
  description?: string
  parent_id?: string
  image_url?: string
  status: string
  created_at: string
  updated_at: string
}

export interface ERPInventoryTransaction {
  id: string
  company_id: string
  product_id: string
  warehouse_id: string
  transaction_type: string
  quantity: number
  unit_cost?: number
  reference_type?: string
  reference_id?: string
  batch_number?: string
  expiry_date?: string
  notes?: string
  created_by?: string
  created_at: string
}

// Barcode-related interfaces
export interface MasterProduct {
  id: string
  name: string
  brand?: string
  category?: string
  subcategory?: string
  description?: string
  barcode?: string
  ean_code?: string
  upc_code?: string
  gtin?: string
  hsn_code?: string
  unit_of_measure?: string
  weight?: number
  dimensions?: any
  image_url?: string
  manufacturer?: string
  country_of_origin?: string
  status: string
  created_at: string
  updated_at: string
}

export interface StockTakingSession {
  id: string
  company_id: string
  session_name: string
  warehouse_id?: string
  status: string
  started_by?: string
  started_at: string
  completed_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface StockTakingItem {
  id: string
  session_id: string
  product_id: string
  warehouse_id?: string
  system_quantity: number
  counted_quantity: number
  difference: number
  barcode_scanned?: string
  scan_count: number
  notes?: string
  scanned_by?: string
  scanned_at: string
  created_at: string
  updated_at: string
}

export interface BarcodeScanLog {
  id: string
  company_id: string
  barcode: string
  scan_type: string
  product_id?: string
  session_id?: string
  scanned_by?: string
  scan_result: string
  metadata?: any
  scanned_at: string
}