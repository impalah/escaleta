# Copilot Instructions for Escaleta

A Vue 3 + TypeScript beat editor for broadcast production using Clean Architecture with **modular, functional design**.

## Architecture Overview

**Hybrid Architecture** (Functional Core + Service Shell):

```
presentation/ (Vue components + i18n + composables + router)
    ↓
services/ (DragAndDropService, CollisionDetectionService, PositionCalculationService)
    ↓
application/ (ProjectService facade + specialized services/)
    ↓  ├─ BeatManagementService
    ↓  ├─ BlockManagementService
    ↓  └─ LaneManagementService
    ↓
domain/ (entities.ts + operations/ - pure functions)
    ↑  ├─ beatOperations.ts
    ↑  ├─ groupOperations.ts
    ↑  ├─ blockOperations.ts
    ↑  ├─ laneOperations.ts
    ↑  └─ geometry.ts
infrastructure/ (LocalStorageService - persistence)
```

**Critical Patterns**:

- **Functional Core**: All `domain/operations/` are pure functions (no side effects, immutable)
- **Service Shell**: `application/services/` orchestrate operations and handle cross-entity logic
- **Facade Pattern**: `ProjectService` maintains backward compatibility, delegates to specialized services
- **Dependency Injection**: Services injected via constructor (e.g., `ProjectService` injects `storageService`)
- **Composables**: Vue 3 composables in `composables/` for reusable UI logic (`useDraggable`, `useHoverable`)

**Internationalization**: Vue I18n with `vue-i18n` package. **All translations are in JSON files** (`en-US.json` and `es-ES.json`). Helper functions in `i18n/helpers.ts` for translations outside component context (`t()`, `getBeatTypeName()`, `getNewBeatTitle()`). Supports Spanish (es-ES) and English (en-US).

## Core Workflows

**Development**:

```bash
npm run dev              # Vite dev server on port 3000 (NOT 5173)
npm run build            # TypeScript check + Vite build
npm run preview          # Preview production build
npm run lint             # ESLint check
npm run format           # Prettier formatting
```

**Testing**:

```bash
npm test                 # Unit tests (Vitest)
npm run test:watch       # Tests in watch mode
npm run test:coverage    # Must meet 80% threshold
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:ui      # Playwright UI mode
npm run test:e2e:debug   # Debug E2E tests
```

**Routing**:

- Default route `/` redirects to `/canvas`
- `/canvas` - Canvas view with drag & drop (BeatEditorView.vue)
- `/grid` - Grid/table view (BeatGridViewPage.vue)
- Router configured in `src/router/index.ts` with document title updates

## Testing Strategy (CRITICAL)

**Unit tests** (Vitest + jsdom):

- Test `application/`, `infrastructure/`, `utils/`, `domain/operations/` layers
- **Presentation layer EXCLUDED from coverage** (`vite.config.ts`)
- Why: Vue components better tested with E2E, not unit tests
- Coverage target: 80% for business logic

**Test files** (updated):

- `beatOperations.test.ts`, `groupOperations.test.ts`, `blockOperations.test.ts`, `laneOperations.test.ts` - Pure function tests
- `geometry.test.ts` - Layout calculation tests
- `services.test.ts` - BeatManagementService, BlockManagementService, LaneManagementService tests
- `ProjectService.test.ts` - Facade integration tests
- `CollisionDetectionService.test.ts`, `DragAndDropService.test.ts`, `PositionCalculationService.test.ts` - Service tests
- `useHoverable.test.ts` - Composable tests
- `i18n.test.ts` - Internationalization tests
- `LocalStorageService.test.ts`, `uuid.test.ts` - Infrastructure tests

**E2E tests** (Playwright):

- Test user flows, NOT code coverage
- Auto-starts dev server (`webServer` in `playwright.config.ts`)
- Use `data-testid` and `aria-label` attributes for selectors
- Tests run on port 3000 (baseURL config)

**Test Setup** (`tests/setup.ts`):

