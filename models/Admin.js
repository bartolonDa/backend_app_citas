const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  uid: { type: String },
  fechaRegistro: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Admin', AdminSchema);
