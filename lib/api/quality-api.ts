import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '../../types/database'

const supabase = createClientComponentClient<Database>()

export interface QualityFilters {
  limit?: number
  offset?: number
  status?: string
  type?: string
  dateRange?: string
}

export interface DashboardData {
  qualityRate: number
  activeInspections: number
  nonConformances: number
  auditScore: number
  qualityTrend: number
  inspectionGrowth: number
  nonConformanceRate: number
  auditGrowth: number
}

export interface QualityCheck {
  id: string
  name: string
  description: string
  type: string
  status: string
  result: string
  inspector: string
  productName: string
  createdAt: string
  updatedAt: string
}

export interface Inspection {
  id: string
  name: string
  description: string
  type: string
  status: string
  inspector: string
  location: string
  scheduledDate: string
  completedDate?: string
  createdAt: string
  updatedAt: string
}

export interface NonConformance {
  id: string
  title: string
  description: string
  severity: string
  status: string
  reportedBy: string
  assignedTo: string
  productName: string
  createdAt: string
  updatedAt: string
}

export interface AuditReport {
  id: string
  title: string
  description: string
  type: string
  status: string
  auditor: string
  score: number
  findings: number
  scheduledDate: string
  completedDate?: string
  createdAt: string
  updatedAt: string
}

export interface CorrectiveAction {
  id: string
  title: string
  description: string
  priority: string
  status: string
  assignedTo: string
  dueDate: string
  completedDate?: string
  nonConformanceId?: string
  createdAt: string
  updatedAt: string
}

export class QualityApi {
  static async getDashboardData(): Promise<DashboardData> {
    try {
      // Mock data for now - replace with actual Supabase queries
      return {
        qualityRate: 98.5,
        activeInspections: 12,
        nonConformances: 3,
        auditScore: 92,
        qualityTrend: 2.1,
        inspectionGrowth: 8.5,
        nonConformanceRate: 1.5,
        auditGrowth: 5.2
      }
    } catch (error) {
      console.error('Error fetching quality dashboard data:', error)
      throw error
    }
  }

