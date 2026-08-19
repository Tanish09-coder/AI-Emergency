const { processNewReport } = require('./services/deduplicationService');
const { classifyReport, summarizeIncident } = require('./services/aiService');

// In-Memory Database Simulator for Demo Standalone Testing
const mockIncidents = [];
const mockReports = [];

let idCounter = 1;
const generateId = (prefix) => `${prefix}_${idCounter++}_${Date.now().toString().slice(-4)}`;

const runDemoMock = async () => {
  console.log(`\n================================================================`);
  console.log(`🚨 EmergencyAI 5-Report Deduplication & Summary Engine Demo 🚨`);
  console.log(`================================================================\n`);

  const sampleReports = [
    {
      description: 'Smoke coming from Block B first floor window',
      location: { address: 'Block B, First Floor', coordinates: { lat: 12.9716, lng: 77.5946 } },
      emergencyType: 'Fire',
    },
    {
      description: 'Fire alarm ringing loudly in Block B building',
      location: { address: 'Block B Main Entrance', coordinates: { lat: 12.9718, lng: 77.5948 } },
      emergencyType: 'Fire',
    },
    {
      description: 'Flames visible on 1st floor window of Block B campus building',
      location: { address: 'Block B, East Wing', coordinates: { lat: 12.9715, lng: 77.5945 } },
      emergencyType: 'Fire',
    },
    {
      description: 'Heavy black smoke filling hallway near Block B room 102',
      location: { address: 'Block B Room 102', coordinates: { lat: 12.9717, lng: 77.5947 } },
      emergencyType: 'Fire',
    },
    {
      description: 'People evacuating Block B due to electrical fire',
      location: { address: 'Block B Quadrangle', coordinates: { lat: 12.9719, lng: 77.5949 } },
      emergencyType: 'Fire',
    },
  ];

  console.log(`📥 Submitting 5 User Emergency Reports into Engine...\n`);

  for (let i = 0; i < sampleReports.length; i++) {
    const sample = sampleReports[i];
    const reportObj = {
      _id: generateId('rep'),
      description: sample.description,
      location: sample.location,
      emergencyType: sample.emergencyType,
      createdAt: new Date(),
    };
    mockReports.push(reportObj);

    // Run Deduplication Check against mock active incidents
    const candidates = mockIncidents.map(inc => ({
      _id: inc._id,
      type: inc.type,
      severity: inc.severity,
      location: inc.location,
      summary: inc.summary,
    }));

    let matchedInc = null;
    if (candidates.length > 0) {
      const { checkDuplicateWithAI } = require('./services/aiService');
      const dupCheck = await checkDuplicateWithAI(reportObj, candidates);
      if (dupCheck.isMatch && dupCheck.matchedIncidentId) {
        matchedInc = mockIncidents.find(inc => inc._id === dupCheck.matchedIncidentId);
      }
    }

    if (matchedInc) {
      matchedInc.reportIds.push(reportObj._id);
      matchedInc.reportCount = matchedInc.reportIds.length;
      reportObj.incidentId = matchedInc._id;

      const linkedReports = mockReports.filter(r => matchedInc.reportIds.includes(r._id));
      const newSummary = await summarizeIncident(linkedReports, matchedInc.location.address);
      
      matchedInc.summary = newSummary.summary;
      if (newSummary.severity) matchedInc.severity = newSummary.severity;
      if (newSummary.primaryType) matchedInc.type = newSummary.primaryType;
      matchedInc.updatedAt = new Date();

      console.log(`[Report ${i + 1}] "${reportObj.description}"`);
      console.log(`   ↳ MERGED into Existing Incident [ID: ${matchedInc._id} | Report Count: ${matchedInc.reportCount}]`);
    } else {
      const aiClass = await classifyReport(reportObj.description, reportObj.emergencyType, reportObj.location.address);
      const newInc = {
        _id: generateId('inc'),
        type: aiClass.type,
        severity: aiClass.severity,
        location: reportObj.location,
        summary: reportObj.description,
        status: 'REPORTED',
        reportCount: 1,
        reportIds: [reportObj._id],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockIncidents.push(newInc);
      reportObj.incidentId = newInc._id;

      console.log(`[Report ${i + 1}] "${reportObj.description}"`);
      console.log(`   ↳ Created NEW Incident [ID: ${newInc._id}]`);
    }
  }

  console.log(`\n================================================================`);
  console.log(`📊 FINAL ENGINE CLUSTERING RESULT:`);
  console.log(`================================================================`);
  console.log(`Total Reports Processed : ${mockReports.length}`);
  console.log(`Total Clustered Incidents: ${mockIncidents.length}`);

  const mainInc = mockIncidents[0];
  console.log(`\n🎯 CLUSTERED INCIDENT RECORD:`);
  console.log(`   - Incident ID   : ${mainInc._id}`);
  console.log(`   - Emergency Type: ${mainInc.type}`);
  console.log(`   - Severity Level: ${mainInc.severity}`);
  console.log(`   - Current Status: ${mainInc.status}`);
  console.log(`   - Primary Loc   : ${mainInc.location.address}`);
  console.log(`   - Total Reports : ${mainInc.reportCount}`);
  console.log(`   - AI Summary    : "${mainInc.summary}"`);
  console.log(`   - Linked User Reports:`);
  mainInc.reportIds.forEach((rId, idx) => {
    const rep = mockReports.find(r => r._id === rId);
    console.log(`     ${idx + 1}. [${rep._id}] "${rep.description}" (${rep.location.address})`);
  });

  if (mockReports.length === 5 && mockIncidents.length === 1) {
    console.log(`\n✅ DEMO TEST SUCCESSFUL: All 5 reports merged into 1 Clustered Incident!\n`);
  }
};

runDemoMock();
