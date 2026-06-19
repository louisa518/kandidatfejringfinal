// Firebase-konfiguration
// Denne fil bruges direkte af GitHub Pages-versionen.
// Firebase web config er offentlig i frontend, men databasen skal beskyttes med Firebase Rules.

export const firebaseConfig = {
  apiKey: "AIzaSyAN7wle8SLUFYB3sD0lYe2AFGZM6sIjtSM",
  authDomain: "kandidatfejring.firebaseapp.com",
  databaseURL: "https://kandidatfejring-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "kandidatfejring",
  storageBucket: "kandidatfejring.firebasestorage.app",
  messagingSenderId: "487960714691",
  appId: "1:487960714691:web:07a01f5d66a7ae9cb53176",
  measurementId: "G-5LE7107B39"
};

export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.includes("INDSAET") &&
    firebaseConfig.appId &&
    !firebaseConfig.appId.includes("INDSAET") &&
    firebaseConfig.databaseURL
  );
}
