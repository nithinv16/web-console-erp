import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

// Types for Document Management
export interface Document {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  category: string;
  subcategory?: string;
  tags: string[];
  version: number;
  is_current_version: boolean;
  parent_document_id?: string;
  access_level: 'public' | 'private' | 'restricted';
  uploaded_by: string;
  uploaded_by_name?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  download_count: number;
  last_accessed_at?: string;
}

export interface CreateDocumentData {
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  tags?: string[];
  access_level?: 'public' | 'private' | 'restricted';
  metadata?: Record<string, any>;
}

export interface DocumentFolder {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  parent_folder_id?: string;
  path: string;
  access_level: 'public' | 'private' | 'restricted';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFolderData {
  name: string;
  description?: string;
  parent_folder_id?: string;
  access_level?: 'public' | 'private' | 'restricted';
}

export interface DocumentShare {
  id: string;
  document_id: string;
  shared_with_user_id?: string;
  shared_with_email?: string;
  permission: 'view' | 'edit' | 'download';
  expires_at?: string;
  share_token?: string;
  created_by: string;
  created_at: string;
}

export interface CreateShareData {
  document_id: string;
  shared_with_user_id?: string;
  shared_with_email?: string;
  permission: 'view' | 'edit' | 'download';
  expires_at?: string;
}

export interface DocumentComment {
  id: string;
  document_id: string;
  comment: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentApproval {
  id: string;
  document_id: string;
  approver_id: string;
  approver_name?: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approved_at?: string;
  created_at: string;
}

export interface DocumentFilters {
  category?: string;
  subcategory?: string;
  file_type?: string;
  access_level?: string;
  uploaded_by?: string;
  date_from?: string;
  date_to?: string;
  tags?: string[];
  folder_id?: string;
  search?: string;
}

export interface DocumentAnalytics {
  total_documents: number;
  total_size: number;
  documents_by_category: Array<{ category: string; count: number; size: number }>;
  documents_by_type: Array<{ file_type: string; count: number; size: number }>;
  recent_uploads: number;
  most_downloaded: Array<{ document_id: string; name: string; download_count: number }>;
  storage_usage: {
    used: number;
    limit: number;
    percentage: number;
  };
  upload_trend: Array<{ month: string; count: number; size: number }>;
}

class DocumentManagementApi {
  // Document CRUD Operations
  async getDocuments(companyId: string, filters?: DocumentFilters) {
    let query = supabase
      .from('documents')
      .select(`
        *,
        uploaded_by_profile:employees!documents_uploaded_by_fkey(
          first_name,
          last_name
        )
      `)
      .eq('company_id', companyId)
      .eq('is_current_version', true)
      .order('created_at', { ascending: false });

    if (filters) {
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.subcategory) {
        query = query.eq('subcategory', filters.subcategory);
      }
      if (filters.file_type) {
        query = query.eq('file_type', filters.file_type);
      }
      if (filters.access_level) {
        query = query.eq('access_level', filters.access_level);
      }
      if (filters.uploaded_by) {
        query = query.eq('uploaded_by', filters.uploaded_by);
      }
      if (filters.folder_id) {
        query = query.eq('folder_id', filters.folder_id);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map(doc => ({
      ...doc,
      uploaded_by_name: doc.uploaded_by_profile 
        ? `${doc.uploaded_by_profile.first_name} ${doc.uploaded_by_profile.last_name}`
        : null
    }));
  }

  async getDocumentById(id: string) {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        uploaded_by_profile:employees!documents_uploaded_by_fkey(
          first_name,
          last_name
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      ...data,
      uploaded_by_name: data.uploaded_by_profile 
        ? `${data.uploaded_by_profile.first_name} ${data.uploaded_by_profile.last_name}`
        : null
    };
  }

  async uploadDocument(companyId: string, file: File, documentData: CreateDocumentData, folderId?: string) {
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${companyId}/documents/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error } = await supabase
        .from('documents')
        .insert({
          company_id: companyId,
          name: documentData.name,
          description: documentData.description,
          file_path: uploadData.path,
          file_size: file.size,
          file_type: fileExt || 'unknown',
          mime_type: file.type,
          category: documentData.category,
          subcategory: documentData.subcategory,
          tags: documentData.tags || [],
          access_level: documentData.access_level || 'private',
          metadata: documentData.metadata,
          folder_id: folderId,
          version: 1,
          is_current_version: true,
          download_count: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  async updateDocument(id: string, updates: Partial<CreateDocumentData>) {
    const { data, error } = await supabase
      .from('documents')
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

  async deleteDocument(id: string) {
    // Get document details first
    const { data: document } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', id)
      .single();

    if (document) {
      // Delete file from storage
      await supabase.storage
        .from('documents')
        .remove([document.file_path]);
    }

    // Delete document record
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Document Versioning
  async createNewVersion(documentId: string, file: File, description?: string) {
    try {
      // Get original document
      const { data: originalDoc, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;

      // Mark current version as not current
      await supabase
        .from('documents')
        .update({ is_current_version: false })
        .eq('parent_document_id', originalDoc.parent_document_id || documentId)
        .eq('is_current_version', true);

      // Upload new file
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${originalDoc.company_id}/documents/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create new version
      const { data, error } = await supabase
        .from('documents')
        .insert({
          ...originalDoc,
          id: undefined, // Let it generate new ID
          file_path: uploadData.path,
          file_size: file.size,
          file_type: fileExt || 'unknown',
          mime_type: file.type,
          version: originalDoc.version + 1,
          is_current_version: true,
          parent_document_id: originalDoc.parent_document_id || documentId,
          description: description || originalDoc.description,
          download_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating new version:', error);
      throw error;
    }
  }

  async getDocumentVersions(documentId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        uploaded_by_profile:employees!documents_uploaded_by_fkey(
          first_name,
          last_name
        )
      `)
      .or(`id.eq.${documentId},parent_document_id.eq.${documentId}`)
      .order('version', { ascending: false });

    if (error) throw error;

    return data.map(doc => ({
      ...doc,
      uploaded_by_name: doc.uploaded_by_profile 
        ? `${doc.uploaded_by_profile.first_name} ${doc.uploaded_by_profile.last_name}`
        : null
    }));
  }

  // Folder Management
  async getFolders(companyId: string, parentFolderId?: string) {
    let query = supabase
      .from('document_folders')
      .select('*')
      .eq('company_id', companyId)
      .order('name');

    if (parentFolderId) {
      query = query.eq('parent_folder_id', parentFolderId);
    } else {
      query = query.is('parent_folder_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async createFolder(companyId: string, folderData: CreateFolderData) {
    // Build folder path
    let path = folderData.name;
    if (folderData.parent_folder_id) {
      const { data: parentFolder } = await supabase
        .from('document_folders')
        .select('path')
        .eq('id', folderData.parent_folder_id)
        .single();
      
      if (parentFolder) {
        path = `${parentFolder.path}/${folderData.name}`;
      }
    }

    const { data, error } = await supabase
      .from('document_folders')
      .insert({
        company_id: companyId,
        name: folderData.name,
        description: folderData.description,
        parent_folder_id: folderData.parent_folder_id,
        path: path,
        access_level: folderData.access_level || 'private'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateFolder(id: string, updates: Partial<CreateFolderData>) {
    const { data, error } = await supabase
      .from('document_folders')
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

  async deleteFolder(id: string) {
    // Check if folder has documents or subfolders
    const { data: documents } = await supabase
      .from('documents')
      .select('id')
      .eq('folder_id', id)
      .limit(1);

    const { data: subfolders } = await supabase
      .from('document_folders')
      .select('id')
      .eq('parent_folder_id', id)
      .limit(1);

    if (documents && documents.length > 0) {
      throw new Error('Cannot delete folder that contains documents');
    }

    if (subfolders && subfolders.length > 0) {
      throw new Error('Cannot delete folder that contains subfolders');
    }

    const { error } = await supabase
      .from('document_folders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Document Sharing
  async shareDocument(shareData: CreateShareData) {
    const shareToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    const { data, error } = await supabase
      .from('document_shares')
      .insert({
        ...shareData,
        share_token: shareToken
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getDocumentShares(documentId: string) {
    const { data, error } = await supabase
      .from('document_shares')
      .select(`
        *,
        shared_with_user:employees!document_shares_shared_with_user_id_fkey(
          first_name,
          last_name,
          email
        )
      `)
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async revokeShare(shareId: string) {
    const { error } = await supabase
      .from('document_shares')
      .delete()
      .eq('id', shareId);

    if (error) throw error;
  }

  // Document Comments
  async addComment(documentId: string, comment: string) {
    const { data, error } = await supabase
      .from('document_comments')
      .insert({
        document_id: documentId,
        comment: comment
      })
      .select(`
        *,
        created_by_profile:employees!document_comments_created_by_fkey(
          first_name,
          last_name
        )
      `)
      .single();

    if (error) throw error;

    return {
      ...data,
      created_by_name: data.created_by_profile 
        ? `${data.created_by_profile.first_name} ${data.created_by_profile.last_name}`
        : null
    };
  }

  async getDocumentComments(documentId: string) {
    const { data, error } = await supabase
      .from('document_comments')
      .select(`
        *,
        created_by_profile:employees!document_comments_created_by_fkey(
          first_name,
          last_name
        )
      `)
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(comment => ({
      ...comment,
      created_by_name: comment.created_by_profile 
        ? `${comment.created_by_profile.first_name} ${comment.created_by_profile.last_name}`
        : null
    }));
  }

  async deleteComment(commentId: string) {
    const { error } = await supabase
      .from('document_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
  }

  // Document Approval Workflow
  async requestApproval(documentId: string, approverIds: string[]) {
    const approvals = approverIds.map(approverId => ({
      document_id: documentId,
      approver_id: approverId,
      status: 'pending' as const
    }));

    const { data, error } = await supabase
      .from('document_approvals')
      .insert(approvals)
      .select(`
        *,
        approver:employees!document_approvals_approver_id_fkey(
          first_name,
          last_name
        )
      `);

    if (error) throw error;

    return data.map(approval => ({
      ...approval,
      approver_name: approval.approver 
        ? `${approval.approver.first_name} ${approval.approver.last_name}`
        : null
    }));
  }

  async approveDocument(approvalId: string, comments?: string) {
    const { data, error } = await supabase
      .from('document_approvals')
      .update({
        status: 'approved',
        comments: comments,
        approved_at: new Date().toISOString()
      })
      .eq('id', approvalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async rejectDocument(approvalId: string, comments: string) {
    const { data, error } = await supabase
      .from('document_approvals')
      .update({
        status: 'rejected',
        comments: comments,
        approved_at: new Date().toISOString()
      })
      .eq('id', approvalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getDocumentApprovals(documentId: string) {
    const { data, error } = await supabase
      .from('document_approvals')
      .select(`
        *,
        approver:employees!document_approvals_approver_id_fkey(
          first_name,
          last_name
        )
      `)
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(approval => ({
      ...approval,
      approver_name: approval.approver 
        ? `${approval.approver.first_name} ${approval.approver.last_name}`
        : null
    }));
  }

  // Download and Access
  async downloadDocument(documentId: string) {
    // Update download count and last accessed
    await supabase
      .from('documents')
      .update({
        download_count: supabase.sql`download_count + 1`,
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', documentId);

    // Get document details
    const { data: document, error } = await supabase
      .from('documents')
      .select('file_path, name')
      .eq('id', documentId)
      .single();

    if (error) throw error;

    // Get download URL
    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(document.file_path, 3600); // 1 hour expiry

    return {
      url: data?.signedUrl,
      filename: document.name
    };
  }

  async getDocumentPreviewUrl(documentId: string) {
    const { data: document, error } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', documentId)
      .single();

    if (error) throw error;

    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(document.file_path, 300); // 5 minutes for preview

    return data?.signedUrl;
  }

  // Analytics and Reporting
  async getDocumentAnalytics(companyId: string): Promise<DocumentAnalytics> {
    // Get total documents and size
    const { data: totalStats } = await supabase
      .from('documents')
      .select('file_size')
      .eq('company_id', companyId)
      .eq('is_current_version', true);

    const totalDocuments = totalStats?.length || 0;
    const totalSize = totalStats?.reduce((sum, doc) => sum + (doc.file_size || 0), 0) || 0;

    // Get documents by category
    const { data: categoryStats } = await supabase
      .rpc('get_documents_by_category', { p_company_id: companyId });

    // Get documents by file type
    const { data: typeStats } = await supabase
      .rpc('get_documents_by_type', { p_company_id: companyId });

    // Get recent uploads (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: recentUploads } = await supabase
      .from('documents')
      .select('id')
      .eq('company_id', companyId)
      .eq('is_current_version', true)
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Get most downloaded documents
    const { data: mostDownloaded } = await supabase
      .from('documents')
      .select('id, name, download_count')
      .eq('company_id', companyId)
      .eq('is_current_version', true)
      .order('download_count', { ascending: false })
      .limit(10);

    // Get upload trend (last 12 months)
    const { data: uploadTrend } = await supabase
      .rpc('get_monthly_upload_trend', { p_company_id: companyId });

    return {
      total_documents: totalDocuments,
      total_size: totalSize,
      documents_by_category: categoryStats || [],
      documents_by_type: typeStats || [],
      recent_uploads: recentUploads?.length || 0,
      most_downloaded: mostDownloaded || [],
      storage_usage: {
        used: totalSize,
        limit: 10 * 1024 * 1024 * 1024, // 10GB default limit
        percentage: (totalSize / (10 * 1024 * 1024 * 1024)) * 100
      },
      upload_trend: uploadTrend || []
    };
  }

  // Utility Functions
  async getDocumentCategories() {
    const categories = [
      'Contracts',
      'Invoices',
      'Reports',
      'Policies',
      'Procedures',
      'Forms',
      'Presentations',
      'Spreadsheets',
      'Images',
      'Videos',
      'Audio',
      'Archives',
      'Other'
    ];
    return categories;
  }

  async getDocumentsByEmployee(companyId: string, employeeId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('company_id', companyId)
      .eq('uploaded_by', employeeId)
      .eq('is_current_version', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async searchDocuments(companyId: string, searchTerm: string) {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        uploaded_by_profile:employees!documents_uploaded_by_fkey(
          first_name,
          last_name
        )
      `)
      .eq('company_id', companyId)
      .eq('is_current_version', true)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,tags.cs.{"${searchTerm}"}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(doc => ({
      ...doc,
      uploaded_by_name: doc.uploaded_by_profile 
        ? `${doc.uploaded_by_profile.first_name} ${doc.uploaded_by_profile.last_name}`
        : null
    }));
  }

  async getRecentDocuments(companyId: string, limit: number = 10) {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        uploaded_by_profile:employees!documents_uploaded_by_fkey(
          first_name,
          last_name
        )
      `)
      .eq('company_id', companyId)
      .eq('is_current_version', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map(doc => ({
      ...doc,
      uploaded_by_name: doc.uploaded_by_profile 
        ? `${doc.uploaded_by_profile.first_name} ${doc.uploaded_by_profile.last_name}`
        : null
    }));
  }

  async getDocumentHistory(documentId: string) {
    const { data, error } = await supabase
      .from('document_audit_trail')
      .select(`
        *,
        changed_by_profile:employees!document_audit_trail_changed_by_fkey(
          first_name,
          last_name
        )
      `)
      .eq('document_id', documentId)
      .order('changed_at', { ascending: false });

    if (error) throw error;

    return data.map(entry => ({
      ...entry,
      changed_by_name: entry.changed_by_profile 
        ? `${entry.changed_by_profile.first_name} ${entry.changed_by_profile.last_name}`
        : null
    }));
  }
}

export const documentManagementApi = new DocumentManagementApi();
export default documentManagementApi;