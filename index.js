const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

const corsOptions = {
  origin: [
    'hthttp://frontendcitas.s3-website.us-east-2.amazonaws.com',
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conectado a MongoDB Atlas'))
  .catch(err => console.error('Error de conexión', err));

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/citas',    require('./routes/citas'));
app.use('/api/doctores', require('./routes/doctores'));
app.use('/api/admin',    require('./routes/admin'));

app.listen(process.env.PORT, '0.0.0.0', () =>
  console.log(`Servidor activo en el puerto ${process.env.PORT}`)
);
