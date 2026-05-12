const express = require('express');
const router = express.Router();
const referee = require('../core/referee');

/**
 * Referee Routes
 * Handles intent extraction from customer interactions
 */

/**
 * POST /api/referee/extract
 * Extract intent from a single customer interaction
 * 
 * Request body:
 * {
 *   "text": "Customer interaction text here"
 * }
 */
router.post('/extract', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request body must contain a non-empty "text" field'
      });
    }

    console.log(`📝 Processing intent extraction for text: "${text.substring(0, 50)}..."`);

    const intent = await referee.extractIntent(text);

    res.status(200).json({
      success: true,
      data: intent,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in intent extraction:', error);
    res.status(500).json({
      error: 'Intent extraction failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/referee/batch
 * Extract intents from multiple customer interactions
 * 
 * Request body:
 * {
 *   "texts": ["text1", "text2", "text3"]
 * }
 */
router.post('/batch', async (req, res) => {
  try {
    const { texts } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request body must contain a non-empty "texts" array'
      });
    }

    if (texts.length > 50) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Maximum 50 texts allowed per batch request'
      });
    }

    console.log(`📝 Processing batch intent extraction for ${texts.length} texts`);

    const intents = await referee.batchExtractIntents(texts);

    res.status(200).json({
      success: true,
      count: intents.length,
      data: intents,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in batch intent extraction:', error);
    res.status(500).json({
      error: 'Batch intent extraction failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/referee/status
 * Get the status of AI services
 */
router.get('/status', (req, res) => {
  try {
    const status = referee.getStatus();
    
    res.status(200).json({
      success: true,
      status: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting referee status:', error);
    res.status(500).json({
      error: 'Failed to get status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/referee/test
 * Test endpoint with sample data
 */
router.post('/test', async (req, res) => {
  try {
    const sampleTexts = [
      "Hi, I'm interested in starting a business in Toronto and need a business loan to get started.",
      "I'd like to open a savings account for my daughter. We live in Ottawa.",
      "Can you help me with a mortgage? I'm looking to buy a house in Mississauga soon.",
      "I need urgent help with my credit card. There are some unauthorized charges.",
      "I'm planning to start a small business next month in Hamilton. What banking products do you recommend?"
    ];

    console.log('🧪 Running test extraction on sample data...');

    const results = await referee.batchExtractIntents(sampleTexts);

    res.status(200).json({
      success: true,
      message: 'Test completed successfully',
      sample_count: sampleTexts.length,
      results: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in test extraction:', error);
    res.status(500).json({
      error: 'Test failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/referee/health
 * Health check for referee service
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Referee Intent Extraction',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

// Made with Bob