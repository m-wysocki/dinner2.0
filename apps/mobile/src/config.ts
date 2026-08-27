const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;

// localhost is useful for the simulator; physical devices should use the host's LAN address.
export const apiBaseUrl = (configuredApiUrl ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
);

export const apiUrl = `${apiBaseUrl}/api/v1`;
