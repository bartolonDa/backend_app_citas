const mongoose = require('mongoose');

const CitaSchema = new mongoose.Schema({
  usuarioEmail: { type: String, required: true },
  doctorEmail: { type: String, required: true },
  fecha: { type: String, required: true },   // "YYYY-MM-DD"
  hora: { type: String, required: true },    // "HH:MM"
  especialidad: { type: String, required: true },
  motivo: { type: String, required: true },

  // Cambios por admin/doctor
  modificadoPor: { type: String },          
  razonModificacion: { type: String },    
  modificadoRol: { type: String },       

  estado: {
    type: String,
    enum: ['pendiente', 'confirmada', 'cancelada'],
    default: 'pendiente'
  },

  creada: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cita', CitaSchema);
