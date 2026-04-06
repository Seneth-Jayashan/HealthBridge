const axios = require("axios");

// ✅ Working Groq model (NOT decommissioned)
const MODEL = process.env.AI_MODEL || "llama-3.1-8b-instant";

const callAI = async (prompt) => {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: MODEL, // ✅ FIXED (was MODEL ❌)
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (err) {
    console.error("Groq API Error:", err.response?.data || err.message);
    throw err;
  }
};

module.exports = { callAI };