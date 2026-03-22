const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Doctor = require('../models/Doctor');

/* ─── ADMINS ─────────────────────────────────────────── */

// GET /api/admin/admins  → listar admins
router.get('/admins', async (req, res) => {
  try {
    const admins = await Admin.find().sort({ fechaRegistro: -1 });
    res.json(admins);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/admin/admins  → crear admin
router.post('/admins', async (req, res) => {
  try {
    const { nombre, email } = req.body;
    if (!nombre || !email) return res.status(400).json({ mensaje: 'nombre y email requeridos' });

    const existe = await Admin.findOne({ email });
    if (existe) return res.status(409).json({ mensaje: 'Ya existe un admin con ese email' });

    const admin = new Admin({ nombre, email });
    await admin.save();
    res.status(201).json({ mensaje: 'Admin creado', admin });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/admin/admins/:id
router.delete('/admins/:id', async (req, res) => {
  try {
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Admin eliminado' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ─── DOCTORES ───────────────────────────────────────── */

// GET /api/admin/doctores
router.get('/doctores', async (req, res) => {
  try {
    const doctores = await Doctor.find().sort({ nombre: 1 });
    res.json(doctores);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/admin/doctores  → crear doctor con horarios
router.post('/doctores', async (req, res) => {
  try {
    const { nombre, email, especialidad, horarios } = req.body;
    if (!nombre || !email || !especialidad) {
      return res.status(400).json({ mensaje: 'nombre, email y especialidad requeridos' });
    }

    const existe = await Doctor.findOne({ email });
    if (existe) return res.status(409).json({ mensaje: 'Ya existe un doctor con ese email' });

    const doctor = new Doctor({ nombre, email, especialidad, horarios: horarios || [] });
    await doctor.save();
    res.status(201).json({ mensaje: 'Doctor creado', doctor });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/admin/doctores/:id  → actualizar doctor
router.put('/doctores/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ mensaje: 'Doctor actualizado', doctor });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/admin/doctores/:id
router.delete('/doctores/:id', async (req, res) => {
  try {
    await Doctor.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Doctor eliminado' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
