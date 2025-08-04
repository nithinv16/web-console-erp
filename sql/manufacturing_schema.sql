-- Work Orders table
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    work_order_number VARCHAR(50) NOT NULL,
    product_id UUID NOT NULL REFERENCES erp_products(id),
    sales_order_id UUID REFERENCES sales_orders(id),
    quantity_to_produce INTEGER NOT NULL CHECK (quantity_to_produce > 0),
    quantity_produced INTEGER DEFAULT 0 CHECK (quantity_produced >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'released', 'in_progress', 'completed', 'cancelled', 'on_hold')),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    production_line_id UUID REFERENCES production_lines(id),
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date TIMESTAMP WITH TIME ZONE,
    actual_end_date TIMESTAMP WITH TIME ZONE,
    due_date DATE,
    estimated_cost DECIMAL(15,2),
    actual_cost DECIMAL(15,2),
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    assigned_to UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, work_order_number),
    CHECK (quantity_produced <= quantity_to_produce),
    CHECK (actual_start_date IS NULL OR planned_start_date IS NULL OR actual_start_date >= planned_start_date::timestamp),
    CHECK (actual_end_date IS NULL OR actual_start_date IS NULL OR actual_end_date >= actual_start_date)
);

-- Bill of Materials table
CREATE TABLE IF NOT EXISTS bill_of_materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES erp_products(id),
    component_product_id UUID NOT NULL REFERENCES erp_products(id),
    quantity_required DECIMAL(10,3) NOT NULL CHECK (quantity_required > 0),
    unit_cost DECIMAL(10,2),
    waste_percentage DECIMAL(5,2) DEFAULT 0 CHECK (waste_percentage >= 0 AND waste_percentage <= 100),
    is_optional BOOLEAN DEFAULT false,
    notes TEXT,
    effective_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, product_id, component_product_id, effective_date),
    CHECK (product_id != component_product_id),
    CHECK (expiry_date IS NULL OR expiry_date > effective_date)
);

-- Production Lines table
CREATE TABLE IF NOT EXISTS production_lines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    capacity_per_hour DECIMAL(10,2) NOT NULL CHECK (capacity_per_hour > 0),
    setup_time_minutes INTEGER DEFAULT 0 CHECK (setup_time_minutes >= 0),
    efficiency_rate DECIMAL(5,2) DEFAULT 100 CHECK (efficiency_rate > 0 AND efficiency_rate <= 100),
    cost_per_hour DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    maintenance_schedule JSONB, -- Maintenance schedule configuration
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- Work Order Operations table
CREATE TABLE IF NOT EXISTS work_order_operations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    operation_name VARCHAR(255) NOT NULL,
    sequence_number INTEGER NOT NULL,
    description TEXT,
    estimated_time_minutes INTEGER NOT NULL CHECK (estimated_time_minutes > 0),
    actual_time_minutes INTEGER CHECK (actual_time_minutes >= 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
    operator_id UUID REFERENCES employees(id),
    machine_id VARCHAR(100),
    setup_time_minutes INTEGER DEFAULT 0,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    quality_check_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(work_order_id, sequence_number),
    CHECK (actual_end_time IS NULL OR actual_start_time IS NULL OR actual_end_time >= actual_start_time)
);

-- Quality Checks table
CREATE TABLE IF NOT EXISTS quality_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES work_orders(id),
    operation_id UUID REFERENCES work_order_operations(id),
    check_type VARCHAR(20) NOT NULL CHECK (check_type IN ('incoming', 'in_process', 'final', 'random')),
    inspector_id UUID NOT NULL REFERENCES employees(id),
    check_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'passed', 'failed', 'on_hold')),
    parameters_checked JSONB NOT NULL, -- JSON object with check parameters and results
    defects_found JSONB, -- JSON array of defects found
    corrective_actions JSONB, -- JSON array of corrective actions taken
    sample_size INTEGER DEFAULT 1 CHECK (sample_size > 0),
    passed_quantity INTEGER DEFAULT 0 CHECK (passed_quantity >= 0),
    failed_quantity INTEGER DEFAULT 0 CHECK (failed_quantity >= 0),
    notes TEXT,
    attachments JSONB, -- Array of file URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (passed_quantity + failed_quantity <= sample_size)
);

