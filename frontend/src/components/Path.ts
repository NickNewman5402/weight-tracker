// frontend/src/components/Path.js

/*********************************************************************************************
*
*           Prof says this should be .js but it throws an error. further research suggest .ts
*
**********************************************************************************************/
const app_name = 'formatrack.xyz';

export function buildPath(route: string) 
{
  if (import.meta.env.MODE !== 'development') 
    {
        return 'http://' + app_name + ':5000/' + route;
    }
    
    else 
    {
        return 'http://localhost:5000/' + route;
    }
}