- Mocks Vuetify CSS imports (jsdom doesn't handle CSS)
- Stubs all Vuetify components globally to avoid rendering complexity
- Required pattern for any new Vue component tests

## Component Patterns

**Data Flow**:

1. `BeatEditorView.vue` loads project via `ProjectService.loadCurrentProject()`
2. User edits beat/group/block/lane → `ProjectService` methods → auto-saves to localStorage
3. All state lives in reactive `project` ref, no Pinia/Vuex
4. **Properties Panel** (`PropertiesPanel.vue`) shows project, beat, group, block, or lane properties with real-time auto-save
5. **Drag & Drop** handled by `DragAndDropService` with collision detection

**New Entity Hierarchy**:

- **Beats**: Individual production segments (unchanged)
- **BeatGroups**: Collections of related beats that move together
- **Blocks**: Horizontal containers for multiple BeatGroups
- **Lanes**: Vertical containers for multiple Blocks (full production timeline)

**Beat Creation Flow**:

1. Click "Add beat" → opens `BeatTypeSelectDialog`
2. Select type → creates beat with `ProjectService.createBeat(typeId)`
3. Beat auto-saved to localStorage immediately
4. To edit, click beat card → opens properties panel
5. Properties panel auto-hides when not pinned, can dock left/right/top/bottom, resizable

**Group/Block/Lane Creation**:

1. **Create Group**: Click "Create Group" button → creates empty BeatGroup
2. **Add to Group**: Drag beat onto group card to add it
3. **Create Block**: Click "Create Block" button → requires ≥2 groups to link
4. **Create Lane**: Select blocks → creates vertical lane container

**Drag & Drop System** (enhanced with composables):

1. **useDraggable** composable handles mouse/touch events with threshold detection
2. **DragAndDropService** manages global drag state and collision detection
3. **CollisionDetectionService** detects overlaps between elements
4. **PositionCalculationService** computes grid layouts and automatic positioning
5. Visual feedback: hover states, magnet zones, collision highlighting

**Vuetify v3 Specifics**:

- Auto-import enabled (`vite-plugin-vuetify`)
- Material Design Icons via `@mdi/font`
- Use `v-model` not `:model-value` + `@update:model-value` for dialogs

## Beat Production Fields

The `Beat` entity includes professional broadcast production fields:

- **Core fields**: `id`, `title`, `description` (script content), `typeId`, `order`, `position`, `createdAt`, `updatedAt`
- **Connection fields**: `prevBeatId`, `nextBeatId` (for sequential beat chains)
- **Timing fields**:
  - `eventDuration` - Format: `mm:ss.ms` (e.g., "02:30" or "02:30.500")
  - `eventStartTime` - Format: `hh:mm:ss.ms` (e.g., "18:30:00" or "18:30:00.250")
- **Production fields**:
  - `scene` - Location/setting indicators (e.g., "INT. STUDIO - DAY")
  - `character` - Talent/performer performing the action (e.g., "Main Presenter")
  - `cue` - Technical cue or trigger event (e.g., "VTR START", "CAMERA 2")
  - `assets` - Array of required resources/assets for the beat

All production fields are **optional** and visible in the Properties Panel when editing a beat.

## File Conventions

**Naming**:

- Services: `PascalCaseService.ts` with singleton export (`export const projectService = new ProjectService()`)
- Components: `PascalCase.vue`
- Types: Defined in `domain/entities.ts`, imported as `import type { Beat } from '@/domain/entities'`
- i18n helpers: `camelCase` functions in `i18n/helpers.ts`

**Path Alias**:

- `@/` resolves to `src/` (Vite config)
- Always use `@/` for imports, never relative paths across layers

**UUID Generation**:

- Custom implementation in `utils/uuid.ts` (no external library)
- Import as `import { v4 as uuidv4 } from '@/utils/uuid'`
- Simple pattern-based generator (consider upgrading to 'uuid' library for production)

## Key Files Reference

- `src/domain/entities.ts` - Core types (Beat, BeatType, Project, BeatGroup, Block, Lane) - START HERE
- `src/domain/operations/` - Pure functions for entity operations (beatOperations, groupOperations, blockOperations, laneOperations, geometry)
- `src/application/ProjectService.ts` - Facade pattern, delegates to specialized services
- `src/application/services/` - Orchestration layer (BeatManagementService, BlockManagementService, LaneManagementService)
- `src/services/` - Presentation services (DragAndDropService, CollisionDetectionService, PositionCalculationService)
- `src/composables/` - Reusable Vue composition functions (useDraggable, useHoverable)
- `src/presentation/views/BeatEditorView.vue` - Canvas view with drag & drop
- `src/presentation/views/BeatGridViewPage.vue` - Grid/table view
- `src/presentation/components/BeatCard.vue` - Individual beat card
- `src/presentation/components/BeatGroupCard.vue` - Group container card
- `src/presentation/components/BlockCard.vue` - Block container card
- `src/presentation/components/LaneCard.vue` - Lane container card
- `src/presentation/components/PropertiesPanel.vue` - Dockable properties panel (AutoCAD-style)
- `src/router/index.ts` - Vue Router configuration
- `src/i18n/helpers.ts` - Translation helpers for use outside components
- `src/i18n/locales/en-US.json` - English translations (source of truth)
- `src/i18n/locales/es-ES.json` - Spanish translations (source of truth)
- `src/utils/uuid.ts` - Custom UUID v4 generator
- `vite.config.ts` - Port 3000, coverage exclusions, Vuetify auto-import
- `tests/setup.ts` - Required mocks for Vuetify in tests

## Language & Localization

**Vue I18n with dual language support**:

- **Primary language**: English (en-US) - default fallback
- **Secondary language**: Spanish (es-ES)
- **All translations in JSON files**: `src/i18n/locales/en-US.json` and `es-ES.json`
- When adding new translations, update both JSON files
- Use `t()` helper from `i18n/helpers.ts` for translations outside components
- Use `$t()` in Vue templates (auto-injected by Vue I18n)
- Beat types: "Opening", "News", "Sports", "Weather", "Closing" (English)
- Example project: "Example News Show" with English beat titles
- Language selector in toolbar (flag icon)

## Directory Structure

```
escaleta/
  ├─ src/
  │  ├─ main.ts
  │  ├─ App.vue
  │  ├─ env.d.ts
  │  ├─ domain/
  │  │  ├─ entities.ts              # Beat, BeatType, Project, BeatGroup, Block, Lane
  │  │  └─ operations/              # Pure functions (functional core)
  │  │     ├─ beatOperations.ts     # Beat CRUD operations
  │  │     ├─ groupOperations.ts    # BeatGroup operations + positioning
  │  │     ├─ blockOperations.ts    # Block operations + horizontal layout
  │  │     ├─ laneOperations.ts     # Lane operations + vertical stacking
  │  │     ├─ geometry.ts           # Layout calculations & constants
  │  │     └─ index.ts              # Barrel export
  │  ├─ application/
  │  │  ├─ ProjectService.ts        # Facade pattern (delegates to services)
  │  │  └─ services/                # Orchestration layer
  │  │     ├─ BeatManagementService.ts   # Beat + BeatGroup coordination
  │  │     ├─ BlockManagementService.ts  # Block orchestration
  │  │     ├─ LaneManagementService.ts   # Lane orchestration
  │  │     └─ index.ts              # Barrel export
  │  ├─ infrastructure/
  │  │  └─ LocalStorageService.ts   # Persistence layer
  │  ├─ services/                   # Presentation services
  │  │  ├─ DragAndDropService.ts    # Global drag state management
  │  │  ├─ CollisionDetectionService.ts  # Overlap detection
  │  │  └─ PositionCalculationService.ts # Auto-positioning
  │  ├─ composables/                # Vue 3 composition functions
  │  │  ├─ useDraggable.ts          # Drag behavior with threshold
  │  │  └─ useHoverable.ts          # Hover detection with bounding boxes
  │  ├─ presentation/
  │  │  ├─ views/
  │  │  │  ├─ BeatEditorView.vue    # Canvas view with drag & drop
  │  │  │  └─ BeatGridViewPage.vue  # Grid/table view
  │  │  └─ components/
  │  │     ├─ AppToolbar.vue        # Top navigation bar
  │  │     ├─ BeatCard.vue          # Individual beat with drag handlers
  │  │     ├─ BeatGroupCard.vue     # Group container card
  │  │     ├─ BlockCard.vue         # Block container card
  │  │     ├─ LaneCard.vue          # Lane container card
  │  │     ├─ BeatEditDialog.vue    # Beat editing modal (deprecated)
  │  │     ├─ BeatGridView.vue      # Table view of beats
  │  │     ├─ BeatTypeSelectDialog.vue
  │  │     ├─ PropertiesPanel.vue   # Dockable panel (AutoCAD-style)
  │  │     ├─ BeatPropertiesForm.vue
  │  │     ├─ GroupPropertiesForm.vue
  │  │     ├─ BlockPropertiesForm.vue
  │  │     ├─ LanePropertiesForm.vue
  │  │     ├─ ProjectPropertiesForm.vue
  │  │     └─ CellEditorForm.vue    # Grid cell editor
  │  ├─ router/
  │  │  └─ index.ts                 # Vue Router (canvas/grid routes)
  │  ├─ i18n/
  │  │  ├─ index.ts                 # Vue I18n setup
  │  │  ├─ helpers.ts               # Translation helpers (t, getBeatTypeName, etc.)
  │  │  └─ locales/
  │  │     ├─ en-US.ts              # English (primary)
  │  │     ├─ en-US.json            # English JSON (backup)
  │  │     ├─ es-ES.ts              # Spanish
  │  │     └─ es-ES.json            # Spanish JSON (backup)
  │  ├─ plugins/
  │  │  └─ vuetify.ts
  │  └─ utils/
  │     └─ uuid.ts                  # Custom UUID v4 generator
  ├─ tests/
  │  ├─ setup.ts                    # Vuetify mocks for Vitest
  │  ├─ unit/
  │  │  ├─ ProjectService.test.ts   # Facade integration tests
  │  │  ├─ services.test.ts         # Specialized services tests
  │  │  ├─ beatOperations.test.ts   # Pure function tests
  │  │  ├─ groupOperations.test.ts  # Group operations tests
  │  │  ├─ blockOperations.simple.test.ts  # Block operations tests
  │  │  ├─ laneOperations.simple.test.ts   # Lane operations tests
  │  │  ├─ geometry.test.ts         # Layout calculations tests
  │  │  ├─ CollisionDetectionService.test.ts
  │  │  ├─ DragAndDropService.test.ts
  │  │  ├─ PositionCalculationService.test.ts
  │  │  ├─ useHoverable.test.ts     # Composable tests
  │  │  ├─ i18n.test.ts             # i18n tests
  │  │  ├─ LocalStorageService.test.ts
  │  │  ├─ uuid.test.ts
  │  │  └─ BeatEditorView.test.ts   # Basic rendering (excluded from coverage)
  │  └─ e2e/
  │     ├─ beat-editor.spec.ts      # Full user flows
  │     └─ mobile-touch.spec.ts
  ├─ vite.config.ts
  ├─ tsconfig.json
  ├─ tsconfig.node.json
  ├─ playwright.config.ts
  ├─ package.json
  └─ README.md
```

## Common Pitfalls

1. **Don't add Pinia/Vuex** - State managed in component refs + localStorage
2. **Don't unit test Vue components** - They're excluded from coverage, use E2E
3. **Don't mock localStorage in E2E** - Tests use real localStorage, cleared in `beforeEach`
4. **Don't import Vuetify components** - Auto-imported via `vite-plugin-vuetify`
5. **Don't change dev server port** - Hardcoded to 3000 in multiple configs
6. **Don't use string literals for UI text** - Use `t()` helper or `$t()` in templates, all translations in JSON files
7. **Don't modify beat positions directly** - Use ProjectService methods (`connectToTop()`, `connectToBottom()`, etc.)
8. **Don't create circular beat chains** - ProjectService has protection (`isAfterBeat()` with visited Set)
9. **Don't use external UUID library** - Custom implementation in `utils/uuid.ts` (simple but sufficient)

## TODO Markers (Future Work)

- [x] ~~Drag & drop for beat positioning~~ (DONE)
- [x] ~~Grid/table view~~ (DONE - see BeatGridView.vue)
- [x] ~~Beat ordering system~~ (DONE - order field in Beat)
- [x] ~~Beat connection system~~ (DONE - magnet zones with visual feedback)
- [ ] Export to JSON/script format (`ProjectService.ts` TODOs)
- [ ] Import from external formats
- [ ] New project dialog (`BeatEditorView.vue` handleNewProject - currently just creates default)
- [ ] Side panel with filters by type/character
- [ ] Multiple projects support
- [ ] Dark mode
- [ ] Grid snap for beat alignment on canvas
