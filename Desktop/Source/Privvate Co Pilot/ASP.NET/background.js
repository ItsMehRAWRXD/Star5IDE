async function sendAuthenticatedRequest(endpoint, method, data) {
  const token = await chrome.storage.local.get(['jwtToken']);
  if (!token.jwtToken) {
    throw new Error('User not authenticated.');
  }

  const response = await fetch(`https://your-api-server.com/api/${endpoint}`, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.jwtToken}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }
  return await response.json();
}
