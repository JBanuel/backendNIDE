import express from 'express';
import cors from 'cors';
import db from './dbManagement.mjs';

const port = 8080;

const app = express();
app.use(cors());
app.use(express.json());

app.post('/login', async (req, res) => {
  const { email, password, nombreRol } = req.body;
  let connection;
  try {
    connection = await db.connect();
    const user_loged = await db.loginUser(connection, email, password, nombreRol);
    res.status(200).json(user_loged);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.post('/loginJuego', async (req, res) => {
  const { id, password } = req.body;
  let connection;

  try {
    connection = await db.connect();
    const user_loged = await db.loginJuego(connection, id, password);
    res.status(200).json(user_loged);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.post('/register', async (req, res) => {
  const { nombre, apellido, fecha_nacimiento, genero, correo, contrasena, nombreRol } = req.body;
  let connection;

  try {
    connection = await db.connect();
    const id_user_created = await db.createUser(connection, nombre, apellido, fecha_nacimiento, genero, correo, contrasena, nombreRol);
    res.status(200).json({
      message: "Registro exitoso",
      id: id_user_created,
      nombreRol: nombreRol
    });
  } catch (err) {
    res.status(500).json({ error: "No se pudo completar el registro: " + err.message });
  }finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.post('/dash/instructor/crearEstudiante', async (req, res) => {
  const { nombre, apellido, fecha_nacimiento, genero, contrasena, id_tutor } = req.body;
  let connection;

  try {
    connection = await db.connect();
    const id_user_created = await db.createEstudiante(
      connection, 
      nombre, 
      apellido, 
      fecha_nacimiento, 
      genero, 
      contrasena, 
      id_tutor
    );

    res.status(200).json({
      message: "Registro exitoso",
      id: id_user_created,
    });

  } catch (err) {
    res.status(500).json({
      error: "No se pudo completar el registro: " + err.message
    });
  }finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.post('/juego/addCombate', async (req, res) => {
  const { idEstudiante, idNPC, preguntasHechas, aciertos, duracion, fecha_combate, dificultad } = req.body;
  let connection;

  try {
    connection = await db.connect();
    const idCombate = await db.addCombate(connection, idEstudiante, idNPC, preguntasHechas, aciertos, duracion, fecha_combate, dificultad);
    res.status(200).json({
      message: "Registro exitoso",
      id: idCombate
    });
  } catch (err) {
    res.status(500).json({ error: "No se pudo completar el registro: " + err.message });
  }finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.post('/juego/updateMonedas', async (req, res) => {
  const { idEstudiante, nuevoNumeroMonedas } = req.body;
  let connection;

  try {
    connection = await db.connect();
     await db.updateMonedas(connection, idEstudiante, nuevoNumeroMonedas);
    res.status(200).json({
      message: "Registro exitoso",
    });
  } catch (err) {
    res.status(500).json({ error: "No se pudo completar el registro: " + err.message });
  }finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.post('/juego/updatePuerta', async (req, res) => {
  const { idEstudiante, idPuerta } = req.body;
  let connection;

  try {
    connection = await db.connect();
    await db.updatePuerta(connection, idEstudiante, idPuerta);
    res.status(200).json({
      message: "Registro exitoso",
    });
  } catch (err) {
    res.status(500).json({ error: "No se pudo completar el registro: " + err.message });
  }finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.put('/dash/instructor/asignarEstudiante', async (req, res) => {
  let { idEstudiante, idInstructor } = req.body;
  let connection;

  if(!idInstructor) idInstructor = null;
  try { 
    connection = await db.connect();
    await db.asignarEstudianteInstructor(connection, idEstudiante, idInstructor);
    res.status(200).json({message : "Se le asigno a: " + idEstudiante + ", el instructor: " + idInstructor})
  } catch(err){
    res.status(500).json({error : "Error al asignar instructor " + err.message })
  }finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.post('/dash/instructor', async (req, res) => {
  const { id_instructor } = req.body;
  let connection;

  try {
    connection = await db.connect();
    const arrEstadisticas = await db.getEstadisticasEstudiantes(connection, id_instructor);
    res.status(200).json(arrEstadisticas);
  } catch (err) {
    res.status(500).json({ error: "No se pudo completar el registro: " + err.message });
  }finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.put('/dash/instructor/cambiarDificultad', async (req, res) => {
  const { dificultad, idEstudiante } = req.body;
  let connection;

  try {
    connection = await db.connect();
    await db.cambiarDificultad(connection, dificultad, idEstudiante);
    res.status(200).json({message : "Dificultad cambiada con éxito"});
  } catch(err){
    res.status(500).json({error: "No se puedo cambiar la dificultad" + err.message});
  }finally {
    if (connection) {
      await connection.end();
    }
  }
})

app.get('/dash/instructor/getEstudiantesParaAsignar', async (req, res) => {
  let connection;
  
  try{
    connection = await db.connect();
    const datos = await db.getEstudiantesParaAsignar(connection);
    res.status(200).json(datos);
  } catch(err){
    res.status(500).json({error: "No se puedieron obtener los estudiantes: " + err.message})
  }finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.get('/dash/admin', async (req, res) => {
  let connection;
  try {
    connection = await db.connect();
    const dashboardData = await db.getAdminDashboard(connection);
    res.status(200).json(dashboardData);
  } catch (err) {
    res.status(500).json({ error: "Error al cargar dashboard: " + err.message });
  } finally {
    if (connection) await connection.end();
  }
});

app.get('/dash/admin/usuariosPorAutorizar', async (req, res) => {
  let connection;
  try {
    connection = await db.connect();
    const solicitudes = await db.getUsuariosPorAutorizacion(connection, 0);
    res.status(200).json(solicitudes);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener solicitudes: " + err.message });
  } finally {
    if (connection) await connection.end();
  }
});

app.put('/dash/admin/aprobarSolicitud', async (req, res) => {
  const { userId, accepted } = req.body;
  let connection;
  try {
    connection = await db.connect();
    await db.aceptarSolicitudUsuario(connection, userId, accepted);
    res.status(200).json(true);
  } catch (err) {
    res.status(500).json({ error: "Error al resolver solicitud: " + err.message });
  } finally {
    if (connection) await connection.end();
  }
});

app.get('/dash/admin/usuariosAutorizados', async (req, res) => {
  let connection;
  try {
    connection = await db.connect();
    const usuarios = await db.getUsuariosPorAutorizacion(connection, 1);
    res.status(200).json(usuarios);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener usuarios: " + err.message });
  } finally {
    if (connection) await connection.end();
  }
});

app.put('/dash/admin/eliminarUsuario', async (req, res) => {
  const { userId } = req.body; 
  let connection;
  try {
    connection = await db.connect();
    await db.eliminarUsuario(connection, userId);
    res.status(200).json(true);
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar usuario: " + err.message });
  } finally {
    if (connection) await connection.end();
  }
});

if (process.env.AWS_LAMBDA_FUNCTION_NAME === undefined) {
  app.listen(port, () => {
    console.log(`Server listening at http://localhost::8080`);
  });
}
export default app;