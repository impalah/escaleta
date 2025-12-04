export default {
  common: {
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar'
  },
  app: {
    title: 'Escaleta',
    projectName: 'Proyecto de Escaleta'
  },
  toolbar: {
    newProject: 'Nuevo Proyecto',
    newProjectConfirm: '¿Crear nuevo proyecto? Se perderá el trabajo actual.',
    save: 'Guardar',
    export: 'Exportar',
    exportToJSON: 'Exportar a JSON',
    exportToScript: 'Exportar a Guion',
    canvasView: 'Vista Canvas',
    gridView: 'Vista Grid',
    zoomIn: 'Zoom +',
    zoomOut: 'Zoom -',
    addBeat: 'Añadir Beat',
    createGroup: 'Crear Grupo',
    language: 'Idioma'
  },
  beatTypes: {
    opening: 'Apertura',
    news: 'Noticia',
    sports: 'Deportes',
    weather: 'Clima',
    closing: 'Cierre'
  },
  beatTypeDialog: {
    title: 'Seleccionar Tipo de Beat',
    selectType: 'Selecciona el tipo de beat que deseas crear'
  },
  propertiesPanel: {
    project: 'Propiedades del Proyecto',
    beat: 'Propiedades del Beat',
    group: 'Propiedades del Grupo',
    maximize: 'Maximizar',
    restore: 'Restaurar',
    dockLeft: 'Anclar a izquierda',
    dockRight: 'Anclar a derecha'
  },
  projectProperties: {
    name: 'Nombre del Proyecto',
    description: 'Descripción',
    createdAt: 'Fecha de Creación',
    updatedAt: 'Última Actualización'
  },
  beatProperties: {
    title: 'Título',
    type: 'Tipo de Beat',
    order: 'Orden',
    eventDuration: 'Duración estimada',
    eventDurationHint: 'Formato: mm:ss.ms',
    eventStartTime: 'Hora inicio estimada',
    eventStartTimeHint: 'Formato: hh:mm:ss.ms',
    scene: 'Escena',
    sceneHint: 'Ej: INT. ESTUDIO - DÍA',
    character: 'Personaje',
    characterHint: 'Ej: Presentador Principal',
    cue: 'Cue',
    cueHint: 'Indicación técnica, evento',
    assets: 'Assets',
    assetsHint: 'Recursos necesarios',
    script: 'Guion',
    createdAt: 'Fecha de Creación',
    updatedAt: 'Última Actualización'
  },
  beatCard: {
    disconnect: 'Desconectar (Shift + Arrastrar)',
    delete: 'Eliminar Beat'
  },
  groupProperties: {
    name: 'Nombre del Grupo',
    description: 'Descripción',
    color: 'Color',
    colorHint: 'Color de fondo del grupo',
    collapsed: 'Colapsado',
    order: 'Orden',
    beats: 'Beats en el Grupo',
    createdAt: 'Fecha de Creación',
    updatedAt: 'Última Actualización',
    deleteConfirmation: '¿Estás seguro de que deseas eliminar el grupo "{name}"? Esto no eliminará los beats del interior.'
  },
  beatGrid: {
    order: 'Orden',
    title: 'Título',
    type: 'Tipo',
    duration: 'Duración',
    startTime: 'Hora Inicio',
    scene: 'Escena'
  },
  examples: {
    projectName: 'Show de Noticias de Ejemplo',
    projectDescription: 'Escaleta de ejemplo para un programa de noticias',
    beats: {
      opening: {
        title: 'Apertura',
        description: 'Introducción del programa y presentadores'
      },
      headline1: {
        title: 'Noticia Principal',
        description: 'Primera noticia destacada del día'
      },
      headline2: {
        title: 'Segunda Noticia',
        description: 'Segunda noticia importante'
      },
      sports: {
        title: 'Deportes',
        description: 'Resumen deportivo del día'
      },
      weather: {
        title: 'Clima',
        description: 'Pronóstico del tiempo'
      },
      headline3: {
        title: 'Tercera Noticia',
        description: 'Noticia adicional'
      },
      closing: {
        title: 'Cierre',
        description: 'Despedida y créditos'
      }
    },
    newBeat: 'Nuevo {type}'
  },
  languages: {
    'es-ES': 'Español',
    'en-US': 'English'
  }
}
