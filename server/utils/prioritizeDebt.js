const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const summarizeIssues = (issues) => {
  const grouped = {};

  issues.forEach((issue) => {
    const key = issue.rule || "unknown";
    if (!grouped[key]) {
      grouped[key] = { rule: key, count: 0, files: new Set(), sampleMessage: issue.message };
    }
    grouped[key].count += 1;
    grouped[key].files.add(issue.file);
  });

  return Object.values(grouped).map((g) => ({
    rule: g.rule,
    count: g.count,
    filesAffected: g.files.size,
    sampleMessage: g.sampleMessage,
  }));
};

const prioritizeDebt = async (issues) => {
  try {
    const summary = summarizeIssues(issues);

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `You are a senior engineering lead prioritizing technical debt for a team with limited time.

Below is a summary of issue categories found in a codebase (rule name, how many times it occurs, how many files affected, and a sample message):

${JSON.stringify(summary, null, 2)}

Rank the TOP 5 categories the team should fix first, based on real-world impact (security risk, bug risk, maintainability pain) versus how much effort each would take to fix.

Respond ONLY in this exact JSON format, no other text, no markdown fences:
[
  {
    "rule": "rule-name",
    "priority": 1,
    "impact": "High/Medium/Low",
    "effort": "Low/Medium/High",
    "reasoning": "one or two sentence explanation of why this matters and should be fixed now or later"
  }
]`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const cleaned = responseText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return parsed;
  } catch (error) {
    console.log("Prioritization error:", error.message);
    return [];
  }
};

module.exports = prioritizeDebt;