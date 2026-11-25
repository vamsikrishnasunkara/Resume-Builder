# 📄 ResumeStudio — Modern Student CV Builder

<p align="center">
  <img src="https://img.shields.io/badge/Deployed%20with-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel Deployment" />
  <img src="https://img.shields.io/badge/Design-Canva%20Faithful%20Match-8B5CF6?style=for-the-badge&logo=canva&logoColor=white" alt="Canva Template" />
  <img src="https://img.shields.io/badge/ATS-Optimized%20Format-10B981?style=for-the-badge&logo=checkmarx&logoColor=white" alt="ATS Ready" />
  <img src="https://img.shields.io/badge/Vanilla-HTML5%20%7C%20CSS3%20%7C%20ES6+-E34F26?style=for-the-badge&logo=javascript&logoColor=white" alt="Stack" />
  <img src="https://img.shields.io/badge/License-MIT-3B82F6?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <strong>A high-precision, interactive resume builder recreating Canva's flagship "Purple & White Modern Student CV" with real-time live preview, Canva/Figma-style direct cursor manipulation, per-section typography styling, and pixel-perfect A4 PDF export.</strong>
</p>

<p align="center">
  <a href="https://resume-builder-vamsi.vercel.app"><strong>🌐 View Live on Vercel »</strong></a>
  &nbsp;•&nbsp;
  <a href="#-architecture--data-flow"><strong>📐 Architecture</strong></a>
  &nbsp;•&nbsp;
  <a href="#-key-features"><strong>✨ Features</strong></a>
  &nbsp;•&nbsp;
  <a href="#-deployment-guide"><strong>🚀 Deploy to Vercel</strong></a>
</p>

---

## 🎨 Design Philosophy: Exact Canva Faithful Recreation

ResumeStudio faithfully brings Canva's **"Purple & White Modern Student CV"** to life as an open-source, client-side web application:

* **Angled Purple Left Column (`#21092F`)**: Geometric slanted polygon with a drop shadow backdrop.
* **Typographic Hierarchy**: Bold uppercase candidate name set in **Montserrat**, accompanied by a semi-transparent title highlight banner (`STUDENT` / `ENGINEERING`).
* **Connected Header Geometry**: A soft lavender pill (`#D5BEE8`) contoured with a crisp white border (`3.5px solid #ffffff`) seamlessly connecting with the inward-fanning top-right sunburst rays.
* **Profile Photo Containment**: Circular avatar frame with crisp border and automatic viewport clipping—never expands or distorts.
* **Clean White Right Panel**: Ample breathing room for **About Me**, **Skills**, **Languages**, and **Projects**.

```
┌──────────────────────────────┬───────────────────────────────────────────┐
│  JOHN                        │         ╭───────────────╮  \ \ \ \ \ \    │
│  HANERY                      │         │  (📷 Photo)   │   \ \ \ \ \ \   │
│  [ STUDENT ]                 │  ───────╯   (Lavender)  ╰──────────────── │
│                              │                                           │
│  EDUCATION:                  │  ABOUT ME:                                │
│  • Major / Degree            │  Dedicated student passionate about ...   │
│    University | Year         │                                           │
│                              │  SKILLS:                                  │
│  EXPERIENCE:                 │  • Python                                 │
│  • Role / Company            │  • Web Development                       │
│                              │                                           │
│  CONTACT ME:                 │  LANGUAGE:                                │
│  📞 Phone                    │  • English • Spanish                      │
│  ✉️ Email                    │                                           │
│  📍 City, Country            │  PROJECTS:                                │
└──────────────────────────────┴───────────────────────────────────────────┘
```

---

## ✨ Key Features

### 🖱️ Direct Cursor Manipulation (Canva / Figma Style)
- **Freeform Move**: Click any design element (**Profile Photo**, **Lavender Capsule**, **Sunburst Rays**) and drag it anywhere on the canvas with your mouse.
- **Interactive Transform Gizmo**: Hover and grab corner or edge handles to interactively increase, decrease, or stretch element dimensions directly with the cursor.
- **Directional Nudges**: Built-in 1-click floating pill directional arrows (`◀`, `▶`, `▲`, `▼`) for sub-millimeter fine-tuning.
- **✨ Snap to Canva Match**: One-click restore button snaps all geometry to exact pixel-perfect Canva proportions.

### 🔠 Individual Section-by-Section Typography
- **Independent Sizing**: Adjust font size for specific elements (**Candidate Name**, **Title**, **Section Headings**, **About Me**, **Skills**, **Education**, **Experience**, **Languages**, **Projects**, or **Contact**) without scaling the entire document.
- **Contextual Floating Pill**: Click any section on the canvas to summon an instant formatting badge (`A−`, `A+`, `Bold`, `Italic`).
- **Dynamic CSS Variables**: Over 20 reactive custom properties dynamically updated in the DOM in real time.

### 🌐 Smart Autocomplete APIs
- **Universities Search**: Real-time integration with Hipolabs World Universities API.
- **Worldwide Geocoding**: Real-time location lookup powered by the Photon / OpenStreetMap API.

### 🖨️ Pixel-Perfect ATS & Print Engine
- **Standard A4 Dimensions**: Hard-locked `210mm × 297mm` bounding box with zero print clipping.
- **Page Fill Presets**: Dynamic section gap scaling (`Compact`, `Normal`, `Spacious`, `✨ Fill Page`) to fill the sheet naturally.
- **Browser-Only Privacy**: 100% client-side execution; your resume data never leaves your device.

