import fs from "fs";
import path from "path";
import { db } from "./index.ts";
import { users, formFields, submissions, notifications, reports, settings } from "./schema.ts";
import { count, eq } from "drizzle-orm";

const DB_FILE = path.join(process.cwd(), "server-db.json");

export async function migrateLocalDataToCloudSQL() {
  console.log("🔍 Checking if database migration is needed...");

  try {
    if (!fs.existsSync(DB_FILE)) {
      console.log("ℹ️ No local JSON database found. Nothing to migrate.");
      return;
    }

    console.log(`📂 Found local database file: ${DB_FILE}. Checking individual tables for migration...`);
    const fileContent = fs.readFileSync(DB_FILE, "utf-8");
    const localDb = JSON.parse(fileContent);

    // --- 1. MIGRAR CONFIGURACIONES DE FONDO (SETTINGS) ---
    const settingsCountResult = await db.select({ val: count() }).from(settings);
    const existingSettingsCount = settingsCountResult[0]?.val || 0;
    if (existingSettingsCount === 0) {
      console.log("⚙️ Settings table is empty. Migrating settings...");
      if (localDb.googleDriveUrl) {
        await db.insert(settings).values({ key: "googleDriveUrl", value: localDb.googleDriveUrl }).onConflictDoNothing();
      }
    } else {
      console.log(`✅ Settings already present (${existingSettingsCount} rows).`);
    }

    // --- 2. MIGRAR CAMPOS DE FORMULARIO ---
    const fieldsCountResult = await db.select({ val: count() }).from(formFields);
    const existingFieldsCount = fieldsCountResult[0]?.val || 0;
    if (existingFieldsCount === 0) {
      if (localDb.formFields && Array.isArray(localDb.formFields) && localDb.formFields.length > 0) {
        console.log(`📝 Migrating ${localDb.formFields.length} form fields from server-db.json...`);
        const mappedFields = localDb.formFields.map((field: any) => ({
          id: field.id,
          label: field.label,
          type: field.type,
          placeholder: field.placeholder || null,
          description: field.description || null,
          required: !!field.required,
          options: field.options || null,
          columns: field.columns || null,
          predefinedRows: field.predefinedRows || null,
          columnTypes: field.columnTypes || null,
          columnOptions: field.columnOptions || null,
          allowOther: field.allowOther !== undefined ? !!field.allowOther : false,
          multiple: field.multiple !== undefined ? !!field.multiple : false,
          validation: field.validation || { required: !!field.required },
          fieldOrder: typeof field.order === "number" ? field.order : 0,
        }));
        try {
          await db.insert(formFields).values(mappedFields).onConflictDoNothing();
          console.log("✅ Form fields migrated successfully!");
        } catch (err) {
          console.error("⚠️ Error migrating form fields:", err);
        }
      }
    } else {
      console.log(`✅ Form fields already present in database (${existingFieldsCount} fields). Keeping current fields.`);
    }

    // --- 2.5 AUTO-NORMALIZACIÓN DE ENCUENTAS EXISTENTES ---
    try {
      const allSubs = await db.select().from(submissions);
      let updatedCount = 0;
      for (const sub of allSubs) {
        let changed = false;
        let subDataStr = JSON.stringify(sub.data);
        if (
          subDataStr.includes('"L8"') || 
          subDataStr.includes('"Alcohól"') || 
          subDataStr.includes('"Participacion en Política"')
        ) {
          subDataStr = subDataStr
            .replaceAll('"L8"', '"Libro 8"')
            .replaceAll('"Alcohól"', '"Alcohol"')
            .replaceAll('"Participacion en Política"', '"Participación en Política"');
          sub.data = JSON.parse(subDataStr);
          changed = true;
        }
        if (changed) {
          await db.update(submissions).set({ data: sub.data }).where(eq(submissions.id, sub.id));
          updatedCount++;
        }
      }
      if (updatedCount > 0) {
        console.log(`🧹 Cleaned up and normalized ${updatedCount} submissions in the database!`);
      }
    } catch (err) {
      console.error("⚠️ Error normalizing existing submissions in database:", err);
    }

    // --- 3. MIGRAR USUARIOS ---
    const userCountResult = await db.select({ val: count() }).from(users);
    const existingUsersCount = userCountResult[0]?.val || 0;
    if (existingUsersCount === 0) {
      if (localDb.users && Array.isArray(localDb.users) && localDb.users.length > 0) {
        console.log(`👤 Migrating ${localDb.users.length} users...`);
        const mappedUsers = localDb.users.map((user: any) => ({
          email: user.email.toLowerCase().trim(),
          name: user.name,
          password: user.password || "baha-2026",
          role: user.role || "user",
          country: user.country || null,
          region: user.region || null,
          archived: !!user.archived,
          driveUrl: user.driveUrl || null,
          geographicGroup: user.geographicGroup || null,
        }));
        await db.insert(users).values(mappedUsers).onConflictDoNothing();
      }
    } else {
      console.log(`✅ Users already migrated (${existingUsersCount} users).`);
    }

    // --- 4. MIGRAR SUBMISSIONS (RESPUESTAS) ---
    const submissionsCountResult = await db.select({ val: count() }).from(submissions);
    const existingSubmissionsCount = submissionsCountResult[0]?.val || 0;
    if (existingSubmissionsCount === 0) {
      if (localDb.submissions && Array.isArray(localDb.submissions) && localDb.submissions.length > 0) {
        console.log(`📥 Migrating ${localDb.submissions.length} submissions...`);
        const mappedSubmissions = localDb.submissions
          .filter((sub: any) => sub && sub.id)
          .map((sub: any) => ({
            id: sub.id,
            userEmail: sub.userEmail,
            submittedAt: sub.submittedAt || new Date().toISOString(),
            data: sub.data || {},
            userCountry: sub.userCountry || null,
            userRegion: sub.userRegion || null,
          }));

        if (mappedSubmissions.length > 0) {
          const batchSize = 100;
          for (let i = 0; i < mappedSubmissions.length; i += batchSize) {
            const batch = mappedSubmissions.slice(i, i + batchSize);
            await db.insert(submissions).values(batch).onConflictDoNothing();
          }
        }
      }
    } else {
      console.log(`✅ Submissions already migrated (${existingSubmissionsCount} submissions).`);
    }

    // --- 5. MIGRAR NOTIFICACIONES ---
    const notificationsCountResult = await db.select({ val: count() }).from(notifications);
    const existingNotificationsCount = notificationsCountResult[0]?.val || 0;
    if (existingNotificationsCount === 0) {
      if (localDb.notifications && Array.isArray(localDb.notifications) && localDb.notifications.length > 0) {
        console.log(`🔔 Migrating ${localDb.notifications.length} notifications...`);
        const mappedNotifications = localDb.notifications
          .filter((not: any) => not && not.id)
          .map((not: any) => ({
            id: not.id,
            title: not.title,
            message: not.message,
            timestamp: not.timestamp || new Date().toISOString(),
            read: !!not.read,
            type: not.type || "info",
          }));

        if (mappedNotifications.length > 0) {
          const batchSize = 100;
          for (let i = 0; i < mappedNotifications.length; i += batchSize) {
            const batch = mappedNotifications.slice(i, i + batchSize);
            await db.insert(notifications).values(batch).onConflictDoNothing();
          }
        }
      }
    } else {
      console.log(`✅ Notifications already migrated (${existingNotificationsCount} notifications).`);
    }

    // --- 6. MIGRAR REPORTES ---
    const reportsCountResult = await db.select({ val: count() }).from(reports);
    const existingReportsCount = reportsCountResult[0]?.val || 0;
    if (existingReportsCount === 0) {
      if (localDb.reports && Array.isArray(localDb.reports) && localDb.reports.length > 0) {
        console.log(`📊 Migrating ${localDb.reports.length} AI reports...`);
        const mappedReports = localDb.reports
          .filter((rep: any) => rep && rep.id)
          .map((rep: any) => ({
            id: rep.id,
            generatedAt: rep.generatedAt || new Date().toISOString(),
            title: rep.title,
            content: rep.content,
            submissionsCount: typeof rep.submissionsCount === "number" ? rep.submissionsCount : 0,
          }));

        if (mappedReports.length > 0) {
          await db.insert(reports).values(mappedReports).onConflictDoNothing();
        }
      }
    } else {
      console.log(`✅ Reports already migrated (${existingReportsCount} reports).`);
    }

    console.log("🚀 Data migration to Cloud SQL completed successfully!");
  } catch (error) {
    console.error("❌ Error during Cloud SQL data migration:", error);
  }
}

