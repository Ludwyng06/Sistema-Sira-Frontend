import { ErrorApi } from "./api";

export interface Explicacion {
  /** Qué pasó, en pocas palabras. */
  titulo: string;
  /** Por qué pasó. */
  porQue: string;
  /** Qué le toca hacer a la persona. */
  queHacer?: string;
  accion?: { texto: string; href: string };
  /** Código para soporte (correlacionId de la API). */
  soporte?: string;
}

type Plantilla = Omit<Explicacion, "soporte" | "porQue"> & { porQue?: string };

/**
 * Cada código de error de la API, explicado para una persona: qué pasó, por qué y qué hacer.
 * Si un código no está aquí se muestra el mensaje que escribió la API.
 */
const PLANTILLAS: Record<string, Plantilla> = {
  PERFIL_INCOMPLETO: {
    titulo: "Falta el perfil de solicitante",
    porQue:
      "Para pedir un espacio necesitamos tus datos de contacto e identificación. Esta cuenta es del personal de la Universidad y no los tiene.",
    queHacer: "Entra con una cuenta de solicitante o crea una nueva.",
    accion: { texto: "Crear una cuenta", href: "/registro" },
  },
  CORREO_NO_VERIFICADO: {
    titulo: "Verifica tu correo primero",
    porQue: "Puedes explorar el sitio, pero para enviar solicitudes debemos confirmar que el correo es tuyo.",
    queHacer: "Escribe el código de 6 dígitos que te enviamos.",
    accion: { texto: "Verificar mi correo", href: "/verificar-correo" },
  },
  SESION_INVALIDA: {
    titulo: "Tu sesión terminó",
    porQue: "Por seguridad la sesión se cierra pasado un tiempo o si se abre en otro lugar.",
    queHacer: "Ingresa de nuevo. Lo que ya habías guardado sigue ahí.",
    accion: { texto: "Ingresar", href: "/ingresar" },
  },
  SESION_REVOCADA: {
    titulo: "Tu sesión terminó",
    porQue: "Se cerró desde otro lugar o por seguridad.",
    queHacer: "Ingresa de nuevo.",
    accion: { texto: "Ingresar", href: "/ingresar" },
  },
  NO_AUTENTICADO: {
    titulo: "Necesitas ingresar",
    porQue: "Esta acción es solo para personas con sesión iniciada.",
    queHacer: "Ingresa con tu cuenta y vuelve a intentarlo.",
    accion: { texto: "Ingresar", href: "/ingresar" },
  },
  SIN_PERMISO: {
    titulo: "No tienes permiso para esto",
    porQue: "Tu rol no incluye esta acción o este registro es de otra dependencia.",
    queHacer: "Si crees que la necesitas, pídele al administrador que revise tu rol.",
  },
  DEMASIADAS_PETICIONES: {
    titulo: "Vas muy rápido",
    porQue: "Para proteger el sistema limitamos cuántos intentos se pueden hacer por minuto.",
    queHacer: "Espera un minuto y vuelve a intentarlo.",
  },
  CREDENCIALES_INVALIDAS: {
    titulo: "Correo o contraseña incorrectos",
    porQue: "Lo que escribiste no coincide con ninguna cuenta.",
    queHacer: "Revísalos con calma o recupera tu contraseña.",
    accion: { texto: "Recuperar contraseña", href: "/recuperar" },
  },
  CUENTA_BLOQUEADA: {
    titulo: "Cuenta bloqueada por un rato",
    porQue: "Hubo varios intentos fallidos seguidos y la bloqueamos para protegerla.",
    queHacer: "Espera unos 15 minutos o recupera tu contraseña.",
    accion: { texto: "Recuperar contraseña", href: "/recuperar" },
  },
  POLITICA_DESACTUALIZADA: {
    titulo: "La política de datos cambió",
    porQue: "Hay una versión nueva y debes aceptarla otra vez para registrarte.",
    queHacer: "Recarga la página y vuelve a marcar la casilla.",
  },
  CORREO_REGISTRADO: {
    titulo: "Ese correo ya tiene cuenta",
    porQue: "Cada correo puede tener una sola cuenta.",
    queHacer: "Ingresa con él, o recupera la contraseña si no la recuerdas.",
    accion: { texto: "Ingresar", href: "/ingresar" },
  },
  CODIGO_INVALIDO: {
    titulo: "Código incorrecto",
    porQue: "El código no coincide con el que enviamos.",
    queHacer: "Revísalo en tu correo o pide uno nuevo con “Reenviar el código”.",
  },
  CODIGO_VENCIDO: {
    titulo: "El código venció",
    porQue: "Los códigos duran pocos minutos por seguridad.",
    queHacer: "Pide uno nuevo con “Reenviar el código”.",
  },
  CODIGO_AGOTADO: {
    titulo: "Se acabaron los intentos",
    porQue: "Cada código permite pocos intentos para que nadie lo adivine.",
    queHacer: "Pide uno nuevo con “Reenviar el código”.",
  },
  CODIGO_RECIENTE: {
    titulo: "Acabamos de enviarte un código",
    porQue: "Para no llenar tu correo, esperamos un momento entre envíos.",
    queHacer: "Revisa tu bandeja (y el correo no deseado) y espera un minuto antes de pedir otro.",
  },
  FRANJA_NO_DISPONIBLE: {
    titulo: "Ese horario ya está ocupado",
    porQue: "Otra persona lo pidió, o hay una clase o un mantenimiento en ese momento.",
    queHacer: "Elige otra hora u otro espacio. El calendario muestra lo que está libre.",
  },
  RESERVA_DUPLICADA: {
    titulo: "Ya agregaste ese horario",
    porQue: "No se puede repetir el mismo espacio a la misma hora en una solicitud.",
    queHacer: "Elige otra franja.",
  },
  SOLICITUD_NO_EDITABLE: {
    titulo: "Esta solicitud ya no se puede cambiar",
    porQue: "Solo se edita mientras es un borrador; esta ya fue enviada.",
    queHacer: "Mira cómo va en “Mis solicitudes”.",
    accion: { texto: "Mis solicitudes", href: "/mis-solicitudes" },
  },
  SOLICITUD_NO_CANCELABLE: {
    titulo: "Ahora no se puede cancelar",
    porQue: "Por su estado actual, esta solicitud ya no admite cancelación.",
    queHacer: "Si necesitas cambiarla, comunícate con la dependencia responsable.",
  },
  SOLICITUD_NO_DECIDIBLE: {
    titulo: "Esta solicitud ya no está en revisión",
    porQue: "Alguien ya la decidió, o cambió de estado mientras la mirabas.",
    queHacer: "Recarga la lista para ver su estado actual.",
  },
  DECISION_YA_REGISTRADA: {
    titulo: "Ya hay una decisión",
    porQue: "Este paso ya fue resuelto por otra persona.",
    queHacer: "Recarga para ver cómo quedó.",
  },
  LIMITE_DE_ITEMS: {
    titulo: "Llegaste al límite",
    porQue: "Cada solicitud tiene un máximo de horarios, servicios y documentos.",
    queHacer: "Quita alguno, o crea otra solicitud para el resto.",
  },
  SOLICITUD_SIN_RESERVAS: {
    titulo: "Falta el horario",
    porQue: "Una solicitud necesita al menos un espacio y una franja.",
    queHacer: "Vuelve al paso 1 y agrega uno.",
  },
  SOLICITUD_INCOMPLETA: {
    titulo: "Faltan datos para enviar",
    porQue: "Revisamos tu solicitud antes de enviarla y hay puntos por corregir.",
    queHacer: "Mira la lista de abajo y corrige cada punto.",
  },
  AVAL_PENDIENTE: {
    titulo: "Falta el aval del responsable",
    porQue: "El responsable del espacio debe dar su aval antes de la aprobación.",
    queHacer: "Espera a que lo dé, o avísale que tiene esta solicitud pendiente.",
  },
  MOTIVO_REQUERIDO: {
    titulo: "Escribe el motivo",
    porQue: "Rechazar, devolver o reclasificar queda registrado, y el solicitante necesita saber por qué.",
    queHacer: "Escribe una explicación corta y confirma.",
  },
  ARCHIVO_NO_PERMITIDO: {
    titulo: "Ese archivo no sirve",
    porQue: "Solo aceptamos PDF, PNG o JPG, y revisamos el contenido real, no solo la extensión.",
    queHacer: "Conviértelo a uno de esos formatos y súbelo de nuevo.",
  },
  ARCHIVO_MUY_GRANDE: {
    titulo: "El archivo pesa demasiado",
    porQue: "El máximo es de 10 MB por archivo.",
    queHacer: "Comprímelo o toma una foto más liviana.",
  },
  ARCHIVO_REQUERIDO: {
    titulo: "Falta el archivo",
    porQue: "No llegó ningún archivo al servidor.",
    queHacer: "Elígelo de nuevo y súbelo.",
  },
  ORDEN_VENCIDA: {
    titulo: "La orden de pago venció",
    porQue: "El plazo para consignar ya terminó.",
    queHacer: "Mira el estado de tu solicitud: puede que debas pedir una cotización nueva.",
    accion: { texto: "Mis solicitudes", href: "/mis-solicitudes" },
  },
  COTIZACION_VENCIDA: {
    titulo: "La cotización venció",
    porQue: "Cada cotización tiene fecha límite y ya pasó.",
    queHacer: "Comunícate con la dependencia para que emita una nueva.",
  },
  ANTICIPACION_INSUFICIENTE: {
    titulo: "Muy cerca de la fecha",
    porQue: "Cada tipo de espacio se pide con cierta anticipación para poder revisarlo y prepararlo.",
    queHacer: "Elige una fecha más lejana.",
  },
  PLAZO_INSUFICIENTE: {
    titulo: "No alcanza el tiempo de revisión",
    porQue: "La solicitud necesita unos días de revisión antes del evento.",
    queHacer: "Elige una fecha más lejana.",
  },
  AFORO_EXCEDIDO: {
    titulo: "No caben tantas personas",
    porQue: "El espacio tiene una capacidad máxima.",
    queHacer: "Elige un espacio más grande o reduce el número de asistentes.",
    accion: { texto: "Ver espacios más grandes", href: "/" },
  },
  FUERA_DE_HORARIO: {
    titulo: "Ese espacio no opera a esa hora",
    porQue: "Cada espacio tiene sus propios horarios de uso.",
    queHacer: "Ajusta la hora de inicio o de fin.",
  },
  POLIZA_REQUERIDA: {
    titulo: "Falta la póliza",
    porQue: "Con este número de personas se exige una póliza de responsabilidad.",
    queHacer: "Súbela en el paso 4 (Identificación) y envía de nuevo.",
  },
  USO_INSTITUCIONAL_NO_PERMITIDO: {
    titulo: "El uso institucional no aplica",
    porQue: "Solo las cuentas con correo institucional verificado pueden pedir sin costo.",
    queHacer: "Elige “Uso particular” en el paso 4.",
  },
  SOLICITUD_EXENTA: {
    titulo: "Esta solicitud no se paga",
    porQue: "Es de uso institucional aprobado, así que no genera orden de pago.",
  },
  RANGO_INVALIDO: {
    titulo: "Revisa las fechas",
    porQue: "La hora final debe ser posterior a la inicial, y la fecha no puede estar en el pasado.",
    queHacer: "Corrige el día o las horas.",
  },
  NO_ENCONTRADO: {
    titulo: "No lo encontramos",
    porQue: "No existe, o no tienes acceso a este registro.",
    queHacer: "Vuelve a la lista y elígelo de nuevo.",
  },
  DATOS_INVALIDOS: {
    titulo: "Revisa los datos",
    queHacer: "Corrige lo que señala el mensaje y vuelve a enviar.",
  },
  API_NO_DISPONIBLE: {
    titulo: "No hay conexión con SIRA",
    porQue: "No pudimos hablar con el servidor.",
    queHacer: "Revisa tu conexión e inténtalo de nuevo en un momento.",
  },
};

/** Convierte cualquier error en una explicación corta: qué pasó, por qué y qué hacer. */
export function explicarError(error: unknown, respaldo: string): Explicacion {
  if (!(error instanceof ErrorApi)) {
    return { titulo: "No pudimos completar la acción", porQue: respaldo, queHacer: "Inténtalo de nuevo." };
  }
  const p = PLANTILLAS[error.codigo];
  const soporte = error.correlacionId;
  if (!p) {
    return {
      titulo: "No pudimos completar la acción",
      porQue: error.message,
      queHacer: "Inténtalo de nuevo. Si sigue igual, avisa al administrador y dale el código de soporte.",
      soporte,
    };
  }
  return {
    titulo: p.titulo,
    // Si la plantilla no trae explicación propia, se usa el mensaje que escribió la API.
    porQue: p.porQue ?? error.message,
    queHacer: p.queHacer,
    accion: p.accion,
    soporte,
  };
}
