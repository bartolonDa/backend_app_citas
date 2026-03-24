const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UsuarioCredSchema = new mongoose.Schema({
  nombre: {type: String,required: true,trim: true},

  usuario: {type: String,required: true,unique: true,trim: true},

  email: {type: String,default: '',trim: true},
  
  password: {type: String,required: true},

  rol: {type: String,enum: ['admin', 'doctor', 'paciente'],default: 'paciente'},

  activo: {type: Boolean,default: true},

  fechaRegistro: {type: Date,default: Date.now},

  especialidad: { type: String, default: '' },
  
  horarios: [{diaSemana: Number,horaInicio: String,horaFin: String,intervaloMinutos: Number}],

});


// ENCRIPTAR PASSWORD (FORMA CORRECTA)
UsuarioCredSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 10);
});


// MÉTODO PARA LOGIN
UsuarioCredSchema.methods.verificarPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};


module.exports = mongoose.model('UsuarioCred', UsuarioCredSchema);