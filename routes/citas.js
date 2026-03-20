const express = require('express');
const router = express.Router();
const Cita = require('../models/Cita');

router.post('/', async (req, res) => {
  try {
    const { usuarioEmail, fecha, hora, especialidad, motivo } = req.body;

    if (!usuarioEmail || !fecha || !hora || !especialidad || !motivo) {
      return res.status(400).json({ mensaje: "Faltan campos obligatorios" });
    }

    const nuevaCita = new Cita(req.body);
    await nuevaCita.save();

    res.status(201).json({ mensaje: "Cita agendada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:email', async (req, res) => {
  try {
    const citas = await Cita.find({ usuarioEmail: req.params.email }).sort({ creada: -1 });
    res.json(citas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const { fecha, hora, especialidad, motivo } = req.body;

    if (!fecha || !hora || !especialidad || !motivo) {
      return res.status(400).json({ mensaje: "Faltan campos obligatorios" });
    }

    await Cita.findByIdAndUpdate(req.params.id, req.body);
    res.json({ mensaje: "Cita actualizada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Cita.findByIdAndDelete(req.params.id);
    res.json({ mensaje: "Cita eliminada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;