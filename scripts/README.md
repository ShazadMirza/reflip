# Scripts - ReferralFlow Reflip

This directory contains utility and testing scripts for the ReferralFlow Reflip system.

## Available Scripts

### 🔥 Stress Test - Zero Dropped Leads

**File:** `demo_stress_test.js`

Tests the "Zero Dropped Leads" logic by sending three specific scenarios to the Salesforce referrals endpoint.

#### Test Scenarios

1. **🔵 The Commercial Whale**
   - High-value commercial client with EBITDA and equipment financing
   - Expected: Commercial badge, AI Status = Success
   - Tests: Commercial keyword detection (EBITDA, payroll, equipment financing)

2. **🟢 The Retail Saver**
   - Personal banking client opening TFSA for family
   - Expected: Retail badge, AI Status = Success
   - Tests: Retail keyword detection (TFSA, RRSP, personal account)

3. **⚠️ The Forced Fallback**
   - Extremely long nonsensical transcript (designed to trigger timeout)
   - Expected: Retail badge (fallback default), AI Status = Fallback
   - Tests: Graceful fallback when AI times out or fails

#### Running the Stress Test

```bash
# Make sure the server is running first
npm start

# In a new terminal, run the stress test
npm run stress-test
```

Or directly:

```bash
node scripts/demo_stress_test.js
```

#### What It Tests

✅ **Zero Dropped Leads Logic**
- Verifies that leads are ALWAYS created in Salesforce, even when AI fails
- Tests the 10-second timeout mechanism
- Validates fallback data structure

✅ **Badge Assignment**
- Commercial (Blue) badge for business-related keywords
- Retail (Green) badge for personal banking keywords
- Correct fallback behavior

✅ **AI Status Tracking**
- `Success` - AI analysis completed successfully
- `Fallback` - AI failed, using fallback logic
- Proper error handling and logging

#### Expected Output

The script provides detailed, color-coded output showing:

```
🧪 Test 1: The Commercial Whale
   Expected Outcome:
   • Line of Business: Commercial
   • AI Status: Success
   • Dashboard Badge: 🔵 BLUE

   Actual Result:
   • Line of Business: Commercial
   • AI Status: Success
   • AI Method: Rule-Based
   • Confidence: 60.0%
   • Salesforce ID: 00Q...
   
   Dashboard Badge: 🔵 BLUE
   ✓ Test PASSED - All expectations met!
   ✓ ZERO DROPPED LEADS: Lead successfully created in Salesforce!
```

#### Verification Steps

After running the stress test:

1. **Check Dashboard** - Open http://localhost:3000
2. **Verify Leads** - You should see three new leads:
   - TechCorp Industries Inc. - 🔵 Blue Badge (Commercial)
   - Sarah Johnson - 🟢 Green Badge (Retail)
   - Timeout Test Client - 🟢 Green Badge (Fallback)

3. **Check AI Status Column** - Verify the `AI_Status__c` field shows:
   - First two: `Success`
   - Third one: `Fallback`

4. **Confirm Zero Dropped Leads** - All three leads should have Salesforce IDs

#### Environment Variables

Customize the API endpoint if needed:

```bash
API_HOST=localhost API_PORT=3000 npm run stress-test
```

#### Understanding the Results

**Success Indicators:**
- ✓ Green checkmarks for passed tests
- Salesforce ID present for each lead
- Correct badge assignment (Blue/Green)
- AI Status matches expectations

**Fallback Indicators:**
- ⚠️ Yellow warnings for fallback scenarios
- `AI_Status: Fallback` in output
- `Fallback_Reason` field populated
- Lead still created successfully (Zero Dropped Leads)

**Failure Indicators:**
- ✗ Red X marks for failed tests
- Missing Salesforce IDs
- HTTP errors or timeouts

#### Performance Metrics

The script tracks:
- Request duration for each test
- Total successful vs failed requests
- Fallback rate
- Badge distribution (Commercial vs Retail)

#### Troubleshooting

**Connection Refused**
```bash
# Ensure server is running
npm start
```

**All Tests Show Fallback**
- Check if Watsonx.ai or Gemini API keys are configured
- Review `.env` file for valid credentials
- Check server logs for AI service errors

**Timeout Test Not Triggering Fallback**
- The timeout is set to 10 seconds in the route
- Very long transcript should exceed this
- Check server logs for timeout messages

**Leads Not Appearing in Dashboard**
- Verify Salesforce connection is working
- Check `POST /api/salesforce/auth/test` endpoint
- Review Salesforce credentials in `.env`

#### Technical Details

**Timeout Mechanism:**
```javascript
// In salesforceRoutes.js
const analysisPromise = referee.extractIntent(text);
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('AI analysis timeout')), 10000)
);
const result = await Promise.race([analysisPromise, timeoutPromise]);
```

**Fallback Data Structure:**
```javascript
{
  LineOfBusiness: 'Retail',  // Default fallback
  Urgency_Score: 5,
  Priority_Level: 'Standard',
  Confidence_Score: 0.5,
  Extraction_Method: 'Fallback',
  Fallback_Reason: 'AI analysis timeout'
}
```

**Zero Dropped Leads Guarantee:**
```javascript
// Lead is ALWAYS created, even if AI fails
const result = await salesforceService.createReferral(enhancedReferralData);
```

#### Integration with CI/CD

This script can be integrated into your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run Stress Test
  run: |
    npm start &
    sleep 5
    npm run stress-test
```

#### Extending the Tests

To add more test scenarios, edit the `scenarios` array in `demo_stress_test.js`:

```javascript
{
  name: 'Your Test Name',
  description: 'What this tests',
  expectedOutcome: {
    LineOfBusiness: 'Commercial' or 'Retail',
    AI_Status: 'Success' or 'Fallback',
    badge: '🔵 BLUE' or '🟢 GREEN'
  },
  payload: {
    Patient_Name__c: 'Client Name',
    Condition__c: 'Customer interaction text...',
    Specialty__c: 'Commercial' or 'Retail',
    // ... other fields
  }
}
```

## Support

For issues or questions:
1. Check the main README.md
2. Review server logs for detailed error messages
3. Verify environment variables in `.env`
4. Test Salesforce connection: `POST /api/salesforce/auth/test`

---

Made with Bob 🤖