-- Production Schedules table
CREATE TABLE IF NOT EXISTS production_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES work_orders(id),
    production_line_id UUID NOT NULL REFERENCES production_lines(id),
    scheduled_date DATE NOT NULL,
    scheduled_start_time TIME NOT NULL,
    scheduled_end_time TIME NOT NULL,
    estimated_quantity INTEGER NOT NULL CHECK (estimated_quantity > 0),
    priority_score INTEGER DEFAULT 50 CHECK (priority_score >= 0 AND priority_score <= 100),
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled')),
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    actual_quantity INTEGER CHECK (actual_quantity >= 0),
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (scheduled_end_time > scheduled_start_time),
    CHECK (actual_end_time IS NULL OR actual_start_time IS NULL OR actual_end_time >= actual_start_time)
);

-- Machine/Equipment table
CREATE TABLE IF NOT EXISTS machines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    machine_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    production_line_id UUID REFERENCES production_lines(id),
    machine_type VARCHAR(100),
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    serial_number VARCHAR(255),
    purchase_date DATE,
    purchase_cost DECIMAL(15,2),
    current_value DECIMAL(15,2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'breakdown', 'retired')),
    capacity_per_hour DECIMAL(10,2),
    power_consumption_kw DECIMAL(8,2),
    floor_space_sqm DECIMAL(8,2),
    weight_kg DECIMAL(10,2),
    installation_date DATE,
    warranty_expiry_date DATE,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    maintenance_interval_days INTEGER DEFAULT 90,
    operating_hours DECIMAL(10,2) DEFAULT 0,
    specifications JSONB,
    maintenance_log JSONB, -- Array of maintenance records
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, machine_code)
);

-- Production Routing table (defines the sequence of operations for a product)
CREATE TABLE IF NOT EXISTS production_routings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES erp_products(id),
    routing_name VARCHAR(255) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    effective_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    total_time_minutes INTEGER DEFAULT 0,
    description TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, product_id, version),
    CHECK (expiry_date IS NULL OR expiry_date > effective_date)
);

-- Production Routing Operations table
CREATE TABLE IF NOT EXISTS production_routing_operations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    routing_id UUID NOT NULL REFERENCES production_routings(id) ON DELETE CASCADE,
    operation_name VARCHAR(255) NOT NULL,
    sequence_number INTEGER NOT NULL,
    description TEXT,
    operation_type VARCHAR(50) DEFAULT 'production' CHECK (operation_type IN ('setup', 'production', 'quality', 'packaging', 'cleanup')),
    standard_time_minutes INTEGER NOT NULL CHECK (standard_time_minutes > 0),
    setup_time_minutes INTEGER DEFAULT 0,
    machine_id UUID REFERENCES machines(id),
    skill_required VARCHAR(100),
    labor_cost_per_hour DECIMAL(10,2),
    machine_cost_per_hour DECIMAL(10,2),
    quality_check_required BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(routing_id, sequence_number)
);

