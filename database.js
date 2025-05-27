const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Crear la base de datos SQLite
const db = new sqlite3.Database(path.join(__dirname, 'tasks.db'), (err) => {
  if (err) {
    console.error('❌ Error al conectar con la base de datos:', err.message);
  } else {
    console.log('✅ Conectado a la base de datos SQLite.');
  }
});

// Crear la tabla de tareas
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    status TEXT DEFAULT 'pendiente',
    fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fechaActualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('❌ Error creando tabla:', err);
    } else {
      console.log('✅ Tabla de tareas lista.');
    }
  });
});

// Funciones para interactuar con la base de datos
const dbOperations = {
  // Crear una nueva tarea
  createTask: (titulo, descripcion = '') => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO tasks (titulo, descripcion) 
        VALUES (?, ?)
      `);
      
      stmt.run([titulo, descripcion], function(err) {
        if (err) {
          reject(err);
        } else {
          // Obtener la tarea recién creada
          db.get(
            'SELECT * FROM tasks WHERE id = ?', 
            [this.lastID], 
            (err, row) => {
              if (err) {
                reject(err);
              } else {
                resolve(row);
              }
            }
          );
        }
      });
      
      stmt.finalize();
    });
  },

  // Obtener todas las tareas
  getAllTasks: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM tasks ORDER BY fechaCreacion DESC', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },

  // Obtener una tarea por ID
  getTaskById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  // Actualizar el estado de una tarea
  updateTaskStatus: (id, status) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE tasks 
         SET status = ?, fechaActualizacion = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [status, id],
        function(err) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            resolve(null); // No se encontró la tarea
          } else {
            // Obtener la tarea actualizada
            db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
              if (err) {
                reject(err);
              } else {
                resolve(row);
              }
            });
          }
        }
      );
    });
  },

  // Eliminar una tarea
  deleteTask: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }
};

module.exports = { db, dbOperations };