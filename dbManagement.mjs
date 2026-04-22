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
    static async createEstudiante(connection, nombre, apellido, fecha_nacimiento, genero, correo, contrasena, dificultad) {
    //const { correo, contrasena, nombre, apellido, fecha_nacimiento, genero, dificultad } = datos;

    try {
        const hash = await bcrypt.hash(contrasena, 7);

        const [rows] = await connection.execute('CALL sp_registrar_estudiante(?, ?, ?, ?, ?, ?, ?)', [correo, hash, nombre, apellido, fecha_nacimiento, genero, dificultad]);

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

        if (rowsEstudiante.length === 0)  throw new Error('Usuario no encontrado');

        const user = rowsEstudiante[0];

        const isValid = user.contrasena === password; //await bcrypt.compare(password, user.contrasena);
        if (!isValid) throw new Error('Contraseña incorrecta');

        const enemigosDerrotados = rowsNPCs.map(npc => ({id_npc: npc.id_npc, derrotado:npc.derrotado, operacion: npc.operacion, tipo: npc.tipo, nombre: npc.nombre}));

        const { contrasena: _, ...publicUser } = user;
        
        return {...publicUser, enemigosDerrotados };

    } catch (err) {
        console.error("Error en loginJuego:", err.message);
        throw err;
    }
}

    static async addCombate(connection, idEstudiante, idNPC, preguntasHechas, aciertos, duracion, fecha_combate, dificultad) {        
        try {
            const query = 'INSERT INTO Combate (id_estudiante, id_npc, num_preguntas, aciertos, segundos, fecha, dificultad) VALUES (?, ?, ?, ?, ?, ?, ?)';
            const [resCombate] = await connection.execute(query, [idEstudiante, idNPC, preguntasHechas, aciertos, duracion, fecha_combate, dificultad]);
            const idCombate = resCombate.insertId;
            return idCombate;
        } catch (err) {
            console.error("Error en login:", err.message);
            throw err;
        }
    }

    static async getEstadisticasEstudiantes(connection, idInstructor) {        
        try {
            const query = `
                SELECT 
                    p.nombre, 
                    p.apellido, 
                    es.monedas,
                    COALESCE(SUM(co.num_preguntas), 0) AS total_preguntas,
                    COALESCE(SUM(co.aciertos), 0) AS total_aciertos,
                    COALESCE(SUM(co.segundos), 0) AS total_segundos,
                    IF(SUM(co.num_preguntas) > 0, 
                    ROUND((SUM(co.aciertos) * 100) / SUM(co.num_preguntas), 2), 
                    0) AS porcentaje_exito
                FROM Estudiante es
                INNER JOIN Persona p ON es.id = p.id
                LEFT JOIN Combate co ON es.id = co.id_estudiante
                WHERE es.id_instructor = ?
                GROUP BY es.id, p.nombre, p.apellido, es.monedas
                ORDER BY porcentaje_exito DESC;
            `;
            const [rowsEstadisticas] = await connection.execute(query, [idInstructor]);
            return rowsEstadisticas;
        } catch (err) {
            console.error("Error en login:", err.message);
            throw err;
        }
    }
    
    static async getAllUnauthorized(){
        //const id, name, role, auth
        const query = `SELET id name role auth
        FROM Usuario us
        LEFT JOIN  Usuario_Rol.id_usuario = us.id
        `
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