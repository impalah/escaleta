/**
 * Field metadata system for dynamic form rendering
 * Defines how each entity field should be displayed and edited
 */

export type FieldType =
  | 'text' // Single line input
  | 'textarea' // Multi-line input
  | 'number' // Numeric input
  | 'time' // Time input with format
  | 'datetime' // Date/time input with format
  | 'select' // Dropdown selection
  | 'multiselect' // Multiple selection
  | 'tags' // Tag/chip input (for arrays)
  | 'color' // Color picker
  | 'boolean' // Checkbox/switch

export type FieldCategory =
  | 'editable' // User-editable fields (shown in properties panel)
  | 'system' // System fields (id, createdAt, updatedAt - not editable)
  | 'computed' // Computed/derived fields (read-only)
  | 'internal' // Internal app fields (position, order - managed by app)

export interface FieldFormat {
  pattern?: string // Regex pattern for validation
  placeholder?: string // Placeholder text (i18n key)
  min?: number // Min value (for numbers/time)
  max?: number // Max value (for numbers/time)
  step?: number // Step increment (for numbers)
  options?: Array<{
    // Options for select/multiselect
    value: string
    label: string // i18n key
  }>
  timeFormat?: 'hh:mm' | 'mm:ss' | 'hh:mm:ss' | 'mm:ss.ms' | 'hh:mm:ss.ms'
  mask?: string // Input mask (e.g., "##:##:##")
}

export interface FieldMetadata {
  key: string // Field name in the entity
  type: FieldType // Render type
  label: string // i18n key for label
  category: FieldCategory // Field category
  description?: string // i18n key for help text
  format?: FieldFormat // Format/validation rules
  required?: boolean // Is field required
  readonly?: boolean // Is field read-only
  group?: string // Logical grouping (e.g., 'timing', 'production')
  order?: number // Display order
  showInGrid?: boolean // Show in grid view
  showInCanvas?: boolean // Show in canvas properties panel
}

// ============================================================================
// BEAT FIELDS
// ============================================================================

export const BEAT_FIELDS: FieldMetadata[] = [
  // === SYSTEM FIELDS (never shown in properties panel) ===
  {
    key: 'id',
    type: 'text',
    label: 'common.fields.id',
    category: 'system',
    readonly: true,
    showInGrid: false,
    showInCanvas: false
  },
  {
    key: 'createdAt',
    type: 'datetime',
    label: 'common.fields.createdAt',
    category: 'system',
    readonly: true,
    showInGrid: false,
    showInCanvas: false
  },
  {
    key: 'updatedAt',
    type: 'datetime',
    label: 'common.fields.updatedAt',
    category: 'system',
    readonly: true,
    showInGrid: false,
    showInCanvas: false
  },

  // === INTERNAL FIELDS (managed by the app) ===
  {
    key: 'order',
    type: 'number',
    label: 'beat.fields.order',
    category: 'internal',
    readonly: true,
    showInGrid: true,
    showInCanvas: false
  },
  {
    key: 'links',
    type: 'tags',
    label: 'beat.fields.links',
    category: 'internal',
    readonly: true,
    showInGrid: false,
    showInCanvas: false
  },
  {
    key: 'prevBeatId',
    type: 'text',
    label: 'beat.fields.prevBeat',
    category: 'internal',
    readonly: true,
    showInGrid: false,
    showInCanvas: false
  },
  {
    key: 'nextBeatId',
    type: 'text',
    label: 'beat.fields.nextBeat',
    category: 'internal',
    readonly: true,
    showInGrid: false,
    showInCanvas: false
  },
  {
    key: 'position',
    type: 'text',
    label: 'beat.fields.position',
    category: 'internal',
    readonly: true,
    showInGrid: false,
    showInCanvas: false
  },

  // === EDITABLE FIELDS (shown in properties panel) ===
  {
    key: 'title',
    type: 'text',
    label: 'beat.fields.title',
    category: 'editable',
    required: true,
    order: 1,
    showInGrid: true,
    showInCanvas: true
  },
  {
    key: 'typeId',
    type: 'select',
    label: 'beat.fields.type',
    category: 'editable',
    required: true,
    order: 2,
    showInGrid: true,
    showInCanvas: true
    // Options populated dynamically from project.beatTypes
  },
  {
    key: 'description',
    type: 'textarea',
    label: 'beat.fields.script',
    category: 'editable',
    description: 'beat.fields.scriptHelp',
    order: 3,
    showInGrid: true,
    showInCanvas: true,
    format: {
      placeholder: 'beat.fields.scriptPlaceholder'
    }
  },

  // === TIMING FIELDS ===
  {
    key: 'eventStartTime',
    type: 'time',
    label: 'beat.fields.eventStartTime',
    category: 'editable',
    group: 'timing',
    order: 10,
    showInGrid: true,
    showInCanvas: true,
    format: {
      timeFormat: 'hh:mm:ss.ms',
      placeholder: '00:00:00.000',
      mask: '##:##:##.###'
    }
  },
  {
    key: 'eventDuration',
    type: 'time',
    label: 'beat.fields.eventDuration',
    category: 'editable',
    group: 'timing',
    order: 11,
    showInGrid: true,
    showInCanvas: true,
    format: {
      timeFormat: 'mm:ss.ms',
      placeholder: '00:00.000',
      mask: '##:##.###'
    }
  },

  // === PRODUCTION FIELDS ===
  {
    key: 'scene',
    type: 'text',
    label: 'beat.fields.scene',
    category: 'editable',
    group: 'production',
    order: 20,
    showInGrid: true,
    showInCanvas: true,
    format: {
      placeholder: 'beat.fields.scenePlaceholder'
    }
  },
  {
    key: 'character',
    type: 'text',
    label: 'beat.fields.character',
    category: 'editable',
    group: 'production',
    order: 21,
    showInGrid: true,
    showInCanvas: true
  },
  {
    key: 'cue',
    type: 'tags',
    label: 'beat.fields.cue',
    category: 'editable',
    group: 'production',
    order: 22,
    showInGrid: true,
    showInCanvas: true,
    format: {
      placeholder: 'beat.fields.cuePlaceholder'
    }
  },
  {
    key: 'assets',
    type: 'tags',
    label: 'beat.fields.assets',
    category: 'editable',
    group: 'production',
    order: 23,
    showInGrid: true,
    showInCanvas: true
  }
]

