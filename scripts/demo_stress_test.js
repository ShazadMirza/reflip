#!/usr/bin/env node

/**
 * Stress Test Script - ReferralFlow Reflip
 * Tests the "Zero Dropped Leads" logic by sending three specific scenarios:
 * 1. Commercial Whale - Should succeed with Commercial badge
 * 2. Retail Saver - Should succeed with Retail badge
 * 3. Forced Fallback - Should trigger timeout and use fallback logic
 */

const http = require('http');

// Configuration
const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 3000;
const API_ENDPOINT = '/api/salesforce/referrals';
const DELAY_BETWEEN_REQUESTS = 3000; // 3 seconds between requests

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Print colored console output
 */
function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Print section header
 */
function printHeader(text) {
  console.log('\n' + '='.repeat(80));
  log(text, 'cyan');
  console.log('='.repeat(80) + '\n');
}

/**
 * Generate a very long nonsensical transcript to trigger timeout
 */
function generateLongNonsenseTranscript() {
  const nonsenseWords = [
    'quantum', 'synergy', 'paradigm', 'leverage', 'optimize', 'streamline',
    'innovative', 'disruptive', 'scalable', 'agile', 'robust', 'dynamic',
    'strategic', 'holistic', 'integrated', 'comprehensive', 'cutting-edge'
  ];
  
  let transcript = '';
  for (let i = 0; i < 500; i++) {
    const word1 = nonsenseWords[Math.floor(Math.random() * nonsenseWords.length)];
    const word2 = nonsenseWords[Math.floor(Math.random() * nonsenseWords.length)];
    const word3 = nonsenseWords[Math.floor(Math.random() * nonsenseWords.length)];
    transcript += `${word1} ${word2} ${word3} framework implementation strategy. `;
  }
  return transcript;
}

/**
 * Test scenarios
 */
const scenarios = [
  {
    name: 'The Commercial Whale',
    description: 'High-value commercial client with EBITDA and equipment financing',
    expectedOutcome: {
      LineOfBusiness: 'Commercial',
      AI_Status: 'Success',
      badge: '🔵 BLUE'
    },
    payload: {
      Patient_Name__c: 'TechCorp Industries Inc.',
      Condition__c: 'We are looking to expand our manufacturing operations in Toronto. Our current EBITDA is approximately $2M annually, and we need $2M in equipment financing to purchase new machinery. We also need to discuss payroll services for our 75 employees and would like to explore commercial banking solutions including a business line of credit and merchant services. This is a time-sensitive opportunity as we have a contract starting next quarter.',
      Specialty__c: 'Commercial',
      Referring_Physician__c: 'Commercial Banking Advisor',
      Referral_Date__c: new Date().toISOString().split('T')[0],
      Status__c: 'Pending'
    }
  },
  {
    name: 'The Retail Saver',
    description: 'Personal banking client opening TFSA for family',
    expectedOutcome: {
      LineOfBusiness: 'Retail',
      AI_Status: 'Success',
      badge: '🟢 GREEN'
    },
    payload: {
      Patient_Name__c: 'Sarah Johnson',
      Condition__c: 'Hi, I would like to open a TFSA account for my daughter who just turned 18. We are interested in learning about your savings options, GIC rates, and RRSP products for long-term retirement planning. I currently have a personal chequing account with another bank but am considering consolidating all my family\'s banking with you. We live in Ottawa and would prefer to work with a local branch advisor.',
      Specialty__c: 'Retail',
      Referring_Physician__c: 'Personal Banking Advisor',
      Referral_Date__c: new Date().toISOString().split('T')[0],
      Status__c: 'Pending'
    }
  },
  {
    name: 'The Forced Fallback',
    description: 'Extremely long nonsensical transcript designed to trigger AI timeout',
    expectedOutcome: {
      LineOfBusiness: 'Retail', // Fallback default
      AI_Status: 'Fallback',
      badge: '🟢 GREEN (Fallback)'
    },
    payload: {
      Patient_Name__c: 'Timeout Test Client',
      Condition__c: generateLongNonsenseTranscript(),
      Specialty__c: 'Retail',
      Referring_Physician__c: 'Test Advisor',
      Referral_Date__c: new Date().toISOString().split('T')[0],
      Status__c: 'Pending'
    }
  }
];

