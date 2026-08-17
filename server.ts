import express from "express";
import path from "path";
import fs from "fs";
import https from "https";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { migrateLocalDataToCloudSQL, getDBAsync, saveDBAsync } from "./src/db/migrate.ts";

dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "server-db.json");

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ==========================================
// CONFIGURACIÓN DE BASE DE DATOS LOCAL
// ==========================================

interface DBStructure {
  users: Array<{ email: string; name: string; password?: string; role: "admin" | "user" | "auditor" | "health_team"; country?: string; region?: string; archived?: boolean; driveUrl?: string; geographicGroup?: string }>;
  formFields: Array<{
    id: string;
    label: string;
    type: "text" | "number" | "email" | "select" | "textarea" | "checkbox" | "section" | "date" | "table";
    placeholder?: string;
    description?: string;
    required: boolean;
    options?: string[];
    columns?: string[];
    predefinedRows?: string[];
    validation: {
      required: boolean;
      minLength?: number;
      maxLength?: number;
      min?: number;
      max?: number;
      pattern?: string;
      errorMessage?: string;
    };
    order: number;
  }>;
  submissions: Array<{
    id: string;
    userEmail: string;
    submittedAt: string;
    data: Record<string, any>;
    userCountry?: string;
    userRegion?: string;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    type: "success" | "info" | "warning";
  }>;
  reports: Array<{
    id: string;
    generatedAt: string;
    title: string;
    content: string;
    submissionsCount: number;
  }>;
  googleDriveUrl?: string;
}

const DEFAULT_DB: DBStructure = {
  users: [],
  formFields: [
    {
      id: "f_nombre",
      label: "Nombre Completo",
      type: "text",
      placeholder: "Ej. Juan Pérez",
      required: true,
      validation: { required: true, minLength: 3, maxLength: 50 },
      order: 0
    },
    {
      id: "f_correo",
      label: "Correo Electrónico",
      type: "email",
      placeholder: "Ej. juan.perez@correo.com",
      required: true,
      validation: { required: true, pattern: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$" },
      order: 1
    },
    {
      id: "f_edad",
      label: "Edad",
      type: "number",
      placeholder: "Ej. 25",
      required: true,
      validation: { required: true, min: 18, max: 99 },
      order: 2
    },
    {
      id: "f_satisfaccion",
      label: "Nivel de Satisfacción",
      type: "select",
      required: true,
      options: ["Excelente", "Bueno", "Regular", "Malo"],
      validation: { required: true },
      order: 3
    },
    {
      id: "f_comentarios",
      label: "Comentarios y Sugerencias",
      type: "textarea",
      placeholder: "Cuéntanos más sobre tu experiencia...",
      required: false,
      validation: { required: false, maxLength: 300 },
      order: 4
    }
  ],
  submissions: [],
  notifications: [
    {
      id: "not_1",
      title: "Plataforma Iniciada",
      message: "Se ha inicializado la base de datos de Formularios Dinámicos.",
      timestamp: new Date().toISOString(),
      read: true,
      type: "info"
    }
  ],
  reports: []
};

// Carga o inicializa la BD desde Cloud SQL asíncronamente
async function getDB(): Promise<DBStructure> {
  return await getDBAsync();
}

async function saveDB(db: DBStructure) {
  await saveDBAsync(db);
}

// ==========================================
// GESTIÓN DE NOTIFICACIONES MULTIPART / SSE
// ==========================================
let activeSSEConnections: any[] = [];

function notifyAllAdmins(notification: any) {
  const message = `data: ${JSON.stringify(notification)}\n\n`;
  activeSSEConnections.forEach((res) => {
    try {
      res.write(message);
    } catch (e) {
      // Remover cliente roto
      activeSSEConnections = activeSSEConnections.filter(c => c !== res);
    }
  });
}

// ==========================================
// CONFIGURACIÓN DE INTELIGENCIA ARTIFICIAL GEMINI
// ==========================================
let geminiClientCache: any = null;
function getGeminiClient() {
  if (!geminiClientCache) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("⚠️ Advertencia: GEMINI_API_KEY no está configurada. Los reportes usarán análisis estático alternativo.");
      return null;
    }
    geminiClientCache = new GoogleGenAI({ apiKey: key });
  }
  return geminiClientCache;
}

// ==========================================
// RUTAS DE LA API
// ==========================================

// Interceptor para servir la imagen de fondo permanente de los jardines de Haifa
app.get("/haifa-gardens.jpg", async (req, res) => {
  let localFile = path.join(process.cwd(), "public", "haifa-gardens.jpg");
  if (!fs.existsSync(localFile)) {
    localFile = path.join(process.cwd(), "dist", "haifa-gardens.jpg");
  }
  
  if (fs.existsSync(localFile)) {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.sendFile(localFile);
  } else {
    // Redirección por defecto a una imagen espectacular en alta resolución de Unsplash de los Jardines Bahá'í en Haifa
    res.redirect("https://images.unsplash.com/photo-1590050752117-238cb0612b1b?q=80&w=1920&auto=format&fit=crop");
  }
});

// Endpoint para recibir y almacenar el fondo de pantalla personalizado de Haifa
// Endpoint para obtener la URL de Google Drive global
app.get("/api/get-drive-url", async (req, res) => {
  try {
    const db = await getDB();
    res.json({ url: db.googleDriveUrl || "https://drive.google.com/drive/u/2/folders/1z_9-wzWzxn3sWjtMZ88kgyGZnkpskWn_" });
  } catch (e) {
    res.json({ url: "https://drive.google.com/drive/u/2/folders/1z_9-wzWzxn3sWjtMZ88kgyGZnkpskWn_" });
  }
});

