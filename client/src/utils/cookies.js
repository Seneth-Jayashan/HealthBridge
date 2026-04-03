export const getCookie = (name) => {
  const cookieName = `${name}=`;
  const decoded = decodeURIComponent(document.cookie || '');
  const cookies = decoded.split(';');

  for (let index = 0; index < cookies.length; index += 1) {
    const entry = cookies[index].trim();
    if (entry.startsWith(cookieName)) {
      return entry.substring(cookieName.length);
    }
  }

  return null;
};

export const setCookie = (name, value, days = 1) => {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  const secure = window.location.protocol === 'https:' ? ';Secure' : '';

  document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/;SameSite=Lax${secure}`;
};

export const removeCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
};
