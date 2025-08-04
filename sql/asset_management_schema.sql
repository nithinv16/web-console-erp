-- Asset Management Schema
-- This schema supports fixed assets, depreciation, maintenance, transfers, and disposal tracking

-- Asset Categories Table (for standardization)
CREATE TABLE IF NOT EXISTS asset_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    depreciation_rate DECIMAL(5,2), -- Default depreciation rate for category
    useful_life_years INTEGER, -- Default useful life for category
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assets Table
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    asset_code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    location VARCHAR(200) NOT NULL,
    department VARCHAR(100),
    assigned_to UUID REFERENCES employees(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'disposed', 'under_maintenance', 'lost')),
    condition VARCHAR(20) NOT NULL DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
    purchase_date DATE NOT NULL,
    purchase_cost DECIMAL(15,2) NOT NULL CHECK (purchase_cost >= 0),
    current_value DECIMAL(15,2) NOT NULL CHECK (current_value >= 0),
    depreciation_method VARCHAR(30) NOT NULL DEFAULT 'straight_line' CHECK (depreciation_method IN ('straight_line', 'declining_balance', 'sum_of_years', 'units_of_production')),
    useful_life_years INTEGER NOT NULL CHECK (useful_life_years > 0),
    salvage_value DECIMAL(15,2) DEFAULT 0 CHECK (salvage_value >= 0),
    warranty_expiry DATE,
    insurance_details TEXT,
    serial_number VARCHAR(100),
    model VARCHAR(100),
    manufacturer VARCHAR(100),
    supplier_id UUID REFERENCES suppliers(id),
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, asset_code)
);

-- Asset Transfers Table
CREATE TABLE IF NOT EXISTS asset_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    from_location VARCHAR(200) NOT NULL,
    to_location VARCHAR(200) NOT NULL,
    from_employee UUID REFERENCES employees(id),
    to_employee UUID REFERENCES employees(id),
    transfer_date DATE NOT NULL,
    reason TEXT NOT NULL,
    approved_by UUID REFERENCES employees(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'rejected')),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset Maintenance Table
CREATE TABLE IF NOT EXISTS asset_maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(20) NOT NULL CHECK (maintenance_type IN ('preventive', 'corrective', 'emergency', 'upgrade')),
    description TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    cost DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
    performed_by UUID REFERENCES employees(id),
    vendor_id UUID REFERENCES suppliers(id),
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    downtime_hours DECIMAL(8,2) CHECK (downtime_hours >= 0),
    parts_used TEXT[], -- Array of part descriptions
    notes TEXT,
    next_maintenance_date DATE,
    created_by UUID NOT NULL REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset Depreciation Table
CREATE TABLE IF NOT EXISTS asset_depreciation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    depreciation_date DATE NOT NULL,
    opening_value DECIMAL(15,2) NOT NULL,
    depreciation_amount DECIMAL(15,2) NOT NULL,
    accumulated_depreciation DECIMAL(15,2) NOT NULL,
    closing_value DECIMAL(15,2) NOT NULL,
    depreciation_rate DECIMAL(8,4) NOT NULL,
    method VARCHAR(30) NOT NULL,
    financial_year VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(asset_id, depreciation_date)
);

-- Asset Disposals Table
CREATE TABLE IF NOT EXISTS asset_disposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    disposal_date DATE NOT NULL,
    disposal_method VARCHAR(20) NOT NULL CHECK (disposal_method IN ('sale', 'scrap', 'donation', 'trade_in', 'write_off')),
    disposal_value DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (disposal_value >= 0),
    buyer_details TEXT,
    reason TEXT NOT NULL,
    approval_required BOOLEAN DEFAULT true,
    approved_by UUID REFERENCES employees(id),
    approval_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'rejected')),
    gain_loss_amount DECIMAL(15,2) NOT NULL DEFAULT 0, -- Calculated: disposal_value - current_value
    notes TEXT,
    created_by UUID NOT NULL REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset Documents Table
