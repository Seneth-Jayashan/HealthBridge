const SymptomCheck = require('../models/SymptomCheck');
const logger = require('../utils/logger');

// GET /api/ai/history  — patient's own history (paginated)
const getHistory = async (req, res) => {
  try {
    const patientId = req.user.id;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(20, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const [records, total] = await Promise.all([
      SymptomCheck.find({ patientId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-aiResponse.rawResponse')
        .lean(),
      SymptomCheck.countDocuments({ patientId }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        records,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    logger.error(`getHistory error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/ai/history/:id  — patient deletes their own record
const deleteHistory = async (req, res) => {
  try {
    const record = await SymptomCheck.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }
    if (record.patientId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    await record.deleteOne();
    return res.status(200).json({ success: true, message: 'Record deleted.' });
  } catch (err) {
    logger.error(`deleteHistory error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};



module.exports = { getHistory, deleteHistory, };