import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportReportToPDF = (result, priorities, repoUrl) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.text("AI Technical Debt Report", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(repoUrl, pageWidth / 2, 27, { align: "center" });
  doc.text(new Date().toLocaleString(), pageWidth / 2, 32, { align: "center" });

  let y = 45;
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Debt Scores", 14, y);

  y += 8;
  autoTable(doc, {
    startY: y,
    head: [["Metric", "Score"]],
    body: [
      ["Overall", `${result.debtScore.overall}/100`],
      ["Maintainability", `${result.debtScore.maintainability}/100`],
      ["Security", `${result.debtScore.security}/100`],
      ["Complexity", `${result.debtScore.complexity}/100`],
    ],
    theme: "grid",
  });

  y = doc.lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.text("Issue Breakdown", 14, y);
  y += 8;
  autoTable(doc, {
    startY: y,
    head: [["Category", "Count"]],
    body: [
      ["Total Issues", result.debtScore.breakdown.totalIssues],
      ["Security Issues", result.debtScore.breakdown.securityIssues],
      ["Complexity Issues", result.debtScore.breakdown.complexityIssues],
      ["Maintainability Issues", result.debtScore.breakdown.maintainabilityIssues],
      ["Files Analyzed", result.debtScore.breakdown.filesAnalyzed],
    ],
    theme: "grid",
  });

  y = doc.lastAutoTable.finalY + 15;

  if (priorities && priorities.length > 0) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.text("AI-Prioritized Action Plan", 14, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["#", "Rule", "Impact", "Effort", "Reasoning"]],
      body: priorities.map((p) => [p.priority, p.rule, p.impact, p.effort, p.reasoning]),
      theme: "grid",
      styles: { fontSize: 8, cellWidth: "wrap" },
      columnStyles: { 4: { cellWidth: 80 } },
    });

    y = doc.lastAutoTable.finalY + 15;
  }

  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(14);
  doc.text("Sample Issues Found", 14, y);
  y += 8;

  const sampleIssues = result.staticAnalysis.issues.slice(0, 20);
  autoTable(doc, {
    startY: y,
    head: [["File", "Line", "Rule", "Message"]],
    body: sampleIssues.map((i) => [i.file, i.line, i.rule || "-", i.message]),
    theme: "grid",
    styles: { fontSize: 8 },
  });

  doc.save("technical-debt-report.pdf");
};