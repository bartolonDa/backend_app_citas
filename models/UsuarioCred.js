const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UsuarioCredSchema = new mongoose.Schema({
  nombre:   { type: String, required: true },
  usuario:  { type: String, required: true, unique: true },
  email:    { type: String, default: "" },
  password: { type: String, required: true },
  rol:      { type: String, enum: ['admin', 'doctor', 'paciente'], default: 'paciente' },
  activo:   { type: Boolean, default: true },
  fechaRegistro: { type: Date, default: Date.now }
});

UsuarioCredSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UsuarioCredSchema.methods.verificarPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('UsuarioCred', UsuarioCredSchema);
