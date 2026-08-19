const http = require('http');
const jwt = require('jsonwebtoken');
const { classifyReport, summarizeIncident, checkDuplicateWithAI } = require('./services/aiService');
const { getHaversineDistanceKm } = require('./services/deduplicationService');

const runFullTest = async () => {
  console.log(`\n================================================================`);
  console.log(`🚨 EmergencyAI End-to-End Self-Test & Verification Pipeline 🚨`);
  console.log(`================================================================\n`);

  let totalTests = 0;
  let passedTests = 0;

  const test = (description, assertion) => {
    totalTests++;
    if (assertion) {
      console.log(`  ✅ [PASS ${totalTests}] ${description}`);
      passedTests++;
    } else {
      console.log(`  ❌ [FAIL ${totalTests}] ${description}`);
    }
  };

  // 1. TEST HAVERSINE SPATIAL DISTANCE ENGINE
  console.log(`📌 1. Testing Spatial Geolocation Engine (Haversine Formula)...`);
  const blockB_East = { lat: 12.9716, lng: 77.5946 };
  const blockB_West = { lat: 12.9718, lng: 77.5948 };
  const distanceKm = getHaversineDistanceKm(blockB_East, blockB_West);
  test(
    `Calculates distance between Block B East & West correctly (${distanceKm.toFixed(3)} km < 0.1 km)`,
    distanceKm < 0.1
  );

  const distantLocation = { lat: 13.0827, lng: 80.2707 }; // Chennai (~300km away)
  const farDistanceKm = getHaversineDistanceKm(blockB_East, distantLocation);
  test(
    `Identifies far distant location (> 100 km, got ${farDistanceKm.toFixed(1)} km)`,
    farDistanceKm > 100
  );

  // 2. TEST AUTHENTICATION & JWT TOKEN ENGINE
  console.log(`\n📌 2. Testing JWT Authentication & Role Authorization...`);
  const secret = process.env.JWT_SECRET || 'emergency_ai_secret_key_2026';
  
  const reporterPayload = { id: 'usr_reporter_1', email: 'reporter@test.com', role: 'REPORTER' };
  const adminPayload = { id: 'usr_admin_1', email: 'admin@test.com', role: 'ADMIN' };

  const reporterToken = jwt.sign(reporterPayload, secret, { expiresIn: '1h' });
  const adminToken = jwt.sign(adminPayload, secret, { expiresIn: '1h' });

  const decodedReporter = jwt.verify(reporterToken, secret);
  const decodedAdmin = jwt.verify(adminToken, secret);

  test('Signs and verifies REPORTER JWT token', decodedReporter.role === 'REPORTER');
  test('Signs and verifies ADMIN JWT token', decodedAdmin.role === 'ADMIN');

  // 3. TEST AI CLASSIFICATION & TRIAGE ENGINE
  console.log(`\n📌 3. Testing AI Triage & Emergency Classification Engine...`);
  
  const fireReport = await classifyReport('Massive fire and dense black smoke in Block B 1st floor', 'Fire', 'Block B');
  test(`Classifies Fire Emergency correctly (Type: ${fireReport.type})`, fireReport.type === 'Fire');
  test(`Assigns HIGH/CRITICAL severity for fire report (Severity: ${fireReport.severity})`, fireReport.severity === 'HIGH' || fireReport.severity === 'CRITICAL');

  const medicalReport = await classifyReport('Student unconscious and bleeding near football field', 'Medical', 'Sports Ground');
  test(`Classifies Medical Emergency correctly (Type: ${medicalReport.type})`, medicalReport.type === 'Medical');
  test(`Assigns HIGH/CRITICAL severity for unconscious bleeding patient (Severity: ${medicalReport.severity})`, medicalReport.severity === 'CRITICAL' || medicalReport.severity === 'HIGH');

  const securityReport = await classifyReport('Armed intruder spotted near north perimeter fence', 'Security', 'North Gate');
  test(`Classifies Security Emergency correctly (Type: ${securityReport.type})`, securityReport.type === 'Security');

  // 4. TEST AI DEDUPLICATION & REPORT CLUSTERING
  console.log(`\n📌 4. Testing AI Deduplication & Report Clustering Engine...`);

  const existingIncidents = [
    {
      _id: 'inc_block_b_fire',
      type: 'Fire',
      severity: 'HIGH',
      location: { address: 'Block B, First Floor', coordinates: blockB_East },
      summary: 'Multiple reports indicate smoke and fire on the first floor of Block B.',
    },
    {
      _id: 'inc_sports_medical',
      type: 'Medical',
      severity: 'MEDIUM',
      location: { address: 'Sports Ground', coordinates: { lat: 12.9800, lng: 77.6000 } },
      summary: 'Medical emergency reported near sports ground.',
    }
  ];

  // Report A: Matches Block B fire
  const incomingReportA = {
    description: 'Flames seen shooting out of Block B window room 102',
    location: { address: 'Block B Room 102', coordinates: blockB_West },
    emergencyType: 'Fire',
  };

  const dupCheckA = await checkDuplicateWithAI(incomingReportA, existingIncidents);
  test(
    `Detects duplicate report matching existing Block B Fire Incident (Matched ID: ${dupCheckA.matchedIncidentId})`,
    dupCheckA.isMatch === true && dupCheckA.matchedIncidentId === 'inc_block_b_fire'
  );

  // Report B: New unrelated incident (Accident at Main Gate)
  const incomingReportB = {
    description: 'Car crashed into streetlight near Main Entrance Gate',
    location: { address: 'Main Entrance Gate', coordinates: { lat: 12.9900, lng: 77.6100 } },
    emergencyType: 'Accident',
  };

  const dupCheckB = await checkDuplicateWithAI(incomingReportB, existingIncidents);
  test(
    'Identifies non-matching report as a NEW Incident (isMatch: false)',
    dupCheckB.isMatch === false && dupCheckB.matchedIncidentId === null
  );

  // 5. TEST INCIDENT AI SUMMARIZER
  console.log(`\n📌 5. Testing Multi-Report AI Incident Summarizer...`);
  const clusteredReports = [
    { description: 'Smoke coming from Block B first floor window', emergencyType: 'Fire' },
    { description: 'Fire alarm ringing loudly in Block B building', emergencyType: 'Fire' },
    { description: 'Flames visible on 1st floor window of Block B', emergencyType: 'Fire' },
    { description: 'Heavy black smoke filling hallway near Block B room 102', emergencyType: 'Fire' },
    { description: 'People evacuating Block B due to electrical fire', emergencyType: 'Fire' },
  ];

  const summaryResult = await summarizeIncident(clusteredReports, 'Block B, First Floor');
  test('Generates cohesive executive summary string', typeof summaryResult.summary === 'string' && summaryResult.summary.length > 10);
  test(`Identifies aggregated incident primary type (${summaryResult.primaryType})`, summaryResult.primaryType === 'Fire');
  test(`Calculates aggregated incident severity level (${summaryResult.severity})`, ['HIGH', 'CRITICAL'].includes(summaryResult.severity));

  // SUMMARY PRINT OUT
  console.log(`\n================================================================`);
  console.log(`📊 TEST SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED CLEANLY`);
  console.log(`================================================================\n`);

  if (passedTests === totalTests) {
    console.log(`🎉 ALL SELF-TEST VERIFICATIONS PASSED SUCCESSFULLY!\n`);
    process.exit(0);
  } else {
    console.error(`❌ SOME TESTS FAILED.\n`);
    process.exit(1);
  }
};

runFullTest();
