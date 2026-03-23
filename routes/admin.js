const express = require('express');
const router  = express.Router();
const Admin       = require('../models/Admin');
const UsuarioCred = require('../models/UsuarioCred');

router.get('/admins', async (req, res) => {
  try { res.json(await Admin.find().sort({ fechaRegistro: -1 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/admins', async (req, res) => {
  try {
    const { nombre, email } = req.body;
    if (!nombre || !email) return res.status(400).json({ mensaje: 'nombre y email requeridos' });
    if (await Admin.findOne({ email })) return res.status(409).json({ mensaje: 'Ya existe un admin con ese email' });
    const admin = await Admin.create({ nombre, email });
    res.status(201).json({ mensaje: 'Admin creado', admin });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/admins/:id', async (req, res) => {
  try { await Admin.findByIdAndDelete(req.params.id); res.json({ mensaje: 'Admin eliminado' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});



router.get('/usuarios-cred', async (req, res) => {
  try { 
    const usuarios = await UsuarioCred.find()
      .select('-password')
      .sort({ fechaRegistro: -1 });

    res.json(usuarios);
  } catch (e) {
    console.error("ERROR EN /usuarios-cred:", e);
    res.status(500).json({ error: e.message });
  }
});
router.post('/usuarios-cred', async (req, res) => {
  try {
    console.log('BODY /usuarios-cred:', req.body);

    const { nombre, usuario, email, password, rol, horarios, especialidad } = req.body;

    if (!nombre || !usuario || !password) {
      return res.status(400).json({ mensaje: 'nombre, usuario y contraseña requeridos' });
    }

    const existente = await UsuarioCred.findOne({ usuario });
    if (existente) {
      return res.status(409).json({ mensaje: 'Ya existe un usuario con ese nombre de usuario' });
    }

    const u = new UsuarioCred({
      nombre,
      usuario,
      email: email || '',
      password,
      rol: rol || 'paciente',
      especialidad: especialidad || '',
      horarios: Array.isArray(horarios) ? horarios : []
    });

    await u.save();

    if (u.rol === 'admin' && u.email) {
      const adminExistente = await Admin.findOne({ email: u.email });
      if (!adminExistente) {
        await Admin.create({
          nombre: u.nombre,
          email: u.email
        });
      }
    }

    console.log('UsuarioCred creado:', u._id);

    return res.status(201).json({ mensaje: 'Usuario creado' });
  } catch (e) {
    console.error('ERROR POST /api/admin/usuarios-cred:', e);
    return res.status(500).json({
      mensaje: 'Error interno al crear usuario',
      error: e.message,
      code: e.code || null
    });
  }
});
router.put('/usuarios-cred/:id', async (req, res) => {
  try {
    const { nombre, usuario, email, password, rol, activo, horarios, especialidad } = req.body;

    const update = {};

    if (nombre !== undefined) update.nombre = nombre;
    if (usuario !== undefined) update.usuario = usuario;
    if (email !== undefined) update.email = email;
    if (rol !== undefined) update.rol = rol;
    if (activo !== undefined) update.activo = activo;
    if (especialidad !== undefined) update.especialidad = especialidad;
    if (horarios !== undefined) update.horarios = horarios;

    if (password) {
      const bcrypt = require('bcryptjs');
      update.password = await bcrypt.hash(password, 10);
    }

    await UsuarioCred.findByIdAndUpdate(req.params.id, update);
    res.json({ mensaje: 'Usuario actualizado' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.delete('/usuarios-cred/:id', async (req, res) => {
  try {
    const usuario = await UsuarioCred.findByIdAndDelete(req.params.id);

    if (usuario?.rol === 'admin' && usuario.email) {
      await Admin.findOneAndDelete({ email: usuario.email });
    }

    res.json({ mensaje: 'Usuario eliminado' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.get('/debug-usuarios-cred', async (req, res) => {
  try {
    const data = await UsuarioCred.find();
    res.json(data);
  } catch (e) {
    console.error('DEBUG UsuarioCred:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