CREATE TABLE IF NOT EXISTS asset_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- 'purchase_invoice', 'warranty', 'insurance', 'manual', 'certificate', 'other'
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    uploaded_by UUID NOT NULL REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset Audit Trail Table
CREATE TABLE IF NOT EXISTS asset_audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'transferred', 'maintenance', 'disposed'
    field_changed VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    changed_by UUID NOT NULL REFERENCES employees(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Asset Insurance Table
CREATE TABLE IF NOT EXISTS asset_insurance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    insurance_company VARCHAR(200) NOT NULL,
    policy_number VARCHAR(100) NOT NULL,
    coverage_amount DECIMAL(15,2) NOT NULL,
    premium_amount DECIMAL(12,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset Locations Table (for standardization)
CREATE TABLE IF NOT EXISTS asset_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    location_code VARCHAR(50) NOT NULL,
    location_name VARCHAR(200) NOT NULL,
    address TEXT,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, location_code)
);

-- Asset Barcode/QR Code Table
CREATE TABLE IF NOT EXISTS asset_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    code_type VARCHAR(20) NOT NULL CHECK (code_type IN ('barcode', 'qr_code', 'rfid')),
    code_value VARCHAR(200) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(code_type, code_value)
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_assets_company_id ON assets(company_id);
CREATE INDEX IF NOT EXISTS idx_assets_asset_code ON assets(asset_code);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_location ON assets(location);
CREATE INDEX IF NOT EXISTS idx_assets_assigned_to ON assets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assets_purchase_date ON assets(purchase_date);
CREATE INDEX IF NOT EXISTS idx_assets_next_maintenance ON assets(next_maintenance_date);
CREATE INDEX IF NOT EXISTS idx_assets_supplier ON assets(supplier_id);

