const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conectado a MongoDB Atlas'))
  .catch(err => console.error('Error de conexión', err));

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/citas',    require('./routes/citas'));
app.use('/api/doctores', require('./routes/doctores'));
app.use('/api/admin',    require('./routes/admin'));

app.listen(process.env.PORT || 5001, '0.0.0.0', () => {
  console.log('Servidor activo en el puerto', process.env.PORT || 5001);
});