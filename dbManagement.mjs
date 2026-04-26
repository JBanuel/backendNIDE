import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import config from './config.mjs';

export default class dbManagement {
    static async createUser(connection, nombre, apellido, fecha_nacimiento, genero, correo, contrasena, nombreRol) {
        try {
            const hash = await bcrypt.hash(contrasena, 7);

            const [rows] = await connection.execute('CALL sp_registrar_usuario(?, ?, ?, ?, ?, ?, ?)', [correo, hash, nombreRol, nombre, apellido, fecha_nacimiento, genero]);

            const idUsuario = rows[0][0].idUsuario;

            return idUsuario;
        } catch (error) {
            console.error("Error al crear usuario:", error.message);
            throw error;
        }

    }
    static async createEstudiante(connection, nombre, apellido, fecha_nacimiento, genero, correo, contrasena, id_instructor, dificultad) {

        try {
            const hash = await bcrypt.hash(contrasena, 7);

            const [rows] = await connection.execute('CALL sp_registrar_estudiante(?, ?, ?, ?, ?, ?, ?)', [correo, hash, nombre, apellido, fecha_nacimiento, genero, id_instructor, dificultad]);

            const idUsuario = rows[0][0].idUsuario;

            return idUsuario;

        } catch (err) {
            console.error("Error al crear el estudiante:", err.message);
            throw err;
        }
    }

    static async loginUser(connection, correo, contrasena, nombreRol) {
        const query = `
            SELECT u.id, u.correo, u.contrasena, r.rol as nombre_rol 
            FROM Usuario u
            JOIN Usuario_Rol ur ON u.id = ur.id_usuario
            JOIN Rol r ON ur.id_rol = r.id
            WHERE u.correo = ? AND r.rol = ?`;

        try {
            const [rows] = await connection.execute(query, [correo, nombreRol]);
            if (rows.length !== 1) throw new Error('Usuario no encontrado');

            const user = rows[0];
            const isValid = await bcrypt.compare(contrasena, user.contrasena);
            if (!isValid) throw new Error('Contraseña incorrecta');

            const { contrasena: _, ...publicUser } = user;
            return publicUser;
        } catch (err) {
            console.error("Error en login:", err.message);
            throw err;
        }
    }

    static async loginJuego(connection, id, password) {
        try {
            const [results] = await connection.execute('CALL sp_get_datos_login_juego(?)', [id]);

            const rowsEstudiante = results[0];
            const rowsNPCs = results[1];
            const rowsPuertas = results[2];

            if (rowsEstudiante.length === 0) throw new Error('Usuario no encontrado');

            const user = rowsEstudiante[0];

            const isValid = await bcrypt.compare(password, user.contrasena);
            if (!isValid) throw new Error('Contraseña incorrecta');

            const enemigosDerrotados = rowsNPCs.map(npc => ({
                id_npc: npc.id_npc,
                derrotado: npc.derrotado,
                operacion: npc.operacion,
                tipo: npc.tipo,
                nombre: npc.nombre
            }));

            const puertas = rowsPuertas.map(pue => ({
                id_puerta: pue.id_puerta,
                esta_abierta: pue.esta_abierta
            }));

            const { contrasena: _, ...publicUser } = user;

            return {
                ...publicUser,
                enemigosDerrotados,
                puertas
            };

        } catch (err) {
            console.error("Error en loginJuego:", err.message);
            throw err;
        }
    }

    static async addCombate(connection, idEstudiante, idNPC, preguntasHechas, aciertos, duracion, fecha_combate, dificultad) {
        try {
            const query = 'INSERT INTO Combate (id_estudiante, id_npc, num_preguntas, aciertos, segundos, fecha, dificultad) VALUES (?, ?, ?, ?, ?, ?, ?)';
            const [resCombate] = await connection.execute(query, [idEstudiante, idNPC, preguntasHechas, aciertos, duracion, fecha_combate, dificultad]);
            if (aciertos == 5) {
                const queryDerrotado = 'UPDATE Estudiante_NPC_Derrotado SET derrotado = 1 WHERE id_estudiante = ? AND id_npc = ?;';
                const [resDerrotado] = await connection.execute(queryDerrotado, [idEstudiante, idNPC]);
            }
            const idCombate = resCombate.insertId;
            return idCombate;
        } catch (err) {
            console.error("Error en login:", err.message);
            throw err;
        }
    }

    static async getEstadisticasEstudiantes(connection, idInstructor) {
        let query = 'CALL sp_obtener_dashboard_instructor(?)';

        try {
            const [results] = await connection.execute(query, [idInstructor]);

            const totalNPC = results[0][0].npc;
            const listaAlumnos = results[1];
            const todosLosCombates = results[2];

            const response = {
                npcs: totalNPC,
                getStudents: listaAlumnos.map(estudiante => ({
                    id: estudiante.id,
                    name: estudiante.name,
                    gender: estudiante.gender,
                    difficulty: estudiante.difficulty,
                    completedNPCs: estudiante.completedNPCs,
                    history: todosLosCombates
                        .filter(c => c.id_estudiante === estudiante.id)
                        .map(({ id_estudiante, ...resto }) => resto)
                }))
            };

            return response;
        } catch (err) {
            throw err;
        }
    }

    static async cambiarDificultad(connection, idEstudiante, dificultad) {
        let query = 'UPDATE Estudiante SET dificultad = ? WHERE id = ?;';
        try {
            const [resutls] = await connection.execute(query, [dificultad, idEstudiante]);
            return;
        } catch (err) {
            throw err;
        }
    }

    static async asignarEstudianteInstructor(connection, idEstudiante, idInstructor) {
        let query = 'UPDATE Estudiante SET id_instructor = ? WHERE id = ?;';
        if (!idInstructor) idInstructor = null;
        try {

            const [results] = await connection.execute(query, [idInstructor, idEstudiante]);
            return;
        } catch (err) {
            throw err;
        }
    }

    static async getEstudiantesParaAsignar(connection) {
        let query = `SELECT 
        e.id,
        CONCAT(p.nombre, ' ', p.apellido) AS name,
        p.genero,
        e.id_instructor
        FROM Estudiante e
        INNER JOIN Persona p ON e.id = p.id;
        `;
        try {
            const [rows] = await connection.execute(query)
            return rows.map(est => ({ id: est.id, name: est.name, gender: est.genero, upToAdd: !est.id_instructor }))
        } catch (err) {
            throw err;
        }

    }

    static async connect() {
        return await mysql.createConnection({
            host: config.HOST,
            user: config.USER,
            password: config.PASSWORD,
            database: config.DATABASE
        });
    }
}