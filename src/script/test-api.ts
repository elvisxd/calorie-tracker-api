import httpClient from "../utils/http-client";

// Función para esperar un tiempo determinado
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Función para probar la API de usuarios
const testUsersAPI = async () => {
  try {
    console.log("=== INICIANDO PRUEBAS DE API DE USUARIOS ===");

    // Variable para almacenar el ID del usuario creado
    let userId: string;

    // 1. Crear un usuario
    console.log("\n1. Creando un usuario...");
    const createResponse = await httpClient.post("/users", {
      email: `test-${Date.now()}@example.com`,
      password_hash: "password123hash",
      full_name: "Usuario de Prueba API",
    });

    console.log("Usuario creado:", createResponse.data);
    userId = createResponse.data.data.id;

    // Esperar un momento
    await wait(1000);

    // 2. Obtener todos los usuarios
    console.log("\n2. Obteniendo todos los usuarios...");
    const getAllResponse = await httpClient.get("/users");
    console.log(`Se encontraron ${getAllResponse.data.count} usuarios`);

    // Esperar un momento
    await wait(1000);

    // 3. Obtener un usuario por ID
    console.log(`\n3. Obteniendo usuario con ID ${userId}...`);
    const getOneResponse = await httpClient.get(`/users/${userId}`);
    console.log("Usuario encontrado:", getOneResponse.data);

    // Esperar un momento
    await wait(1000);

    // 4. Actualizar un usuario
    console.log(`\n4. Actualizando usuario con ID ${userId}...`);
    const updateResponse = await httpClient.put(`/users/${userId}`, {
      full_name: "Nombre Actualizado desde API",
    });
    console.log("Usuario actualizado:", updateResponse.data);

    // Esperar un momento
    await wait(1000);

    // 5. Eliminar un usuario
    console.log(`\n5. Eliminando usuario con ID ${userId}...`);
    const deleteResponse = await httpClient.delete(`/users/${userId}`);
    console.log("Respuesta de eliminación:", deleteResponse.data);

    // Esperar un momento
    await wait(1000);

    // 6. Verificar que el usuario fue eliminado
    console.log(
      `\n6. Verificando que el usuario con ID ${userId} fue eliminado...`
    );
    try {
      await httpClient.get(`/users/${userId}`);
    } catch (error: any) {
      console.log("Error esperado:", error.response?.data);
    }

    console.log("\n=== PRUEBAS DE API COMPLETADAS EXITOSAMENTE ===");
  } catch (error: any) {
    console.error(
      "Error en las pruebas de API:",
      error.response?.data || error.message
    );
  }
};

// Ejecutar las pruebas
testUsersAPI();
