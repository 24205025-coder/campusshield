/**
 * CampusShield Vanilla JS Clerk Authentication Module
 */

const CLERK_PUBLISHABLE_KEY = "pk_test_Y2F1c2FsLWd1cHB5LTk3MTQuY2xlcmsuYWNjb3VudHMuZGV2JA";
const ADMIN_EMAIL = "mohamedkaisibrahim2@gmail.com";

let clerkInstance = null;

/**
 * Initializes Clerk JS SDK dynamically
 */
export async function initClerk() {
  if (clerkInstance) return clerkInstance;
  if (window.Clerk && window.Clerk.isReady) {
    clerkInstance = window.Clerk;
    return clerkInstance;
  }

  return new Promise((resolve) => {
    if (window.Clerk) {
      clerkInstance = window.Clerk;
      clerkInstance.load().then(() => resolve(clerkInstance)).catch(() => resolve(null));
      return;
    }

    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js";
    script.setAttribute('data-clerk-publishable-key', CLERK_PUBLISHABLE_KEY);
    script.async = true;

    script.onload = async () => {
      try {
        clerkInstance = window.Clerk;
        await clerkInstance.load();
        resolve(clerkInstance);
      } catch (err) {
        console.warn("Clerk SDK load warning:", err);
        resolve(null);
      }
    };

    script.onerror = () => {
      console.warn("Failed to load Clerk script from CDN");
      resolve(null);
    };

    document.head.appendChild(script);
  });
}

/**
 * Get active session JWT token for API requests
 */
export async function getAuthToken() {
  try {
    if (!clerkInstance) await initClerk();
    if (clerkInstance && clerkInstance.session) {
      const token = await clerkInstance.session.getToken();
      if (token) return token;
    }
  } catch (err) {
    console.warn("Could not retrieve Clerk session token:", err);
  }

  const localUser = getCurrentUser();
  if (localUser) {
    try {
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payload = btoa(JSON.stringify({ sub: localUser.id, email: localUser.email, name: localUser.name }));
      return `${header}.${payload}.sig`;
    } catch (e) {
      return `usr_${localUser.id}`;
    }
  }

  return null;
}

/**
 * Get current authenticated user details
 */
export function getCurrentUser() {
  if (window.Clerk && window.Clerk.user) {
    const u = window.Clerk.user;
    const primaryEmail = u.primaryEmailAddress ? u.primaryEmailAddress.emailAddress : '';
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || primaryEmail || 'Student';
    return {
      id: u.id,
      email: primaryEmail,
      name: fullName,
      firstName: u.firstName || 'User',
      isAdmin: primaryEmail.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim()
    };
  }

  if (clerkInstance && clerkInstance.user) {
    const u = clerkInstance.user;
    const primaryEmail = u.primaryEmailAddress ? u.primaryEmailAddress.emailAddress : '';
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || primaryEmail || 'Student';
    return {
      id: u.id,
      email: primaryEmail,
      name: fullName,
      firstName: u.firstName || 'User',
      isAdmin: primaryEmail.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim()
    };
  }

  // Local storage session fallback
  const saved = localStorage.getItem('campusshield_user');
  if (saved) {
    try {
      const u = JSON.parse(saved);
      u.isAdmin = (u.email || '').toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
      return u;
    } catch (e) {}
  }

  return null;
}

/**
 * Login user via local form
 */
export function loginLocalUser(email, name = 'Student') {
  const user = {
    id: `usr_${Date.now()}`,
    email: email.trim(),
    name: name.trim() || 'Student',
    firstName: name.split(' ')[0] || 'Student',
    isAdmin: email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim()
  };
  localStorage.setItem('campusshield_user', JSON.stringify(user));
  return user;
}

/**
 * Returns true if logged in user is admin
 */
export function isAdminUser() {
  const user = getCurrentUser();
  return user ? user.isAdmin : false;
}

/**
 * Sign out user
 */
export function signOutUser(e) {
  if (e && e.preventDefault) {
    e.preventDefault();
  }
  localStorage.removeItem('campusshield_user');
  sessionStorage.clear();

  if (window.Clerk && window.Clerk.signOut) {
    window.Clerk.signOut().catch(() => {}).finally(() => {
      window.location.href = '/index.html';
    });
  } else if (clerkInstance && clerkInstance.signOut) {
    clerkInstance.signOut().catch(() => {}).finally(() => {
      window.location.href = '/index.html';
    });
  } else {
    window.location.href = '/index.html';
  }
}

// Make globally accessible
window.signOutUser = signOutUser;

/**
 * Protect page - redirect to sign-in if not authenticated
 */
export async function requireAuthPage() {
  await initClerk();
  const user = getCurrentUser();
  if (!user) {
    window.location.href = `/sign-in.html?redirect_url=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    return false;
  }
  return true;
}

/**
 * Protect admin page - redirect if not admin
 */
export async function requireAdminPage() {
  const authed = await requireAuthPage();
  if (!authed) return false;
  if (!isAdminUser()) {
    alert("Access Denied: Administrator privileges required.");
    window.location.href = '/index.html';
    return false;
  }
  return true;
}
