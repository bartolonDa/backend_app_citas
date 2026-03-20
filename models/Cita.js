const mongoose = require('mongoose');

const CitaSchema = new mongoose.Schema({
  usuarioEmail: { type: String, required: true },
  fecha: { type: String, required: true },
  hora: { type: String, required: true },
  especialidad: { type: String, required: true },
  motivo: { type: String, required: true },
  creada: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cita', CitaSchema);