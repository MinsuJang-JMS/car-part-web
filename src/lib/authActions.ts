import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export async function signupIndividual(
  email: string,
  password: string,
  name: string,
  phone: string
) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'users', credential.user.uid), {
    email,
    name,
    phone,
    userType: 'individual',
    status: 'active',
    createdAt: serverTimestamp(),
  });
  return credential.user;
}

export async function signupBusiness(
  email: string,
  password: string,
  name: string,
  phone: string,
  businessName: string,
  businessNumber: string
) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;

  await setDoc(doc(db, 'users', uid), {
    email,
    name,
    phone,
    userType: 'business',
    status: 'pending',
    businessName,
    businessNumber,
    createdAt: serverTimestamp(),
  });

  await addDoc(collection(db, 'pendingBusinesses'), {
    userId: uid,
    businessName,
    businessNumber,
    applicantName: name,
    phone,
    createdAt: serverTimestamp(),
    status: 'pending',
  });

  return credential.user;
}

export async function login(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logout() {
  await firebaseSignOut(auth);
}
