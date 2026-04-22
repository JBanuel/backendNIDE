import express from 'express';
import cors from 'cors';
import db from './dbManagement.mjs';

const app = express();
app.use(cors());
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
    res.status(400).json({ error: err.message });
  }
});

app.post('/loginJuego', async (req, res) => {
    const { id, password } = req.body; 
    
    try {
        const user_loged = await db.loginJuego(connection, id, password);
        res.status(200).json(user_loged);
    } catch (err) {
        res.status(400).json({ error: err.message });
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

app.post('/dash/instructor/crearEstudiante', async (req, res) => {
    const { 
        nombre, 
        apellido, 
        fecha_nacimiento, 
        genero, 
        correo, 
        contrasena, 
        nombreRol, 
        dificultad 
    } = req.body;

    try {
        const id_user_created = await db.createEstudiante(
            connection, 
            nombre, 
            apellido, 
            fecha_nacimiento, 
            genero, 
            correo, 
            contrasena, 
            nombreRol, 
            dificultad
        );

        res.status(200).json({
            message: "Estudiante registrado exitosamente en Kidplays",
            id: id_user_created,
            nombreRol: nombreRol
        });

    } catch (err) {
        // Manejo de errores (por ejemplo, si el correo ya existe o el rol no es válido)
        res.status(500).json({ 
            error: "No se pudo completar el registro: " + err.message 
        });
    }
});

app.post('/juego/addCombate', async (req, res) => {
  const { idEstudiante, idNPC, preguntasHechas, aciertos, duracion, dificultad } = req.body;
  try {
    const idCombate = await db.addCombate(connection, idEstudiante, idNPC, preguntasHechas, aciertos, duracion, dificultad);
    res.status(200).json({
      message: "Estadistiicas de combate registradas",
      id: idCombate
    });
  } catch (err) {
    res.status(500).json({ error: "No se pudo completar el registro: " + err.message });
  }
});

app.get('/dash/instructor/asignacionEstudiantes', async (req, res) => {

});

app.post('/dash/instructor', async (req, res) => {
  const { id_instructor } = req.body;
  try {
    const arrEstadisticas = await db.getEstadisticasEstudiantes(connection, id_instructor);
    res.status(200).json({
      estadisticas: arrEstadisticas
    });
  } catch (err) {
    res.status(500).json({ error: "No se pudo completar el registro: " + err.message });
  }
});

app.get('/dash/admin/getAllUnauthorized', async (req, res) => {
  try {
    const arrEstadisticas = await db.getEstadisticasEstudiantes(connection, id_instructor);
    res.status(200).json({
      estadisticas: arrEstadisticas
    });
  } catch (err) {
    res.status(500).json({ error: "No se pudo completar el registro: " + err.message });
  }
});

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
export default app;





