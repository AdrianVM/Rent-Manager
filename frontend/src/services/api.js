const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5057/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get auth token from localStorage
    const token = localStorage.getItem('authToken');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle empty responses (like DELETE)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Properties API
  async getProperties() {
    return this.request('/properties');
  }

  async getProperty(id) {
    return this.request(`/properties/${id}`);
  }

  async createProperty(property) {
    return this.request('/properties', {
      method: 'POST',
      body: property,
    });
  }

  async updateProperty(id, property) {
    return this.request(`/properties/${id}`, {
      method: 'PUT',
      body: property,
    });
  }

  async deleteProperty(id) {
    return this.request(`/properties/${id}`, {
      method: 'DELETE',
    });
  }

  // Tenants API
  async getTenants() {
    return this.request('/tenants');
  }

  async getTenant(id) {
    return this.request(`/tenants/${id}`);
  }

  async createTenant(tenant) {
    return this.request('/tenants', {
      method: 'POST',
      body: tenant,
    });
  }

  async updateTenant(id, tenant) {
    return this.request(`/tenants/${id}`, {
      method: 'PUT',
      body: tenant,
    });
  }

  async deleteTenant(id) {
    return this.request(`/tenants/${id}`, {
      method: 'DELETE',
    });
  }

  // Payments API
  async getPayments() {
    return this.request('/payments');
  }

  async getPayment(id) {
    return this.request(`/payments/${id}`);
  }

  async createPayment(payment) {
    return this.request('/payments', {
      method: 'POST',
      body: payment,
    });
  }

  async updatePayment(id, payment) {
    return this.request(`/payments/${id}`, {
      method: 'PUT',
      body: payment,
    });
  }

  async deletePayment(id) {
    return this.request(`/payments/${id}`, {
      method: 'DELETE',
    });
  }

  async initiatePayment(paymentData) {
    return this.request('/payments/initiate', {
      method: 'POST',
      body: paymentData,
    });
  }

  async processPayment(paymentId, transactionData) {
    return this.request('/payments/process', {
      method: 'POST',
      body: {
        paymentId,
        ...transactionData,
      },
    });
  }

  async confirmPayment(paymentId, confirmationCode) {
    return this.request('/payments/confirm', {
      method: 'POST',
      body: {
        paymentId,
        confirmationCode,
      },
    });
  }

  async getStripeConfig() {
    return this.request('/payments/stripe-config');
  }

  // Contracts API
  async getContracts() {
    return this.request('/contracts');
  }

  async getContract(id) {
    return this.request(`/contracts/${id}`);
  }

  async getContractsByProperty(propertyId) {
    return this.request(`/contracts/property/${propertyId}`);
  }

  async getContractsByTenant(tenantId) {
    return this.request(`/contracts/tenant/${tenantId}`);
  }

  async uploadContract(contractData) {
    return this.request('/contracts', {
      method: 'POST',
      body: contractData,
    });
  }

  async updateContract(id, contractData) {
    return this.request(`/contracts/${id}`, {
      method: 'PUT',
      body: contractData,
    });
  }

  async deleteContract(id) {
    return this.request(`/contracts/${id}`, {
      method: 'DELETE',
    });
  }

  async downloadContract(id) {
    const url = `${API_BASE_URL}/contracts/${id}/download`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  }

  // Dashboard API
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // Seed API
  async seedDemoData() {
    return this.request('/seed/demo-data', {
      method: 'POST',
    });
  }
}

const apiService = new ApiService();
export default apiService;