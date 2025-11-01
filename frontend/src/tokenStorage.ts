export function storeToken(tok: any) {
  try 
  {
    // your backend returns { jwtToken: "..." }
    localStorage.setItem('token_data', tok.jwtToken);
  } 
  
  catch (e) 
  {
    console.log(e);
  }
}

export function retrieveToken(): string | null 
{
  let ud: string | null = null;
  try 
  {
    ud = localStorage.getItem('token_data');
  } 
  
  catch (e) 
  {
    console.log(e);
  }
  
  return ud;
}
