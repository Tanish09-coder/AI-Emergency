const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Fire', 'Medical', 'Accident', 'Security', 'Natural Disaster', 'Other'],
      default: 'Other',
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    location: {
      address: {
        type: String,
        required: true,
      },
      coordinates: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 },
      },
    },
    summary: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['REPORTED', 'VERIFIED', 'RESPONDING', 'RESOLVED'],
      default: 'REPORTED',
    },
    reportCount: {
      type: Number,
      default: 1,
    },
    reportIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Incident', incidentSchema);