  static async getQualityChecks(filters: QualityFilters = {}): Promise<{ data: QualityCheck[], count: number }> {
    try {
      // Mock data for now - replace with actual Supabase queries
      const mockChecks: QualityCheck[] = [
        {
          id: '1',
          name: 'Product Inspection QC-001',
          description: 'Visual inspection of finished products',
          type: 'visual',
          status: 'completed',
          result: 'passed',
          inspector: 'John Smith',
          productName: 'Widget A',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Dimensional Check QC-002',
          description: 'Dimensional accuracy verification',
          type: 'dimensional',
          status: 'in_progress',
          result: 'pending',
          inspector: 'Jane Doe',
          productName: 'Component B',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      return {
        data: mockChecks.slice(0, filters.limit || 10),
        count: mockChecks.length
      }
    } catch (error) {
      console.error('Error fetching quality checks:', error)
      throw error
    }
  }

  static async getInspections(filters: QualityFilters = {}): Promise<{ data: Inspection[], count: number }> {
    try {
      // Mock data for now - replace with actual Supabase queries
      const mockInspections: Inspection[] = [
        {
          id: '1',
          name: 'Monthly Safety Inspection',
          description: 'Routine safety compliance check',
          type: 'safety',
          status: 'scheduled',
          inspector: 'Mike Johnson',
          location: 'Production Floor A',
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Equipment Calibration Check',
          description: 'Calibration verification for measuring equipment',
          type: 'equipment',
          status: 'completed',
          inspector: 'Sarah Wilson',
          location: 'Quality Lab',
          scheduledDate: new Date().toISOString(),
          completedDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      return {
        data: mockInspections.slice(0, filters.limit || 10),
        count: mockInspections.length
      }
    } catch (error) {
      console.error('Error fetching inspections:', error)
      throw error
    }
  }

  static async getNonConformances(filters: QualityFilters = {}): Promise<{ data: NonConformance[], count: number }> {
    try {
      // Mock data for now - replace with actual Supabase queries
      const mockNonConformances: NonConformance[] = [
        {
          id: '1',
          title: 'Dimensional Deviation',
          description: 'Product dimensions outside tolerance range',
          severity: 'high',
          status: 'open',
          reportedBy: 'Quality Inspector',
          assignedTo: 'Production Manager',
          productName: 'Widget A',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Surface Finish Issue',
          description: 'Surface roughness exceeds specification',
          severity: 'medium',
          status: 'in_progress',
          reportedBy: 'QC Technician',
          assignedTo: 'Process Engineer',
          productName: 'Component B',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      return {
        data: mockNonConformances.slice(0, filters.limit || 10),
        count: mockNonConformances.length
      }
    } catch (error) {
      console.error('Error fetching non-conformances:', error)
      throw error
    }
  }

  static async getAuditReports(filters: QualityFilters = {}): Promise<{ data: AuditReport[], count: number }> {
    try {
      // Mock data for now - replace with actual Supabase queries
      const mockAudits: AuditReport[] = [
        {
          id: '1',
          title: 'ISO 9001 Internal Audit',
          description: 'Annual ISO 9001 compliance audit',
          type: 'internal',
          status: 'completed',
          auditor: 'External Auditor',
          score: 92,
          findings: 2,
          scheduledDate: new Date().toISOString(),
          completedDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Process Audit - Production',
          description: 'Production process compliance review',
          type: 'process',
          status: 'scheduled',
          auditor: 'Internal Auditor',
          score: 0,
          findings: 0,
          scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      return {
        data: mockAudits.slice(0, filters.limit || 10),
        count: mockAudits.length
      }
    } catch (error) {
      console.error('Error fetching audit reports:', error)
      throw error
    }
  }

  static async getCorrectiveActions(filters: QualityFilters = {}): Promise<{ data: CorrectiveAction[], count: number }> {
    try {
      // Mock data for now - replace with actual Supabase queries
      const mockActions: CorrectiveAction[] = [
        {
          id: '1',
          title: 'Update Process Parameters',
          description: 'Adjust machine settings to prevent dimensional deviations',
          priority: 'high',
          status: 'in_progress',
          assignedTo: 'Process Engineer',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          nonConformanceId: '1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Operator Training',
          description: 'Additional training on surface finish requirements',
          priority: 'medium',
          status: 'planned',
          assignedTo: 'Training Manager',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          nonConformanceId: '2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      return {
        data: mockActions.slice(0, filters.limit || 10),
        count: mockActions.length
      }
    } catch (error) {
      console.error('Error fetching corrective actions:', error)
      throw error
    }
  }

  static async createQualityCheck(checkData: Partial<QualityCheck>): Promise<QualityCheck> {
    try {
      // Mock implementation - replace with actual Supabase insert
      const newCheck: QualityCheck = {
        id: Date.now().toString(),
        name: checkData.name || '',
        description: checkData.description || '',
        type: checkData.type || 'visual',
        status: 'pending',
        result: 'pending',
        inspector: checkData.inspector || '',
        productName: checkData.productName || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      return newCheck
    } catch (error) {
      console.error('Error creating quality check:', error)
      throw error
    }
  }

  static async createNonConformance(ncData: Partial<NonConformance>): Promise<NonConformance> {
    try {
      // Mock implementation - replace with actual Supabase insert
      const newNC: NonConformance = {
        id: Date.now().toString(),
        title: ncData.title || '',
        description: ncData.description || '',
        severity: ncData.severity || 'medium',
        status: 'open',
        reportedBy: ncData.reportedBy || '',
        assignedTo: ncData.assignedTo || '',
        productName: ncData.productName || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      return newNC
    } catch (error) {
      console.error('Error creating non-conformance:', error)
      throw error
    }
  }

  static async scheduleAudit(auditData: Partial<AuditReport>): Promise<AuditReport> {
    try {
      // Mock implementation - replace with actual Supabase insert
      const newAudit: AuditReport = {
        id: Date.now().toString(),
        title: auditData.title || '',
        description: auditData.description || '',
        type: auditData.type || 'internal',
        status: 'scheduled',
        auditor: auditData.auditor || '',
        score: 0,
        findings: 0,
        scheduledDate: auditData.scheduledDate || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      return newAudit
    } catch (error) {
      console.error('Error scheduling audit:', error)
      throw error
    }
  }
}