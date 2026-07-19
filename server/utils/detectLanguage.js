const { glob } = require("glob");
const path = require("path");

const languageMap = {
  ".js": "JavaScript",
  ".jsx": "JavaScript (React)",
  ".ts": "TypeScript",
  ".tsx": "TypeScript (React)",
  ".py": "Python",
  ".java": "Java",
  ".cs": "C#",
  ".cpp": "C++",
  ".c": "C",
};

const detectLanguages = async (repoPath) => {
  const pattern = path.join(repoPath, "**/*.*").replace(/\\/g, "/");
  const files = await glob(pattern, { nodir: true, ignore: "**/node_modules/**" });

  const counts = {};

  files.forEach((file) => {
    const ext = path.extname(file);
    const language = languageMap[ext];
    if (language) {
      counts[language] = (counts[language] || 0) + 1;
    }
  });

  return counts;
};

module.exports = detectLanguages;