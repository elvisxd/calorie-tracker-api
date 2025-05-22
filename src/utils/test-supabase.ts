import { supabase, testConnection } from "../config/supabase";

const runTest = async () => {
  try {
    console.log("Probando conexión a Supabase...");

    const isConnected = await testConnection();

    if (isConnected) {
      // Intentar obtener información sobre las tablas
      console.log("Verificando tablas existentes...");

      // Verificar si la tabla users existe
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id")
        .limit(1);

      if (usersError) {
        console.log("Error al consultar la tabla users:", usersError.message);
      } else {
        console.log("Tabla users encontrada y accesible");
      }

      // Verificar si la tabla posts existe
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("id")
        .limit(1);

      if (postsError) {
        console.log("Error al consultar la tabla posts:", postsError.message);
      } else {
        console.log("Tabla posts encontrada y accesible");
      }

      // Verificar si la tabla comments existe
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select("id")
        .limit(1);

      if (commentsError) {
        console.log(
          "Error al consultar la tabla comments:",
          commentsError.message
        );
      } else {
        console.log("Tabla comments encontrada y accesible");
      }

      // Verificar si la tabla profiles existe
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id")
        .limit(1);

      if (profilesError) {
        console.log(
          "Error al consultar la tabla profiles:",
          profilesError.message
        );
      } else {
        console.log("Tabla profiles encontrada y accesible");
      }
    }
  } catch (error: any) {
    console.error("Error en la prueba:", error.message);
  }
};

runTest();
