# Escaleta - Beat Editor for Audiovisual Production

Visual rundown editor for TV show and news production.

## 🚀 Features

- **Visual beat editor** with canvas-style positionable cards
- **Hierarchical organization** - BeatGroups → Blocks → Lanes for complex production timelines
- **Properties panel** - AutoCAD/Photoshop-style dockable panel
  - Anchor to left, right, top, or bottom
  - Resizable with drag handle
  - Auto-hide when not pinned
  - Real-time auto-save (no save button needed)
  - Edit properties for: Project, Beat, BeatGroup, Block, or Lane
- **Advanced drag & drop** - Composable-based system with collision detection
  - Drag beats into groups
  - Drag groups into blocks
  - Smart positioning and layout calculations
  - Visual feedback with hover states and magnet zones
- **Multiple views** - Canvas and Grid/Table views with routing
  - `/canvas` - Visual 2D canvas with drag & drop
  - `/grid` - Sortable table view
- **Beat ordering** - Organize beats with numerical order for rundown sequencing
- **Predefined beat types** (Opening, News, Sports, Weather, Closing)
- **Internationalization** - Dual language support (English/Spanish)
- **Automatic persistence** in localStorage
- **View mode persistence** - Your preferred view (canvas/grid) is remembered
- **Example project** included to get started quickly
- **Material Design interface** with Vuetify 3
- **Modular Clean Architecture** with functional core and service shell

## 📋 Technology Stack

- **Vue 3** (Composition API) + TypeScript
- **Vue Router** for navigation between canvas and grid views
- **Vue I18n** for internationalization (en-US, es-ES)
- **Vuetify 3** (Material Design)
- **Vite** (build tool)
- **Vitest** + Vue Test Utils (testing, coverage >= 80%)
- **Playwright** (E2E testing)
- **ESLint** + Prettier (linting and formatting)

## 🛠️ Installation

### Option 1: DevContainer (Recommended)

The project includes a configured **DevContainer** that provides a complete and isolated development environment:

**Requirements**:
- Docker Desktop or Colima
- VS Code with the "Dev Containers" extension

**Steps**:
1. Open the project in VS Code
2. Click "Reopen in Container" when the notification appears
3. Wait for the container to configure (first time: ~2-5 minutes)
4. Done! The server will start automatically at http://localhost:3000

**Benefits**:
- ✅ Consistent environment across developers
- ✅ Dependencies isolated from host system
- ✅ Automatic tool configuration (ESLint, Prettier, etc.)
- ✅ Compatible with GitHub Codespaces

See [.devcontainer/README.md](.devcontainer/README.md) for more details.

