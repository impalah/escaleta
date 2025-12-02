# Escaleta - Beat Editor for Audiovisual Production

Visual rundown editor for TV show and news production.

## 🚀 Features

- **Visual beat editor** with canvas-style positionable cards
- **Beat connections** - Smart magnet zones for linking beats in sequence with visual feedback
- **Group movement** - Drag connected beats as a group, or use Shift+Drag to move individually
- **Grid view** - Switch between canvas and table/grid views for different workflows
- **Beat ordering** - Organize beats with numerical order for rundown sequencing
- **Predefined beat types** (Opening, News, VTR, Interview, Sports, Closing)
- **Automatic persistence** in localStorage
- **View mode persistence** - Your preferred view (canvas/grid) is remembered
- **Example project** included to get started quickly
- **Material Design interface** with Vuetify 3
- **Clean Architecture** with layer separation (domain, application, infrastructure, presentation)

## 📋 Technology Stack

- **Vue 3** (Composition API) + TypeScript
- **Vuetify 3** (Material Design)
- **Vite** (build tool)
- **Vitest** + Vue Test Utils (testing, coverage >= 80%)
- **ESLint** + Prettier (linting and formatting)

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Development server (runs on port 3000)
npm run dev

# Production build
npm run build

# Preview build
npm run preview
```

## 🧪 Testing

```bash
# Run tests
npm test

# Tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run E2E tests with Playwright
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug
```

## 📁 Project Structure

```
src/
├── domain/              # Domain entities (Beat, BeatType, Project)
├── application/         # Services and use cases (ProjectService)
├── infrastructure/      # Concrete implementations (LocalStorageService)
├── presentation/        # Vue components and views
│   ├── views/          # Main views (BeatEditorView)
│   └── components/     # Reusable components (BeatCard, BeatGridView, dialogs)
├── plugins/            # Vuetify configuration
└── utils/              # Utilities (uuid generator)
```

## 📝 Basic Usage

1. When opening the application, an example project loads automatically
2. Click on any beat to edit it (title, type, description, **order**)
3. Use the "+" button in the toolbar to add new beats
4. **Toggle between canvas and grid views** using the view mode buttons in the toolbar
5. **In grid view**, beats are displayed in a sortable table ordered by their sequence number
6. **In canvas view**, beats are positioned freely on a 2D canvas
7. Changes are automatically saved to localStorage
8. Your preferred view mode (canvas/grid) is remembered between sessions
9. Use zoom controls to adjust the canvas view

### View Modes

- **Canvas View** (default): Visual representation with draggable cards positioned on a 2D canvas
- **Grid View**: Table format showing all beat details in columns, sorted by order number

### Beat Order

Each beat has an `order` field (numeric) that determines its sequence in the rundown:
- Lower numbers appear first
- When creating a new beat, it automatically gets the next available order number
- You can edit the order in the beat edit dialog to rearrange the sequence
- Grid view automatically sorts beats by this order field

## 🎯 Roadmap / TODO

- [x] Implement drag & drop to move beats on canvas
- [x] Grid/table view (traditional rundown mode)
- [x] Beat ordering system
- [x] Beat connection system (magnet zones with visual feedback)
- [ ] Export to JSON and script format
- [ ] Import from external formats
- [ ] Side panel with filters by type/character
- [ ] Cues and timing for each beat
- [ ] Multiple projects support
- [ ] Dark mode
- [ ] Grid snap for beat alignment

## 🏗️ Architecture

The project follows **Clean Architecture** principles:

- **Domain Layer**: Defines framework-independent entities (Beat, BeatType, Project)
- **Application Layer**: Business logic (ProjectService) without UI dependencies
- **Infrastructure Layer**: Concrete implementations (LocalStorageService with localStorage)
- **Presentation Layer**: Vue components that consume the upper layers

This architecture allows:
- Easily switch from localStorage to IndexedDB
- Test business logic without UI
- Reuse services in different contexts

## ✅ Testing

The project uses **Vitest** with **@vue/test-utils** for unit testing.

### Testing Strategy

Following clean architecture principles, tests focus on **business logic**:

- **Domain Layer**: Types are validated with TypeScript, no runtime tests needed
- **Application Layer** (`src/application/`): **100% coverage** - all business logic tested
- **Infrastructure Layer** (`src/infrastructure/`): **92.85% coverage** - storage with mocks
- **Utils** (`src/utils/`): **100% coverage** - helper functions fully tested
- **Presentation Layer** (`src/presentation/`): **Excluded from coverage** - UI components better tested with E2E

Current coverage: **98.85%** (lines), **90%** (branches), **100%** (functions)

### Running Tests

```bash
# Run tests
npm test

# Tests with coverage report
npm run test:coverage

# Tests in watch mode
npm run test:watch
```

### Test Files

**Unit Tests:**
- `tests/unit/ProjectService.test.ts` - Business logic tests (12 tests)
- `tests/unit/LocalStorageService.test.ts` - Persistence layer tests (8 tests)
- `tests/unit/uuid.test.ts` - Utility tests (3 tests)
- `tests/unit/BeatEditorView.test.ts` - Basic rendering tests (3 tests, UI excluded from coverage)

**E2E Tests (Playwright):**
- `tests/e2e/beat-editor.spec.ts` - Full user interaction flows
  - Load example project
  - Create and edit beats
  - Save to localStorage
  - Create new projects
  - Visual styling validation

### Why is the Presentation Layer Excluded?

Vue components in `src/presentation/` are excluded from coverage because:
1. **UI components are better tested with E2E** (Playwright, Cypress, etc.)
2. **Vue unit tests are often brittle** and break with minor UI changes
3. **Business logic is decoupled** in the application layer where it's easier to test
4. **Follows best practices** from Vue.js and clean architecture communities

Business logic (services, storage, utils) maintains **92-100% coverage**.

## 📄 Licencia

MIT
Script and Rundown editor
