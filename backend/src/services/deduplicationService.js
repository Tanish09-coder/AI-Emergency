const Incident = require('../models/Incident');
const Report = require('../models/Report');
const { classifyReport, summarizeIncident, checkDuplicateWithAI } = require('./aiService');

/**
 * Calculate distance between two lat/lng points in kilometers (Haversine Formula)
 */
const getHaversineDistanceKm = (coords1, coords2) => {
  if (!coords1 || !coords2 || typeof coords1.lat !== 'number' || typeof coords2.lat !== 'number') {
    return Infinity;
  }

  const R = 6371; // Earth radius in km
  const dLat = ((coords2.lat - coords1.lat) * Math.PI) / 180;
  const dLng = ((coords2.lng - coords1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coords1.lat * Math.PI) / 180) *
      Math.cos((coords2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Filter active incidents based on distance (< 3km) or address text similarity
 */
const getCandidateIncidents = async (report) => {
  // Query active incidents from the last 2 hours
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const activeIncidents = await Incident.find({
    status: { $ne: 'RESOLVED' },
    createdAt: { $gte: twoHoursAgo },
  });

  if (activeIncidents.length === 0) {
    // If no recent incidents in 2 hours, check all non-resolved active incidents as fallback
    return await Incident.find({ status: { $ne: 'RESOLVED' } });
  }

  const candidateIncidents = activeIncidents.filter((incident) => {
    // 1. Coordinates distance check
    if (
      report.location?.coordinates?.lat &&
      incident.location?.coordinates?.lat
    ) {
      const distance = getHaversineDistanceKm(
        report.location.coordinates,
        incident.location.coordinates
      );
      if (distance <= 3.0) return true;
    }

    // 2. Address text similarity check
    if (report.location?.address && incident.location?.address) {
      const repAddr = report.location.address.toLowerCase();
      const incAddr = incident.location.address.toLowerCase();
      const repTokens = repAddr.split(/\s+/).filter((t) => t.length > 2);
      const incTokens = incAddr.split(/\s+/).filter((t) => t.length > 2);

      const overlap = repTokens.filter((token) => incTokens.includes(token));
      if (overlap.length > 0) return true;
    }

    // 3. Same emergency type matching
    if (report.emergencyType && report.emergencyType === incident.type) {
      return true;
    }

    return false;
  });

  return candidateIncidents.length > 0 ? candidateIncidents : activeIncidents;
};

/**
 * Core Deduplication Pipeline
 * Process incoming report: detect duplicate or create new incident, then generate AI summary.
 */
const processNewReport = async (report) => {
  try {
    const candidateIncidents = await getCandidateIncidents(report);

    let matchedIncident = null;

    if (candidateIncidents.length > 0) {
      const aiResult = await checkDuplicateWithAI(report, candidateIncidents);
      if (aiResult.isMatch && aiResult.matchedIncidentId) {
        matchedIncident = await Incident.findById(aiResult.matchedIncidentId);
      }
    }

    if (matchedIncident) {
      // --- MATCH FOUND: Merge report into existing Incident ---
      console.log(`[Deduplication] Merging Report ${report._id} into Incident ${matchedIncident._id}`);

      matchedIncident.reportIds.push(report._id);
      matchedIncident.reportCount = matchedIncident.reportIds.length;

      // Link report to incident
      report.incidentId = matchedIncident._id;
      await report.save();

      // Fetch all reports associated with this incident to update AI summary
      const allReports = await Report.find({ _id: { $in: matchedIncident.reportIds } });

      const aiSummary = await summarizeIncident(allReports, matchedIncident.location.address);

      matchedIncident.summary = aiSummary.summary;
      if (aiSummary.severity) matchedIncident.severity = aiSummary.severity;
      if (aiSummary.primaryType) matchedIncident.type = aiSummary.primaryType;
      matchedIncident.updatedAt = new Date();

      await matchedIncident.save();
      return { isNewIncident: false, incident: matchedIncident };
    } else {
      // --- NO MATCH FOUND: Create new Incident ---
      console.log(`[Deduplication] Creating new Incident for Report ${report._id}`);

      const aiClassification = await classifyReport(
        report.description,
        report.emergencyType,
        report.location.address
      );

      const newIncident = await Incident.create({
        type: aiClassification.type || report.emergencyType || 'Other',
        severity: aiClassification.severity || 'MEDIUM',
        location: {
          address: report.location.address,
          coordinates: report.location.coordinates || { lat: 0, lng: 0 },
        },
        summary: report.description,
        status: 'REPORTED',
        reportCount: 1,
        reportIds: [report._id],
      });

      report.incidentId = newIncident._id;
      await report.save();

      return { isNewIncident: true, incident: newIncident };
    }
  } catch (error) {
    console.error('[Deduplication Service Error]', error);
    throw error;
  }
};

module.exports = {
  getHaversineDistanceKm,
  processNewReport,
};
