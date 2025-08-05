import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '../../types/database'

const supabase = createClientComponentClient<Database>()

export interface DocumentFilters {
  limit?: number
  offset?: number
  status?: string
  type?: string
  folder?: string
  dateRange?: string
}

export interface DashboardData {
  totalDocuments: number
  storageUsed: number
  pendingApprovals: number
  activeWorkflows: number
  documentGrowth: number
  storageGrowth: number
  approvalRate: number
  workflowEfficiency: number
}

export interface Document {
  id: string
  name: string
  description?: string
  type: string
  size: number
  status: string
  folderId?: string
  folderName?: string
  uploadedBy: string
  version: string
  tags: string[]
  url: string
  createdAt: string
  updatedAt: string
}

export interface Folder {
  id: string
  name: string
  description?: string
  parentId?: string
  path: string
  documentCount: number
  size: number
  permissions: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Workflow {
  id: string
  name: string
  description: string
  type: string
  status: string
  steps: WorkflowStep[]
  documentId?: string
  documentName?: string
  createdBy: string
  assignedTo: string
  dueDate?: string
  completedDate?: string
  createdAt: string
  updatedAt: string
}

export interface WorkflowStep {
  id: string
  name: string
  description: string
  order: number
  status: string
  assignedTo: string
  completedBy?: string
  completedAt?: string
  notes?: string
}

export interface Approval {
  id: string
  documentId: string
  documentName: string
  type: string
  status: string
  requestedBy: string
  approver: string
  comments?: string
  requestedDate: string
  approvedDate?: string
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export interface VersionHistory {
  id: string
  documentId: string
  documentName: string
  version: string
  changes: string
  uploadedBy: string
  size: number
  url: string
  createdAt: string
}

export class DocumentApi {
  static async getDashboardData(): Promise<DashboardData> {
    try {
      // Mock data for now - replace with actual Supabase queries
      return {
        totalDocuments: 1247,
        storageUsed: 15.6, // GB
        pendingApprovals: 8,
        activeWorkflows: 12,
        documentGrowth: 15.2,
        storageGrowth: 12.8,
        approvalRate: 94.5,
        workflowEfficiency: 87.3
      }
    } catch (error) {
      console.error('Error fetching document dashboard data:', error)
      throw error
    }
  }

