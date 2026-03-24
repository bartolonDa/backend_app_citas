const express = require('express');
const router  = express.Router();
const Admin       = require('../models/Admin');
const Doctor      = require('../models/Doctor');
const Usuario     = require('../models/Usuario');
const UsuarioCred = require('../models/UsuarioCred');
const bcrypt      = require('bcryptjs');

/* ──────────────────────────────────────────────────────────
   ADMINS
   Los admins se guardan en la colección Admin (para login con Google)
   Y en UsuarioCred (para login con correo + contraseña).
   El campo "usuario" en UsuarioCred es el mismo email del admin.
────────────────────────────────────────────────────────── */

// Obtener todos los admins
router.get('/admins', async (req, res) => {
  try {
    const admins = await Admin.find().sort({ fechaRegistro: -1 });
    res.json(admins);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Crear admin: requiere nombre, email y password
router.post('/admins', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    // Validar campos obligatorios
    if (!nombre || !email || !password) {
      return res.status(400).json({ mensaje: 'Nombre, correo y contraseña son obligatorios.' });
    }

    // Verificar si ya existe en Admin (para Google)
    if (await Admin.findOne({ email })) {
      return res.status(409).json({ mensaje: 'Ya existe un admin con ese correo.' });
    }

    // Crear en colección Admin (permite login con Google)
    await Admin.create({ nombre, email });

    // Crear en UsuarioCred (permite login con correo + contraseña)
    // Solo si no existe ya un UsuarioCred con ese email/usuario
    const yaExisteCred = await UsuarioCred.findOne({ usuario: email });
    if (!yaExisteCred) {
      const cred = new UsuarioCred({
        nombre,
        usuario: email,   // el correo ES el usuario de login
        email,
        password,         // el hook pre-save lo hashea
        rol: 'admin',
        activo: true
      });
      await cred.save();
    }

    res.status(201).json({ mensaje: 'Admin creado correctamente.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Eliminar admin por id
router.delete('/admins/:id', async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (admin?.email) {
      // Eliminar también de UsuarioCred para que no pueda iniciar sesión
      await UsuarioCred.findOneAndDelete({ usuario: admin.email });
    }
    res.json({ mensaje: 'Admin eliminado.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ──────────────────────────────────────────────────────────
   DOCTORES
   Los doctores también se guardan en UsuarioCred.
   El correo es su identificador y "usuario" de login.
────────────────────────────────────────────────────────── */

// Crear doctor: requiere nombre, email, especialidad y password
router.post('/crear-doctor', async (req, res) => {
  try {
    const { nombre, email, especialidad, password } = req.body;

    if (!nombre || !email || !especialidad || !password) {
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
    }

    // Verificar duplicado en UsuarioCred
    if (await UsuarioCred.findOne({ usuario: email })) {
      return res.status(409).json({ mensaje: 'Ya existe un doctor con ese correo.' });
    }

    const doc = new UsuarioCred({
      nombre,
      usuario: email,   // el correo ES el usuario de login
      email,
      password,         // hasheado por el hook pre-save
      rol: 'doctor',
      especialidad,
      activo: true,
      horarios: [
        // Horario de ejemplo: lunes 08:00-17:00, cada 30 min
        { diaSemana: 1, horaInicio: '08:00', horaFin: '17:00', intervaloMinutos: 30 }
      ]
    });
    await doc.save();

    res.status(201).json({ mensaje: 'Doctor creado correctamente.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Eliminar doctor por id
router.delete('/doctores/:id', async (req, res) => {
  try {
    await UsuarioCred.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Doctor eliminado.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ──────────────────────────────────────────────────────────
   USUARIOS GOOGLE
   Muestra y gestiona solo usuarios registrados con Google
   (colección Usuario, sin contraseña).
────────────────────────────────────────────────────────── */

// Obtener todos los usuarios Google
router.get('/usuarios-google', async (req, res) => {
  try {
    const usuarios = await Usuario.find().sort({ fechaRegistro: -1 });
    res.json(usuarios);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Crear usuario Google manualmente (solo nombre y email)
router.post('/usuarios-google', async (req, res) => {
  try {
    const { nombre, email } = req.body;

    if (!nombre || !email) {
      return res.status(400).json({ mensaje: 'Nombre y correo son obligatorios.' });
    }

    if (await Usuario.findOne({ email })) {
      return res.status(409).json({ mensaje: 'Ya existe un usuario con ese correo.' });
    }

    await Usuario.create({ nombre, email });
    res.status(201).json({ mensaje: 'Usuario creado correctamente.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Eliminar usuario Google por id
router.delete('/usuarios-google/:id', async (req, res) => {
  try {
    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Usuario eliminado.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ──────────────────────────────────────────────────────────
   RUTAS LEGACY (mantener compatibilidad con MiHorario)
────────────────────────────────────────────────────────── */

// Actualizar horario de doctor (usado por MiHorario.jsx)
router.put('/usuarios-cred/:id', async (req, res) => {
  try {
    const { horarios } = req.body;
    await UsuarioCred.findByIdAndUpdate(req.params.id, { horarios });
    res.json({ mensaje: 'Horario actualizado.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;