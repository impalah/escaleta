# Escaleta DevContainer

This devcontainer provides a complete and isolated development environment for the Escaleta project.

## 🚀 Features

- **Node.js 20** - Latest LTS version
- **Pre-installed extensions IN THE CONTAINER**:
  - Vue Language Features (Volar) - Vue language server
  - TypeScript Vue Plugin - TypeScript support for Vue
  - ESLint - Real-time linting
  - Prettier - Automatic formatting
  - Playwright Test - E2E testing
  - i18n Ally - Translation management
  
  ℹ️ **Note**: These extensions run **inside the container**, not on your host. They have full access to node_modules, project code, and can execute npm commands. VS Code uses a client-server architecture to connect your UI (local) with the development environment (container).

- **Automatic configuration**:
  - Format on save enabled
  - ESLint auto-fix activated
  - Prettier as default formatter
- **Exposed ports**:
  - 3000: Vite dev server (main)
  - 5173: Vite preview
- **Automatic installation** of dependencies when creating the container
- **Auto-start** of the development server

## 📦 Prerequisites

1. **Docker Runtime** - Choose one option:

   ### Option A: Colima (Lightweight, recommended for Mac/Linux)
   
   ```bash
   # Install with Homebrew (macOS)
   brew install colima docker docker-compose
   
   # Start with recommended resources
   colima start --cpu 4 --memory 8 --disk 60
   
   # Check status
   colima status
   ```
   
   **⚙️ Recommended Resources for Colima**:
   - **CPUs**: Minimum 4, recommended 6-8 for smooth development
   - **Memory**: Minimum 6GB, recommended 8-12GB
   - **Disk**: At least 60GB
   
   To adjust resources later:
   ```bash
   # Stop Colima
   colima stop
   
   # Restart with new resources
   colima start --cpu 6 --memory 10 --disk 60
   ```

   ### Option B: Docker Desktop
   
   - [Download for Mac](https://www.docker.com/products/docker-desktop)
   - [Download for Windows](https://www.docker.com/products/docker-desktop)
   - [Download for Linux](https://docs.docker.com/desktop/install/linux-install/)
   
   To adjust: Docker Desktop → Preferences/Settings → Resources

2. **Visual Studio Code** with the **Dev Containers** extension
   - Install from: [Dev Containers Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

## 🏃 How to Use the DevContainer

### Option 1: Open in Container (Recommended)

1. Open VS Code
2. **Open ONLY the Escaleta project folder** (`File > Open Folder...`)
3. VS Code will automatically detect the devcontainer and show a notification
4. Click **"Reopen in Container"**
5. **If asked about configuration**: Select **"Add configuration to workspace"** (this ensures the config is shared with the team)
6. Wait for the container to build and configure (first time ~2-5 minutes)
7. Done! The development server will start automatically at http://localhost:3000

### Option 2: Command Palette

1. Open VS Code with **only the Escaleta folder**
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type and select: **"Dev Containers: Reopen in Container"**
4. Wait for the container to configure
5. Done!

### Option 3: From Scratch

If you don't have the project cloned:

1. Press `Cmd+Shift+P` / `Ctrl+Shift+P`
2. Select **"Dev Containers: Clone Repository in Container Volume"**
3. Enter the repository URL
4. Wait for it to clone and configure everything

## 🗂️ Multiple Projects in a Workspace

If you have multiple projects, each with its own devcontainer, you have several options:

### Strategy 1: Open Folders Individually (Recommended)

The simplest way is to open each project in its own VS Code window:

```bash
# Open only the Escaleta project
code /Users/linus/projects/escaleta
```

Then use "Reopen in Container" normally. Each project will have its own window and container.

**Advantages**:
- ✅ Simple and straightforward
- ✅ Each project completely isolated
- ✅ No confusion about which devcontainer to use

### Strategy 2: Multi-Root Workspace

If you need to work with multiple projects simultaneously:

1. **Create a workspace file** (`.code-workspace`):

```json
{
  "folders": [
    {
      "path": "escaleta"
    },
    {
      "path": "other-project"
    }
  ],
  "settings": {}
}
```

2. **To open a specific project in a container**:
   - `Cmd+Shift+P` → **"Dev Containers: Open Folder in Container..."**
   - Select the specific folder (e.g., `escaleta`)
   - VS Code will open **only that folder** in the container

3. **Alternative - Open entire workspace** (advanced):
   - `Cmd+Shift+P` → **"Dev Containers: Open Workspace in Container..."**
   - VS Code will try to detect devcontainers in subfolders
   - Select which devcontainer to use

### Strategy 3: Monorepo with Global Devcontainer

If you have a monorepo (e.g., `/projects/` with `escaleta/`, `project2/`, etc.):

1. **Option A**: Create a `.devcontainer` at the monorepo root that includes all dependencies
2. **Option B**: Use devcontainers in subfolders and open each project individually

### Practical Example

```
/Users/linus/projects/
├── escaleta/                    # Project 1
│   └── .devcontainer/
│       └── devcontainer.json
├── backend-project/             # Project 2
│   └── .devcontainer/
│       └── devcontainer.json
└── my-workspace.code-workspace  # Optional workspace
```

**To work on Escaleta**:
```bash
# Option 1: Open only Escaleta
code /Users/linus/projects/escaleta
# Then "Reopen in Container"

# Option 2: From command palette
# Cmd+Shift+P → "Dev Containers: Open Folder in Container..."
# Select /Users/linus/projects/escaleta
```

**To work on multiple projects at once**:
- Open each project in a separate VS Code window
- Each will have its own running container
- Containers are independent and don't affect each other

### ⚠️ Important

- **VS Code looks for `.devcontainer/` in the root of the folder you open**
- If you open a parent folder containing subfolders with devcontainers, VS Code may not detect them automatically
- **Solution**: Always open the specific project folder (e.g., `escaleta/` not `projects/`)

## 🔧 Available Commands

Once inside the container, all npm commands work normally:

```bash
# The server will already be running, but you can restart it with:
npm run dev              # Development (port 3000)

# Other useful commands:
npm run build            # Production build
npm run preview          # Preview the build
npm test                 # Unit tests
npm run test:e2e         # E2E tests with Playwright
npm run lint             # Linting
npm run format           # Code formatting
```

## 📝 Important Notes

### node_modules Persistence

The devcontainer uses a Docker volume for `node_modules`, which means:
- ✅ Faster installation
- ✅ Better performance on Mac/Windows
- ⚠️ `node_modules` are not visible on your host system (this is intentional)

### Ports

- Port **3000** is automatically exposed
- You can access the application at http://localhost:3000
- VS Code will notify you when the server is ready

### Rebuild Container

If you need to rebuild the container (e.g., after changing configuration):

1. `Cmd+Shift+P` / `Ctrl+Shift+P`
2. **"Dev Containers: Rebuild Container"**

### Exit Container

To return to working locally:

1. `Cmd+Shift+P` / `Ctrl+Shift+P`
2. **"Dev Containers: Reopen Folder Locally"**

## 💻 Resources and Performance

### What Uses Docker Resources?

**Inside the Container** (limited by your Docker allocation):
- ✅ Node.js and npm
- ✅ Vite dev server (hot reload, compilation)
- ✅ Production builds (`npm run build`)
- ✅ Tests (Vitest, Playwright)
- ✅ ESLint, Prettier, TypeScript compiler
- ✅ VS Code extensions running in the container (Volar, etc.)

**On the Host** (unlimited resources from your machine):
- ✅ VS Code window and interface
- ✅ UI extensions (themes, icons)
- ✅ Web browser to view the application

### Resource Recommendations

For **Escaleta** (Vue 3 + TypeScript + Vite project):

| Task | Recommended CPUs | Recommended Memory |
|------|------------------|-------------------|
| Basic development | 2-4 | 4-6 GB |
| **Optimal development** | **4-6** | **8-10 GB** |
| With E2E tests (Playwright) | 6-8 | 10-12 GB |

**Example: 4 CPUs / 8GB**: ✅ Sufficient for normal development, can be adjusted if running E2E tests frequently.

### How to Adjust Resources

**Colima**:
```bash
# View current configuration
colima status

# Stop Colima
colima stop

# Restart with new resources (example: 6 CPUs, 10GB RAM)
colima start --cpu 6 --memory 10 --disk 60

# Or edit ~/.colima/default/colima.yaml and restart
```

**Docker Desktop** (macOS / Windows):
1. Docker Desktop → ⚙️ Settings/Preferences
2. Resources → Advanced
3. Adjust CPUs and Memory
4. Apply & Restart

**Note**: Allocating more resources speeds up:
- `npm install` (dependency installation)
- Hot reload and Vite compilation
- Test execution
- Production builds

## 🐛 Troubleshooting

### Container Won't Start

**VS Code asks about configuration location**:
- Select **"Add configuration to workspace"** to share the config with your team
- This creates/updates `.vscode/settings.json` in the project
- Alternative: "Add configuration to user data folder" (personal config only)

**With Colima**:
1. Check that Colima is running: `colima status`
2. If stopped, start it: `colima start`
3. Verify Docker connection: `docker ps`
4. Check disk space: `df -h`

**With Docker Desktop**:
1. Verify Docker Desktop is running
2. Check that you have sufficient disk space

**Both**:
3. Try: `Cmd+Shift+P` → "Dev Containers: Rebuild Container"

### Development is Slow

1. Check resources allocated to Docker (see "Resources and Performance" section)
2. Increase CPUs or memory if possible
3. Close other containers you're not using: `docker ps` to see active ones

### Changes Not Reflected

Vite hot-reload should work automatically. If not:
1. Verify the development server is running
2. Restart the server: press `Ctrl+C` in the terminal and run `npm run dev`

### Permission Issues

The container runs as user `node` (not root) for security. If you have problems:
1. Ensure files have proper permissions
2. On Linux, you may need to adjust file ownership

### High Resource Usage

If Docker is consuming too many resources:
1. Stop containers you're not using: `docker stop $(docker ps -q)`
2. Clean old images: `docker system prune -a`
3. **With Colima**: Reduce resources on restart: `colima start --cpu 4 --memory 6`
4. **With Docker Desktop**: Reduce resources in Settings → Resources

### Colima-Specific Issues

**"Cannot connect to the Docker daemon"**:
```bash
# Check Docker context
docker context ls

# Make sure to use Colima context
docker context use colima

# Restart Colima if needed
colima restart
```

**Slow Performance**:
- Colima uses QEMU instead of VirtualBox/HyperKit
- For better performance on Apple Silicon (M1/M2): `colima start --vm-type vz --vz-rosetta`

## 🎯 DevContainer Benefits

- ✅ Consistent environment across developers
- ✅ Doesn't pollute your local system with dependencies
- ✅ Automatic tool configuration
- ✅ Easy to share and replicate
- ✅ Complete project isolation
- ✅ Compatible with GitHub Codespaces

## 🔌 Extensions: Container vs Host

### Where Do Extensions Run?

**Extensions in the CONTAINER** (defined in devcontainer.json):
- Automatically installed when creating the container
- Run inside the containerized environment
- Have access to node_modules, project files, and npm commands
- Examples: Volar, ESLint, Prettier, Playwright

**Extensions on the HOST** (manually installed):
- UI/theme extensions you already have installed
- Don't need access to project code
- Examples: color themes, file icons

### VS Code + Container Architecture

```
┌──────────────────────────────────┐
│    VS Code (Local/Host)          │
│  - Graphical interface           │
│  - UI/theme extensions           │
└────────────┬─────────────────────┘
             │
             │ Remote communication
             │ (VS Code protocol)
             ▼
┌──────────────────────────────────┐
│    Container (Isolated)          │
│  - Node.js + dependencies        │
│  - Project code                  │
│  - Development extensions        │
│  - Language servers (LSP)        │
│  - Linters, formatters, tests    │
└──────────────────────────────────┘
```

### Adding More Extensions

If you want to add additional extensions:

**Option 1: Temporary (this session only)**
- Install the extension normally from the marketplace
- VS Code will ask if you want to install it in the container

**Option 2: Permanent (for the whole team)**
- Edit `.devcontainer/devcontainer.json`
- Add the extension ID to `customizations.vscode.extensions`
- Rebuild the container: `Cmd+Shift+P` → "Dev Containers: Rebuild Container"
