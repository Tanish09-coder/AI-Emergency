const express = require('express');
const router = express.Router();
const { createReport, getReports } = require('../controllers/reportController');
const { verifyToken } = require('../utils/authMiddleware');

router.post('/', verifyToken, createReport);
router.get('/', verifyToken, getReports);

module.exports = router;
