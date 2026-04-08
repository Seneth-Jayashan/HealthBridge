const express = require('express');
const router = express.Router();
const { getHistory, deleteHistory, getAllHistory } = require('../controllers/historyController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// GET  /api/ai/history         — patient's own history
router.get('/', authenticate, authorize(['patient', 'Patient']), getHistory);

// DELETE /api/ai/history/:id   — patient deletes own record
router.delete('/:id', authenticate, authorize(['patient', 'Patient']), deleteHistory);

// GET  /api/ai/history/admin   — admin sees all records
router.get('/admin', authenticate, authorize(['admin', 'Admin']), getAllHistory);

module.exports = router;