// Interfaces de compatibilidad para el backend anterior
export interface DBStructure {
  users: Array<{ email: string; name: string; password?: string; role: "admin" | "user" | "auditor" | "health_team"; country?: string; region?: string; archived?: boolean; geographicGroup?: string; driveUrl?: string }>;
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
    columnTypes?: Record<string, 'text' | 'number' | 'checkbox' | 'select'>;
    columnOptions?: Record<string, string[]>;
    allowOther?: boolean;
    multiple?: boolean;
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

// Helper de reintento para consultas de base de datos propensas a desconexiones de idle
async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err.message || err);
      console.warn(`⚠️ Database query failed (attempt ${i + 1}/${retries}):`, errMsg);
      if (
        errMsg.includes("terminated") || 
        errMsg.includes("closed") || 
        errMsg.includes("connection") || 
        errMsg.includes("timeout") ||
        errMsg.includes("Connection")
      ) {
        // Esperar un momento corto antes de volver a intentar con una nueva conexión del pool
        await new Promise(resolve => setTimeout(resolve, 300 * (i + 1)));
        continue;
      }
      throw err; // Errores de sintaxis o lógica fallan de inmediato sin reintento
    }
  }
  throw lastError;
}

// Carga asíncronamente todos los datos de Cloud SQL
export async function getDBAsync(): Promise<DBStructure> {
  try {
    return await withRetry(async () => {
      const usersList = await db.select().from(users);
      const fieldsList = await db.select().from(formFields);
      const submissionsList = await db.select().from(submissions);
      const notificationsList = await db.select().from(notifications);
      const reportsList = await db.select().from(reports);
      
      // Configuraciones
      const googleDriveUrlVal = await db.select().from(settings).where(eq(settings.key, "googleDriveUrl"));

      return {
        users: usersList.map(u => ({
          email: u.email,
          name: u.name,
          password: u.password || undefined,
          role: u.role as any,
          country: u.country || undefined,
          region: u.region || undefined,
          archived: u.archived || undefined,
          driveUrl: u.driveUrl || undefined,
          geographicGroup: u.geographicGroup || undefined
        })),
        formFields: fieldsList.map(f => ({
          id: f.id,
          label: f.label,
          type: f.type as any,
          placeholder: f.placeholder || undefined,
          description: f.description || undefined,
          required: f.required,
          options: f.options as string[] || undefined,
          columns: f.columns as string[] || undefined,
          predefinedRows: f.predefinedRows as string[] || undefined,
          columnTypes: f.columnTypes as any || undefined,
          columnOptions: f.columnOptions as any || undefined,
          allowOther: f.allowOther !== null ? f.allowOther : undefined,
          multiple: f.multiple !== null ? f.multiple : undefined,
          validation: f.validation as any,
          order: f.fieldOrder
        })),
        submissions: submissionsList.map(s => ({
          id: s.id,
          userEmail: s.userEmail,
          submittedAt: s.submittedAt,
          data: s.data as any,
          userCountry: s.userCountry || undefined,
          userRegion: s.userRegion || undefined
        })),
        notifications: notificationsList.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          timestamp: n.timestamp,
          read: n.read,
          type: n.type as any
        })),
        reports: reportsList.map(r => ({
          id: r.id,
          generatedAt: r.generatedAt,
          title: r.title,
          content: r.content,
          submissionsCount: r.submissionsCount
        })),
        googleDriveUrl: googleDriveUrlVal[0]?.value || undefined
      };
    });
  } catch (error) {
    console.error("❌ Error in getDBAsync after retries:", error);
    // Retornar estructura por defecto en caso de un error de lectura
    return {
      users: [],
      formFields: [],
      submissions: [],
      notifications: [],
      reports: []
    };
  }
}

