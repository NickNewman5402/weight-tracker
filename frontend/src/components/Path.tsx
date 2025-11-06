// frontend/src/components/Path.js

/*********************************************************************************************
*
*           Prof says this should be .js but it throws an error. further research suggest .ts
*
**********************************************************************************************/
// frontend/src/components/Path.ts
const app_name = 'www.formatrack.xyz';

// Add console logging to confirm during runtime
function buildPath(route: string): string 
{
  let path;
  
  if (import.meta.env.MODE !== 'development') 
  {
    // Use HTTPS and no port in production
    path = 'https://' + app_name + '/api/' + route;
  } 
  
  else 
  {
    // Local dev: keep the 5000 port
    path = 'http://localhost:5000/api/' + route;
  }

  console.log('🧭 buildPath:', path);
  return path;
  
}

export default buildPath;
