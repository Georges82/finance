// Environment-aware API configuration
const getApiBaseUrl = () => {
  // Check for environment variable first (production)
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  
  // Development fallback
  return 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();
const API_PREFIX = '/api/v1';

console.log('API Service initialized with base URL:', API_BASE_URL);
console.log('Environment:', process.env.NODE_ENV);

export interface AdminCreatePayload {
  admin_email: string;
  admin_username: string;
  admin_password: string;
  admin_first_name: string;
  admin_last_name: string;
  admin_role: 'admin' | 'super admin';
  status?: 'active' | 'deleted';
}

export interface AdminUpdatePayload {
  admin_email?: string;
  admin_username?: string;
  admin_password?: string;
  admin_first_name?: string;
  admin_last_name?: string;
  admin_role?: 'admin' | 'super admin';
  status?: 'active' | 'deleted';
}

export interface LoginPayload {
  email_or_username: string;
  password: string;
}

// Chatter Management Interfaces
export interface ChatterCreatePayload {
  name: string;
  telegram_username: string;
  country: string;
  shift: 'A' | 'B' | 'C';
  notes?: string;
  status?: 'active' | 'inactive';
  payment_status?: 'Paid' | 'Not Paid';
}

export interface ChatterUpdatePayload {
  name?: string;
  telegram_username?: string;
  country?: string;
  shift?: 'A' | 'B' | 'C';
  notes?: string;
  status?: 'active' | 'inactive';
  payment_status?: 'Paid' | 'Not Paid';
  last_salary_period?: string;
  amount_for_period?: number;
}

export interface ChatterRatePayload {
  models_count: number;
  hourly_rate: number;
}

export interface ChatterRateUpdatePayload {
  rates: ChatterRatePayload[];
}

export interface Chatter {
  chatter_id: string;
  name: string;
  telegram_username: string;
  country: string;
  shift: 'A' | 'B' | 'C';
  status: 'active' | 'inactive';
  notes?: string;
  last_salary_period?: string;
  amount_for_period?: number;
  payment_status: 'Paid' | 'Not Paid';
  created_at?: string;
  updated_at?: string;
  rates?: ChatterRate[];
}

export interface ChatterRate {
  rate_id: string;
  chatter_id: string;
  models_count: number;
  hourly_rate: number;
  created_at?: string;
  updated_at?: string;
}

// Manager Management Interfaces
export interface ManagerCreatePayload {
  name: string;
  role: 'Manager' | 'Team Leader';
  telegram_username: string;
  email?: string;
  phone?: string;
  status?: 'Active' | 'Inactive';
  salary_type: 'Commission-based' | 'Fixed';
  revenue_threshold?: number;
  commission_rate?: number;
  fixed_salary?: number;
  assigned_models?: string[];
}

export interface ManagerUpdatePayload {
  name?: string;
  role?: 'Manager' | 'Team Leader';
  telegram_username?: string;
  email?: string;
  phone?: string;
  status?: 'Active' | 'Inactive';
  salary_type?: 'Commission-based' | 'Fixed';
  revenue_threshold?: number;
  commission_rate?: number;
  fixed_salary?: number;
  assigned_models?: string[];
}

export interface Manager {
  manager_id: string;
  name: string;
  role: 'Manager' | 'Team Leader';
  telegram_username: string;
  email?: string;
  phone?: string;
  status: 'Active' | 'Inactive';
  salary_type: 'Commission-based' | 'Fixed';
  revenue_threshold?: number;
  commission_rate?: number;
  fixed_salary?: number;
  assigned_models: string[];
  created_at?: string;
  updated_at?: string;
}

// Assistant Management Interfaces
export interface AssistantCreatePayload {
  name: string;
  telegram_username: string;
  status?: 'Active' | 'Inactive';
  salary_type: 'Fixed';
  fixed_salary: number;
  salary_period: 'Weekly' | 'Bi-weekly' | 'Monthly';
}

export interface AssistantUpdatePayload {
  name?: string;
  telegram_username?: string;
  status?: 'Active' | 'Inactive';
  fixed_salary?: number;
  salary_period?: 'Weekly' | 'Bi-weekly' | 'Monthly';
}

export interface Assistant {
  assistant_id: string;
  name: string;
  telegram_username: string;
  status: 'Active' | 'Inactive';
  salary_type: 'Fixed';
  fixed_salary: number;
  salary_period: 'Weekly' | 'Bi-weekly' | 'Monthly';
  created_at?: string;
  updated_at?: string;
}

export interface TeamLeader {
  manager_id: string;
  name: string;
  role: 'Team Leader';
  telegram_username: string;
  status: 'Active' | 'Inactive';
  salary_type: 'Commission-based' | 'Fixed';
  revenue_threshold: number;
  commission_rate: number;
  fixed_salary: number;
  assigned_models: string[];
  created_at?: string;
  updated_at?: string;
}

// Model Management Interfaces
export interface ModelCreatePayload {
  modelName: string;
  clientAgencyName: string;
  managerName: string;
  teamLeader: string;
  referencedModels?: string[];
  status?: 'Active' | 'Inactive';
  notes?: string;
  earningsType: 'Type 1' | 'Type 2';
  cutLogic: {
    percentage1?: number;
    threshold?: number;
    fixedAmount?: number;
    percentage2?: number;
  };
  commissionRules: {
    baseCommission: number;
    bonusEnabled: boolean;
    bonusThreshold?: number;
    bonusCommission?: number;
  };
  paymentStatus?: 'Paid' | 'Not Paid';
}

export interface ModelUpdatePayload extends Partial<ModelCreatePayload> {}

export interface ModelRecord {
  model_id: string;
  modelName: string;
  clientAgencyName: string;
  managerName: string;
  teamLeader: string;
  referencedModels: string[];
  status: 'Active' | 'Inactive';
  notes?: string;
  earningsType: 'Type 1' | 'Type 2';
  cutLogic: {
    percentage1?: number;
    threshold?: number;
    fixedAmount?: number;
    percentage2?: number;
  };
  commissionRules: {
    baseCommission: number;
    bonusEnabled: boolean;
    bonusThreshold?: number;
    bonusCommission?: number;
  };
  paymentStatus: 'Paid' | 'Not Paid';
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T = any> {
  status: 'Success' | 'Failed';
  message: string;
  data?: T;
  total_count?: number;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}${API_PREFIX}`;
    console.log('API Service initialized with base URL:', this.baseUrl);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get token from cookies instead of localStorage
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };
    
    const token = getCookie('access_token');
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }), // Add token if available
        ...options.headers,
      },
      credentials: 'include', // Include cookies for authentication
    };

    console.log(`Making API request to: ${url}`);
    console.log('Request options:', { ...defaultOptions, ...options });
    
    // Debug cookies and token
    console.log('Current cookies:', document.cookie);
    console.log('Auth token:', token ? 'Present' : 'Missing');

    try {
      const response = await fetch(url, {
        ...defaultOptions,
        ...options,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        // Handle authentication errors specifically
        if (response.status === 403) {
          throw new Error('Authentication failed. Please log in again.');
        }
        
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response data:', data);
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Admin Management APIs
  async registerAdmin(payload: AdminCreatePayload): Promise<ApiResponse> {
    return this.request('/admin/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async loginAdmin(payload: LoginPayload): Promise<ApiResponse> {
    return this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async logoutAdmin(): Promise<ApiResponse> {
    return this.request('/admin/logout', {
      method: 'GET',
    });
  }

  async getAdminDetails(identifier: string): Promise<ApiResponse> {
    return this.request(`/admin/details?identifier=${encodeURIComponent(identifier)}`);
  }

  async getAllAdmins(params: {
    limit?: number;
    offset?: number;
    query?: string;
    sort?: string;
    sort_by?: string;
  } = {}): Promise<ApiResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request(`/admin/get_all_admin?${searchParams.toString()}`);
  }

  async updateAdmin(adminId: string, payload: AdminUpdatePayload): Promise<ApiResponse> {
    return this.request(`/admin/update?admin_id=${encodeURIComponent(adminId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteAdmin(adminId: string): Promise<ApiResponse> {
    return this.request(`/admin/delete?admin_id=${encodeURIComponent(adminId)}`, {
      method: 'DELETE',
    });
  }

  // Chatter Management APIs
  async createChatter(payload: ChatterCreatePayload): Promise<ApiResponse<Chatter>> {
    return this.request('/chatter/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getAllChatters(params: {
    limit?: number;
    offset?: number;
    query?: string;
    sort?: string;
    sort_by?: string;
    status_filter?: string;
  } = {}): Promise<ApiResponse<Chatter[]>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request(`/chatter/list?${searchParams.toString()}`);
  }

  async getChattersWithSalaryData(params: {
    limit?: number;
    offset?: number;
    query?: string;
    sort?: string;
    sort_by?: string;
  } = {}): Promise<ApiResponse<Chatter[]>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request(`/chatter/list-with-salary?${searchParams.toString()}`);
  }

  async getChatterDetails(chatterId: string): Promise<ApiResponse<Chatter>> {
    return this.request(`/chatter/details?chatter_id=${encodeURIComponent(chatterId)}`);
  }

  async updateChatter(chatterId: string, payload: ChatterUpdatePayload): Promise<ApiResponse> {
    return this.request(`/chatter/update?chatter_id=${encodeURIComponent(chatterId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteChatter(chatterId: string): Promise<ApiResponse> {
    return this.request(`/chatter/delete?chatter_id=${encodeURIComponent(chatterId)}`, {
      method: 'DELETE',
    });
  }

  async getChatterRates(chatterId: string): Promise<ApiResponse<ChatterRate[]>> {
    return this.request(`/chatter/rates?chatter_id=${encodeURIComponent(chatterId)}`);
  }

  async addChatterRate(chatterId: string, payload: ChatterRatePayload): Promise<ApiResponse> {
    return this.request(`/chatter/rate/add?chatter_id=${encodeURIComponent(chatterId)}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateChatterRates(chatterId: string, payload: ChatterRateUpdatePayload): Promise<ApiResponse> {
    return this.request(`/chatter/rate/update?chatter_id=${encodeURIComponent(chatterId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteChatterRate(rateId: string): Promise<ApiResponse> {
    return this.request(`/chatter/rate/delete?rate_id=${encodeURIComponent(rateId)}`, {
      method: 'DELETE',
    });
  }

  async updateChatterPayoutStatus(
    chatterId: string, 
    period: string, 
    year?: number, 
    paymentStatus: string = 'Not Paid'
  ): Promise<ApiResponse> {
    const params = new URLSearchParams({
      chatter_id: chatterId,
      period: period,
      payment_status: paymentStatus,
      ...(year && { year: year.toString() })
    });
    return this.request(`/payouts/update?${params.toString()}`, {
      method: 'PUT',
    });
  }

  // Manager Management APIs
  async createManager(payload: ManagerCreatePayload): Promise<ApiResponse<{ manager_id: string }>> {
    return this.request('/manager/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getAllManagers(params: {
    limit?: number;
    offset?: number;
    query?: string;
    sort?: string;
    sort_by?: string;
  } = {}): Promise<ApiResponse<Manager[]>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request(`/manager/list?${searchParams.toString()}`);
  }

  async getManagersWithPeriodSalaries(periods: string[], year?: number): Promise<ApiResponse<{
    managers: Manager[];
    periods: string[];
    year: number;
  }>> {
    const queryParams = new URLSearchParams();
    queryParams.append('periods', periods.join(','));
    if (year) queryParams.append('year', year.toString());

    return this.request(`/managers/with-salaries?${queryParams.toString()}`);
  }

  async getManagerDetails(managerId: string): Promise<ApiResponse<Manager>> {
    return this.request(`/manager/details?manager_id=${encodeURIComponent(managerId)}`);
  }

  async updateManager(managerId: string, payload: ManagerUpdatePayload): Promise<ApiResponse> {
    return this.request(`/manager/update?manager_id=${encodeURIComponent(managerId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteManager(managerId: string): Promise<ApiResponse> {
    return this.request(`/manager/delete?manager_id=${encodeURIComponent(managerId)}`, {
      method: 'DELETE',
    });
  }

  // Team Leader APIs (separate table)
  async getAllTeamLeaders(params: {
    limit?: number;
    offset?: number;
    query?: string;
    sort?: string;
    sort_by?: string;
  } = {}): Promise<ApiResponse<TeamLeader[]>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request(`/team-leader/list?${searchParams.toString()}`);
  }

  async createTeamLeader(payload: Partial<TeamLeader> & { name: string; telegram_username: string }): Promise<ApiResponse<{ team_leader_id: string }>> {
    return this.request('/team-leader/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateTeamLeader(teamLeaderId: string, payload: Partial<TeamLeader>): Promise<ApiResponse> {
    return this.request(`/team-leader/update?team_leader_id=${encodeURIComponent(teamLeaderId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteTeamLeader(teamLeaderId: string): Promise<ApiResponse> {
    return this.request(`/team-leader/delete?team_leader_id=${encodeURIComponent(teamLeaderId)}`, {
      method: 'DELETE',
    });
  }

  async getTeamLeaderDetails(teamLeaderId: string): Promise<ApiResponse<TeamLeader>> {
    return this.request(`/team-leader/details?team_leader_id=${encodeURIComponent(teamLeaderId)}`);
  }

  // Assistant Management APIs
  async createAssistant(payload: AssistantCreatePayload): Promise<ApiResponse<Assistant>> {
    return this.request('/assistant/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getAllAssistants(params: {
    limit?: number;
    offset?: number;
    query?: string;
    sort?: string;
    sort_by?: string;
  } = {}): Promise<ApiResponse<Assistant[]>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request(`/assistant/list?${searchParams.toString()}`);
  }

  async getAssistantDetails(assistantId: string): Promise<ApiResponse<Assistant>> {
    return this.request(`/assistant/details?assistant_id=${encodeURIComponent(assistantId)}`);
  }

  async updateAssistant(assistantId: string, payload: AssistantUpdatePayload): Promise<ApiResponse> {
    return this.request(`/assistant/update?assistant_id=${encodeURIComponent(assistantId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteAssistant(assistantId: string): Promise<ApiResponse> {
    return this.request(`/assistant/delete?assistant_id=${encodeURIComponent(assistantId)}`, {
      method: 'DELETE',
    });
  }

  // Reports Management APIs
  async getReportsPeriods(year?: number): Promise<ApiResponse<{
    periods: Array<{
      label: string;
      year: number;
      start: string;
      end: string;
      week1_start: string;
      week1_end: string;
      week2_start: string;
      week2_end: string;
    }>;
    current_period: string;
    year: number;
  }>> {
    const params = year ? `?year=${year}` : '';
    return this.request(`/reports/periods${params}`);
  }

  async getChatterWeeklyReport(
    chatterId: string, 
    period: string, 
    year?: number, 
    week: number = 1
  ): Promise<ApiResponse<Array<{
    report_id: string;
    work_date: string;
    chatter_id: string;
    model_id: string;
    hours: number;
    net_sales: number;
    period: string;
    year: number;
    week: number;
    row_total: number;
  }>>> {
    const params = new URLSearchParams({
      chatter_id: chatterId,
      period: period,
      week: week.toString(),
      ...(year && { year: year.toString() })
    });
    return this.request(`/reports/week/get?${params.toString()}`);
  }

  async saveChatterWeeklyReport(payload: {
    chatter_id: string;
    period: string;
    year: number;
    week: number;
    date_rows: Array<{
      date: string;
      rows: Array<{
        model_id: string;
        hours: number;
        net_sales: number;
      }>;
    }>;
  }): Promise<ApiResponse<{
    hours_total: number;
    hourly_pay_total: number;
    commission_total: number;
    total_payout: number;
  }>> {
    return this.request('/reports/week/save', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getReportsSummary(
    period: string, 
    year?: number, 
    week?: number
  ): Promise<ApiResponse<{
    total_payout: number;
    items: Array<{
      summary_id: string;
      chatter_id: string;
      period: string;
      year: number;
      week: number;
      hours_total: number;
      hourly_pay_total: number;
      commission_total: number;
      total_payout: number;
    }>;
  }>> {
    const params = new URLSearchParams({
      period: period,
      ...(year && { year: year.toString() }),
      ...(week && { week: week.toString() })
    });
    return this.request(`/reports/summary?${params.toString()}`);
  }

  async getChatterSalaryData(
    chatterId: string,
    period: string, 
    year?: number
  ): Promise<ApiResponse<{
    chatter_id: string;
    period: string;
    year: number;
    week1_salary: number;
    week2_salary: number;
    total_salary: number;
    week1_data: any;
    week2_data: any;
  }>> {
    const params = new URLSearchParams({
      chatter_id: chatterId,
      period: period,
      ...(year && { year: year.toString() })
    });
    return this.request(`/reports/chatter-salary?${params.toString()}`);
  }

  async getChatterPayouts(
    period: string, 
    year?: number
  ): Promise<ApiResponse<Array<{
    payout_id: string;
    chatter_id: string;
    period: string;
    year: number;
    week1_amount: number;
    week2_amount: number;
    total_amount: number;
    payment_status: string;
  }>>> {
    const params = new URLSearchParams({
      period: period,
      ...(year && { year: year.toString() })
    });
    return this.request(`/payouts/list?${params.toString()}`);
  }

  // Salary Management APIs
  async getManagerSalaryPeriods(year?: number): Promise<ApiResponse> {
    const params = year ? `?year=${year}` : '';
    return this.request(`/manager/salary/periods${params}`);
  }

  async calculateManagerSalary(managerId: string, period: string, year?: number): Promise<ApiResponse> {
    const params = new URLSearchParams({
      manager_id: managerId,
      period: period,
      ...(year && { year: year.toString() })
    });
    return this.request(`/manager/salary/calculate?${params.toString()}`, {
      method: 'POST',
    });
  }

  async getAssistantSalaryPeriods(year?: number): Promise<ApiResponse> {
    const params = year ? `?year=${year}` : '';
    return this.request(`/assistant/salary/periods${params}`);
  }

  async calculateAssistantSalary(assistantId: string, period: string, year?: number): Promise<ApiResponse> {
    const params = new URLSearchParams({
      assistant_id: assistantId,
      period: period,
      ...(year && { year: year.toString() })
    });
    return this.request(`/assistant/salary/calculate?${params.toString()}`, {
      method: 'POST',
    });
  }

  async getAssistantsWithPeriodSalaries(periods: string[], year?: number): Promise<ApiResponse> {
    const params = new URLSearchParams({
      periods: periods.join(','),
      ...(year && { year: year.toString() })
    });
    return this.request(`/assistants/with-salaries?${params.toString()}`);
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/');
  }

  // Model Management APIs
  async createModel(payload: ModelCreatePayload): Promise<ApiResponse<{ model_id: string }>> {
    return this.request('/model/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getAllModels(params: {
    limit?: number;
    offset?: number;
    query?: string;
    sort?: string;
    sort_by?: string;
    status_filter?: string;
    client_agency_name?: string;
    manager_name?: string;
    team_leader?: string;
  } = {}): Promise<ApiResponse<ModelRecord[]>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request(`/model/list?${searchParams.toString()}`);
  }

  async getModelDetails(modelId: string): Promise<ApiResponse<ModelRecord>> {
    return this.request(`/model/details?model_id=${encodeURIComponent(modelId)}`);
  }

  async updateModel(modelId: string, payload: ModelUpdatePayload): Promise<ApiResponse> {
    return this.request(`/model/update?model_id=${encodeURIComponent(modelId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteModel(modelId: string): Promise<ApiResponse> {
    return this.request(`/model/delete?model_id=${encodeURIComponent(modelId)}`, {
      method: 'DELETE',
    });
  }

  // Insights Management APIs
  async getAgencyInsights(
    period: string, 
    year?: number, 
    week?: number
  ): Promise<ApiResponse<{
    revenue: number;
    real_revenue: number;
    cost: number;
    profit: number;
    real_profit: number;
    metadata?: {
      scope_type: string;
      month?: string;
      period?: string;
      periods_included?: string[];
    };
  }>> {
    const params = new URLSearchParams({
      period: period,
      ...(year && { year: year.toString() }),
      ...(week && { week: week.toString() })
    });
    return this.request(`/insights/agency?${params.toString()}`);
  }

  async getDashboardKPIs(
    period: string, 
    year?: number, 
    week?: number
  ): Promise<ApiResponse<{
    total_chatters: number;
    total_models: number;
    total_clients: number;
    snapshot: {
      revenue: number;
      real_revenue: number;
      cost: number;
      profit: number;
      real_profit: number;
      metadata?: {
        scope_type: string;
        month?: string;
        period?: string;
        periods_included?: string[];
      };
    };
    month_kpis?: {
      period_breakdown: {
        period_1: {
          revenue: number;
          real_revenue: number;
          cost: number;
          profit: number;
          real_profit: number;
        };
        period_2: {
          revenue: number;
          real_revenue: number;
          cost: number;
          profit: number;
          real_profit: number;
        };
      };
      growth_metrics: {
        revenue_growth_pct: number;
        profit_growth_pct: number;
        revenue_growth_abs: number;
        profit_growth_abs: number;
      };
      month: string;
      year: number;
    };
  }>> {
    const params = new URLSearchParams({
      period: period,
      ...(year && { year: year.toString() }),
      ...(week && { week: week.toString() })
    });
    return this.request(`/dashboard/kpis?${params.toString()}`);
  }

  async getModelInsights(
    modelId: string, 
    period: string, 
    year?: number, 
    week?: number
  ): Promise<ApiResponse<{
    revenue: number;
    real_revenue: number;
    cost: number;
    profit: number;
    real_profit: number;
    metadata?: {
      scope_type: string;
      month?: string;
      period?: string;
      periods_included?: string[];
    };
  }>> {
    const params = new URLSearchParams({
      period: period,
      ...(year && { year: year.toString() }),
      ...(week && { week: week.toString() })
    });
    return this.request(`/insights/model/${modelId}?${params.toString()}`);
  }

  async getModelCostBreakdown(
    modelId: string,
    period: string,
    year?: number,
    week?: number
  ): Promise<ApiResponse<{
    model_id: string;
    period: string;
    year: number;
    chatter_cost: number;
    tl_cost: number;
    manager_cost: number;
    assistant_cost: number;
    total_cost: number;
  }>> {
    const params = new URLSearchParams({
      period: period,
      ...(year && { year: year.toString() }),
      ...(week && { week: week.toString() })
    });
    return this.request(`/insights/model/cost-breakdown/${modelId}?${params.toString()}`);
  }

  async getLeaderboards(
    period: string, 
    year?: number, 
    week?: number
  ): Promise<ApiResponse<{
    top_model_by_revenue: Array<{ id: string; value: number }>;
    top_model_by_profit: Array<{ id: string; value: number }>;
    most_expensive_chatter: Array<{ id: string; value: number }>;
    month_leaderboards?: {
      period_1_top_model: Array<{ id: string; value: number }>;
      period_2_top_model: Array<{ id: string; value: number }>;
      period_1_top_profit: Array<{ id: string; value: number }>;
      period_2_top_profit: Array<{ id: string; value: number }>;
      month: string;
      year: number;
    };
  }>> {
    const params = new URLSearchParams({
      period: period,
      ...(year && { year: year.toString() }),
      ...(week && { week: week.toString() })
    });
    return this.request(`/dashboard/leaderboards?${params.toString()}`);
  }

  async listInvoices(params: {
    model_id?: string;
    period?: string;
    year?: number;
    week?: number;
  } = {}): Promise<ApiResponse<Array<{
    invoice_id: string;
    model_id: string;
    period: string;
    year: number;
    week?: number;
    net_amount: number;
    invoice_amount: number;
    status: string;
    notes?: string;
    created_at: string;
    updated_at?: string;
  }>>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    return this.request(`/invoices/list?${queryParams.toString()}`);
  }

  async createInvoice(payload: {
    model_id: string;
    period: string;
    year: number;
    week?: number;
    net_amount: number;
    invoice_amount?: number;
    status?: string;
    notes?: string;
  }): Promise<ApiResponse> {
    return this.request('/invoice/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateInvoice(
    invoiceId: string, 
    updates: {
      net_amount?: number;
      invoice_amount?: number;
      status?: string;
      notes?: string;
    },
    autoCalculate: boolean = false
  ): Promise<ApiResponse> {
    return this.request(`/invoice/update?invoice_id=${encodeURIComponent(invoiceId)}&auto_calculate=${autoCalculate}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async calculateInvoice(
    invoiceData: {
      model_id: string;
      net_amount: number;
      reference_children?: Array<{
        model_id: string;
        net_sales: number;
      }>;
    }
  ): Promise<ApiResponse> {
    return this.request('/invoice/calculate', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  }

  async recomputeStaffCosts(
    period: string, 
    year?: number, 
    week?: number
  ): Promise<ApiResponse> {
    const params = new URLSearchParams({
      period: period,
      ...(year && { year: year.toString() }),
      ...(week && { week: week.toString() })
    });
    return this.request(`/insights/recompute-costs?${params.toString()}`, {
      method: 'POST',
    });
  }

  async recomputeStaffCostsMonth(
    month: string,
    year: number
  ): Promise<ApiResponse> {
    const params = new URLSearchParams({
      month: month,
      year: year.toString()
    });
    return this.request(`/recompute-costs-month?${params.toString()}`, {
      method: 'POST',
    });
  }

  async saveAgencyInsights(data: {
    period: string;
    year: number;
    week?: number;
    revenue: number;
    real_revenue: number;
    cost: number;
    profit: number;
    real_profit: number;
  }): Promise<ApiResponse> {
    return this.request('/insights/agency/save', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async saveModelInsights(data: {
    model_id: string;
    period: string;
    year: number;
    week?: number;
    net_sales: number;
    invoice_value: number;
    invoice_status: string;
    revenue: number;
    profit: number;
  }): Promise<ApiResponse> {
    return this.request('/insights/model/save', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSavedAgencyInsights(period: string, year: number, week?: number): Promise<ApiResponse> {
    const params = new URLSearchParams({
      period: period,
      year: year.toString(),
      ...(week && { week: week.toString() })
    });
    return this.request(`/insights/agency/saved?${params.toString()}`);
  }

  async getSavedModelInsights(modelId: string, period: string, year: number, week?: number): Promise<ApiResponse> {
    const params = new URLSearchParams({
      model_id: modelId,
      period: period,
      year: year.toString(),
      ...(week && { week: week.toString() })
    });
    return this.request(`/insights/model/saved?${params.toString()}`);
  }
}

export const apiService = new ApiService();

// Salary Calculation Interfaces
export interface ReferenceChild {
  model_id: string;
  hours: number;
  net_sales: number;
}

export interface WorkRow {
  model_id: string;
  hours: number;
  net_sales: number;
  reference_children?: ReferenceChild[];
}

export interface DailySalaryCalculationRequest {
  chatter_id: string;
  work_date: string;
  work_rows: WorkRow[];
}

export interface WeeklySalaryCalculationRequest {
  chatter_id: string;
  period: string;
  year: number;
  week: number;
}

export interface DailySalaryResult {
  total_salary: number;
  hourly_pay: number;
  commission_total: number;
  row_breakdown: Array<{
    model_id: string;
    model_name: string;
    hours: number;
    net_sales: number;
    commission: number;
    is_reference_model: boolean;
  }>;
  net_earnings: number;
  model_count: number;
  hourly_rate: number;
  total_hours: number;
  total_net_sales: number;
}

export interface WeeklySalaryResult {
  week_salary: number;
  daily_breakdown: Array<{
    date: string;
    salary: number;
    hourly_pay: number;
    commission: number;
    net_earnings: number;
    model_count: number;
    total_hours: number;
  }>;
  total_hours: number;
  total_commission: number;
  net_earnings: number;
}

// Salary Calculation API Functions
export const calculateDailySalary = async (
  request: DailySalaryCalculationRequest
): Promise<ApiResponse<DailySalaryResult>> => {
  try {
    // Backend expects chatter_id and work_date as query params and body as a list of work_rows
    const params = new URLSearchParams({
      chatter_id: request.chatter_id,
      work_date: request.work_date,
    });

    return await apiService['request'](`/salary/calculate-daily?${params.toString()}`, {
      method: 'POST',
      body: JSON.stringify(request.work_rows),
    });
  } catch (error) {
    console.error('Error calculating daily salary:', error);
    return {
      status: 'Failed',
      message: error instanceof Error ? error.message : 'Failed to calculate daily salary',
      data: null,
    } as unknown as ApiResponse<DailySalaryResult>;
  }
};

export const calculateWeeklySalary = async (
  request: WeeklySalaryCalculationRequest
): Promise<ApiResponse<WeeklySalaryResult>> => {
  try {
    // Backend expects all params in the query string; POST with no body
    const params = new URLSearchParams({
      chatter_id: request.chatter_id,
      period: request.period,
      year: request.year.toString(),
      week: request.week.toString(),
    });
    return await apiService['request'](`/salary/calculate-week?${params.toString()}`, { method: 'POST' });
  } catch (error) {
    console.error('Error calculating weekly salary:', error);
    return {
      status: 'Failed',
      message: error instanceof Error ? error.message : 'Failed to calculate weekly salary',
      data: null,
    } as unknown as ApiResponse<WeeklySalaryResult>;
  }
};

// Save Agency Insights Data
export const saveAgencyInsights = async (data: {
  period: string;
  year: number;
  week?: number;
  revenue: number;
  real_revenue: number;
  cost: number;
  profit: number;
  real_profit: number;
}): Promise<ApiResponse<any>> => {
  try {
    return await apiService['request']('/insights/agency/save', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Error saving agency insights:', error);
    return {
      status: 'Failed',
      message: 'Failed to save agency insights',
      data: null,
    };
  }
};

// Save Model Insights Data
export const saveModelInsights = async (data: {
  model_id: string;
  period: string;
  year: number;
  week?: number;
  net_sales: number;
  invoice_value: number;
  invoice_status: string;
  revenue: number;
  profit: number;
}): Promise<ApiResponse<any>> => {
  try {
    return await apiService['request']('/insights/model/save', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Error saving model insights:', error);
    return {
      status: 'Failed',
      message: 'Failed to save model insights',
      data: null,
    };
  }
};
