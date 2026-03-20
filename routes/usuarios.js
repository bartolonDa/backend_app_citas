const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');

router.post('/', async (req, res) => {
  try {
    const { nombre, email, uid } = req.body;

    let usuario = await Usuario.findOne({ email });

    if (!usuario) {
      usuario = new Usuario({ nombre, email, uid });
      await usuario.save();
    }

    res.status(200).json({ mensaje: "Usuario registrado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;