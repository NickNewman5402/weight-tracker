// frontend/src/components/Path.js

/*********************************************************************************************
*
*           Prof says this should be .js but it throws an error. further research suggest .ts
*
**********************************************************************************************/
// frontend/src/components/Path.ts

const app_name = 'formatrack.xyz';

export function buildPath(route: string): string {
  // Local development (vite sets this automatically)
  if (import.meta.env.MODE === 'development') {
    return `http://localhost:5000/api/${route}`;
  }

  // Production — use relative path so HTTPS stays valid
  return `/api/${route}`;
}

