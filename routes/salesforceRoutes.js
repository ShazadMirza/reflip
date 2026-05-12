const express = require('express');
const router = express.Router();
const salesforceService = require('../services/salesforceService');
const referee = require('../core/referee');

/**
 * @route   POST /api/salesforce/referrals
 * @desc    Create a new referral with AI analysis (with graceful fallback)
 * @access  Public (should be protected in production)
 */
router.post('/referrals', async (req, res) => {
  try {
    const referralData = req.body;

    // Validate required fields
    if (!referralData.Patient_Name__c || !referralData.Condition__c) {
      return res.status(400).json({
        error: 'Missing required fields: Patient_Name__c and Condition__c are required'
      });
    }

    let aiAnalysis = null;
    let aiStatus = 'Success';
    let fallbackReason = null;

    // Try AI analysis with timeout and error handling
    try {
      console.log('🤖 Attempting AI analysis with Referee agent...');
      
      // Set a timeout for AI analysis (10 seconds)
      const analysisPromise = referee.extractIntent(referralData.Condition__c);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI analysis timeout')), 10000)
      );
      
      aiAnalysis = await Promise.race([analysisPromise, timeoutPromise]);
      
      console.log('✅ AI analysis completed successfully');
      
    } catch (aiError) {
      // AI failed - log but continue with fallback
      console.warn('⚠️  AI analysis failed, using fallback:', aiError.message);
      aiStatus = 'Fallback';
      fallbackReason = aiError.message || 'AI service unavailable';
      
      // Use basic fallback data
      aiAnalysis = {
        LineOfBusiness: referralData.Specialty__c || 'Retail',
        Urgency_Score: 5,
        Priority_Level: 'Standard',
        Confidence_Score: 0.5,
        Extraction_Method: 'Fallback',
        Small_Business_Flag: false,
        Lead_Source: 'Not Specified',
        Banking_Product: referralData.Specialty__c || 'Not Specified',
        Ontario_Region: 'Not Specified',
        Extracted_Keywords: [],
        Fallback_Reason: fallbackReason
      };
    }

    // Enhance referral data with AI recommendations (or fallback data)
    const enhancedReferralData = {
      ...referralData,
      LineOfBusiness__c: aiAnalysis.LineOfBusiness || referralData.Specialty__c || 'Retail',
      AI_Priority_Level__c: (aiAnalysis.Confidence_Score * 100) || 50,
      AI_Urgency_Score__c: aiAnalysis.Urgency_Score || 5,
      AI_Status__c: aiStatus,
      AI_Extraction_Method__c: aiAnalysis.Extraction_Method || 'Fallback',
      AI_Confidence_Score__c: aiAnalysis.Confidence_Score || 0.5,
      AI_Analysis_Timestamp__c: new Date().toISOString(),
      Small_Business_Flag__c: aiAnalysis.Small_Business_Flag || false,
      Lead_Source__c: aiAnalysis.Lead_Source || 'Not Specified',
      Ontario_Region__c: aiAnalysis.Ontario_Region || 'Not Specified'
    };

    // Add fallback reason if applicable
    if (aiStatus === 'Fallback') {
      enhancedReferralData.AI_Fallback_Reason__c = fallbackReason;
      console.log('⚠️  Creating lead with fallback data - ZERO LEADS DROPPED');
    }

    // CRITICAL: Always create the Salesforce lead, even if AI fails
    const result = await salesforceService.createReferral(enhancedReferralData);

    console.log(`✅ Lead created successfully in Salesforce (AI Status: ${aiStatus})`);

    res.status(201).json({
      success: true,
      referral: result,
      aiAnalysis: aiAnalysis,
      aiStatus: aiStatus,
      message: aiStatus === 'Fallback'
        ? 'Lead created with fallback data due to AI service issue'
        : 'Lead created with AI analysis'
    });
    
  } catch (error) {
    // Even if Salesforce fails, log the error but don't lose the data
    console.error('❌ CRITICAL: Failed to create lead in Salesforce:', error);
    
    // In production, you might want to queue this for retry
    res.status(500).json({
      error: 'Failed to create referral',
      message: error.message,
      critical: true,
      note: 'Lead data should be queued for retry'
    });
  }
});

/**
 * @route   GET /api/salesforce/referrals/:id
 * @desc    Get a referral by ID
 * @access  Public (should be protected in production)
 */
