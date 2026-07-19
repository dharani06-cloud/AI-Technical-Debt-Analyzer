const HOURLY_RATE_INR = 1500; // adjust to your local market rate

const EFFORT_PER_ISSUE = {
  security: 1.5,       // hours per security issue (careful, high-risk fixes)
  complexity: 2,       // hours per complex function (needs refactor + testing)
  maintainability: 0.25, // hours per minor issue (unused vars, etc. - quick fixes)
};

const estimateCost = (breakdown) => {
  const securityHours = breakdown.securityIssues * EFFORT_PER_ISSUE.security;
  const complexityHours = breakdown.complexityIssues * EFFORT_PER_ISSUE.complexity;
  const maintainabilityHours = breakdown.maintainabilityIssues * EFFORT_PER_ISSUE.maintainability;

  const totalHours = Math.round(securityHours + complexityHours + maintainabilityHours);
  const totalCost = totalHours * HOURLY_RATE_INR;

  return {
    estimatedHours: totalHours,
    estimatedCostINR: totalCost,
    breakdown: {
      securityHours: Math.round(securityHours),
      complexityHours: Math.round(complexityHours),
      maintainabilityHours: Math.round(maintainabilityHours),
    },
    hourlyRateUsed: HOURLY_RATE_INR,
  };
};

module.exports = estimateCost;