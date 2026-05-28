const express = require("express");
const router = express.Router();

const {
  addTeamMember,
  getAllTeamMembers,
  updateTeamMember,  // 👈 ADDED
  deleteTeamMember   // 👈 ADDED
} = require("../controllers/superAdminTeamController");

// ADD MEMBER
router.post("/add", addTeamMember);

// GET ALL MEMBERS
router.get("/all", getAllTeamMembers);

// UPDATE MEMBER (ID ke sath)
router.put("/update/:id", updateTeamMember);    // 👈 ADDED

// DELETE MEMBER (ID ke sath)
router.delete("/delete/:id", deleteTeamMember); // 👈 ADDED

module.exports = router;