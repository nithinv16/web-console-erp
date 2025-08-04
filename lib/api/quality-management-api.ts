import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

// Types for Quality Management
export interface QualityInspection {
  id: string;
  company_id: string;
  inspection_number: string;
  inspection_type: 'incoming' | 'in_process' | 'final' | 'customer_return' | 'supplier_audit';
  product_id?: string;
  product_name?: string;
  batch_number?: string;
  supplier_id?: string;
  supplier_name?: string;
  work_order_id?: string;
  inspector_id: string;
  inspector_name?: string;
  inspection_date: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  result: 'pass' | 'fail' | 'conditional_pass' | 'pending';
  sample_size: number;
  defect_count: number;
  defect_rate: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInspectionData {
  inspection_type: 'incoming' | 'in_process' | 'final' | 'customer_return' | 'supplier_audit';
  product_id?: string;
  batch_number?: string;
  supplier_id?: string;
  work_order_id?: string;
  inspector_id: string;
  inspection_date: string;
  sample_size: number;
  notes?: string;
}

export interface QualityCheckpoint {
  id: string;
  inspection_id: string;
  checkpoint_name: string;
  specification: string;
  measurement_type: 'numeric' | 'visual' | 'go_no_go' | 'attribute';
  target_value?: number;
  tolerance_upper?: number;
  tolerance_lower?: number;
  unit_of_measure?: string;
  actual_value?: number;
  text_result?: string;
  result: 'pass' | 'fail' | 'na';
  notes?: string;
  created_at: string;
}

export interface CreateCheckpointData {
  checkpoint_name: string;
  specification: string;
  measurement_type: 'numeric' | 'visual' | 'go_no_go' | 'attribute';
  target_value?: number;
  tolerance_upper?: number;
  tolerance_lower?: number;
  unit_of_measure?: string;
  actual_value?: number;
  text_result?: string;
  result: 'pass' | 'fail' | 'na';
  notes?: string;
}

export interface NonConformance {
  id: string;
  company_id: string;
  ncr_number: string;
  title: string;
  description: string;
  category: 'product' | 'process' | 'system' | 'documentation' | 'customer_complaint';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: 'internal_audit' | 'customer_complaint' | 'supplier_issue' | 'production' | 'inspection';
  product_id?: string;
  product_name?: string;
  batch_number?: string;
  supplier_id?: string;
  supplier_name?: string;
  detected_by: string;
  detected_by_name?: string;
  detection_date: string;
  status: 'open' | 'investigating' | 'corrective_action' | 'verification' | 'closed' | 'cancelled';
  assigned_to?: string;
  assigned_to_name?: string;
  root_cause?: string;
  immediate_action?: string;
  cost_impact?: number;
  customer_impact: boolean;
  regulatory_impact: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNonConformanceData {
  title: string;
  description: string;
  category: 'product' | 'process' | 'system' | 'documentation' | 'customer_complaint';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: 'internal_audit' | 'customer_complaint' | 'supplier_issue' | 'production' | 'inspection';
  product_id?: string;
  batch_number?: string;
  supplier_id?: string;
  detection_date: string;
  assigned_to?: string;
  immediate_action?: string;
  cost_impact?: number;
  customer_impact?: boolean;
  regulatory_impact?: boolean;
}

export interface CorrectiveAction {
  id: string;
  non_conformance_id: string;
  action_number: string;
  title: string;
  description: string;
  action_type: 'immediate' | 'corrective' | 'preventive';
  assigned_to: string;
  assigned_to_name?: string;
  due_date: string;
  status: 'planned' | 'in_progress' | 'completed' | 'verified' | 'cancelled';
  completion_date?: string;
  verification_date?: string;
  verified_by?: string;
  verified_by_name?: string;
  effectiveness_review?: string;
  cost?: number;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCorrectiveActionData {
  title: string;
  description: string;
  action_type: 'immediate' | 'corrective' | 'preventive';
  assigned_to: string;
  due_date: string;
  cost?: number;
  notes?: string;
}

export interface QualityAudit {
  id: string;
  company_id: string;
  audit_number: string;
  title: string;
  audit_type: 'internal' | 'external' | 'supplier' | 'customer' | 'regulatory';
  scope: string;
  standard: string; // ISO 9001, AS9100, etc.
  auditor_id: string;
  auditor_name?: string;
  auditee_department?: string;
  planned_date: string;
  actual_date?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'report_pending' | 'closed';
  overall_rating: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'unsatisfactory';
  findings_count: number;
  major_findings: number;
  minor_findings: number;
  observations: number;
  summary?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAuditData {
  title: string;
  audit_type: 'internal' | 'external' | 'supplier' | 'customer' | 'regulatory';
  scope: string;
  standard: string;
  auditor_id: string;
  auditee_department?: string;
  planned_date: string;
}

export interface AuditFinding {
  id: string;
  audit_id: string;
  finding_number: string;
  title: string;
  description: string;
  category: 'major' | 'minor' | 'observation' | 'opportunity';
  clause_reference: string;
  evidence: string;
  recommendation: string;
  assigned_to?: string;
  assigned_to_name?: string;
  due_date?: string;
  status: 'open' | 'in_progress' | 'completed' | 'verified' | 'closed';
  response?: string;
  corrective_action_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAuditFindingData {
  title: string;
  description: string;
  category: 'major' | 'minor' | 'observation' | 'opportunity';
  clause_reference: string;
  evidence: string;
  recommendation: string;
  assigned_to?: string;
  due_date?: string;
}

export interface QualityMetric {
  id: string;
  company_id: string;
  metric_name: string;
  metric_type: 'defect_rate' | 'first_pass_yield' | 'customer_satisfaction' | 'supplier_quality' | 'cost_of_quality' | 'on_time_delivery';
  target_value: number;
  actual_value: number;
  unit_of_measure: string;
  measurement_period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  measurement_date: string;
  department?: string;
  product_line?: string;
  notes?: string;
  created_at: string;
}

export interface QualityFilters {
  inspection_type?: string;
  result?: string;
  status?: string;
  inspector_id?: string;
  product_id?: string;
  supplier_id?: string;
  date_from?: string;
  date_to?: string;
  category?: string;
  severity?: string;
  source?: string;
}

export interface QualityAnalytics {
  total_inspections: number;
  passed_inspections: number;
  failed_inspections: number;
  pass_rate: number;
  total_non_conformances: number;
  open_non_conformances: number;
  closed_non_conformances: number;
  average_resolution_time: number;
  total_corrective_actions: number;
  overdue_actions: number;
  cost_of_quality: number;
  defect_trend: Array<{ month: string; defect_rate: number; count: number }>;
  top_defect_categories: Array<{ category: string; count: number; percentage: number }>;
  supplier_quality_rating: Array<{ supplier_id: string; supplier_name: string; rating: number; defect_rate: number }>;
  inspection_summary: Array<{ type: string; total: number; passed: number; failed: number; pass_rate: number }>;
}

class QualityManagementApi {
  // Quality Inspections
  async getInspections(companyId: string, filters?: QualityFilters) {
    let query = supabase
      .from('quality_inspections')
      .select(`
        *,
        inspector:employees!quality_inspections_inspector_id_fkey(
          first_name,
          last_name
        ),
        product:products!quality_inspections_product_id_fkey(
          name
        ),
        supplier:suppliers!quality_inspections_supplier_id_fkey(
          name
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (filters) {
      if (filters.inspection_type) {
        query = query.eq('inspection_type', filters.inspection_type);
      }
      if (filters.result) {
        query = query.eq('result', filters.result);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.inspector_id) {
        query = query.eq('inspector_id', filters.inspector_id);
      }
      if (filters.product_id) {
        query = query.eq('product_id', filters.product_id);
      }
      if (filters.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id);
      }
      if (filters.date_from) {
        query = query.gte('inspection_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('inspection_date', filters.date_to);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map(inspection => ({
      ...inspection,
      inspector_name: inspection.inspector 
        ? `${inspection.inspector.first_name} ${inspection.inspector.last_name}`
        : null,
      product_name: inspection.product?.name || null,
      supplier_name: inspection.supplier?.name || null
    }));
  }

  async getInspectionById(id: string) {
    const { data, error } = await supabase
      .from('quality_inspections')
      .select(`
        *,
        inspector:employees!quality_inspections_inspector_id_fkey(
          first_name,
          last_name
        ),
        product:products!quality_inspections_product_id_fkey(
          name
        ),
        supplier:suppliers!quality_inspections_supplier_id_fkey(
          name
        ),
        checkpoints:quality_checkpoints(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      ...data,
      inspector_name: data.inspector 
        ? `${data.inspector.first_name} ${data.inspector.last_name}`
        : null,
      product_name: data.product?.name || null,
      supplier_name: data.supplier?.name || null
    };
  }

  async createInspection(companyId: string, inspectionData: CreateInspectionData) {
    // Generate inspection number
    const inspectionNumber = await this.generateInspectionNumber(companyId);

    const { data, error } = await supabase
      .from('quality_inspections')
      .insert({
        company_id: companyId,
        inspection_number: inspectionNumber,
        ...inspectionData,
        status: 'scheduled',
        result: 'pending',
        defect_count: 0,
        defect_rate: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateInspection(id: string, updates: Partial<CreateInspectionData>) {
    const { data, error } = await supabase
      .from('quality_inspections')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async completeInspection(id: string, result: 'pass' | 'fail' | 'conditional_pass', notes?: string) {
    // Calculate defect rate based on checkpoints
    const { data: checkpoints } = await supabase
      .from('quality_checkpoints')
      .select('result')
      .eq('inspection_id', id);

    const totalCheckpoints = checkpoints?.length || 0;
    const failedCheckpoints = checkpoints?.filter(cp => cp.result === 'fail').length || 0;
    const defectRate = totalCheckpoints > 0 ? (failedCheckpoints / totalCheckpoints) * 100 : 0;

    const { data, error } = await supabase
      .from('quality_inspections')
      .update({
        status: 'completed',
        result: result,
        defect_count: failedCheckpoints,
        defect_rate: defectRate,
        notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Quality Checkpoints
  async getCheckpoints(inspectionId: string) {
    const { data, error } = await supabase
      .from('quality_checkpoints')
      .select('*')
      .eq('inspection_id', inspectionId)
      .order('created_at');

    if (error) throw error;
    return data;
  }

  async addCheckpoint(inspectionId: string, checkpointData: CreateCheckpointData) {
    const { data, error } = await supabase
      .from('quality_checkpoints')
      .insert({
        inspection_id: inspectionId,
        ...checkpointData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateCheckpoint(id: string, updates: Partial<CreateCheckpointData>) {
    const { data, error } = await supabase
      .from('quality_checkpoints')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteCheckpoint(id: string) {
    const { error } = await supabase
      .from('quality_checkpoints')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Non-Conformances
  async getNonConformances(companyId: string, filters?: QualityFilters) {
    let query = supabase
      .from('non_conformances')
      .select(`
        *,
        detected_by_profile:employees!non_conformances_detected_by_fkey(
          first_name,
          last_name
        ),
        assigned_to_profile:employees!non_conformances_assigned_to_fkey(
          first_name,
          last_name
        ),
        product:products!non_conformances_product_id_fkey(
          name
        ),
        supplier:suppliers!non_conformances_supplier_id_fkey(
          name
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (filters) {
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters.source) {
        query = query.eq('source', filters.source);
      }
      if (filters.date_from) {
        query = query.gte('detection_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('detection_date', filters.date_to);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map(ncr => ({
      ...ncr,
      detected_by_name: ncr.detected_by_profile 
        ? `${ncr.detected_by_profile.first_name} ${ncr.detected_by_profile.last_name}`
        : null,
      assigned_to_name: ncr.assigned_to_profile 
        ? `${ncr.assigned_to_profile.first_name} ${ncr.assigned_to_profile.last_name}`
        : null,
      product_name: ncr.product?.name || null,
      supplier_name: ncr.supplier?.name || null
    }));
  }

  async getNonConformanceById(id: string) {
    const { data, error } = await supabase
      .from('non_conformances')
      .select(`
        *,
        detected_by_profile:employees!non_conformances_detected_by_fkey(
          first_name,
          last_name
        ),
        assigned_to_profile:employees!non_conformances_assigned_to_fkey(
          first_name,
          last_name
        ),
        product:products!non_conformances_product_id_fkey(
          name
        ),
        supplier:suppliers!non_conformances_supplier_id_fkey(
          name
        ),
        corrective_actions:corrective_actions(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      ...data,
      detected_by_name: data.detected_by_profile 
        ? `${data.detected_by_profile.first_name} ${data.detected_by_profile.last_name}`
        : null,
      assigned_to_name: data.assigned_to_profile 
        ? `${data.assigned_to_profile.first_name} ${data.assigned_to_profile.last_name}`
        : null,
      product_name: data.product?.name || null,
      supplier_name: data.supplier?.name || null
    };
  }

  async createNonConformance(companyId: string, ncrData: CreateNonConformanceData) {
    // Generate NCR number
    const ncrNumber = await this.generateNCRNumber(companyId);

    const { data, error } = await supabase
      .from('non_conformances')
      .insert({
        company_id: companyId,
        ncr_number: ncrNumber,
        ...ncrData,
        status: 'open',
        customer_impact: ncrData.customer_impact || false,
        regulatory_impact: ncrData.regulatory_impact || false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateNonConformance(id: string, updates: Partial<CreateNonConformanceData & { status: string; root_cause: string }>) {
    const { data, error } = await supabase
      .from('non_conformances')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async closeNonConformance(id: string, rootCause: string) {
    const { data, error } = await supabase
      .from('non_conformances')
      .update({
        status: 'closed',
        root_cause: rootCause,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Corrective Actions
  async getCorrectiveActions(nonConformanceId: string) {
    const { data, error } = await supabase
      .from('corrective_actions')
      .select(`
        *,
        assigned_to_profile:employees!corrective_actions_assigned_to_fkey(
          first_name,
          last_name
        ),
        verified_by_profile:employees!corrective_actions_verified_by_fkey(
          first_name,
          last_name
        )
      `)
      .eq('non_conformance_id', nonConformanceId)
      .order('created_at');

    if (error) throw error;

    return data.map(action => ({
      ...action,
      assigned_to_name: action.assigned_to_profile 
        ? `${action.assigned_to_profile.first_name} ${action.assigned_to_profile.last_name}`
        : null,
      verified_by_name: action.verified_by_profile 
        ? `${action.verified_by_profile.first_name} ${action.verified_by_profile.last_name}`
        : null
    }));
  }

  async createCorrectiveAction(nonConformanceId: string, actionData: CreateCorrectiveActionData) {
    // Generate action number
    const actionNumber = await this.generateActionNumber(nonConformanceId);

    const { data, error } = await supabase
      .from('corrective_actions')
      .insert({
        non_conformance_id: nonConformanceId,
        action_number: actionNumber,
        ...actionData,
        status: 'planned'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateCorrectiveAction(id: string, updates: Partial<CreateCorrectiveActionData & { status: string; completion_date: string; effectiveness_review: string }>) {
    const { data, error } = await supabase
      .from('corrective_actions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async completeCorrectiveAction(id: string, effectivenessReview?: string) {
    const { data, error } = await supabase
      .from('corrective_actions')
      .update({
        status: 'completed',
        completion_date: new Date().toISOString(),
        effectiveness_review: effectivenessReview,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async verifyCorrectiveAction(id: string, verifiedBy: string, effectivenessReview: string) {
    const { data, error } = await supabase
      .from('corrective_actions')
      .update({
        status: 'verified',
        verification_date: new Date().toISOString(),
        verified_by: verifiedBy,
        effectiveness_review: effectivenessReview,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Quality Audits
  async getAudits(companyId: string, filters?: QualityFilters) {
    let query = supabase
      .from('quality_audits')
      .select(`
        *,
        auditor:employees!quality_audits_auditor_id_fkey(
          first_name,
          last_name
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (filters) {
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.date_from) {
        query = query.gte('planned_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('planned_date', filters.date_to);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map(audit => ({
      ...audit,
      auditor_name: audit.auditor 
        ? `${audit.auditor.first_name} ${audit.auditor.last_name}`
        : null
    }));
  }

  async createAudit(companyId: string, auditData: CreateAuditData) {
    // Generate audit number
    const auditNumber = await this.generateAuditNumber(companyId);

    const { data, error } = await supabase
      .from('quality_audits')
      .insert({
        company_id: companyId,
        audit_number: auditNumber,
        ...auditData,
        status: 'planned',
        findings_count: 0,
        major_findings: 0,
        minor_findings: 0,
        observations: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateAudit(id: string, updates: Partial<CreateAuditData & { status: string; actual_date: string; overall_rating: string; summary: string }>) {
    const { data, error } = await supabase
      .from('quality_audits')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Audit Findings
  async getAuditFindings(auditId: string) {
    const { data, error } = await supabase
      .from('audit_findings')
      .select(`
        *,
        assigned_to_profile:employees!audit_findings_assigned_to_fkey(
          first_name,
          last_name
        )
      `)
      .eq('audit_id', auditId)
      .order('created_at');

    if (error) throw error;

    return data.map(finding => ({
      ...finding,
      assigned_to_name: finding.assigned_to_profile 
        ? `${finding.assigned_to_profile.first_name} ${finding.assigned_to_profile.last_name}`
        : null
    }));
  }

  async createAuditFinding(auditId: string, findingData: CreateAuditFindingData) {
    // Generate finding number
    const findingNumber = await this.generateFindingNumber(auditId);

    const { data, error } = await supabase
      .from('audit_findings')
      .insert({
        audit_id: auditId,
        finding_number: findingNumber,
        ...findingData,
        status: 'open'
      })
      .select()
      .single();

    if (error) throw error;

    // Update audit findings count
    await this.updateAuditFindingsCount(auditId);

    return data;
  }

  async updateAuditFinding(id: string, updates: Partial<CreateAuditFindingData & { status: string; response: string }>) {
    const { data, error } = await supabase
      .from('audit_findings')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Quality Metrics
  async getQualityMetrics(companyId: string, metricType?: string, period?: string) {
    let query = supabase
      .from('quality_metrics')
      .select('*')
      .eq('company_id', companyId)
      .order('measurement_date', { ascending: false });

    if (metricType) {
      query = query.eq('metric_type', metricType);
    }

    if (period) {
      query = query.eq('measurement_period', period);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async recordQualityMetric(companyId: string, metricData: Omit<QualityMetric, 'id' | 'company_id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('quality_metrics')
      .insert({
        company_id: companyId,
        ...metricData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Analytics and Reporting
  async getQualityAnalytics(companyId: string): Promise<QualityAnalytics> {
    // Get inspection statistics
    const { data: inspectionStats } = await supabase
      .rpc('get_inspection_statistics', { p_company_id: companyId });

    // Get non-conformance statistics
    const { data: ncrStats } = await supabase
      .rpc('get_ncr_statistics', { p_company_id: companyId });

    // Get corrective action statistics
    const { data: caStats } = await supabase
      .rpc('get_corrective_action_statistics', { p_company_id: companyId });

    // Get defect trend
    const { data: defectTrend } = await supabase
      .rpc('get_monthly_defect_trend', { p_company_id: companyId });

    // Get top defect categories
    const { data: topDefects } = await supabase
      .rpc('get_top_defect_categories', { p_company_id: companyId });

    // Get supplier quality rating
    const { data: supplierRating } = await supabase
      .rpc('get_supplier_quality_rating', { p_company_id: companyId });

    // Get inspection summary by type
    const { data: inspectionSummary } = await supabase
      .rpc('get_inspection_summary_by_type', { p_company_id: companyId });

    const stats = inspectionStats?.[0] || {};
    const ncrData = ncrStats?.[0] || {};
    const caData = caStats?.[0] || {};

    return {
      total_inspections: stats.total_inspections || 0,
      passed_inspections: stats.passed_inspections || 0,
      failed_inspections: stats.failed_inspections || 0,
      pass_rate: stats.pass_rate || 0,
      total_non_conformances: ncrData.total_ncr || 0,
      open_non_conformances: ncrData.open_ncr || 0,
      closed_non_conformances: ncrData.closed_ncr || 0,
      average_resolution_time: ncrData.avg_resolution_time || 0,
      total_corrective_actions: caData.total_actions || 0,
      overdue_actions: caData.overdue_actions || 0,
      cost_of_quality: ncrData.total_cost || 0,
      defect_trend: defectTrend || [],
      top_defect_categories: topDefects || [],
      supplier_quality_rating: supplierRating || [],
      inspection_summary: inspectionSummary || []
    };
  }

  // Utility Functions
  private async generateInspectionNumber(companyId: string): Promise<string> {
    const { data } = await supabase
      .from('quality_inspections')
      .select('inspection_number')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastNumber = data?.[0]?.inspection_number;
    const nextNumber = lastNumber ? parseInt(lastNumber.split('-')[1]) + 1 : 1;
    return `QI-${nextNumber.toString().padStart(6, '0')}`;
  }

  private async generateNCRNumber(companyId: string): Promise<string> {
    const { data } = await supabase
      .from('non_conformances')
      .select('ncr_number')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastNumber = data?.[0]?.ncr_number;
    const nextNumber = lastNumber ? parseInt(lastNumber.split('-')[1]) + 1 : 1;
    return `NCR-${nextNumber.toString().padStart(6, '0')}`;
  }

  private async generateActionNumber(nonConformanceId: string): Promise<string> {
    const { data } = await supabase
      .from('corrective_actions')
      .select('action_number')
      .eq('non_conformance_id', nonConformanceId)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastNumber = data?.[0]?.action_number;
    const nextNumber = lastNumber ? parseInt(lastNumber.split('-')[2]) + 1 : 1;
    return `CA-${nonConformanceId.slice(-6)}-${nextNumber.toString().padStart(3, '0')}`;
  }

  private async generateAuditNumber(companyId: string): Promise<string> {
    const { data } = await supabase
      .from('quality_audits')
      .select('audit_number')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastNumber = data?.[0]?.audit_number;
    const nextNumber = lastNumber ? parseInt(lastNumber.split('-')[1]) + 1 : 1;
    return `QA-${nextNumber.toString().padStart(6, '0')}`;
  }

  private async generateFindingNumber(auditId: string): Promise<string> {
    const { data } = await supabase
      .from('audit_findings')
      .select('finding_number')
      .eq('audit_id', auditId)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastNumber = data?.[0]?.finding_number;
    const nextNumber = lastNumber ? parseInt(lastNumber.split('-')[2]) + 1 : 1;
    return `AF-${auditId.slice(-6)}-${nextNumber.toString().padStart(3, '0')}`;
  }

  private async updateAuditFindingsCount(auditId: string) {
    const { data: findings } = await supabase
      .from('audit_findings')
      .select('category')
      .eq('audit_id', auditId);

    const majorFindings = findings?.filter(f => f.category === 'major').length || 0;
    const minorFindings = findings?.filter(f => f.category === 'minor').length || 0;
    const observations = findings?.filter(f => f.category === 'observation').length || 0;
    const totalFindings = findings?.length || 0;

    await supabase
      .from('quality_audits')
      .update({
        findings_count: totalFindings,
        major_findings: majorFindings,
        minor_findings: minorFindings,
        observations: observations,
        updated_at: new Date().toISOString()
      })
      .eq('id', auditId);
  }

  async getOverdueActions(companyId: string) {
    const { data, error } = await supabase
      .from('corrective_actions')
      .select(`
        *,
        non_conformance:non_conformances!corrective_actions_non_conformance_id_fkey(
          ncr_number,
          title
        ),
        assigned_to_profile:employees!corrective_actions_assigned_to_fkey(
          first_name,
          last_name
        )
      `)
      .eq('non_conformances.company_id', companyId)
      .in('status', ['planned', 'in_progress'])
      .lt('due_date', new Date().toISOString())
      .order('due_date');

    if (error) throw error;

    return data.map(action => ({
      ...action,
      assigned_to_name: action.assigned_to_profile 
        ? `${action.assigned_to_profile.first_name} ${action.assigned_to_profile.last_name}`
        : null
    }));
  }

  async getQualityDashboard(companyId: string) {
    const analytics = await this.getQualityAnalytics(companyId);
    const overdueActions = await this.getOverdueActions(companyId);
    const recentInspections = await this.getInspections(companyId, { date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() });
    const openNCRs = await this.getNonConformances(companyId, { status: 'open' });

    return {
      analytics,
      overdue_actions: overdueActions.slice(0, 10),
      recent_inspections: recentInspections.slice(0, 10),
      open_ncrs: openNCRs.slice(0, 10)
    };
  }
}

export const qualityManagementApi = new QualityManagementApi();
export default qualityManagementApi;