const Joi = require('joi');

const symptomCheckSchema = Joi.object({
  symptoms: Joi.array()
    .items(Joi.string().trim().min(2).max(100))
    .min(1)
    .max(20)
    .required()
    .messages({
      'array.min': 'Please provide at least one symptom.',
      'array.max': 'Maximum 20 symptoms allowed.',
    }),

  additionalInfo: Joi.object({
    age:           Joi.number().integer().min(0).max(150).optional(),
    gender:        Joi.string().valid('male', 'female', 'other', '').optional().default(''),
    duration:      Joi.string().max(100).optional().default(''),
    severity:      Joi.string().valid('mild', 'moderate', 'severe', '').optional().default(''),
    medicalHistory:Joi.string().max(500).optional().default(''),
  }).optional(),
});

const validateSymptomCheck = (req, res, next) => {
  const { error, value } = symptomCheckSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map((d) => d.message),
    });
  }
  req.body = value;
  next();
};

module.exports = { validateSymptomCheck };