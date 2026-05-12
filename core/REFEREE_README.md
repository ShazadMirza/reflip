# Referee - Intent Extraction Agent

## Overview

The Referee is an intelligent intent-extraction agent that analyzes raw text from bank customer interactions and returns structured JSON data. It uses IBM Watsonx.ai as the primary AI engine with Google Gemini as a fallback, and includes a rule-based extraction system as a last resort.

## Features

- **Multi-AI Support**: Watsonx.ai (primary) → Gemini (fallback) → Rule-based (last resort)
- **Structured Output**: Returns consistent JSON format with banking-specific fields
- **Small Business Detection**: Automatically flags and prioritizes business startup inquiries
- **Ontario Region Recognition**: Validates and extracts Ontario-specific locations
- **Banking Product Identification**: Recognizes various banking products and services
- **Urgency Scoring**: Assigns urgency scores (1-10) based on customer needs
- **Batch Processing**: Process multiple customer interactions in a single request

## Output Structure

```json
{
  "Lead_Source": "Branch Walk-in | Phone Call | Online Chat | Email | Mobile App | Referral",
  "Banking_Product": "Mortgage | Business Loan | Savings Account | etc.",
  "Ontario_Region": "Toronto | Ottawa | Mississauga | etc. | Not Specified",
  "Urgency_Score": 1-10,
  "Small_Business_Flag": true/false,
  "Priority_Level": "High Priority | Standard | Low",
  "Extracted_Keywords": ["keyword1", "keyword2", ...],
  "Confidence_Score": 0.0-1.0,
  "Extraction_Method": "Watsonx.ai | Gemini | Rule-Based",
  "Timestamp": "ISO 8601 timestamp",
  "Original_Text": "original customer text"
}
```

## Special Rules

### Small Business Priority
When a customer mentions:
- "starting a business"
- "start a business"
- "new business"
- "business startup"
- "open a business"
- "launch a business"

The system automatically:
- Sets `Small_Business_Flag` to `true`
- Sets `Priority_Level` to `"High Priority"`
- Sets `Urgency_Score` to 9 (if not already higher)
- Adds "Small Business" to `Extracted_Keywords`

### Urgency Scoring
- **9-10**: Small business startups, critical/emergency situations
- **7-8**: Urgent requests, time-sensitive matters
- **5-6**: Standard requests, normal priority
- **3-4**: General inquiries, low urgency
- **1-2**: Information requests, no urgency

## API Endpoints

### 1. Extract Single Intent
**POST** `/api/referee/extract`

Extract intent from a single customer interaction.

**Request:**
```json
{
  "text": "Hi, I'm interested in starting a business in Toronto and need a business loan."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "Lead_Source": "Not Specified",
    "Banking_Product": "Business Loan",
    "Ontario_Region": "Toronto",
    "Urgency_Score": 9,
    "Small_Business_Flag": true,
    "Priority_Level": "High Priority",
    "Extracted_Keywords": ["Starting", "Business", "Toronto", "Business", "Loan"],
    "Confidence_Score": 0.95,
    "Extraction_Method": "Watsonx.ai",
    "Timestamp": "2026-05-12T00:00:00.000Z",
    "Original_Text": "Hi, I'm interested in starting a business in Toronto..."
  },
  "timestamp": "2026-05-12T00:00:00.000Z"
}
```

### 2. Batch Extract
**POST** `/api/referee/batch`

Process multiple customer interactions (max 50 per request).

**Request:**
```json
{
  "texts": [
    "I need a mortgage in Ottawa",
    "Starting a business in Mississauga, need help",
    "Can I open a savings account?"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    { /* intent 1 */ },
    { /* intent 2 */ },
    { /* intent 3 */ }
  ],
  "timestamp": "2026-05-12T00:00:00.000Z"
}
```

### 3. Service Status
**GET** `/api/referee/status`

Check the status of AI services.

**Response:**
```json
{
  "success": true,
  "status": {
    "watsonx": {
      "available": true,
      "configured": true
    },
    "gemini": {
      "available": true,
      "configured": true
    },
    "fallback": "Rule-Based Extraction",
    "timestamp": "2026-05-12T00:00:00.000Z"
  },
  "timestamp": "2026-05-12T00:00:00.000Z"
}
```

### 4. Test Endpoint
**POST** `/api/referee/test`

Run test extraction on sample data.

**Response:**
```json
{
  "success": true,
  "message": "Test completed successfully",
  "sample_count": 5,
  "results": [ /* array of test results */ ],
  "timestamp": "2026-05-12T00:00:00.000Z"
}
```

### 5. Health Check
**GET** `/api/referee/health`

Simple health check for the referee service.