-- Material Consumption table (tracks actual material usage)
CREATE TABLE IF NOT EXISTS material_consumption (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES work_orders(id),
    product_id UUID NOT NULL REFERENCES erp_products(id),
    quantity_consumed DECIMAL(10,3) NOT NULL CHECK (quantity_consumed > 0),
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(15,2),
    consumption_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    consumed_by UUID REFERENCES employees(id),
    operation_id UUID REFERENCES work_order_operations(id),
    batch_number VARCHAR(100),
    lot_number VARCHAR(100),
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Production Waste table
CREATE TABLE IF NOT EXISTS production_waste (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES work_orders(id),
    operation_id UUID REFERENCES work_order_operations(id),
    product_id UUID NOT NULL REFERENCES erp_products(id),
    waste_type VARCHAR(50) NOT NULL CHECK (waste_type IN ('material', 'defective', 'setup', 'rework', 'other')),
    quantity_wasted DECIMAL(10,3) NOT NULL CHECK (quantity_wasted > 0),
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(15,2),
    reason TEXT,
    corrective_action TEXT,
    reported_by UUID REFERENCES employees(id),
    waste_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_recoverable BOOLEAN DEFAULT false,
    disposal_method VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Production Batches table
CREATE TABLE IF NOT EXISTS production_batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    work_order_id UUID NOT NULL REFERENCES work_orders(id),
    product_id UUID NOT NULL REFERENCES erp_products(id),
    quantity_produced DECIMAL(10,3) NOT NULL CHECK (quantity_produced > 0),
    production_date DATE NOT NULL,
    expiry_date DATE,
    quality_status VARCHAR(20) DEFAULT 'pending' CHECK (quality_status IN ('pending', 'approved', 'rejected', 'quarantine')),
    batch_cost DECIMAL(15,2),
    storage_location VARCHAR(255),
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    approved_by UUID REFERENCES employees(id),
    approved_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, batch_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_work_orders_company_id ON work_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_product_id ON work_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_production_line_id ON work_orders(production_line_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_due_date ON work_orders(due_date);
CREATE INDEX IF NOT EXISTS idx_work_orders_created_at ON work_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_work_orders_work_order_number ON work_orders(work_order_number);

CREATE INDEX IF NOT EXISTS idx_bom_company_id ON bill_of_materials(company_id);
CREATE INDEX IF NOT EXISTS idx_bom_product_id ON bill_of_materials(product_id);
CREATE INDEX IF NOT EXISTS idx_bom_component_product_id ON bill_of_materials(component_product_id);
CREATE INDEX IF NOT EXISTS idx_bom_effective_date ON bill_of_materials(effective_date);

CREATE INDEX IF NOT EXISTS idx_production_lines_company_id ON production_lines(company_id);
CREATE INDEX IF NOT EXISTS idx_production_lines_warehouse_id ON production_lines(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_production_lines_is_active ON production_lines(is_active);

CREATE INDEX IF NOT EXISTS idx_work_order_operations_work_order_id ON work_order_operations(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_operations_status ON work_order_operations(status);
CREATE INDEX IF NOT EXISTS idx_work_order_operations_operator_id ON work_order_operations(operator_id);
CREATE INDEX IF NOT EXISTS idx_work_order_operations_sequence ON work_order_operations(sequence_number);

CREATE INDEX IF NOT EXISTS idx_quality_checks_company_id ON quality_checks(company_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_work_order_id ON quality_checks(work_order_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_inspector_id ON quality_checks(inspector_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_status ON quality_checks(status);
CREATE INDEX IF NOT EXISTS idx_quality_checks_check_date ON quality_checks(check_date);

CREATE INDEX IF NOT EXISTS idx_production_schedules_company_id ON production_schedules(company_id);
CREATE INDEX IF NOT EXISTS idx_production_schedules_work_order_id ON production_schedules(work_order_id);
CREATE INDEX IF NOT EXISTS idx_production_schedules_production_line_id ON production_schedules(production_line_id);
CREATE INDEX IF NOT EXISTS idx_production_schedules_scheduled_date ON production_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_production_schedules_status ON production_schedules(status);

CREATE INDEX IF NOT EXISTS idx_machines_company_id ON machines(company_id);
CREATE INDEX IF NOT EXISTS idx_machines_production_line_id ON machines(production_line_id);
CREATE INDEX IF NOT EXISTS idx_machines_status ON machines(status);
CREATE INDEX IF NOT EXISTS idx_machines_machine_code ON machines(machine_code);

CREATE INDEX IF NOT EXISTS idx_production_routings_company_id ON production_routings(company_id);
CREATE INDEX IF NOT EXISTS idx_production_routings_product_id ON production_routings(product_id);
CREATE INDEX IF NOT EXISTS idx_production_routings_is_active ON production_routings(is_active);

CREATE INDEX IF NOT EXISTS idx_material_consumption_company_id ON material_consumption(company_id);
CREATE INDEX IF NOT EXISTS idx_material_consumption_work_order_id ON material_consumption(work_order_id);
CREATE INDEX IF NOT EXISTS idx_material_consumption_product_id ON material_consumption(product_id);
CREATE INDEX IF NOT EXISTS idx_material_consumption_date ON material_consumption(consumption_date);

CREATE INDEX IF NOT EXISTS idx_production_waste_company_id ON production_waste(company_id);
CREATE INDEX IF NOT EXISTS idx_production_waste_work_order_id ON production_waste(work_order_id);
CREATE INDEX IF NOT EXISTS idx_production_waste_product_id ON production_waste(product_id);
CREATE INDEX IF NOT EXISTS idx_production_waste_date ON production_waste(waste_date);

CREATE INDEX IF NOT EXISTS idx_production_batches_company_id ON production_batches(company_id);
CREATE INDEX IF NOT EXISTS idx_production_batches_work_order_id ON production_batches(work_order_id);
CREATE INDEX IF NOT EXISTS idx_production_batches_product_id ON production_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_production_batches_batch_number ON production_batches(batch_number);
CREATE INDEX IF NOT EXISTS idx_production_batches_production_date ON production_batches(production_date);

-- Enable Row Level Security
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_of_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_routings ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_routing_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_waste ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their company's work orders" ON work_orders
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's work orders" ON work_orders
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view their company's BOM" ON bill_of_materials
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's BOM" ON bill_of_materials
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view their company's production lines" ON production_lines
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's production lines" ON production_lines
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

-- Similar policies for other tables
CREATE POLICY "Users can view their company's work order operations" ON work_order_operations
    FOR SELECT USING (work_order_id IN (
        SELECT id FROM work_orders WHERE company_id IN (
            SELECT c.id FROM companies c
            JOIN auth.users u ON u.id = auth.uid()
            WHERE c.created_by = u.email OR c.id = ANY(
                SELECT company_id FROM employees WHERE user_id = u.id
            )
        )
    ));

CREATE POLICY "Users can manage their company's work order operations" ON work_order_operations
    FOR ALL USING (work_order_id IN (
        SELECT id FROM work_orders WHERE company_id IN (
            SELECT c.id FROM companies c
            JOIN auth.users u ON u.id = auth.uid()
            WHERE c.created_by = u.email OR c.id = ANY(
                SELECT company_id FROM employees WHERE user_id = u.id
            )
        )
    ));

CREATE POLICY "Users can view their company's quality checks" ON quality_checks
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's quality checks" ON quality_checks
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view their company's production schedules" ON production_schedules
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's production schedules" ON production_schedules
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view their company's machines" ON machines
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's machines" ON machines
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view their company's production routings" ON production_routings
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's production routings" ON production_routings
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view their company's routing operations" ON production_routing_operations
    FOR SELECT USING (routing_id IN (
        SELECT id FROM production_routings WHERE company_id IN (
            SELECT c.id FROM companies c
            JOIN auth.users u ON u.id = auth.uid()
            WHERE c.created_by = u.email OR c.id = ANY(
                SELECT company_id FROM employees WHERE user_id = u.id
            )
        )
    ));

CREATE POLICY "Users can manage their company's routing operations" ON production_routing_operations
    FOR ALL USING (routing_id IN (
        SELECT id FROM production_routings WHERE company_id IN (
            SELECT c.id FROM companies c
            JOIN auth.users u ON u.id = auth.uid()
            WHERE c.created_by = u.email OR c.id = ANY(
                SELECT company_id FROM employees WHERE user_id = u.id
            )
        )
    ));

CREATE POLICY "Users can view their company's material consumption" ON material_consumption
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's material consumption" ON material_consumption
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view their company's production waste" ON production_waste
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's production waste" ON production_waste
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view their company's production batches" ON production_batches
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's production batches" ON production_batches
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

-- Create triggers for updating timestamps
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bill_of_materials_updated_at BEFORE UPDATE ON bill_of_materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_lines_updated_at BEFORE UPDATE ON production_lines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_order_operations_updated_at BEFORE UPDATE ON work_order_operations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quality_checks_updated_at BEFORE UPDATE ON quality_checks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_schedules_updated_at BEFORE UPDATE ON production_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON machines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_routings_updated_at BEFORE UPDATE ON production_routings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_batches_updated_at BEFORE UPDATE ON production_batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create stored procedures for common operations

-- Function to calculate work order cost
CREATE OR REPLACE FUNCTION calculate_work_order_cost(work_order_id UUID)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    material_cost DECIMAL(15,2) := 0;
    labor_cost DECIMAL(15,2) := 0;
    overhead_cost DECIMAL(15,2) := 0;
    total_cost DECIMAL(15,2) := 0;
BEGIN
    -- Calculate material cost from BOM
    SELECT COALESCE(SUM(mc.total_cost), 0) INTO material_cost
    FROM material_consumption mc
    WHERE mc.work_order_id = calculate_work_order_cost.work_order_id;
    
    -- Calculate labor cost from operations
    SELECT COALESCE(SUM(
        CASE 
            WHEN woo.actual_time_minutes IS NOT NULL THEN 
                (woo.actual_time_minutes / 60.0) * COALESCE(pro.labor_cost_per_hour, 0)
            ELSE 
                (woo.estimated_time_minutes / 60.0) * COALESCE(pro.labor_cost_per_hour, 0)
        END
    ), 0) INTO labor_cost
    FROM work_order_operations woo
    LEFT JOIN production_routing_operations pro ON pro.operation_name = woo.operation_name
    WHERE woo.work_order_id = calculate_work_order_cost.work_order_id;
    
    -- Calculate overhead (simplified as 20% of material + labor)
    overhead_cost := (material_cost + labor_cost) * 0.20;
    
    total_cost := material_cost + labor_cost + overhead_cost;
    
    RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- Function to check material availability for work order
CREATE OR REPLACE FUNCTION check_material_availability(work_order_id UUID)
RETURNS TABLE(
    component_id UUID,
    component_name VARCHAR,
    required_quantity DECIMAL,
    available_quantity DECIMAL,
    shortage_quantity DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bom.component_product_id,
        p.name,
        (bom.quantity_required * wo.quantity_to_produce) as required_qty,
        COALESCE(ci.quantity_available, 0) as available_qty,
        GREATEST(0, (bom.quantity_required * wo.quantity_to_produce) - COALESCE(ci.quantity_available, 0)) as shortage_qty
    FROM work_orders wo
    JOIN bill_of_materials bom ON bom.product_id = wo.product_id
    JOIN erp_products p ON p.id = bom.component_product_id
    LEFT JOIN current_inventory ci ON ci.product_id = bom.component_product_id
    WHERE wo.id = check_material_availability.work_order_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update work order progress
CREATE OR REPLACE FUNCTION update_work_order_progress(work_order_id UUID)
RETURNS VOID AS $$
DECLARE
    total_operations INTEGER;
    completed_operations INTEGER;
    progress_percentage DECIMAL(5,2);
BEGIN
    -- Count total and completed operations
    SELECT COUNT(*) INTO total_operations
    FROM work_order_operations
    WHERE work_order_operations.work_order_id = update_work_order_progress.work_order_id;
    
    SELECT COUNT(*) INTO completed_operations
    FROM work_order_operations
    WHERE work_order_operations.work_order_id = update_work_order_progress.work_order_id
    AND status = 'completed';
    
    -- Calculate progress percentage
    IF total_operations > 0 THEN
        progress_percentage := (completed_operations::DECIMAL / total_operations::DECIMAL) * 100;
    ELSE
        progress_percentage := 0;
    END IF;
    
    -- Update work order with progress
    UPDATE work_orders 
    SET 
        updated_at = NOW()
    WHERE id = update_work_order_progress.work_order_id;
    
END;
$$ LANGUAGE plpgsql;