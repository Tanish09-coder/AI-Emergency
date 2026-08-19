const Report = require('../models/Report');
const { processNewReport } = require('../services/deduplicationService');

const createReport = async (req, res) => {
  try {
    const { description, location, emergencyType, image } = req.body;

    if (!description || !location || !location.address) {
      return res.status(400).json({
        message: 'Report description and location address are required',
      });
    }

    const report = await Report.create({
      userId: req.user._id,
      description,
      image: image || null,
      location: {
        address: location.address,
        coordinates: location.coordinates || { lat: 0, lng: 0 },
      },
      emergencyType: emergencyType || 'Other',
    });

    // Run Deduplication Pipeline & AI Summarization
    const deduplicationResult = await processNewReport(report);

    return res.status(201).json({
      message: 'Report submitted successfully. Incident processed.',
      report,
      incident: deduplicationResult.incident,
      isNewIncident: deduplicationResult.isNewIncident,
    });
  } catch (error) {
    console.error('[Create Report Error]', error);
    return res.status(500).json({
      message: 'Failed to process emergency report',
      error: error.message,
    });
  }
};

const getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('userId', 'name email role')
      .populate('incidentId', 'summary status severity type')
      .sort({ createdAt: -1 });

    return res.status(200).json({ reports });
  } catch (error) {
    console.error('[Get Reports Error]', error);
    return res.status(500).json({ message: 'Failed to fetch reports', error: error.message });
  }
};

module.exports = {
  createReport,
  getReports,
};
