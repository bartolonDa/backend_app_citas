const express = require('express');
const router  = express.Router();
const Admin = require('../models/Admin');
const Doctor = require('../models/Doctor');
const Usuario = require('../models/Usuario');
const UsuarioCred = require('../models/UsuarioCred');

router.post('/login', async (req, res) => {
  try {
    const { nombre, email, uid } = req.body;
    if (!email) return res.status(400).json({ mensaje: 'Email requerido' });

    const admin = await Admin.findOne({ email });
    if (admin) {
      if (!admin.uid) await Admin.findByIdAndUpdate(admin._id, { uid, nombre });
      return res.json({ rol: 'admin', nombre: admin.nombre || nombre });
    }

    const doctor = await Doctor.findOne({ email });
    if (doctor) {
      if (!doctor.uid) await Doctor.findByIdAndUpdate(doctor._id, { uid });
      return res.json({ rol: 'doctor', nombre: doctor.nombre, especialidad: doctor.especialidad });
    }

    const credUser = await UsuarioCred.findOne({ email });
    if (credUser) {
      return res.json({ rol: credUser.rol, nombre: credUser.nombre });
    }

    let usuario = await Usuario.findOne({ email });
    if (!usuario) {
      usuario = new Usuario({ nombre, email, uid });
      await usuario.save();
    }
    return res.json({ rol: 'paciente', nombre: usuario.nombre || nombre });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login-credentials', async (req, res) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password)
      return res.status(400).json({ mensaje: 'Usuario y contraseña requeridos' });

    const user = await UsuarioCred.findOne({ usuario, activo: true });
    if (!user) return res.status(401).json({ mensaje: 'Usuario no encontrado' });

    const ok = await user.verificarPassword(password);
    if (!ok) return res.status(401).json({ mensaje: 'Contraseña incorrecta' });

    return res.json({
      id: user._id,
      rol: user.rol,
      nombre: user.nombre,
      usuario: user.usuario,
      email: user.email || '',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
