# 🎨 ArogyaScribe Frontend

The elegant, responsive, and intuitive user interface for **ArogyaScribe**. Built with **React 18**, **TypeScript**, and **Tailwind CSS**, it provides healthcare professionals with a premium experience for clinical documentation.

---

## ✨ Features & UX

- **Premium Interface** — Modern, clean design with dark mode support and smooth transitions.
- **Real-time Recording** — Interactive consultation interface with live transcription feedback.
- **Smart SOAP Editor** — Rich text editing for AI-generated clinical notes with approval workflows.
- **Advanced Analytics** — Interactive charts and data visualizations for clinical insights.
- **Responsive Design** — Fully optimized for desktop, tablet, and mobile viewing.
- **Seamless Auth** — JWT-based authentication with automatic token refreshing and RBAC.

---

## 🛠️ Tech Stack

- **Core Framework:** [React 18](https://reactjs.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching:** [TanStack Query v5](https://tanstack.com/query/latest)
- **Styling:** [Tailwind CSS v3](https://tailwindcss.com/) + Custom Design System
- **Icons:** [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Steps

1. **Clone & Enter Directory**
   ```bash
   cd frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Update VITE_API_BASE_URL to point to your backend (e.g., http://localhost:8000/api/v1)
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   ```

---

## 📂 Project Architecture

```plaintext
src/
├── api/          # Typed Axios clients for all backend services
├── components/   # Atomic design components (Shared, Layout, Feature-specific)
├── hooks/        # Custom React hooks (Recording, Auth, UI)
├── pages/        # Route-level view components
├── store/        # Zustand stores for Auth and UI state
├── styles/       # Global styles and Tailwind configuration
├── types/        # Global TypeScript interfaces and enums
└── utils/        # Shared helper functions
```

---

## 👨‍💻 Author

**Thummala Khalida**  
Lead Frontend Developer – ArogyaScribe

