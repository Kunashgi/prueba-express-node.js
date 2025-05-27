
# Task Manager API (con WebSocket)

## Configuración del entorno

1. Clona el repositorio.

    git clone <url-del-repositorio>
    cd todo-api-websockets

2. Instala las dependencias:

   ```
   npm install
   ```

## Ejecutar la aplicación

Ejecuta el servidor con:

```
npm start
```

Por defecto, el servidor quedará disponible en:

```
http://localhost:3000
```

---

## Decisiones de diseño y consideraciones

- Base de datos **SQLite** para persistencia local sin dependencias externas.
- Comunicación en tiempo real con **WebSocket** (Socket.IO) para actualizar tareas al instante.
- API RESTful sencilla: permite crear, listar, actualizar y eliminar tareas.
- Validación básica de datos (longitud máxima, tipo de datos) para evitar errores comunes.

---

## Probar la funcionalidad WebSocket

1. Usa herramientas como **Postman** o **curl** para hacer peticiones HTTP (`POST`, `PUT`, `DELETE`) a la API (`/tasks`).
2. Conéctate al WebSocket usando:

   ```
   ws://localhost:3000
   ```

   Puedes usar herramientas como **WebSocket King** o **websocat**.
3. Escucha los siguientes eventos en tiempo real:
   - `newTask` (cuando se crea una tarea)
   - `taskUpdated` (cuando se actualiza una tarea)
   - `taskDeleted` (cuando se elimina una tarea)