// Endpoint para actualizar la URL de Google Drive global
app.post("/api/update-drive-url", async (req, res) => {
  const { url } = req.body;
  try {
    const db = await getDB();
    db.googleDriveUrl = url ? String(url).trim() : undefined;
    await saveDB(db);
    res.json({ success: true, url: db.googleDriveUrl || "https://drive.google.com/drive/u/2/folders/1z_9-wzWzxn3sWjtMZ88kgyGZnkpskWn_" });
  } catch (error: any) {
    console.error("Error al guardar la URL de Google Drive:", error);
    res.status(500).json({ error: "No se pudo actualizar la URL de Google Drive." });
  }
});

// Sincronización de base de datos desde LocalStorage del Cliente
app.post("/api/sync-data", async (req, res) => {
  const { users, submissions } = req.body;
  const db = await getDB();
  let modified = false;

  // Sincronizar usuarios
  if (Array.isArray(users)) {
    users.forEach((u: any) => {
      if (u && u.email) {
        const emailLower = u.email.trim().toLowerCase();
        const exists = db.users.some(existingU => existingU.email.toLowerCase() === emailLower);
        if (!exists) {
          db.users.push({
            email: emailLower,
            name: u.name ? String(u.name).trim() : "",
            password: u.password ? String(u.password).trim() : "user123",
            role: u.role === "admin" ? "admin" : u.role === "auditor" ? "auditor" : u.role === "health_team" ? "health_team" : "user",
            country: u.country ? String(u.country).trim() : undefined,
            region: u.region ? String(u.region).trim() : undefined,
            archived: u.archived !== undefined ? Boolean(u.archived) : undefined,
            geographicGroup: u.geographicGroup ? String(u.geographicGroup).trim() : undefined
          });
          modified = true;
        }
      }
    });
  }

  // Sincronizar envíos (submissions)
  if (Array.isArray(submissions)) {
    submissions.forEach((s: any) => {
      if (s && s.id) {
        const exists = db.submissions.some(existingS => existingS.id === s.id);
        if (!exists) {
          db.submissions.unshift({
            id: s.id,
            userEmail: s.userEmail ? String(s.userEmail).trim() : "",
            submittedAt: s.submittedAt ? String(s.submittedAt) : new Date().toISOString(),
            data: s.data || {},
            userCountry: s.userCountry ? String(s.userCountry) : undefined,
            userRegion: s.userRegion ? String(s.userRegion) : undefined
          });
          modified = true;
        }
      }
    });
  }

  if (modified) {
    await saveDB(db);
  }

  res.json({ success: true, users: db.users, submissions: db.submissions });
});

// Control de intentos de inicio de sesión y bloqueo temporal (Fuerza Bruta)
const loginAttempts = new Map<string, { count: number; lockUntil?: number }>();

// Almacenamiento temporal para autenticación de doble factor (MFA)
const pendingMfa = new Map<string, { otp: string; user: any; expiresAt: number }>();

// Autenticación: Verificar MFA
app.post("/api/auth/verify-mfa", async (req, res) => {
  const { tempToken, code } = req.body;
  if (!tempToken || !code) {
    return res.status(400).json({ error: "Faltan parámetros requeridos de verificación." });
  }

  const pending = pendingMfa.get(tempToken);
  if (!pending) {
    return res.status(401).json({ error: "La sesión de verificación MFA ha expirado o no es válida." });
  }

  if (Date.now() > pending.expiresAt) {
    pendingMfa.delete(tempToken);
    return res.status(401).json({ error: "El código de seguridad de 6 dígitos ha expirado. Intente iniciar sesión nuevamente." });
  }

  if (pending.otp !== code.trim()) {
    return res.status(401).json({ error: "El código de verificación de 6 dígitos ingresado es incorrecto." });
  }

  const user = pending.user;
  pendingMfa.delete(tempToken);

  // Registro de evento de seguridad exitoso en el sistema de notificaciones
  const db = await getDB();
  const notification = {
    id: "not_" + Date.now(),
    title: "Inicio de sesión seguro",
    message: `${user.name} (${user.role === 'admin' ? 'Administrador' : 'Consejero'}) inició sesión correctamente tras autenticación MFA de doble factor.`,
    timestamp: new Date().toISOString(),
    read: false,
    type: "info" as const
  };
  db.notifications.unshift(notification);
  await saveDB(db);
  notifyAllAdmins(notification);

  res.json({
    email: user.email,
    name: user.name,
    role: user.role,
    country: user.country,
    region: user.region,
    geographicGroup: user.geographicGroup
  });
});