**Response:**
```json
{
  "status": "healthy",
  "service": "Referee Intent Extraction",
  "timestamp": "2026-05-12T00:00:00.000Z"
}
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# IBM Watsonx.ai Configuration (Primary)
WATSONX_API_KEY=your_watsonx_api_key_here
WATSONX_PROJECT_ID=your_watsonx_project_id_here
WATSONX_URL=https://us-south.ml.cloud.ibm.com

# Google Gemini Configuration (Fallback)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Getting API Keys

**Watsonx.ai:**
1. Sign up at [IBM Cloud](https://cloud.ibm.com/)
2. Create a Watsonx.ai instance
3. Get your API key and Project ID from the credentials page

**Gemini:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file

## Usage Examples

### Node.js/JavaScript

```javascript
const axios = require('axios');

// Extract single intent
async function extractIntent(text) {
  const response = await axios.post('http://localhost:3000/api/referee/extract', {
    text: text
  });
  return response.data;
}

// Example usage
const result = await extractIntent(
  "I'm planning to start a small business in Hamilton next month"
);
console.log(result.data);
```

### cURL

```bash
# Extract single intent
curl -X POST http://localhost:3000/api/referee/extract \
  -H "Content-Type: application/json" \
  -d '{"text": "I need a business loan to start my company in Toronto"}'

# Batch extract
curl -X POST http://localhost:3000/api/referee/batch \
  -H "Content-Type: application/json" \
  -d '{"texts": ["text1", "text2", "text3"]}'

# Check status
curl http://localhost:3000/api/referee/status

# Run test
curl -X POST http://localhost:3000/api/referee/test
```

### Python

```python
import requests

def extract_intent(text):
    response = requests.post(
        'http://localhost:3000/api/referee/extract',
        json={'text': text}
    )
    return response.json()

# Example usage
result = extract_intent(
    "I'm interested in starting a business in Ottawa and need financing"
)
print(result['data'])
```

## Supported Banking Products

- Mortgage
- Personal Loan
- Business Loan
- Line of Credit
- Credit Card
- Savings Account
- Chequing Account
- Investment Account
- RRSP (Registered Retirement Savings Plan)
- TFSA (Tax-Free Savings Account)
- GIC (Guaranteed Investment Certificate)
- RESP (Registered Education Savings Plan)
- Small Business Account
- Commercial Banking
- Wealth Management
- Insurance
- Foreign Exchange
- Business Credit Card

## Supported Ontario Regions

Major cities and regions including:
- Toronto, Ottawa, Mississauga, Brampton, Hamilton
- London, Markham, Vaughan, Kitchener, Windsor
- Richmond Hill, Oakville, Burlington, Greater Sudbury
- And 30+ more Ontario cities and regions

## Error Handling

The system includes comprehensive error handling:

1. **Invalid Input**: Returns 400 with error message
2. **AI Service Failure**: Automatically falls back to next available service
3. **All Services Down**: Uses rule-based extraction
4. **Parsing Errors**: Gracefully handles malformed AI responses

## Performance

- **Single Extraction**: ~1-3 seconds (depending on AI service)
- **Batch Processing**: ~2-5 seconds for 10 texts
- **Rule-Based Fallback**: <100ms (instant)

## Best Practices

1. **Always provide context**: More detailed text = better extraction
2. **Use batch processing**: More efficient for multiple texts
3. **Monitor confidence scores**: Lower scores may need manual review
4. **Check extraction method**: Know which AI service was used
5. **Handle errors gracefully**: Always have fallback logic

## Troubleshooting

### AI Services Not Available
- Check API keys in `.env`
- Verify network connectivity
- Check service status endpoint
- System will fall back to rule-based extraction

### Low Confidence Scores
- Provide more detailed customer text
- Include specific product names and locations
- Add context about customer needs

### Incorrect Region Detection
- Ensure Ontario city names are spelled correctly
- Use full city names (not abbreviations)
- System validates against known Ontario regions

## Integration with Salesforce

The extracted intent data can be directly used to create Salesforce leads:

```javascript
const referee = require('./core/referee');
const salesforceService = require('./services/salesforceService');

async function processCustomerInteraction(text) {
  // Extract intent
  const intent = await referee.extractIntent(text);
  
  // Create Salesforce lead if high priority
  if (intent.Small_Business_Flag) {
    await salesforceService.createLead({
      FirstName: 'Customer',
      LastName: 'Name',
      Company: 'Prospect',
      LeadSource: intent.Lead_Source,
      Product_Interest__c: intent.Banking_Product,
      Region__c: intent.Ontario_Region,
      Priority__c: intent.Priority_Level,
      Description: intent.Original_Text
    });
  }
  
  return intent;
}
```

## License

Made with Bob

## Support

For issues or questions, please contact the development team.