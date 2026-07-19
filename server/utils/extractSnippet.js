const fs = require("fs");

const extractSnippet = (filePath, lineNumber, contextLines = 10) => {
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const lines = fileContent.split("\n");

    const start = Math.max(0, lineNumber - 2);
    const end = Math.min(lines.length, lineNumber + contextLines);

    return lines.slice(start, end).join("\n");
  } catch (error) {
    return null;
  }
};

module.exports = extractSnippet;