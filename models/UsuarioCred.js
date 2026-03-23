const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UsuarioCredSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  usuario: { type: String, required: true, unique: true, trim: true },
  email: { type: String, default: '', trim: true },
  password: { type: String, required: true },
  rol: { type: String, enum: ['admin', 'doctor', 'paciente'], default: 'paciente' },
  activo: { type: Boolean, default: true },
  fechaRegistro: { type: Date, default: Date.now }
});

UsuarioCredSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

UsuarioCredSchema.methods.verificarPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('UsuarioCred', UsuarioCredSchema);