  static async getDocuments(filters: DocumentFilters = {}): Promise<{ data: Document[], count: number }> {
    try {
      // Mock data for now - replace with actual Supabase queries
      const mockDocuments: Document[] = [
        {
          id: '1',
          name: 'Project Proposal 2024.pdf',
          description: 'Annual project proposal document',
          type: 'application/pdf',
          size: 2048576,
          status: 'published',
          folderId: '1',
          folderName: 'Projects',
          uploadedBy: 'John Smith',
          version: '1.2',
          tags: ['proposal', 'project', '2024'],
          url: '/documents/project-proposal-2024.pdf',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Employee Handbook.docx',
          description: 'Company employee handbook',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 1536000,
          status: 'under_review',
          folderId: '2',
          folderName: 'HR Documents',
          uploadedBy: 'Sarah Johnson',
          version: '2.1',
          tags: ['hr', 'handbook', 'policies'],
          url: '/documents/employee-handbook.docx',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Financial Report Q4.xlsx',
          description: 'Quarterly financial report',
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          size: 3072000,
          status: 'approved',
          folderId: '3',
          folderName: 'Finance',
          uploadedBy: 'Mike Wilson',
          version: '1.0',
          tags: ['finance', 'report', 'q4'],
          url: '/documents/financial-report-q4.xlsx',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      return {
        data: mockDocuments.slice(0, filters.limit || 10),
        count: mockDocuments.length
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      throw error
    }
  }

  static async getFolders(filters: DocumentFilters = {}): Promise<{ data: Folder[], count: number }> {
    try {
      // Mock data for now - replace with actual Supabase queries
      const mockFolders: Folder[] = [
        {
          id: '1',
          name: 'Projects',
          description: 'Project-related documents',
          path: '/Projects',
          documentCount: 45,
          size: 125829120,
          permissions: ['read', 'write', 'delete'],
          createdBy: 'Admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'HR Documents',
          description: 'Human resources documentation',
          path: '/HR Documents',
          documentCount: 28,
          size: 67108864,
          permissions: ['read', 'write'],
          createdBy: 'HR Manager',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Finance',
          description: 'Financial documents and reports',
          path: '/Finance',
          documentCount: 32,
          size: 89478485,
          permissions: ['read'],
          createdBy: 'Finance Manager',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      return {
        data: mockFolders.slice(0, filters.limit || 10),
        count: mockFolders.length
      }
    } catch (error) {
      console.error('Error fetching folders:', error)
      throw error
    }
  }

  static async getWorkflows(filters: DocumentFilters = {}): Promise<{ data: Workflow[], count: number }> {
    try {
      // Mock data for now - replace with actual Supabase queries
      const mockWorkflows: Workflow[] = [
        {
          id: '1',
          name: 'Document Review Process',
          description: 'Standard document review and approval workflow',
          type: 'approval',
          status: 'active',
          steps: [
            {
              id: '1',
              name: 'Initial Review',
              description: 'First level review',
              order: 1,
              status: 'completed',
              assignedTo: 'Reviewer 1',
              completedBy: 'Reviewer 1',
              completedAt: new Date().toISOString()
            },
            {
              id: '2',
              name: 'Manager Approval',
              description: 'Manager approval required',
              order: 2,
              status: 'in_progress',
              assignedTo: 'Manager'
            }
          ],
          documentId: '1',
          documentName: 'Project Proposal 2024.pdf',
          createdBy: 'John Smith',
          assignedTo: 'Manager',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Policy Update Workflow',
          description: 'Workflow for updating company policies',
          type: 'update',
          status: 'pending',
          steps: [
            {
              id: '3',
              name: 'Content Review',
              description: 'Review policy content',
              order: 1,
              status: 'pending',
              assignedTo: 'Policy Team'
            }
          ],
          documentId: '2',
          documentName: 'Employee Handbook.docx',
          createdBy: 'Sarah Johnson',
          assignedTo: 'Policy Team',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      return {
        data: mockWorkflows.slice(0, filters.limit || 10),
        count: mockWorkflows.length
      }
    } catch (error) {
      console.error('Error fetching workflows:', error)
      throw error
    }
  }

  static async getApprovals(filters: DocumentFilters = {}): Promise<{ data: Approval[], count: number }> {
    try {
      // Mock data for now - replace with actual Supabase queries
      const mockApprovals: Approval[] = [
        {
          id: '1',
          documentId: '1',
          documentName: 'Project Proposal 2024.pdf',
          type: 'content_approval',
          status: 'pending',
          requestedBy: 'John Smith',
          approver: 'Manager',
          requestedDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          documentId: '2',
          documentName: 'Employee Handbook.docx',
          type: 'policy_approval',
          status: 'approved',
          requestedBy: 'Sarah Johnson',
          approver: 'HR Director',
          comments: 'Approved with minor revisions',
          requestedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          approvedDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          documentId: '3',
          documentName: 'Financial Report Q4.xlsx',
          type: 'financial_approval',
          status: 'under_review',
          requestedBy: 'Mike Wilson',
          approver: 'CFO',
          requestedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      return {
        data: mockApprovals.slice(0, filters.limit || 10),
        count: mockApprovals.length
      }
    } catch (error) {
      console.error('Error fetching approvals:', error)
      throw error
    }
  }

  static async getVersionHistory(filters: DocumentFilters = {}): Promise<{ data: VersionHistory[], count: number }> {
    try {
      // Mock data for now - replace with actual Supabase queries
      const mockVersions: VersionHistory[] = [
        {
          id: '1',
          documentId: '1',
          documentName: 'Project Proposal 2024.pdf',
          version: '1.2',
          changes: 'Updated budget section and timeline',
          uploadedBy: 'John Smith',
          size: 2048576,
          url: '/documents/versions/project-proposal-2024-v1.2.pdf',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          documentId: '1',
          documentName: 'Project Proposal 2024.pdf',
          version: '1.1',
          changes: 'Fixed formatting issues',
          uploadedBy: 'John Smith',
          size: 2035200,
          url: '/documents/versions/project-proposal-2024-v1.1.pdf',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          documentId: '2',
          documentName: 'Employee Handbook.docx',
          version: '2.1',
          changes: 'Added remote work policy',
          uploadedBy: 'Sarah Johnson',
          size: 1536000,
          url: '/documents/versions/employee-handbook-v2.1.docx',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      return {
        data: mockVersions.slice(0, filters.limit || 10),
        count: mockVersions.length
      }
    } catch (error) {
      console.error('Error fetching version history:', error)
      throw error
    }
  }

  static async uploadDocument(documentData: FormData): Promise<Document> {
    try {
      // Mock implementation - replace with actual Supabase storage upload
      const file = documentData.get('file') as File
      const newDocument: Document = {
        id: Date.now().toString(),
        name: file.name,
        description: documentData.get('description') as string || '',
        type: file.type,
        size: file.size,
        status: 'draft',
        folderId: documentData.get('folderId') as string,
        folderName: documentData.get('folderName') as string || 'Root',
        uploadedBy: 'Current User',
        version: '1.0',
        tags: [],
        url: `/documents/${file.name}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      return newDocument
    } catch (error) {
      console.error('Error uploading document:', error)
      throw error
    }
  }

  static async createFolder(folderData: Partial<Folder>): Promise<Folder> {
    try {
      // Mock implementation - replace with actual Supabase insert
      const newFolder: Folder = {
        id: Date.now().toString(),
        name: folderData.name || '',
        description: folderData.description,
        parentId: folderData.parentId,
        path: folderData.parentId ? `/Parent/${folderData.name}` : `/${folderData.name}`,
        documentCount: 0,
        size: 0,
        permissions: ['read', 'write'],
        createdBy: 'Current User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      return newFolder
    } catch (error) {
      console.error('Error creating folder:', error)
      throw error
    }
  }

  static async createWorkflow(workflowData: Partial<Workflow>): Promise<Workflow> {
    try {
      // Mock implementation - replace with actual Supabase insert
      const newWorkflow: Workflow = {
        id: Date.now().toString(),
        name: workflowData.name || '',
        description: workflowData.description || '',
        type: workflowData.type || 'approval',
        status: 'pending',
        steps: workflowData.steps || [],
        documentId: workflowData.documentId,
        documentName: workflowData.documentName,
        createdBy: 'Current User',
        assignedTo: workflowData.assignedTo || '',
        dueDate: workflowData.dueDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      return newWorkflow
    } catch (error) {
      console.error('Error creating workflow:', error)
      throw error
    }
  }

  static async requestApproval(approvalData: Partial<Approval>): Promise<Approval> {
    try {
      // Mock implementation - replace with actual Supabase insert
      const newApproval: Approval = {
        id: Date.now().toString(),
        documentId: approvalData.documentId || '',
        documentName: approvalData.documentName || '',
        type: approvalData.type || 'content_approval',
        status: 'pending',
        requestedBy: 'Current User',
        approver: approvalData.approver || '',
        requestedDate: new Date().toISOString(),
        dueDate: approvalData.dueDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      return newApproval
    } catch (error) {
      console.error('Error requesting approval:', error)
      throw error
    }
  }
}