const mongoose = require('mongoose');

const HorarioSchema = new mongoose.Schema({
  diaSemana: { type: Number, required: true }, // 0=Dom, 1=Lun, ..., 6=Sab
  horaInicio: { type: String, required: true }, // "08:00"
  horaFin: { type: String, required: true },    // "17:00"
  intervaloMinutos: { type: Number, default: 30 }
}, { _id: false });

const DoctorSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  uid: { type: String },
  especialidad: { type: String, required: true },
  horarios: [HorarioSchema],
  activo: { type: Boolean, default: true },
  fechaRegistro: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Doctor', DoctorSchema);
