# WhiteSmoke Frontend

React UI with glass-morphism design system, Tauri desktop integration, and dark/light theming.

## Setup

```bash
cd Frontend
npm install
npm run dev   # Vite dev server on http://localhost:5173
```

### Tauri Desktop App

```bash
# Development with hot reload
npm run tauri:dev

# Build distributable
npm run tauri:build  # Creates .deb, AppImage, and installers
```

## Architecture

- **React 18.2** + TypeScript
- **Vite** bundler (fast HMR)
- **Tauri 1.4** desktop shell
- **TailwindCSS** utility-first styling
- **Axios** HTTP client to Backend API
- **Custom glass components** (7 reusable components)

## Design System: Glass Morphism

"Liquid glass" visual style with frosted glass effect, backdrop blur, and soft shadows.

### Color Palette

**Light Theme:**
- Background: `#f8fafc` (slate-50)
- Glass surface: `rgba(255, 255, 255, 0.8)` with backdrop blur
- Text: `#1e293b` (slate-900)
- Accent: `#3b82f6` (blue-500)

**Dark Theme:**
- Background: `#0f172a` (slate-950)
- Glass surface: `rgba(15, 23, 42, 0.6)` with backdrop blur
- Text: `#f1f5f9` (slate-100)
- Accent: `#60a5fa` (blue-400)

### Core CSS Classes

All glass components use:

```css
/* Glass container */
backdrop-blur-md
bg-white/10  /* light: white/10, dark: white/5 */
border border-white/20
rounded-2xl
shadow-lg
```

## Components

### GlassCard

Container for app tiles and content sections.

```tsx
<GlassCard className="p-4">
  <h3>App Name</h3>
  <p>Installed</p>
</GlassCard>
```

### GlassButton

Primary action button.

```tsx
<GlassButton onClick={() => {}}>
  Install App
</GlassButton>
```

Variants: `primary`, `secondary` (via className modifiers)

### GlassModal

Dialog overlay for settings, confirmations.

```tsx
<GlassModal isOpen={open} title="Settings" onClose={() => {}}>
  <div>Modal content</div>
</GlassModal>
```

### GlassInput

Text input with glass styling.

```tsx
<GlassInput
  type="text"
  placeholder="Search apps..."
  onChange={(e) => setValue(e.target.value)}
/>
```

### GlassToggle

Checkbox/switch component.

```tsx
<GlassToggle
  label="Enable Sandbox"
  checked={enabled}
  onChange={(checked) => setEnabled(checked)}
/>
```

### GlassProgressBar

Installation progress indicator.

```tsx
<GlassProgressBar
  label="Installing..."
  progress={65}  // 0-100
  isActive={true}
/>
```

### GlassNotification

Toast-style notification.

```tsx
<GlassNotification
  type="success"  // 'success', 'error', 'info'
  message="Installation complete"
  autoClose={3000}
/>
```

### ThemeToggle

Dark/light mode switcher.

```tsx
<ThemeToggle />  // Shows in header, auto-syncs with Tauri tray event
```

## Theme System

### ThemeContext

Global theme state (light/dark) with localStorage persistence.

```tsx
import { ThemeContext } from './theme';
import { useContext } from 'react';

function MyComponent() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

### App Setup

```tsx
// App.tsx
import { ThemeProvider } from './theme';

export default function App() {
  return (
    <ThemeProvider>
      {/* app content */}
    </ThemeProvider>
  );
}
```

**Features:**
- Saves preference to localStorage (key: `theme-preference`)
- Listens to Tauri `toggle-theme` event from system tray
- Applies `dark` class to root element for TailwindCSS
- Default: system preference if available

### Tailwind Configuration

See `tailwind.config.js`:

```js
module.exports = {
  darkMode: 'class',  // Toggles with dark class
  theme: {
    extend: {
      colors: {
        glass: '#ffffff0d',  // glass-morphism tint
      },
      backdropBlur: {
        glass: '10px',
      },
    },
  },
};
```

## Pages & Views

### Dashboard (App.tsx)

Main screen showing:
- **Header:** Title, theme toggle, API status
- **App Grid:** List of installed apps as GlassCard tiles
- **Upload Zone:** Drag-and-drop installer upload
- **Settings Modal:** Per-app resource limit controls

**Features:**
- Real-time app list fetch (GET /api/apps)
- File upload with progress tracking
- Per-app settings modal (CPU, memory, PID limits)
- Delete confirmation
- Launch app button

### Interactions

1. **Drag installer file** → Upload to `/api/upload`
2. **Click install** → POST to `/api/install` → refetch list
3. **Settings button** → Modal with sliders → POST `/api/apps/:id/limits`
4. **Launch button** → POST `/api/launch` with exe path
5. **Remove button** → DELETE `/api/apps/:id`

## API Integration

**Vite Proxy** (`vite.config.ts`):
```js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:4000',
      changeOrigin: true,
    },
  },
},
```

**Axios Instance** (`src/App.tsx`):
```tsx
const api = axios.create({
  baseURL: 'http://localhost:4000',
  timeout: 30000,
});

