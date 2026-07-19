const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const explainCode = async (codeSnippet) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `You are a senior software engineer. Explain the following code function in simple, plain English in 2-3 sentences. Focus on what it does and why it might be flagged as complex or risky. Do not repeat the code itself.\n\nCode:\n${codeSnippet}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.log("AI explanation error:", error.message);
    return "Could not generate explanation for this code.";
  }
};

module.exports = explainCode;