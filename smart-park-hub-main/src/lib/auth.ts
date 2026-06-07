export type AuthRole = "admin" | "user";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
}

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
  role: AuthRole;
}

interface StoredUser extends AuthUser {
  password: string;
}

const USERS_STORAGE_KEY = "smartpark_registered_users";
export const SESSION_STORAGE_KEY = "smartpark_current_user";

export const demoAdmin = {
  name: "Admin",
  email: "admin@smartpark.local",
  password: "admin123",
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const readUsers = (): StoredUser[] => {
  const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
  if (!rawUsers) return [];

  try {
    return JSON.parse(rawUsers) as StoredUser[];
  } catch {
    localStorage.removeItem(USERS_STORAGE_KEY);
    return [];
  }
};

const writeUsers = (users: StoredUser[]) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const getInitialSession = (): AuthUser | null => {
  const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!rawSession) return null;

  try {
    return JSON.parse(rawSession) as AuthUser;
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
};

export const saveSession = (user: AuthUser) => {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_STORAGE_KEY);
};

export const registerUser = ({ name, email, password }: RegisterUserInput): AuthUser => {
  const normalizedEmail = normalizeEmail(email);
  const trimmedName = name.trim();

  if (!trimmedName || !normalizedEmail || !password) {
    throw new Error("Name, email, and password are required.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  if (normalizedEmail === demoAdmin.email) {
    throw new Error("This email is reserved for admin access.");
  }

  const users = readUsers();
  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error("An account already exists with this email.");
  }

  const user: StoredUser = {
    id: `USR-${Date.now().toString(36).toUpperCase()}`,
    name: trimmedName,
    email: normalizedEmail,
    password,
    role: "user",
  };

  writeUsers([user, ...users]);

  const { password: _password, ...safeUser } = user;
  return safeUser;
};

export const loginUser = ({ email, password, role }: LoginInput): AuthUser => {
  const normalizedEmail = normalizeEmail(email);

  if (role === "admin") {
    if (normalizedEmail !== demoAdmin.email || password !== demoAdmin.password) {
      throw new Error("Invalid admin credentials.");
    }

    return {
      id: "ADMIN-001",
      name: demoAdmin.name,
      email: demoAdmin.email,
      role: "admin",
    };
  }

  const user = readUsers().find((storedUser) => storedUser.email === normalizedEmail);
  if (!user || user.password !== password) {
    throw new Error("Invalid user credentials.");
  }

  const { password: _password, ...safeUser } = user;
  return safeUser;
};
