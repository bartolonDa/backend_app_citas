/**
 * seed-admin.js
 * Ejecutar UNA sola vez para crear el primer admin:
 *   node seed-admin.js
 *
 * Requiere MONGO_URI en .env o como variable de entorno.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

const PRIMER_ADMIN = {
  nombre: 'Administrador Principal',
  email: 'bartolonramirezl@gmail.com',   // <-- cambia este email
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Conectado a MongoDB');

  const existe = await Admin.findOne({ email: PRIMER_ADMIN.email });
  if (existe) {
    console.log('El admin ya existe:', PRIMER_ADMIN.email);
  } else {
    await Admin.create(PRIMER_ADMIN);
    console.log('Admin creado:', PRIMER_ADMIN.email);
  }

  await mongoose.disconnect();
})();
