const calculateDebtScore = (staticAnalysis, languages) => {
  const totalFiles = staticAnalysis.filesAnalyzed || 1;
  const issues = staticAnalysis.issues || [];

  const securityIssues = issues.filter((i) => i.rule && i.rule.startsWith("security/"));
  const complexityIssues = issues.filter((i) => i.rule === "complexity" || i.rule === "max-depth");
  const maintainabilityIssues = issues.filter(
    (i) => i.rule === "no-unused-vars" || i.rule === "no-undef" || i.rule === "max-lines-per-function"
  );

  const securityRate = securityIssues.length / totalFiles;
  const complexityRate = complexityIssues.length / totalFiles;
  const maintainabilityRate = maintainabilityIssues.length / totalFiles;

  const securityScore = Math.max(0, Math.round(100 - securityRate * 40));
  const complexityScore = Math.max(0, Math.round(100 - complexityRate * 30));
  const maintainabilityScore = Math.max(0, Math.round(100 - maintainabilityRate * 15));

  const overallScore = Math.round(
    (securityScore + complexityScore + maintainabilityScore) / 3
  );

  return {
    maintainability: maintainabilityScore,
    security: securityScore,
    complexity: complexityScore,
    overall: overallScore,
    breakdown: {
      totalIssues: issues.length,
      securityIssues: securityIssues.length,
      complexityIssues: complexityIssues.length,
      maintainabilityIssues: maintainabilityIssues.length,
      filesAnalyzed: totalFiles,
    },
  };
};

module.exports = calculateDebtScore;