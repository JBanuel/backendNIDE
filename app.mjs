import express from 'express';
import cors from 'cors';
import db from './dbManagement.mjs';

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

let connection;

async function startServer() {
  try {
    connection = await db.connect();
    console.log("Conectado a Kidplays");
    app.listen(8080, () => console.log("Servidor en puerto 8080"));
  } catch (err) {
    console.error("Error inicial:", err);
  }
}

app.post('/login', async (req, res) => {
  const { email, password, nombreRol } = req.body;
  try {
    const user_loged = await db.loginUser(connection, email, password, nombreRol);
    res.status(200).json(user_loged);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

app.post('/register', async (req, res) => {
  const { nombre, apellido, fecha_nacimiento, genero, correo, contrasena, nombreRol} = req.body;
  try {
    const id_user_created = await db.createUser(connection, nombre, apellido, fecha_nacimiento, genero, correo, contrasena, nombreRol);
    res.status(200).json({
      message: "Registro exitoso",
      id: id_user_created,
      nombreRol: nombreRol 
    });
  } catch (err) {
    res.status(500).json({ error: "No se pudo completar el registro: " + err.message });
  }
});

startServer();