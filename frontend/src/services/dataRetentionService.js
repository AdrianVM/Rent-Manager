import authService from './authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Service for managing data retention schedules and legal holds (GDPR Phase 3)
 */
class DataRetentionService {
  /**
   * Get authorization headers with JWT token
   */
  getAuthHeaders() {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // ==================== Retention Schedules ====================

  /**
   * Get all retention schedules (admin only)
   */
  async getRetentionSchedules() {
    const headers = this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/dataretention/schedules`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error('Failed to fetch retention schedules');
    }

    return await response.json();
  }

  /**
   * Get a specific retention schedule by ID (admin only)
   */
  async getRetentionScheduleById(id) {
    const headers = this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/dataretention/schedules/${id}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error('Failed to fetch retention schedule');
    }

    return await response.json();
  }

  /**
   * Create a new retention schedule (admin only)
   */
  async createRetentionSchedule(scheduleData) {
    const headers = this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/dataretention/schedules`, {
      method: 'POST',
      headers,
      body: JSON.stringify(scheduleData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create retention schedule');
    }

    return await response.json();
  }

  /**
   * Update an existing retention schedule (admin only)
   */
  async updateRetentionSchedule(id, scheduleData) {
    const headers = this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/dataretention/schedules/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(scheduleData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update retention schedule');
    }

    return await response.json();
  }

  /**
   * Deactivate a retention schedule (admin only)
   */
  async deactivateRetentionSchedule(id) {
    const headers = this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/dataretention/schedules/${id}/deactivate`, {
      method: 'POST',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to deactivate retention schedule');
    }

    return await response.json();
  }

  /**
   * Mark a retention schedule as reviewed (admin only)
   */
  async markScheduleAsReviewed(id) {
    const headers = this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/dataretention/schedules/${id}/mark-reviewed`, {
      method: 'POST',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to mark schedule as reviewed');
    }

    return await response.json();
  }

  /**
   * Get retention schedules due for review (admin only)
   */
  async getSchedulesDueForReview(monthsSinceLastReview = 12) {
    const headers = this.getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/dataretention/schedules/due-for-review?monthsSinceLastReview=${monthsSinceLastReview}`,
      {
        method: 'GET',
        headers
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch schedules due for review');
    }

    return await response.json();
  }

  /**
   * Get retention compliance summary (admin only)
   */
  async getComplianceSummary() {
    const headers = this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/dataretention/compliance`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error('Failed to fetch compliance summary');
    }

    return await response.json();
  }

  /**
   * Execute retention policies in dry-run mode (admin only)
   */
  async executeDryRun() {
    const headers = this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/dataretention/execute-dry-run`, {
      method: 'POST',
      headers
    });

    if (!response.ok) {
      throw new Error('Failed to execute dry run');
    }

    return await response.json();
  }

  /**
   * Get retention information for the current user
   */
  async getMyRetentionInfo() {
    const headers = this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/dataretention/my-retention-info`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error('Failed to fetch retention information');
    }

    return await response.json();
  }

  // ==================== Legal Holds ====================

  /**
   * Get all active legal holds (admin only)
   */
  async getActiveLegalHolds() {
    const headers = this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/legalhold/active`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error('Failed to fetch active legal holds');
    }

    return await response.json();
  }

  /**
   * Get legal holds for a specific user (admin only)
   */
  async getUserLegalHolds(userId) {
    const headers = this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/legalhold/user/${userId}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user legal holds');
    }

    return await response.json();
  }

  /**
   * Get a specific legal hold by ID (admin only)
   */
  async getLegalHoldById(id) {
    const headers = this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/legalhold/${id}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error('Failed to fetch legal hold');
    }

    return await response.json();
  }

  /**
   * Place a legal hold on user data (admin only)
   */
  async placeLegalHold(holdData) {
    const headers = this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/legalhold`, {
      method: 'POST',
      headers,
      body: JSON.stringify(holdData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to place legal hold');
    }

    return await response.json();
  }

  /**
   * Release a legal hold (admin only)
   */
  async releaseLegalHold(id, releaseReason) {
    const headers = this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/legalhold/${id}/release`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ releaseReason })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to release legal hold');
    }

    return await response.json();
  }

  /**
   * Check if a user has any active legal holds (admin only)
   */
  async checkUserLegalHold(userId) {
    const headers = this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/legalhold/check/${userId}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error('Failed to check legal hold status');
    }

    return await response.json();
  }

  /**
   * Get legal holds due for review (admin only)
   */
  async getHoldsDueForReview() {
    const headers = this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/legalhold/due-for-review`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error('Failed to fetch holds due for review');
    }

    return await response.json();
  }

  /**
   * Update review date for a legal hold (admin only)
   */
  async updateReviewDate(id, newReviewDate) {
    const headers = this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/legalhold/${id}/review-date`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(newReviewDate)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update review date');
    }

    return await response.json();
  }

  /**
   * Add notes to a legal hold (admin only)
   */
  async addNotes(id, notes) {
    const headers = this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/legalhold/${id}/notes`, {
      method: 'POST',
      headers,
      body: JSON.stringify(notes)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add notes');
    }

    return await response.json();
  }
}

const dataRetentionService = new DataRetentionService();
export default dataRetentionService;
