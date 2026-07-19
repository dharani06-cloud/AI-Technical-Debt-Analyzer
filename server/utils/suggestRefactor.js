const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const suggestRefactor = async (codeSnippet) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `You are a senior software engineer performing a code review. Given the following code, suggest specific, actionable refactoring improvements (e.g., extract method, rename variables, reduce complexity, remove duplication, apply a design pattern). List 2-4 concrete suggestions as a short bullet list. Do not repeat the full code back.\n\nCode:\n${codeSnippet}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.log("AI refactor suggestion error:", error.message);
    return "Could not generate refactoring suggestions for this code.";
  }
};

module.exports = suggestRefactor;