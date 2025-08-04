-- Supply Chain Management Schema
-- This schema supports purchase requisitions, supplier evaluations, quotations, and contract management

-- Purchase Requisitions Table
CREATE TABLE IF NOT EXISTS purchase_requisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    requisition_number VARCHAR(50) NOT NULL,
    requested_by UUID NOT NULL REFERENCES employees(id),
    department_id UUID REFERENCES departments(id),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'converted', 'cancelled')),
    required_date DATE NOT NULL,
    justification TEXT,
    total_estimated_value DECIMAL(15,2) DEFAULT 0,
    approved_by UUID REFERENCES employees(id),
    approved_date TIMESTAMP WITH TIME ZONE,
    approval_comments TEXT,
    converted_to_po_id UUID REFERENCES purchase_orders(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase Requisition Items Table
CREATE TABLE IF NOT EXISTS purchase_requisition_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_requisition_id UUID NOT NULL REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES erp_products(id),
    quantity_requested DECIMAL(10,2) NOT NULL,
    estimated_unit_price DECIMAL(10,2),
    specifications TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier Evaluations Table
CREATE TABLE IF NOT EXISTS supplier_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    evaluation_period_start DATE NOT NULL,
    evaluation_period_end DATE NOT NULL,
    evaluator_id UUID NOT NULL REFERENCES employees(id),
    criteria_scores JSONB NOT NULL, -- {"quality": 4.5, "delivery": 4.0, "price": 3.8, "service": 4.2}
    overall_score DECIMAL(3,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 5),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier Quotations Table
CREATE TABLE IF NOT EXISTS supplier_quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    purchase_requisition_id UUID REFERENCES purchase_requisitions(id),
    quotation_number VARCHAR(50) NOT NULL,
    quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE NOT NULL,
    total_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    terms_and_conditions TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    accepted_by UUID REFERENCES employees(id),
    accepted_date TIMESTAMP WITH TIME ZONE,
    rejected_by UUID REFERENCES employees(id),
    rejected_date TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier Quotation Items Table
CREATE TABLE IF NOT EXISTS supplier_quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_quotation_id UUID NOT NULL REFERENCES supplier_quotations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES erp_products(id),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    lead_time_days INTEGER,
    specifications TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contract Agreements Table
CREATE TABLE IF NOT EXISTS contract_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    contract_number VARCHAR(50) NOT NULL,
    contract_type VARCHAR(20) NOT NULL CHECK (contract_type IN ('purchase', 'service', 'framework', 'blanket')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'expired', 'terminated', 'renewed')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_value DECIMAL(15,2) NOT NULL,
    terms_and_conditions TEXT NOT NULL,
    payment_terms TEXT,
    delivery_terms TEXT,
    activated_by UUID REFERENCES employees(id),
    activated_date TIMESTAMP WITH TIME ZONE,
    terminated_by UUID REFERENCES employees(id),
    terminated_date TIMESTAMP WITH TIME ZONE,
    termination_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor Performance Metrics Table
CREATE TABLE IF NOT EXISTS vendor_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    on_time_delivery_rate DECIMAL(5,2), -- Percentage
    quality_rating DECIMAL(3,2), -- 1-5 scale
    cost_competitiveness DECIMAL(3,2), -- 1-5 scale
    responsiveness_rating DECIMAL(3,2), -- 1-5 scale
    total_orders INTEGER DEFAULT 0,
    total_value DECIMAL(15,2) DEFAULT 0,
    defect_rate DECIMAL(5,2), -- Percentage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Procurement Categories Table
CREATE TABLE IF NOT EXISTS procurement_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES procurement_categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier Categories Junction Table
CREATE TABLE IF NOT EXISTS supplier_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    procurement_category_id UUID NOT NULL REFERENCES procurement_categories(id) ON DELETE CASCADE,
    is_preferred BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(supplier_id, procurement_category_id)
);

