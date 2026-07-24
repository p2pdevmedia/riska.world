# Technology Stack Overview

This project will be built with the following core technologies:

- **Next.js (React)** – Provides the application framework, server components, and routing.
- **Tailwind CSS** – Supplies utility-first styling and rapid UI development.
- **viem** – Enables on-chain interactions and MetaMask connectivity in the frontend.

## CSS Integration Strategy

Tailwind CSS will be configured through the standard `tailwind.config.js` and `postcss.config.js` files. Global styles live in `src/styles/globals.css`, where Tailwind directives (`@tailwind base;`, `@tailwind components;`, `@tailwind utilities;`) are imported. Component-specific styling leverages Tailwind utility classes directly in JSX. When custom CSS is required, create additional files under `src/styles/` and import them at the component level.

## Project Structure Guidelines

```
/
├── app/ or pages/            # Next.js routing entry points
├── components/               # Shared React components
├── lib/                      # Utility functions, hooks, and shared logic
├── public/                   # Static assets
├── src/styles/               # Global and custom CSS files
└── types/                    # Shared TypeScript types (if needed)
```

- Web3 connection helpers that use **viem** should live in `lib/web3/`.
- Tailwind-related configuration remains at the repository root for easy tooling access.
These conventions keep the product state and policy lifecycle on-chain while supporting rapid iteration across the frontend and contract layers.
