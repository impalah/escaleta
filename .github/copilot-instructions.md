# Copilot Instructions for Escaleta

A Vue 3 + TypeScript beat editor for broadcast production using Clean Architecture.

## Architecture Overview

**4-Layer Clean Architecture** (dependency rule: outer → inner only):

```
presentation/ (Vue components) 
    ↓
application/ (ProjectService - business logic)
    ↓
domain/ (entities.ts - Beat, BeatType, Project types)
    ↑
infrastructure/ (LocalStorageService - persistence)
```

**Critical Pattern**: Services use dependency injection via constructor. See `ProjectService` which injects `storageService` from infrastructure layer.

## Core Workflows

**Development**:
```bash
npm run dev              # Vite dev server on port 3000 (NOT 5173)
npm run build            # TypeScript check + Vite build
npm run preview          # Preview production build
```

**Testing**:
```bash
npm test                 # Unit tests (Vitest)
npm run test:coverage    # Must meet 80% threshold (98.85% actual)
npm run test:e2e         # Playwright E2E tests (7 tests)
npm run test:e2e:ui      # Playwright UI mode
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

**Beat Creation Flow** (non-obvious):
1. Click "Add beat" → opens `BeatTypeSelectDialog`
2. Select type → creates beat with `ProjectService.createBeat(typeId)`
3. Beat auto-saved to localStorage immediately
4. To edit, click beat card → opens `BeatEditDialog`

**Vuetify v3 Specifics**:
- Auto-import enabled (`vite-plugin-vuetify`)
- Material Design Icons via `@mdi/font`
- Use `v-model` not `:model-value` + `@update:model-value` for dialogs

## File Conventions

**Naming**:
- Services: `PascalCaseService.ts` with singleton export (`export const projectService = new ProjectService()`)
- Components: `PascalCase.vue`
- Types: Defined in `domain/entities.ts`, imported as `import type { Beat } from '@/domain/entities'`

**Path Alias**:
- `@/` resolves to `src/` (Vite config)
- Always use `@/` for imports, never relative paths across layers

## Key Files Reference

- `src/domain/entities.ts` - Core types (Beat, BeatType, Project) - START HERE
- `src/application/ProjectService.ts` - Business logic, example data generation
- `src/presentation/views/BeatEditorView.vue` - Main UI orchestration
- `vite.config.ts` - Port 3000, coverage exclusions, Vuetify auto-import
- `tests/setup.ts` - Required mocks for Vuetify in tests

## Language & Localization

**All user-facing text in English** (project was translated from Spanish):
- Beat types: "Opening", "News", "Sports", "Weather", "Closing"
- UI labels: Use English in templates and tooltips
- Example project: "Example News Show" with English beat titles

## Common Pitfalls

1. **Don't add Pinia/Vuex** - State managed in component refs + localStorage
2. **Don't unit test Vue components** - They're excluded from coverage, use E2E
3. **Don't mock localStorage in E2E** - Tests use real localStorage, cleared in `beforeEach`
4. **Don't import Vuetify components** - Auto-imported via `vite-plugin-vuetify`
5. **Don't change dev server port** - Hardcoded to 3000 in multiple configs

## TODO Markers (Future Work)

- Drag & drop for beat positioning (line 71 in `README.md`)
- Export to JSON/script format (`ProjectService.ts` TODOs)
- New project dialog (`BeatEditorView.vue` handleNewProject)
- Grid background for canvas (`BeatEditorView.vue` styles)
