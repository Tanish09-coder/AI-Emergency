const jwt = require('jsonwebtoken');
const { getHaversineDistanceKm } = require('./services/deduplicationService');
const { classifyReport, checkDuplicateWithAI } = require('./services/aiService');

const runUnitTests = async () => {
  console.log(`\n==================================================`);
  console.log(`🧪 EmergencyAI Unit & Logic Verification Suite 🧪`);
  console.log(`==================================================\n`);

  let passed = 0;
  let total = 0;

  const assert = (condition, testName) => {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.log(`❌ [FAIL] ${testName}`);
    }
  };

  // Test 1: Haversine Distance
  const pointA = { lat: 12.9716, lng: 77.5946 };
  const pointB = { lat: 12.9718, lng: 77.5948 };
  const distance = getHaversineDistanceKm(pointA, pointB);
  assert(distance < 1.0, `Haversine distance calculation (<1km expected, got ${distance.toFixed(3)}km)`);

  // Test 2: JWT Auth Token Signing & Verification
  const secret = 'test_secret_key';
  const payload = { id: 'user123', role: 'ADMIN' };
  const token = jwt.sign(payload, secret, { expiresIn: '1h' });
  const decoded = jwt.verify(token, secret);
  assert(decoded.id === 'user123' && decoded.role === 'ADMIN', 'JWT signing and token verification');

  // Test 3: AI Fallback Classification Engine
  const fireClass = await classifyReport('Smoke coming from Block B first floor window', 'Fire', 'Block B');
  assert(fireClass.type === 'Fire' && fireClass.severity === 'HIGH', 'Emergency report classification (Type: Fire, Severity: HIGH)');

  const medicalClass = await classifyReport('Person collapsed unconscious near main gate', 'Medical', 'Main Gate');
  assert(medicalClass.type === 'Medical' && (medicalClass.severity === 'CRITICAL' || medicalClass.severity === 'HIGH'), 'Medical report severity triage');

  // Test 4: Deduplication Matching Heuristic
  const newReport = {
    description: 'Flames visible on first floor of Block B',
    location: { address: 'Block B, First Floor' },
    emergencyType: 'Fire',
  };
  const candidates = [
    {
      _id: 'inc_101',
      summary: 'Smoke coming from Block B first floor window',
      location: { address: 'Block B, First Floor' },
      type: 'Fire',
    },
  ];
  const dupCheck = await checkDuplicateWithAI(newReport, candidates);
  assert(dupCheck.isMatch === true && dupCheck.matchedIncidentId === 'inc_101', 'Duplicate detection matching same location & incident');

  console.log(`\n==================================================`);
  console.log(`RESULTS: ${passed}/${total} tests passed successfully.`);
  console.log(`==================================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
};

runUnitTests();
