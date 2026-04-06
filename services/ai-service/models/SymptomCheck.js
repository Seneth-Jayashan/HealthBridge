const mongoose = require('mongoose');

const symptomCheckSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    symptoms: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0 && arr.length <= 20,
        message: 'Provide between 1 and 20 symptoms.',
      },
    },
    additionalInfo: {
      age:            { type: Number, min: 0, max: 150 },
      gender:         { type: String, enum: ['male', 'female', 'other', ''] },
      duration:       { type: String, default: '' },
      severity:       { type: String, enum: ['mild', 'moderate', 'severe', ''] },
      medicalHistory: { type: String, default: '' },
    },
    aiResponse: {
      possibleConditions: [
        {
          name:        String,
          likelihood:  String,
          description: String,
        },
      ],
      recommendedSpecialties: [
        {
          specialty: String,
          reason:    String,
        },
      ],
      urgencyLevel: {
        type:    String,
        enum:    ['low', 'moderate', 'high', 'emergency'],
        default: 'moderate',
      },
      generalAdvice: { type: String },
      disclaimer:    { type: String },
      rawResponse:   { type: String },
    },
    modelUsed:        { type: String, default: 'claude-sonnet-4-20250514' },
    processingTimeMs: { type: Number },
  },
  { timestamps: true }
);

symptomCheckSchema.index({ patientId: 1, createdAt: -1 });

const SymptomCheck = mongoose.model('SymptomCheck', symptomCheckSchema);
module.exports = SymptomCheck;