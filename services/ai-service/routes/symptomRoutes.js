const express = require('express');
const router = express.Router();
const { checkSymptoms, getSymptomCheck } = require('../controllers/symptomController');
const { authenticate, authorize }        = require('../middleware/authMiddleware');
const { validateSymptomCheck }           = require('../middleware/validateMiddleware');

// POST /api/ai/symptoms/check
router.post('/check', authenticate, authorize(['Patient']), validateSymptomCheck, checkSymptoms);

// GET /api/ai/symptoms/:id
router.get('/:id', authenticate, authorize(['Patient', 'doctor', 'admin']), getSymptomCheck);

module.exports = router;