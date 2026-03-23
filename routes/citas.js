const express = require('express');
const router = express.Router();
const Cita = require('../models/Cita');
const UsuarioCred = require('../models/UsuarioCred');
const { generarSlots } = require('./doctores');

/* ──────────────────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────────────────── */

function esFechaPasada(fecha, hora) {
  const ahora = new Date();
  const citaDate = new Date(`${fecha}T${hora}:00`);
  return citaDate <= ahora;
}

/* ──────────────────────────────────────────────────────────
   PACIENTE: crear cita
   POST /api/citas
────────────────────────────────────────────────────────── */
router.post('/', async (req, res) => {
  try {
    const { usuarioEmail, doctorEmail, fecha, hora, especialidad, motivo } = req.body;

    if (!usuarioEmail || !doctorEmail || !fecha || !hora || !especialidad || !motivo) {
      return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
    }

    // Fecha/hora pasada
    if (esFechaPasada(fecha, hora)) {
      return res.status(400).json({ mensaje: 'No puedes agendar en una fecha u hora pasada' });
    }

    // Verificar que el doctor existe
    const doctor = await UsuarioCred.findOne({ email: doctorEmail, rol: 'doctor' });
    if (!doctor) return res.status(404).json({ mensaje: 'Doctor no encontrado' });

    // Verificar disponibilidad (slot dentro del horario del doctor)
    const slots = await generarSlots(doctor, fecha);
    if (!slots.includes(hora)) {
      return res.status(409).json({ mensaje: 'El horario seleccionado no está disponible para este doctor' });
    }

    // Verificar que el mismo paciente no tenga ya cita ese día con ese doctor
    const duplicado = await Cita.findOne({
      usuarioEmail,
      doctorEmail,
      fecha,
      estado: { $ne: 'cancelada' }
    });
    if (duplicado) {
      return res.status(409).json({ mensaje: 'Ya tienes una cita con este doctor en esa fecha' });
    }

    const nueva = new Cita({ usuarioEmail, doctorEmail, fecha, hora, especialidad, motivo });
    await nueva.save();
    res.status(201).json({ mensaje: 'Cita agendada', cita: nueva });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ──────────────────────────────────────────────────────────
   PACIENTE: obtener sus citas
   GET /api/citas/paciente/:email
────────────────────────────────────────────────────────── */
router.get('/paciente/:email', async (req, res) => {
  try {
    const citas = await Cita.find({ usuarioEmail: req.params.email }).sort({ creada: -1 });
    res.json(citas);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ──────────────────────────────────────────────────────────
   ADMIN/DOCTOR: todas las citas (con filtro opcional)
   GET /api/citas/todas?doctorEmail=&fecha=&estado=
────────────────────────────────────────────────────────── */
router.get('/todas', async (req, res) => {
  try {
    const filtro = {};
    if (req.query.doctorEmail) filtro.doctorEmail = req.query.doctorEmail;
    if (req.query.fecha) filtro.fecha = req.query.fecha;
    if (req.query.estado) filtro.estado = req.query.estado;

    const citas = await Cita.find(filtro).sort({ fecha: 1, hora: 1 });
    res.json(citas);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ──────────────────────────────────────────────────────────
   PACIENTE: actualizar su propia cita
   PUT /api/citas/:id
────────────────────────────────────────────────────────── */
router.put('/:id', async (req, res) => {
  try {
    const { fecha, hora, especialidad, motivo, doctorEmail } = req.body;

    if (!fecha || !hora || !especialidad || !motivo) {
      return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
    }

    if (esFechaPasada(fecha, hora)) {
      return res.status(400).json({ mensaje: 'No puedes agendar en una fecha u hora pasada' });
    }

    const citaActual = await Cita.findById(req.params.id);
    if (!citaActual) return res.status(404).json({ mensaje: 'Cita no encontrada' });

    const emailDoctor = doctorEmail || citaActual.doctorEmail;
    const doctor = await UsuarioCred.findOne({ email: emailDoctor, rol: 'doctor' });
    if (!doctor) return res.status(404).json({ mensaje: 'Doctor no encontrado' });

    const slots = await generarSlots(doctor, fecha);
    if (!slots.includes(hora)) {
      return res.status(409).json({ mensaje: 'El horario seleccionado no está disponible' });
    }

    await Cita.findByIdAndUpdate(req.params.id, { fecha, hora, especialidad, motivo, doctorEmail: emailDoctor });
    res.json({ mensaje: 'Cita actualizada' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ──────────────────────────────────────────────────────────
   ADMIN / DOCTOR: modificar cita con razón
   PATCH /api/citas/:id/gestion
────────────────────────────────────────────────────────── */
router.patch('/:id/gestion', async (req, res) => {
  try {
    const { accion, razon, modificadoPor, modificadoRol, fecha, hora, especialidad, motivo } = req.body;

    if (!razon || !modificadoPor) {
      return res.status(400).json({ mensaje: 'razon y modificadoPor son requeridos' });
    }

    const cita = await Cita.findById(req.params.id);
    if (!cita) return res.status(404).json({ mensaje: 'Cita no encontrada' });

    if (accion === 'cancelar') {
      await Cita.findByIdAndUpdate(req.params.id, {
        estado: 'cancelada',
        razonModificacion: razon,
        modificadoPor,
        modificadoRol
      });
      return res.json({ mensaje: 'Cita cancelada' });
    }

    if (accion === 'modificar') {
      if (!fecha || !hora) return res.status(400).json({ mensaje: 'fecha y hora requeridas para modificar' });

      const doctor = await UsuarioCred.findOne({ email: cita.doctorEmail, rol: 'doctor' });
      if (doctor) {
        const slots = await generarSlots(doctor, fecha);
        if (!slots.includes(hora)) {
          return res.status(409).json({ mensaje: 'El horario seleccionado no está disponible' });
        }
      }

      await Cita.findByIdAndUpdate(req.params.id, {
        fecha: fecha || cita.fecha,
        hora: hora || cita.hora,
        especialidad: especialidad || cita.especialidad,
        motivo: motivo || cita.motivo,
        razonModificacion: razon,
        modificadoPor,
        modificadoRol,
        estado: 'confirmada'
      });
      return res.json({ mensaje: 'Cita modificada' });
    }

    res.status(400).json({ mensaje: 'accion no válida (cancelar | modificar)' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ──────────────────────────────────────────────────────────
   PACIENTE: eliminar su cita
   DELETE /api/citas/:id
────────────────────────────────────────────────────────── */
router.delete('/:id', async (req, res) => {
  try {
    await Cita.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Cita eliminada' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