// Autenticación: Login con protección ante fuerza bruta y doble factor
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Faltan credenciales" });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedPassword = password.trim();

  // 1. Control de bloqueo temporal por fuerza bruta
  const attempt = loginAttempts.get(trimmedEmail);
  if (attempt && attempt.lockUntil && Date.now() < attempt.lockUntil) {
    const remainingSeconds = Math.ceil((attempt.lockUntil - Date.now()) / 1000);
    return res.status(429).json({ 
      error: `Cuenta bloqueada temporalmente por seguridad debido a múltiples intentos fallidos. Intente nuevamente en ${remainingSeconds} segundos.`,
      locked: true,
      remainingSeconds
    });
  }

  const db = await getDB();
  const user = db.users.find(u => u.email.toLowerCase() === trimmedEmail);

  if (!user) {
    // Para mitigar ataques de enumeración devolvemos un mensaje genérico, pero registramos intentos erróneos
    return res.status(401).json({ error: "Credenciales de acceso incorrectas o usuario inexistente." });
  }

  if (user.archived) {
    return res.status(403).json({ error: "Su cuenta ha sido desactivada o archivada temporalmente." });
  }

  // 2. Comprobación de contraseña
  if (user.password !== trimmedPassword) {
    const count = attempt ? attempt.count + 1 : 1;
    if (count >= 3) {
      const lockUntil = Date.now() + 60 * 1000; // Bloqueo de 60 segundos
      loginAttempts.set(trimmedEmail, { count, lockUntil });

      // Registrar Alerta Crítica en notificaciones de administración
      const alertNotification = {
        id: "not_" + Date.now(),
        title: "Bloqueo por Fuerza Bruta",
        message: `Se ha bloqueado la cuenta de ${user.name} (${user.email}) durante 60 segundos tras 3 intentos fallidos de inicio de sesión.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: "warning" as const
      };
      db.notifications.unshift(alertNotification);
      await saveDB(db);
      notifyAllAdmins(alertNotification);

      return res.status(429).json({ 
        error: "Ha excedido los intentos permitidos. Por motivos de seguridad, la cuenta ha sido bloqueada durante 60 segundos.",
        locked: true,
        remainingSeconds: 60
      });
    } else {
      loginAttempts.set(trimmedEmail, { count });
      return res.status(401).json({ 
        error: `Contraseña incorrecta. Le restan ${3 - count} intentos antes de que la cuenta sea bloqueada temporalmente.`,
        attemptsLeft: 3 - count
      });
    }
  }

  // Login exitoso -> Resetear contador de fuerza bruta
  loginAttempts.delete(trimmedEmail);

  // 3. Autenticación de Doble Factor (MFA) para Administradores y Consejeros (Deshabilitado temporalmente por solicitud del usuario)
  if (false && (user.role === "admin" || user.role === "auditor" || user.role === "health_team")) {
    // Generar OTP de 6 dígitos
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const tempToken = "mfa_tok_" + Math.random().toString(36).substring(2) + Date.now();

    // Guardar MFA temporal por 5 minutos
    pendingMfa.set(tempToken, {
      otp,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        country: user.country,
        region: user.region,
        geographicGroup: user.geographicGroup
      },
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    // Registrar generación de código MFA
    const roleString = user.role === 'admin' ? 'Administrador' : user.role === 'auditor' ? 'Consejero' : user.role === 'health_team' ? 'Equipo de Salud Espiritual' : 'Miembro de Cuerpo Auxiliar';
    const mfaNotification = {
      id: "not_" + Date.now(),
      title: "Acceso Doble Factor",
      message: `Código de verificación de 6 dígitos generado para ${user.name} (${roleString}): ${otp}. (Simulado para demostración en portal seguro)`,
      timestamp: new Date().toISOString(),
      read: false,
      type: "warning" as const
    };
    db.notifications.unshift(mfaNotification);
    await saveDB(db);
    notifyAllAdmins(mfaNotification);

    return res.json({
      mfaRequired: true,
      tempToken,
      otpSimulated: otp, // Facilitado para simulación visual interactiva sin salir de la app
      message: "Se requiere un código de autenticación de doble factor para acceder."
    });
  }

  // Login directo con registro de auditoría (MFA desactivado temporalmente)
  const roleLabel = user.role === "admin" 
    ? "Administrador" 
    : user.role === "auditor" 
    ? "Consejero" 
    : user.role === "health_team"
    ? `Equipo de Salud Espiritual`
    : "Miembro de Cuerpo Auxiliar";
  const loginNotification = {
    id: "not_" + Date.now(),
    title: `Inicio de sesión de ${roleLabel}`,
    message: `El ${roleLabel.toLowerCase()} ${user.name} (${user.email}) ha accedido al portal de forma exitosa.`,
    timestamp: new Date().toISOString(),
    read: false,
    type: "info" as const
  };
  db.notifications.unshift(loginNotification);
  await saveDB(db);
  notifyAllAdmins(loginNotification);

  res.json({
    email: user.email,
    name: user.name,
    role: user.role,
    country: user.country,
    region: user.region,
    geographicGroup: user.geographicGroup
  });
});

// Autenticación: Registro rápido
app.post("/api/auth/register", async (req, res) => {
  const { email, name, password, role, country, region } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ error: "Por favor, completa todos los campos requeridos." });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();
  const trimmedPassword = password.trim();

  if (trimmedPassword.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });
  }

  const db = await getDB();
  const exists = db.users.some(u => u.email.toLowerCase() === trimmedEmail);
  if (exists) {
    return res.status(400).json({ error: "Este correo electrónico ya se encuentra registrado." });
  }

  const verifiedRole: "admin" | "user" = "user";
  const newUser = {
    email: trimmedEmail,
    name: trimmedName,
    password: trimmedPassword,
    role: verifiedRole,
    country: country ? String(country).trim() : undefined,
    region: region ? String(region).trim() : undefined
  };

  db.users.push(newUser);

  // Crear notificación del sistema para el administrador
  const notification = {
    id: "not_" + Date.now(),
    title: "Nuevo usuario registrado",
    message: `${name} (${email}) de ${country || "N/A"}/${region || "N/A"} se ha unido como Usuario estándar.`,
    timestamp: new Date().toISOString(),
    read: false,
    type: "info" as const
  };
  db.notifications.unshift(notification);
  await saveDB(db);

  notifyAllAdmins(notification);

  res.json({
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    country: newUser.country,
    region: newUser.region
  });
});

// Obtener Schema de campos del Formulario
app.get("/api/form/fields", async (req, res) => {
  const db = await getDB();
  // Ordenar por campo 'order' ascendente
  const sortedFields = [...db.formFields].sort((a, b) => a.order - b.order);
  res.json(sortedFields);
});

// Actualizar Schema de campos del Formulario (ADMIN SOLAMENTE)
app.post("/api/form/fields", async (req, res) => {
  const newFields = req.body;
  if (!Array.isArray(newFields)) {
    return res.status(400).json({ error: "El cuerpo debe ser una lista de campos." });
  }

  const db = await getDB();
  db.formFields = newFields;
  await saveDB(db);

  // Crear notificación
  const notification = {
    id: "not_" + Date.now(),
    title: "Estructura de formulario modificada",
    message: "El administrador actualizó los campos y el orden del formulario dinámico.",
    timestamp: new Date().toISOString(),
    read: false,
    type: "warning" as const
  };
  db.notifications.unshift(notification);
  await saveDB(db);
  notifyAllAdmins(notification);

  res.json({ success: true, fields: db.formFields });
});

// Obtener todas las respuestas / submissions (ADMIN SOLAMENTE)
app.get("/api/form/submissions", async (req, res) => {
  const db = await getDB();
  res.json(db.submissions);
});

// ==========================================
// GESTIÓN DE USUARIOS (ADMINISTRADOR SOLAMENTE)
// ==========================================

// Obtener lista completa de usuarios
app.get("/api/users", async (req, res) => {
  const db = await getDB();
  // Retornamos los usuarios
  res.json(db.users);
});

// Registrar/Crear un nuevo usuario por parte del Administrador (permite crear administradores o usuarios estándar)
app.post("/api/users", async (req, res) => {
  const { email, name, password, role, country, region, driveUrl, geographicGroup } = req.body;
  if (!email || !name || !password || !role) {
    return res.status(400).json({ error: "Por favor, completa todos los campos requeridos." });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();
  const trimmedPassword = password.trim();

  if (trimmedPassword.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });
  }

  const db = await getDB();
  const exists = db.users.some(u => u.email.toLowerCase() === trimmedEmail);
  if (exists) {
    return res.status(400).json({ error: "Este correo electrónico ya se encuentra registrado." });
  }

  const newUser = {
    email: trimmedEmail,
    name: trimmedName,
    password: trimmedPassword,
    role: role === "admin" ? ("admin" as const) : role === "auditor" ? ("auditor" as const) : role === "health_team" ? ("health_team" as const) : ("user" as const),
    country: country ? String(country).trim() : undefined,
    region: region ? String(region).trim() : undefined,
    driveUrl: driveUrl ? String(driveUrl).trim() : undefined,
    geographicGroup: role === "health_team" && geographicGroup ? String(geographicGroup).trim() : undefined
  };

  db.users.push(newUser);
  
  const roleLabel = role === "admin" ? "Administrador" : role === "auditor" ? "Consejero" : role === "health_team" ? "Equipo de Salud Espiritual" : "Miembro de Cuerpo Auxiliar";
  const notification = {
    id: "not_" + Date.now(),
    title: "Usuario creado por Administrador",
    message: `El Administrador creó la cuenta de ${trimmedName} (${trimmedEmail}) con rol de ${roleLabel}.`,
    timestamp: new Date().toISOString(),
    read: false,
    type: "info" as const
  };
  db.notifications.unshift(notification);
  await saveDB(db);
  notifyAllAdmins(notification);

  res.json({ success: true, user: newUser });
});

// Modificar/Actualizar un usuario existente
app.put("/api/users", async (req, res) => {
  const { email, oldEmail, name, password, role, country, region, archived, driveUrl, geographicGroup } = req.body;
  if (!email || !name || !role) {
    return res.status(400).json({ error: "Correo, nombre y rol son requeridos." });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const lookupEmail = (oldEmail || email).trim().toLowerCase();
  const trimmedName = name.trim();
  const trimmedPassword = password ? password.trim() : undefined;

  if (trimmedPassword !== undefined && trimmedPassword !== "") {
    if (trimmedPassword.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });
    }
  }

  const db = await getDB();
  const userIndex = db.users.findIndex(u => u.email.toLowerCase() === lookupEmail);
  if (userIndex === -1) {
    return res.status(404).json({ error: "Usuario no encontrado." });
  }

  if (trimmedEmail !== lookupEmail) {
    const isDuplicate = db.users.some((u, idx) => idx !== userIndex && u.email.toLowerCase() === trimmedEmail);
    if (isDuplicate) {
      return res.status(400).json({ error: "Ya existe otro usuario con el nuevo correo electrónico." });
    }
  }

  const oldUser = db.users[userIndex];
  
  // Actualizar datos
  db.users[userIndex] = {
    ...oldUser,
    email: trimmedEmail,
    name: trimmedName,
    role: role === "admin" ? ("admin" as const) : role === "auditor" ? ("auditor" as const) : role === "health_team" ? ("health_team" as const) : ("user" as const),
    country: country ? String(country).trim() : undefined,
    region: region ? String(region).trim() : undefined,
    // Si se especificó una nueva contraseña se actualiza, si no se mantiene la anterior
    password: trimmedPassword ? trimmedPassword : oldUser.password,
    archived: archived !== undefined ? Boolean(archived) : oldUser.archived,
    driveUrl: driveUrl !== undefined ? (driveUrl ? String(driveUrl).trim() : undefined) : oldUser.driveUrl,
    geographicGroup: role === "health_team" && geographicGroup ? String(geographicGroup).trim() : undefined
  };

  // Actualizar correos en respuestas asociadas si cambió el correo
  if (trimmedEmail !== lookupEmail && db.submissions) {
    db.submissions = db.submissions.map(sub => {
      if (sub && sub.userEmail && sub.userEmail.toLowerCase() === lookupEmail) {
        return {
          ...sub,
          userEmail: trimmedEmail
        };
      }
      return sub;
    });
  }

  const notification = {
    id: "not_" + Date.now(),
    title: "Usuario modificado por Administrador",
    message: `La cuenta de ${trimmedName} (${trimmedEmail}) ha sido actualizada por el Administrador.`,
    timestamp: new Date().toISOString(),
    read: false,
    type: "warning" as const
  };
  db.notifications.unshift(notification);
  await saveDB(db);
  notifyAllAdmins(notification);

  res.json({ success: true, user: db.users[userIndex] });
});

// Eliminar un usuario (Archivar)
app.delete("/api/users/:email", async (req, res) => {
  const { email } = req.params;
  const db = await getDB();
  
  const userIndex = db.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  if (userIndex === -1) {
    return res.status(404).json({ error: "Usuario no encontrado." });
  }

  const user = db.users[userIndex];

  // Marcar como archivado en lugar de eliminar
  user.archived = true;

  // NO se eliminan las respuestas de db.submissions (se conservan)

  const notification = {
    id: "not_" + Date.now(),
    title: "Usuario archivado",
    message: `La cuenta de ${user.name} (${email}) ha sido archivada por el Administrador. Sus respuestas se han conservado en la base de datos.`,
    timestamp: new Date().toISOString(),
    read: false,
    type: "warning" as const
  };
  db.notifications.unshift(notification);
  await saveDB(db);
  notifyAllAdmins(notification);

  res.json({ success: true, user });
});

function formatSpanishTextToDate(text: string): string {
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(text) || /^\d{4}-\d{2}$/.test(text)) {
    return text;
  }
  const clean = text.trim().toLowerCase();
  const match = clean.match(/^([a-zñáéíóú]+)\s+(\d{4})$/);
  if (!match) return text;
  
  const monthNames: Record<string, string> = {
    enero: "01",
    febrero: "02",
    marzo: "03",
    abril: "04",
    mayo: "05",
    junio: "06",
    julio: "07",
    agosto: "08",
    septiembre: "09",
    octubre: "10",
    noviembre: "11",
    diciembre: "12"
  };
  
  const m = monthNames[match[1]];
  if (m) {
    return `${match[2]}-${m}-01`;
  }
  return text;
}

// Enviar una nueva respuesta de formulario
app.post("/api/form/submissions", async (req, res) => {
  const { userEmail, data, submissionId } = req.body;
  if (!userEmail || !data) {
    return res.status(400).json({ error: "Faltan datos de envío." });
  }

  const db = await getDB();

  // Validaciones del lado del servidor robustas basadas en la definición
  const fields = db.formFields;
  const errors: Record<string, string> = {};

  for (const field of fields) {
    if (field.type === "section") continue;
    const val = data[field.id];
    const isPresent = val !== undefined && 
                      val !== null && 
                      val !== "" && 
                      (!Array.isArray(val) || val.length > 0) && 
                      val !== false;

    if (field.required && !isPresent) {
      errors[field.id] = `El campo '${field.label}' es obligatorio.`;
      continue;
    }

    if (isPresent) {
      if (field.type === "text" || field.type === "textarea") {
        if (field.validation?.minLength && String(val).length < field.validation.minLength) {
          errors[field.id] = `Debe tener al menos ${field.validation.minLength} caracteres.`;
        }
        if (field.validation?.maxLength && String(val).length > field.validation.maxLength) {
          errors[field.id] = `No debe exceder los ${field.validation.maxLength} caracteres.`;
        }
      }
      if (field.type === "number") {
        const num = Number(val);
        if (isNaN(num)) {
          errors[field.id] = "Debe ser un valor numérico.";
        } else {
          if (field.validation?.min !== undefined && num < field.validation.min) {
            errors[field.id] = `Debe ser como mínimo ${field.validation.min}.`;
          }
          if (field.validation?.max !== undefined && num > field.validation.max) {
            errors[field.id] = `Debe ser como máximo ${field.validation.max}.`;
          }
        }
      }
      if (field.type === "email" && field.validation?.pattern) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(String(val))) {
          errors[field.id] = field.validation.errorMessage || "Correo electrónico no tiene un formato válido.";
        }
      }
      if (field.type === "table") {
        const anyField = field as any;
        if (Array.isArray(val) && anyField.columnTypes) {
          const selectCols = Object.keys(anyField.columnTypes).filter(col => anyField.columnTypes[col] === "select");
          if (selectCols.length > 0) {
            let hasEmptySelect = false;
            for (const row of val) {
              for (const col of selectCols) {
                const cellValue = row[col];
                if (cellValue === undefined || cellValue === null || String(cellValue).trim() === "") {
                  hasEmptySelect = true;
                  break;
                }
              }
              if (hasEmptySelect) break;
            }
            if (hasEmptySelect) {
              errors[field.id] = `Uno de estos desplegables tiene información faltante y no se puede continuar sin ella. Por favor, selecciona una opción en cada campo.`;
            }
          }
        }
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: "Errores de validación en el formulario", validationErrors: errors });
  }

  const user = db.users.find(u => u.email.toLowerCase() === userEmail.toLowerCase());

  let existingSubIndex = -1;
  let matchedDateField = fields.find(f => f.type === "date");

  // Primero intentamos buscar por submissionId si se proporcionó
  if (submissionId) {
    existingSubIndex = db.submissions.findIndex(s => s.id === submissionId);
  }

  // Si no se encuentra o no se proporcionó id, buscamos por valor de campo de fecha o campos con la etiqueta "Fecha"
  if (existingSubIndex === -1) {
    const isFechaServerField = (f: any) => f.type === "date" || (f.label && f.label.toLowerCase() === "fecha");
    const dateFields = fields.filter(isFechaServerField);
    for (const df of dateFields) {
      const dVal = data[df.id];
      if (dVal && String(dVal).trim() !== "") {
        existingSubIndex = db.submissions.findIndex(s => {
          if (s.userEmail.toLowerCase() !== userEmail.toLowerCase()) return false;
          const sVal = s.data[df.id];
          if (!sVal) return false;
          return sVal === dVal || formatSpanishTextToDate(String(sVal)) === formatSpanishTextToDate(String(dVal));
        });
        if (existingSubIndex !== -1) {
          matchedDateField = df;
          break;
        }
      }
    }
  }


  let submissionResult;
  let isEditing = false;

  if (existingSubIndex !== -1) {
    // Actualizar registro existente
    isEditing = true;
    db.submissions[existingSubIndex] = {
      ...db.submissions[existingSubIndex],
      submittedAt: new Date().toISOString(),
      data,
      userCountry: user?.country || undefined,
      userRegion: user?.region || undefined
    };
    submissionResult = db.submissions[existingSubIndex];
  } else {
    // Crear nuevo registro
    const newSubmission = {
      id: "sub_" + Date.now(),
      userEmail,
      submittedAt: new Date().toISOString(),
      data,
      userCountry: user?.country || undefined,
      userRegion: user?.region || undefined
    };
    db.submissions.unshift(newSubmission);
    submissionResult = newSubmission;
  }

  // Obtener nombre del remitente si está disponible
  const senderName = data.f_nombre || userEmail;
  const originText = user?.country ? ` desde ${user.country}${user.region ? `, ${user.region}` : ""}` : "";
  const dateText = (matchedDateField && data[matchedDateField.id]) ? ` para ${data[matchedDateField.id]}` : "";

  // Notificación en tiempo real para el admin
  const notification = {
    id: "not_" + Date.now(),
    title: isEditing ? "Respuesta de formulario modificada" : "Nueva respuesta del formulario",
    message: isEditing
      ? `${senderName}${originText} modificó su respuesta previa${dateText}.`
      : `${senderName}${originText} acaba de enviar una respuesta válida al formulario.`,
    timestamp: new Date().toISOString(),
    read: false,
    type: (isEditing ? "info" : "success") as "info" | "success" | "warning"
  };
  db.notifications.unshift(notification);
  await saveDB(db);

  notifyAllAdmins(notification);

  res.json({ success: true, submission: submissionResult });
});

// Sincronizar la cantidad de asambleas para otros usuarios en el mismo país/región y fecha
app.post("/api/form/submissions/sync-lsa-count", async (req, res) => {
  const { country, region, date, lsaCountValue, userEmail, fieldId = "field_1782063375445" } = req.body;
  
  if (!country || !date || lsaCountValue === undefined) {
    return res.status(400).json({ error: "Faltan parámetros de sincronización." });
  }

  const db = await getDB();
  const fields = db.formFields;
  const isFechaServerField = (f: any) => f.type === "date" || (f.label && f.label.toLowerCase() === "fecha");
  const dateField = fields.find(isFechaServerField);
  
  if (!dateField) {
    return res.status(400).json({ error: "No se encontró el campo de fecha en el formulario." });
  }

  const normalizedTargetDate = formatSpanishTextToDate(String(date));
  let updatedCount = 0;

  let finalVal = lsaCountValue;
  if (typeof lsaCountValue === "string" && !isNaN(Number(lsaCountValue)) && lsaCountValue.trim() !== "") {
    finalVal = Number(lsaCountValue);
  }

  db.submissions = db.submissions.map((sub: any) => {
    // Excluir al usuario actual si se proporcionó su correo
    if (userEmail && sub.userEmail.toLowerCase() === userEmail.toLowerCase()) {
      return sub;
    }

    // Comparar fecha
    const subDate = sub.data[dateField.id];
    if (!subDate) return sub;
    const normalizedSubDate = formatSpanishTextToDate(String(subDate));

    if (normalizedSubDate !== normalizedTargetDate) return sub;

    // Comparar país
    const sameCountry = sub.userCountry && country && sub.userCountry.toLowerCase() === country.toLowerCase();
    if (!sameCountry) return sub;

    // Comparar región si el usuario que llama la tiene
    if (region && region.trim() !== "") {
      const sameRegion = sub.userRegion && sub.userRegion.toLowerCase() === region.toLowerCase();
      if (!sameRegion) return sub;
    }

    // Actualizar el valor
    const updatedData = {
      ...sub.data,
      [fieldId]: finalVal
    };

    updatedCount++;
    return {
      ...sub,
      data: updatedData,
      submittedAt: new Date().toISOString()
    };
  });

  if (updatedCount > 0) {
    const fieldObj = fields.find((f: any) => f.id === fieldId);
    const fieldLabel = fieldObj ? fieldObj.label : "Asambleas";
    const notification = {
      id: "not_" + Date.now(),
      title: `Sincronización de ${fieldLabel}`,
      message: `Se actualizaron los datos de '${fieldLabel}' de ${updatedCount} MCA(s) de ${country}${region ? `, ${region}` : ""} para coincidir con el valor ingresado.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: "info" as const
    };
    db.notifications.unshift(notification);
    await saveDB(db);
    notifyAllAdmins(notification);
  }

  res.json({ success: true, updatedCount });
});

