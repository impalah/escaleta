export default {
  common: {
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    none: 'None'
  },
  app: {
    title: 'Escaleta',
    projectName: 'Escaleta Project'
  },
  toolbar: {
    newProject: 'New Project',
    newProjectConfirm: 'Create new project? Current work will be lost.',
    save: 'Save',
    export: 'Export',
    exportToJSON: 'Export to JSON',
    exportToScript: 'Export to Script',
    canvasView: 'Canvas View',
    gridView: 'Grid View',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    addBeat: 'Add Beat',
    createGroup: 'Create Group',
    createBlock: 'Create Block',
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
    group: 'Group Properties',
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
    delete: 'Delete Beat',
    deleteConfirm: 'Are you sure you want to delete the beat "{title}"?'
  },
  groupProperties: {
    name: 'Group Name',
    description: 'Description',
    color: 'Color',
    colorHint: 'Background color for the group',
    collapsed: 'Collapsed',
    order: 'Order',
    beats: 'Beats in Group',
    createdAt: 'Created At',
    updatedAt: 'Last Updated',
    deleteConfirmation: 'Are you sure you want to delete the group "{name}"? This will not delete the beats inside.',
    deleteConfirm: 'Are you sure you want to delete the group "{name}"?'
  },
  blockProperties: {
    name: 'Block Name',
    description: 'Description',
    backgroundColor: 'Background Color',
    order: 'Order',
    groups: 'Groups in Block',
    createdAt: 'Created At',
    updatedAt: 'Last Updated',
    deleteConfirm: 'Are you sure you want to delete block "{name}"?'
  },
  laneProperties: {
    name: 'Lane Name',
    blocks: 'Blocks in Lane',
    createdAt: 'Created At',
    updatedAt: 'Last Updated'
  },
  messages: {
    confirmDeleteBlock: 'Are you sure you want to delete this block? Groups will remain.',
    confirmDeleteLane: 'Are you sure you want to delete this lane? Blocks will remain.'
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
