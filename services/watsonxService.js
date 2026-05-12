require('dotenv').config();

/**
 * Watsonx Service
 * Handles all IBM Watson AI interactions for referral processing
 * Note: This service is deprecated in favor of the new Referee agent in core/referee.js
 */
class WatsonxService {
  constructor() {
    console.warn('⚠️  WatsonxService is deprecated. Please use the Referee agent in core/referee.js');
    this.sessions = new Map(); // Store session IDs for users
  }

  /**
   * Create a new Watson Assistant session
   * @returns {Promise<string>} Session ID
   */
  async createSession() {
    try {
      const response = await this.assistant.createSession({
        assistantId: this.assistantId,
      });
      return response.result.session_id;
    } catch (error) {
      console.error('Error creating Watson session:', error);
      throw new Error('Failed to create Watson session');
    }
  }

  /**
   * Send a message to Watson Assistant
   * @param {string} sessionId - Watson session ID
   * @param {string} message - User message
   * @returns {Promise<Object>} Watson response
   */
  async sendMessage(sessionId, message) {
    try {
      const response = await this.assistant.message({
        assistantId: this.assistantId,
        sessionId: sessionId,
        input: {
          message_type: 'text',
          text: message,
        },
      });
      return response.result;
    } catch (error) {
      console.error('Error sending message to Watson:', error);
      throw new Error('Failed to send message to Watson');
    }
  }

  /**
   * Analyze referral data using Watson AI
   * @param {Object} referralData - Referral information from Salesforce
   * @returns {Promise<Object>} AI analysis results
   */
  async analyzeReferral(referralData) {
    try {
      const sessionId = await this.createSession();
      
      // Construct analysis prompt
      const prompt = `Analyze this referral:
        Patient: ${referralData.patientName || 'N/A'}
        Condition: ${referralData.condition || 'N/A'}
        Urgency: ${referralData.urgency || 'N/A'}
        Specialty Required: ${referralData.specialty || 'N/A'}
        
        Provide recommendations for:
        1. Appropriate specialist type
        2. Urgency level assessment
        3. Required documentation
        4. Estimated processing time`;

      const response = await this.sendMessage(sessionId, prompt);
      
      // Clean up session
      await this.deleteSession(sessionId);
      
      return {
        success: true,
        analysis: response.output.generic,
        confidence: response.output.intents?.[0]?.confidence || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error analyzing referral:', error);
      throw new Error('Failed to analyze referral with Watson');
    }
  }

  /**
   * Process referral routing using AI
   * @param {Object} referralData - Referral information
   * @returns {Promise<Object>} Routing recommendations
   */
  async processReferralRouting(referralData) {
    try {
      const analysis = await this.analyzeReferral(referralData);
      
      return {
        recommendedSpecialist: this.extractSpecialistRecommendation(analysis),
        priorityLevel: this.calculatePriority(referralData, analysis),
        estimatedWaitTime: this.estimateWaitTime(referralData),
        requiredDocuments: this.identifyRequiredDocuments(referralData),
        analysis: analysis
      };
    } catch (error) {
      console.error('Error processing referral routing:', error);
      throw new Error('Failed to process referral routing');
    }
  }

  /**
   * Delete a Watson Assistant session
   * @param {string} sessionId - Session ID to delete
   */
  async deleteSession(sessionId) {
    try {
      await this.assistant.deleteSession({
        assistantId: this.assistantId,
        sessionId: sessionId,
      });
    } catch (error) {
      console.error('Error deleting Watson session:', error);
    }
  }

  // Helper methods
  extractSpecialistRecommendation(analysis) {
    // Parse Watson response to extract specialist recommendation
    // This is a placeholder - implement based on your Watson model's output
    return 'Cardiologist'; // Example
  }

  calculatePriority(referralData, analysis) {
    // Calculate priority based on referral data and AI analysis
    const urgencyMap = {
      'emergency': 1,
      'urgent': 2,
      'routine': 3
    };
    return urgencyMap[referralData.urgency?.toLowerCase()] || 3;
  }

  estimateWaitTime(referralData) {
    // Estimate wait time based on specialty and urgency
    // This is a placeholder - implement based on your business logic
    return '2-3 weeks';
  }

  identifyRequiredDocuments(referralData) {
    // Identify required documents based on specialty and condition
    return [
      'Medical history',
      'Recent test results',
      'Insurance information',
      'Referral letter'
    ];
  }
}

module.exports = new WatsonxService();

// Made with Bob
