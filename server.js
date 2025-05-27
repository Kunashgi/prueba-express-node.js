const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { dbOperations } = require('./database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para validar tareas
const validateTask = (req, res, next) => {
  const { titulo, descripcion } = req.body;
  
  if (!titulo || typeof titulo !== 'string' || titulo.trim().length === 0) {
    return res.status(400).json({ 
      error: 'El título es obligatorio y debe ser una cadena de texto válida' 
    });
  }
  
  if (titulo.length > 100) {
    return res.status(400).json({ 
      error: 'El título no puede exceder los 100 caracteres' 
    });
  }
  
  if (descripcion && typeof descripcion !== 'string') {
    return res.status(400).json({ 
      error: 'La descripción debe ser una cadena de texto' 
    });
  }
  
  if (descripcion && descripcion.length > 500) {
    return res.status(400).json({ 
      error: 'La descripción no puede exceder los 500 caracteres' 
    });
  }
  
  next();
};

// RUTAS DE LA API

// GET /tasks - Obtener todas las tareas
app.get('/tasks', async (req, res) => {
  try {
    console.log('📋 Obteniendo todas las tareas...');
    const tasks = await dbOperations.getAllTasks();
    res.json({
      success: true,
      data: tasks
    });
    console.log(`✅ Se obtuvieron ${tasks.length} tareas`);
  } catch (error) {
    console.error('❌ Error al obtener tareas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /tasks - Crear una nueva tarea
app.post('/tasks', validateTask, async (req, res) => {
  try {
    const { titulo, descripcion } = req.body;
    console.log('➕ Creando nueva tarea:', titulo);
    
    const newTask = await dbOperations.createTask(titulo.trim(), descripcion?.trim() || '');
    
    // 📡 Emitir evento WebSocket a todos los clientes conectados
    io.emit('newTask', newTask);
    console.log('📡 Evento newTask emitido a todos los clientes');
    
    res.status(201).json({
      success: true,
      data: newTask,
      message: 'Tarea creada exitosamente'
    });
    console.log('✅ Tarea creada con ID:', newTask.id);
  } catch (error) {
    console.error('❌ Error al crear tarea:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /tasks/:id - Actualizar el estado de una tarea
app.put('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`🔄 Actualizando tarea ${id} a estado: ${status}`);
    
    if (!status || typeof status !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'El status es obligatorio y debe ser una cadena de texto'
      });
    }
    
    const taskId = parseInt(id);
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de tarea inválido'
      });
    }
    
    const updatedTask = await dbOperations.updateTaskStatus(taskId, status.trim());
    
    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        error: 'Tarea no encontrada'
      });
    }
    
    // 📡 Emitir evento WebSocket a todos los clientes conectados
    io.emit('taskUpdated', {
      id: updatedTask.id,
      status: updatedTask.status,
      fechaActualizacion: updatedTask.fechaActualizacion
    });
    console.log('📡 Evento taskUpdated emitido a todos los clientes');
    
    res.json({
      success: true,
      data: updatedTask,
      message: 'Tarea actualizada exitosamente'
    });
    console.log('✅ Tarea actualizada exitosamente');
  } catch (error) {
    console.error('❌ Error al actualizar tarea:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /tasks/:id - Eliminar una tarea
app.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const taskId = parseInt(id);
    
    console.log(`🗑️ Eliminando tarea ${taskId}`);
    
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de tarea inválido'
      });
    }
    
    const deleted = await dbOperations.deleteTask(taskId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Tarea no encontrada'
      });
    }
    
    // 📡 Emitir evento WebSocket a todos los clientes conectados
    io.emit('taskDeleted', { id: taskId });
    console.log('📡 Evento taskDeleted emitido a todos los clientes');
    
    res.json({
      success: true,
      message: 'Tarea eliminada exitosamente'
    });
    console.log('✅ Tarea eliminada exitosamente');
  } catch (error) {
    console.error('❌ Error al eliminar tarea:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Ruta para servir la página de prueba
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado'
  });
});

// WEBSOCKET CONNECTION HANDLING
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 Cliente desconectado:', socket.id);
  });
});

//  INICIAR EL SERVIDOR
server.listen(PORT, () => {
  console.log('🚀 ================================');
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`🔌 WebSocket disponible en ws://localhost:${PORT}`);
  console.log('🚀 ================================');
});