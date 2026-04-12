const SymptomCheck = require("../models/SymptomCheck");
const logger = require("../utils/logger");
const { callAI } = require("../AiService");

// ─── BUILD PROMPT (ADVANCED) ─────────────────────────────
const buildPrompt = (symptoms, additionalInfo = {}) => {
  const { age, gender, duration, severity, medicalHistory } = additionalInfo;

  const contextLines = [
    age ? `- Age: ${age}` : null,
    gender ? `- Gender: ${gender}` : null,
    duration ? `- Duration: ${duration}` : null,
    severity ? `- Severity: ${severity}` : null,
    medicalHistory ? `- Medical History: ${medicalHistory}` : null,
  ].filter(Boolean);

  const safeSymptoms = Array.isArray(symptoms) ? symptoms : [];

  return `
You are an advanced AI medical triage assistant for HealthBridge.

Analyze symptoms carefully like a clinical decision support system.

Symptoms:
${safeSymptoms.map((s, i) => `${i + 1}. ${s}`).join("\n")}

${contextLines.length ? `\nAdditional Info:\n${contextLines.join("\n")}` : ""}

Return ONLY valid JSON:

{
  "possibleConditions": [
    {
      "name": "Condition Name",
      "likelihood": "high|moderate|low",
      "confidenceScore": 0-100,
      "description": "Why this condition matches"
    }
  ],
  "recommendedSpecialties": [
    {
      "specialty": "Specialty Name",
      "reason": "Why needed"
    }
  ],
  "urgencyLevel": "low|moderate|high|emergency",
  "redFlags": [
    "Warning signs"
  ],
  "nextSteps": [
    "Step 1",
    "Step 2"
  ],
  "homeCareAdvice": [
    "Advice 1",
    "Advice 2"
  ],
  "generalAdvice": "Summary",
  "disclaimer": "This is not medical advice"
}

Rules:
- 2–5 conditions only
- Include confidenceScore (0–100)
- Be conservative
- emergency if life-threatening symptoms
- JSON ONLY (no markdown)
`;
};

// ─── SAFE JSON PARSER ─────────────────────────────
const parseAIResponse = (text) => {
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    logger.warn("Invalid AI JSON response, using fallback");

    return {
      possibleConditions: [],
      recommendedSpecialties: [
        {
          specialty: "General Practitioner",
          reason: "Initial evaluation needed",
        },
      ],
      urgencyLevel: "moderate",
      redFlags: [],
      nextSteps: ["Consult a doctor"],
      homeCareAdvice: ["Rest", "Hydration"],
      generalAdvice: "Please consult a doctor.",
      disclaimer: "This is AI-generated and not medical advice.",
    };
  }
};

const buildProviderFallback = () => ({
  possibleConditions: [],
  recommendedSpecialties: [
    {
      specialty: "General Practitioner",
      reason: "AI analysis is temporarily unavailable. A clinician should evaluate symptoms.",
    },
  ],
  urgencyLevel: "moderate",
  redFlags: [
    "If symptoms worsen rapidly, seek urgent medical care.",
    "If chest pain, breathing difficulty, confusion, or severe bleeding is present, go to emergency care now.",
  ],
  nextSteps: [
    "Book an in-person or telemedicine consultation.",
    "Track symptom progression and vital signs if available.",
  ],
  homeCareAdvice: ["Rest", "Hydration", "Monitor symptoms closely"],
  generalAdvice: "Automated analysis is temporarily unavailable. Please consult a qualified clinician.",
  disclaimer: "This is not medical advice.",
});

// ─── MAIN CONTROLLER ─────────────────────────────
const checkSymptoms = async (req, res) => {
  const start = Date.now();
  const { symptoms, additionalInfo } = req.body;
  const patientId = req.user.id;

  try {
    logger.info(
      `Symptom check requested by ${patientId} | ${symptoms?.length || 0} symptoms`
    );

    const prompt = buildPrompt(symptoms, additionalInfo);

    let rawResponse = null;
    let parsed = null;
    let fallbackReason = null;

    try {
      rawResponse = await callAI(prompt);
      parsed = parseAIResponse(rawResponse);
    } catch (aiErr) {
      fallbackReason = aiErr?.response?.data?.error?.message || aiErr.message || "AI provider unavailable";
      logger.error(`AI provider failure during symptom check: ${fallbackReason}`);
      parsed = buildProviderFallback();
    }

    const processingTimeMs = Date.now() - start;

    const record = await SymptomCheck.create({
      patientId,
      symptoms: Array.isArray(symptoms) ? symptoms : [],
      additionalInfo: additionalInfo || {},
      aiResponse: {
        ...parsed,
        rawResponse,
        fallbackUsed: Boolean(fallbackReason),
        fallbackReason,
      },
      model: process.env.AI_MODEL || "llama-3.1-8b-instant",
      processingTimeMs,
    });

    return res.status(200).json({
      success: true,
      data: {
        checkId: record._id,
        symptoms: record.symptoms,
        additionalInfo: record.additionalInfo,
        result: parsed,
        fallbackUsed: Boolean(fallbackReason),
        fallbackReason,
        processingTimeMs,
        createdAt: record.createdAt,
      },
    });
  } catch (err) {
    logger.error(`Symptom check error: ${err.message}`);

    return res.status(500).json({
      success: false,
      message: "Failed to analyze symptoms. Please try again.",
    });
  }
};

// ─── GET HISTORY ─────────────────────────────
const getSymptomCheck = async (req, res) => {
  try {
    const check = await SymptomCheck.findById(req.params.id).lean();

    if (!check) {
      return res.status(404).json({
        success: false,
        message: "Record not found.",
      });
    }

    if (
      req.user.role === "patient" &&
      check.patientId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    return res.status(200).json({
      success: true,
      data: check,
    });
  } catch (err) {
    logger.error(`getSymptomCheck error: ${err.message}`);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

module.exports = { checkSymptoms, getSymptomCheck };