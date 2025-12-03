export default {
  common: {
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit'
  },
  app: {
    title: 'Escaleta',
    projectName: 'Escaleta Project'
  },
  toolbar: {
    newProject: 'New Project',
    save: 'Save',
    export: 'Export',
    exportToJSON: 'Export to JSON',
    exportToScript: 'Export to Script',
    canvasView: 'Canvas View',
    gridView: 'Grid View',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    addBeat: 'Add Beat',
    language: 'Language'
  },
  beatTypes: {
    opening: 'Opening',
    news: 'News',
    sports: 'Sports',
    weather: 'Weather',
    closing: 'Closing'
  },
  beatTypeDialog: {
    title: 'Select Beat Type',
    selectType: 'Select the type of beat you want to create'
  },
  propertiesPanel: {
    project: 'Project Properties',
    beat: 'Beat Properties',
    maximize: 'Maximize',
    restore: 'Restore',
    dockLeft: 'Dock Left',
    dockRight: 'Dock Right'
  },
  projectProperties: {
    name: 'Project Name',
    description: 'Description',
    createdAt: 'Created At',
    updatedAt: 'Last Updated'
  },
  beatProperties: {
    title: 'Title',
    type: 'Beat Type',
    order: 'Order',
    eventDuration: 'Estimated Duration',
    eventDurationHint: 'Format: mm:ss.ms',
    eventStartTime: 'Estimated Start Time',
    eventStartTimeHint: 'Format: hh:mm:ss.ms',
    scene: 'Scene',
    sceneHint: 'E.g: INT. STUDIO - DAY',
    character: 'Character',
    characterHint: 'E.g: Main Presenter',
    cue: 'Cue',
    cueHint: 'Technical cue, event',
    assets: 'Assets',
    assetsHint: 'Required resources',
    script: 'Script',
    createdAt: 'Created At',
    updatedAt: 'Last Updated'
  },
  beatCard: {
    disconnect: 'Disconnect (Shift + Drag)',
    delete: 'Delete Beat'
  },
  beatGrid: {
    order: 'Order',
    title: 'Title',
    type: 'Type',
    duration: 'Duration',
    startTime: 'Start Time',
    scene: 'Scene'
  },
  examples: {
    projectName: 'Example News Show',
    projectDescription: 'Sample rundown for a news program',
    beats: {
      opening: {
        title: 'Opening',
        description: 'Program introduction and presenters'
      },
      headline1: {
        title: 'Main Headline',
        description: 'First major news story of the day'
      },
      headline2: {
        title: 'Second Story',
        description: 'Second important news item'
      },
      sports: {
        title: 'Sports',
        description: 'Sports roundup of the day'
      },
      weather: {
        title: 'Weather',
        description: 'Weather forecast'
      },
      headline3: {
        title: 'Third Story',
        description: 'Additional news story'
      },
      closing: {
        title: 'Closing',
        description: 'Sign-off and credits'
      }
    },
    newBeat: 'New {type}'
  },
  languages: {
    'es-ES': 'Español',
    'en-US': 'English'
  }
}
