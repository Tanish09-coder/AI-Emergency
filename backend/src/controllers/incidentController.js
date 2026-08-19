const Incident = require('../models/Incident');

const getIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ createdAt: -1 });

    const total = incidents.length;
    const active = incidents.filter((inc) => inc.status !== 'RESOLVED').length;
    const critical = incidents.filter((inc) => inc.severity === 'CRITICAL').length;

    return res.status(200).json({
      stats: {
        total,
        active,
        critical,
      },
      incidents,
    });
  } catch (error) {
    console.error('[Get Incidents Error]', error);
    return res.status(500).json({
      message: 'Failed to fetch incidents',
      error: error.message,
    });
  }
};

const getIncidentById = async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await Incident.findById(id).populate({
      path: 'reportIds',
      populate: { path: 'userId', select: 'name email role' },
    });

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    return res.status(200).json(incident);
  } catch (error) {
    console.error('[Get Incident By ID Error]', error);
    return res.status(500).json({
      message: 'Failed to fetch incident details',
      error: error.message,
    });
  }
};

const updateIncidentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['REPORTED', 'VERIFIED', 'RESPONDING', 'RESOLVED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Valid values: ${validStatuses.join(', ')}`,
      });
    }

    const incident = await Incident.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    return res.status(200).json({
      message: `Incident status updated to ${status}`,
      incident,
    });
  } catch (error) {
    console.error('[Update Incident Status Error]', error);
    return res.status(500).json({
      message: 'Failed to update incident status',
      error: error.message,
    });
  }
};

module.exports = {
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
};
