export type UserRole = "Admin" | "User";

export interface UserAccount {
  username: string;
  role: UserRole;
  password?: string;
  createdAt: string;
}

export interface UserSession {
  username: string;
  role: UserRole;
  loggedInAt?: string;
}

export interface UserActivity {
  user: string;
  action: string;
  time: string;
}

export const STORAGE_KEY_SESSION = "ledgerlens-session";
export const STORAGE_KEY_USERS = "ledgerlens-users";
export const STORAGE_KEY_ACTIVITY = "ledgerlens-activity";

export const DEFAULT_USERS: UserAccount[] = [
  { username: "admin", role: "Admin", password: "admin123", createdAt: "System Default" },
  { username: "analyst", role: "User", password: "user123", createdAt: "System Default" },
];

export const DEFAULT_ACTIVITIES: UserActivity[] = [
  { user: "analyst", action: "Reconciled bank_test_2.csv vs ledger_test_2.csv (3 issues found)", time: "10 mins ago" },
  { user: "admin", action: "Configured Exasol analytical connection", time: "1 hour ago" },
  { user: "admin", action: "Created workspace account for analyst", time: "1 day ago" },
];

export function getStoredUsers(): UserAccount[] {
  if (typeof window === "undefined") return DEFAULT_USERS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveUsers(users: UserAccount[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  window.dispatchEvent(new Event("storage"));
}

export function getStoredActivities(): UserActivity[] {
  if (typeof window === "undefined") return DEFAULT_ACTIVITIES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_ACTIVITY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY_ACTIVITY, JSON.stringify(DEFAULT_ACTIVITIES));
      return DEFAULT_ACTIVITIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_ACTIVITIES;
  } catch {
    return DEFAULT_ACTIVITIES;
  }
}

export function recordActivity(action: string, customUser?: string): void {
  if (typeof window === "undefined") return;
  try {
    const session = getCurrentSession();
    const user = customUser || session?.username || "analyst";
    const current = getStoredActivities();
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const updated = [{ user, action, time }, ...current].slice(0, 50);
    window.localStorage.setItem(STORAGE_KEY_ACTIVITY, JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));
  } catch {
    // ignore in case of storage failure
  }
}

export function getCurrentSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(session: UserSession | null): void {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY_SESSION);
  } else {
    window.localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
  }
  window.dispatchEvent(new Event("storage"));
}

export function authenticateUser(
  username: string,
  password: string,
  role: UserRole
): { success: boolean; error?: string; user?: UserAccount } {
  const cleanUsername = username.trim();
  const users = getStoredUsers();
  const existing = users.find((u) => u.username.toLowerCase() === cleanUsername.toLowerCase());

  if (existing) {
    if (existing.role !== role) {
      return {
        success: false,
        error: `User "${existing.username}" is registered as a ${existing.role}. Please switch role to ${existing.role} or sign in with another account.`,
      };
    }
    if (existing.password && existing.password !== password) {
      return { success: false, error: "Incorrect password. Click 'Forgot or reset password' if needed." };
    }
    return { success: true, user: existing };
  }

  // If user does not exist in demo storage yet, create it on the fly for ease of testing
  const newUser: UserAccount = {
    username: cleanUsername,
    role,
    password,
    createdAt: new Date().toLocaleDateString(),
  };
  saveUsers([...users, newUser]);
  return { success: true, user: newUser };
}

export function resetPassword(username: string, newPassword: string): { success: boolean; error?: string } {
  const clean = username.trim().toLowerCase();
  const users = getStoredUsers();
  const idx = users.findIndex((u) => u.username.toLowerCase() === clean);

  if (idx === -1) {
    return { success: false, error: `Account "${username}" was not found in this workspace.` };
  }

  users[idx] = {
    ...users[idx],
    password: newPassword,
  };
  saveUsers([...users]);
  recordActivity(`Password was reset for account "${users[idx].username}"`, users[idx].username);
  return { success: true };
}

export function addUser(account: {
  username: string;
  role: UserRole;
  password?: string;
}): { success: boolean; error?: string } {
  const clean = account.username.trim();
  if (!clean) return { success: false, error: "Username cannot be empty." };

  const users = getStoredUsers();
  if (users.some((u) => u.username.toLowerCase() === clean.toLowerCase())) {
    return { success: false, error: `User "${clean}" already exists.` };
  }

  const created: UserAccount = {
    username: clean,
    role: account.role,
    password: account.password || "welcome123",
    createdAt: new Date().toLocaleDateString(),
  };

  saveUsers([...users, created]);
  recordActivity(`Admin added new ${account.role} account: "${clean}"`);
  return { success: true };
}
