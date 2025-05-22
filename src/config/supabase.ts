import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

// Obtener las variables de entorno
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verificar que las variables de entorno estén definidas
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Las variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas"
  );
}

// Crear y exportar el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

// Función para verificar la conexión
export const testConnection = async () => {
  try {
    // Forma correcta de contar registros en Supabase
    const { count, error } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (error) {
      throw error;
    }

    console.log("Conexión a Supabase establecida correctamente");
    console.log(`Número de usuarios en la base de datos: ${count}`);
    return true;
  } catch (error) {
    console.error("Error al conectar con Supabase:", error);
    return false;
  }
};