### Option 2: Local Installation

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
├── domain/                  # Domain entities and pure functions
│   ├── entities.ts         # Core types (Beat, BeatGroup, Block, Lane, Project)
│   └── operations/         # Pure functions (functional core)
│       ├── beatOperations.ts
│       ├── groupOperations.ts
│       ├── blockOperations.ts
│       ├── laneOperations.ts
│       └── geometry.ts     # Layout calculations
├── application/             # Business logic orchestration
│   ├── ProjectService.ts   # Facade pattern
│   └── services/           # Specialized services
│       ├── BeatManagementService.ts
│       ├── BlockManagementService.ts
│       └── LaneManagementService.ts
├── infrastructure/          # External dependencies
│   └── LocalStorageService.ts
├── services/               # Presentation-layer services
│   ├── DragAndDropService.ts
│   ├── CollisionDetectionService.ts
│   └── PositionCalculationService.ts
├── composables/            # Vue 3 composables
│   ├── useDraggable.ts
│   └── useHoverable.ts
├── presentation/           # UI components and views
│   ├── views/
│   │   ├── BeatEditorView.vue      # Canvas view
│   │   └── BeatGridViewPage.vue    # Grid view
│   └── components/
│       ├── BeatCard.vue
│       ├── BeatGroupCard.vue
│       ├── BlockCard.vue
│       ├── LaneCard.vue
│       ├── PropertiesPanel.vue
│       └── ...
├── router/                 # Vue Router configuration
├── i18n/                   # Internationalization
│   ├── helpers.ts
│   └── locales/
│       ├── en-US.ts
│       └── es-ES.ts
├── plugins/                # Vuetify configuration
└── utils/                  # Utilities (uuid generator)
```

## 📝 Basic Usage

### Getting Started

1. When opening the application, an example project loads automatically
2. The app opens in **Canvas View** by default (route: `/canvas`)
3. **Properties panel** appears on the right side with project properties

### Working with Beats

1. Click **"Add Beat"** button in toolbar → Select beat type from dialog
2. Click on any **beat card** to edit its properties in the panel
3. **Drag beats** to reposition them on the canvas
4. All changes are **saved automatically** - no save button needed

### Organizing with Groups, Blocks, and Lanes

The application supports hierarchical organization:

1. **BeatGroups**: Collection of related beats
   - Click **"Create Group"** button
   - Drag beats onto a group card to add them
   - Groups move beats together and handle vertical stacking

2. **Blocks**: Horizontal container for multiple groups
   - Click **"Create Block"** button
   - Requires ≥2 groups to link
   - Arranges groups horizontally

3. **Lanes**: Vertical container for multiple blocks
   - Select blocks and create a lane
   - Stacks blocks vertically for full timeline view

### Properties Panel

The properties panel (AutoCAD/Photoshop-style) shows context-aware forms:
- **Project Properties**: Click canvas background
- **Beat Properties**: Click a beat card
- **Group Properties**: Click a group card
- **Block Properties**: Click a block card
- **Lane Properties**: Click a lane card

**Panel Controls**:
- **Maximize button** (🗖): Toggle full-screen mode
- **Dock button** (⇄): Switch between left/right/top/bottom anchoring
- **Resize**: Drag the border to adjust size
- **Side tab**: Shows current selection context

### View Modes

- **Canvas View** (`/canvas`): Visual 2D canvas with drag & drop
  - Free positioning of elements
  - Zoom controls
  - Visual hierarchy with groups/blocks/lanes
  
- **Grid View** (`/grid`): Sortable table format
  - Shows all beat details in columns
  - Sorted by order number
  - Quick editing with inline forms

### Language Support

- Click the language/flag icon in toolbar
- Supports English (en-US) and Spanish (es-ES)
- Preference saved to localStorage

## 🎯 Roadmap / TODO

- [x] Implement drag & drop to move beats on canvas
- [x] Grid/table view (traditional rundown mode)
- [x] Beat ordering system
- [x] Hierarchical organization (BeatGroups, Blocks, Lanes)
- [x] Composable-based drag & drop system
- [x] Collision detection service
- [x] Vue Router integration
- [x] Internationalization (i18n)
- [ ] Export to JSON and script format
- [ ] Import from external formats
- [ ] Side panel with filters by type/character
- [ ] Multiple projects support
- [ ] Dark mode
- [ ] Grid snap for beat alignment on canvas
- [ ] Undo/Redo functionality

## 🏗️ Architecture

The project follows a **Hybrid Architecture** combining Clean Architecture with functional programming:

### Functional Core + Service Shell

- **Domain Layer** (`domain/operations/`): Pure functions for all entity operations
  - Immutable transformations
  - No side effects
  - Easy to test and reason about
  
- **Application Layer** (`application/`): Service orchestration
  - `ProjectService`: Facade pattern for backward compatibility
  - Specialized services: `BeatManagementService`, `BlockManagementService`, `LaneManagementService`
  - Cross-entity coordination and business rules
  
- **Infrastructure Layer** (`infrastructure/`): External dependencies
  - `LocalStorageService`: Persistence with localStorage
  
- **Presentation Layer** (`presentation/`): Vue components
  - Views: Canvas and Grid pages
  - Components: Beat cards, forms, panels
  - Composables: `useDraggable`, `useHoverable`
  - Services: `DragAndDropService`, `CollisionDetectionService`, `PositionCalculationService`

### Key Architectural Benefits

- **Modularity**: Small, focused files (vs. 1140-line monolith)
- **Testability**: Pure functions require no mocks
- **Maintainability**: Clear separation of concerns
- **Scalability**: Easy to add new features or entities
- **Type Safety**: Full TypeScript coverage with strict mode

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.

## ✅ Testing

The project uses **Vitest** for unit testing and **Playwright** for E2E testing.

### Testing Strategy

Following clean architecture principles, tests focus on **business logic and user flows**:

- **Domain Operations** (`domain/operations/`): Pure function tests - no mocks needed
- **Application Services** (`application/services/`): Service orchestration tests
- **Infrastructure** (`infrastructure/`): Storage with mocked localStorage
- **Presentation Services** (`services/`): Drag & drop, collision detection tests
- **Composables** (`composables/`): Vue composition function tests
- **Utils** (`utils/`): Helper function tests
- **Presentation Components** (`presentation/`): **Excluded from coverage** - better tested with E2E
- **E2E Tests** (Playwright): Full user interaction flows

### Test Coverage

Target: **80%** for non-presentation code

### Running Tests

```bash
# Run unit tests
npm test

# Tests with coverage report
npm run test:coverage

# Tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug
```

### Test Files

**Unit Tests** (Vitest):
- `tests/unit/beatOperations.test.ts` - Beat CRUD pure functions
- `tests/unit/groupOperations.test.ts` - BeatGroup operations
- `tests/unit/blockOperations.simple.test.ts` - Block operations
- `tests/unit/laneOperations.simple.test.ts` - Lane operations
- `tests/unit/geometry.test.ts` - Layout calculations
- `tests/unit/services.test.ts` - Specialized service tests
- `tests/unit/ProjectService.test.ts` - Facade integration tests
- `tests/unit/CollisionDetectionService.test.ts` - Collision detection
- `tests/unit/DragAndDropService.test.ts` - Drag & drop state management
- `tests/unit/PositionCalculationService.test.ts` - Auto-positioning
- `tests/unit/useHoverable.test.ts` - Composable tests
- `tests/unit/i18n.test.ts` - Internationalization
- `tests/unit/LocalStorageService.test.ts` - Persistence layer
- `tests/unit/uuid.test.ts` - UUID generation

**E2E Tests** (Playwright):
- `tests/e2e/beat-editor.spec.ts` - Full user interaction flows
  - Load example project
  - Create and edit beats/groups/blocks/lanes
  - Drag & drop interactions
  - Save to localStorage
  - View switching
- `tests/e2e/mobile-touch.spec.ts` - Touch device support

### Why is the Presentation Layer Excluded?

Vue components in `src/presentation/` are excluded from unit test coverage because:
1. **UI components are better tested with E2E** (Playwright provides better confidence)
2. **Vue unit tests are often brittle** and break with minor UI changes
3. **Business logic is decoupled** in pure functions where it's easier to test
4. **Follows best practices** from Vue.js and clean architecture communities

All business logic (pure functions, services, utilities) maintains high test coverage.

## 📄 Licencia

MIT
Script and Rundown editor
