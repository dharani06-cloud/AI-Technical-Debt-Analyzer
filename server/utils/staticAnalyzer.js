const { ESLint } = require("eslint");
const path = require("path");
const glob = require("glob");

const runStaticAnalysis = async (repoPath) => {
  const pattern = path.join(repoPath, "**/*.js").replace(/\\/g, "/");
  const files = glob.sync(pattern, { ignore: "**/node_modules/**" });

  if (files.length === 0) {
    return {
      totalIssues: 0,
      filesAnalyzed: 0,
      issues: [],
    };
  }

  const eslint = new ESLint({
    useEslintrc: false,
    overrideConfigFile: path.join(__dirname, "..", "eslint-analysis-config.json"),
    resolvePluginsRelativeTo: path.join(__dirname, ".."),
    overrideConfig: {
      ignorePatterns: ["**/node_modules/**", "**/dist/**", "**/build/**"],
    },
  });

  const results = await eslint.lintFiles(files);

  let totalIssues = 0;
  const issueDetails = [];

  results.forEach((fileResult) => {
    totalIssues += fileResult.messages.length;
    fileResult.messages.forEach((msg) => {
      issueDetails.push({
        file: path.relative(repoPath, fileResult.filePath),
        line: msg.line,
        rule: msg.ruleId,
        message: msg.message,
        severity: msg.severity === 2 ? "error" : "warning",
      });
    });
  });

  return {
    totalIssues,
    filesAnalyzed: results.length,
    issues: issueDetails,
  };
};

module.exports = runStaticAnalysis;