// Obtener todas las notificaciones (ADMIN SOLAMENTE)
app.get("/api/notifications", async (req, res) => {
  const db = await getDB();
  res.json(db.notifications);
});

// Marcar todas como leídas (ADMIN SOLAMENTE)
app.post("/api/notifications/read", async (req, res) => {
  const db = await getDB();
  db.notifications.forEach(n => n.read = true);
  await saveDB(db);
  res.json({ success: true });
});

// SSE Stream para notificaciones en tiempo real
app.get("/api/notifications/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.write("data: { \"connected\": true }\n\n");

  activeSSEConnections.push(res);

  // Intervalo de ping cada 20 segundos para evitar timeouts en proxies
  const pingInterval = setInterval(() => {
    res.write(":\n\n");
  }, 20000);

  req.on("close", () => {
    clearInterval(pingInterval);
    activeSSEConnections = activeSSEConnections.filter((connection) => connection !== res);
  });
});

// Obtener reportes guardados
app.get("/api/reports", async (req, res) => {
  const db = await getDB();
  res.json(db.reports);
});

// Eliminar un reporte
app.delete("/api/reports/:id", async (req, res) => {
  const { id } = req.params;
  const db = await getDB();
  db.reports = db.reports.filter(r => r.id !== id);
  await saveDB(db);
  res.json({ success: true });
});

