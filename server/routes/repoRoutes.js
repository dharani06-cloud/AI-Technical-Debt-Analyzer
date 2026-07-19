const express = require("express");
const router = express.Router();
const { importRepo, explainIssue, refactorIssue, prioritizeIssues, chatAboutCode } = require("../controllers/repoController");
const protect = require("../middleware/authMiddleware");

router.post("/import", protect, importRepo);
router.post("/explain", protect, explainIssue);
router.post("/refactor", protect, refactorIssue);
router.post("/prioritize", protect, prioritizeIssues);
router.post("/chat", protect, chatAboutCode);

module.exports = router;