router.get('/referrals/:id', async (req, res) => {
  try {
    const referral = await salesforceService.getReferral(req.params.id);
    res.json({
      success: true,
      referral: referral
    });
  } catch (error) {
    console.error('Error fetching referral:', error);
    res.status(500).json({
      error: 'Failed to fetch referral',
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/salesforce/referrals/:id
 * @desc    Update a referral
 * @access  Public (should be protected in production)
 */
router.put('/referrals/:id', async (req, res) => {
  try {
    const result = await salesforceService.updateReferral(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error updating referral:', error);
    res.status(500).json({
      error: 'Failed to update referral',
      message: error.message
    });
  }
});

/**
 * @route   DELETE /api/salesforce/referrals/:id
 * @desc    Delete a referral
 * @access  Public (should be protected in production)
 */
router.delete('/referrals/:id', async (req, res) => {
  try {
    const result = await salesforceService.deleteReferral(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting referral:', error);
    res.status(500).json({
      error: 'Failed to delete referral',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/salesforce/referrals
 * @desc    Get all referrals or filter by status
 * @access  Public (should be protected in production)
 */
router.get('/referrals', async (req, res) => {
  try {
    const { status } = req.query;
    
    let referrals;
    if (status) {
      referrals = await salesforceService.getReferralsByStatus(status);
    } else {
      referrals = await salesforceService.getPendingReferrals();
    }

    res.json({
      success: true,
      count: referrals.length,
      referrals: referrals
    });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    res.status(500).json({
      error: 'Failed to fetch referrals',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/salesforce/referrals/:id/analyze
 * @desc    Analyze an existing referral with Watson AI
 * @access  Public (should be protected in production)
 */
router.post('/referrals/:id/analyze', async (req, res) => {
  try {
    // Get referral from Salesforce
    const referral = await salesforceService.getReferral(req.params.id);

    let aiAnalysis = null;
    let aiStatus = 'Success';

    // Try AI analysis with timeout
    try {
      const analysisPromise = referee.extractIntent(referral.Condition__c);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI analysis timeout')), 10000)
      );
      
      aiAnalysis = await Promise.race([analysisPromise, timeoutPromise]);
      
    } catch (aiError) {
      console.warn('⚠️  AI re-analysis failed:', aiError.message);
      aiStatus = 'Fallback';
      
      // Return existing data if AI fails
      return res.json({
        success: true,
        message: 'AI analysis failed, returning existing data',
        aiStatus: 'Fallback',
        analysis: {
          LineOfBusiness: referral.LineOfBusiness__c,
          AI_Status: 'Fallback',
          Fallback_Reason: aiError.message
        }
      });
    }

    // Update referral with AI insights
    await salesforceService.updateReferral(req.params.id, {
      LineOfBusiness__c: aiAnalysis.LineOfBusiness,
      AI_Priority_Level__c: (aiAnalysis.Confidence_Score * 100),
      AI_Urgency_Score__c: aiAnalysis.Urgency_Score,
      AI_Status__c: aiStatus,
      AI_Extraction_Method__c: aiAnalysis.Extraction_Method,
      AI_Analysis_Timestamp__c: new Date().toISOString()
    });

    res.json({
      success: true,
      analysis: aiAnalysis,
      aiStatus: aiStatus
    });
  } catch (error) {
    console.error('Error analyzing referral:', error);
    res.status(500).json({
      error: 'Failed to analyze referral',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/salesforce/search
 * @desc    Search referrals
 * @access  Public (should be protected in production)
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        error: 'Search query parameter "q" is required'
      });
    }

    const results = await salesforceService.searchReferrals(q);
    
    res.json({
      success: true,
      count: results.length,
      results: results
    });
  } catch (error) {
    console.error('Error searching referrals:', error);
    res.status(500).json({
      error: 'Failed to search referrals',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/salesforce/auth/test
 * @desc    Test Salesforce authentication
 * @access  Public (should be protected in production)
 */
router.post('/auth/test', async (req, res) => {
  try {
    await salesforceService.authenticate();
    res.json({
      success: true,
      message: 'Successfully authenticated with Salesforce'
    });
  } catch (error) {
    console.error('Authentication test failed:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
});

module.exports = router;

// Made with Bob
