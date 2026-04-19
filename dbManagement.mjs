import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import config from './config.mjs';

export default class dbManagement {
    static async createUser(connection, nombre, apellido, fecha_nacimiento, genero, correo, contrasena, nombreRol) {
    try {
        // se puede usar el siguiente codigo para validar si ya existe un usuario con ese correo
        // const queryCheck = 'SELECT id FROM Usuario WHERE correo = ?';
        // const [existingUsers] = await connection.execute(queryCheck, [correo]);

        // if (existingUsers.length > 0) throw new Error('El correo ya está registrado en el sistema');

        const [roles] = await connection.execute('SELECT id FROM Rol WHERE rol = ?', [nombreRol]);
        if (roles.length === 0) throw new Error('El rol especificado no existe');
        const idRol = roles[0].id;

        const hash = await bcrypt.hash(contrasena, 7);

        const queryUsuario = 'INSERT INTO Usuario (correo, contrasena, autorizacion) VALUES (?, ?, 1)';
        const [resUsuario] = await connection.execute(queryUsuario, [correo, hash]);
        const idUsuario = resUsuario.insertId;

        const queryPersona = 'INSERT INTO Persona (id, nombre, apellido, fecha_nacimiento, genero) VALUES (?, ?, ?, ?, ?)';
        await connection.execute(queryPersona, [idUsuario, nombre, apellido, fecha_nacimiento, genero]);

        const queryRelacion = 'INSERT INTO Usuario_Rol (id_usuario, id_rol) VALUES (?, ?)';
        await connection.execute(queryRelacion, [idUsuario, idRol]);

        return idUsuario;
    } catch (err) {
        console.error("Error al crear el usuario:", err.message);
        throw err;
    }
}

    static async loginUser(connection, correo, contrasena) {
        const query = `
            SELECT u.id, u.correo, u.contrasena, r.rol as nombre_rol 
            FROM Usuario u
            JOIN Usuario_Rol ur ON u.id = ur.id_usuario
            JOIN Rol r ON ur.id_rol = r.id
            WHERE u.correo = ?`;
        
        try {
            const [rows] = await connection.execute(query, [correo]);
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

    static async connect() {
        return await mysql.createConnection({
            host: config.HOST,
            user: config.USER,
            password: config.PASSWORD,
            database: config.DATABASE
        });
    }
}