CREATE INDEX IF NOT EXISTS idx_asset_transfers_asset_id ON asset_transfers(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_transfers_transfer_date ON asset_transfers(transfer_date);
CREATE INDEX IF NOT EXISTS idx_asset_transfers_status ON asset_transfers(status);
CREATE INDEX IF NOT EXISTS idx_asset_transfers_created_by ON asset_transfers(created_by);

CREATE INDEX IF NOT EXISTS idx_asset_maintenance_asset_id ON asset_maintenance(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_scheduled_date ON asset_maintenance(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_status ON asset_maintenance(status);
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_type ON asset_maintenance(maintenance_type);
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_priority ON asset_maintenance(priority);
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_vendor ON asset_maintenance(vendor_id);

CREATE INDEX IF NOT EXISTS idx_asset_depreciation_asset_id ON asset_depreciation(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_depreciation_date ON asset_depreciation(depreciation_date);
CREATE INDEX IF NOT EXISTS idx_asset_depreciation_financial_year ON asset_depreciation(financial_year);

CREATE INDEX IF NOT EXISTS idx_asset_disposals_asset_id ON asset_disposals(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_disposals_disposal_date ON asset_disposals(disposal_date);
CREATE INDEX IF NOT EXISTS idx_asset_disposals_status ON asset_disposals(status);
CREATE INDEX IF NOT EXISTS idx_asset_disposals_method ON asset_disposals(disposal_method);

CREATE INDEX IF NOT EXISTS idx_asset_documents_asset_id ON asset_documents(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_documents_type ON asset_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_asset_audit_trail_asset_id ON asset_audit_trail(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_audit_trail_changed_at ON asset_audit_trail(changed_at);
CREATE INDEX IF NOT EXISTS idx_asset_audit_trail_action ON asset_audit_trail(action);

CREATE INDEX IF NOT EXISTS idx_asset_insurance_asset_id ON asset_insurance(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_insurance_end_date ON asset_insurance(end_date);
CREATE INDEX IF NOT EXISTS idx_asset_insurance_status ON asset_insurance(status);

CREATE INDEX IF NOT EXISTS idx_asset_locations_company_id ON asset_locations(company_id);
CREATE INDEX IF NOT EXISTS idx_asset_locations_code ON asset_locations(location_code);

CREATE INDEX IF NOT EXISTS idx_asset_codes_asset_id ON asset_codes(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_codes_value ON asset_codes(code_value);
CREATE INDEX IF NOT EXISTS idx_asset_codes_type ON asset_codes(code_type);

-- Enable Row Level Security
ALTER TABLE asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_depreciation ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_disposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Asset Categories Policies (global, no company restriction)
CREATE POLICY "Anyone can view asset categories" ON asset_categories
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage asset categories" ON asset_categories
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Assets Policies
CREATE POLICY "Users can view company assets" ON assets
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert company assets" ON assets
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update company assets" ON assets
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete company assets" ON assets
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

-- Asset Transfers Policies
CREATE POLICY "Users can view asset transfers" ON asset_transfers
    FOR SELECT USING (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert asset transfers" ON asset_transfers
    FOR INSERT WITH CHECK (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update asset transfers" ON asset_transfers
    FOR UPDATE USING (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete asset transfers" ON asset_transfers
    FOR DELETE USING (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Asset Maintenance Policies
CREATE POLICY "Users can view asset maintenance" ON asset_maintenance
    FOR SELECT USING (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert asset maintenance" ON asset_maintenance
    FOR INSERT WITH CHECK (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update asset maintenance" ON asset_maintenance
    FOR UPDATE USING (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete asset maintenance" ON asset_maintenance
    FOR DELETE USING (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Asset Depreciation Policies
CREATE POLICY "Users can view asset depreciation" ON asset_depreciation
    FOR SELECT USING (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert asset depreciation" ON asset_depreciation
    FOR INSERT WITH CHECK (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update asset depreciation" ON asset_depreciation
    FOR UPDATE USING (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete asset depreciation" ON asset_depreciation
    FOR DELETE USING (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Asset Disposals Policies
CREATE POLICY "Users can view asset disposals" ON asset_disposals
    FOR SELECT USING (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert asset disposals" ON asset_disposals
    FOR INSERT WITH CHECK (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update asset disposals" ON asset_disposals
    FOR UPDATE USING (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete asset disposals" ON asset_disposals
    FOR DELETE USING (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Asset Documents Policies
CREATE POLICY "Users can view asset documents" ON asset_documents
    FOR SELECT USING (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert asset documents" ON asset_documents
    FOR INSERT WITH CHECK (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update asset documents" ON asset_documents
    FOR UPDATE USING (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete asset documents" ON asset_documents
    FOR DELETE USING (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Asset Audit Trail Policies
CREATE POLICY "Users can view asset audit trail" ON asset_audit_trail
    FOR SELECT USING (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert asset audit trail" ON asset_audit_trail
    FOR INSERT WITH CHECK (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Asset Insurance Policies
CREATE POLICY "Users can view asset insurance" ON asset_insurance
    FOR SELECT USING (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert asset insurance" ON asset_insurance
    FOR INSERT WITH CHECK (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update asset insurance" ON asset_insurance
    FOR UPDATE USING (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete asset insurance" ON asset_insurance
    FOR DELETE USING (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Asset Locations Policies
CREATE POLICY "Users can view company asset locations" ON asset_locations
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert company asset locations" ON asset_locations
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update company asset locations" ON asset_locations
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete company asset locations" ON asset_locations
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

-- Asset Codes Policies
CREATE POLICY "Users can view asset codes" ON asset_codes
    FOR SELECT USING (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert asset codes" ON asset_codes
    FOR INSERT WITH CHECK (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update asset codes" ON asset_codes
    FOR UPDATE USING (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete asset codes" ON asset_codes
    FOR DELETE USING (
        asset_id IN (
            SELECT id FROM assets 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Create Functions for Asset Management

-- Function to calculate asset depreciation
CREATE OR REPLACE FUNCTION calculate_asset_depreciation(
    p_asset_id UUID,
    p_depreciation_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    opening_value DECIMAL(15,2),
    depreciation_amount DECIMAL(15,2),
    accumulated_depreciation DECIMAL(15,2),
    closing_value DECIMAL(15,2),
    depreciation_rate DECIMAL(8,4)
) AS $$
DECLARE
    v_asset assets%ROWTYPE;
    v_last_depreciation asset_depreciation%ROWTYPE;
    v_opening_value DECIMAL(15,2);
    v_depreciation_amount DECIMAL(15,2);
    v_accumulated_depreciation DECIMAL(15,2);
    v_closing_value DECIMAL(15,2);
    v_depreciation_rate DECIMAL(8,4);
    v_depreciable_amount DECIMAL(15,2);
    v_months_since_purchase INTEGER;
BEGIN
    -- Get asset details
    SELECT * INTO v_asset FROM assets WHERE id = p_asset_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Asset not found';
    END IF;

    -- Get last depreciation entry
    SELECT * INTO v_last_depreciation 
    FROM asset_depreciation 
    WHERE asset_id = p_asset_id 
    ORDER BY depreciation_date DESC 
    LIMIT 1;

    -- Calculate opening value
    v_opening_value := COALESCE(v_last_depreciation.closing_value, v_asset.purchase_cost);
    v_accumulated_depreciation := COALESCE(v_last_depreciation.accumulated_depreciation, 0);
    
    -- Calculate depreciable amount
    v_depreciable_amount := v_asset.purchase_cost - v_asset.salvage_value;
    
    -- Calculate months since purchase
    v_months_since_purchase := EXTRACT(YEAR FROM AGE(p_depreciation_date, v_asset.purchase_date)) * 12 + 
                              EXTRACT(MONTH FROM AGE(p_depreciation_date, v_asset.purchase_date));

    -- Calculate depreciation based on method
    CASE v_asset.depreciation_method
        WHEN 'straight_line' THEN
            v_depreciation_rate := (1.0 / v_asset.useful_life_years) * 100;
            v_depreciation_amount := v_depreciable_amount / v_asset.useful_life_years / 12; -- Monthly
            
        WHEN 'declining_balance' THEN
            v_depreciation_rate := (2.0 / v_asset.useful_life_years) * 100;
            v_depreciation_amount := (v_opening_value * v_depreciation_rate / 100) / 12; -- Monthly
            
        WHEN 'sum_of_years' THEN
            DECLARE
                v_sum_of_years INTEGER;
                v_remaining_years DECIMAL;
            BEGIN
                v_sum_of_years := (v_asset.useful_life_years * (v_asset.useful_life_years + 1)) / 2;
                v_remaining_years := v_asset.useful_life_years - (v_months_since_purchase / 12.0);
                v_depreciation_rate := (v_remaining_years / v_sum_of_years) * 100;
                v_depreciation_amount := (v_depreciable_amount * v_remaining_years / v_sum_of_years) / 12;
            END;
            
        ELSE -- Default to straight line
            v_depreciation_rate := (1.0 / v_asset.useful_life_years) * 100;
            v_depreciation_amount := v_depreciable_amount / v_asset.useful_life_years / 12;
    END CASE;

    -- Ensure depreciation doesn't exceed depreciable amount
    IF v_accumulated_depreciation + v_depreciation_amount > v_depreciable_amount THEN
        v_depreciation_amount := v_depreciable_amount - v_accumulated_depreciation;
    END IF;

    -- Ensure depreciation is not negative
    v_depreciation_amount := GREATEST(0, v_depreciation_amount);
    
    -- Calculate new accumulated depreciation and closing value
    v_accumulated_depreciation := v_accumulated_depreciation + v_depreciation_amount;
    v_closing_value := GREATEST(v_asset.purchase_cost - v_accumulated_depreciation, v_asset.salvage_value);

    RETURN QUERY SELECT 
        v_opening_value,
        v_depreciation_amount,
        v_accumulated_depreciation,
        v_closing_value,
        v_depreciation_rate;
END;
$$ LANGUAGE plpgsql;

-- Function to get asset utilization rate
CREATE OR REPLACE FUNCTION get_asset_utilization_rate(
    p_asset_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_total_days INTEGER;
    v_maintenance_days INTEGER;
    v_utilization_rate DECIMAL(5,2);
BEGIN
    -- Calculate total days in period
    v_total_days := p_end_date - p_start_date + 1;
    
    -- Calculate days under maintenance
    SELECT COALESCE(SUM(
        CASE 
            WHEN completed_date IS NOT NULL THEN 
                LEAST(completed_date, p_end_date) - GREATEST(scheduled_date, p_start_date) + 1
            ELSE 
                p_end_date - GREATEST(scheduled_date, p_start_date) + 1
        END
    ), 0) INTO v_maintenance_days
    FROM asset_maintenance
    WHERE asset_id = p_asset_id
      AND status IN ('in_progress', 'completed')
      AND scheduled_date <= p_end_date
      AND (completed_date IS NULL OR completed_date >= p_start_date);
    
    -- Calculate utilization rate
    v_utilization_rate := ((v_total_days - v_maintenance_days)::DECIMAL / v_total_days) * 100;
    
    RETURN GREATEST(0, LEAST(100, v_utilization_rate));
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly depreciation trend
CREATE OR REPLACE FUNCTION get_monthly_depreciation_trend(p_company_id UUID)
RETURNS TABLE (
    month TEXT,
    amount DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(ad.depreciation_date, 'YYYY-MM') as month,
        SUM(ad.depreciation_amount) as amount
    FROM asset_depreciation ad
    JOIN assets a ON ad.asset_id = a.id
    WHERE a.company_id = p_company_id
      AND ad.depreciation_date >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY TO_CHAR(ad.depreciation_date, 'YYYY-MM')
    ORDER BY month;
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly maintenance trend
CREATE OR REPLACE FUNCTION get_monthly_maintenance_trend(p_company_id UUID)
RETURNS TABLE (
    month TEXT,
    cost DECIMAL(12,2),
    count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(am.scheduled_date, 'YYYY-MM') as month,
        SUM(am.cost) as cost,
        COUNT(*)::INTEGER as count
    FROM asset_maintenance am
    JOIN assets a ON am.asset_id = a.id
    WHERE a.company_id = p_company_id
      AND am.scheduled_date >= CURRENT_DATE - INTERVAL '12 months'
      AND am.status = 'completed'
    GROUP BY TO_CHAR(am.scheduled_date, 'YYYY-MM')
    ORDER BY month;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for audit trail
CREATE OR REPLACE FUNCTION asset_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_action VARCHAR(50);
    v_user_id UUID;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Determine action
    IF TG_OP = 'INSERT' THEN
        v_action := 'created';
        INSERT INTO asset_audit_trail (asset_id, action, new_value, changed_by)
        VALUES (NEW.id, v_action, row_to_json(NEW)::TEXT, v_user_id);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'updated';
        -- Log specific field changes
        IF OLD.status != NEW.status THEN
            INSERT INTO asset_audit_trail (asset_id, action, field_changed, old_value, new_value, changed_by)
            VALUES (NEW.id, v_action, 'status', OLD.status, NEW.status, v_user_id);
        END IF;
        IF OLD.location != NEW.location THEN
            INSERT INTO asset_audit_trail (asset_id, action, field_changed, old_value, new_value, changed_by)
            VALUES (NEW.id, v_action, 'location', OLD.location, NEW.location, v_user_id);
        END IF;
        IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
            INSERT INTO asset_audit_trail (asset_id, action, field_changed, old_value, new_value, changed_by)
            VALUES (NEW.id, v_action, 'assigned_to', OLD.assigned_to::TEXT, NEW.assigned_to::TEXT, v_user_id);
        END IF;
        IF OLD.current_value != NEW.current_value THEN
            INSERT INTO asset_audit_trail (asset_id, action, field_changed, old_value, new_value, changed_by)
            VALUES (NEW.id, v_action, 'current_value', OLD.current_value::TEXT, NEW.current_value::TEXT, v_user_id);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'deleted';
        INSERT INTO asset_audit_trail (asset_id, action, old_value, changed_by)
        VALUES (OLD.id, v_action, row_to_json(OLD)::TEXT, v_user_id);
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_asset_audit
    AFTER INSERT OR UPDATE OR DELETE ON assets
    FOR EACH ROW
    EXECUTE FUNCTION asset_audit_trigger();

-- Create trigger to auto-update asset current value after depreciation
CREATE OR REPLACE FUNCTION update_asset_value_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Update asset current value when depreciation is recorded
    UPDATE assets
    SET current_value = NEW.closing_value,
        updated_at = NOW()
    WHERE id = NEW.asset_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_asset_value
    AFTER INSERT ON asset_depreciation
    FOR EACH ROW
    EXECUTE FUNCTION update_asset_value_trigger();

-- Create trigger to auto-update maintenance dates
CREATE OR REPLACE FUNCTION update_maintenance_dates_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Update asset maintenance dates when maintenance is completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE assets
        SET last_maintenance_date = NEW.completed_date,
            next_maintenance_date = NEW.next_maintenance_date,
            updated_at = NOW()
        WHERE id = NEW.asset_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_maintenance_dates
    AFTER UPDATE ON asset_maintenance
    FOR EACH ROW
    EXECUTE FUNCTION update_maintenance_dates_trigger();

-- Insert default asset categories
INSERT INTO asset_categories (name, description, depreciation_rate, useful_life_years) VALUES
('Computer Equipment', 'Laptops, desktops, servers, and related IT equipment', 33.33, 3),
('Office Furniture', 'Desks, chairs, cabinets, and other office furniture', 10.00, 10),
('Vehicles', 'Company cars, trucks, and other vehicles', 20.00, 5),
('Machinery', 'Manufacturing and production equipment', 15.00, 7),
('Building', 'Office buildings, warehouses, and structures', 2.50, 40),
('Software', 'Licensed software and applications', 33.33, 3),
('Tools & Equipment', 'Hand tools, power tools, and small equipment', 20.00, 5),
('Communication Equipment', 'Phones, networking equipment, and communication devices', 25.00, 4),
('Security Equipment', 'CCTV cameras, access control systems, and security devices', 20.00, 5),
('Laboratory Equipment', 'Scientific instruments and laboratory tools', 12.50, 8)
ON CONFLICT (name) DO NOTHING;

-- Create view for asset summary
CREATE OR REPLACE VIEW asset_summary AS
SELECT 
    a.id,
    a.asset_code,
    a.name,
    a.category,
    a.location,
    a.status,
    a.condition,
    a.purchase_cost,
    a.current_value,
    a.purchase_date,
    a.next_maintenance_date,
    CONCAT(e.first_name, ' ', e.last_name) as assigned_to_name,
    s.name as supplier_name,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.purchase_date)) as age_years,
    CASE 
        WHEN a.next_maintenance_date IS NOT NULL AND a.next_maintenance_date <= CURRENT_DATE + INTERVAL '30 days' 
        THEN true 
        ELSE false 
    END as maintenance_due_soon,
    get_asset_utilization_rate(a.id) as utilization_rate
FROM assets a
LEFT JOIN employees e ON a.assigned_to = e.id
LEFT JOIN suppliers s ON a.supplier_id = s.id;