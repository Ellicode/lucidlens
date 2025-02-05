// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { GoogleAuthProvider } from 'firebase/auth'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCxX0s5lb8U94CWszvWIsEkDPLLTwGC6VA',
  authDomain: 'lucidlens-46383.firebaseapp.com',
  projectId: 'lucidlens-46383',
  storageBucket: 'lucidlens-46383.firebasestorage.app',
  messagingSenderId: '763864427369',
  appId: '1:763864427369:web:495b880b269524dd9f6bf8',
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
