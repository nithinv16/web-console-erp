import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { createBarcodeSearchQuery, logBarcodeScan } from '../utils/barcode';

type SupabaseClient = ReturnType<typeof createClient<Database>>;

/**
 * Search products by barcode across ERP products
 */
export const searchProductByBarcode = async (
  supabase: SupabaseClient,
  barcode: string,
  companyId: string
) => {
  try {
    // Search in ERP products
    const { data: erpProducts, error: erpError } = await supabase
      .from('erp_products')
      .select(`
        id,
        company_id,
        sku,
        name,
        description,
        brand,
        barcode,
        ean_code,
        upc_code,
        gtin,
        unit_of_measure,
        cost_price,
        selling_price,
        mrp,
        status,
        images,
        erp_inventory!inner(
          id,
          quantity,
          available_quantity,
          warehouse_id,
          erp_warehouses(
            id,
            name,
            code
          )
        )
      `)
      .eq('company_id', companyId)
      .or(`barcode.eq.${barcode},ean_code.eq.${barcode},upc_code.eq.${barcode},gtin.eq.${barcode},sku.eq.${barcode}`)
      .eq('status', 'active');

    if (erpError) {
      console.error('Error searching ERP products:', erpError);
      return { products: [], error: erpError };
    }

    // Log the scan
    await logBarcodeScan(supabase, {
      companyId,
      barcode,
      scanType: 'product_lookup',
      productId: erpProducts?.[0]?.id,
      scanResult: erpProducts && erpProducts.length > 0 ? 'success' : 'not_found'
    });

    return { products: erpProducts || [], error: null };
  } catch (error) {
    console.error('Error in searchProductByBarcode:', error);
    return { products: [], error };
  }
};

/**
 * Search products in master products catalog
 */
export const searchMasterProductByBarcode = async (
  supabase: SupabaseClient,
  barcode: string
) => {
  try {
    const { data: masterProducts, error } = await supabase
      .from('master_products')
      .select('*')
      .or(`barcode.eq.${barcode},ean_code.eq.${barcode},upc_code.eq.${barcode},gtin.eq.${barcode}`)
      .eq('status', 'active');

    if (error) {
      console.error('Error searching master products:', error);
      return { products: [], error };
    }

    return { products: masterProducts || [], error: null };
  } catch (error) {
    console.error('Error in searchMasterProductByBarcode:', error);
    return { products: [], error };
  }
};

/**
 * Create a new stock taking session
 */
export const createStockTakingSession = async (
  supabase: SupabaseClient,
  {
    companyId,
    sessionName,
    warehouseId,
    startedBy,
    notes
  }: {
    companyId: string;
    sessionName: string;
    warehouseId?: string;
    startedBy?: string;
    notes?: string;
  }
) => {
  try {
    const { data, error } = await supabase
      .from('stock_taking_sessions')
      .insert({
        company_id: companyId,
        session_name: sessionName,
        warehouse_id: warehouseId,
        started_by: startedBy,
        notes,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating stock taking session:', error);
      return { session: null, error };
    }

    return { session: data, error: null };
  } catch (error) {
    console.error('Error in createStockTakingSession:', error);
    return { session: null, error };
  }
};

/**
 * Add scanned item to stock taking session
 */
export const addStockTakingItem = async (
  supabase: SupabaseClient,
  {
    sessionId,
    productId,
    warehouseId,
    systemQuantity,
    countedQuantity,
    barcodeScanned,
    scannedBy,
    notes
  }: {
    sessionId: string;
    productId: string;
    warehouseId?: string;
    systemQuantity: number;
    countedQuantity: number;
    barcodeScanned?: string;
    scannedBy?: string;
    notes?: string;
  }
) => {
  try {
    // Check if item already exists in session
    const { data: existingItem } = await supabase
      .from('stock_taking_items')
      .select('*')
      .eq('session_id', sessionId)
      .eq('product_id', productId)
      .single();

    if (existingItem) {
      // Update existing item
      const { data, error } = await supabase
        .from('stock_taking_items')
        .update({
          counted_quantity: countedQuantity,
          scan_count: existingItem.scan_count + 1,
          notes,
          scanned_at: new Date().toISOString()
        })
        .eq('id', existingItem.id)
        .select()
        .single();

      return { item: data, error, isUpdate: true };
    } else {
      // Create new item
      const { data, error } = await supabase
        .from('stock_taking_items')
        .insert({
          session_id: sessionId,
          product_id: productId,
          warehouse_id: warehouseId,
          system_quantity: systemQuantity,
          counted_quantity: countedQuantity,
          barcode_scanned: barcodeScanned,
          scan_count: 1,
          scanned_by: scannedBy,
          notes
        })
        .select()
        .single();

      return { item: data, error, isUpdate: false };
    }
  } catch (error) {
    console.error('Error in addStockTakingItem:', error);
    return { item: null, error, isUpdate: false };
  }
};

/**
 * Get stock taking session with items
 */
export const getStockTakingSession = async (
  supabase: SupabaseClient,
  sessionId: string
) => {
  try {
    const { data: session, error: sessionError } = await supabase
      .from('stock_taking_sessions')
      .select(`
        *,
        erp_warehouses(
          id,
          name,
          code
        )
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      return { session: null, items: [], error: sessionError };
    }

    const { data: items, error: itemsError } = await supabase
      .from('stock_taking_items')
      .select(`
        *,
        erp_products(
          id,
          sku,
          name,
          brand,
          unit_of_measure,
          barcode,
          images
        )
      `)
      .eq('session_id', sessionId)
      .order('scanned_at', { ascending: false });

    return {
      session,
      items: items || [],
      error: itemsError
    };
  } catch (error) {
    console.error('Error in getStockTakingSession:', error);
    return { session: null, items: [], error };
  }
};

/**
 * Complete stock taking session
 */
export const completeStockTakingSession = async (
  supabase: SupabaseClient,
  sessionId: string,
  notes?: string
) => {
  try {
    const { data, error } = await supabase
      .from('stock_taking_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        notes
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error completing stock taking session:', error);
      return { session: null, error };
    }

    return { session: data, error: null };
  } catch (error) {
    console.error('Error in completeStockTakingSession:', error);
    return { session: null, error };
  }
};

/**
 * Get barcode scan analytics
 */
export const getBarcodeAnalytics = async (
  supabase: SupabaseClient,
  companyId: string,
  dateFrom?: string,
  dateTo?: string
) => {
  try {
    let query = supabase
      .from('barcode_scan_logs')
      .select('*')
      .eq('company_id', companyId);

    if (dateFrom) {
      query = query.gte('scanned_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('scanned_at', dateTo);
    }

    const { data, error } = await query
      .order('scanned_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Error fetching barcode analytics:', error);
      return { logs: [], error };
    }

    // Calculate analytics
    const analytics = {
      totalScans: data.length,
      successfulScans: data.filter(log => log.scan_result === 'success').length,
      failedScans: data.filter(log => log.scan_result === 'not_found').length,
      errorScans: data.filter(log => log.scan_result === 'error').length,
      scansByType: data.reduce((acc, log) => {
        acc[log.scan_type] = (acc[log.scan_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      scansByDay: data.reduce((acc, log) => {
        const day = new Date(log.scanned_at).toISOString().split('T')[0];
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return { logs: data, analytics, error: null };
  } catch (error) {
    console.error('Error in getBarcodeAnalytics:', error);
    return { logs: [], analytics: null, error };
  }
};