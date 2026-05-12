#!/usr/bin/env node

/**
 * Demo Script - ReferralFlow Reflip
 * Sends demo payloads to the API to demonstrate intent extraction and badge assignment
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuration
const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 3000;
const API_ENDPOINT = '/api/referee/extract';
const DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds between requests

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
  console.log('\n' + '='.repeat(70));
  log(text, 'cyan');
  console.log('='.repeat(70) + '\n');
}

/**
 * Print scenario details
 */
function printScenario(scenario, index) {
  log(`\n📋 Scenario ${index + 1}: ${scenario.name}`, 'bright');
  log(`   ${scenario.description}`, 'dim');
  log(`\n   Customer Text:`, 'yellow');
  log(`   "${scenario.payload.text.substring(0, 100)}..."`, 'white');
}

/**
 * Print expected vs actual results
 */
function printResults(expected, actual) {
  log('\n   Expected Intent:', 'yellow');
  log(`   • Line of Business: ${expected.LineOfBusiness}`, 'white');
  log(`   • Banking Product: ${expected.Banking_Product}`, 'white');
  log(`   • Small Business: ${expected.Small_Business_Flag}`, 'white');
  log(`   • Priority: ${expected.Priority_Level}`, 'white');
  log(`   • Region: ${expected.Ontario_Region}`, 'white');
  log(`   • Urgency: ${expected.Urgency_Score}/10`, 'white');

  log('\n   Actual Result:', 'green');
  log(`   • Line of Business: ${actual.LineOfBusiness}`, 'white');
  log(`   • Banking Product: ${actual.Banking_Product}`, 'white');
  log(`   • Small Business: ${actual.Small_Business_Flag}`, 'white');
  log(`   • Priority: ${actual.Priority_Level}`, 'white');
  log(`   • Region: ${actual.Ontario_Region}`, 'white');
  log(`   • Urgency: ${actual.Urgency_Score}/10`, 'white');
  log(`   • Confidence: ${(actual.Confidence_Score * 100).toFixed(1)}%`, 'white');
  log(`   • Method: ${actual.Extraction_Method}`, 'white');

  // Badge indicator
  const badge = actual.LineOfBusiness === 'Commercial' ? '🔵 BLUE' : '🟢 GREEN';
  const badgeColor = actual.LineOfBusiness === 'Commercial' ? 'blue' : 'green';
  log(`\n   Dashboard Badge: ${badge} (${actual.LineOfBusiness})`, badgeColor);

  // Validation
  const matches = actual.LineOfBusiness === expected.LineOfBusiness;
  if (matches) {
    log('   ✓ Line of Business matches expected!', 'green');
  } else {
    log('   ✗ Line of Business does not match expected', 'red');
  }
}

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
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200) {
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
 * Main demo function
 */
async function runDemo() {
  try {
    // Print banner
    printHeader('🎯 ReferralFlow Reflip - Demo Script');
    log('This script will send three demo scenarios to the API:', 'white');
    log('1. High-Value Commercial Lead (EBITDA + Payroll) → Blue Badge', 'blue');
    log('2. Standard Retail Lead (TFSA) → Green Badge', 'green');
    log('3. Small Business Startup → Blue Badge (High Priority)', 'blue');
    log(`\nAPI Endpoint: http://${API_HOST}:${API_PORT}${API_ENDPOINT}`, 'dim');

    // Load demo payloads
    const payloadsPath = path.join(__dirname, 'demo_payloads.json');
    log(`\nLoading payloads from: ${payloadsPath}`, 'dim');
    
    const payloadsData = fs.readFileSync(payloadsPath, 'utf8');
    const { scenarios } = JSON.parse(payloadsData);

    log(`✓ Loaded ${scenarios.length} scenarios\n`, 'green');

    // Process each scenario
    const results = [];
    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      
      printScenario(scenario, i);
      log('\n   Sending request to API...', 'yellow');

      try {
        const response = await sendRequest(scenario.payload);
        
        if (response.success && response.data) {
          log('   ✓ Request successful!', 'green');
          printResults(scenario.expectedIntent, response.data);
          
          results.push({
            scenario: scenario.name,
            success: true,
            data: response.data
          });
        } else {
          log('   ✗ Unexpected response format', 'red');
          console.log(response);
          results.push({
            scenario: scenario.name,
            success: false,
            error: 'Unexpected response format'
          });
        }
      } catch (error) {
        log(`   ✗ Request failed: ${error.message}`, 'red');
        results.push({
          scenario: scenario.name,
          success: false,
          error: error.message
        });
      }

      // Wait before next request (except for last one)
      if (i < scenarios.length - 1) {
        log(`\n   Waiting ${DELAY_BETWEEN_REQUESTS / 1000} seconds before next request...`, 'dim');
        await sleep(DELAY_BETWEEN_REQUESTS);
      }
    }

    // Print summary
    printHeader('📊 Demo Summary');
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    log(`Total Scenarios: ${results.length}`, 'white');
    log(`Successful: ${successful}`, 'green');
    log(`Failed: ${failed}`, failed > 0 ? 'red' : 'white');

    if (successful > 0) {
      log('\n✓ Demo completed! Check your dashboard to see the leads with badges:', 'green');
      results.filter(r => r.success).forEach(result => {
        const badge = result.data.LineOfBusiness === 'Commercial' ? '🔵' : '🟢';
        log(`  ${badge} ${result.scenario} - ${result.data.LineOfBusiness}`, 'white');
      });
    }

    if (failed > 0) {
      log('\n⚠ Some scenarios failed:', 'yellow');
      results.filter(r => !r.success).forEach(result => {
        log(`  ✗ ${result.scenario}: ${result.error}`, 'red');
      });
    }

    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    log(`\n✗ Demo failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  log('\n🚀 Starting demo...', 'cyan');
  runDemo().catch(error => {
    log(`\n✗ Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runDemo };

// Made with Bob