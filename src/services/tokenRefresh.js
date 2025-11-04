import { config } from '../config';

export const TOKEN_REFRESH_CONFIG = {
  REFRESH_URL: `${config.apiBaseUrl}/auth/refresh`,
  REFRESH_BUFFER_MINUTES: 5,
  ACTIVITY_TIMEOUT_MINUTES: 15,
  CHECK_EXPIRY_INTERVAL_MS: 60000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
};

let isRefreshingToken = false;
let refreshPromise = null;

export function decodeJwt(token) {
  try {
    const [, payloadBase64] = token.split('.');
    const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payloadJson);
  } catch (e) {
    console.error('Error decoding JWT:', e);
    return null;
  }
}

export function isTokenValid(token) {
  if (!token) return false;
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) return false;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp > nowSeconds;
}

export function getTokenExpirationTime(token) {
  if (!token) return null;
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) return null;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const remainingSeconds = payload.exp - nowSeconds;
  return remainingSeconds * 1000;
}

export function shouldRefreshToken(token) {
  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) return false;
  const bufferMs = TOKEN_REFRESH_CONFIG.REFRESH_BUFFER_MINUTES * 60 * 1000;
  return expirationTime <= bufferMs && expirationTime > 0;
}

// export async function attemptTokenRefresh(refreshToken, attempt = 1) {
//   if (!refreshToken) {
//     throw new Error('No refresh token available');
//   }

//   if (isRefreshingToken && refreshPromise) {
//     return refreshPromise;
//   }

//   try {
//     isRefreshingToken = true;

//     refreshPromise = (async () => {
//       try {
//         const response = await fetch(TOKEN_REFRESH_CONFIG.REFRESH_URL, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/x-www-form-urlencoded',
//             'accept': 'application/json'
//           },
//           body: new URLSearchParams({
//             grant_type: 'refresh_token',
//             refresh_token: refreshToken,
//             scope: '',
//             client_id: 'string',
//             client_secret: ''
//           }).toString()
//         });

//         if (!response.ok) {
//           const data = await response.json().catch(() => ({}));
//           const error = new Error(data?.detail || 'Token refresh failed');
//           error.status = response.status;
//           throw error;
//         }

//         const tokens = await response.json();
//         console.log('Token refreshed successfully');
//         return tokens;
//       } catch (error) {
//         if (attempt < TOKEN_REFRESH_CONFIG.RETRY_ATTEMPTS && error.status !== 401) {
//           console.warn(`Token refresh failed, retrying... (attempt ${attempt}/${TOKEN_REFRESH_CONFIG.RETRY_ATTEMPTS})`);
//           await new Promise(resolve => setTimeout(resolve, TOKEN_REFRESH_CONFIG.RETRY_DELAY_MS * attempt));
//           return attemptTokenRefresh(refreshToken, attempt + 1);
//         }
//         throw error;
//       }
//     })();

//     return refreshPromise;
//   } finally {
//     refreshPromise.then(
//       () => {
//         isRefreshingToken = false;
//         refreshPromise = null;
//       },
//       () => {
//         isRefreshingToken = false;
//         refreshPromise = null;
//       }
//     );
//   }
// }

export async function attemptTokenRefresh(refreshToken, attempt = 1) {
  // if (!refreshToken) throw new Error('No refresh token available');
  if (!refreshToken) {
  refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) throw new Error('No refresh token available');
}


  if (isRefreshingToken && refreshPromise) return refreshPromise;

  try {
    isRefreshingToken = true;

    refreshPromise = (async () => {
      try {
        const response = await fetch(
          `${TOKEN_REFRESH_CONFIG.REFRESH_URL}?access_refresh_token=${encodeURIComponent(refreshToken)}`,
          {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          const error = new Error(data?.detail || 'Token refresh failed');
          error.status = response.status;
          throw error;
        }

        // const tokens = await response.json();
        // console.log('Token refreshed successfully');
        // return tokens;
        const tokens = await response.json();
        if (tokens?.access_token) {
          localStorage.setItem('access_token', tokens.access_token);
        }
        if (tokens?.refresh_token) {
          localStorage.setItem('refresh_token', tokens.refresh_token);}

console.log('Token refreshed successfully and saved to localStorage');
return tokens;

      } catch (error) {
        if (
          attempt < TOKEN_REFRESH_CONFIG.RETRY_ATTEMPTS &&
          error.status !== 401
        ) {
          console.warn(
            `Token refresh failed, retrying... (attempt ${attempt}/${TOKEN_REFRESH_CONFIG.RETRY_ATTEMPTS})`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, TOKEN_REFRESH_CONFIG.RETRY_DELAY_MS * attempt)
          );
          return attemptTokenRefresh(refreshToken, attempt + 1);
        }
        throw error;
      }
    })();

    return refreshPromise;
  } finally {
    refreshPromise.then(
      () => {
        isRefreshingToken = false;
        refreshPromise = null;
      },
      () => {
        isRefreshingToken = false;
        refreshPromise = null;
      }
    );
  }
}

export function clearRefreshState() {
  isRefreshingToken = false;
  refreshPromise = null;
}

class RequestQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  add(request) {
    this.queue.push(request);
  }

  async process() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift();
      try {
        await request();
      } catch (error) {
        console.error('Error processing queued request:', error);
      }
    }

    this.isProcessing = false;
  }

  clear() {
    this.queue = [];
  }
}

export const requestQueue = new RequestQueue();