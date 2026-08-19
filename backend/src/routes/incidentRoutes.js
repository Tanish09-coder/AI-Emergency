const express = require('express');
const router = express.Router();
const {
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
} = require('../controllers/incidentController');
const { verifyToken, isAdmin } = require('../utils/authMiddleware');

router.get('/', verifyToken, getIncidents);
router.get('/:id', verifyToken, getIncidentById);
router.patch('/:id/status', verifyToken, isAdmin, updateIncidentStatus);

module.exports = router;
