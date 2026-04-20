import { jest } from '@jest/globals';
import bcrypt from 'bcrypt';
import dbManagement from './dbManagement.mjs';

describe('dbManagement', () => {
  let mockConnection;

  beforeEach(() => {
    mockConnection = {
      execute: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('loginUser', () => {
    it('debería retornar el usuario sin contraseña si las credenciales son correctas', async () => {
      const mockDbRow = [{
        id: 1,
        correo: 'test@kidplays.com',
        contrasena: 'hashed_password',
        nombre_rol: 'Admin'
      }];
      mockConnection.execute.mockResolvedValue([mockDbRow]);

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await dbManagement.loginUser(mockConnection, 'test@kidplays.com', '123456', 'Admin');

      expect(result).toHaveProperty('id', 1);
      expect(result).not.toHaveProperty('contrasena');
      expect(mockConnection.execute).toHaveBeenCalledTimes(1);
    });

    it('debería lanzar un error si el usuario no existe', async () => {
      mockConnection.execute.mockResolvedValue([[]]);

      await expect(dbManagement.loginUser(mockConnection, 'fake@correo.com', '123', 'Admin'))
        .rejects.toThrow('Usuario no encontrado');
    });

    it('debería lanzar un error si la contraseña es incorrecta', async () => {
      const mockDbRow = [{ id: 1, correo: 'test@kidplays.com', contrasena: 'hash', nombre_rol: 'Admin' }];
      mockConnection.execute.mockResolvedValue([mockDbRow]);
      
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(dbManagement.loginUser(mockConnection, 'test@kidplays.com', 'wrongpass', 'Admin'))
        .rejects.toThrow('Contraseña incorrecta');
    });
  });

  describe('createUser', () => {
    it('debería crear un usuario y retornar su ID', async () => {
      mockConnection.execute.mockResolvedValueOnce([[{ id: 2 }]]);
      mockConnection.execute.mockResolvedValueOnce([{ insertId: 10 }]);
      mockConnection.execute.mockResolvedValueOnce([]);
      mockConnection.execute.mockResolvedValueOnce([]);

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_pass');

      const id = await dbManagement.createUser(
        mockConnection, 'Juan', 'Perez', '2000-01-01', 'M', 'juan@test.com', 'pass', 'Padre'
      );

      expect(id).toBe(10);
      expect(mockConnection.execute).toHaveBeenCalledTimes(4); // 4 queries ejecutadas
    });

    it('debería lanzar un error si el rol no existe', async () => {
      mockConnection.execute.mockResolvedValueOnce([[]]);

      await expect(dbManagement.createUser(
        mockConnection, 'Juan', 'Perez', '2000-01-01', 'M', 'juan@test.com', 'pass', 'RolInexistente'
      )).rejects.toThrow('El rol especificado no existe');
    });
  });
});