---

## 📐 Architecture & Data Flow

### System Architecture Diagram

```mermaid
flowchart TD
    subgraph UI ["Client Layer (Browser)"]
        FormPanel["📝 Editor Form Panel\n(Accordion Sections, Inputs)"]
        LiveCanvas["🖼️ Live A4 Preview Canvas\n(210mm × 297mm Exact Paper)"]
        TransformGizmo["🖱️ Interactive Transform Gizmo\n(Corner Resizers & Move Handles)"]
        FloatingPill["🏷️ Contextual Floating Action Pill\n(A-, A+, Nudge ◀ ▶ ▲ ▼)"]
    end

    subgraph StateEngine ["Reactive State & Style Engine"]
        FormState["State Store\n(LocalStorage Sync)"]
        StyleStore["Element Styles Store\n(Individual Section Sizes & Coordinates)"]
        ThemeController["Theme Controller\n(Purple, Indigo, Emerald, Rose, Slate)"]
    end

    subgraph ExternalAPIs ["Real-time External Services"]
        HipoAPI["🎓 Hipolabs Universities API"]
        PhotonAPI["📍 Photon Komoot Geocoder"]
    end

    subgraph ExportEngine ["Production Export Layer"]
        PrintEngine["🖨️ A4 CSS Paged Media Engine"]
        VercelCDN["⚡ Vercel Edge Network Deployment"]
    end

    FormPanel -->|User Input| FormState
    FormState -->|Debounced Save| LiveCanvas
    FormPanel -->|Query| ExternalAPIs
    ExternalAPIs -->|Suggestions| FormPanel

    TransformGizmo -->|Cursor Drag / Resize| StyleStore
    FloatingPill -->|Nudge / Size Step| StyleStore
    ThemeController -->|Palette Swatch| StyleStore

    StyleStore -->|CSS Custom Properties\n--rv-name-size, --rv-pill-width| LiveCanvas
    LiveCanvas -->|Window.print()| PrintEngine
    LiveCanvas --> VercelCDN
```

### Direct Cursor Manipulation Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User Cursor
    participant Canvas as Live Preview Canvas
    participant Gizmo as Transform Gizmo
    participant State as Style Store
    participant DOM as CSS Custom Properties

    User->>Canvas: Mousedown on Photo / Capsule / Rays
    Canvas->>Gizmo: Mount & Snap Bounding Box
    Gizmo-->>User: Display 4-Corner Handles & Move Bar
    User->>Gizmo: Drag Cursor (dx, dy)
    Gizmo->>State: Calculate Millimeter Delta (pxPerMm)
    State->>DOM: Update --rv-avatar-left, --rv-pill-width, etc.
    DOM-->>Canvas: Real-time 60fps Repaint
    User->>Gizmo: Mouseup
    Gizmo->>State: Persist to LocalStorage
```

---

## 📂 Project Structure

```
Resume-Builder/
├── index.html         # Main semantic HTML5 application entry point
├── style.css          # Design system, CSS variables & print media queries
├── script.js          # Core reactive controller, drag gizmo & autocompletes
├── vercel.json        # Production Vercel deployment configuration
├── .gitignore         # Clean repository filtering (build & test artefacts)
└── README.md          # Project documentation & architectural blueprints
```

---

## 🎨 Color Palette & Design Tokens

| Token | Hex / Value | Description |
|---|---|---|
| `--rv-sidebar-bg` | `#21092F` | Canva Dark Violet slanted sidebar |
| `--rv-pill-bg` | `#D5BEE8` | Canva Lilac/Lavender horizontal capsule |
| `--rv-sidebar-lilac`| `#CBB4E5` | Sidebar section headings accent |
| `--clr-brand` | `#6B3687` | Primary interactive brand purple |
| `--clr-bg` | `#ECE8F4` | Canvas workspace backdrop |
| `--font-head` | `'Montserrat', sans-serif` | Candidate name & section titles |
| `--font-body` | `'Open Sans', sans-serif` | Descriptions, body copy & subtitles |

---

## 🚀 Deployment Guide (Vercel)

### Option 1: One-Click Vercel Import via GitHub (Recommended)

1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: complete Canva Purple CV builder with cursor transform gizmo"
   git branch -M main
   git remote add origin https://github.com/vamsikrishnasunkara/Resume-Builder.git
   git push -u origin main
   ```
2. Navigate to [vercel.com/new](https://vercel.com/new).
3. Connect your GitHub account and select **`Resume-Builder`**.
4. Set **Framework Preset** to `Other` (Zero-config static deployment).
5. Click **Deploy**. Vercel will build and serve your resume builder at a global CDN URL in seconds!

### Option 2: Deploy Using the Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy directly from workspace
vercel --prod
```

---

## 🤝 Contributing & License

Contributions, issues, and feature requests are welcome!
Feel free to open an issue or pull request on [GitHub](https://github.com/vamsikrishnasunkara/Resume-Builder).

Distributed under the **MIT License**. See `LICENSE` for more information.

<p align="center">
  Built with ❤️ by <a href="https://github.com/vamsikrishnasunkara">Vamsi Krishna Sunkara</a>
</p>