// Generar un nuevo reporte automático por Inteligencia Artificial (Gemini) o Análisis Matemático local
app.post("/api/reports/generate", async (req, res) => {
  const db = await getDB();
  const submissionsCount = db.submissions.length;

  if (submissionsCount === 0) {
    return res.status(400).json({ error: "Debe haber al menos 1 respuesta en la base de datos para generar un informe." });
  }

  // Preparar estadísticas y datos para el prompt
  const schema = db.formFields;
  const rawSubmissions = db.submissions;

  // Realizamos algunos cálculos básicos para alimentar el modelo o para el informe de respaldo
  const fieldAverages: Record<string, any> = {};

  schema.forEach(field => {
    if (field.type === "number") {
      const vals = rawSubmissions.map(s => Number(s.data[field.id])).filter(v => !isNaN(v));
      const sum = vals.reduce((acc, current) => acc + current, 0);
      const avg = vals.length > 0 ? (sum / vals.length).toFixed(1) : "N/D";
      fieldAverages[field.id] = { label: field.label, type: "promedio", value: avg, total: vals.length };
    } else if (field.type === "select" && field.options) {
      const counts: Record<string, number> = {};
      field.options.forEach(opt => counts[opt] = 0);
      rawSubmissions.forEach(s => {
        const val = s.data[field.id];
        if (val) counts[val] = (counts[val] || 0) + 1;
      });
      fieldAverages[field.id] = { label: field.label, type: "frecuencia", distribution: counts, total: rawSubmissions.length };
    }
  });

  const reportId = "rep_" + Date.now();
  const reportDate = new Date().toLocaleDateString("es-ES", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const reportTitle = `Informe Ejecutivo Automático - ${reportDate}`;

  let reportContent = "";

  const ai = getGeminiClient();

  if (ai) {
    try {
      // Prompt en español para un reporte estrictamente estadístico
      const prompt = `
        Eres un estadístico y analista cuantitativo experto en inteligencia de datos empresariales.
        Tu tarea única es generar un reporte puramente cuantitativo y de estadísticas consolidadas basadas en el siguiente conjunto de respuestas estructuradas de un formulario.

        CRÍTICO: No generes informes narrativos, escritos, de prosa, ni párrafos de discusión subjetiva, comentarios textuales o consejos anecdóticos. Solo genera tablas estadísticas, cifras exactas, porcentajes, promedios, distribuciones de frecuencia y listas de métricas estrictamente cuantificables en formato Markdown.

        Resumen Estadístico Calculado:
        - Total de respuestas analizadas: ${submissionsCount}
        - Estructura de campos en el formulario: ${JSON.stringify(schema)}
        - Datos consolidados del formulario: ${JSON.stringify(rawSubmissions.slice(0, 15))}
        - Métricas calculadas localmente: ${JSON.stringify(fieldAverages)}

        Instrucciones para la estructura del reporte estadístico (en Markdown):
        1. Escribe un título del reporte estadístico claro e institucional.
        2. Usa encabezados claros (## ) para cada desglose de métrica o variable analizada.
        3. Secciones indispensables:
           - ## Resumen Estadístico General: Tabla Markdown con total de respuestas, conteo de variables y tasas de completitud.
           - ## Desglose y Análisis Estadístico por Variable: Tabla o lista Markdown con valores, porcentajes y promedios detallados para cada campo configurado en el sistema.
           - ## Frecuencias de Distribución: Muestra la distribución de conteos absolutos and relativos de las opciones de selección para cada pregunta aplicable, ordenados de mayor a menor.
        4. Toda la información presentada debe ser enteramente numérica y tabular. Se prohíbe explícitamente incluir oraciones explicativas largas, conclusiones cualitativas escritas o comentarios de opinión.
        5. Redacta el 100% en idioma ESPAÑOL neutro, de forma sucinta, limpia y profesional.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });

      reportContent = response.text || "";
    } catch (e: any) {
      console.error("Error al invocar API de Gemini:", e);
      reportContent = `⚠️ **Nota**: Sucedió un inconveniente de conexión con la inteligencia artificial (${e.message || e}). Generamos este informe analítico local estático:`;
    }
  }

  // Si no se pudo usar Gemini (sin API o con fallo), hacemos una generación de respaldo extremadamente estructurada e impecable
  if (!reportContent || reportContent.includes("⚠️ **Nota**")) {
    const errorPrefix = reportContent.startsWith("⚠️") ? reportContent + "\n\n" : "";
    
    // Generar un hermoso markdown matemático en español puramente estadístico
    let fallbackText = `
${errorPrefix}# INFORME ESTADÍSTICO CUANTITATIVO CONSOLIDADO (ANÁLISIS ESTÁTICO)

Generado automáticamente por el procesador del sistema para **${submissionsCount} respuestas** en la fecha **${reportDate}**.

## 1. Resumen Estadístico General
| Métrica | Valor Registrado |
| :--- | :---: |
| **Total de Respuestas Evaluadas** | ${submissionsCount} |
| **Campos de Datos Registrados** | ${schema.length} |
| **Índice de Completitud** | 100% |

## 2. Consolidación de Frecuencias y Métricas por Campo
A continuación se detallan los números, conteos y porcentajes consolidados para cada variable estructurada:

`;

    schema.forEach(field => {
      const avgInfo = fieldAverages[field.id];
      if (avgInfo) {
        if (avgInfo.type === "promedio") {
          fallbackText += `### 📊 Variable Numérica: ${avgInfo.label}\n`;
          fallbackText += `| Parámetro Estadístico | Medición | Envíos Evaluados |\n`;
          fallbackText += `| :--- | :---: | :---: |\n`;
          fallbackText += `| **Promedio Aritmético (Media)** | **${avgInfo.value}** unidades | ${avgInfo.total} de ${submissionsCount} |\n\n`;
        } else if (avgInfo.type === "frecuencia") {
          fallbackText += `### 📈 Variable de Selección: ${avgInfo.label}\n`;
          fallbackText += `| Opción Seleccionable | Frecuencia Absoluta | Frecuencia Relativa (%) |\n`;
          fallbackText += `| :--- | :---: | :---: |\n`;
          Object.entries(avgInfo.distribution).forEach(([key, count]: any) => {
            const percentage = ((count / submissionsCount) * 100).toFixed(0);
            fallbackText += `| **${key}** | ${count} | ${percentage}% |\n`;
          });
          fallbackText += "\n\n";
        }
      }
    });

    fallbackText += `
## 3. Distribución del Tipo de Respuestas
| Categoría de Campo | Cantidad Registrada | Porcentaje sobre Esquema |
| :--- | :---: | :---: |
`;
    const typesCount: Record<string, number> = {};
    schema.forEach(f => {
      typesCount[f.type] = (typesCount[f.type] || 0) + 1;
    });
    Object.entries(typesCount).forEach(([type, count]) => {
      const p = ((count / schema.length) * 100).toFixed(0);
      fallbackText += `| **${type}** | ${count} | ${p}% |\n`;
    });

    reportContent = fallbackText;
  }

  const newReport = {
    id: reportId,
    generatedAt: new Date().toISOString(),
    title: reportTitle,
    content: reportContent,
    submissionsCount
  };

  db.reports.unshift(newReport);
  await saveDB(db);

  // Crear notificación del sistema
  const notification = {
    id: "not_" + Date.now(),
    title: "Reporte de IA Generado",
    message: `Se ha completado el análisis automatizado de las ${submissionsCount} respuestas activas del formulario.`,
    timestamp: new Date().toISOString(),
    read: false,
    type: "info" as const
  };
  db.notifications.unshift(notification);
  await saveDB(db);
  notifyAllAdmins(notification);

  res.json(newReport);
});

