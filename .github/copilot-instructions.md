# Copilot Instructions for Escaleta

A Vue 3 + TypeScript beat editor for broadcast production using Clean Architecture.

## Architecture Overview

**4-Layer Clean Architecture** (dependency rule: outer → inner only):

```
presentation/ (Vue components + i18n) 
    ↓
application/ (ProjectService - business logic)
    ↓
domain/ (entities.ts - Beat, BeatType, Project types)
    ↑
infrastructure/ (LocalStorageService - persistence)
```

**Critical Pattern**: Services use dependency injection via constructor. See `ProjectService` which injects `storageService` from infrastructure layer.

**Internationalization**: Vue I18n with `vue-i18n` package. Helper functions in `i18n/helpers.ts` for translations outside component context (`t()`, `getBeatTypeName()`, `getNewBeatTitle()`). Supports Spanish (es-ES) and English (en-US).

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
npm run test:coverage    # Must meet 80% threshold (98.85% actual)
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:ui      # Playwright UI mode
npm run test:e2e:debug   # Debug E2E tests
```

## Testing Strategy (CRITICAL)

**Unit tests** (Vitest + jsdom):
- Test `application/`, `infrastructure/`, `utils/` layers
- **Presentation layer EXCLUDED from coverage** (`vite.config.ts` line 45)
- Why: Vue components better tested with E2E, not unit tests
- Coverage target: 80% for business logic (domain/application/infrastructure)

**E2E tests** (Playwright):
- Test user flows, NOT code coverage
- Auto-starts dev server (`webServer` in `playwright.config.ts`)
- Use `data-testid="beat-card"` and `aria-label` attributes for selectors
- Tests run on port 3000 (baseURL config)

**Test Setup** (`tests/setup.ts`):
- Mocks Vuetify CSS imports (jsdom doesn't handle CSS)
- Stubs all Vuetify components globally to avoid rendering complexity
- Required pattern for any new Vue component tests

## Component Patterns

**Data Flow**:
1. `BeatEditorView.vue` loads project via `ProjectService.loadCurrentProject()`
2. User edits beat → `handleSaveBeat()` → `ProjectService.updateBeat()` → auto-saves to localStorage
3. All state lives in reactive `project` ref, no Pinia/Vuex
4. **Properties Panel** (`PropertiesPanel.vue`) shows project or beat properties with real-time auto-save
5. **Beat connections** via drag & drop with magnet zones (visual feedback when hovering)

**Beat Creation Flow** (non-obvious):
1. Click "Add beat" → opens `BeatTypeSelectDialog`
2. Select type → creates beat with `ProjectService.createBeat(typeId)`
3. Beat auto-saved to localStorage immediately
4. To edit, click beat card → opens properties panel (right side by default)
5. Properties panel auto-hides when not pinned, can dock left/right, resizable

**Beat Connection System** (drag & drop with magnets):
1. Drag a beat card over another beat → magnet zones appear (top/bottom)
2. Drop on **top zone** → `connectToTop()` → beat becomes predecessor
3. Drop on **bottom zone** → `connectToBottom()` → beat becomes successor
4. **Shift + Drag** → disconnect beat from chain (`isDragToDisconnect` flag)
5. **Group movement** → dragging a connected beat moves entire chain (unless Shift pressed)
6. Magnet constants: `MAGNET_ZONE_HEIGHT = 30px`, `MAGNET_OVERLAP_THRESHOLD = 0.5` (50% overlap)

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

- `src/domain/entities.ts` - Core types (Beat, BeatType, Project, MagnetZone) - START HERE
- `src/application/ProjectService.ts` - Business logic with beat connection methods
- `src/presentation/views/BeatEditorView.vue` - Main UI with drag & drop logic
- `src/presentation/components/BeatCard.vue` - Individual beat card with drag handlers
- `src/presentation/components/PropertiesPanel.vue` - Dockable properties panel (AutoCAD-style)
- `src/i18n/helpers.ts` - Translation helpers for use outside components
- `src/i18n/locales/en-US.ts` - English translations (primary)
- `src/i18n/locales/es-ES.ts` - Spanish translations
- `src/utils/uuid.ts` - Custom UUID v4 generator
- `vite.config.ts` - Port 3000, coverage exclusions, Vuetify auto-import
- `tests/setup.ts` - Required mocks for Vuetify in tests

## Language & Localization

**Vue I18n with dual language support**:
- **Primary language**: English (en-US) - default fallback
- **Secondary language**: Spanish (es-ES)
- All translations in `src/i18n/locales/`
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
  │  │  └─ entities.ts              # Beat, BeatType, Project, MagnetZone
  │  ├─ application/
  │  │  └─ ProjectService.ts        # Business logic with connection methods
  │  ├─ infrastructure/
  │  │  └─ LocalStorageService.ts   # Persistence layer
  │  ├─ presentation/
  │  │  ├─ views/
  │  │  │  └─ BeatEditorView.vue    # Main view with drag & drop
  │  │  └─ components/
  │  │     ├─ BeatCard.vue          # Individual beat with drag handlers
  │  │     ├─ BeatEditDialog.vue    # Beat editing modal (deprecated, use PropertiesPanel)
  │  │     ├─ BeatGridView.vue      # Table view of beats
  │  │     ├─ BeatTypeSelectDialog.vue
  │  │     ├─ PropertiesPanel.vue   # Dockable panel (AutoCAD-style)
  │  │     ├─ BeatPropertiesForm.vue
  │  │     └─ ProjectPropertiesForm.vue
  │  ├─ i18n/
  │  │  ├─ index.ts                 # Vue I18n setup
  │  │  ├─ helpers.ts               # Translation helpers (t, getBeatTypeName, etc.)
  │  │  └─ locales/
  │  │     ├─ en-US.ts              # English (primary)
  │  │     └─ es-ES.ts              # Spanish
  │  ├─ plugins/
  │  │  └─ vuetify.ts
  │  └─ utils/
  │     └─ uuid.ts                  # Custom UUID v4 generator
  ├─ tests/
  │  ├─ setup.ts                    # Vuetify mocks for Vitest
  │  ├─ unit/
  │  │  ├─ ProjectService.test.ts   # 12 tests
  │  │  ├─ LocalStorageService.test.ts  # 8 tests
  │  │  ├─ uuid.test.ts             # 3 tests
  │  │  └─ BeatEditorView.test.ts   # 3 tests (basic rendering)
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
6. **Don't use string literals for UI text** - Use `t()` helper or `$t()` in templates for i18n
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
