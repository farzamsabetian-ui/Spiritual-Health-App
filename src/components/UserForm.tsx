/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FormField, UserSession } from "../types";
import { ClipboardList, AlertCircle, CheckCircle, RefreshCcw, Send, Plus, Trash2, Globe, User, LogOut, ChevronDown, Sun, Moon, HelpCircle, ChevronLeft, ChevronRight, Sparkles, BookOpen, Info, Calendar, ExternalLink, ArrowRight, Printer, Download } from "lucide-react";
import RegionalStatsDashboard from "./RegionalStatsDashboard";

interface UserFormProps {
  user: UserSession;
  onLogout: () => void;
  onTabChange?: (tab: string) => void;
  theme?: string;
  toggleTheme?: () => void;
  resetHomeTrigger?: number;
}

export default function UserForm({ user, onLogout, onTabChange, theme, toggleTheme, resetHomeTrigger }: UserFormProps) {
  const [activeTab, setActiveTab] = useState<"inicio" | "form" | "stats">("inicio");

  useEffect(() => {
    if (resetHomeTrigger !== undefined && resetHomeTrigger > 0) {
      setActiveTab("inicio");
    }
  }, [resetHomeTrigger]);

  useEffect(() => {
    onTabChange?.(activeTab);
  }, [activeTab, onTabChange]);
  const [fields, setFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const formDataRef = React.useRef(formData);
  formDataRef.current = formData;
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null);
  const [listInputs, setListInputs] = useState<Record<string, string>>({});
  const [customOptionInputs, setCustomOptionInputs] = useState<Record<string, string>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [unfilledFields, setUnfilledFields] = useState<string[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  // Nuevos estados para usabilidad y experiencia de usuario mejorada
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const [showDraftNotice, setShowDraftNotice] = useState<boolean>(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState<boolean>(false);

  // Estados para validación de coincidencia de cantidad de asambleas (field_1782063375445)
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [isMatchConflictModalOpen, setIsMatchConflictModalOpen] = useState<boolean>(false);
  const [pendingLsaCountValue, setPendingLsaCountValue] = useState<string>("");
  const [conflictingSubmissions, setConflictingSubmissions] = useState<any[]>([]);
  const [syncingLsa, setSyncingLsa] = useState<boolean>(false);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [globalDriveUrl, setGlobalDriveUrl] = useState<string>("https://drive.google.com/drive/u/2/folders/1z_9-wzWzxn3sWjtMZ88kgyGZnkpskWn_");

  // Obtener URL global de Google Drive del servidor
  useEffect(() => {
    fetch("/api/get-drive-url")
      .then(res => res.json())
      .then(data => {
        if (data && data.url) {
          setGlobalDriveUrl(data.url);
        }
      })
      .catch(err => console.error("Error al obtener la URL global de Google Drive:", err));
  }, []);

  // Obtener campos de formulario actualizados del servidor y respuestas previas
  useEffect(() => {
    fetchFormFields();
    fetchMySubmissions();
    fetchUsers();
  }, [user.email]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setDbUsers(data);
      }
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    }
  };

  const fetchMySubmissions = async () => {
    try {
      const res = await fetch("/api/form/submissions");
      if (res.ok) {
        const data = await res.json();
        setAllSubmissions(data);
        try {
          localStorage.setItem("validaform_submissions", JSON.stringify(data));
        } catch (err) {
          console.error("Error al guardar submissions en localStorage:", err);
        }
        const mine = data.filter((s: any) => s.userEmail.toLowerCase() === user.email.toLowerCase());
        setMySubmissions(mine);
      }
    } catch (e) {
      console.error("Error al obtener respuestas previas:", e);
    }
  };

  // Agrupar dinámicamente los campos en secciones o pasos lógicos
  const formSteps = React.useMemo(() => {
    if (!fields || fields.length === 0) return [];
    
    const steps: { title: string; description?: string; fields: FormField[] }[] = [];
    let currentStep: { title: string; description?: string; fields: FormField[] } = {
      title: "Información General",
      fields: []
    };
    
    fields.forEach(field => {
      if (field.type === "section") {
        if (currentStep.fields.length > 0) {
          steps.push(currentStep);
        }
        currentStep = {
          title: field.label || "Sección",
          description: field.description,
          fields: []
        };
      } else {
        currentStep.fields.push(field);
      }
    });
    
    if (currentStep.fields.length > 0) {
      steps.push(currentStep);
    }
    
    return steps;
  }, [fields]);

  // Guardar borrador automáticamente al cambiar los datos del formulario (excepto si estamos editando un envío existente)
  useEffect(() => {
    if (!editingSubmissionId && formData && Object.keys(formData).length > 0 && !loading) {
      const draftKey = `validaform_draft_${user.email}`;
      localStorage.setItem(draftKey, JSON.stringify(formData));
    }
  }, [formData, editingSubmissionId, loading, user.email]);

  const handleClearDraft = () => {
    const draftKey = `validaform_draft_${user.email}`;
    localStorage.removeItem(draftKey);
    setShowDraftNotice(false);
    fetchFormFields();
  };

  // Validar el paso actual del formulario antes de avanzar
  const validateCurrentStep = (): boolean => {
    const currentStep = formSteps[activeStepIdx];
    if (!currentStep) return true;
    
    const errors: Record<string, string> = {};
    let hasErrors = false;
    const missingFields: string[] = [];
    
    currentStep.fields.forEach(field => {
      const value = formData[field.id];
      const errorMsg = validateField(field, value);
      if (errorMsg) {
        errors[field.id] = errorMsg;
        hasErrors = true;
        missingFields.push(field.label);
      }
    });
    
    setValidationErrors(prev => ({
      ...prev,
      ...errors
    }));
    
    if (hasErrors) {
      setUnfilledFields(missingFields);
      const firstErrorFieldId = currentStep.fields.find(f => errors[f.id])?.id;
      if (firstErrorFieldId) {
        const element = document.getElementById(`form_field_wrapper_${firstErrorFieldId}`) || document.getElementById(firstErrorFieldId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return false;
    }
    
    // Limpiar errores para el paso actual si todo está correcto
    setUnfilledFields([]);
    setValidationErrors(prev => {
      const nextErrors = { ...prev };
      currentStep.fields.forEach(f => {
        delete nextErrors[f.id];
      });
      return nextErrors;
    });
    
    return true;
  };

  const isFechaField = (f: FormField) => f.type === "date" || (f.label && f.label.toLowerCase() === "fecha");

  const formatSpanishTextToDate = (text: string): string => {
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
  };

  const getActiveDriveUrl = () => {
    const foundUser = dbUsers.find(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (foundUser && foundUser.driveUrl) {
      return foundUser.driveUrl;
    }
    if (user.driveUrl) {
      return user.driveUrl;
    }
    return globalDriveUrl;
  };

  const formatDateToSpanishText = (dateStr: string): string => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length >= 2) {
      const year = parts[0];
      const month = parseInt(parts[1], 10);
      const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
      ];
      if (month >= 1 && month <= 12) {
        return `${months[month - 1]} ${year}`;
      }
    }
    return dateStr;
  };

  const getSubmissionLabel = (s: any) => {
    // 1. Buscamos campos de tipo "date" o que se llamen "Fecha" y usamos su valor
    const dateField = fields.find(isFechaField);
    if (dateField) {
      const val = s.data[dateField.id];
      if (val) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(String(val))) {
          return `Registro del ${formatDateToSpanishText(String(val))}`;
        }
        // Formatear si es un mes en formato YYYY-MM
        if (dateField.type === "date" && dateField.dateRenderMode === "dropdown") {
          const parts = String(val).split("-");
          if (parts.length === 2 && parts[0] && parts[1]) {
            const months = [
              "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
              "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
            ];
            const mIdx = parseInt(parts[1], 10) - 1;
            if (mIdx >= 0 && mIdx < 12) {
              return `Registro del ${months[mIdx]} de ${parts[0]}`;
            }
          }
        }
        return `Registro del ${val}`;
      }
    }
    // 2. Fallback con la fecha de finalización o presentación si está disponible
    if (s.submittedAt) {
      try {
        const d = new Date(s.submittedAt);
        return `Registro del ${d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`;
      } catch (e) {
        return `Registro del ${s.submittedAt}`;
      }
    }
    if (s.createdAt) {
      try {
        const d = new Date(s.createdAt);
        return `Registro del ${d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`;
      } catch (e) {
        return `Registro del ${s.createdAt}`;
      }
    }
    return `Registro #${String(s.id).substring(0, 8)}`;
  };

  const handleSelectSubmissionById = (subId: string) => {
    if (!subId) {
      handleResetForm();
      return;
    }
    const found = mySubmissions.find(s => s.id === subId);
    if (found) {
      setEditingSubmissionId(found.id);
      // Clonar datos completos cargandolos en el formulario
      const loadedData = { ...found.data };
      // Normalizar L8 a Libro 8
      Object.keys(loadedData).forEach(key => {
        if (Array.isArray(loadedData[key])) {
          loadedData[key] = loadedData[key].map((row: any) => {
            if (row && row._rowLabel === "L8") {
              return { ...row, _rowLabel: "Libro 8" };
            }
            return row;
          });
        }
      });
      setFormData(loadedData);
      setUnfilledFields([]);
      setValidationErrors({});
      setSubmitError(null);
    }
  };


  const fetchFormFields = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/form/fields");
      if (!res.ok) throw new Error("No se pudo cargar la estructura del formulario.");
      let data: FormField[] = await res.json();
      
      // Sincronizar con almacenamiento local para garantizar que nunca se regrese a las preguntas por defecto
      const localSaved = localStorage.getItem("validaform_custom_fields");
      if (res.ok && data && data.length > 0) {
        // Si el servidor nos dio campos frescos y válidos, actualicemos el localStorage para estar al día
        localStorage.setItem("validaform_custom_fields", JSON.stringify(data));
      } else if (localSaved) {
        try {
          const parsed = JSON.parse(localSaved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            data = parsed;
          }
        } catch (e) {
          console.error("Error al decodificar campos locales guardados:", e);
        }
      }

      setFields(data);
      
      // Inicializar el estado de respuestas autocompletando país y región si existen
      const initialData: Record<string, any> = {};
      data.forEach(f => {
        if (f.type !== "section") {
          const labelLower = (f.label || "").toLowerCase();
          if (labelLower.includes("país") || labelLower.includes("pais") || labelLower.includes("country")) {
            initialData[f.id] = user.country || "";
          } else if (labelLower.includes("región") || labelLower.includes("region") || labelLower.includes("estado") || labelLower.includes("state")) {
            initialData[f.id] = user.region || "";
          } else {
            if (f.type === "checkbox") {
              initialData[f.id] = f.options && f.options.length > 0 ? [] : false;
            } else if (f.type === "select" && f.multiple) {
              initialData[f.id] = [];
            } else if (f.type === "list") {
              initialData[f.id] = [];
            } else if (f.type === "boolean_justify") {
              initialData[f.id] = { answer: "", justification: "" };
            } else if (f.type === "table") {
              if (f.predefinedRows && f.predefinedRows.length > 0) {
                initialData[f.id] = f.predefinedRows.map(rowLabel => {
                  const rowObj: any = { _rowLabel: rowLabel };
                  (f.columns || ["Columna 1"]).forEach(col => {
                    const colType = f.columnTypes?.[col] || "text";
                    rowObj[col] = colType === "checkbox" ? false : "";
                  });
                  return rowObj;
                });
              } else {
                initialData[f.id] = [];
              }
            } else {
              initialData[f.id] = "";
            }
          }
        }
      });
      // Comprobar si existe un borrador guardado localmente para recuperar la sesión
      const draftKey = `validaform_draft_${user.email}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          if (parsedDraft && typeof parsedDraft === "object" && Object.keys(parsedDraft).length > 0) {
            setFormData({ ...initialData, ...parsedDraft });
            setShowDraftNotice(true);
            return;
          }
        } catch (e) {
          console.error("Error al decodificar borrador:", e);
        }
      }
      setFormData(initialData);
    } catch (err: any) {
      setSubmitError(err.message || "Fallo técnico al recuperar los campos.");
    } finally {
      setLoading(false);
    }
  };

  // Validaciones del lado del cliente
  const validateField = (field: FormField, value: any): string => {
    if (field.type === "section") return "";
    
    if (field.type === "boolean_justify") {
      const valObj = value as { answer?: string; justification?: string } | undefined;
      const ans = valObj?.answer || "";
      if (field.required && !ans) {
        return `El campo '${field.label}' es obligatorio (selecciona Sí o No).`;
      }
      if (ans === "Sí") {
        if (!valObj?.justification || valObj.justification.trim() === "") {
          if (field.id === "field_1781900513250") {
            return `Debes especificar una cantidad válida en '${field.label}'.`;
          }
          return `Debes especificar por qué respondiste 'Sí' en '${field.label}'.`;
        }
        if (field.id === "field_1781900513250") {
          const num = Number(valObj.justification);
          if (isNaN(num) || num < 0) {
            return `La respuesta en '${field.label}' debe ser un número mayor o igual a 0.`;
          }
        }
      }
      return "";
    }

    if (field.type === "table") {
      if (field.required && (!Array.isArray(value) || value.length === 0)) {
        return `La tabla '${field.label}' debe contener al menos una fila.`;
      }
      if (Array.isArray(value)) {
        let hasEmptyCell = false;
        let hasEmptySelect = false;
        const selectCols = field.columnTypes 
          ? Object.keys(field.columnTypes).filter(col => field.columnTypes?.[col] === "select")
          : [];
        const columnsToCheck = field.columns || [];

        for (let rIdx = 0; rIdx < value.length; rIdx++) {
          const row = value[rIdx];
          for (const col of columnsToCheck) {
            const colType = field.columnTypes?.[col] || "text";
            if (colType !== "checkbox") {
              const cellValue = row[col];
              if (cellValue === undefined || cellValue === null || String(cellValue).trim() === "") {
                if (colType === "select") {
                  hasEmptySelect = true;
                } else {
                  hasEmptyCell = true;
                }
              }
            }
          }
        }

        if (field.required && (hasEmptySelect || hasEmptyCell)) {
          if (hasEmptySelect && !hasEmptyCell) {
            return `Uno de estos desplegables tiene información faltante y no se puede continuar sin ella. Por favor, selecciona una opción en cada campo.`;
          }
          return `Uno o más campos de la tabla tienen información faltante y no se puede continuar sin ella. Por favor, rellena todos los campos requeridos.`;
        }
      }
      return "";
    }

    if (field.type === "date") {
      if (field.dateRenderMode === "dropdown") {
        const parts = String(value || "").split("-");
        const year = parts[0] || "";
        const month = parts[1] || "";
        
        const hasAny = year !== "" || month !== "";
        const hasAll = year !== "" && month !== "";
        
        if (field.required && !hasAll) {
          return `La fecha '${field.label}' es obligatoria y debe seleccionarse completa (mes y año).`;
        }
        if (hasAny && !hasAll) {
          return `La fecha '${field.label}' está incompleta. Debes completar mes y año.`;
        }
        return "";
      } else {
        if (field.required && (!value || String(value).trim() === "")) {
          return `La fecha '${field.label}' es obligatoria.`;
        }
        return "";
      }
    }

    const isPresent = value !== undefined && 
                      value !== null && 
                      value !== "" && 
                      value !== "__OTHER__" &&
                      (!Array.isArray(value) || value.length > 0) && 
                      value !== false;
    
    if (field.required && !isPresent) {
      return `El campo '${field.label}' es obligatorio.`;
    }

    if (isPresent) {
      if (field.type === "text" || field.type === "textarea") {
        if (field.validation?.minLength && String(value).length < field.validation.minLength) {
          return `Debe tener al menos ${field.validation.minLength} caracteres.`;
        }
        if (field.validation?.maxLength && String(value).length > field.validation.maxLength) {
          return `No debe exceder los ${field.validation.maxLength} caracteres.`;
        }
      }
      if (field.type === "number") {
        const num = Number(value);
        if (isNaN(num)) {
          return "Debe ser un número válido.";
        }
        if (field.validation?.min !== undefined && num < field.validation.min) {
          return `El valor minimo es ${field.validation.min}.`;
        }
        if (field.validation?.max !== undefined && num > field.validation.max) {
          return `El valor máximo es ${field.validation.max}.`;
        }
      }
      if (field.type === "email" && field.validation?.pattern) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(String(value))) {
          return field.validation.errorMessage || "Formato de correo electrónico inválido.";
        }
      }
    }
    return "";
  };

  const handleInputChange = (field: FormField, val: any) => {
    let nextFormData = { ...formData, [field.id]: val };
    let nextEditingSubmissionId = editingSubmissionId;

    // Si es un campo fecha o se llama "Fecha", buscar si hay coincidencia para este usuario y esa fecha específica
    if (isFechaField(field)) {
      let isComplete = false;
      if (field.type === "date" && field.dateRenderMode === "dropdown") {
        const parts = String(val || "").split("-");
        const year = parts[0] || "";
        const month = parts[1] || "";
        isComplete = year !== "" && month !== "";
      } else {
        isComplete = val !== undefined && val !== null && String(val).trim() !== "";
      }

      if (isComplete) {
        const existingSub = mySubmissions.find((s: any) => {
          const sVal = s.data[field.id];
          if (!sVal) return false;
          return sVal === val || formatSpanishTextToDate(sVal) === formatSpanishTextToDate(val);
        });
        if (existingSub) {
          nextEditingSubmissionId = existingSub.id;
          // Cargar los campos guardados de la respuesta anterior, pero manteniendo
          // el valor de la fecha seleccionada que acabamos de recibir
          nextFormData = { ...existingSub.data, [field.id]: val };
        } else {
          // Si antes estábamos editando y ahora seleccionamos una fecha sin registros
          if (editingSubmissionId !== null) {
            nextEditingSubmissionId = null;
            // Resetear campos a su valor inicial para evitar conservar datos del registro anterior
            const initialData: Record<string, any> = {};
            fields.forEach(f => {
              if (f.type !== "section") {
                const labelLower = (f.label || "").toLowerCase();
                if (labelLower.includes("país") || labelLower.includes("pais") || labelLower.includes("country")) {
                  initialData[f.id] = user.country || "";
                } else if (labelLower.includes("región") || labelLower.includes("region") || labelLower.includes("estado") || labelLower.includes("state")) {
                  initialData[f.id] = user.region || "";
                } else {
                  if (f.type === "checkbox") {
                    initialData[f.id] = f.options && f.options.length > 0 ? [] : false;
                  } else if (f.type === "select" && f.multiple) {
                    initialData[f.id] = [];
                  } else if (f.type === "list") {
                    initialData[f.id] = [];
                  } else if (f.type === "boolean_justify") {
                    initialData[f.id] = { answer: "", justification: "" };
                  } else if (f.type === "table") {
                    if (f.predefinedRows && f.predefinedRows.length > 0) {
                      initialData[f.id] = f.predefinedRows.map(rowLabel => {
                        const rowObj: any = { _rowLabel: rowLabel };
                        (f.columns || ["Columna 1"]).forEach(col => {
                          const colType = f.columnTypes?.[col] || "text";
                          rowObj[col] = colType === "checkbox" ? false : "";
                        });
                        return rowObj;
                      });
                    } else {
                      initialData[f.id] = [];
                    }
                  } else if (isFechaField(f)) {
                    initialData[f.id] = f.id === field.id ? val : "";
                  } else {
                    initialData[f.id] = "";
                  }
                }
              }
            });
            nextFormData = initialData;
          }
        }
      } else {
        if (editingSubmissionId !== null) {
          nextEditingSubmissionId = null;
        }
      }
    }

    setFormData(nextFormData);
    if (nextEditingSubmissionId !== editingSubmissionId) {
      setEditingSubmissionId(nextEditingSubmissionId);
    }

    // Validar en tiempo real
    const errorMsg = validateField(field, val);
    setValidationErrors(prev => ({
      ...prev,
      [field.id]: errorMsg
    }));
  };

  // Función para evaluar si el valor de un campo coincide con los de otros usuarios
  const areValuesEqual = (val1: any, val2: any) => {
    if (val1 === val2) return true;
    if (val1 === undefined || val1 === null || val2 === undefined || val2 === null) {
      const isEmpty1 = val1 === undefined || val1 === null || String(val1).trim() === "";
      const isEmpty2 = val2 === undefined || val2 === null || String(val2).trim() === "";
      return isEmpty1 && isEmpty2;
    }
    if (Array.isArray(val1) && Array.isArray(val2)) {
      if (val1.length !== val2.length) return false;
      return val1.every((row1, idx) => {
        const row2 = val2[idx];
        if (!row2) return false;
        const keys = Array.from(new Set([...Object.keys(row1), ...Object.keys(row2)]));
        return keys.every(key => {
          if (key === "_rowLabel") return String(row1[key]).trim() === String(row2[key]).trim();
          const v1 = row1[key];
          const v2 = row2[key];
          if (v1 === v2) return true;
          if (Number(v1) === Number(v2) && !isNaN(Number(v1)) && !isNaN(Number(v2))) return true;
          return String(v1 || "").trim() === String(v2 || "").trim();
        });
      });
    }
    if (Number(val1) === Number(val2) && !isNaN(Number(val1)) && !isNaN(Number(val2))) return true;
    return String(val1).trim() === String(val2).trim();
  };

  const checkFieldMatchAndReturnStatus = (fieldId: string, enteredVal: any, currentFormData: any = formDataRef.current) => {
    if (enteredVal === undefined || enteredVal === null) return null;
    if (typeof enteredVal === "string" && enteredVal.trim() === "") return null;
    if (Array.isArray(enteredVal) && enteredVal.length === 0) return null;

    const fechaField = fields.find(f => f.type === "date" || (f.label && f.label.toLowerCase() === "fecha"));
    if (!fechaField) return null;

    const selectedDate = currentFormData[fechaField.id];
    if (!selectedDate) return null;

    const myCountry = user.country;
    const myRegion = user.region;

    // Filtrar otras submissions
    const otherSubmissions = allSubmissions.filter((sub: any) => {
      // Excluir la propia respuesta del usuario actual
      if (sub.userEmail.toLowerCase() === user.email.toLowerCase()) return false;

      // Comparar fecha
      const subDate = sub.data[fechaField.id];
      if (!subDate) return false;
      if (formatSpanishTextToDate(String(subDate)) !== formatSpanishTextToDate(String(selectedDate))) return false;

      // Comparar geografía: mismo país
      const sameCountry = sub.userCountry && myCountry && sub.userCountry.toLowerCase() === myCountry.toLowerCase();
      if (!sameCountry) return false;

      // Comparar región si el usuario actual tiene región
      if (myRegion && myRegion.trim() !== "") {
        const sameRegion = sub.userRegion && sub.userRegion.toLowerCase() === myRegion.toLowerCase();
        if (!sameRegion) return false;
      }

      // Verificar si la otra submission tiene valor
      const otherVal = sub.data[fieldId];
      if (otherVal === undefined || otherVal === null) return false;
      if (typeof otherVal === "string" && otherVal.trim() === "") return false;
      if (Array.isArray(otherVal) && otherVal.length === 0) return false;
      return true;
    });

    if (otherSubmissions.length === 0) {
      return { allMatch: true, otherSubmissions: [] };
    }

    const allMatch = otherSubmissions.every((sub: any) => {
      const otherVal = sub.data[fieldId];
      return areValuesEqual(enteredVal, otherVal);
    });
    return { allMatch, otherSubmissions };
  };

  const [currentConflict, setCurrentConflict] = useState<{
    fieldId: string;
    fieldLabel: string;
    enteredValue: any;
    otherSubmissions: any[];
  } | null>(null);

  const checkLsaCountMatch = (fieldId: string, enteredVal: any, currentFormData: any = formDataRef.current) => {
    const matchStatus = checkFieldMatchAndReturnStatus(fieldId, enteredVal, currentFormData);
    if (matchStatus && !matchStatus.allMatch) {
      const fieldObj = fields.find(f => f.id === fieldId);
      setCurrentConflict({
        fieldId,
        fieldLabel: fieldObj ? fieldObj.label : "Campo",
        enteredValue: enteredVal,
        otherSubmissions: matchStatus.otherSubmissions
      });
      return false; // Conflicto detectado
    }
    return true; // No hay conflicto
  };

  const handleConfirmRewriteLsa = async () => {
    if (!currentConflict) return;
    setSyncingLsa(true);
    try {
      const fechaField = fields.find(f => f.type === "date" || (f.label && f.label.toLowerCase() === "fecha"));
      const selectedDate = fechaField ? formData[fechaField.id] : "";

      const response = await fetch("/api/form/submissions/sync-lsa-count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: user.country || "",
          region: user.region || "",
          date: selectedDate,
          lsaCountValue: currentConflict.enteredValue,
          userEmail: user.email,
          fieldId: currentConflict.fieldId
        })
      });

      if (response.ok) {
        await fetchMySubmissions();
        setCurrentConflict(null);
      } else {
        const errData = await response.json();
        console.error("Error al sincronizar campo:", errData.error);
        alert("Error al sincronizar las respuestas de otros usuarios: " + errData.error);
      }
    } catch (err) {
      console.error("Error al sincronizar campo:", err);
      alert("Error de conexión al sincronizar respuestas.");
    } finally {
      setSyncingLsa(false);
    }
  };

  const handleCancelLsa = () => {
    if (currentConflict) {
      const targetField = fields.find(f => f.id === currentConflict.fieldId);
      if (targetField) {
        if (targetField.type === "table") {
          if (targetField.predefinedRows && targetField.predefinedRows.length > 0) {
            const otherVal = currentConflict.otherSubmissions[0]?.data[currentConflict.fieldId];
            if (otherVal) {
              handleInputChange(targetField, otherVal);
            } else {
              const emptyRows = targetField.predefinedRows.map(rowLabel => {
                const rowObj: any = { _rowLabel: rowLabel };
                (targetField.columns || ["Columna 1"]).forEach(col => {
                  const colType = targetField.columnTypes?.[col] || "text";
                  rowObj[col] = colType === "number" ? "" : (colType === "checkbox" ? false : "");
                });
                return rowObj;
              });
              handleInputChange(targetField, emptyRows);
            }
          } else {
            handleInputChange(targetField, []);
          }
        } else {
          const otherVal = currentConflict.otherSubmissions[0]?.data[currentConflict.fieldId];
          if (otherVal !== undefined) {
            handleInputChange(targetField, otherVal);
          } else {
            handleInputChange(targetField, "");
          }
        }
      }
    }
    setCurrentConflict(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setUnfilledFields([]);

    // Validar todos los campos antes de enviar
    const errors: Record<string, string> = {};
    const missingRequired: string[] = [];

    fields.forEach(field => {
      const fieldVal = formData[field.id];
      const err = validateField(field, fieldVal);
      if (err) {
        errors[field.id] = err;
      }

      if (field.required && field.type !== "section") {
        let isMissing = false;
        if (field.type === "table") {
          isMissing = !Array.isArray(fieldVal) || fieldVal.length === 0;
        } else if (field.type === "date" && field.dateRenderMode === "dropdown") {
          const parts = String(fieldVal || "").split("-");
          const year = parts[0] || "";
          const month = parts[1] || "";
          isMissing = year === "" || month === "";
        } else {
          const isPresent = fieldVal !== undefined && 
                            fieldVal !== null && 
                            fieldVal !== "" && 
                            fieldVal !== "__OTHER__" &&
                            (!Array.isArray(fieldVal) || fieldVal.length > 0) && 
                            fieldVal !== false;
          isMissing = !isPresent;
        }
        if (isMissing) {
          missingRequired.push(field.label);
        }
      }
    });

    if (missingRequired.length > 0) {
      setUnfilledFields(missingRequired);
      setValidationErrors(errors);
      setSubmitError("No se puede enviar el formulario porque hay campos obligatorios que no han sido rellenados.");
      return;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setSubmitError("Por favor, corrige los errores de validación antes de enviar.");
      return;
    }

    // Verificar discrepancias para las 5 secciones de AEL
    const conflictFields = [
      "field_1782063375445", // Asambleas Espirituales Locales (AEL)
      "field_1782063582212", // Espacios de estudio periódicos of Asambleas Locales
      "field_1782072026008", // Relatos de salud espiritual of Asambleas Locales
      "field_1782072087319", // Consultan regularmente
      "field_1782072119225"  // Líneas de acción
    ];

    for (const fId of conflictFields) {
      const val = formData[fId];
      if (val !== undefined && val !== null && val !== "" && (!Array.isArray(val) || val.length > 0)) {
        const isOk = checkLsaCountMatch(fId, val);
        if (!isOk) {
          const fieldObj = fields.find(f => f.id === fId);
          const label = fieldObj ? fieldObj.label : "Sección";
          setSubmitError(`Los datos ingresados en '${label}' no coinciden con las respuestas de otros miembros de su región. Por favor, resuelva el conflicto en la ventana emergente.`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/form/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: user.email,
          data: formData,
          submissionId: editingSubmissionId
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        if (resData.validationErrors) {
          setValidationErrors(resData.validationErrors);
        }
        throw new Error(resData.error || "Ocurrió un error al enviar el formulario.");
      }

      if (resData.submission) {
        try {
          const existingSubs = JSON.parse(localStorage.getItem("validaform_submissions") || "[]");
          const idx = existingSubs.findIndex((s: any) => s.id === resData.submission.id);
          if (idx !== -1) {
            existingSubs[idx] = resData.submission;
          } else {
            existingSubs.unshift(resData.submission);
          }
          localStorage.setItem("validaform_submissions", JSON.stringify(existingSubs));
        } catch (e) {
          console.error("Error saving submission to localStorage:", e);
        }
      }

      setSubmitted(true);
      // Borrar borrador y reiniciar el contador de pasos al enviar con éxito
      localStorage.removeItem(`validaform_draft_${user.email}`);
      setShowDraftNotice(false);
      setActiveStepIdx(0);
      fetchMySubmissions();
      // Disparar sincronización inmediata de estadísticas si el panel de control está montado en algún sitio
      window.dispatchEvent(new CustomEvent('trigger-dashboard-sync'));
    } catch (err: any) {
      setSubmitError(err.message || "Fallo en la conexión del servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmitted(false);
    setSubmitError(null);
    setUnfilledFields([]);
    setValidationErrors({});
    setEditingSubmissionId(null);
    const initialData: Record<string, any> = {};
    fields.forEach(f => {
      if (f.type !== "section") {
        const labelLower = (f.label || "").toLowerCase();
        if (labelLower.includes("país") || labelLower.includes("pais") || labelLower.includes("country")) {
          initialData[f.id] = user.country || "";
        } else if (labelLower.includes("región") || labelLower.includes("region") || labelLower.includes("estado") || labelLower.includes("state")) {
          initialData[f.id] = user.region || "";
        } else {
          if (f.type === "checkbox") {
            initialData[f.id] = f.options && f.options.length > 0 ? [] : false;
          } else if (f.type === "select" && f.multiple) {
            initialData[f.id] = [];
          } else if (f.type === "list") {
            initialData[f.id] = [];
          } else if (f.type === "boolean_justify") {
            initialData[f.id] = { answer: "", justification: "" };
          } else if (f.type === "table") {
            if (f.predefinedRows && f.predefinedRows.length > 0) {
              initialData[f.id] = f.predefinedRows.map(rowLabel => {
                const rowObj: any = { _rowLabel: rowLabel };
                (f.columns || ["Columna 1"]).forEach(col => {
                  const colType = f.columnTypes?.[col] || "text";
                  rowObj[col] = colType === "checkbox" ? false : "";
                });
                return rowObj;
              });
            } else {
              initialData[f.id] = [];
            }
          } else {
            initialData[f.id] = "";
          }
        }
      }
    });
    setFormData(initialData);
  };

  const hasDateFields = fields.some(isFechaField);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-12">
      <div className="w-full">

        <AnimatePresence mode="wait">
          {activeTab === "stats" && (user.role === "admin" || user.role === "auditor" || user.role === "health_team") ? (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <RegionalStatsDashboard user={user} />
            </motion.div>
          ) : activeTab === "inicio" ? (
            <motion.div
              key="inicio"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-6 md:py-16 text-center max-w-4xl mx-auto"
            >
              {/* Elegant Greeting & Intention */}
              <div className="max-w-2xl mb-12 space-y-4 flex flex-col items-center">
                {/* Elegant 9-pointed star vector symbol */}
                <div className="flex justify-center mb-6 text-[#5F756B] dark:text-[#8FA89B] opacity-85">
                  <svg
                    viewBox="0 0 100 100"
                    className="h-16 w-16 md:h-20 md:w-20 transition-all duration-500 hover:scale-[1.03]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="50" cy="50" r="44" strokeWidth="0.75" strokeDasharray="3 3" className="opacity-50" />
                    <circle cx="50" cy="50" r="41" strokeWidth="0.5" className="opacity-30" />
                    <polygon points="50,14 81.18,68 18.82,68" className="opacity-70" />
                    <polygon points="73.14,22.42 62.31,83.83 14.55,43.75" className="opacity-70" />
                    <polygon points="85.45,43.75 37.69,83.83 26.86,22.42" className="opacity-70" />
                  </svg>
                </div>

                <h1 className="text-3xl md:text-5xl font-serif text-[#3D3A37] dark:text-[#EAE5DF] font-semibold tracking-tight flex flex-col items-center">
                  <span className="text-2xl md:text-3xl text-[#5F756B] dark:text-[#8FA89B] font-light italic font-serif">
                    Alláh'u'Abhá
                  </span>
                  <span className="block mt-2 text-3xl md:text-5xl font-semibold">
                    {user.name || "Servidor"}
                  </span>
                </h1>
                <p className="text-sm md:text-base italic text-[#5F756B] dark:text-[#C5C0BA] font-serif leading-relaxed px-4 opacity-90 max-w-lg mx-auto">
                  "Las enseñanzas de Bahá’u’lláh proporcionan «los medios conducentes a la elevación, el progreso, la educación, la protección y la regeneración de los pueblos de la tierra»."
                </p>
              </div>

              {/* Balanced & Highly Integrated Premium Grid Action Deck for MCA */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="w-full max-w-4xl px-4 mt-8 mx-auto"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md mx-auto md:max-w-none">
                  
                  {/* Card 1: Spiritual Health Form */}
                  <button
                    onClick={() => setActiveTab("form")}
                    className="group flex flex-col justify-between p-6 sm:p-8 bg-white dark:bg-[#1C1917]/90 rounded-2xl border border-[#EAE5DF] dark:border-[#2D2A26] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer outline-none w-full text-left"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-full bg-[#8FA89B]/10 text-[#8FA89B] border border-[#8FA89B]/20 flex items-center justify-center transition-all duration-300 shrink-0 mb-6 group-hover:scale-105 group-hover:bg-[#8FA89B]/15">
                        <ClipboardList className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-sans font-bold text-[#3D3A37] dark:text-[#EAE5DF] tracking-tight transition-colors duration-300 leading-snug">
                        Encuesta de Salud Espiritual
                      </h3>
                      <p className="text-xs text-[#6B6661] dark:text-[#C5C0BA] mt-2 font-sans font-medium leading-relaxed">
                        Envía tu encuesta o consulta y actualiza tus registros anteriores de forma segura.
                      </p>
                    </div>
                    <div className="mt-6 w-full flex justify-end">
                      <span className="text-xs font-semibold text-[#8FA89B] font-sans flex items-center gap-1">
                        Acceder <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1.5 transition-transform duration-200" />
                      </span>
                    </div>
                  </button>

                  {/* Card 2: Guide Repository */}
                  <button
                    onClick={() => window.open(getActiveDriveUrl(), "_blank", "noopener,noreferrer")}
                    className="group flex flex-col justify-between p-6 sm:p-8 bg-white dark:bg-[#1C1917]/90 rounded-2xl border border-[#EAE5DF] dark:border-[#2D2A26] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer outline-none w-full text-left"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-full bg-[#8FA89B]/10 text-[#8FA89B] border border-[#8FA89B]/20 flex items-center justify-center transition-all duration-300 shrink-0 mb-6 group-hover:scale-105 group-hover:bg-[#8FA89B]/15">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-sans font-bold text-[#3D3A37] dark:text-[#EAE5DF] tracking-tight transition-colors duration-300 leading-snug">
                        Repositorio de Guía
                      </h3>
                      <p className="text-xs text-[#6B6661] dark:text-[#C5C0BA] mt-2 font-sans font-medium leading-relaxed">
                        Historias de salud espiritual, compilaciones de guía y cartas de consulta.
                      </p>
                    </div>
                    <div className="mt-6 w-full flex justify-end">
                      <span className="text-xs font-semibold text-[#8FA89B] font-sans flex items-center gap-1">
                        Acceder <ExternalLink className="h-4 w-4 transform group-hover:translate-x-1.5 transition-transform duration-200" />
                      </span>
                    </div>
                  </button>

                </div>
              </motion.div>
            </motion.div>
          ) : loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-64 flex-col items-center justify-center space-y-4 w-full"
            >
              <RefreshCcw className="h-8 w-8 animate-spin text-[#8FA89B] shadow-[0_0_15px_rgba(143,168,155,0.3)]" />
              <p className="text-sm text-slate-500">Cargando estructura activa del formulario...</p>
            </motion.div>
          ) : submitted ? (
            // Estado de Envío Exitoso
            <motion.div
              key="submitted"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center shadow-[0_0_15px_rgba(16,185,129,0.2)] w-full"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-white">¡Formulario Enviado con Éxito!</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Tus datos han sido validados correctamente en el servidor y almacenados en la base de datos empresarial de forma segura.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <button
                  id="print_submitted_form_btn"
                  onClick={() => window.print()}
                  className="flex items-center gap-2 rounded-lg bg-[#5F756B] hover:bg-[#3D3A37] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir / Descargar PDF del Envío
                </button>
                <button
                  id="new_entry_btn"
                  onClick={handleResetForm}
                  className="flex items-center gap-2 rounded-lg bg-[#8FA89B] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(143,168,155,0.4)] hover:bg-[#5F756B] transition-all active:scale-95"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Enviar otra respuesta
                </button>
              </div>
            </motion.div>
          ) : (
            // Visualización del Formulario Activo (Empaquetado en un contenedor Premium redondeado de 16px con Alabaster y Sage Green)
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="rounded-[16px] bg-[#FCFAF7]/85 backdrop-blur-md border border-[#EAE5DF]/60 p-8 md:p-12 lg:p-14 user-form-card w-full"
            >
          {/* Back button to sanctuary */}
          <div className="mb-8">
            <button
              type="button"
              onClick={() => setActiveTab("inicio")}
              className="group inline-flex items-center gap-2 text-xs font-semibold text-[#5F756B] hover:text-[#3D3A37] transition-all duration-200 cursor-pointer"
            >
              <span className="text-sm group-hover:-translate-x-0.5 transition-transform">←</span>
              <span>Volver al Inicio</span>
            </button>
          </div>

          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-[#F4EFEA] pb-6">
            <div className="flex items-start md:items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#8FA89B]/10 border border-[#8FA89B]/20 text-[#8FA89B] shadow-xs">
                <ClipboardList className="h-5.5 w-5.5" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold font-serif text-[#3D3A37] tracking-tight">Formulario de Salud Espiritual</h1>
                <p className="text-xs md:text-[13px] text-[#6B6661] mt-1 font-medium max-w-xl leading-relaxed">
                  Por favor rellene los campos listados con información verídica y respete las restricciones detalladas.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 self-stretch lg:self-center justify-start md:justify-end md:shrink-0 w-full lg:w-auto">
              {/* BOTÓN PARA IMPRIMIR O DESCARGAR EN PDF */}
              <button
                id="print_mca_form_btn"
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#5F756B] hover:bg-[#3D3A37] text-white text-xs font-serif font-semibold transition-all duration-200 shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-95 cursor-pointer whitespace-nowrap border border-transparent"
                title="Imprimir o guardar formulario en PDF"
              >
                <Printer className="h-4 w-4 text-[#8FA89B] shrink-0" />
                <span>Imprimir / Descargar PDF</span>
              </button>

              {/* BOTÓN DE GLOSARIO Y AYUDA */}
              <button
                type="button"
                onClick={() => setIsGlossaryOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#8FA89B]/10 hover:bg-[#8FA89B]/20 border border-[#8FA89B]/30 text-xs font-serif font-semibold text-[#5F756B] hover:text-[#3D3A37] transition-all duration-200 shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <HelpCircle className="h-4 w-4 text-[#5F756B] shrink-0" />
                <span>Ayuda y Glosario</span>
              </button>

              {/* SELECCIÓN DE ENTRADAS ANTERIORES PARA MODIFICAR */}
              {mySubmissions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-[#F4EFEA] border border-[#EAE5DF] text-xs font-serif font-semibold text-[#6B6661] hover:text-[#3D3A37] transition-all duration-200 shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <Calendar className="h-4 w-4 text-[#8FA89B] shrink-0" />
                  <span>Historial de Encuestas</span>
                </button>
              )}
            </div>
          </div>
          {/* POPUP MODAL CON EL MENÚ DE REGISTROS ANTERIORES */}
          {isHistoryModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3D3A37]/60 backdrop-blur-sm">
              <div className="relative w-full max-w-md rounded-2xl border border-[#EAE5DF] bg-[#FCFAF7] p-6 md:p-8 shadow-2xl space-y-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#8FA89B]/10 border border-[#8FA89B]/20 text-[#5F756B]">
                      <Calendar className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold font-serif text-[#3D3A37] tracking-tight">Historial de Encuestas</h4>
                      <p className="text-[11px] text-[#6B6661] mt-0.5 leading-relaxed font-medium">
                        Selecciona o modifica tus registros anteriores:
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsHistoryModalOpen(false)}
                    className="h-8 w-8 rounded-full border border-[#EAE5DF] flex items-center justify-center text-xs text-[#6B6661] hover:text-[#3D3A37] hover:bg-[#F4EFEA] cursor-pointer transition-all duration-250"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="flex flex-col gap-3">
                    <select
                      id="submission_history_select"
                      value={editingSubmissionId || ""}
                      onChange={(e) => {
                        handleSelectSubmissionById(e.target.value);
                        setIsHistoryModalOpen(false);
                      }}
                      className="w-full rounded-xl border border-[#EAE5DF] bg-white px-3.5 py-2.5 text-xs text-[#3D3A37] font-serif outline-none transition-all focus:border-[#8FA89B] focus:ring-1 focus:ring-[#8FA89B]"
                    >
                      <option value="" className="text-slate-400">-- Selecciona un registro existente por fecha --</option>
                      {mySubmissions.map((sub) => (
                        <option key={sub.id} value={sub.id} className="text-[#3D3A37] bg-white font-serif">
                          {getSubmissionLabel(sub)}
                        </option>
                      ))}
                    </select>

                    {editingSubmissionId && (
                      <button
                        id="cancel_editing_btn"
                        type="button"
                        onClick={() => {
                          handleSelectSubmissionById("");
                          setIsHistoryModalOpen(false);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FDF1F0] text-rose-700 border border-rose-100 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all text-xs font-serif font-semibold shrink-0 shadow-xs cursor-pointer"
                      >
                        Crear Nuevo Registro
                      </button>
                    )}
                  </div>

                  {/* Botones de selección rápida */}
                  <div className="space-y-2 pt-3 border-t border-[#F4EFEA]">
                    <span className="text-[10px] text-[#5F756B] font-serif font-bold block uppercase tracking-wider">Acceso rápido por fecha:</span>
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                      {mySubmissions.map((sub) => {
                        const isActive = editingSubmissionId === sub.id;
                        return (
                          <button
                            id={`quick_date_btn_${sub.id}`}
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              handleSelectSubmissionById(sub.id);
                              setIsHistoryModalOpen(false);
                            }}
                            className={`px-3 py-1.5 text-xs font-serif rounded-full border transition-all duration-200 cursor-pointer ${
                              isActive
                                ? "bg-[#5F756B] text-white border-[#5F756B] shadow-xs font-semibold"
                                : "bg-white text-[#6B6661] border-[#EAE5DF] hover:bg-[#F4EFEA] hover:text-[#3D3A37]"
                            }`}
                          >
                            {getSubmissionLabel(sub).replace("Registro del ", "")}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#F4EFEA]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsHistoryModalOpen(false);
                      window.print();
                    }}
                    className="px-4 py-2 rounded-full bg-[#5F756B] hover:bg-[#3D3A37] text-white text-xs font-serif font-semibold transition-all duration-250 cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Imprimir PDF Selección</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsHistoryModalOpen(false)}
                    className="px-5 py-2 rounded-full bg-white text-[#6B6661] hover:bg-[#F4EFEA] border border-[#EAE5DF] hover:text-[#3D3A37] text-xs font-serif font-semibold transition-all duration-250 cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL PARA ADVERTENCIA DE DISCREPANCIA EN LA CANTIDAD DE ASAMBLEAS Y OTROS CAMPOS */}
          {currentConflict && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3D3A37]/60 backdrop-blur-sm animate-fade-in">
              <div className="relative w-full max-w-xl rounded-xl border border-red-200 bg-white p-6 shadow-2xl space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 border border-red-200">
                      <AlertCircle className="h-6 w-6" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-950 uppercase tracking-wider">Discrepancia detectada</h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        Sección: <strong>{currentConflict.fieldLabel}</strong>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="rounded-lg bg-red-50/50 border border-red-100 p-4 space-y-2 text-xs text-slate-800 leading-relaxed">
                    <p className="font-semibold text-red-800">
                      Los datos ingresados en esta sección no coinciden con los registrados por otros Miembros del Cuerpo de Consejeros de su país/región.
                    </p>
                    <p>
                      Por favor, consulte con los otros miembros de su región para confirmar si su valor es el correcto.
                    </p>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Su valor ingresado:</span>
                      {(() => {
                        const val = currentConflict.enteredValue;
                        if (Array.isArray(val)) {
                          return (
                            <div className="text-[11px] space-y-1 bg-slate-100 p-2.5 rounded-lg border border-slate-200 mt-1 max-h-48 overflow-y-auto">
                              {val.map((row: any, rIdx: number) => {
                                const label = row._rowLabel || `Fila ${rIdx + 1}`;
                                const cols = Object.keys(row).filter((k) => k !== "_rowLabel");
                                return (
                                  <div key={rIdx} className="flex flex-col border-b border-slate-200 last:border-0 pb-1.5 last:pb-0 mb-1.5 last:mb-0">
                                    <span className="font-semibold text-slate-700">{label}</span>
                                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 mt-0.5">
                                      {cols.map((col) => (
                                        <span key={col} className="bg-white border border-slate-150 px-1.5 py-0.5 rounded shadow-xs">
                                          {col}: <strong className="text-slate-700">{row[col]}</strong>
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                        return <span className="font-bold text-slate-900 bg-red-100/50 border border-red-200 px-2.5 py-1 rounded inline-block">{String(val)}</span>;
                      })()}
                    </div>
                    <p className="text-[11.5px] text-slate-650 bg-white rounded p-2 border border-slate-100 font-medium">
                      ¿Desea confirmar que su información es la correcta y actualizar todos los otros registros de su región a este valor?
                    </p>
                  </div>

                  {currentConflict.otherSubmissions.length > 0 && (
                    <div className="border border-slate-100 rounded-lg p-3 bg-slate-50 space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Registros conflictivos en su región:</span>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {currentConflict.otherSubmissions.map((sub: any, idx: number) => {
                          const otherVal = sub.data[currentConflict.fieldId];
                          const associatedUser = dbUsers.find((u: any) => u.email.toLowerCase() === sub.userEmail.toLowerCase());
                          const displayName = associatedUser ? associatedUser.name : sub.userEmail;
                          return (
                            <div key={idx} className="flex flex-col text-[11px] text-slate-750 bg-white p-2.5 rounded border border-slate-100 shadow-sm space-y-1.5">
                              <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                                <span className="font-bold text-slate-600 truncate max-w-[200px]">{displayName}</span>
                                <span className="text-[9.5px] text-slate-400">Usuario Registrador</span>
                              </div>
                              <div className="space-y-1">
                                {(() => {
                                  if (Array.isArray(otherVal)) {
                                    return (
                                      <div className="text-[11px] space-y-1 bg-slate-50 p-2 rounded border border-slate-200">
                                        {otherVal.map((row: any, rIdx: number) => {
                                          const label = row._rowLabel || `Fila ${rIdx + 1}`;
                                          const cols = Object.keys(row).filter((k) => k !== "_rowLabel");
                                          return (
                                            <div key={rIdx} className="flex flex-col border-b border-slate-100 last:border-0 pb-1 last:pb-0">
                                              <span className="font-semibold text-slate-600">{label}</span>
                                              <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-500 mt-0.5">
                                                {cols.map((col) => (
                                                  <span key={col} className="bg-white border border-slate-150 px-1.5 py-0.5 rounded shadow-2xs">
                                                    {col}: <strong className="text-slate-750">{row[col]}</strong>
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    );
                                  }
                                  return <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded inline-block">{String(otherVal)}</span>;
                                })()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={syncingLsa}
                    onClick={handleCancelLsa}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-250 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-xs font-bold transition-all"
                  >
                    No, verificaré (Borrar valor)
                  </button>
                  <button
                    type="button"
                    disabled={syncingLsa}
                    onClick={handleConfirmRewriteLsa}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#8FA89B] text-white hover:bg-[#5F756B] shadow-md hover:shadow-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    {syncingLsa ? (
                      <>
                      <RefreshCcw className="h-3 w-3 animate-spin" />
                      <span>Sincronizando...</span>
                      </>
                    ) : (
                      <span>Sí, es correcto (Reescribir otras respuestas)</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* AVISO DE BORRADOR AUTOMÁTICO RECUPERADO */}
          {showDraftNotice && (
            <div className="mb-6 rounded-xl bg-[#8FA89B]/10 border border-[#8FA89B]/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-lg">📝</span>
                <div>
                  <h4 className="text-xs font-bold font-serif text-[#3D3A37] tracking-tight">Borrador cargado</h4>
                  <p className="text-[11px] text-[#6B6661] font-medium leading-relaxed mt-0.5">
                    Hemos recuperado automáticamente tus respuestas guardadas localmente para que no pierdas tu progreso.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDraftNotice(false)}
                  className="px-3.5 py-1.5 text-[10.5px] font-serif font-semibold text-[#5F756B] bg-white border border-[#EAE5DF] hover:bg-[#F4EFEA] hover:text-[#3D3A37] rounded-full shadow-xs cursor-pointer transition-all duration-200"
                >
                  Entendido
                </button>
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="px-3.5 py-1.5 text-[10.5px] font-serif font-semibold text-rose-700 bg-[#FDF1F0] hover:bg-rose-600 hover:text-white rounded-full shadow-xs cursor-pointer transition-all duration-200"
                >
                  Empezar de nuevo
                </button>
              </div>
            </div>
          )}

          {/* STEPPER COORDENADOR INTERACTIVO */}
          {formSteps && formSteps.length > 0 && (
            <div className="mb-8 border-b border-slate-100 pb-5">
              {/* Barra de Progreso */}
              <div className="relative w-full h-1.5 bg-slate-100 rounded-full mb-4">
                <div 
                  className="absolute h-1.5 bg-[#8FA89B] rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(143,168,155,0.3)]" 
                  style={{ width: `${((activeStepIdx + 1) / (formSteps.length + 1)) * 100}%` }}
                />
              </div>

              {/* Lista de Pasos Desplazable */}
              <div className="flex flex-wrap md:flex-nowrap items-center justify-start md:justify-between py-3.5 px-2 gap-x-5 gap-y-3.5 font-sans">
                {formSteps.map((step, idx) => {
                  const isCompleted = idx < activeStepIdx;
                  const isActive = idx === activeStepIdx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (idx < activeStepIdx) {
                          setActiveStepIdx(idx);
                        } else if (idx > activeStepIdx) {
                          if (validateCurrentStep()) {
                            setActiveStepIdx(idx);
                          }
                        }
                      }}
                      className="flex items-center gap-2 shrink-0 text-left outline-none cursor-pointer font-sans not-italic"
                    >
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-sans font-bold border transition-all not-italic ${
                        isCompleted 
                          ? "bg-[#5F756B] border-[#5F756B] text-white shadow-sm" 
                          : isActive 
                            ? "bg-[#8FA89B] border-[#8FA89B] text-white ring-4 ring-[#8FA89B]/25" 
                            : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-350"
                      }`}>
                        {isCompleted ? "✓" : idx + 1}
                      </div>
                      <span className={`text-xs md:text-sm font-sans font-medium tracking-tight transition-colors not-italic ${
                        isActive ? "text-[#5F756B]" : isCompleted ? "text-[#5F756B]/80" : "text-slate-500 hover:text-slate-800"
                      }`}>
                        {step.title}
                      </span>
                    </button>
                  );
                })}

                {/* Paso de Revisión Final */}
                <button
                  type="button"
                  onClick={() => {
                    if (activeStepIdx === formSteps.length) return;
                    if (validateCurrentStep()) {
                      setActiveStepIdx(formSteps.length);
                    }
                  }}
                  className="flex items-center gap-2 shrink-0 text-left outline-none cursor-pointer font-sans not-italic"
                >
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-sans font-bold border transition-all not-italic ${
                    activeStepIdx === formSteps.length
                      ? "bg-[#8FA89B] border-[#8FA89B] text-white ring-4 ring-[#8FA89B]/25" 
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-350"
                  }`}>
                    📋
                  </div>
                  <span className={`text-xs md:text-sm font-sans font-medium tracking-tight transition-colors not-italic ${
                    activeStepIdx === formSteps.length ? "text-[#5F756B]" : "text-slate-500 hover:text-slate-800"
                  }`}>
                    Revisión
                  </span>
                </button>
              </div>
            </div>
          )}

          {hasDateFields && editingSubmissionId && (
            <div id="editing_entry_banner" className="mb-6 rounded-xl bg-amber-50 p-4 border border-amber-200 text-xs text-amber-800 flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 font-bold">✍️</span>
              <div>
                <span className="font-semibold block text-amber-900">Modo Edición de Registro</span>
                Ya has completado un envío de este formulario para la fecha seleccionada. Al guardar, <strong className="font-bold text-amber-950">modificarás tu registro existente</strong>.
              </div>
            </div>
          )}

          {unfilledFields.length > 0 && (
            <div id="mandatory_fields_alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-850 shadow-[0_4px_12px_rgba(239,68,68,0.05)] animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 font-bold">⚠️</span>
                <div className="space-y-2">
                  <h4 className="font-bold text-red-900 tracking-tight leading-none">Campos Obligatorios Incompletos</h4>
                  <p className="text-xs text-red-700 leading-relaxed">
                    No se puede enviar el formulario porque los siguientes campos obligatorios no se han completado. Por favor, rellénalos antes de continuar:
                  </p>
                  <ul className="list-disc pl-5 text-xs text-red-800 font-medium space-y-1 mt-1">
                    {unfilledFields.map((fieldLabel, idx) => (
                      <li key={idx}>
                        <span className="underline underline-offset-2 decoration-red-300">{fieldLabel}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {submitError && unfilledFields.length === 0 && (
            <div id="form_submit_error" className="mb-6 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-red-500" />
              <span>{submitError}</span>
            </div>
          )}



          <form
            id="dynamic_form"
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const target = e.target as HTMLElement;
                if (target && (target.tagName === "INPUT" || target.tagName === "SELECT")) {
                  e.preventDefault();
                }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5"
          >
            {/* Si estamos en el paso de revisión, renderizar el resumen completo de respuestas */}
            {activeStepIdx === formSteps.length && (
              /* ==================== REVIEW / SUMMARY STEP LAYOUT ==================== */
              <div id="review_step_container" className="space-y-6 col-span-1 md:col-span-2">
                <div className="bg-[#8FA89B]/5 rounded-xl p-4 border border-[#8FA89B]/25 text-xs text-[#5F756B] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#8FA89B]/10 text-[#5F756B] font-bold">📋</span>
                    <div>
                      <span className="font-bold block text-[#3D3A37]">Revisión de respuestas antes de enviar</span>
                      Por favor, confirma que toda la información que has rellenado sea correcta. Haz clic en "Corregir" en cualquier sección si necesitas modificar algo.
                    </div>
                  </div>
                  <button
                    id="print_review_step_btn"
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#5F756B] hover:bg-[#3D3A37] text-white text-xs font-serif font-semibold transition-all shadow-xs shrink-0 cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5 text-[#8FA89B]" />
                    <span>Imprimir / Descargar PDF</span>
                  </button>
                </div>

                <div className="space-y-5">
                  {formSteps.map((step, stepIdx) => {
                    const stepUnfilled = step.fields.filter(field => {
                      if (!field.required) return false;
                      const fieldVal = formData[field.id];
                      if (field.type === "table") {
                        return !Array.isArray(fieldVal) || fieldVal.length === 0;
                      } else if (field.type === "date" && field.dateRenderMode === "dropdown") {
                        const parts = String(fieldVal || "").split("-");
                        return !parts[0] || !parts[1];
                      } else {
                        return fieldVal === undefined || fieldVal === null || fieldVal === "" || fieldVal === false || (Array.isArray(fieldVal) && fieldVal.length === 0);
                      }
                    });

                    return (
                      <div key={stepIdx} className={`rounded-xl border p-5 ${stepUnfilled.length > 0 ? "border-red-200 bg-red-50/5" : "border-slate-200 bg-slate-50/30"}`}>
                        <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-100">
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${stepUnfilled.length > 0 ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`} />
                            {step.title}
                          </h3>
                          <button
                            type="button"
                            onClick={() => setActiveStepIdx(stepIdx)}
                            className="text-[11px] font-bold text-[#5F756B] hover:text-[#3D3A37] underline decoration-dotted cursor-pointer"
                          >
                            Corregir
                          </button>
                        </div>

                        {stepUnfilled.length > 0 && (
                          <div className="mb-3 text-[11px] text-red-700 font-medium">
                            ⚠️ Hay {stepUnfilled.length} campos requeridos sin completar en esta sección.
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {step.fields.map(field => {
                            const val = formData[field.id];
                            const isMissing = field.required && (
                              val === undefined || val === null || val === "" || val === false ||
                              (Array.isArray(val) && val.length === 0)
                            );

                            return (
                              <div key={field.id} className="text-xs">
                                <span className="block text-slate-500 font-medium mb-0.5">{field.label}:</span>
                                <div className="font-semibold text-slate-800">
                                  {isMissing ? (
                                    <span className="text-red-500 font-bold">⚠️ Requerido Incompleto</span>
                                  ) : val === undefined || val === null || val === "" ? (
                                    <span className="text-slate-400 font-normal">No completado</span>
                                  ) : field.type === "checkbox" && Array.isArray(val) ? (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {val.map(item => (
                                        <span key={item} className="px-1.5 py-0.5 rounded bg-[#8FA89B]/10 text-[#5F756B] dark:text-[#8FA89B] border border-[#8FA89B]/20 text-[10px] font-bold">
                                          {item === "__OTHER__" ? "Otro" : item}
                                        </span>
                                      ))}
                                    </div>
                                  ) : field.type === "select" && Array.isArray(val) ? (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {val.map(item => (
                                        <span key={item} className="px-1.5 py-0.5 rounded bg-[#8FA89B]/10 text-[#5F756B] dark:text-[#8FA89B] border border-[#8FA89B]/20 text-[10px] font-bold">
                                          {item}
                                        </span>
                                      ))}
                                    </div>
                                  ) : field.type === "boolean_justify" ? (
                                    <div className="space-y-0.5">
                                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-705 border text-[10px] font-bold">
                                        {(val as any).answer || "Sin respuesta"}
                                      </span>
                                      {(val as any).justification && (
                                        <p className="text-[11px] text-slate-600 mt-1 pl-1 border-l-2 border-slate-200 font-normal">
                                          <strong>Justificación:</strong> {(val as any).justification}
                                        </p>
                                      )}
                                    </div>
                                  ) : field.type === "table" ? (
                                    <span className="text-[#5F756B] dark:text-[#8FA89B] text-[11px] font-bold bg-[#8FA89B]/10 border border-[#8FA89B]/20 px-2 py-0.5 rounded">
                                      Tabla completada ({Array.isArray(val) ? val.length : 0} filas)
                                    </span>
                                  ) : (
                                    <span className="break-words font-medium">{String(val)}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {fields.map((field) => {
              // Filtrar campos que no pertenecen al paso actual
              if (activeStepIdx === formSteps.length) {
                return null;
              }
              const currentStep = formSteps[activeStepIdx];
              if (!currentStep || !currentStep.fields.some(f => f.id === field.id)) {
                return null;
              }

              if (field.type === "section") {
                return (
                  <div key={field.id} id={`form_field_wrapper_${field.id}`} className="pt-8 pb-3 border-b border-slate-100 first:pt-4 col-span-1 md:col-span-2">
                    <div className="inline-flex items-center gap-2 bg-[#8FA89B]/10 border border-[#8FA89B]/20 rounded-full px-4.5 py-1.5 text-xs font-bold text-[#5F756B] tracking-wide uppercase">
                      <span className="h-2 w-2 rounded-full bg-[#8FA89B] animate-pulse shadow-[0_0_8px_#8fa89b]"></span>
                      {field.label}
                    </div>
                    {field.description && (
                      <p className="text-xs text-slate-500 mt-2.5 pl-1 leading-relaxed max-w-2xl font-medium">
                        {field.description}
                      </p>
                    )}
                  </div>
                );
              }

              const hasError = !!validationErrors[field.id];
              const value = formData[field.id] || "";

              const isFullWidthField = 
                field.type === "textarea" || 
                field.type === "table" || 
                field.type === "list" || 
                field.type === "boolean_justify" ||
                (field.type === "select" && field.multiple) ||
                (field.type === "checkbox" && field.options && field.options.length > 0) ||
                field.id === "field_1781900419873" ||
                field.id === "field_1782063015835" ||
                field.id === "field_1782063187227" ||
                field.id === "field_1782063210057" ||
                field.id === "field_1782063375445" ||
                field.id === "field_1782072087319" ||
                field.id === "field_1782072119225";
              const colSpanClass = isFullWidthField ? "col-span-1 md:col-span-2" : "col-span-1";

              return (
                <div key={field.id} id={`form_field_wrapper_${field.id}`} className={`flex flex-col gap-1.5 ${colSpanClass}`}>
                  <label className="flex items-center text-sm font-semibold text-slate-900">
                    {field.label}
                    {field.required && <span className="ml-1 text-red-500 font-bold">*</span>}
                    {field.validation?.minLength && (
                      <span className="ml-2 text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-full">
                        mín {field.validation.minLength} carac.
                      </span>
                    )}
                    {field.validation?.min !== undefined && field.id !== "field_1782072087319" && field.id !== "field_1782072119225" && (
                      <span className="ml-2 text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-full">
                        mín: {field.validation.min}
                      </span>
                    )}
                  </label>

                  {field.description && (
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line -mt-0.5 mb-1">
                      {field.description}
                    </p>
                  )}

                  {/* Renderizado Condicional por Tipo de Campo */}
                  {field.type === "textarea" ? (
                    <textarea
                      id={field.id}
                      rows={4}
                      value={value}
                      onChange={(e) => handleInputChange(field, e.target.value)}
                      placeholder={field.placeholder || "Escribe tu respuesta aquí..."}
                      className={`w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-slate-850 placeholder-slate-400 outline-none transition-all ${
                        hasError
                          ? "border-red-500 focus:border-red-650 focus:ring-2 focus:ring-red-100"
                          : "border-slate-300 focus:border-[#8FA89B] focus:bg-white focus:ring-2 focus:ring-[#8FA89B]/10"
                      }`}
                    />
                  ) : field.type === "select" ? (
                    <div className="space-y-3.5">
                      {field.multiple ? (
                        /* ==================== MULTI-SELECT RENDERER ==================== */
                        <div className="relative">
                          {(() => {
                            const selectedList = Array.isArray(value)
                              ? value
                              : (typeof value === "string" && value.trim() !== "" ? [value] : []);
                            
                            return (
                              <>
                                {/* Selected Tags list triggers open state */}
                                <button
                                  id={`multiselect_btn_${field.id}`}
                                  type="button"
                                  onClick={() => setOpenDropdownId(openDropdownId === field.id ? null : field.id)}
                                  className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-left outline-none transition-all flex items-center justify-between min-h-[44px] ${
                                    hasError
                                      ? "border-red-500 focus:border-red-655 focus:ring-2 focus:ring-red-100"
                                      : "border-[#EAE5DF] focus:border-[#8FA89B] focus:bg-white focus:ring-2 focus:ring-[#8FA89B]/20"
                                  }`}
                                >
                                  <div className="flex flex-wrap gap-1.5 max-w-[90%]">
                                    {selectedList.length === 0 ? (
                                      <span className="text-slate-400">-- Selecciona una o más opciones --</span>
                                    ) : (
                                      selectedList.map((valItem) => {
                                        let labelToShow = valItem;
                                        let isOtherLabel = false;
                                        if (valItem === "__OTHER__") {
                                          labelToShow = "Otro (Especificar)";
                                          isOtherLabel = true;
                                        } else if (!field.options?.includes(valItem)) {
                                          labelToShow = `Otro: ${valItem}`;
                                          isOtherLabel = true;
                                        }

                                        return (
                                          <span
                                            key={valItem}
                                            className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-semibold ${
                                              isOtherLabel 
                                                ? "bg-amber-50 text-amber-800 border-amber-200" 
                                                : "bg-[#8FA89B]/10 text-[#5F756B] dark:text-[#8FA89B] border-[#8FA89B]/20"
                                            }`}
                                          >
                                            <span>{labelToShow}</span>
                                            <span
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const cleanList = selectedList.filter(item => item !== valItem);
                                                handleInputChange(field, cleanList);
                                              }}
                                              className="hover:bg-[#8FA89B]/20 rounded px-1 cursor-pointer font-extrabold select-none text-slate-400 hover:text-slate-700"
                                              title="Eliminar"
                                            >
                                              ×
                                            </span>
                                          </span>
                                        );
                                      })
                                    )}
                                  </div>
                                  <span className="text-slate-400 text-xs ml-2 select-none">▼</span>
                                </button>

                                {/* Options Overlay Panel */}
                                {openDropdownId === field.id && (
                                  <>
                                    {/* Backdrop invisible to detect click outside */}
                                    <div 
                                      className="fixed inset-0 z-40 bg-transparent" 
                                      onClick={() => setOpenDropdownId(null)}
                                    />
                                    
                                    <div className="absolute left-0 right-0 mt-1.5 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-1.5 duration-200 space-y-1 multiselect-options-dropdown">
                                      <div className="text-[10px] text-slate-500 pl-2 pb-1.5 border-b border-slate-100 font-semibold uppercase tracking-wider flex items-center justify-between">
                                        <span>Opciones Disponibles</span>
                                        <span className="text-[#5F756B] pr-1">Elegir todas las que apliquen</span>
                                      </div>
                                      
                                      <div className="py-1 max-h-48 overflow-y-auto space-y-0.5">
                                        {field.options?.map((opt) => {
                                          const isOptSelected = selectedList.includes(opt);
                                          return (
                                            <label
                                              key={opt}
                                              className={`flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-all ${
                                                isOptSelected
                                                  ? "bg-[#8FA89B]/10 text-[#5F756B]"
                                                  : "text-slate-655 hover:bg-slate-50 hover:text-slate-900"
                                              }`}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isOptSelected}
                                                onChange={() => {
                                                  let newList;
                                                  if (isOptSelected) {
                                                    newList = selectedList.filter(v => v !== opt);
                                                  } else {
                                                    newList = [...selectedList, opt];
                                                  }
                                                  handleInputChange(field, newList);
                                                }}
                                                className="h-3.5 w-3.5 rounded border-slate-300 bg-white text-[#8FA89B] focus:ring-[#8FA89B] cursor-pointer"
                                              />
                                              <span>{opt}</span>
                                            </label>
                                          );
                                        })}

                                        {field.allowOther && (
                                          <label
                                            className={`flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-bold rounded-md cursor-pointer transition-all border-t border-slate-100 mt-1 pt-1.5 ${
                                              selectedList.some(v => v === "__OTHER__" || !field.options?.includes(v))
                                                ? "bg-amber-50 text-amber-800"
                                                : "text-amber-655 hover:bg-slate-50 hover:text-amber-700"
                                            }`}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={selectedList.some(v => v === "__OTHER__" || !field.options?.includes(v))}
                                              onChange={() => {
                                                const hasOther = selectedList.some(v => v === "__OTHER__" || !field.options?.includes(v));
                                                let newList;
                                                if (hasOther) {
                                                  newList = selectedList.filter(v => field.options?.includes(v) && v !== "__OTHER__");
                                                } else {
                                                  newList = [...selectedList, "__OTHER__"];
                                                }
                                                handleInputChange(field, newList);
                                              }}
                                              className="h-3.5 w-3.5 rounded border-slate-300 bg-white text-amber-600 focus:ring-amber-505 cursor-pointer"
                                            />
                                            <span>Otro (Especificar...)</span>
                                          </label>
                                        )}
                                      </div>
                                      
                                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                                        <button
                                          type="button"
                                          onClick={() => setOpenDropdownId(null)}
                                          className="px-2.5 py-1 text-[10px] font-bold text-slate-600 bg-slate-50 hover:bg-[#8FA89B] hover:text-white rounded transition-all tracking-wider uppercase border border-slate-200 hover:border-[#8FA89B]"
                                        >
                                          Aceptar / Cerrar
                                        </button>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        /* ==================== SINGLE SELECT RENDERER ==================== */
                        <select
                          id={field.id}
                          value={isFechaField(field) ? formatSpanishTextToDate(value) : ((field.allowOther && value && !field.options?.includes(value)) ? "__OTHER__" : value)}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "__OTHER__") {
                              handleInputChange(field, "__OTHER__");
                            } else {
                              handleInputChange(field, val);
                            }
                          }}
                          className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all ${
                            hasError
                              ? "border-red-500 focus:border-red-655 focus:ring-2 focus:ring-red-100"
                              : "border-[#EAE5DF] focus:border-[#8FA89B] focus:bg-white focus:ring-2 focus:ring-[#8FA89B]/20"
                          }`}
                        >
                          <option value="" className="bg-white text-slate-700">-- Selecciona una opción --</option>
                          {field.options?.map((opt) => {
                            const optVal = isFechaField(field) ? formatSpanishTextToDate(opt) : opt;
                            return (
                              <option key={opt} value={optVal} className="bg-white text-slate-800">
                                {opt}
                              </option>
                            );
                          })}
                          {field.allowOther && (
                            <option value="__OTHER__" className="bg-white text-amber-600 font-semibold">
                              Otro (Especificar...)
                            </option>
                          )}
                        </select>
                      )}

                      {/* Input de texto adicional si selecciona la opción "Otro" */}
                      {field.allowOther && (
                        field.multiple ? (
                          /* Combined multi-selection typed customization input */
                          ((value as string[] || []).some(v => v === "__OTHER__" || !field.options?.includes(v))) && (
                            <div className="animate-in fade-in slide-in-from-top-1.5 duration-200 space-y-2">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Escribe tu opción personalizada aquí..."
                                  value={customOptionInputs[field.id] || ""}
                                  onChange={(e) => {
                                    const typed = e.target.value;
                                    setCustomOptionInputs(prev => ({ ...prev, [field.id]: typed }));
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      const typed = (customOptionInputs[field.id] || "").trim();
                                      if (typed !== "") {
                                        const selectedList = (value as string[]) || [];
                                        let cleaned = selectedList.filter(v => v !== "__OTHER__");
                                        if (!cleaned.includes(typed)) {
                                          cleaned.push(typed);
                                        }
                                        handleInputChange(field, cleaned);
                                        setCustomOptionInputs(prev => ({ ...prev, [field.id]: "" }));
                                      }
                                    }
                                  }}
                                  className={`flex-1 rounded-lg border bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all ${
                                    hasError
                                      ? "border-red-500 focus:border-red-655 focus:ring-2 focus:ring-red-100"
                                      : "border-[#EAE5DF] focus:border-[#8FA89B] focus:ring-2 focus:ring-[#8FA89B]/20"
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const typed = (customOptionInputs[field.id] || "").trim();
                                    if (typed !== "") {
                                      const selectedList = (value as string[]) || [];
                                      let cleaned = selectedList.filter(v => v !== "__OTHER__");
                                      if (!cleaned.includes(typed)) {
                                        cleaned.push(typed);
                                      }
                                      handleInputChange(field, cleaned);
                                      setCustomOptionInputs(prev => ({ ...prev, [field.id]: "" }));
                                    }
                                  }}
                                  className="rounded-lg bg-[#8FA89B] hover:bg-[#5F756B] px-4 py-2 text-xs font-semibold text-white transition-all shadow flex items-center justify-center gap-1 shrink-0"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  <span>Añadir</span>
                                </button>
                              </div>
                              <p className="text-[10px] text-amber-700 mt-1.5 pl-1.5 font-medium flex items-center gap-1">
                                <span>⚠️</span> Escribe un valor personalizado y haz clic en <strong>Añadir</strong> (o presiona Enter) para agregarlo como opción seleccionada. Puedes añadir múltiples opciones.
                              </p>
                            </div>
                          )
                        ) : (
                          /* Single-select typed customization input */
                          (value && (value === "__OTHER__" || !field.options?.includes(value))) && (
                            <div className="animate-in fade-in slide-in-from-top-1.5 duration-200">
                              <input
                                type="text"
                                placeholder="Escribe tu opción personalizada aquí..."
                                value={value === "__OTHER__" ? "" : value}
                                onChange={(e) => handleInputChange(field, e.target.value)}
                                className={`w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all ${
                                  hasError
                                    ? "border-red-500 focus:border-red-655 focus:ring-2 focus:ring-red-100"
                                    : "border-[#EAE5DF] focus:border-[#8FA89B] focus:ring-2 focus:ring-[#8FA89B]/20"
                                }`}
                              />
                              <p className="text-[10px] text-amber-700 mt-1.5 pl-1.5 font-medium flex items-center gap-1">
                                <span>⚠️</span> Especifica el valor personalizado para esta opción.
                              </p>
                            </div>
                          )
                        )
                      )}
                    </div>
                  ) : field.type === "checkbox" ? (
                    field.options && field.options.length > 0 ? (
                      <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {field.options.map((opt) => {
                            const isChecked = Array.isArray(value) 
                              ? value.includes(opt) 
                              : (typeof value === "string" ? value.split(", ").includes(opt) : false);
                            
                            return (
                              <label key={opt} className="flex items-center space-x-3 bg-white hover:bg-slate-50 border border-slate-205 rounded-lg p-3 cursor-pointer transition-all">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const currentValues = Array.isArray(value) 
                                      ? value 
                                      : (typeof value === "string" && value ? value.split(", ") : []);
                                    let newValues: string[];
                                    
                                    const isYesNoField = field.id === "field_1781897268711" || (
                                      field.options && field.options.length === 2 && 
                                      field.options.some(o => o.toLowerCase() === "si" || o.toLowerCase() === "sí") &&
                                      field.options.some(o => o.toLowerCase() === "no")
                                    );

                                    if (isYesNoField) {
                                      if (e.target.checked) {
                                        newValues = [opt];
                                      } else {
                                        newValues = [];
                                      }
                                    } else {
                                      if (e.target.checked) {
                                        newValues = [...currentValues, opt];
                                      } else {
                                        newValues = currentValues.filter((v: string) => v !== opt);
                                      }
                                    }
                                    handleInputChange(field, newValues);
                                  }}
                                  className="h-4 w-4 rounded border-slate-300 bg-white text-[#8FA89B] focus:ring-[#8FA89B] cursor-pointer"
                                />
                                <span className="text-xs font-semibold text-slate-800">{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                        <input
                          id={field.id}
                          type="checkbox"
                          checked={!!value}
                          onChange={(e) => handleInputChange(field, e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 bg-white text-[#8FA89B] focus:ring-[#8FA89B]"
                        />
                        <span className="text-sm font-semibold text-slate-700">
                          {field.placeholder || "Acepto los términos y confirmo la veracidad de la información enviada."}
                        </span>
                      </div>
                    )
                  ) : field.type === "list" ? (
                    <div className="space-y-3.5 rounded-xl border border-[#EAE5DF] bg-slate-50/50 p-4 shadow-sm">
                      {/* Inputs para añadir elemento de lista */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={listInputs[field.id] || ""}
                          onChange={(e) => setListInputs(prev => ({ ...prev, [field.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const currentValStr = (listInputs[field.id] || "").trim();
                              if (currentValStr !== "") {
                                const currentItems = Array.isArray(value) ? value : [];
                                if (!currentItems.includes(currentValStr)) {
                                  const updatedItems = [...currentItems, currentValStr];
                                  handleInputChange(field, updatedItems);
                                  setListInputs(prev => ({ ...prev, [field.id]: "" }));
                                }
                              }
                            }
                          }}
                          placeholder={field.placeholder || "Escribe un elemento y presiona Enter o Añadir..."}
                          className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-850 placeholder-slate-400 outline-none transition-all focus:border-[#8FA89B] focus:bg-white focus:ring-2 focus:ring-[#8FA89B]/10"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const currentValStr = (listInputs[field.id] || "").trim();
                            if (currentValStr !== "") {
                              const currentItems = Array.isArray(value) ? value : [];
                              if (!currentItems.includes(currentValStr)) {
                                const updatedItems = [...currentItems, currentValStr];
                                handleInputChange(field, updatedItems);
                                setListInputs(prev => ({ ...prev, [field.id]: "" }));
                              }
                            }
                          }}
                          className="rounded-lg bg-[#8FA89B] hover:bg-[#5F756B] px-4 py-2 text-xs font-semibold text-white transition-all shadow flex items-center justify-center gap-1 shrink-0"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Añadir</span>
                        </button>
                      </div>

                      {/* Mostrar elementos existentes de la lista */}
                      {(!Array.isArray(value) || value.length === 0) ? (
                        <p className="text-xs text-slate-400 italic py-1 pl-1">La lista está vacía actualmente.</p>
                      ) : (
                        <ul className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
                          {value.map((item: string, index: number) => (
                            <li key={index} className="flex items-center justify-between py-2 text-sm text-slate-700 group">
                              <span className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                                {item}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedItems = value.filter((_, i) => i !== index);
                                  handleInputChange(field, updatedItems);
                                }}
                                className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                                title="Eliminar elemento"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : field.type === "table" ? (
                    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm">
                      <div className={(field.id === "field_1782063151398" || field.id === "field_1782072026008") ? "grid grid-cols-1 md:grid-cols-5 gap-3" : (field.id === "field_1782063582212" ? "grid grid-cols-1 md:grid-cols-4 gap-3" : "space-y-4")}>
                        {(!Array.isArray(value) || value.length === 0) ? (
                          field.predefinedRows && field.predefinedRows.length > 0 ? (
                            <div className="col-span-full rounded-lg border border-dashed border-slate-200 p-6 text-center bg-white space-y-3">
                              <p className="text-slate-400 italic text-xs">
                                No hay datos cargados para esta sección.
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  const initialRows = field.predefinedRows.map(rowLabel => {
                                    const rowObj: any = { _rowLabel: rowLabel };
                                    (field.columns || ["Columna 1"]).forEach(col => {
                                      const colType = field.columnTypes?.[col] || "text";
                                      rowObj[col] = colType === "number" ? "" : (colType === "checkbox" ? false : "");
                                    });
                                    return rowObj;
                                  });
                                  handleInputChange(field, initialRows);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#8FA89B]/30 bg-[#8FA89B]/10 px-3.5 py-1.5 text-xs font-bold text-[#5F756B] hover:bg-[#8FA89B] hover:text-white transition-all shadow-sm cursor-pointer"
                              >
                                <RefreshCcw className="h-3.5 w-3.5" />
                                <span>Inicializar Tabla</span>
                              </button>
                            </div>
                          ) : (
                            <div className="col-span-full rounded-lg border border-dashed border-slate-200 p-6 text-center text-slate-400 italic text-xs bg-white">
                              No hay datos. Haz clic en "Añadir Columna" para comenzar.
                            </div>
                          )
                        ) : (
                          value.map((row: any, rIdx: number) => (
                            <div key={rIdx} className={(field.id === "field_1782063151398" || field.id === "field_1782063582212" || field.id === "field_1782072026008") ? "rounded-xl border border-slate-200 bg-white p-2.5 px-3 space-y-2.5 shadow-sm transition-all hover:border-slate-300 flex flex-col justify-between h-full" : "rounded-xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-sm transition-all hover:border-slate-300"}>
                              {/* Header for this column */}
                              <div className={(field.id === "field_1782063151398" || field.id === "field_1782063582212" || field.id === "field_1782072026008") ? "flex items-center justify-center border-b border-slate-100 pb-1.5 min-h-[44px]" : "flex items-center justify-between border-b border-slate-100 pb-2"}>
                                <div className={(field.id === "field_1782063151398" || field.id === "field_1782063582212" || field.id === "field_1782072026008") ? "flex items-center justify-center gap-2 w-full text-center" : "flex items-center gap-2"}>
                                  {!(field.id === "field_1782063151398" || field.id === "field_1782063582212" || field.id === "field_1782072026008") && (
                                    <span className="h-2 w-2 rounded-full bg-[#8FA89B]"></span>
                                  )}
                                  {field.predefinedRows && field.predefinedRows.length > 0 ? (
                                    <span className="text-sm font-bold text-slate-800">
                                      {row._rowLabel || `Columna ${rIdx + 1}`}
                                    </span>
                                  ) : (
                                    <input
                                      type="text"
                                      value={row._rowLabel || ""}
                                      onChange={(e) => {
                                        const currentRows = [...value];
                                        currentRows[rIdx] = {
                                          ...currentRows[rIdx],
                                          _rowLabel: e.target.value
                                        };
                                        handleInputChange(field, currentRows);
                                      }}
                                      placeholder="Nombre de la Columna..."
                                      className="bg-transparent text-sm font-bold text-slate-800 outline-none border-b border-dashed border-slate-300 focus:border-[#8FA89B] pb-0.5"
                                    />
                                  )}
                                </div>
                                
                                {/* If it's a dynamic table (not predefined), show delete button */}
                                {(!field.predefinedRows || field.predefinedRows.length === 0) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentRows = [...value];
                                      currentRows.splice(rIdx, 1);
                                      handleInputChange(field, currentRows);
                                    }}
                                    className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700 transition-all"
                                    title="Eliminar Columna"
                                  >
                                    <Trash2 className="h-4.5 w-4.5" />
                                  </button>
                                )}
                              </div>

                              {/* Sub columns are listed right below this column */}
                              <div className={(field.id === "field_1782063151398" || field.id === "field_1782063582212" || field.id === "field_1782072026008") ? "w-full" : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"}>
                                {(field.columns || ["Columna 1"]).map((col, cIdx) => {
                                  const colType = field.columnTypes?.[col] || "text";
                                  const colOpts = field.columnOptions?.[col] || [];
                                  const isSpecialRow = field.id === "field_1782063151398" || field.id === "field_1782063582212" || field.id === "field_1782072026008";
                                  const handleTableFieldBlur = () => {
                                    if (
                                      field.id === "field_1782063582212" ||
                                      field.id === "field_1782072026008"
                                    ) {
                                      setTimeout(() => {
                                        const activeEl = document.activeElement;
                                        const container = document.getElementById(`form_field_wrapper_${field.id}`);
                                        if (container && activeEl && container.contains(activeEl)) {
                                          return;
                                        }
                                        const latestVal = formDataRef.current[field.id];
                                        checkLsaCountMatch(field.id, latestVal);
                                      }, 120);
                                    }
                                  };

                                  const cellValStr = row[col] !== undefined && row[col] !== null ? String(row[col]) : "";
                                  const cellHasError = hasError && cellValStr.trim() === "";
                                  const inputBorderClass = cellHasError
                                    ? "border-red-500 focus:border-red-655 focus:ring-2 focus:ring-red-100 bg-red-50/10"
                                    : "border-[#EAE5DF] focus:border-[#8FA89B] focus:bg-white focus:ring-2 focus:ring-[#8FA89B]/20 bg-white";

                                  return (
                                    <div key={cIdx} className={isSpecialRow ? "" : "space-y-1 text-center"}>
                                      {!(isSpecialRow && col.toLowerCase() === "cantidad") && (
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                                          {col}
                                        </label>
                                      )}
                                      {colType === "checkbox" ? (
                                        <label className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg p-2 cursor-pointer transition-all hover:bg-slate-50 h-9">
                                          <input
                                            type="checkbox"
                                            checked={!!row[col]}
                                            onChange={(e) => {
                                              const currentRows = [...value];
                                              currentRows[rIdx] = {
                                                ...currentRows[rIdx],
                                                [col]: e.target.checked
                                              };
                                              handleInputChange(field, currentRows);
                                            }}
                                            onBlur={handleTableFieldBlur}
                                            className="h-4 w-4 rounded border-slate-300 bg-white text-[#8FA89B] focus:ring-[#8FA89B] cursor-pointer"
                                          />
                                          <span className="text-xs text-slate-600 select-none">Marcar</span>
                                        </label>
                                      ) : colType === "select" ? (
                                        <select
                                          value={row[col] || ""}
                                          onChange={(e) => {
                                            const currentRows = [...value];
                                            currentRows[rIdx] = {
                                              ...currentRows[rIdx],
                                              [col]: e.target.value
                                            };
                                            handleInputChange(field, currentRows);
                                          }}
                                          onBlur={handleTableFieldBlur}
                                          className={`w-full rounded-lg border px-3 py-2 text-xs text-slate-800 outline-none transition-all cursor-pointer shadow-sm ${inputBorderClass}`}
                                        >
                                          <option value="" className="bg-white text-slate-500">- Elegir -</option>
                                          {colOpts.map(opt => (
                                            <option key={opt} value={opt} className="bg-white text-slate-800">{opt}</option>
                                          ))}
                                        </select>
                                      ) : colType === "number" ? (
                                        <input
                                          type="number"
                                          min={0}
                                          onKeyDown={(e) => {
                                            if (e.key === "-" || e.key === "e") {
                                              e.preventDefault();
                                            }
                                          }}
                                          value={row[col] !== undefined && row[col] !== null ? row[col] : ""}
                                          onChange={(e) => {
                                            let val = e.target.value;
                                            if (val !== "" && Number(val) < 0) {
                                              val = "0";
                                            }
                                            const currentRows = [...value];
                                            currentRows[rIdx] = {
                                              ...currentRows[rIdx],
                                              [col]: val === "" ? "" : Number(val)
                                            };
                                            handleInputChange(field, currentRows);
                                          }}
                                          onBlur={handleTableFieldBlur}
                                          placeholder={isSpecialRow && col.toLowerCase() === "cantidad" ? "Ingresar..." : `Ingresar ${col}...`}
                                          className={`w-full rounded-lg border text-center text-xs text-slate-800 placeholder-slate-400 outline-none transition-all ${
                                            isSpecialRow ? "px-2.5 py-1.5" : "px-3 py-2"
                                          } ${inputBorderClass}`}
                                        />
                                      ) : (
                                        <input
                                          type="text"
                                          value={row[col] || ""}
                                          onChange={(e) => {
                                            const currentRows = [...value];
                                            currentRows[rIdx] = {
                                              ...currentRows[rIdx],
                                              [col]: e.target.value
                                            };
                                            handleInputChange(field, currentRows);
                                          }}
                                          onBlur={handleTableFieldBlur}
                                          placeholder={isSpecialRow && col.toLowerCase() === "cantidad" ? "Ingresar..." : `Ingresar ${col}...`}
                                          className={`w-full rounded-lg border text-center text-xs text-slate-800 placeholder-slate-400 outline-none transition-all ${
                                            isSpecialRow ? "px-2.5 py-1.5" : "px-3 py-2"
                                          } ${inputBorderClass}`}
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      {/* Add column/row button only for dynamic table */}
                      {(!field.predefinedRows || field.predefinedRows.length === 0) && (
                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              const currentRows = Array.isArray(value) ? [...value] : [];
                              const newRow: any = { _rowLabel: "" };
                              (field.columns || ["Columna 1"]).forEach(col => {
                                const colType = field.columnTypes?.[col] || "text";
                                newRow[col] = colType === "checkbox" ? false : "";
                              });
                              handleInputChange(field, [...currentRows, newRow]);
                            }}
                            className="flex-1 max-w-[180px] flex items-center justify-center gap-1.5 rounded-lg border border-[#8FA89B]/30 bg-[#8FA89B]/10 px-3 py-1.5 text-xs font-bold text-[#5F756B] hover:bg-[#8FA89B] hover:text-white transition-all shadow-sm"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Añadir Columna</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (field.type === "date" && field.dateRenderMode === "dropdown") ? (
                    (() => {
                      const currentYear = new Date().getFullYear();
                      const years = Array.from({ length: 130 }, (_, i) => String(currentYear + 10 - i));
                      const months = [
                        { val: "01", name: "Enero" },
                        { val: "02", name: "Febrero" },
                        { val: "03", name: "Marzo" },
                        { val: "04", name: "Abril" },
                        { val: "05", name: "Mayo" },
                        { val: "06", name: "Junio" },
                        { val: "07", name: "Julio" },
                        { val: "08", name: "Agosto" },
                        { val: "09", name: "Septiembre" },
                        { val: "10", name: "Octubre" },
                        { val: "11", name: "Noviembre" },
                        { val: "12", name: "Diciembre" }
                      ];

                      const dateValue = value ? String(value) : "";
                      const [yVal, mVal] = dateValue.split("-").concat(["", ""]).slice(0, 2);

                      const updateDatePart = (part: "year" | "month", val: string) => {
                        const year = part === "year" ? val : yVal;
                        const month = part === "month" ? val : mVal;
                        
                        if (!year && !month) {
                          handleInputChange(field, "");
                        } else {
                          handleInputChange(field, `${year}-${month}`);
                        }
                      };

                      return (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <select
                              value={mVal}
                              onChange={(e) => updateDatePart("month", e.target.value)}
                              className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition-all ${
                                hasError
                                  ? "border-red-500 focus:border-red-655 focus:ring-2 focus:ring-red-100"
                                  : "border-[#EAE5DF] focus:border-[#8FA89B] focus:bg-white focus:ring-2 focus:ring-[#8FA89B]/20"
                              }`}
                            >
                              <option value="" className="bg-white text-slate-500">Mes</option>
                              {months.map(m => (
                                <option key={m.val} value={m.val} className="bg-white text-slate-800">{m.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <select
                              value={yVal}
                              onChange={(e) => updateDatePart("year", e.target.value)}
                              className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition-all ${
                                hasError
                                  ? "border-red-500 focus:border-red-655 focus:ring-2 focus:ring-red-100"
                                  : "border-[#EAE5DF] focus:border-[#8FA89B] focus:bg-white focus:ring-2 focus:ring-[#8FA89B]/20"
                              }`}
                            >
                              <option value="" className="bg-white text-slate-500">Año</option>
                              {years.map(y => (
                                <option key={y} value={y} className="bg-white text-slate-800">{y}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })()
                  ) : field.type === "boolean_justify" ? (
                    (() => {
                      const valObj = (value && typeof value === 'object') ? value : { answer: "", justification: "" };
                      const ans = valObj.answer || "";
                      const justification = valObj.justification || "";

                      const handleAnswerChange = (newAns: string) => {
                        const newJust = newAns === "Sí" ? justification : "";
                        handleInputChange(field, { answer: newAns, justification: newJust });
                      };

                      const handleJustificationChange = (newJust: string) => {
                        handleInputChange(field, { ...valObj, justification: newJust });
                      };

                      return (
                        <div className="space-y-3.5 p-4 rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
                          {/* Botones de opción Yes/No */}
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              id={`${field.id}_btn_yes`}
                              type="button"
                              onClick={() => handleAnswerChange("Sí")}
                              className={`flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-bold transition-all ${
                                ans === "Sí"
                                  ? "border-[#8FA89B] bg-[#8FA89B]/10 text-[#5F756B] shadow-sm"
                                  : "border-[#EAE5DF] bg-white text-slate-705 hover:border-slate-400 hover:bg-slate-50"
                              }`}
                            >
                              Sí
                            </button>
                            <button
                              id={`${field.id}_btn_no`}
                              type="button"
                              onClick={() => handleAnswerChange("No")}
                              className={`flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-bold transition-all ${
                                ans === "No"
                                  ? "border-[#C59B7E] bg-[#C59B7E]/10 text-[#967157] shadow-sm"
                                  : "border-[#EAE5DF] bg-white text-slate-705 hover:border-slate-400 hover:bg-slate-50"
                              }`}
                            >
                              No
                            </button>
                          </div>

                          {/* Sección para justificar si es SÍ */}
                          <AnimatePresence>
                            {ans === "Sí" && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden space-y-2 pt-2 border-t border-slate-200"
                              >
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                  {field.id === "field_1781900022784"
                                    ? "Regularidad de facilitación"
                                    : field.id === "field_1781900513250"
                                    ? "Cantidad de ayudantes con fines de protección"
                                    : "Justifique su respuesta"}{" "}
                                  <span className="text-red-500 font-bold">*</span>
                                </label>
                                {field.id === "field_1781900022784" ? (
                                  <select
                                    id={`${field.id}_justification`}
                                    value={justification}
                                    onChange={(e) => handleJustificationChange(e.target.value)}
                                    className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all ${
                                      hasError && !justification.trim()
                                        ? "border-red-500 focus:border-red-655 focus:ring-2 focus:ring-red-100"
                                        : "border-[#EAE5DF] focus:border-[#8FA89B] focus:bg-white focus:ring-2 focus:ring-[#8FA89B]/20"
                                    }`}
                                  >
                                    <option value="" className="bg-white text-slate-500">-- Seleccionar regularidad --</option>
                                    <option value="Cada semana" className="bg-white text-slate-800">Cada semana</option>
                                    <option value="Cada mes" className="bg-white text-slate-800">Cada mes</option>
                                    <option value="Cada 3 meses" className="bg-white text-slate-800">Cada 3 meses</option>
                                    <option value="Cada 6 meses" className="bg-white text-slate-800">Cada 6 meses</option>
                                    <option value="Cada año" className="bg-white text-slate-800">Cada año</option>
                                  </select>
                                ) : field.id === "field_1781900513250" ? (
                                  <input
                                    type="number"
                                    id={`${field.id}_justification`}
                                    min={0}
                                    onKeyDown={(e) => {
                                      if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+" || e.key === "." || e.key === ",") {
                                        e.preventDefault();
                                      }
                                    }}
                                    value={justification}
                                    onChange={(e) => {
                                      let val = e.target.value;
                                      val = val.replace(/[^0-9]/g, "");
                                      handleJustificationChange(val);
                                    }}
                                    placeholder="Escriba la cantidad (números >= 0)..."
                                    className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-800 text-center placeholder-slate-400 outline-none transition-all ${
                                      hasError
                                        ? "border-red-500 focus:border-red-655 focus:ring-2 focus:ring-red-100"
                                        : "border-[#EAE5DF] focus:border-[#8FA89B] focus:bg-white focus:ring-2 focus:ring-[#8FA89B]/20"
                                    }`}
                                  />
                                ) : (
                                  <textarea
                                    id={`${field.id}_justification`}
                                    rows={3}
                                    value={justification}
                                    onChange={(e) => handleJustificationChange(e.target.value)}
                                    placeholder="Explique las razones o detalles de su respuesta afirmativa..."
                                    className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all ${
                                      hasError && !justification.trim()
                                        ? "border-red-500 focus:border-red-655 focus:ring-2 focus:ring-red-100"
                                        : "border-[#EAE5DF] focus:border-[#8FA89B] focus:bg-white focus:ring-2 focus:ring-[#8FA89B]/20"
                                    }`}
                                  />
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })()
                  ) : (
                    // Campos de Texto, Email, Número estándar
                    <input
                      id={field.id}
                      type={field.type === "date" ? "month" : field.type}
                      value={value}
                      min={field.type === "number" ? 0 : undefined}
                      onKeyDown={(e) => {
                        if (field.type === "number" && (e.key === "-" || e.key === "e")) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (field.type === "number") {
                          if (val !== "" && Number(val) < 0) {
                            val = "0";
                          }
                        }
                        handleInputChange(field, val);
                      }}
                      onBlur={(e) => {
                        if (
                          field.id === "field_1782063375445" ||
                          field.id === "field_1782072087319" ||
                          field.id === "field_1782072119225"
                        ) {
                          checkLsaCountMatch(field.id, e.target.value);
                        }
                      }}
                      placeholder={field.placeholder || ""}
                      className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm ${
                        field.id === "field_1781838259883" ? "text-slate-950 font-bold" : "text-slate-800"
                      } ${field.type === "number" ? "text-center" : ""} placeholder-slate-400 outline-none transition-all ${
                        hasError
                          ? "border-red-500 focus:border-red-655 focus:ring-2 focus:ring-red-100"
                          : "border-[#EAE5DF] focus:border-[#8FA89B] focus:bg-white focus:ring-2 focus:ring-[#8FA89B]/20"
                      }`}
                    />
                  )}

                  {/* Mensaje de error animado */}
                  <AnimatePresence>
                    {hasError && (
                      <motion.p
                        id={`error_${field.id}`}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-xs font-semibold text-red-650 mt-1"
                      >
                        {validationErrors[field.id]}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* CONTROLES DE NAVEGACIÓN DE PASOS Y ENVÍO */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4 col-span-1 md:col-span-2">
              {/* Botón Anterior */}
              {activeStepIdx > 0 ? (
                <button
                  id="prev_step_btn"
                  type="button"
                  onClick={() => {
                    setActiveStepIdx(prev => prev - 1);
                    setUnfilledFields([]);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-705 hover:bg-slate-50 transition-all select-none cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
              ) : (
                <div /> // Spacer
              )}

              {/* Botón Siguiente / Revisión / Guardar */}
              {activeStepIdx < formSteps.length ? (
                <button
                  id="next_step_btn"
                  type="button"
                  onClick={() => {
                    if (validateCurrentStep()) {
                      setActiveStepIdx(prev => prev + 1);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#8FA89B] px-5 py-2 text-xs font-bold text-white hover:bg-[#5F756B] shadow transition-all select-none cursor-pointer"
                >
                  <span>{activeStepIdx === formSteps.length - 1 ? "Revisar Respuestas" : "Siguiente"}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  id="submit_form_btn"
                  type="submit"
                  disabled={submitting}
                  className={`inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-xs font-bold text-white transition-all active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400 ${
                    editingSubmissionId 
                      ? "bg-amber-600 hover:bg-amber-700 shadow" 
                      : "bg-emerald-600 hover:bg-emerald-700 shadow"
                  }`}
                >
                  {submitting ? (
                    <>
                      <RefreshCcw className="h-4 w-4 animate-spin" />
                      {editingSubmissionId ? "Actualizando..." : "Guardando..."}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {editingSubmissionId ? "Modificar Registro Existente" : "Confirmar Envíos y Terminar"}
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </motion.div>
      )}
      </AnimatePresence>
      </div>

      {/* PANEL DE GLOSARIO Y AYUDA DESLIZANTE */}
      <AnimatePresence>
        {isGlossaryOpen && (
          <>
            {/* Backdrop con desvanecimiento */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGlossaryOpen(false)}
              className="fixed inset-0 bg-[#3D3A37]/40 backdrop-blur-xs z-50 cursor-pointer"
            />

            {/* Panel deslizante */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#FCFAF7] dark:bg-[#1E1C1A] border-l border-[#EAE5DF] dark:border-[#2D2A26] shadow-2xl z-50 flex flex-col p-6 md:p-8 overflow-hidden"
            >
              {/* Encabezado */}
              <div className="flex items-center justify-between pb-4 border-b border-[#F4EFEA] dark:border-[#2D2A26] mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8FA89B]/10 dark:bg-[#8FA89B]/5 border border-[#8FA89B]/20 text-[#5F756B] dark:text-[#8FA89B]">
                    <BookOpen className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-serif text-[#3D3A37] dark:text-[#EAE5DF] tracking-tight">Ayuda y Glosario</h3>
                    <p className="text-[11px] text-[#6B6661] dark:text-[#C5C0BA] font-medium">Guía de términos y líneas de acción</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGlossaryOpen(false)}
                  className="h-8 w-8 rounded-full border border-[#EAE5DF] dark:border-[#2D2A26] flex items-center justify-center text-xs text-[#6B6661] dark:text-[#C5C0BA] hover:text-[#3D3A37] dark:hover:text-white hover:bg-[#F4EFEA] dark:hover:bg-[#2D2A26] cursor-pointer transition-all duration-250"
                >
                  ✕
                </button>
              </div>

              {/* Contenido con scroll */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-6 scrollbar-thin text-xs text-[#6B6661] dark:text-[#C5C0BA] leading-relaxed">
                {/* Introducción */}
                <div className="bg-[#8FA89B]/8 dark:bg-[#8FA89B]/4 border border-[#8FA89B]/15 dark:border-[#8FA89B]/10 rounded-2xl p-4.5 shadow-2xs">
                  <span className="font-bold font-serif text-[#5F756B] dark:text-[#8FA89B] block mb-1 text-[13px]">¿Cómo rellenar esta encuesta?</span>
                  Esta encuesta evalúa de forma periódica el estado de las actividades fundamentales de tu región. Si tienes dudas sobre un concepto o línea de acción, consúltalo en este panel informativo.
                </div>

                {/* Glosario de Términos */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-[#5F756B] dark:text-[#8FA89B] font-serif uppercase tracking-wider border-b border-[#F4EFEA] dark:border-[#2D2A26] pb-1">Conceptos Clave</h4>

                  <div className="space-y-1">
                    <strong className="text-[#3D3A37] dark:text-[#EAE5DF] font-bold font-serif text-[12.5px] block">Salud Espiritual</strong>
                    <p className="text-[#6B6661] dark:text-[#C5C0BA]">Vitalidad colectiva expresada en el entusiasmo de los amigos por aprender, estudiar las cartas de la Casa Universal de Justicia y perseverar en las líneas de acción.</p>
                  </div>

                  <div className="space-y-1">
                    <strong className="text-[#3D3A37] dark:text-[#EAE5DF] font-bold font-serif text-[12.5px] block">AEL (Asamblea Espiritual Local)</strong>
                    <p className="text-[#6B6661] dark:text-[#C5C0BA]">Órgano administrativo local que guía y pastorea a la comunidad bahá'í local, fomentando el desarrollo de capacidades institucionales y espirituales.</p>
                  </div>

                  <div className="space-y-1">
                    <strong className="text-[#3D3A37] dark:text-[#EAE5DF] font-bold font-serif text-[12.5px] block">MCA (Miembro del Cuerpo Auxiliar)</strong>
                    <p className="text-[#6B6661] dark:text-[#C5C0BA]">Institución nombrada por el Cuerpo de Consejeros encargada de estimular el crecimiento, la consolidación, la protección de la fe y el empoderamiento de los creyentes locales.</p>
                  </div>

                  <div className="space-y-1">
                    <strong className="text-[#3D3A37] dark:text-[#EAE5DF] font-bold font-serif text-[12.5px] block">Ayudantes del MCA</strong>
                    <p className="text-[#6B6661] dark:text-[#C5C0BA]">Colaboradores locales designados para apoyar al MCA en la atención directa a agrupaciones y comunidades en sus respectivas líneas de acción.</p>
                  </div>

                  <div className="space-y-1">
                    <strong className="text-[#3D3A37] dark:text-[#EAE5DF] font-bold font-serif text-[12.5px] block">Líneas de Acción</strong>
                    <p className="text-[#6B6661] dark:text-[#C5C0BA]">Orientaciones y directrices estratégicas que guían el esfuerzo sistemático de la comunidad, tales como el desarrollo de Ruhi, actividades de protección y visitas domiciliarias.</p>
                  </div>
                </div>

                {/* Consejos de Usabilidad */}
                <div className="pt-4 border-t border-[#F4EFEA] dark:border-[#2D2A26] space-y-4">
                  <h4 className="text-[11px] font-bold text-[#5F756B] dark:text-[#8FA89B] font-serif uppercase tracking-wider">Funcionalidades Útiles</h4>
                  
                  <div className="flex gap-3 items-start">
                    <span className="text-base shrink-0 mt-0.5">📝</span>
                    <div>
                      <strong className="text-[#3D3A37] dark:text-[#EAE5DF] block font-semibold font-serif text-[12px]">Guardado de Borradores</strong>
                      <span className="text-[#6B6661] dark:text-[#C5C0BA]">Tu progreso se guarda automáticamente. Si recargas el navegador o tienes problemas de conexión, podrás continuar donde te quedaste.</span>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <span className="text-base shrink-0 mt-0.5">📅</span>
                    <div>
                      <strong className="text-[#3D3A37] dark:text-[#EAE5DF] block font-semibold font-serif text-[12px]">Historial de Registros</strong>
                      <span className="text-[#6B6661] dark:text-[#C5C0BA]">Usa el botón "Historial de Encuestas" para ver, seleccionar y modificar tus formularios de fechas pasadas en cualquier momento.</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DOCUMENTO DE IMPRESIÓN Y EXPORTACIÓN EN PDF PARA USUARIOS MCA */}
      <div id="printable-mca-form-document" className="hidden print:block w-full bg-white text-slate-900 p-8 font-serif leading-relaxed">
        {/* Encabezado Oficial */}
        <div className="border-b-2 border-[#5F756B] pb-4 mb-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 text-[#5F756B] font-bold text-lg tracking-tight">
              <span>🕊️ Salud Espiritual</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Formulario de Registro - Cuerpo Auxiliar (MCA)
            </h1>
            <p className="text-xs text-slate-600 mt-0.5 font-sans">
              Documento Oficial de Registro de Actividades y Salud Espiritual
            </p>
          </div>
          <div className="text-right text-xs text-slate-600 space-y-0.5 font-sans">
            <p className="font-semibold text-slate-800">Fecha de Impresión: {new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}</p>
            {editingSubmissionId && <p className="font-mono text-[10px] text-slate-500">ID Registro: {editingSubmissionId}</p>}
            <p className="text-[10px] text-[#5F756B] font-bold uppercase">Estado: {submitted ? "Enviado y Confirmado" : editingSubmissionId ? "Registro Modificado" : "Registro Activo"}</p>
          </div>
        </div>

        {/* Ficha de Datos del Usuario MCA */}
        <div className="mb-6 rounded-xl border border-slate-300 bg-slate-50 p-4 text-xs grid grid-cols-2 md:grid-cols-3 gap-3 font-sans">
          <div>
            <span className="block text-slate-500 text-[10px] uppercase font-bold">Usuario / Emisor:</span>
            <span className="font-bold text-slate-900">{user.name || "Miembro MCA"}</span>
          </div>
          <div>
            <span className="block text-slate-500 text-[10px] uppercase font-bold">Correo Electrónico:</span>
            <span className="font-semibold text-slate-800">{user.email}</span>
          </div>
          <div>
            <span className="block text-slate-500 text-[10px] uppercase font-bold">Rol Institucional:</span>
            <span className="font-semibold text-[#5F756B]">Miembro de Cuerpo Auxiliar (MCA)</span>
          </div>
          {user.geographicGroup && (
            <div>
              <span className="block text-slate-500 text-[10px] uppercase font-bold">Grupo Geográfico:</span>
              <span className="font-semibold text-slate-800">{user.geographicGroup}</span>
            </div>
          )}
          {(user.country || user.region) && (
            <div>
              <span className="block text-slate-500 text-[10px] uppercase font-bold">Territorio / Región:</span>
              <span className="font-semibold text-slate-800">{[user.region, user.country].filter(Boolean).join(", ")}</span>
            </div>
          )}
        </div>

        {/* Secciones y Campos del Formulario */}
        <div className="space-y-6">
          {formSteps.map((step, sIdx) => (
            <div key={sIdx} className="border border-slate-300 rounded-xl p-5 bg-white page-break-inside-avoid shadow-xs">
              <h2 className="text-sm font-bold text-[#3D3A37] uppercase tracking-wider border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#5F756B]"></span>
                {step.title}
              </h2>
              {step.description && (
                <p className="text-xs text-slate-600 mb-3 italic font-sans">{step.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {step.fields.map((field) => {
                  const val = formData[field.id];
                  const isEmpty = val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0);

                  if (field.type === "section") {
                    return (
                      <div key={field.id} className="col-span-1 md:col-span-2 pt-3 pb-1 border-b border-slate-200 mt-2">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">{field.label}</span>
                        {field.description && <p className="text-[11px] text-slate-500 font-sans mt-0.5">{field.description}</p>}
                      </div>
                    );
                  }

                  return (
                    <div key={field.id} className={`text-xs ${field.type === "table" || field.type === "textarea" ? "col-span-1 md:col-span-2" : ""}`}>
                      <span className="block text-slate-600 font-sans font-medium text-[11px] mb-1">{field.label}:</span>
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/90 font-medium text-slate-900 leading-relaxed">
                        {isEmpty ? (
                          <span className="text-slate-400 italic font-sans text-[11px]">Sin información especificada</span>
                        ) : field.type === "checkbox" && Array.isArray(val) ? (
                          <div className="flex flex-wrap gap-1">
                            {val.map((item: string) => (
                              <span key={item} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold font-sans">
                                {item === "__OTHER__" ? "Otro" : item}
                              </span>
                            ))}
                          </div>
                        ) : field.type === "select" && Array.isArray(val) ? (
                          <div className="flex flex-wrap gap-1">
                            {val.map((item: string) => (
                              <span key={item} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold font-sans">
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : field.type === "boolean_justify" ? (
                          <div>
                            <span className="font-bold text-slate-900">{(val as any).answer || "N/A"}</span>
                            {(val as any).justification && (
                              <p className="mt-1 text-slate-700 text-[11px] pl-2 border-l-2 border-[#5F756B]">
                                <strong>Justificación:</strong> {(val as any).justification}
                              </p>
                            )}
                          </div>
                        ) : field.type === "table" && Array.isArray(val) ? (
                          <div className="overflow-x-auto mt-1 font-sans">
                            <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
                              <thead>
                                <tr className="bg-slate-200 text-slate-800">
                                  {(field.columns || []).map((col: string, cIdx: number) => (
                                    <th key={cIdx} className="border border-slate-300 px-2 py-1 font-bold">{col}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {val.map((row: any, rIdx: number) => (
                                  <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                    {(field.columns || []).map((col: string, cIdx: number) => (
                                      <td key={cIdx} className="border border-slate-300 px-2 py-1 text-slate-800">
                                        {row[col] !== undefined && row[col] !== null ? String(row[col]) : "-"}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <span className="whitespace-pre-wrap break-words">{String(val)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Pie de Página del Reporte */}
        <div className="mt-8 pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500 font-sans flex justify-between items-center">
          <span>Plataforma de Salud Espiritual - Registro Oficial MCA</span>
          <span>Generado el {new Date().toLocaleDateString("es-ES")}</span>
        </div>
      </div>
    </div>
  );
}