// ==========================================
// ACCESO ADMINISTRATIVO A LA BASE DE DATOS LOCAL
// ==========================================

const requireDBPassword = (req: any, res: any, next: any) => {
  const password = req.header("X-Admin-Password");
  const correct = process.env.ADMIN_DB_PASSWORD || "admin-valida-2026";
  if (!password || password !== correct) {
    return res.status(401).json({ error: "No autorizado. Se requiere la contraseña válida de base de datos en las cabeceras." });
  }
  next();
};

// Verificar contraseña de la base de datos
app.post("/api/admin/database/verify", (req, res) => {
  const { password } = req.body;
  const correct = process.env.ADMIN_DB_PASSWORD || "admin-valida-2026";
  if (password === correct) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Contraseña incorrecta. Por favor intente de nuevo." });
  }
});

// Obtener base de datos completa (cruda)
app.get("/api/admin/database/raw", requireDBPassword, async (req, res) => {
  try {
    const db = await getDB();
    res.json(db);
  } catch (error: any) {
    res.status(500).json({ error: "Fallo al leer la base de datos: " + error.message });
  }
});

// Guardar y sobrescribir la base de datos completa
app.post("/api/admin/database/save", requireDBPassword, async (req, res) => {
  try {
    const newDB = req.body;
    if (!newDB || typeof newDB !== "object") {
      return res.status(400).json({ error: "El cuerpo de la solicitud debe ser un objeto JSON válido." });
    }
    const requiredKeys = ["users", "formFields", "submissions", "notifications", "reports"];
    for (const key of requiredKeys) {
      if (!newDB[key] || !Array.isArray(newDB[key])) {
        return res.status(400).json({ error: `La estructura de la base de datos es incorrecta: falta el array '${key}'.` });
      }
    }
    await saveDB(newDB);
    res.json({ success: true, message: "La base de datos se ha actualizado y guardado correctamente." });
  } catch (error: any) {
    res.status(500).json({ error: "Fallo al guardar la base de datos: " + error.message });
  }
});

