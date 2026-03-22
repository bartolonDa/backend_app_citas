const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const Cita = require('../models/Cita');

/**
 * Genera slots de tiempo para un doctor en una fecha dada.
 * Devuelve array de "HH:MM" disponibles (sin citas ocupadas).
 */
async function generarSlots(doctor, fecha) {
  const date = new Date(fecha + 'T00:00:00');
  const diaSemana = date.getUTCDay(); // 0=Dom … 6=Sáb

  const horario = doctor.horarios.find(h => h.diaSemana === diaSemana);
  if (!horario) return [];

  const [hIni, mIni] = horario.horaInicio.split(':').map(Number);
  const [hFin, mFin] = horario.horaFin.split(':').map(Number);
  const intervalo = horario.intervaloMinutos || 30;

  const slots = [];
  let cur = hIni * 60 + mIni;
  const end = hFin * 60 + mFin;
  while (cur < end) {
    const h = String(Math.floor(cur / 60)).padStart(2, '0');
    const m = String(cur % 60).padStart(2, '0');
    slots.push(`${h}:${m}`);
    cur += intervalo;
  }

  // Quitar los slots ya ocupados
  const citasOcupadas = await Cita.find({
    doctorEmail: doctor.email,
    fecha,
    estado: { $ne: 'cancelada' }
  }).select('hora');

  const ocupadas = new Set(citasOcupadas.map(c => c.hora));
  return slots.filter(s => !ocupadas.has(s));
}

// GET /api/doctores  → lista pública (solo nombre + especialidad) para pacientes
router.get('/', async (req, res) => {
  try {
    const doctores = await Doctor.find({ activo: true }).select('nombre especialidad');
    res.json(doctores);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/doctores/:email/disponibilidad?fecha=YYYY-MM-DD
router.get('/:email/disponibilidad', async (req, res) => {
  try {
    const { fecha } = req.query;
    if (!fecha) return res.status(400).json({ mensaje: 'fecha requerida' });

    const doctor = await Doctor.findOne({ email: req.params.email });
    if (!doctor) return res.status(404).json({ mensaje: 'Doctor no encontrado' });

    const slots = await generarSlots(doctor, fecha);
    res.json({ doctorNombre: doctor.nombre, especialidad: doctor.especialidad, fecha, slotsDisponibles: slots });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/doctores/:email/horario  → horario completo (para paciente: ver días/horas sin citas)
router.get('/:email/horario', async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ email: req.params.email }).select('nombre especialidad horarios');
    if (!doctor) return res.status(404).json({ mensaje: 'Doctor no encontrado' });
    res.json(doctor);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
module.exports.generarSlots = generarSlots;
