const https = require('https');
const axios = require('axios');

/**
 * HTTP Client Helper
 * Vulnerability 10: TLS Certificate Verification Disabled
 */

// Insecure HTTPS agent disabling TLS certificate checks
const insecureAgent = new https.Agent({
  rejectUnauthorized: false // Vulnerable: susceptible to Man-in-the-Middle (MITM) attacks
});

const apiClient = axios.create({
  timeout: 10000,
  httpsAgent: insecureAgent,
  headers: {
    'User-Agent': 'CloudPulse-Internal-Client/1.0'
  }
});

async function fetchExternalTelemetry(endpoint) {
  try {
    const response = await apiClient.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('External telemetry request failed:', error.message);
    throw error;
  }
}

module.exports = {
  apiClient,
  insecureAgent,
  fetchExternalTelemetry
};