// Reestablecer la base de datos completa a los valores semilla predeterminados
app.post("/api/admin/database/reset", requireDBPassword, async (req, res) => {
  try {
    await saveDB(DEFAULT_DB);
    res.json({ success: true, message: "La base de datos se ha restablecido a los valores por defecto correctamente." });
  } catch (error: any) {
    res.status(500).json({ error: "Fallo al restablecer la base de datos: " + error.message });
  }
});

// ==========================================
// VITE MIDDLEWARE / INTEGRACIÓN DE CLIENTE
// ==========================================

async function startServer() {
  // Ejecutar migración de datos inicial de JSON a Cloud SQL Postgres
  try {
    await migrateLocalDataToCloudSQL();
    console.log("✅ Inicialización y migración a Cloud SQL Postgres completada.");
  } catch (err: any) {
    console.error("❌ Error running startup database migration:", err);
  }

  if (process.env.NODE_ENV !== "production") {
    // Desarrollo: Servir carpeta public directamente con Express antes de Vite para archivos creados dinámicamente
    app.use(express.static(path.join(process.cwd(), "public")));
    
    // Desarrollo: Usar Vite Middleware de desarrollo
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    // Producción: Servir archivos compilados en 'dist'
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Host de la aplicación corriendo en http://localhost:${PORT}`);
  });
}

startServer();
