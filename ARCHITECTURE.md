# Escaleta - Refactored Architecture

## Overview

The codebase has been refactored from a monolithic `ProjectService.ts` (1140 lines) into a modular, functional architecture that separates concerns and improves maintainability.

## Architecture Pattern: Hybrid (Services + Pure Functions)

```
src/
├── application/
│   ├── ProjectService.ts              # Facade (~250 lines)
│   └── services/                      # Orchestration layer
│       ├── BeatManagementService.ts   # Beat + BeatGroup orchestration
│       ├── BlockManagementService.ts  # Block orchestration
│       └── LaneManagementService.ts   # Lane orchestration
│
└── domain/
    └── operations/                    # Pure functions layer
        ├── beatOperations.ts          # Beat CRUD
        ├── groupOperations.ts         # BeatGroup CRUD + positioning
        ├── blockOperations.ts         # Block CRUD + positioning
        ├── laneOperations.ts          # Lane CRUD + repositioning
        └── geometry.ts                # Layout calculations
```

## Design Principles

### 1. **Functional Core, Service Shell**
- **Pure functions** in `domain/operations/`: No side effects, always return new `Project`
- **Services** in `application/services/`: Orchestrate operations and integrate cross-entity logic
- **Facade** in `ProjectService.ts`: Maintains backward compatibility with existing UI code

### 2. **Immutability & Functional Chaining**
All operations return a new `Project` object, enabling functional chaining:

```typescript
// Example: Functional chaining style
let updated = createBeat(project, 'news')
updated = addBeatToGroup(updated, beatId, groupId)
updated = repositionBeatsInGroup(updated, groupId)

// Or with services:
let project = beatMgmt.createBeat(project, 'news')
project = beatMgmt.addBeatsToGroup(project, groupId, [beatId])
```

### 3. **Separation of Concerns**
- **Geometry calculations** → `geometry.ts` (pure math, no entity logic)
- **CRUD operations** → `*Operations.ts` files (stateless transformations)
- **Cross-entity coordination** → Service classes (lane repositioning after block resize, etc.)
- **Infrastructure** → `ProjectService` (storage, migrations, default data)

## File Breakdown

### Domain Operations (Pure Functions)

#### `geometry.ts` (160 lines)
**Constants & Calculations**
- `LAYOUT_CONSTANTS`: All spacing, heights, widths
- `calculateNextBeatPosition()`: Grid layout for new beats
- `calculateNextGroupPosition()`: Grid layout for new groups
- `calculateBeatYPositionInGroup()`: Vertical stacking in groups
- `calculateBlockWidth()`: Dynamic width based on group count
- `calculateBlockHeight()`: Dynamic height including all content
- `calculateNextBeatOrder()`, `calculateNextGroupOrder()`: Order numbering

#### `beatOperations.ts` (80 lines)
**Beat CRUD**
- `createBeat()`: Generate new beat with defaults
- `updateBeat()`: Immutable update
- `deleteBeat()`: Remove beat from project
- `getSortedBeats()`: Sort by order field

#### `groupOperations.ts` (220 lines)
**BeatGroup CRUD + Positioning**
- `createBeatGroup()`: Returns the new group (not project)
- `addBeatGroup()`: Add to project
- `updateBeatGroup()`, `deleteBeatGroup()`: CRUD ops
- `addBeatsToGroup()`: Add + auto-reposition
- `insertBeatBeforeInGroup()`: Drag-and-drop support
- `repositionBeatsInGroup()`: Vertical stacking logic
- `removeBeatFromGroup()`: Remove + reposition remaining
- `getGroupForBeat()`, `belongsToBeatGroup()`: Queries

#### `blockOperations.ts` (180 lines)
**Block CRUD + Horizontal Positioning**
- `createBlock()`: Requires ≥2 groups
- `updateBlock()`, `deleteBlock()`: CRUD ops
- `addGroupToBlock()`: Add + horizontal repositioning
- `removeGroupFromBlock()`: Remove + auto-delete if <2 groups
- `repositionGroupsInBlock()`: Horizontal alignment
- `getBlockForGroup()`: Query

#### `laneOperations.ts` (310 lines)
**Lane CRUD + Vertical Repositioning**
- `createLane()`: Stack blocks vertically + move all content
- `updateLane()`, `deleteLane()`: CRUD ops
- `addBlockToLane()`: Add + reposition all blocks
- `removeBlockFromLane()`: Remove + auto-delete if ≤1 blocks
- `repositionBlocksInLane()`: **Core**: Vertical stacking + delta propagation to groups/beats
- `getLaneForBlock()`, `isFirstBlockInLane()`: Queries

### Application Services (Orchestration)

#### `BeatManagementService.ts` (130 lines)
**Orchestrates Beat + BeatGroup operations**
- Delegates to `beatOperations.ts` and `groupOperations.ts`
- Adds service-level coordination (e.g., auto-repositioning)

#### `BlockManagementService.ts` (100 lines)
**Orchestrates Block operations**
- Delegates to `blockOperations.ts`
- **Integrates with Lane**: Auto-repositions lane when block content changes

