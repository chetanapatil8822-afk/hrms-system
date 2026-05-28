const mongoose = require('mongoose');

const SuperadminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  admin: [
    { type: mongoose.Schema.Types.ObjectId, ref: "admin" }
  ]
});

module.exports = mongoose.model('Superadmin', SuperadminSchema);