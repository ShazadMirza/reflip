require('dotenv').config();
const { WatsonXAI } = require('@ibm-cloud/watsonx-ai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Referee - Intent Extraction Agent
 * Extracts structured intent data from bank customer interactions
 * Uses Watsonx.ai with Gemini fallback
 */
class Referee {
  constructor() {
    // Initialize Watsonx.ai
    this.watsonxClient = null;
    this.watsonxAvailable = false;
    
    try {
      if (process.env.WATSONX_API_KEY && process.env.WATSONX_PROJECT_ID) {
        this.watsonxClient = WatsonXAI.newInstance({
          version: '2024-05-31',
          serviceUrl: process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com',
        });
        this.watsonxAvailable = true;
        console.log('✓ Watsonx.ai initialized successfully');
      }
    } catch (error) {
      console.warn('⚠ Watsonx.ai initialization failed:', error.message);
    }

    // Initialize Gemini as fallback
    this.geminiClient = null;
    this.geminiAvailable = false;
    
    try {
      if (process.env.GEMINI_API_KEY) {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.geminiClient = genAI.getGenerativeModel({ model: 'gemini-pro' });
        this.geminiAvailable = true;
        console.log('✓ Gemini fallback initialized successfully');
      }
    } catch (error) {
      console.warn('⚠ Gemini initialization failed:', error.message);
    }

    // Ontario regions for validation
    this.ontarioRegions = [
      'Toronto', 'Ottawa', 'Mississauga', 'Brampton', 'Hamilton',
      'London', 'Markham', 'Vaughan', 'Kitchener', 'Windsor',
      'Richmond Hill', 'Oakville', 'Burlington', 'Greater Sudbury',
      'Oshawa', 'Barrie', 'St. Catharines', 'Cambridge', 'Kingston',
      'Guelph', 'Whitby', 'Thunder Bay', 'Waterloo', 'Brantford',
      'Pickering', 'Niagara Falls', 'Peterborough', 'Sarnia',
      'Sault Ste. Marie', 'Welland', 'North Bay', 'Belleville',
      'Cornwall', 'Chatham', 'Georgetown', 'Ajax', 'Milton',
      'Aurora', 'Newmarket', 'Clarington', 'GTA', 'Golden Horseshoe',
      'Eastern Ontario', 'Northern Ontario', 'Southwestern Ontario',
      'Central Ontario'
    ];

    // Banking products
    this.bankingProducts = [
      'Mortgage', 'Personal Loan', 'Business Loan', 'Line of Credit',
      'Credit Card', 'Savings Account', 'Chequing Account',
      'Investment Account', 'RRSP', 'TFSA', 'GIC', 'RESP',
      'Small Business Account', 'Commercial Banking', 'Wealth Management',
      'Insurance', 'Foreign Exchange', 'Business Credit Card'
    ];
  }

  /**
   * Extract intent from customer interaction text
   * @param {string} rawText - Raw text from bank customer interaction
   * @returns {Promise<Object>} Structured intent data
   */
  async extractIntent(rawText) {
    if (!rawText || typeof rawText !== 'string') {
      throw new Error('Invalid input: rawText must be a non-empty string');
    }

    try {
      // Try Watsonx.ai first
      if (this.watsonxAvailable) {
        console.log('🤖 Using Watsonx.ai for intent extraction...');
        return await this.extractWithWatsonx(rawText);
      }
      
      // Fallback to Gemini
      if (this.geminiAvailable) {
        console.log('🔄 Falling back to Gemini for intent extraction...');
        return await this.extractWithGemini(rawText);
      }

      // If both fail, use rule-based extraction
      console.log('⚠ Using rule-based extraction (no AI available)...');
      return this.extractWithRules(rawText);

    } catch (error) {
      console.error('Error in intent extraction:', error);
      
      // Try fallback if primary method failed
      if (this.watsonxAvailable && this.geminiAvailable) {
        try {
          console.log('🔄 Primary method failed, trying Gemini fallback...');
          return await this.extractWithGemini(rawText);
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      }
      
      // Last resort: rule-based
      return this.extractWithRules(rawText);
    }
  }

  /**
   * Extract intent using Watsonx.ai
   * @param {string} rawText - Raw customer text
   * @returns {Promise<Object>} Structured intent
   */
  async extractWithWatsonx(rawText) {
    const prompt = this.buildExtractionPrompt(rawText);

    const params = {
      input: prompt,
      modelId: 'ibm/granite-13b-chat-v2',
      projectId: process.env.WATSONX_PROJECT_ID,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.3,
        top_p: 0.9,
        top_k: 50
      }
    };

    try {
      const response = await this.watsonxClient.generateText(params);
      const extractedText = response.result.results[0].generated_text;
      return this.parseAIResponse(extractedText, rawText);
    } catch (error) {
      console.error('Watsonx.ai extraction error:', error);
      throw error;
    }
  }

  /**
   * Extract intent using Gemini
   * @param {string} rawText - Raw customer text
   * @returns {Promise<Object>} Structured intent
   */
  async extractWithGemini(rawText) {
    const prompt = this.buildExtractionPrompt(rawText);

    try {
      const result = await this.geminiClient.generateContent(prompt);
      const response = await result.response;
      const extractedText = response.text();
      return this.parseAIResponse(extractedText, rawText);
    } catch (error) {
      console.error('Gemini extraction error:', error);
      throw error;
    }
  }

  /**
   * Build extraction prompt for AI models
   * @param {string} rawText - Raw customer text
   * @returns {string} Formatted prompt
   */
  buildExtractionPrompt(rawText) {
    return `You are a banking intent extraction agent for a Canadian bank. Analyze the following customer interaction and extract structured information.

Customer Interaction:
"${rawText}"

Extract and return ONLY a valid JSON object with these exact fields:
{
  "Lead_Source": "string (e.g., 'Branch Walk-in', 'Phone Call', 'Online Chat', 'Email', 'Mobile App', 'Referral')",
  "Banking_Product": "string (e.g., 'Mortgage', 'Business Loan', 'Savings Account', 'Credit Card', 'Investment Account')",
  "LineOfBusiness": "string (MUST be either 'Commercial' or 'Retail')",
  "Ontario_Region": "string (Ontario city/region name, or 'Not Specified' if unclear)",
  "Urgency_Score": number (1-10, where 10 is most urgent),
  "Small_Business_Flag": boolean (true if customer mentions starting a business, false otherwise),
  "Priority_Level": "string ('High Priority' if Small_Business_Flag is true, otherwise 'Standard' or 'Low')",
  "Extracted_Keywords": ["array", "of", "key", "terms"],
  "Confidence_Score": number (0.0-1.0)
}

CRITICAL LINE OF BUSINESS DETECTION RULES:
Set LineOfBusiness to "Commercial" if the transcript contains ANY of these keywords:
- Business-related: EBITDA, revenue, business loan, commercial loan, business account, merchant services, payroll, equipment financing, fleet financing, commercial mortgage, business credit card, corporate account
- Company indicators: LLC, Inc, Corporation, Ltd, company, business, enterprise, firm, organization
- Business operations: inventory, accounts receivable, accounts payable, cash flow management, working capital, trade finance

Set LineOfBusiness to "Retail" if the transcript contains ANY of these keywords:
- Personal banking: TFSA, RRSP, RESP, personal loan, mortgage (residential), personal account, chequing account, savings account, GIC
- Personal finance: retirement, personal investment, home purchase, car loan, student loan, personal credit card, overdraft protection
- Individual indicators: I, me, my family, personal, individual, household

If BOTH types of keywords appear, prioritize Commercial. If neither appear clearly, default to "Retail".

OTHER IMPORTANT RULES:
1. If customer mentions "starting a business", "new business", "business startup", or similar, set Small_Business_Flag to true, Priority_Level to "High Priority", and LineOfBusiness to "Commercial"
2. Urgency_Score should be 8-10 for business startups, 6-8 for urgent needs, 3-5 for standard requests, 1-2 for general inquiries
3. Only include Ontario regions (Toronto, Ottawa, Mississauga, etc.)
4. Return ONLY the JSON object, no additional text

JSON Response:`;
  }

  /**
   * Parse AI response and validate structure
   * @param {string} aiResponse - Raw AI response
   * @param {string} originalText - Original customer text
   * @returns {Object} Validated intent structure
   */
  parseAIResponse(aiResponse, originalText) {
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonText = aiResponse.trim();
      
      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Find JSON object
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonText);
      
      // Validate and enhance the response
      return this.validateAndEnhance(parsed, originalText);
      
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.log('Raw AI response:', aiResponse);
      
      // Fallback to rule-based extraction
      return this.extractWithRules(originalText);
    }
  }

  /**
   * Rule-based extraction (fallback when AI is unavailable)
   * @param {string} rawText - Raw customer text
   * @returns {Object} Structured intent
   */
  extractWithRules(rawText) {
    const lowerText = rawText.toLowerCase();
    
    // Detect small business intent
    const businessKeywords = [
      'starting a business', 'start a business', 'new business',
      'business startup', 'open a business', 'launch a business',
      'small business', 'entrepreneur', 'business owner'
    ];
    const isSmallBusiness = businessKeywords.some(keyword => lowerText.includes(keyword));

    // Detect Line of Business
    const commercialKeywords = [
      'ebitda', 'revenue', 'business loan', 'commercial loan', 'business account',
      'merchant services', 'payroll', 'equipment financing', 'fleet financing',
      'commercial mortgage', 'business credit card', 'corporate account',
      'llc', 'inc', 'corporation', 'ltd', 'company', 'business', 'enterprise',
      'firm', 'organization', 'inventory', 'accounts receivable', 'accounts payable',
      'cash flow management', 'working capital', 'trade finance'
    ];
    
    const retailKeywords = [
      'tfsa', 'rrsp', 'resp', 'personal loan', 'personal account',
      'chequing account', 'savings account', 'gic', 'retirement',
      'personal investment', 'home purchase', 'car loan', 'student loan',
      'personal credit card', 'overdraft protection', 'my family',
      'personal', 'individual', 'household'
    ];

    const hasCommercialKeywords = commercialKeywords.some(keyword => lowerText.includes(keyword));
    const hasRetailKeywords = retailKeywords.some(keyword => lowerText.includes(keyword));
    
    // Determine Line of Business (Commercial takes priority)
    let lineOfBusiness = 'Retail'; // Default
    if (hasCommercialKeywords || isSmallBusiness) {
      lineOfBusiness = 'Commercial';
    } else if (hasRetailKeywords) {
      lineOfBusiness = 'Retail';
    }

    // Detect banking product
    let detectedProduct = 'Not Specified';
    for (const product of this.bankingProducts) {
      if (lowerText.includes(product.toLowerCase())) {
        detectedProduct = product;
        break;
      }
    }

    // Detect Ontario region
    let detectedRegion = 'Not Specified';
    for (const region of this.ontarioRegions) {
      if (lowerText.includes(region.toLowerCase())) {
        detectedRegion = region;
        break;
      }
    }

    // Detect lead source
    let leadSource = 'Not Specified';
    if (lowerText.includes('branch') || lowerText.includes('in person')) {
      leadSource = 'Branch Walk-in';
    } else if (lowerText.includes('phone') || lowerText.includes('call')) {
      leadSource = 'Phone Call';
    } else if (lowerText.includes('chat') || lowerText.includes('online')) {
      leadSource = 'Online Chat';
    } else if (lowerText.includes('email')) {
      leadSource = 'Email';
    } else if (lowerText.includes('app') || lowerText.includes('mobile')) {
      leadSource = 'Mobile App';
    }

    // Calculate urgency
    let urgencyScore = 5; // Default
    if (isSmallBusiness) urgencyScore = 9;
    else if (lowerText.includes('urgent') || lowerText.includes('asap')) urgencyScore = 8;
    else if (lowerText.includes('soon') || lowerText.includes('quickly')) urgencyScore = 7;
    else if (lowerText.includes('when possible') || lowerText.includes('no rush')) urgencyScore = 3;

    // Extract keywords
    const keywords = this.extractKeywords(rawText);

    const result = {
      Lead_Source: leadSource,
      Banking_Product: detectedProduct,
      LineOfBusiness: lineOfBusiness,
      Ontario_Region: detectedRegion,
      Urgency_Score: urgencyScore,
      Small_Business_Flag: isSmallBusiness,
      Priority_Level: isSmallBusiness ? 'High Priority' : (urgencyScore >= 7 ? 'Standard' : 'Low'),
      Extracted_Keywords: keywords,
      Confidence_Score: 0.6, // Lower confidence for rule-based
      Extraction_Method: 'Rule-Based',
      Timestamp: new Date().toISOString(),
      Original_Text: rawText
    };

    // Enforce business startup rules
    if (result.Small_Business_Flag) {
      result.Priority_Level = 'High Priority';
      result.LineOfBusiness = 'Commercial';
      if (result.Urgency_Score < 8) {
        result.Urgency_Score = 9;
      }
    }

    return result;
  }

  /**
   * Validate and enhance AI-extracted data
   * @param {Object} data - Parsed AI response
   * @param {string} originalText - Original customer text
   * @returns {Object} Validated and enhanced data
   */
  validateAndEnhance(data, originalText) {
    // Ensure all required fields exist
    const validated = {
      Lead_Source: data.Lead_Source || 'Not Specified',
      Banking_Product: data.Banking_Product || 'Not Specified',
      LineOfBusiness: data.LineOfBusiness || 'Retail',
      Ontario_Region: data.Ontario_Region || 'Not Specified',
      Urgency_Score: Math.min(10, Math.max(1, data.Urgency_Score || 5)),
      Small_Business_Flag: Boolean(data.Small_Business_Flag),
      Priority_Level: data.Priority_Level || 'Standard',
      Extracted_Keywords: Array.isArray(data.Extracted_Keywords) ? data.Extracted_Keywords : [],
      Confidence_Score: Math.min(1.0, Math.max(0.0, data.Confidence_Score || 0.8)),
      Extraction_Method: this.watsonxAvailable ? 'Watsonx.ai' : 'Gemini',
      Timestamp: new Date().toISOString(),
      Original_Text: originalText
    };

    // Validate LineOfBusiness (must be Commercial or Retail)
    if (validated.LineOfBusiness !== 'Commercial' && validated.LineOfBusiness !== 'Retail') {
      validated.LineOfBusiness = 'Retail'; // Default to Retail if invalid
    }

    // Enforce business startup rules
    if (validated.Small_Business_Flag) {
      validated.Priority_Level = 'High Priority';
      validated.LineOfBusiness = 'Commercial'; // Business startups are always Commercial
      if (validated.Urgency_Score < 8) {
        validated.Urgency_Score = 9;
      }
      if (!validated.Extracted_Keywords.includes('Small Business')) {
        validated.Extracted_Keywords.push('Small Business');
      }
    }

    // Validate Ontario region
    if (validated.Ontario_Region !== 'Not Specified') {
      const regionValid = this.ontarioRegions.some(
        region => region.toLowerCase() === validated.Ontario_Region.toLowerCase()
      );
      if (!regionValid) {
        validated.Ontario_Region = 'Not Specified';
        validated.Region_Note = 'Region not in Ontario list';
      }
    }

    return validated;
  }

  /**
   * Extract keywords from text
   * @param {string} text - Input text
   * @returns {Array<string>} Extracted keywords
   */
  extractKeywords(text) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'can', 'i', 'you', 'he', 'she',
      'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
    ]);

    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));

    // Get unique words and sort by frequency
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
  }

  /**
   * Batch process multiple customer interactions
   * @param {Array<string>} textArray - Array of customer interaction texts
   * @returns {Promise<Array<Object>>} Array of extracted intents
   */
  async batchExtractIntents(textArray) {
    if (!Array.isArray(textArray)) {
      throw new Error('Input must be an array of strings');
    }

    const results = [];
    for (const text of textArray) {
      try {
        const intent = await this.extractIntent(text);
        results.push(intent);
      } catch (error) {
        console.error('Error processing text:', error);
        results.push({
          error: error.message,
          original_text: text
        });
      }
    }

    return results;
  }

  /**
   * Get service status
   * @returns {Object} Status of AI services
   */
  getStatus() {
    return {
      watsonx: {
        available: this.watsonxAvailable,
        configured: Boolean(process.env.WATSONX_API_KEY && process.env.WATSONX_PROJECT_ID)
      },
      gemini: {
        available: this.geminiAvailable,
        configured: Boolean(process.env.GEMINI_API_KEY)
      },
      fallback: 'Rule-Based Extraction',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new Referee();

// Made with Bob