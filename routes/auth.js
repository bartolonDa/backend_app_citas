const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Doctor = require('../models/Doctor');
const Usuario = require('../models/Usuario');

/**
 * POST /api/auth/login
 * Recibe { nombre, email, uid } tras el login con Google.
 * Devuelve el rol resuelto: 'admin' | 'doctor' | 'paciente'
 */
router.post('/login', async (req, res) => {
  try {
    const { nombre, email, uid } = req.body;
    if (!email) return res.status(400).json({ mensaje: 'Email requerido' });

    // ¿Es admin?
    const admin = await Admin.findOne({ email });
    if (admin) {
      if (!admin.uid) await Admin.findByIdAndUpdate(admin._id, { uid, nombre });
      return res.json({ rol: 'admin', nombre: admin.nombre || nombre });
    }

    // ¿Es doctor?
    const doctor = await Doctor.findOne({ email });
    if (doctor) {
      if (!doctor.uid) await Doctor.findByIdAndUpdate(doctor._id, { uid });
      return res.json({ rol: 'doctor', nombre: doctor.nombre, especialidad: doctor.especialidad });
    }

    // Es paciente: registrar si no existe
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

module.exports = router;
