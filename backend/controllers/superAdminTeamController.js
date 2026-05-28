const Superadmin = require("../models/Superadmin");
const bcrypt = require('bcryptjs'); // 👈 Imported bcrypt to protect your password

// ==============================
// ADD TEAM MEMBER
// ==============================
exports.addTeamMember = async (req, res) => {
  try {
    console.log("Incoming Payload Data:", req.body);

    const { name, email, password } = req.body;

    // validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // check existing user
    const existingUser = await Superadmin.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      });
    }

    // 🔐 ENCRYPT PASSWORD BEFORE SAVING
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create new member
    const newMember = await Superadmin.create({
      name,
      email,
      password: hashedPassword // 👈 Saved securely now!
    });

    // Strip password from the response object so it stays hidden
    const responseData = newMember.toObject();
    delete responseData.password;

    res.status(201).json({
      success: true,
      message: "Team member added successfully",
      data: responseData
    });

  } catch (error) {
    console.error("Team Controller Exception Triggered:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

// ==============================
// GET ALL TEAM MEMBERS
// ==============================
exports.getAllTeamMembers = async (req, res) => {
  try {
    // Exclude password field from selection query output
    const members = await Superadmin.find().select("-password");

    res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

// ==============================
// UPDATE TEAM MEMBER (PUT)
// ==============================
exports.updateTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    // Find the user first
    let member = await Superadmin.findById(id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Team member not found"
      });
    }

    // Check if email is being changed and if it already exists elsewhere
    if (email && email !== member.email) {
      const emailExists = await Superadmin.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email is already in use by another member"
        });
      }
      member.email = email;
    }

    if (name) member.name = name;

    // 🔐 Agar naya password bheja hai toh use hash karo
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      member.password = await bcrypt.hash(password, salt);
    }

    const updatedMember = await member.save();

    // Response se password hatane ke liye
    const responseData = updatedMember.toObject();
    delete responseData.password;

    res.status(200).json({
      success: true,
      message: "Team member updated successfully",
      data: responseData
    });

  } catch (error) {
    console.error("Update Controller Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error during update execution"
    });
  }
};

// ==============================
// DELETE TEAM MEMBER (DELETE)
// ==============================
exports.deleteTeamMember = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await Superadmin.findByIdAndDelete(id);
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Team member not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Team member deleted successfully"
    });

  } catch (error) {
    console.error("Delete Controller Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error during deletion execution"
    });
  }
};