require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Report = require('./models/Report');
const Incident = require('./models/Incident');
const { processNewReport } = require('./services/deduplicationService');

const runDemo = async () => {
  let mongoServer = null;
  try {
    console.log(`\n==================================================`);
    console.log(`🚨 EmergencyAI Demo Engine & Verification Script 🚨`);
    console.log(`==================================================`);

    let mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoServer = await MongoMemoryServer.create();
        mongoUri = mongoServer.getUri();
        console.log(`[Demo Setup] Started In-Memory MongoDB server.`);
      } catch (e) {
        mongoUri = 'mongodb://127.0.0.1:27017/ai-emergency-demo';
      }
    }

    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });

    // Clean previous demo data
    await User.deleteMany({});
    await Report.deleteMany({});
    await Incident.deleteMany({});

    console.log(`[Demo Setup] Cleaned database collections.`);

    // 1. Create Reporter & Admin users
    const reporter = await User.create({
      name: 'Nishit Reporter',
      email: 'reporter@emergency.ai',
      password: 'hashedpassword123',
      role: 'REPORTER',
    });

    const admin = await User.create({
      name: 'Tanish Admin',
      email: 'admin@emergency.ai',
      password: 'hashedpassword123',
      role: 'ADMIN',
    });

    console.log(`[Demo Setup] Created users: Reporter (${reporter.email}), Admin (${admin.email})`);

    // 2. Define 5 sample user reports for the same incident
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

    console.log(`\n--------------------------------------------------`);
    console.log(`📥 Submitting 5 User Emergency Reports...`);
    console.log(`--------------------------------------------------`);

    for (let i = 0; i < sampleReports.length; i++) {
      const sample = sampleReports[i];
      const report = await Report.create({
        userId: reporter._id,
        description: sample.description,
        location: sample.location,
        emergencyType: sample.emergencyType,
      });

      console.log(`[Report ${i + 1}] Submitting: "${report.description}"`);
      const result = await processNewReport(report);
      console.log(
        `   ↳ Action: ${result.isNewIncident ? 'Created NEW Incident' : 'MERGED into Existing Incident'} [Incident ID: ${result.incident._id}]`
      );
    }

    // 3. Final Verification of Clustered Incident & Summary
    console.log(`\n==================================================`);
    console.log(`📊 AI DEDUPLICATION & CLUSTERING RESULTS`);
    console.log(`==================================================`);

    const totalIncidents = await Incident.countDocuments();
    const totalReports = await Report.countDocuments();

    console.log(`Total Reports Submitted : ${totalReports}`);
    console.log(`Total Clustered Incidents: ${totalIncidents}`);

    const finalIncident = await Incident.findOne().populate('reportIds');

    if (finalIncident) {
      console.log(`\n🎯 CLUSTERED INCIDENT SUMMARY:`);
      console.log(`   - ID           : ${finalIncident._id}`);
      console.log(`   - Type         : ${finalIncident.type}`);
      console.log(`   - Severity     : ${finalIncident.severity}`);
      console.log(`   - Status       : ${finalIncident.status}`);
      console.log(`   - Location     : ${finalIncident.location.address}`);
      console.log(`   - Report Count : ${finalIncident.reportCount}`);
      console.log(`   - AI Summary   : "${finalIncident.summary}"`);
      console.log(`   - Linked Reports:`);
      finalIncident.reportIds.forEach((rep, idx) => {
        console.log(`     ${idx + 1}. [${rep._id}] "${rep.description}"`);
      });
    }

    if (totalIncidents === 1 && totalReports === 5) {
      console.log(`\n✅ DEMO VERIFICATION PASSED: 5 reports successfully merged into 1 Incident!`);
    } else {
      console.log(`\n⚠️ DEMO NOTICE: ${totalIncidents} incidents generated from 5 reports.`);
    }

    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log(`\n[Demo Setup] Disconnected and cleaned up.`);
  } catch (error) {
    console.error(`\n❌ Demo Script Error:`, error.message);
    if (mongoServer) {
      await mongoServer.stop();
    }
    process.exit(1);
  }
};

runDemo();
