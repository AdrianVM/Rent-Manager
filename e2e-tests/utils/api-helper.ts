import { APIRequestContext, request } from '@playwright/test';

/**
 * API Helper for E2E Tests
 *
 * Provides utilities for making API requests during tests
 */

/**
 * Create an authenticated API context
 *
 * @param accessToken - JWT access token
 * @returns API request context
 */
export async function createAuthenticatedAPIContext(accessToken: string): Promise<APIRequestContext> {
  const apiContext = await request.newContext({
    baseURL: process.env.API_BASE_URL || 'http://localhost:5000/api',
    extraHTTPHeaders: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  return apiContext;
}

/**
 * Create an unauthenticated API context
 *
 * @returns API request context
 */
export async function createAPIContext(): Promise<APIRequestContext> {
  const apiContext = await request.newContext({
    baseURL: process.env.API_BASE_URL || 'http://localhost:5000/api',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  return apiContext;
}

/**
 * API Response wrapper with useful utilities
 */
export class APIResponse<T = any> {
  constructor(
    public status: number,
    public data: T,
    public headers: Record<string, string>,
    public ok: boolean
  ) {}

  isSuccess(): boolean {
    return this.status >= 200 && this.status < 300;
  }

  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }
}

/**
 * Make GET request
 *
 * @param context - API request context
 * @param endpoint - API endpoint
 * @param queryParams - Optional query parameters
 * @returns API response
 */
export async function get<T = any>(
  context: APIRequestContext,
  endpoint: string,
  queryParams?: Record<string, string | number>
): Promise<APIResponse<T>> {
  let url = endpoint;

  if (queryParams) {
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      params.append(key, String(value));
    });
    url = `${endpoint}?${params.toString()}`;
  }

  const response = await context.get(url);
  const data = await response.json().catch(() => null);

  return new APIResponse<T>(
    response.status(),
    data,
    response.headers(),
    response.ok()
  );
}

/**
 * Make POST request
 *
 * @param context - API request context
 * @param endpoint - API endpoint
 * @param body - Request body
 * @returns API response
 */
export async function post<T = any>(
  context: APIRequestContext,
  endpoint: string,
  body: any
): Promise<APIResponse<T>> {
  const response = await context.post(endpoint, {
    data: body,
  });

  const data = await response.json().catch(() => null);

  return new APIResponse<T>(
    response.status(),
    data,
    response.headers(),
    response.ok()
  );
}

/**
 * Make PUT request
 *
 * @param context - API request context
 * @param endpoint - API endpoint
 * @param body - Request body
 * @returns API response
 */
export async function put<T = any>(
  context: APIRequestContext,
  endpoint: string,
  body: any
): Promise<APIResponse<T>> {
  const response = await context.put(endpoint, {
    data: body,
  });

  const data = await response.json().catch(() => null);

  return new APIResponse<T>(
    response.status(),
    data,
    response.headers(),
    response.ok()
  );
}

/**
 * Make PATCH request
 *
 * @param context - API request context
 * @param endpoint - API endpoint
 * @param body - Request body
 * @returns API response
 */
export async function patch<T = any>(
  context: APIRequestContext,
  endpoint: string,
  body: any
): Promise<APIResponse<T>> {
  const response = await context.patch(endpoint, {
    data: body,
  });

  const data = await response.json().catch(() => null);

  return new APIResponse<T>(
    response.status(),
    data,
    response.headers(),
    response.ok()
  );
}

/**
 * Make DELETE request
 *
 * @param context - API request context
 * @param endpoint - API endpoint
 * @returns API response
 */
export async function del<T = any>(
  context: APIRequestContext,
  endpoint: string
): Promise<APIResponse<T>> {
  const response = await context.delete(endpoint);

  const data = await response.json().catch(() => null);

  return new APIResponse<T>(
    response.status(),
    data,
    response.headers(),
    response.ok()
  );
}

/**
 * Upload file via API
 *
 * @param context - API request context
 * @param endpoint - API endpoint
 * @param filePath - Path to file
 * @param fieldName - Form field name
 * @returns API response
 */
export async function uploadFile<T = any>(
  context: APIRequestContext,
  endpoint: string,
  filePath: string,
  fieldName: string = 'file'
): Promise<APIResponse<T>> {
  const response = await context.post(endpoint, {
    multipart: {
      [fieldName]: {
        name: filePath.split('/').pop() || 'file',
        mimeType: 'application/octet-stream',
        buffer: require('fs').readFileSync(filePath),
      },
    },
  });

  const data = await response.json().catch(() => null);

  return new APIResponse<T>(
    response.status(),
    data,
    response.headers(),
    response.ok()
  );
}

/**
 * Wait for async operation to complete
 *
 * @param context - API request context
 * @param endpoint - Endpoint to poll
 * @param predicate - Function to check if operation is complete
 * @param maxAttempts - Maximum polling attempts
 * @param delayMs - Delay between attempts in milliseconds
 */
export async function waitForOperation<T = any>(
  context: APIRequestContext,
  endpoint: string,
  predicate: (data: T) => boolean,
  maxAttempts: number = 30,
  delayMs: number = 1000
): Promise<APIResponse<T>> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await get<T>(context, endpoint);

    if (predicate(response.data)) {
      return response;
    }

    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  throw new Error(`Operation did not complete after ${maxAttempts} attempts`);
}

