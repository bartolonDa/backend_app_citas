const express = require('express');
const router = express.Router();
const UsuarioCred = require('../models/UsuarioCred');
const Cita = require('../models/Cita');

/* ───────────────────────────────
   Generar slots
─────────────────────────────── */
async function generarSlots(doctor, fecha) {
  const date = new Date(fecha + 'T00:00:00');
  const diaSemana = date.getUTCDay();

  const horario = doctor.horarios?.find(h => h.diaSemana === diaSemana);
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

  const citas = await Cita.find({
    doctorEmail: doctor.email,
    fecha,
    estado: { $ne: 'cancelada' }
  }).select('hora');

  const ocupadas = new Set(citas.map(c => c.hora));
  return slots.filter(s => !ocupadas.has(s));
}

/* ───────────────────────────────
   GET doctores
─────────────────────────────── */
router.get('/', async (req, res) => {
  try {
    const docs = await UsuarioCred.find({ rol: 'doctor', activo: true })
      .select('nombre email especialidad');
    res.json(docs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ───────────────────────────────
   HORARIO
─────────────────────────────── */
router.get('/:email/horario', async (req, res) => {
  try {
    const doctor = await UsuarioCred.findOne({ email: req.params.email, rol: 'doctor' });
    if (!doctor) return res.status(404).json({ mensaje: 'Doctor no encontrado' });

    res.json(doctor);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ───────────────────────────────
   DISPONIBILIDAD
─────────────────────────────── */
router.get('/:email/disponibilidad', async (req, res) => {
  try {
    const { fecha } = req.query;
    const doctor = await UsuarioCred.findOne({ email: req.params.email, rol: 'doctor' });

    if (!doctor) return res.status(404).json({ mensaje: 'Doctor no encontrado' });

    const slots = await generarSlots(doctor, fecha);
    res.json({ slotsDisponibles: slots });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
module.exports.generarSlots = generarSlots;