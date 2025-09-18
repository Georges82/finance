// Shared types for the application

export interface Admin {
  id: string;
  admin_first_name: string;
  admin_last_name: string;
  admin_email: string;
  admin_username: string;
  admin_role: string;
  createdAt: string;
}

export interface AdminFormData {
  admin_first_name: string;
  admin_last_name: string;
  admin_email: string;
  admin_username: string;
  admin_password: string;
  confirmPassword: string;
  admin_role: 'admin' | 'super admin';
}

// API Response types
export interface ApiResponse<T = any> {
  status: 'Success' | 'Failed';
  message: string;
  data?: T;
  total_count?: number;
}

export interface AdminApiResponse extends ApiResponse<Admin[]> {
  data: Admin[];
  total_count: number;
}
