import { pgTable, serial, text, boolean, integer, jsonb } from "drizzle-orm/pg-core";

// Tabla para usuarios
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password"),
  role: text("role").notNull(), // "admin" | "user" | "auditor"
  country: text("country"),
  region: text("region"),
  archived: boolean("archived").default(false),
  driveUrl: text("drive_url"),
  geographicGroup: text("geographic_group"),
});

// Tabla para campos dinámicos de formularios
export const formFields = pgTable("form_fields", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  type: text("type").notNull(), // "text" | "number" | "email" | "select" | "textarea" | "checkbox" | "section" | "date" | "table"
  placeholder: text("placeholder"),
  description: text("description"),
  required: boolean("required").notNull(),
  options: jsonb("options"), // Array de strings
  columns: jsonb("columns"), // Array de strings (para tablas)
  predefinedRows: jsonb("predefined_rows"), // Array de strings (para tablas)
  columnTypes: jsonb("column_types"), // Tipo para cada subcolumna de la tabla (Record)
  columnOptions: jsonb("column_options"), // Opciones para subcolumnas select (Record)
  allowOther: boolean("allow_other").default(false),
  multiple: boolean("multiple").default(false),
  validation: jsonb("validation").notNull(), // Objeto de validación
  fieldOrder: integer("field_order").notNull(),
});

// Tabla para las respuestas enviadas (submissions)
export const submissions = pgTable("submissions", {
  id: text("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  submittedAt: text("submitted_at").notNull(),
  data: jsonb("data").notNull(), // Objeto JSON flexible
  userCountry: text("user_country"),
  userRegion: text("user_region"),
});

// Tabla para notificaciones
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  timestamp: text("timestamp").notNull(),
  read: boolean("read").notNull().default(false),
  type: text("type").notNull(), // "success" | "info" | "warning"
});

// Tabla para reportes de IA
export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  generatedAt: text("generated_at").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  submissionsCount: integer("submissions_count").notNull(),
});

// Tabla de configuraciones del sistema (por ejemplo, fondos personalizados)
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