// ============================================================================
// BEAT GROUP FIELDS
// ============================================================================

export const BEAT_GROUP_FIELDS: FieldMetadata[] = [
  // System fields
  {
    key: 'id',
    type: 'text',
    label: 'common.fields.id',
    category: 'system',
    readonly: true,
    showInGrid: false,
    showInCanvas: false
  },
  {
    key: 'createdAt',
    type: 'datetime',
    label: 'common.fields.createdAt',
    category: 'system',
    readonly: true,
    showInGrid: false,
    showInCanvas: false
  },
  {
    key: 'updatedAt',
    type: 'datetime',
    label: 'common.fields.updatedAt',
    category: 'system',
    readonly: true,
    showInGrid: false,
    showInCanvas: false
  },

  // Internal fields
  {
    key: 'beatIds',
    type: 'tags',
    label: 'group.fields.beatIds',
    category: 'internal',
    readonly: true,
    showInGrid: false,
    showInCanvas: false
  },
  {
    key: 'position',
    type: 'text',
    label: 'common.fields.position',
    category: 'internal',
    readonly: true,
    showInGrid: false,
    showInCanvas: false
  },
  {
    key: 'order',
    type: 'number',
    label: 'common.fields.order',
    category: 'internal',
    readonly: true,
    showInGrid: false,
    showInCanvas: false
  },
  {
    key: 'collapsed',
    type: 'boolean',
    label: 'group.fields.collapsed',
    category: 'internal',
    readonly: true,
    showInGrid: false,
    showInCanvas: false
  },

  // Editable fields
  {
    key: 'name',
    type: 'text',
    label: 'group.fields.name',
    category: 'editable',
    required: true,
    order: 1,
    showInGrid: true,
    showInCanvas: true
  },
  {
    key: 'description',
    type: 'textarea',
    label: 'group.fields.description',
    category: 'editable',
    order: 2,
    showInGrid: true,
    showInCanvas: true
  },
  {
    key: 'color',
    type: 'color',
    label: 'group.fields.color',
    category: 'editable',
    order: 3,
    showInGrid: true,
    showInCanvas: true
  }
]

// ============================================================================
// BLOCK FIELDS
// ============================================================================

