import { exec } from "child_process";
import dotenv from "dotenv";

dotenv.config();

const runCommand = (command: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error ejecutando comando: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`Error en stderr: ${stderr}`);
      }
      resolve(stdout);
    });
  });
};

const startServer = async () => {
  try {
    console.log("Compilando TypeScript...");
    await runCommand("npx tsc");

    console.log("Iniciando servidor...");
    const serverProcess = exec("node dist/index.js");

    serverProcess.stdout?.on("data", (data) => {
      console.log(data.toString().trim());
    });

    serverProcess.stderr?.on("data", (data) => {
      console.error(data.toString().trim());
    });

    process.on("SIGINT", () => {
      console.log("Deteniendo servidor...");
      serverProcess.kill();
      process.exit(0);
    });
  } catch (error) {
    console.error("Error al iniciar el servidor:", error);
  }
};

startServer();
