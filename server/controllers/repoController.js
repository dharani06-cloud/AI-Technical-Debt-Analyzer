const simpleGit = require("simple-git");
const path = require("path");
const detectLanguages = require("../utils/detectLanguage");
const runStaticAnalysis = require("../utils/staticAnalyzer");
const calculateDebtScore = require("../utils/calculateScore");
const explainCode = require("../utils/explainCode");
const extractSnippet = require("../utils/extractSnippet");
const suggestRefactor = require("../utils/suggestRefactor");
const prioritizeDebt = require("../utils/prioritizeDebt");
const estimateCost = require("../utils/estimateCost");
const askAboutCode = require("../utils/aiChat");
const ChatHistory = require("../models/ChatHistory");

const importRepo = async (req, res) => {
  try {
    const { repoUrl } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ message: "GitHub URL is required" });
    }

    const folderName = `repo_${Date.now()}`;
    const clonePath = path.join(__dirname, "..", "cloned_repos", folderName);

    await simpleGit().clone(repoUrl, clonePath, ["--depth", "1"]);

    const languages = await detectLanguages(clonePath);
    const staticAnalysis = await runStaticAnalysis(clonePath);
    const debtScore = calculateDebtScore(staticAnalysis, languages);
    const costEstimate = estimateCost(debtScore.breakdown);

    res.status(200).json({
      message: "Repository cloned successfully",
      path: clonePath,
      languages,
      staticAnalysis,
      debtScore,
      costEstimate,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to clone repository", error: error.message });
  }
};

const explainIssue = async (req, res) => {
  try {
    const { repoPath, file, line } = req.body;

    if (!repoPath || !file || !line) {
      return res.status(400).json({ message: "repoPath, file, and line are required" });
    }

    const fullFilePath = path.join(repoPath, file);
    const snippet = extractSnippet(fullFilePath, line);

    if (!snippet) {
      return res.status(404).json({ message: "Could not read the specified file/line" });
    }

    const explanation = await explainCode(snippet);

    res.status(200).json({
      file,
      line,
      snippet,
      explanation,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to explain code", error: error.message });
  }
};

const refactorIssue = async (req, res) => {
  try {
    const { repoPath, file, line } = req.body;

    if (!repoPath || !file || !line) {
      return res.status(400).json({ message: "repoPath, file, and line are required" });
    }

    const fullFilePath = path.join(repoPath, file);
    const snippet = extractSnippet(fullFilePath, line);

    if (!snippet) {
      return res.status(404).json({ message: "Could not read the specified file/line" });
    }

    const suggestions = await suggestRefactor(snippet);

    res.status(200).json({
      file,
      line,
      snippet,
      suggestions,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to generate suggestions", error: error.message });
  }
};

const chatAboutCode = async (req, res) => {
  try {
    const { repoPath, repoUrl, file, line, question } = req.body;

    if (!repoPath || !file || !question) {
      return res.status(400).json({ message: "repoPath, file, and question are required" });
    }

    const fullFilePath = path.join(repoPath, file);
    const snippet = extractSnippet(fullFilePath, line || 1, 20);

    if (!snippet) {
      return res.status(404).json({ message: "Could not read the specified file" });
    }

    const answer = await askAboutCode(question, snippet);

    await ChatHistory.create({
      user: req.user.id,
      repoUrl: repoUrl || repoPath,
      file,
      question,
      answer,
    });

    res.status(200).json({ question, answer });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to answer question", error: error.message });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const { repoUrl } = req.query;

    const filter = { user: req.user.id };
    if (repoUrl) filter.repoUrl = repoUrl;

    const history = await ChatHistory.find(filter).sort({ createdAt: 1 });

    res.status(200).json({ history });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to fetch chat history", error: error.message });
  }
};

const prioritizeIssues = async (req, res) => {
  try {
    const { issues } = req.body;

    if (!issues || !Array.isArray(issues)) {
      return res.status(400).json({ message: "issues array is required" });
    }

    const prioritized = await prioritizeDebt(issues);

    res.status(200).json({ prioritized });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to prioritize issues", error: error.message });
  }
};

module.exports = { importRepo, explainIssue, refactorIssue, prioritizeIssues, chatAboutCode, getChatHistory };