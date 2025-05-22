import fs from "fs";

// Crear la estructura de directorios si no existe
const directories = [
  "src",
  "src/config",
  "src/controllers",
  "src/routes",
  "src/types",
  "src/middleware",
  "src/utils",
];

directories.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Directorio creado: ${dir}`);
  } else {
    console.log(`El directorio ${dir} ya existe`);
  }
});
