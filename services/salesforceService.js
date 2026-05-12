require('dotenv').config();
const axios = require('axios');

/**
 * Salesforce Service
 * Handles all Salesforce API interactions for referral management
 */
class SalesforceService {
  constructor() {
    this.instanceUrl = process.env.SALESFORCE_INSTANCE_URL;
    this.accessToken = null;
    this.apiVersion = process.env.SALESFORCE_API_VERSION || 'v58.0';
  }

  /**
   * Authenticate with Salesforce using OAuth 2.0 Username-Password flow
   * @returns {Promise<string>} Access token
   */
  async authenticate() {
    try {
      const response = await axios.post(
        `${process.env.SALESFORCE_LOGIN_URL}/services/oauth2/token`,
        null,
        {
          params: {
            grant_type: 'password',
            client_id: process.env.SALESFORCE_CLIENT_ID,
            client_secret: process.env.SALESFORCE_CLIENT_SECRET,
            username: process.env.SALESFORCE_USERNAME,
            password: `${process.env.SALESFORCE_PASSWORD}${process.env.SALESFORCE_SECURITY_TOKEN}`
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.instanceUrl = response.data.instance_url;
      
      console.log('Successfully authenticated with Salesforce');
      return this.accessToken;
    } catch (error) {
      console.error('Salesforce authentication error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Salesforce');
    }
  }

  /**
   * Get authorization headers for Salesforce API requests
   * @returns {Promise<Object>} Headers object
   */
  async getHeaders() {
    if (!this.accessToken) {
      await this.authenticate();
    }

    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Create a new referral record in Salesforce
   * @param {Object} referralData - Referral information
   * @returns {Promise<Object>} Created referral record
   */
  async createReferral(referralData) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${this.instanceUrl}/services/data/${this.apiVersion}/sobjects/Referral__c`,
        referralData,
        { headers }
      );

      return {
        success: true,
        id: response.data.id,
        message: 'Referral created successfully'
      };
    } catch (error) {
      console.error('Error creating referral:', error.response?.data || error.message);
      throw new Error('Failed to create referral in Salesforce');
    }
  }

  /**
   * Get a referral record by ID
   * @param {string} referralId - Salesforce referral ID
   * @returns {Promise<Object>} Referral record
   */
  async getReferral(referralId) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(
        `${this.instanceUrl}/services/data/${this.apiVersion}/sobjects/Referral__c/${referralId}`,
        { headers }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching referral:', error.response?.data || error.message);
      throw new Error('Failed to fetch referral from Salesforce');
    }
  }

  /**
   * Update a referral record
   * @param {string} referralId - Salesforce referral ID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} Update result
   */
  async updateReferral(referralId, updateData) {
    try {
      const headers = await this.getHeaders();
      await axios.patch(
        `${this.instanceUrl}/services/data/${this.apiVersion}/sobjects/Referral__c/${referralId}`,
        updateData,
        { headers }
      );

      return {
        success: true,
        message: 'Referral updated successfully'
      };
    } catch (error) {
      console.error('Error updating referral:', error.response?.data || error.message);
      throw new Error('Failed to update referral in Salesforce');
    }
  }

  /**
   * Query referrals using SOQL
   * @param {string} query - SOQL query string
   * @returns {Promise<Array>} Query results
   */
  async queryReferrals(query) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(
        `${this.instanceUrl}/services/data/${this.apiVersion}/query`,
        {
          headers,
          params: { q: query }
        }
      );

      return response.data.records;
    } catch (error) {
      console.error('Error querying referrals:', error.response?.data || error.message);
      throw new Error('Failed to query referrals from Salesforce');
    }
  }

  /**
   * Get all pending referrals
   * @returns {Promise<Array>} Pending referrals
   */
  async getPendingReferrals() {
    const query = `SELECT Id, Name, Patient_Name__c, Condition__c, Urgency__c, Status__c, CreatedDate 
                   FROM Referral__c 
                   WHERE Status__c = 'Pending' 
                   ORDER BY CreatedDate DESC`;
    return await this.queryReferrals(query);
  }

  /**
   * Get referrals by status
   * @param {string} status - Referral status
   * @returns {Promise<Array>} Referrals with specified status
   */
  async getReferralsByStatus(status) {
    const query = `SELECT Id, Name, Patient_Name__c, Condition__c, Urgency__c, Status__c, CreatedDate 
                   FROM Referral__c 
                   WHERE Status__c = '${status}' 
                   ORDER BY CreatedDate DESC`;
    return await this.queryReferrals(query);
  }

  /**
   * Delete a referral record
   * @param {string} referralId - Salesforce referral ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteReferral(referralId) {
    try {
      const headers = await this.getHeaders();
      await axios.delete(
        `${this.instanceUrl}/services/data/${this.apiVersion}/sobjects/Referral__c/${referralId}`,
        { headers }
      );

      return {
        success: true,
        message: 'Referral deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting referral:', error.response?.data || error.message);
      throw new Error('Failed to delete referral from Salesforce');
    }
  }

  /**
   * Search referrals using SOSL
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Search results
   */
  async searchReferrals(searchTerm) {
    try {
      const headers = await this.getHeaders();
      const soslQuery = `FIND {${searchTerm}} IN ALL FIELDS RETURNING Referral__c(Id, Name, Patient_Name__c, Condition__c, Status__c)`;
      
      const response = await axios.get(
        `${this.instanceUrl}/services/data/${this.apiVersion}/search`,
        {
          headers,
          params: { q: soslQuery }
        }
      );

      return response.data.searchRecords;
    } catch (error) {
      console.error('Error searching referrals:', error.response?.data || error.message);
      throw new Error('Failed to search referrals in Salesforce');
    }
  }
}

module.exports = new SalesforceService();

// Made with Bob