// Usage:
const { data } = await api.get('/api/apps');
```

## Styling Examples

### Custom glass card with effect

```tsx
<div className="backdrop-blur-lg bg-white/10 dark:bg-slate-900/40 
                border border-white/20 rounded-3xl shadow-2xl 
                p-6 hover:shadow-3xl transition-shadow">
  Content
</div>
```

### Gradient text

```tsx
<h1 className="bg-gradient-to-r from-blue-500 to-purple-600 
               bg-clip-text text-transparent">
  WhiteSmoke
</h1>
```

### Responsive grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {apps.map(app => <AppCard key={app.id} app={app} />)}
</div>
```

## Tauri Integration

### Configuration (src-tauri/tauri.conf.json)

- **Identifier:** `com.whitesmoke.app`
- **Package:** Built as `.deb`, AppImage, unsigned (dev), `.exe` (Windows)
- **Dependencies:** Wine packages (via `build.deb.depends`)
- **Updater:** Configured for GitHub Releases endpoint

### System Tray (src-tauri/src/main.rs)

Menu items:
- Toggle Theme → emits `toggle-theme` event
- Check for Updates → fetches latest release
- Exit

**Event handlers:**
```rust
// toggle-theme event
window.emit("toggle_theme", {})  // React context responds

// update-available
window.emit("update-available", { version: "..." })  // Show notification

// update-none
window.emit("update-none", {})    // User is up-to-date
```

### Building

```bash
# Setup Rust (first time)
curl https://sh.rustup.rs -sSf | sh

# Development (debug build)
npm run tauri:dev

# Release build
npm run tauri:build
# Output: src-tauri/target/release/bundle/
#   - deb/  (Debian package)
#   - appimage/ (Linux portable)
#   - windows/ (EXE installer)
```

## Development Workflow

1. **Start backend**
   ```bash
   cd Backend && npm run dev  # http://localhost:4000
   ```

2. **Start frontend dev server**
   ```bash
   cd Frontend && npm run dev  # http://localhost:5173
   ```

3. **Or start Tauri dev mode**
   ```bash
   cd Frontend && npm run tauri:dev  # Opens Tauri window with hot reload
   ```

4. **Edit components** → Auto-reload via Vite HMR

5. **Test theme toggle** → Click button in header or system tray

## Performance Optimization

- Vite code splitting (route-based)
- CSS purging via TailwindCSS production build
- Image optimization (lazy loading in app grid)
- Axios request deduplication via request queue

Add Framer Motion for animations (optional):
```bash
npm install framer-motion
```

Example fade-in:
```tsx
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
  Content
</motion.div>
```

## Troubleshooting

### API endpoint not connecting
- Ensure Backend is running on `http://localhost:4000`
- Check `vite.config.ts` proxy configuration
- Check browser console for CORS errors

### Theme not persisting
- Clear localStorage: `localStorage.clear()` in console
- Refresh page
- Check dark mode class on `<html>` element

### Tauri window blank
- Ensure `src-tauri/Cargo.toml` dependencies are correct
- Run `npm run tauri:dev` with `-- --verbose` to see logs
- Check `src-tauri/src/main.rs` window initialization

### Icons missing
- Place icons in `src-tauri/icons/` with names: `icon.png`, `icon.icns`, etc.
- Run `npm run tauri:build` to regenerate icon set

## Deployment

### Web-Only (No Tauri)
```bash
npm run build  # Vite output to dist/
# Serve dist/ with nginx or any static host
```

### Desktop (Tauri)
```bash
npm run tauri:build
# Distribute .deb (Linux), .exe (Windows), .dmg (macOS)
```

## License

MIT
