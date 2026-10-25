import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';

// Paste your config from Firebase Console → Project settings → Your apps → Web app
const firebaseConfig = {
  apiKey: 'AIzaSyBA2EmXaFdCwMXmQYCkgcNflr1ZJ2PW5O8',
  authDomain: 'vagha-management-system.firebaseapp.com',
  projectId: 'vagha-management-system',
  storageBucket: 'vagha-management-system.firebasestorage.app',
  messagingSenderId: '472311964185',
  appId: '1:472311964185:web:3f171c8e6d61996a82c088',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Log in with email and password
export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// Log out and go back to the login page
export async function logout() {
  await signOut(auth);
  location.replace('login.html');
}

// Call on every protected page: redirects to login if not signed in
export function requireAuth(onReady) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      location.replace('login.html');
    } else if (onReady) {
      onReady(user);
    }
  });
}

// Call on the login page: sends logged-in users straight to the app
export function redirectIfLoggedIn(target = 'index.html') {
  onAuthStateChanged(auth, (user) => {
    if (user) location.replace(target);
  });
}

// Resolves with the signed-in user, or redirects to the login page and
// never resolves. Lets index.html wait for login BEFORE loading any data.
export function waitForUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        location.replace('login.html');
      }
    });
  });
}

// Returns a fresh Firebase ID token for the signed-in user (the SDK
// refreshes it automatically when it is close to expiring). The Apps
// Script backend verifies this token to know WHO is calling.
export async function getIdToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in.');
  return user.getIdToken();
}
