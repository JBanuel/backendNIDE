import request from 'supertest';
import { jest } from '@jest/globals';
import app from './app.mjs'; 
import db from './dbManagement.mjs';

describe('API Endpoints (app.mjs)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /login', () => {
    it('debería retornar 200 y los datos del usuario en un login exitoso', async () => {
      const mockUser = { id: 1, correo: 'test@kidplays.com', nombre_rol: 'Padre' };
      
      jest.spyOn(db, 'loginUser').mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@kidplays.com',
          password: 'password123',
          nombreRol: 'Padre'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
    });

    it('debería retornar 401 si falla la autenticación', async () => {
      jest.spyOn(db, 'loginUser').mockRejectedValue(new Error('Contraseña incorrecta'));

      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@kidplays.com',
          password: 'wrong',
          nombreRol: 'Padre'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Contraseña incorrecta');
    });
  });

  describe('POST /register', () => {
    it('debería retornar 200 y el ID tras un registro exitoso', async () => {
      jest.spyOn(db, 'createUser').mockResolvedValue(5);

      const response = await request(app)
        .post('/register')
        .send({
          nombre: 'Ana',
          apellido: 'Lopez',
          fecha_nacimiento: '1995-05-05',
          genero: 'F',
          correo: 'ana@test.com',
          contrasena: '123456',
          nombreRol: 'Profesor'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Registro exitoso');
      expect(response.body.id).toBe(5);
    });

    it('debería retornar 500 si hay un error en la base de datos durante el registro', async () => {
      jest.spyOn(db, 'createUser').mockRejectedValue(new Error('Error interno'));

      const response = await request(app)
        .post('/register')
        .send({
          correo: 'ana@test.com',
          contrasena: '123456',
          nombreRol: 'Profesor'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('No se pudo completar el registro: Error interno');
    });
  });
});