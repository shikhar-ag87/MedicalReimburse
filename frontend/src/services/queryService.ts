// Query/Communication service for admin-user interactions
import { apiService } from "./api";

export interface Query {
  id: string;
  application_id: string;
  subject: string;
  status: 'open' | 'user_replied' | 'admin_replied' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_by: string;
  created_by_role: string;
  employee_email: string;
  access_token: string;
  token_expires_at: string;
  total_messages: number;
  unread_by_admin: boolean;
  unread_by_user: boolean;
  last_message_at: string;
  last_message_by: 'admin' | 'user';
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolved_by?: string;
  medical_applications?: {
    application_number: string;
    employee_name: string;
    employee_email: string;
    department?: string;
    total_amount_claimed?: number;
  };
}

export interface QueryMessage {
  id: string;
  query_id: string;
  message: string;
  sender_type: 'admin' | 'user';
  sender_id?: string;
  sender_name: string;
  sender_role?: string;
  is_internal_note: boolean;
  read_by_recipient: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface QueryAttachment {
  id: string;
  query_id: string;
  message_id?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: 'admin' | 'user';
  uploader_id?: string;
  uploader_name: string;
  created_at: string;
}

export interface CreateQueryData {
  applicationId: string;
  subject: string;
  message: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface QueryDetails {
  query: Query;
  messages: QueryMessage[];
  attachments: QueryAttachment[];
}

export interface QueryStats {
  unread_count: number;
  open_count: number;
  user_replied_count: number;
}

class QueryService {
  // Create a new query
  async createQuery(data: CreateQueryData): Promise<any> {
    const response = await apiService.post<any>('/queries/create', data);
    return response.data;
  }

  // Get all queries for an application
  async getQueriesForApplication(applicationId: string): Promise<Query[]> {
    const response = await apiService.get<Query[]>(`/queries/application/${applicationId}`);
    return response.data || [];
  }

  // Get all queries (for admin dashboard)
  async getAllQueries(filters?: { status?: string; role?: string }): Promise<Query[]> {
    const response = await apiService.get<Query[]>('/queries/all', filters);
    return response.data || [];
  }

  // Get query details with messages and attachments
  async getQueryDetails(queryId: string): Promise<QueryDetails> {
    const response = await apiService.get<QueryDetails>(`/queries/${queryId}`);
    return response.data!;
  }

  // Reply to a query
  async replyToQuery(queryId: string, message: string, isInternalNote = false): Promise<QueryMessage> {
    const response = await apiService.post<QueryMessage>(`/queries/${queryId}/reply`, {
      message,
      isInternalNote,
    });
    return response.data!;
  }

  // Resolve a query
  async resolveQuery(queryId: string): Promise<Query> {
    const response = await apiService.patch<Query>(`/queries/${queryId}/resolve`);
    return response.data!;
  }

  // Reopen a query
  async reopenQuery(queryId: string): Promise<Query> {
    const response = await apiService.patch<Query>(`/queries/${queryId}/reopen`);
    return response.data!;
  }

  // Get query stats
  async getQueryStats(): Promise<QueryStats> {
    const response = await apiService.get<QueryStats>('/queries/stats/unread');
    return response.data!;
  }

  // PUBLIC APIs (no auth required)

  // Get query by token (public)
  async getQueryByToken(token: string): Promise<QueryDetails> {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const response = await fetch(`${API_URL}/queries/public/${token}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch query' }));
      throw new Error(error.error || 'Failed to fetch query');
    }
    return response.json();
  }

  // Reply to query (public)
  async replyToQueryPublic(token: string, message: string, userName: string): Promise<QueryMessage> {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const response = await fetch(`${API_URL}/queries/public/${token}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, userName }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to reply' }));
      throw new Error(error.error || 'Failed to reply');
    }
    return response.json();
  }

  // Upload attachment (public)
  async uploadAttachmentPublic(
    token: string,
    file: File,
    userName: string,
    messageId?: string
  ): Promise<QueryAttachment> {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userName', userName);
    if (messageId) formData.append('messageId', messageId);

    const response = await fetch(`${API_URL}/queries/public/${token}/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to upload file' }));
      throw new Error(error.error || 'Failed to upload file');
    }
    return response.json();
  }
}

export const queryService = new QueryService();