-- Request for Quotation (RFQ) Table
CREATE TABLE IF NOT EXISTS request_for_quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    rfq_number VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    submission_deadline DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'closed', 'cancelled')),
    created_by UUID NOT NULL REFERENCES employees(id),
    terms_and_conditions TEXT,
    evaluation_criteria JSONB, -- {"price": 40, "quality": 30, "delivery": 20, "service": 10}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RFQ Items Table
CREATE TABLE IF NOT EXISTS rfq_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id UUID NOT NULL REFERENCES request_for_quotations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES erp_products(id),
    item_description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_of_measure VARCHAR(20),
    specifications TEXT,
    delivery_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RFQ Suppliers (Invited suppliers for RFQ)
CREATE TABLE IF NOT EXISTS rfq_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id UUID NOT NULL REFERENCES request_for_quotations(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    invitation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    response_status VARCHAR(20) DEFAULT 'pending' CHECK (response_status IN ('pending', 'responded', 'declined', 'no_response')),
    response_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(rfq_id, supplier_id)
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_company_id ON purchase_requisitions(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_status ON purchase_requisitions(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_requested_by ON purchase_requisitions(requested_by);
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_department ON purchase_requisitions(department_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_created_at ON purchase_requisitions(created_at);

CREATE INDEX IF NOT EXISTS idx_purchase_requisition_items_requisition_id ON purchase_requisition_items(purchase_requisition_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requisition_items_product_id ON purchase_requisition_items(product_id);

CREATE INDEX IF NOT EXISTS idx_supplier_evaluations_company_id ON supplier_evaluations(company_id);
CREATE INDEX IF NOT EXISTS idx_supplier_evaluations_supplier_id ON supplier_evaluations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_evaluations_date ON supplier_evaluations(evaluation_date);

CREATE INDEX IF NOT EXISTS idx_supplier_quotations_company_id ON supplier_quotations(company_id);
CREATE INDEX IF NOT EXISTS idx_supplier_quotations_supplier_id ON supplier_quotations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_quotations_status ON supplier_quotations(status);
CREATE INDEX IF NOT EXISTS idx_supplier_quotations_valid_until ON supplier_quotations(valid_until);

CREATE INDEX IF NOT EXISTS idx_supplier_quotation_items_quotation_id ON supplier_quotation_items(supplier_quotation_id);
CREATE INDEX IF NOT EXISTS idx_supplier_quotation_items_product_id ON supplier_quotation_items(product_id);

CREATE INDEX IF NOT EXISTS idx_contract_agreements_company_id ON contract_agreements(company_id);
CREATE INDEX IF NOT EXISTS idx_contract_agreements_supplier_id ON contract_agreements(supplier_id);
CREATE INDEX IF NOT EXISTS idx_contract_agreements_status ON contract_agreements(status);
CREATE INDEX IF NOT EXISTS idx_contract_agreements_end_date ON contract_agreements(end_date);

CREATE INDEX IF NOT EXISTS idx_vendor_performance_company_id ON vendor_performance_metrics(company_id);
CREATE INDEX IF NOT EXISTS idx_vendor_performance_supplier_id ON vendor_performance_metrics(supplier_id);
CREATE INDEX IF NOT EXISTS idx_vendor_performance_date ON vendor_performance_metrics(metric_date);

CREATE INDEX IF NOT EXISTS idx_procurement_categories_company_id ON procurement_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_procurement_categories_parent ON procurement_categories(parent_category_id);

CREATE INDEX IF NOT EXISTS idx_supplier_categories_supplier_id ON supplier_categories(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_categories_category_id ON supplier_categories(procurement_category_id);

CREATE INDEX IF NOT EXISTS idx_rfq_company_id ON request_for_quotations(company_id);
CREATE INDEX IF NOT EXISTS idx_rfq_status ON request_for_quotations(status);
CREATE INDEX IF NOT EXISTS idx_rfq_deadline ON request_for_quotations(submission_deadline);

CREATE INDEX IF NOT EXISTS idx_rfq_items_rfq_id ON rfq_items(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_items_product_id ON rfq_items(product_id);

CREATE INDEX IF NOT EXISTS idx_rfq_suppliers_rfq_id ON rfq_suppliers(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_suppliers_supplier_id ON rfq_suppliers(supplier_id);

-- Enable Row Level Security
ALTER TABLE purchase_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requisition_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_for_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_suppliers ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Purchase Requisitions Policies
CREATE POLICY "Users can view company purchase requisitions" ON purchase_requisitions
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert company purchase requisitions" ON purchase_requisitions
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update company purchase requisitions" ON purchase_requisitions
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete company purchase requisitions" ON purchase_requisitions
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

-- Purchase Requisition Items Policies
CREATE POLICY "Users can view company purchase requisition items" ON purchase_requisition_items
    FOR SELECT USING (
        purchase_requisition_id IN (
            SELECT id FROM purchase_requisitions 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert company purchase requisition items" ON purchase_requisition_items
    FOR INSERT WITH CHECK (
        purchase_requisition_id IN (
            SELECT id FROM purchase_requisitions 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update company purchase requisition items" ON purchase_requisition_items
    FOR UPDATE USING (
        purchase_requisition_id IN (
            SELECT id FROM purchase_requisitions 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete company purchase requisition items" ON purchase_requisition_items
    FOR DELETE USING (
        purchase_requisition_id IN (
            SELECT id FROM purchase_requisitions 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Supplier Evaluations Policies
CREATE POLICY "Users can view company supplier evaluations" ON supplier_evaluations
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert company supplier evaluations" ON supplier_evaluations
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update company supplier evaluations" ON supplier_evaluations
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete company supplier evaluations" ON supplier_evaluations
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

-- Supplier Quotations Policies
CREATE POLICY "Users can view company supplier quotations" ON supplier_quotations
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert company supplier quotations" ON supplier_quotations
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update company supplier quotations" ON supplier_quotations
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete company supplier quotations" ON supplier_quotations
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

-- Supplier Quotation Items Policies
CREATE POLICY "Users can view company supplier quotation items" ON supplier_quotation_items
    FOR SELECT USING (
        supplier_quotation_id IN (
            SELECT id FROM supplier_quotations 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert company supplier quotation items" ON supplier_quotation_items
    FOR INSERT WITH CHECK (
        supplier_quotation_id IN (
            SELECT id FROM supplier_quotations 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update company supplier quotation items" ON supplier_quotation_items
    FOR UPDATE USING (
        supplier_quotation_id IN (
            SELECT id FROM supplier_quotations 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete company supplier quotation items" ON supplier_quotation_items
    FOR DELETE USING (
        supplier_quotation_id IN (
            SELECT id FROM supplier_quotations 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Contract Agreements Policies
CREATE POLICY "Users can view company contract agreements" ON contract_agreements
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert company contract agreements" ON contract_agreements
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update company contract agreements" ON contract_agreements
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete company contract agreements" ON contract_agreements
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

-- Vendor Performance Metrics Policies
CREATE POLICY "Users can view company vendor performance metrics" ON vendor_performance_metrics
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert company vendor performance metrics" ON vendor_performance_metrics
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update company vendor performance metrics" ON vendor_performance_metrics
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete company vendor performance metrics" ON vendor_performance_metrics
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

-- Procurement Categories Policies
CREATE POLICY "Users can view company procurement categories" ON procurement_categories
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert company procurement categories" ON procurement_categories
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update company procurement categories" ON procurement_categories
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete company procurement categories" ON procurement_categories
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

-- Supplier Categories Policies
CREATE POLICY "Users can view supplier categories" ON supplier_categories
    FOR SELECT USING (
        supplier_id IN (
            SELECT id FROM suppliers 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert supplier categories" ON supplier_categories
    FOR INSERT WITH CHECK (
        supplier_id IN (
            SELECT id FROM suppliers 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update supplier categories" ON supplier_categories
    FOR UPDATE USING (
        supplier_id IN (
            SELECT id FROM suppliers 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete supplier categories" ON supplier_categories
    FOR DELETE USING (
        supplier_id IN (
            SELECT id FROM suppliers 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Request for Quotations Policies
CREATE POLICY "Users can view company RFQs" ON request_for_quotations
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert company RFQs" ON request_for_quotations
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update company RFQs" ON request_for_quotations
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete company RFQs" ON request_for_quotations
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

-- RFQ Items Policies
CREATE POLICY "Users can view company RFQ items" ON rfq_items
    FOR SELECT USING (
        rfq_id IN (
            SELECT id FROM request_for_quotations 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert company RFQ items" ON rfq_items
    FOR INSERT WITH CHECK (
        rfq_id IN (
            SELECT id FROM request_for_quotations 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update company RFQ items" ON rfq_items
    FOR UPDATE USING (
        rfq_id IN (
            SELECT id FROM request_for_quotations 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete company RFQ items" ON rfq_items
    FOR DELETE USING (
        rfq_id IN (
            SELECT id FROM request_for_quotations 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

-- RFQ Suppliers Policies
CREATE POLICY "Users can view company RFQ suppliers" ON rfq_suppliers
    FOR SELECT USING (
        rfq_id IN (
            SELECT id FROM request_for_quotations 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert company RFQ suppliers" ON rfq_suppliers
    FOR INSERT WITH CHECK (
        rfq_id IN (
            SELECT id FROM request_for_quotations 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update company RFQ suppliers" ON rfq_suppliers
    FOR UPDATE USING (
        rfq_id IN (
            SELECT id FROM request_for_quotations 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete company RFQ suppliers" ON rfq_suppliers
    FOR DELETE USING (
        rfq_id IN (
            SELECT id FROM request_for_quotations 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Create Functions for Supply Chain Operations

-- Function to calculate supplier performance score
CREATE OR REPLACE FUNCTION calculate_supplier_performance_score(
    p_supplier_id UUID,
    p_period_months INTEGER DEFAULT 12
) RETURNS DECIMAL(3,2) AS $$
DECLARE
    v_score DECIMAL(3,2) := 0;
    v_delivery_score DECIMAL(3,2);
    v_quality_score DECIMAL(3,2);
    v_evaluation_score DECIMAL(3,2);
BEGIN
    -- Calculate on-time delivery score (40% weight)
    SELECT COALESCE(AVG(
        CASE 
            WHEN actual_delivery_date <= expected_delivery_date THEN 5.0
            WHEN actual_delivery_date <= expected_delivery_date + INTERVAL '3 days' THEN 4.0
            WHEN actual_delivery_date <= expected_delivery_date + INTERVAL '7 days' THEN 3.0
            WHEN actual_delivery_date <= expected_delivery_date + INTERVAL '14 days' THEN 2.0
            ELSE 1.0
        END
    ), 0) INTO v_delivery_score
    FROM purchase_orders
    WHERE supplier_id = p_supplier_id
      AND status = 'delivered'
      AND order_date >= CURRENT_DATE - INTERVAL '1 month' * p_period_months;

    -- Calculate quality score from evaluations (60% weight)
    SELECT COALESCE(AVG(overall_score), 0) INTO v_evaluation_score
    FROM supplier_evaluations
    WHERE supplier_id = p_supplier_id
      AND evaluation_date >= CURRENT_DATE - INTERVAL '1 month' * p_period_months;

    -- Combine scores
    v_score := (v_delivery_score * 0.4) + (v_evaluation_score * 0.6);

    RETURN LEAST(5.0, GREATEST(0.0, v_score));
END;
$$ LANGUAGE plpgsql;

-- Function to check if quotation is still valid
CREATE OR REPLACE FUNCTION is_quotation_valid(p_quotation_id UUID) 
RETURNS BOOLEAN AS $$
DECLARE
    v_valid_until DATE;
    v_status VARCHAR(20);
BEGIN
    SELECT valid_until, status INTO v_valid_until, v_status
    FROM supplier_quotations
    WHERE id = p_quotation_id;

    IF v_status != 'pending' THEN
        RETURN FALSE;
    END IF;

    RETURN v_valid_until >= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-expire quotations
CREATE OR REPLACE FUNCTION expire_old_quotations()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE supplier_quotations
    SET status = 'expired',
        updated_at = NOW()
    WHERE status = 'pending'
      AND valid_until < CURRENT_DATE;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get procurement spend by category
CREATE OR REPLACE FUNCTION get_procurement_spend_by_category(
    p_company_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
) RETURNS TABLE (
    category_name VARCHAR(100),
    total_spend DECIMAL(15,2),
    order_count INTEGER,
    avg_order_value DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(pc.name, 'Uncategorized') as category_name,
        SUM(po.total_amount) as total_spend,
        COUNT(po.id)::INTEGER as order_count,
        AVG(po.total_amount) as avg_order_value
    FROM purchase_orders po
    LEFT JOIN suppliers s ON po.supplier_id = s.id
    LEFT JOIN supplier_categories sc ON s.id = sc.supplier_id
    LEFT JOIN procurement_categories pc ON sc.procurement_category_id = pc.id
    WHERE po.company_id = p_company_id
      AND (p_start_date IS NULL OR po.order_date >= p_start_date)
      AND (p_end_date IS NULL OR po.order_date <= p_end_date)
      AND po.status IN ('confirmed', 'delivered')
    GROUP BY pc.name
    ORDER BY total_spend DESC;
END;
$$ LANGUAGE plpgsql;

-- Insert default procurement categories
INSERT INTO procurement_categories (company_id, name, description) 
SELECT 
    c.id,
    category.name,
    category.description
FROM companies c
CROSS JOIN (
    VALUES 
        ('Raw Materials', 'Basic materials used in production'),
        ('Equipment & Machinery', 'Production equipment and machinery'),
        ('Office Supplies', 'General office and administrative supplies'),
        ('IT & Technology', 'Information technology equipment and services'),
        ('Professional Services', 'Consulting, legal, and other professional services'),
        ('Maintenance & Repair', 'Maintenance, repair, and operations supplies'),
        ('Packaging Materials', 'Product packaging and shipping materials'),
        ('Utilities', 'Electricity, water, gas, and other utilities'),
        ('Transportation', 'Shipping, logistics, and transportation services'),
        ('Marketing & Advertising', 'Marketing materials and advertising services')
) AS category(name, description)
ON CONFLICT DO NOTHING;

-- Create trigger to update supplier rating when evaluation is added/updated
CREATE OR REPLACE FUNCTION update_supplier_rating_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Update supplier's average rating
    UPDATE suppliers
    SET rating = (
        SELECT AVG(overall_score)
        FROM supplier_evaluations
        WHERE supplier_id = COALESCE(NEW.supplier_id, OLD.supplier_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.supplier_id, OLD.supplier_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_supplier_rating
    AFTER INSERT OR UPDATE OR DELETE ON supplier_evaluations
    FOR EACH ROW
    EXECUTE FUNCTION update_supplier_rating_trigger();

-- Create trigger to auto-update quotation total when items change
CREATE OR REPLACE FUNCTION update_quotation_total_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Update quotation total
    UPDATE supplier_quotations
    SET total_value = (
        SELECT COALESCE(SUM(total_price), 0)
        FROM supplier_quotation_items
        WHERE supplier_quotation_id = COALESCE(NEW.supplier_quotation_id, OLD.supplier_quotation_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.supplier_quotation_id, OLD.supplier_quotation_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quotation_total
    AFTER INSERT OR UPDATE OR DELETE ON supplier_quotation_items
    FOR EACH ROW
    EXECUTE FUNCTION update_quotation_total_trigger();

-- Create trigger to auto-update requisition total when items change
CREATE OR REPLACE FUNCTION update_requisition_total_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Update requisition total
    UPDATE purchase_requisitions
    SET total_estimated_value = (
        SELECT COALESCE(SUM(quantity_requested * COALESCE(estimated_unit_price, 0)), 0)
        FROM purchase_requisition_items
        WHERE purchase_requisition_id = COALESCE(NEW.purchase_requisition_id, OLD.purchase_requisition_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.purchase_requisition_id, OLD.purchase_requisition_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_requisition_total
    AFTER INSERT OR UPDATE OR DELETE ON purchase_requisition_items
    FOR EACH ROW
    EXECUTE FUNCTION update_requisition_total_trigger();