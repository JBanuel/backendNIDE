import express from 'express';
import cors from 'cors';
import db from './dbManagement.mjs';

const port = 8080;

const app = express();
app.use(cors());
app.use(express.json());

async function startServer() {
  try {
    let connection = await db.connect();
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
    let connection = await db.connect();
    const user_loged = await db.loginUser(connection, email, password, nombreRol);
    res.status(200).json(user_loged);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/loginJuego', async (req, res) => {
  const { id, password } = req.body;

  try {
    let connection = await db.connect();
    const user_loged = await db.loginJuego(connection, id, password);
    res.status(200).json(user_loged);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/register', async (req, res) => {
  const { nombre, apellido, fecha_nacimiento, genero, correo, contrasena, nombreRol } = req.body;
  try {
    let connection = await db.connect();
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
  const { nombre, apellido, fecha_nacimiento, genero, correo, contrasena, dificultad } = req.body;

  try {
    let connection = await db.connect();
    const id_user_created = await db.createEstudiante(
      connection,
      nombre,
      apellido,
      fecha_nacimiento,
      genero,
      correo,
      contrasena,
      dificultad
    );

    res.status(200).json({
      message: "Registro exitoso",
      id: id_user_created,
    });

  } catch (err) {
    res.status(500).json({
      error: "No se pudo completar el registro: " + err.message
    });
  }
});

app.post('/juego/addCombate', async (req, res) => {
  const { idEstudiante, idNPC, preguntasHechas, aciertos, duracion, fecha_combate, dificultad } = req.body;
  try {
    let connection = await db.connect();
    const idCombate = await db.addCombate(connection, idEstudiante, idNPC, preguntasHechas, aciertos, duracion, fecha_combate, dificultad);
    res.status(200).json({
      message: "Registro exitoso",
      id: idCombate
    });
  } catch (err) {
    res.status(500).json({ error: "No se pudo completar el registro: " + err.message });
  }
});

app.put('/dash/instructor/asignarEstudiante', async (req, res) => {
  let { idEstudiante, idInstructor } = req.body;
  if(!idInstructor) idInstructor = null;
  try { 
    let connection = await db.connect();
    await db.asignarEstudianteInstructor(connection, idEstudiante, idInstructor);
    res.status(200).json({message : "Se le asigno a: " + idEstudiante + ", el instructor: " + idInstructor})
  } catch(err){
    res.status(500).json({error : "Error al asignar instructor " + err.message })
  }
});

app.post('/dash/instructor', async (req, res) => {
  const { id_instructor } = req.body;
  try {
    let connection = await db.connect();
    const arrEstadisticas = await db.getEstadisticasEstudiantes(connection, id_instructor);
    res.status(200).json(arrEstadisticas);
  } catch (err) {
    res.status(500).json({ error: "No se pudo completar el registro: " + err.message });
  }
});

app.put('/dash/instructor/cambiarDificultad', async (req, res) => {
  const { dificultad, idEstudiante } = req.body;
  try {
    let connection = await db.connect();
    await db.cambiarDificultad(dificultad, idEstudiante);
    res.status(200).json({message : "Dificultad cambiada con éxito"});
  } catch(err){
    res.status(500).json({error: "No se puedo cambiar la dificultad" + err.message});
  }
})

app.get('/dash/admin/getAllUnauthorized', async (req, res) => {
  try {
    let connection = await db.connect();
    const arrEstadisticas = await db.getEstadisticasEstudiantes(connection, id_instructor);
    res.status(200).json({
      estadisticas: arrEstadisticas
    });
  } catch (err) {
    res.status(500).json({ error: "No se pudo completar el registro: " + err.message });
  }
});

if (process.env.AWS_LAMBDA_FUNCTION_NAME === undefined) {
  app.listen(port, () => {
    console.log(`Server listening at http://localhost::8080`);
  });
}
export default app;