export const BLOCK_FIELDS: FieldMetadata[] = [
  // System fields
  {
    key: 'id',
    type: 'text',
    label: 'common.fields.id',
    category: 'system',
    readonly: true,
    showInGrid: false,
    showInCanvas: false
  },
  {
    key: 'createdAt',
    type: 'datetime',
    label: 'common.fields.createdAt',
    category: 'system',
    readonly: true,
    showInGrid: false,
    showInCanvas: false
  },
  {
    key: 'updatedAt',
    type: 'datetime',
    label: 'common.fields.updatedAt',
    category: 'system',
    readonly: true,
    showInGrid: false,
    showInCanvas: false
  },

  // Internal fields
  {
    key: 'groupIds',
    type: 'tags',
    label: 'block.fields.groupIds',
    category: 'internal',
    readonly: true,
    showInGrid: false,
    showInCanvas: false
  },
  {
    key: 'position',
    type: 'text',
    label: 'common.fields.position',
    category: 'internal',
    readonly: true,
    showInGrid: false,
    showInCanvas: false
  },

  // Editable fields
  {
    key: 'name',
    type: 'text',
    label: 'block.fields.name',
    category: 'editable',
    required: true,
    order: 1,
    showInGrid: true,
    showInCanvas: true
  },
  {
    key: 'color',
    type: 'color',
    label: 'block.fields.color',
    category: 'editable',
    order: 2,
    showInGrid: true,
    showInCanvas: true
  }
]

// ============================================================================
// LANE FIELDS
// ============================================================================

export const LANE_FIELDS: FieldMetadata[] = [
  // System fields
  {
    key: 'id',
    type: 'text',
    label: 'common.fields.id',
    category: 'system',
    readonly: true,
    showInGrid: false,
    showInCanvas: false
  },
  {
    key: 'createdAt',
    type: 'datetime',
    label: 'common.fields.createdAt',
    category: 'system',
    readonly: true,
    showInGrid: false,
    showInCanvas: false
  },
  {
    key: 'updatedAt',
    type: 'datetime',
    label: 'common.fields.updatedAt',
    category: 'system',
    readonly: true,
    showInGrid: false,
    showInCanvas: false
  },

  // Internal fields
  {
    key: 'blockIds',
    type: 'tags',
    label: 'lane.fields.blockIds',
    category: 'internal',
    readonly: true,
    showInGrid: false,
    showInCanvas: false
  },
  {
    key: 'position',
    type: 'text',
    label: 'common.fields.position',
    category: 'internal',
    readonly: true,
    showInGrid: false,
    showInCanvas: false
  },

  // Editable fields
  {
    key: 'name',
    type: 'text',
    label: 'lane.fields.name',
    category: 'editable',
    required: true,
    order: 1,
    showInGrid: true,
    showInCanvas: true
  },
  {
    key: 'color',
    type: 'color',
    label: 'lane.fields.color',
    category: 'editable',
    order: 2,
    showInGrid: true,
    showInCanvas: true
  }
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

type EntityType = 'beat' | 'group' | 'block' | 'lane'

const FIELD_REGISTRY: Record<EntityType, FieldMetadata[]> = {
  beat: BEAT_FIELDS,
  group: BEAT_GROUP_FIELDS,
  block: BLOCK_FIELDS,
  lane: LANE_FIELDS
}

/**
 * Get field metadata for a specific field in an entity
 */
export function getFieldMetadata(
  entityType: EntityType,
  fieldKey: string
): FieldMetadata | undefined {
  return FIELD_REGISTRY[entityType].find(f => f.key === fieldKey)
}

/**
 * Get all fields for an entity type
 */
export function getEntityFields(entityType: EntityType): FieldMetadata[] {
  return FIELD_REGISTRY[entityType]
}

/**
 * Get only editable fields (for properties panel)
 */
export function getEditableFields(
  entityType: EntityType,
  context: 'grid' | 'canvas' = 'canvas'
): FieldMetadata[] {
  return FIELD_REGISTRY[entityType]
    .filter(f => f.category === 'editable')
    .filter(f => (context === 'grid' ? f.showInGrid : f.showInCanvas))
    .sort((a, b) => (a.order || 0) - (b.order || 0))
}

/**
 * Get system fields (for debugging/logs)
 */
export function getSystemFields(entityType: EntityType): FieldMetadata[] {
  return FIELD_REGISTRY[entityType].filter(f => f.category === 'system')
}

/**
 * Get internal fields (for technical views)
 */
export function getInternalFields(entityType: EntityType): FieldMetadata[] {
  return FIELD_REGISTRY[entityType].filter(f => f.category === 'internal')
}

/**
 * Check if field is first in its group (for rendering group headers)
 */
export function isFirstInGroup(field: FieldMetadata, fields: FieldMetadata[]): boolean {
  if (!field.group) return false
  const fieldsInGroup = fields.filter(f => f.group === field.group)
  return fieldsInGroup[0]?.key === field.key
}