/**
 * Batch API requests in parallel
 *
 * @param requests - Array of request functions
 * @returns Array of responses
 */
export async function batchRequests<T = any>(
  requests: Array<() => Promise<APIResponse<T>>>
): Promise<APIResponse<T>[]> {
  return await Promise.all(requests.map(req => req()));
}

/**
 * Retry API request with exponential backoff
 *
 * @param requestFn - Request function to retry
 * @param maxRetries - Maximum number of retries
 * @param baseDelay - Base delay in milliseconds
 * @returns API response
 */
export async function retryRequest<T = any>(
  requestFn: () => Promise<APIResponse<T>>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<APIResponse<T>> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await requestFn();

      // Retry on server errors (5xx)
      if (response.isServerError() && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}

/**
 * Common API endpoints wrapper
 */
export class RentManagerAPI {
  constructor(private context: APIRequestContext) {}

  // Properties
  async getProperties() {
    return await get(this.context, '/properties');
  }

  async getProperty(id: string) {
    return await get(this.context, `/properties/${id}`);
  }

  async createProperty(propertyData: any) {
    return await post(this.context, '/properties', propertyData);
  }

  async updateProperty(id: string, propertyData: any) {
    return await put(this.context, `/properties/${id}`, propertyData);
  }

  async deleteProperty(id: string) {
    return await del(this.context, `/properties/${id}`);
  }

  // Leases
  async getLeases() {
    return await get(this.context, '/leases');
  }

  async getLease(id: string) {
    return await get(this.context, `/leases/${id}`);
  }

  async createLease(leaseData: any) {
    return await post(this.context, '/leases', leaseData);
  }

  // Payments
  async getPayments() {
    return await get(this.context, '/payments');
  }

  async getPayment(id: string) {
    return await get(this.context, `/payments/${id}`);
  }

  async createPayment(paymentData: any) {
    return await post(this.context, '/payments', paymentData);
  }

  // Maintenance Requests
  async getMaintenanceRequests() {
    return await get(this.context, '/maintenance-requests');
  }

  async getMaintenanceRequest(id: string) {
    return await get(this.context, `/maintenance-requests/${id}`);
  }

  async createMaintenanceRequest(requestData: any) {
    return await post(this.context, '/maintenance-requests', requestData);
  }

  async updateMaintenanceRequest(id: string, requestData: any) {
    return await put(this.context, `/maintenance-requests/${id}`, requestData);
  }
}
