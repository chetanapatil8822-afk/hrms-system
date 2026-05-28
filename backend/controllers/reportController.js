// backend/controllers/reportcontroller.js

// 🎯 Direct Absolute/Relative Mapping (No complex try-catch masking)
const Company = require("../models/Company");
//const User = require("../models/User");
//const Ticket = require("../models/Ticket");

exports.getPlatformReport = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    // 📅 Dynamic Date Range Filter Configuration
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    let reportData = [];

    // Safety fallback check
    if (!Company || !User || !Ticket) {
      return res.status(500).json({ 
        success: false, 
        message: "Critical Error: One or more database schemas failed to initialize on runtime." 
      });
    }

    switch (type) {
      // 🏢 1. Company Growth Report
      case "growth":
        reportData = await Company.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
              "Total Registered Companies": { $sum: 1 },
              "Active Nodes": { $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] } },
              "Suspended Nodes": { $sum: { $cond: [{ $eq: ["$status", "Suspended"] }, 1, 0] } }
            }
          },
          { $project: { _id: 0, "Billing Month": "$_id", "Total Registered Companies": 1, "Active Nodes": 1, "Suspended Nodes": 1 } },
          { $sort: { "Billing Month": 1 } }
        ]);
        break;

      // 💳 2. Revenue Report
      case "revenue":
        reportData = await Company.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: "$subscriptionPlan",
              "Subscribed Clients": { $sum: 1 },
              "Estimated Monthly Revenue (INR)": {
                $sum: {
                  $switch: {
                    branches: [
                      { case: { $eq: ["$subscriptionPlan", "Starter"] }, then: 999 },
                      { case: { $eq: ["$subscriptionPlan", "Business"] }, then: 2499 },
                      { case: { $eq: ["$subscriptionPlan", "Enterprise"] }, then: 4999 }
                    ],
                    default: 0
                  }
                }
              }
            }
          },
          { $project: { _id: 0, "Plan Hierarchy Tier": "$_id", "Subscribed Clients": 1, "Estimated Monthly Revenue (INR)": 1 } },
          { $sort: { "Estimated Monthly Revenue (INR)": -1 } }
        ]);
        break;

      // 👥 3. User Activity Report
      case "user_activity":
        reportData = await User.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: "$role",
              "Total System Active Users": { $sum: 1 }
            }
          },
          { $project: { _id: 0, "System Authority Role": "$_id", "Total System Active Users": 1 } }
        ]);
        break;

      // 📜 4. Subscription Report
      case "subscription":
        reportData = await Company.aggregate([
          { $match: dateFilter },
          {
            $project: {
              _id: 0,
              "Company Entity Name": "$companyName",
              "Active Gateway Tier": "$subscriptionPlan",
              "Cluster Node Status": "$status",
              "Deployment Timestamp": { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
            }
          },
          { $sort: { "Company Entity Name": 1 } }
        ]);
        break;

      // 🎟️ 5. Support Ticket Report
      case "support":
        reportData = await Ticket.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: "$status",
              "Tickets Count": { $sum: 1 }
            }
          },
          { $project: { _id: 0, "Helpdesk Operational State": "$_id", "Tickets Count": 1 } }
        ]);
        break;

      // 🛠️ 6. HR Module Usage Report
      case "hr_usage":
        reportData = await Company.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: "$companyType",
              "Total Infrastructure Adapters": { $sum: 1 },
              "Average Scale Matrix Size": { $avg: { $cond: [{ $eq: ["$companySize", "500+"]}, 500, 50] } } 
            }
          },
          { $project: { _id: 0, "Corporate Tier Classification": "$_id", "Total Infrastructure Adapters": 1, "Estimated Employee Footprint": { $round: ["$Average Scale Matrix Size", 0] } } }
        ]);
        break;

      default:
        return res.status(400).json({ success: false, message: "Invalid system report request signature." });
    }

    res.status(200).json({ success: true, type, data: reportData });
  } catch (error) {
    console.error("Report Engine Error:", error);
    res.status(500).json({ success: false, message: "Error compiling platform analytical data logs." });
  }
};