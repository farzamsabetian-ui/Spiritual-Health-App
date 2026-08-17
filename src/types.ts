/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FormFieldType = 'text' | 'number' | 'email' | 'select' | 'textarea' | 'checkbox' | 'section' | 'date' | 'table' | 'list' | 'boolean_justify';

export interface FormFieldValidation {
  required: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  errorMessage?: string;
}

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  description?: string;
  required: boolean;
  options?: string[]; // Para tipo 'select'
  allowOther?: boolean; // Permitir opción 'Otro' en tipo 'select'
  multiple?: boolean; // Permitir selección múltiple en tipo 'select'
  columns?: string[]; // Para tipo 'table'
  columnTypes?: Record<string, 'text' | 'number' | 'checkbox' | 'select'>; // Tipo para cada subcolumna de la tabla
  columnOptions?: Record<string, string[]>; // Opciones de menú si la subcolumna es tipo 'select'
  predefinedRows?: string[]; // Para tipo 'table' con filas predefinidas
  dateRenderMode?: 'picker' | 'dropdown'; // Estilo de presentación para campos de fecha
  validation: FormFieldValidation;
  order: number;
}

export interface Submission {
  id: string;
  userEmail: string;
  submittedAt: string;
  data: Record<string, any>;
  userCountry?: string;
  userRegion?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'success' | 'info' | 'warning';
}

export interface GeminiReport {
  id: string;
  generatedAt: string;
  title: string;
  content: string; // Markdown con el análisis de IA
  submissionsCount: number;
}

export interface UserSession {
  email: string;
  role: 'admin' | 'user' | 'auditor' | 'health_team';
  name?: string;
  country?: string;
  region?: string;
  driveUrl?: string;
  geographicGroup?: string;
}
