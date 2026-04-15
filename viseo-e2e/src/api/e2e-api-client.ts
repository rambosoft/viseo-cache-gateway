import { RuntimeConfig } from '../env/runtime-config';

export interface SeedRequest {
  scenarioId: string;
  runId?: string;
  email?: string;
  password?: string;
  sessionId?: string;
}

export interface SeedResponse {
  scenarioId: string;
  runId: string;
  email: string;
  password: string;
  userId: number;
  role: string;
  deviceUuid: string;
  deviceSignature: string;
  subscriptionId?: number | null;
  resellerPackageId?: number | null;
  checkoutSessionId?: string | null;
}

export interface InspectResponse {
  email: string;
  userId: number;
  role: string;
  subscriptionId?: number | null;
  subscriptionStatus?: string | null;
  cancelAtPeriodEnd?: boolean | null;
  cancelAt?: string | null;
  resellerPackageId?: number | null;
  resellerUnitsCount?: number | null;
  resellerUsedUnits?: number | null;
  emails: Array<{
    to: string;
    subject: string;
    template: string;
    url?: string | null;
  }>;
}

export interface JwtResponse {
  token: string;
  refreshToken?: string;
  id: number;
  username: string;
  email: string;
  roles: string[];
  deviceUuid?: string;
  deviceCode?: string;
  subscriptionStatus?: {
    id?: number;
    status?: string;
  };
  resellerPackage?: {
    id?: number;
    unitsCount?: number;
    usedUnits?: number;
  };
}

export interface BillingSummaryResponse {
  statusLabel?: string;
  plan?: {
    id?: number;
    name?: string;
    billingCycle?: string;
  };
  scheduledChange?: {
    targetPlanId?: number;
    targetPlanName?: string;
    effectiveAt?: string;
  };
}

export interface BillingTimelineItem {
  title: string;
  createdAt?: string;
  eventDate?: string;
}

export interface PlaylistEntry {
  id: number;
  name: string;
  path: string;
}

export interface PlanChangeOptionsResponse {
  subscriptionId: number;
  upgradeOptions: Array<{ productId: number; name: string }>;
  downgradeOptions: Array<{ productId: number; name: string }>;
}

export class E2eApiClient {
  constructor(private readonly config: RuntimeConfig) {}

  async reset(): Promise<void> {
    await this.fetchJson<void>('/external/test/reset', {
      method: 'POST',
      body: JSON.stringify({ runId: this.config.runId })
    });
  }

  async seed(request: SeedRequest): Promise<SeedResponse> {
    return this.fetchJson<SeedResponse>('/external/test/seed', {
      method: 'POST',
      body: JSON.stringify({ ...request, runId: request.runId ?? this.config.runId })
    });
  }

  async inspect(email: string): Promise<InspectResponse> {
    return this.fetchJson<InspectResponse>(`/external/test/inspect?email=${encodeURIComponent(email)}`, {
      method: 'GET'
    });
  }

  async login(seed: SeedResponse): Promise<JwtResponse> {
    return this.fetchExternal<JwtResponse>('/external/account/login', {
      method: 'POST',
      body: JSON.stringify({
        email: seed.email,
        password: seed.password,
        deviceUuid: seed.deviceUuid,
        deviceSignature: seed.deviceSignature,
        recaptchaToken: 'e2e-bypass'
      })
    });
  }

  async forgotPassword(email: string): Promise<void> {
    await this.fetchExternal('/external/account/forget-password', {
      method: 'POST',
      body: JSON.stringify({
        email,
        recaptchaToken: 'e2e-bypass'
      })
    });
  }

  async getBillingSummary(token: string): Promise<BillingSummaryResponse> {
    return this.fetchCustomer<BillingSummaryResponse>('/customer/billing/summary', token);
  }

  async getBillingTimeline(token: string): Promise<BillingTimelineItem[]> {
    return this.fetchCustomer<BillingTimelineItem[]>('/customer/billing/timeline', token);
  }

  async getPlanChangeOptions(token: string, subscriptionId: number): Promise<PlanChangeOptionsResponse> {
    return this.fetchCustomer<PlanChangeOptionsResponse>(
      `/customer/billing/subscriptions/${subscriptionId}/plan-change-options`,
      token
    );
  }

  async getPlaylists(token: string): Promise<{ content: PlaylistEntry[] }> {
    return this.fetchCustomer<{ content: PlaylistEntry[] }>('/customer/playlist?pageNumber=0&pageSize=25', token);
  }

  private async fetchJson<T>(relativePath: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${this.config.backend.baseUrl}${relativePath}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-E2E-Token': this.config.backend.seedToken,
        'X-E2E-Run-Id': this.config.runId,
        ...(init.headers ?? {})
      }
    });

    if (!response.ok) {
      throw new Error(`E2E API request failed: ${response.status} ${relativePath}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private async fetchExternal<T = void>(relativePath: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${this.config.backend.baseUrl}${relativePath}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-E2E-Run-Id': this.config.runId,
        ...(init.headers ?? {})
      }
    });

    if (!response.ok) {
      throw new Error(`External API request failed: ${response.status} ${relativePath}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private async fetchCustomer<T>(relativePath: string, token: string): Promise<T> {
    const response = await fetch(`${this.config.backend.baseUrl}${relativePath}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-E2E-Run-Id': this.config.runId
      }
    });

    if (!response.ok) {
      throw new Error(`Customer API request failed: ${response.status} ${relativePath}`);
    }

    return (await response.json()) as T;
  }
}
