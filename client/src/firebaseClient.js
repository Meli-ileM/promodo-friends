import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported as analyticsSupported } from "firebase/analytics";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDoc
} from "firebase/firestore";
import { getFirestore } from "firebase/firestore";

const CONFIG_KEY = "pf_firebase_config";
let dbInstance = null;
let analyticsInstance = null;

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDPMaHXuPYqz4V2eSFvmJToydqpFm0O-FI",
  authDomain: "promodo-friends.firebaseapp.com",
  projectId: "promodo-friends",
  storageBucket: "promodo-friends.firebasestorage.app",
  messagingSenderId: "797500655347",
  appId: "1:797500655347:web:5c41286ae212adfdd15986",
  measurementId: "G-8F437742ZR"
};

export function getSavedConfig() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_KEY) || "null") || DEFAULT_FIREBASE_CONFIG;
  } catch {
    return DEFAULT_FIREBASE_CONFIG;
  }
}

export function saveConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function initFirebase(config) {
  const existing = getApps()[0];
  const app = existing || initializeApp(config || DEFAULT_FIREBASE_CONFIG);
  dbInstance = getFirestore(app);

  if (!analyticsInstance && typeof window !== "undefined") {
    analyticsSupported()
      .then((ok) => {
        if (ok) analyticsInstance = getAnalytics(app);
      })
      .catch(() => {
        analyticsInstance = null;
      });
  }

  return dbInstance;
}

export function getDb() {
  if (!dbInstance) {
    const cfg = getSavedConfig();
    if (!cfg) throw new Error("Firebase non configure.");
    initFirebase(cfg);
  }
  return dbInstance;
}

export async function ensureRoom(roomId, createdBy) {
  const db = getDb();
  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) {
    await setDoc(roomRef, {
      id: roomId,
      createdBy,
      createdAt: serverTimestamp()
    });
  }
}

export async function upsertMember(roomId, memberId, payload) {
  const db = getDb();
  const ref = doc(db, "rooms", roomId, "members", memberId);
  await setDoc(
    ref,
    {
      ...payload,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export function watchMembers(roomId, onData) {
  const db = getDb();
  const q = query(collection(db, "rooms", roomId, "members"), orderBy("updatedAt", "desc"));
  return onSnapshot(q, (snap) => {
    onData(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }))
    );
  });
}

export async function sendCheer(roomId, payload) {
  const db = getDb();
  await addDoc(collection(db, "rooms", roomId, "cheers"), {
    ...payload,
    createdAt: serverTimestamp()
  });
}

export function watchCheers(roomId, onData) {
  const db = getDb();
  const q = query(collection(db, "rooms", roomId, "cheers"), orderBy("createdAt", "desc"), limit(30));
  return onSnapshot(q, (snap) => {
    onData(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }))
    );
  });
}

export async function roomExists(roomId) {
  const db = getDb();
  const ref = doc(db, "rooms", roomId);
  const snap = await getDoc(ref);
  return snap.exists();
}
