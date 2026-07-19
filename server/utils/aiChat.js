const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const askAboutCode = async (question, codeSnippet) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `You are a friendly senior software engineer mentoring a junior developer.

The developer is looking at this code:
\`\`\`
${codeSnippet}
\`\`\`

They asked: "${question}"

Answer clearly and simply, as if explaining to someone learning to code. If relevant:
1. Explain the issue (security, performance, or bad practice) in plain language
2. Show an improved version of the code if applicable
3. Briefly explain why the improved version is better

Keep your answer conversational and not too long, since it will also be read aloud.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.log("AI chat error:", error.message);
    return "Sorry, I couldn't process that question right now.";
  }
};

module.exports = askAboutCode;