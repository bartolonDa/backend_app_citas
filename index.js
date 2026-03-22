const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

const corsOptions = {
 origin: [
 'http://frontendcitas.s3-website.us-east-2.amazonaws.com', // URL de CloudFront
 'http://localhost:5173', // Para desarrollo local
 'http://localhost:3000', // CRA en local
 ],
 methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
 credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Conectado a MongoDB Atlas"))
    .catch(err => console.error("Error de conexión", err));

app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/citas', require('./routes/citas'));

app.listen(process.env.PORT, "0.0.0.0" ,() =>
    console.log(`Servidor activo en el puerto ${process.env.PORT}`)
);