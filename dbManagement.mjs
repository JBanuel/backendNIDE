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
    static async createEstudiante(connection, nombre, apellido, fecha_nacimiento, genero, contrasena, id_tutor) {

        try {
            const hash = await bcrypt.hash(contrasena, 7);

            const [rows] = await connection.execute('CALL sp_registrar_estudiante(?, ?, ?, ?, ?, ?)', [hash, nombre, apellido, fecha_nacimiento, genero, id_tutor]);

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
            WHERE u.correo = ? AND r.rol = ? AND u.autorizacion = true`;

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

    static async getEstadisticasEstudiantesInstructor(connection, idInstructor) {
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

    static async getEstadisticasEstudiantesTutor(connection, id_tutor) {
        let query = 'CALL sp_obtener_dashboard_tutor(?)';

        try {
            const [results] = await connection.execute(query, [id_tutor]);

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

    static async cambiarDificultad(connection, dificultad, idEstudiante) {
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

    static async updateMonedas(connection, idEstudiante, nuevoNumeroMonedas){
        let query = 'UPDATE Estudiante SET monedas = ? WHERE id = ?';
        try{
            await connection.execute(query, [nuevoNumeroMonedas, idEstudiante]);
            return;
        } catch(err){
            throw err;
        }
    }

    static async updatePuerta(connection, idEstudiante, idPuerta){
        let query = 'UPDATE Puertas_estudiante SET esta_abierta = 1 WHERE id_puerta = ? AND id_estudiante = ?';
        try{
            await connection.execute(query, [idPuerta, idEstudiante]);
            return;
        }catch(err){
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

    static async getAdminDashboard(connection) {
    try {
        const queryTotales = `
            SELECT 
                (SELECT COUNT(*) FROM Usuario u JOIN Usuario_Rol ur ON u.id = ur.id_usuario JOIN Rol r ON ur.id_rol = r.id WHERE r.rol = 'Tutor' AND autorizacion=1) as tutorNum,
                (SELECT COUNT(*) FROM Usuario u JOIN Usuario_Rol ur ON u.id = ur.id_usuario JOIN Rol r ON ur.id_rol = r.id WHERE r.rol = 'Administrador' AND autorizacion=1) as adminNum,
                (SELECT COUNT(*) FROM Estudiante) as studentNum,
                (SELECT COUNT(*) FROM Usuario WHERE autorizacion = 0) as requestNum;
        `;
        const [resTotales] = await connection.execute(queryTotales);
        const totales = resTotales[0];

        const [results] = await connection.execute('CALL ObtenerReporteInstructores()');
        
        const listaInstructores = results[0];

        return {
            adminNum: totales.adminNum.toString(),
            tutorNum: totales.tutorNum.toString(),
            StudentNum: totales.studentNum.toString(),
            RequestNum: totales.requestNum.toString(),
            instructors: listaInstructores.map(inst => ({
                name: inst.name,
                gender: inst.gender,
                groupProgress: (inst.groupProgress || 0).toString(),
                groupPrecision: (inst.groupPrecision || 0).toString()
            }))
        };
    } catch (err) {
        console.error("Error en getAdminDashboard con SP:", err.message);
        throw err;
    }
    }

    static async getUsuariosPorAutorizacion(connection, estadoAutorizacion) {
        const query = `
            SELECT 
                u.id, 
                p.genero AS gender, 
                CONCAT(p.nombre, ' ', p.apellido) AS name, 
                r.rol AS role
            FROM Usuario u
            JOIN Persona p ON u.id = p.id
            JOIN Usuario_Rol ur ON u.id = ur.id_usuario
            JOIN Rol r ON ur.id_rol = r.id
            WHERE u.autorizacion = ?;
        `;
        try {
            const [rows] = await connection.execute(query, [estadoAutorizacion]);
            return rows; 
        } catch (err) {
            console.error("Error al obtener usuarios por autorización:", err.message);
            throw err;
        }
    }

    static async aceptarSolicitudUsuario(connection, userId, accepted) {
        try {
            if (accepted === "true" || accepted === true) {
                const query = 'UPDATE Usuario SET autorizacion = 1 WHERE id = ?';
                await connection.execute(query, [userId]);
            } else {
                const query = 'DELETE FROM Usuario WHERE id = ?';
                await connection.execute(query, [userId]);
            }
            return true;
        } catch (err) {
            console.error("Error al resolver solicitud:", err.message);
            throw err;
        }
    }

    static async eliminarUsuario(connection, userId) {
        try {
            const query = 'CALL sp_eliminar_usuario(?);';
            await connection.execute(query, [userId]);
            return true;
        } catch (err) {
            console.error("Error al eliminar usuario:", err.message);
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