// ─── LinguaLearn Auth System ───
// Secure localStorage-based auth with streak tracking
// API keys stored in .env only — never hardcoded

export interface Account {
  uid: string;
  email: string;
  displayName: string;
  password: string;
  photoURL?: string;
  provider: "email" | "google";
  isPremium: boolean;
  premiumExpiry?: number;
  createdAt: number;
  // Streak
  streak: number;
  lastActiveDate: string; // "YYYY-MM-DD"
  longestStreak: number;
  totalDaysActive: number;
  xp: number;
}

const ACCOUNTS_KEY = "ll_accounts_v2";
const SESSION_KEY = "ll_session_v2";

function getAccounts(): Account[] {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]"); }
  catch { return []; }
}
function saveAccounts(a: Account[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(a));
}
function saveSession(uid: string) {
  localStorage.setItem(SESSION_KEY, uid);
}

// Simple password hash (bcrypt not available in browser without libs)
function hash(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h |= 0;
  }
  return `h_${Math.abs(h).toString(16)}_${str.length}`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function updateStreak(acc: Account): Account {
  const today = todayStr();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (acc.lastActiveDate === today) return acc; // already counted today

  let newStreak = acc.streak;
  if (acc.lastActiveDate === yesterday) {
    newStreak = acc.streak + 1; // consecutive day
  } else if (acc.lastActiveDate !== today) {
    newStreak = 1; // streak broken
  }

  return {
    ...acc,
    streak: newStreak,
    longestStreak: Math.max(acc.longestStreak || 0, newStreak),
    lastActiveDate: today,
    totalDaysActive: (acc.totalDaysActive || 0) + 1,
    xp: (acc.xp || 0) + 10,
  };
}

function saveAndReturn(accounts: Account[], idx: number): Account {
  saveAccounts(accounts);
  saveSession(accounts[idx].uid);
  return accounts[idx];
}

export function registerWithEmail(email: string, password: string, displayName: string): Account {
  const accounts = getAccounts();
  if (accounts.find(a => a.email.toLowerCase() === email.toLowerCase())) throw new Error("EMAIL_EXISTS");
  if (password.length < 6) throw new Error("WEAK_PASSWORD");
  if (!displayName.trim()) throw new Error("NAME_EMPTY");

  let acc: Account = {
    uid: `uid_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    email: email.toLowerCase().trim(),
    displayName: displayName.trim(),
    password: hash(password),
    provider: "email",
    isPremium: false,
    createdAt: Date.now(),
    streak: 1,
    lastActiveDate: todayStr(),
    longestStreak: 1,
    totalDaysActive: 1,
    xp: 10,
  };
  accounts.push(acc);
  return saveAndReturn(accounts, accounts.length - 1);
}

export function loginWithEmail(email: string, password: string): Account {
  const accounts = getAccounts();
  const idx = accounts.findIndex(a => a.email.toLowerCase() === email.toLowerCase().trim() && a.provider === "email");
  if (idx === -1) throw new Error("USER_NOT_FOUND");
  if (accounts[idx].password !== hash(password)) throw new Error("WRONG_PASSWORD");
  accounts[idx] = updateStreak(accounts[idx]);
  return saveAndReturn(accounts, idx);
}

export function loginWithGoogle(googleEmail: string, googleName: string, googlePhoto: string): Account {
  const accounts = getAccounts();
  let idx = accounts.findIndex(a => a.email.toLowerCase() === googleEmail.toLowerCase() && a.provider === "google");

  if (idx === -1) {
    const acc: Account = {
      uid: `google_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      email: googleEmail.toLowerCase(),
      displayName: googleName,
      password: "",
      photoURL: googlePhoto,
      provider: "google",
      isPremium: false,
      createdAt: Date.now(),
      streak: 1,
      lastActiveDate: todayStr(),
      longestStreak: 1,
      totalDaysActive: 1,
      xp: 10,
    };
    accounts.push(acc);
    idx = accounts.length - 1;
  } else {
    accounts[idx] = updateStreak(accounts[idx]);
    // Update photo in case it changed
    accounts[idx].photoURL = googlePhoto;
    accounts[idx].displayName = googleName;
  }
  return saveAndReturn(accounts, idx);
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentSession(): Account | null {
  try {
    const uid = localStorage.getItem(SESSION_KEY);
    if (!uid) return null;
    return getAccounts().find(a => a.uid === uid) || null;
  } catch { return null; }
}

export function addXP(uid: string, amount: number): Account {
  const accounts = getAccounts();
  const idx = accounts.findIndex(a => a.uid === uid);
  if (idx === -1) throw new Error("USER_NOT_FOUND");
  accounts[idx].xp = (accounts[idx].xp || 0) + amount;
  accounts[idx] = updateStreak(accounts[idx]);
  saveAccounts(accounts);
  return accounts[idx];
}

export function activatePremium(uid: string, months: number): Account {
  const accounts = getAccounts();
  const idx = accounts.findIndex(a => a.uid === uid);
  if (idx === -1) throw new Error("USER_NOT_FOUND");
  const now = Date.now();
  const base = (accounts[idx].premiumExpiry || 0) > now ? accounts[idx].premiumExpiry! : now;
  accounts[idx].isPremium = true;
  accounts[idx].premiumExpiry = base + months * 30 * 24 * 60 * 60 * 1000;
  saveAccounts(accounts);
  return accounts[idx];
}

export function checkPremiumExpiry(uid: string): Account {
  const accounts = getAccounts();
  const idx = accounts.findIndex(a => a.uid === uid);
  if (idx === -1) throw new Error("USER_NOT_FOUND");
  if (accounts[idx].isPremium && accounts[idx].premiumExpiry && Date.now() > accounts[idx].premiumExpiry!) {
    accounts[idx].isPremium = false;
    accounts[idx].premiumExpiry = undefined;
    saveAccounts(accounts);
  }
  return accounts[idx];
}

export function formatExpiry(ts: number): string {
  return new Date(ts).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
}

export function getStreakEmoji(streak: number): string {
  if (streak >= 30) return "🔥🔥🔥";
  if (streak >= 14) return "🔥🔥";
  if (streak >= 7) return "🔥";
  if (streak >= 3) return "⚡";
  return "✨";
}
