const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModels() {
  try {
    const result = await genAI.listModels();

    console.log("Available Gemini Models:\n");

    result.models.forEach((model) => {
      console.log(model.name);
    });

  } catch (err) {
    console.error("Error fetching models:", err.message);
  }
}

testModels();