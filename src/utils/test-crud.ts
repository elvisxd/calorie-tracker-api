import axios from "axios";

const API_URL = "http://localhost:3000/api";
let userId: string;

const testCRUD = async () => {
  try {
    console.log("Iniciando pruebas CRUD de usuarios...");

    // 1. Crear un usuario
    console.log("\n1. Creando un usuario...");
    const createResponse = await axios.post(`${API_URL}/users`, {
      email: `test-${Date.now()}@example.com`,
      password_hash: "password123hash",
      full_name: "Usuario de Prueba",
    });

    console.log("Usuario creado:", createResponse.data);
    userId = createResponse.data.data.id;

    // 2. Obtener todos los usuarios
    console.log("\n2. Obteniendo todos los usuarios...");
    const getAllResponse = await axios.get(`${API_URL}/users`);
    console.log(`Se encontraron ${getAllResponse.data.count} usuarios`);

    // 3. Obtener un usuario por ID
    console.log(`\n3. Obteniendo usuario con ID ${userId}...`);
    const getOneResponse = await axios.get(`${API_URL}/users/${userId}`);
    console.log("Usuario encontrado:", getOneResponse.data);

    // 4. Actualizar un usuario
    console.log(`\n4. Actualizando usuario con ID ${userId}...`);
    const updateResponse = await axios.put(`${API_URL}/users/${userId}`, {
      full_name: "Nombre Actualizado",
    });
    console.log("Usuario actualizado:", updateResponse.data);

    // 5. Eliminar un usuario
    console.log(`\n5. Eliminando usuario con ID ${userId}...`);
    const deleteResponse = await axios.delete(`${API_URL}/users/${userId}`);
    console.log("Respuesta de eliminación:", deleteResponse.data);

    // 6. Verificar que el usuario fue eliminado
    console.log(
      `\n6. Verificando que el usuario con ID ${userId} fue eliminado...`
    );
    try {
      await axios.get(`${API_URL}/users/${userId}`);
    } catch (error: any) {
      console.log("Error esperado:", error.response.data);
    }

    console.log("\nPruebas CRUD completadas exitosamente!");
  } catch (error: any) {
    console.error(
      "Error en las pruebas CRUD:",
      error.response?.data || error.message
    );
  }
};

// Ejecutar las pruebas
testCRUD();