/**
 * Send HTTP POST request
 */
function sendRequest(payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);

    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: API_ENDPOINT,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 30000 // 30 second timeout for the HTTP request itself
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 201 || res.statusCode === 200) {
            resolve(response);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${response.message || data}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('HTTP request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Wait for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Print scenario details
 */
function printScenario(scenario, index) {
  log(`\n🧪 Test ${index + 1}: ${scenario.name}`, 'bright');
  log(`   ${scenario.description}`, 'dim');
  log(`\n   Expected Outcome:`, 'yellow');
  log(`   • Line of Business: ${scenario.expectedOutcome.LineOfBusiness}`, 'white');
  log(`   • AI Status: ${scenario.expectedOutcome.AI_Status}`, 'white');
  log(`   • Dashboard Badge: ${scenario.expectedOutcome.badge}`, 'white');
  log(`\n   Patient Name: ${scenario.payload.Patient_Name__c}`, 'dim');
  log(`   Transcript Length: ${scenario.payload.Condition__c.length} characters`, 'dim');
}

/**
 * Print test results
 */
function printResults(scenario, response) {
  const aiStatus = response.aiStatus || 'Unknown';
  const lineOfBusiness = response.referral?.LineOfBusiness__c || 
                         response.aiAnalysis?.LineOfBusiness || 
                         'Unknown';
  
  log('\n   Actual Result:', 'green');
  log(`   • Line of Business: ${lineOfBusiness}`, 'white');
  log(`   • AI Status: ${aiStatus}`, 'white');
  log(`   • AI Method: ${response.aiAnalysis?.Extraction_Method || 'Unknown'}`, 'white');
  log(`   • Confidence: ${((response.aiAnalysis?.Confidence_Score || 0) * 100).toFixed(1)}%`, 'white');
  
  if (response.referral?.Id) {
    log(`   • Salesforce ID: ${response.referral.Id}`, 'dim');
  }
  
  if (aiStatus === 'Fallback') {
    log(`   • Fallback Reason: ${response.aiAnalysis?.Fallback_Reason || 'Unknown'}`, 'yellow');
  }

  // Badge indicator
  const badge = lineOfBusiness === 'Commercial' ? '🔵 BLUE' : '🟢 GREEN';
  const badgeColor = lineOfBusiness === 'Commercial' ? 'blue' : 'green';
  const fallbackNote = aiStatus === 'Fallback' ? ' (Fallback)' : '';
  log(`\n   Dashboard Badge: ${badge}${fallbackNote}`, badgeColor);

  // Validation
  const lobMatch = lineOfBusiness === scenario.expectedOutcome.LineOfBusiness;
  const statusMatch = aiStatus === scenario.expectedOutcome.AI_Status;
  
  if (lobMatch && statusMatch) {
    log('   ✓ Test PASSED - All expectations met!', 'green');
  } else {
    log('   ⚠ Test result differs from expectations:', 'yellow');
    if (!lobMatch) log(`     - Expected LOB: ${scenario.expectedOutcome.LineOfBusiness}, Got: ${lineOfBusiness}`, 'yellow');
    if (!statusMatch) log(`     - Expected Status: ${scenario.expectedOutcome.AI_Status}, Got: ${aiStatus}`, 'yellow');
  }

  // Zero Dropped Leads verification
  if (response.success && response.referral?.Id) {
    log('   ✓ ZERO DROPPED LEADS: Lead successfully created in Salesforce!', 'green');
  } else {
    log('   ✗ WARNING: Lead may not have been created!', 'red');
  }
}

/**
 * Main stress test function
 */
async function runStressTest() {
  try {
    // Print banner
    printHeader('🔥 ReferralFlow Reflip - Zero Dropped Leads Stress Test');
    log('This script tests the fallback logic by sending three scenarios:', 'white');
    log('1. 🔵 Commercial Whale - High-value commercial client', 'blue');
    log('2. 🟢 Retail Saver - Personal banking client', 'green');
    log('3. ⚠️  Forced Fallback - Timeout scenario to test fallback logic', 'yellow');
    log(`\nAPI Endpoint: http://${API_HOST}:${API_PORT}${API_ENDPOINT}`, 'dim');
    log('\nEach test will verify:', 'white');
    log('  • Correct Line of Business assignment (Commercial/Retail)', 'white');
    log('  • AI Status (Success/Fallback)', 'white');
    log('  • Lead creation in Salesforce (Zero Dropped Leads)', 'white');

    // Process each scenario
    const results = [];
    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      
      printScenario(scenario, i);
      log('\n   Sending request to API...', 'yellow');

      const startTime = Date.now();
      
      try {
        const response = await sendRequest(scenario.payload);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        log(`   ✓ Request completed in ${duration}s`, 'green');
        printResults(scenario, response);
        
        results.push({
          scenario: scenario.name,
          success: true,
          aiStatus: response.aiStatus,
          lineOfBusiness: response.referral?.LineOfBusiness__c || response.aiAnalysis?.LineOfBusiness,
          salesforceId: response.referral?.Id,
          duration: duration
        });
      } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        log(`   ✗ Request failed after ${duration}s: ${error.message}`, 'red');
        results.push({
          scenario: scenario.name,
          success: false,
          error: error.message,
          duration: duration
        });
      }

      // Wait before next request (except for last one)
      if (i < scenarios.length - 1) {
        log(`\n   Waiting ${DELAY_BETWEEN_REQUESTS / 1000} seconds before next test...`, 'dim');
        await sleep(DELAY_BETWEEN_REQUESTS);
      }
    }

    // Print summary
    printHeader('📊 Stress Test Summary');
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const fallbacks = results.filter(r => r.aiStatus === 'Fallback').length;
    const commercial = results.filter(r => r.lineOfBusiness === 'Commercial').length;
    const retail = results.filter(r => r.lineOfBusiness === 'Retail').length;
    
    log(`Total Tests: ${results.length}`, 'white');
    log(`Successful: ${successful}`, 'green');
    log(`Failed: ${failed}`, failed > 0 ? 'red' : 'white');
    log(`AI Fallbacks: ${fallbacks}`, fallbacks > 0 ? 'yellow' : 'white');
    log(`\nBadge Distribution:`, 'white');
    log(`  🔵 Commercial: ${commercial}`, 'blue');
    log(`  🟢 Retail: ${retail}`, 'green');

    if (successful > 0) {
      log('\n✓ Zero Dropped Leads Verification:', 'green');
      results.filter(r => r.success).forEach(result => {
        const badge = result.lineOfBusiness === 'Commercial' ? '🔵' : '🟢';
        const statusIcon = result.aiStatus === 'Fallback' ? '⚠️' : '✓';
        log(`  ${statusIcon} ${badge} ${result.scenario}`, 'white');
        log(`     - AI Status: ${result.aiStatus}`, 'dim');
        log(`     - Salesforce ID: ${result.salesforceId || 'N/A'}`, 'dim');
        log(`     - Duration: ${result.duration}s`, 'dim');
      });
    }

    if (failed > 0) {
      log('\n⚠ Failed Tests:', 'yellow');
      results.filter(r => !r.success).forEach(result => {
        log(`  ✗ ${result.scenario}: ${result.error}`, 'red');
      });
    }

    log('\n📋 Next Steps:', 'cyan');
    log('  1. Check your dashboard at http://localhost:3000', 'white');
    log('  2. Verify the three leads appear with correct badges', 'white');
    log('  3. Check the AI_Status__c column for Success/Fallback indicators', 'white');
    log('  4. Confirm all leads were created (Zero Dropped Leads)', 'white');

    console.log('\n' + '='.repeat(80) + '\n');

    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);

  } catch (error) {
    log(`\n✗ Stress test failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the stress test
if (require.main === module) {
  log('\n🚀 Starting Zero Dropped Leads stress test...', 'cyan');
  runStressTest().catch(error => {
    log(`\n✗ Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runStressTest };

// Made with Bob