#### `LaneManagementService.ts` (90 lines)
**Orchestrates Lane operations**
- Delegates to `laneOperations.ts`
- Provides utility methods like `getBlockHeight()`

### Project Facade

#### `ProjectService.ts` (250 lines, down from 1140)
**Responsibilities**
- Storage integration (load/save)
- Project lifecycle (create new, create example)
- Default beat types
- Migration logic (add `beatGroups`, `blocks`, `lanes` to old projects)
- **Delegation**: All entity operations delegated to specialized services

**Example delegation**:
```typescript
createBeat(typeId: string, project: Project): Beat {
  const updatedProject = this.beatMgmt.createBeat(project, typeId)
  return updatedProject.beats[updatedProject.beats.length - 1]
}

addGroupToBlock(project: Project, blockId: string, groupId: string, targetGroupId?: string): Project {
  return this.blockMgmt.addGroupToBlock(project, blockId, groupId, targetGroupId)
}
```

## Benefits of This Architecture

### ✅ **Maintainability**
- **Small files**: Each file <350 lines (vs. 1140 for old `ProjectService.ts`)
- **Single Responsibility**: Each file handles one entity or concern
- **Easy to locate**: Want to fix beat positioning? → `groupOperations.ts`

### ✅ **Testability**
- **Pure functions**: No mocks needed, just input → output
- **Isolated testing**: Test each operation independently
- **Service integration tests**: Test cross-entity coordination

### ✅ **Scalability**
- **Add new entities**: Create `*Operations.ts` + optional service
- **Add new operations**: Add function to appropriate file
- **Refactor independently**: Change internals without breaking API

### ✅ **Type Safety**
- All functions strongly typed
- TypeScript enforces immutability patterns
- Return type `Project` ensures consistency

### ✅ **Functional Programming Support**
- Functions always return new `Project`
- Enables chaining, composition, and pipelines
- No hidden state mutations

## Usage Examples

### Using Services (Recommended for UI)
```typescript
import { projectService } from '@/application/ProjectService'

// The facade delegates to specialized services
const updatedProject = projectService.createBeat('news', project)
```

### Using Pure Functions Directly
```typescript
import { createBeat, addBeatsToGroup, repositionBeatsInGroup } from '@/domain/operations'

// Functional chaining
let project = loadProject()
project = createBeat(project, 'news')
project = addBeatsToGroup(project, groupId, [beatId])
project = repositionBeatsInGroup(project, groupId)
```

### Importing Services
```typescript
import { beatManagementService } from '@/application/services'

// Use service directly
const updated = beatManagementService.createBeat(project, 'news')
```

## Migration Notes

### Breaking Changes
**None!** The `ProjectService` facade maintains the exact same API, so existing UI code doesn't need changes.

### Performance
- **No overhead**: Function calls are inlined by JS engines
- **Same memory profile**: Still creates new objects (immutability)
- **Faster development**: Easier to optimize individual functions

### Testing Strategy
1. **Unit tests**: Test pure functions in `domain/operations/`
2. **Integration tests**: Test services coordinating multiple operations
3. **E2E tests**: Test through `ProjectService` facade

## Future Enhancements

### Possible Next Steps
1. **Event sourcing**: Record all operations for undo/redo
2. **Validation layer**: Add Zod schemas to validate operations
3. **Performance optimization**: Memoize expensive calculations
4. **Worker thread**: Move heavy positioning calculations to Web Worker
5. **Operation batching**: Combine multiple ops into one atomic update

### Adding New Features
**Example: Add "Section" entity**
1. Create `src/domain/operations/sectionOperations.ts`
2. Create `src/application/services/SectionManagementService.ts`
3. Add methods to `ProjectService.ts` that delegate to the service
4. Update UI components to call `projectService.createSection()`, etc.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Components                           │
│              (BeatEditorView, BeatCard, etc.)              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  ProjectService (Facade)                    │
│              - loadCurrentProject()                         │
│              - saveCurrentProject()                         │
│              - Delegates all entity ops                     │
└─────┬────────────┬────────────┬────────────────────────────┘
      │            │            │
      ▼            ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│   Beat   │ │  Block   │ │   Lane   │
│   Mgmt   │ │   Mgmt   │ │   Mgmt   │
│ Service  │ │ Service  │ │ Service  │
└────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │
     └────────────┼────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Domain Operations (Pure Functions)             │
│   beatOps   groupOps   blockOps   laneOps   geometry       │
│  - create   - create   - create   - create  - calculate    │
│  - update   - update   - update   - update  - measure      │
│  - delete   - delete   - delete   - delete  - position     │
│  - query    - reposition - reposition - reposition         │
└─────────────────────────────────────────────────────────────┘
```

## Credits

Refactored by combining:
- **Option 2**: Services by Domain Aggregate (Beat+Group, Block, Lane)
- **Option 4**: Pure Functions Pattern (functional programming style)

Result: Clean, testable, maintainable architecture that scales.