// Guarda asíncronamente todos los datos de vuelta a Cloud SQL dentro de una transacción atómica con reintentos
export async function saveDBAsync(newDb: DBStructure) {
  try {
    await withRetry(async () => {
      await db.transaction(async (tx) => {
        // 1. Campos de formulario
        if (newDb.formFields) {
          await tx.delete(formFields);
          const validFields = newDb.formFields
            .filter(f => f && f.id && f.label && f.type)
            .map(f => ({
              id: f.id,
              label: f.label,
              type: f.type,
              placeholder: f.placeholder || null,
              description: f.description || null,
              required: !!f.required,
              options: f.options || null,
              columns: f.columns || null,
              predefinedRows: f.predefinedRows || null,
              columnTypes: (f as any).columnTypes || null,
              columnOptions: (f as any).columnOptions || null,
              allowOther: (f as any).allowOther !== undefined ? !!(f as any).allowOther : false,
              multiple: (f as any).multiple !== undefined ? !!(f as any).multiple : false,
              validation: f.validation || { required: !!f.required },
              fieldOrder: typeof f.order === "number" ? f.order : 0
            }));
          if (validFields.length > 0) {
            await tx.insert(formFields).values(validFields).onConflictDoNothing();
          }
        }

        // 2. Usuarios
        if (newDb.users) {
          await tx.delete(users);
          const validUsers = newDb.users
            .filter(u => u && u.email && u.name && u.role)
            .map(u => ({
              email: u.email.toLowerCase().trim(),
              name: u.name,
              password: u.password || null,
              role: u.role,
              country: u.country || null,
              region: u.region || null,
              archived: !!u.archived,
              driveUrl: u.driveUrl || null,
              geographicGroup: u.geographicGroup || null
            }));
          if (validUsers.length > 0) {
            await tx.insert(users).values(validUsers).onConflictDoNothing();
          }
        }

        // 3. Respuestas / Submissions
        if (newDb.submissions) {
          await tx.delete(submissions);
          const validSubmissions = newDb.submissions
            .filter(s => s && s.id && s.userEmail && s.data)
            .map(s => ({
              id: s.id,
              userEmail: s.userEmail,
              submittedAt: s.submittedAt || new Date().toISOString(),
              data: s.data || {},
              userCountry: s.userCountry || null,
              userRegion: s.userRegion || null
            }));

          if (validSubmissions.length > 0) {
            // Cortar en bloques pequeños si hay demasiados (por límite de parámetros de pg)
            const batchSize = 100;
            for (let i = 0; i < validSubmissions.length; i += batchSize) {
              const batch = validSubmissions.slice(i, i + batchSize);
              await tx.insert(submissions).values(batch).onConflictDoNothing();
            }
          }
        }

        // 4. Notificaciones
        if (newDb.notifications) {
          await tx.delete(notifications);
          const validNotifications = newDb.notifications
            .filter(n => n && n.id && n.title && n.message)
            .map(n => ({
              id: n.id,
              title: n.title,
              message: n.message,
              timestamp: n.timestamp || new Date().toISOString(),
              read: !!n.read,
              type: n.type || "info"
            }));

          if (validNotifications.length > 0) {
            const batchSize = 100;
            for (let i = 0; i < validNotifications.length; i += batchSize) {
              const batch = validNotifications.slice(i, i + batchSize);
              await tx.insert(notifications).values(batch).onConflictDoNothing();
            }
          }
        }

        // 5. Reportes
        if (newDb.reports) {
          await tx.delete(reports);
          const validReports = newDb.reports
            .filter(r => r && r.id && r.title && r.content)
            .map(r => ({
              id: r.id,
              generatedAt: r.generatedAt || new Date().toISOString(),
              title: r.title,
              content: r.content,
              submissionsCount: typeof r.submissionsCount === "number" ? r.submissionsCount : 0
            }));

          if (validReports.length > 0) {
            await tx.insert(reports).values(validReports).onConflictDoNothing();
          }
        }

        // 6. Settings
        await tx.delete(settings);
        if (newDb.googleDriveUrl) {
          await tx.insert(settings).values({ key: "googleDriveUrl", value: newDb.googleDriveUrl }).onConflictDoNothing();
        }
      });
    });

    // Sincronizar también con server-db.json para que los reinicios no reviertan cambios
    try {
      if (fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(newDb, null, 2), "utf-8");
      }
    } catch (fileErr) {
      console.error("⚠️ Error writing updated DB to server-db.json:", fileErr);
    }
  } catch (error) {
    console.error("❌ Error in saveDBAsync after retries:", error);
  }
}

// Necesario importar eq de drizzle-orm para settings


