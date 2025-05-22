import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Las variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const simpleTest = async () => {
  try {
    console.log("Probando conexión a Supabase...");

    // Intentar una consulta simple
    const { data, error } = await supabase.from("users").select("*").limit(5);

    if (error) {
      throw error;
    }

    console.log("Conexión exitosa a Supabase!");
    console.log("Datos obtenidos:", data);
  } catch (error: any) {
    console.error("Error al conectar con Supabase:", error);
  }
};

simpleTest();
