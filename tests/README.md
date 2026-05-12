# Demo Scripts - ReferralFlow Reflip

This directory contains demo scripts and test payloads for demonstrating the ReferralFlow Reflip intent extraction and badge assignment system.

## Files

- **`demo_payloads.json`** - Contains three demo scenarios with expected outcomes
- **`demo.js`** - Node.js script that sends demo payloads to the API
- **`README.md`** - This file

## Demo Scenarios

### 1. High-Value Commercial Lead 🔵
- **Keywords**: EBITDA, payroll, business loan, corporate credit card
- **Expected Badge**: Blue (Commercial)
- **Priority**: Standard
- **Description**: CFO of a tech company looking for commercial banking services

### 2. Standard Retail Lead 🟢
- **Keywords**: TFSA, personal account, GIC, RRSP
- **Expected Badge**: Green (Retail)
- **Priority**: Standard
- **Description**: Individual looking to open retirement savings accounts

### 3. Small Business Startup 🔵
- **Keywords**: Starting a new company, small business loan, business account
- **Expected Badge**: Blue (Commercial)
- **Priority**: High Priority
- **Description**: Entrepreneur starting a consulting firm

## Running the Demo

### Prerequisites

1. Make sure the ReferralFlow Reflip server is running:
   ```bash
   npm start
   ```

2. The server should be accessible at `http://localhost:3000`

### Execute Demo

Open a new terminal and run:

```bash
npm run demo
```

Or directly:

```bash
node tests/demo.js
```

### What the Demo Does

1. Loads the three scenarios from `demo_payloads.json`
2. Sends each scenario to the `/api/referee/extract` endpoint
3. Displays the extracted intent data with color-coded output
4. Shows expected vs actual results
5. Indicates which badge (Blue/Green) should appear on the dashboard
6. Provides a summary of successful/failed requests

### Expected Output

The demo script will display:
- 📋 Scenario details
- 🎯 Customer interaction text
- 📊 Expected intent data
- ✅ Actual extracted intent
- 🔵/🟢 Badge assignment (Blue for Commercial, Green for Retail)
- ✓ Validation results

### Environment Variables

You can customize the API endpoint:

```bash
# Custom host and port
API_HOST=localhost API_PORT=3000 npm run demo

# Different environment
API_HOST=staging.example.com API_PORT=8080 npm run demo
```

## Verifying Results

After running the demo:

1. Open your dashboard at `http://localhost:3000`
2. You should see three new leads with the following badges:
   - **TechStart Solutions Inc.** - 🔵 Blue Badge (Commercial)
   - **TFSA Account Inquiry** - 🟢 Green Badge (Retail)
   - **New Consulting Firm** - 🔵 Blue Badge (Commercial, High Priority)

## Badge Assignment Logic

### Blue Badge (Commercial) 🔵
Assigned when the text contains:
- Business keywords: EBITDA, revenue, payroll, business loan
- Company indicators: LLC, Inc, Corporation, business
- Business operations: inventory, accounts receivable, cash flow

### Green Badge (Retail) 🟢
Assigned when the text contains:
- Personal banking: TFSA, RRSP, RESP, personal loan
- Personal finance: retirement, personal investment, mortgage
- Individual indicators: personal, individual, household

### High Priority Flag
Automatically assigned to:
- Small business startups (mentions "starting a business")
- Urgent requests
- High-value commercial leads

## Troubleshooting

### Connection Refused
- Ensure the server is running (`npm start`)
- Check that port 3000 is not blocked
- Verify no firewall issues

### Unexpected Results
- Check the AI service status: `GET /api/referee/status`
- Review the extraction method used (Watsonx.ai, Gemini, or Rule-Based)
- Verify environment variables in `.env` file

### No Badges Appearing
- Ensure the dashboard is properly connected to the API
- Check browser console for errors
- Verify the intent data includes `LineOfBusiness` field

## Adding Custom Scenarios

Edit `demo_payloads.json` to add your own scenarios:

```json
{
  "name": "Your Scenario Name",
  "description": "Description of what this tests",
  "payload": {
    "text": "Customer interaction text here..."
  },
  "expectedIntent": {
    "LineOfBusiness": "Commercial or Retail",
    "Banking_Product": "Product name",
    "Small_Business_Flag": true/false,
    "Priority_Level": "High Priority or Standard",
    "Ontario_Region": "City name",
    "Urgency_Score": 1-10
  }
}
```

## API Endpoints Used

- **POST** `/api/referee/extract` - Extract intent from single text
- **GET** `/api/referee/status` - Check AI service status
- **GET** `/health` - Server health check

## Support

For issues or questions:
1. Check the main README.md
2. Review the REFEREE_README.md in the core directory
3. Check server logs for detailed error messages

---

Made with Bob 🤖