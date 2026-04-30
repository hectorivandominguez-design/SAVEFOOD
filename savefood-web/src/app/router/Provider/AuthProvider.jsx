import { createContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../../../services/firebase/config';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadUserProfile(uid) {
    const ref = doc(db, 'USERS', uid);
    const snapshot = await getDoc(ref);

    if (snapshot.exists()) {
      return snapshot.data();
    }

    return null;
  }

  async function refreshUserProfile(uid) {
    const targetUid = uid || currentUser?.uid;

    if (!targetUid) return null;

    const profile = await loadUserProfile(targetUid);
    setUserProfile(profile);
    return profile;
  }

  async function register({
    firstName,
    lastName,
    email,
    password,
    genero = '',
    telefonoContacto = '',
    indicativoTelefono = '+57',
  }) {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = credential.user.uid;

      const newUserProfile = {
        userId: uid,
        firstName,
        lastName,
        email,
        genero,
        telefonoContacto,
        indicativoTelefono,
        rol: 'CLIENTE',
        estadoCuenta: 'ACTIVA',
        fechaRegistro: serverTimestamp(),
        fechaActualizacion: serverTimestamp(),
      };

      await setDoc(doc(db, 'USERS', uid), newUserProfile);
      await refreshUserProfile(uid);

      return credential.user;
    } catch (err) {
      console.error('Error en registro:', err);

      try {
        if (auth.currentUser) {
          await signOut(auth);
        }
      } catch (signOutErr) {
        console.error('Error al cerrar sesión después de fallo:', signOutErr);
      }

      throw err;
    }
  }

  async function login(email, password) {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const profile = await loadUserProfile(credential.user.uid);

      if (!profile) {
        await signOut(auth);
        throw new Error('Esta cuenta no está registrada completamente. Por favor, regístrate primero.');
      }

      setUserProfile(profile);
      return { user: credential.user, profile };
    } catch (err) {
      console.error('Error en login:', err);

      try {
        if (auth.currentUser) {
          await signOut(auth);
        }
      } catch (signOutErr) {
        console.error('Error al cerrar sesión después de fallo:', signOutErr);
      }

      throw err;
    }
  }

  async function logout() {
    await signOut(auth);
    setUserProfile(null);
  }

  async function resetPassword(email) {
    const cleanEmail = email.trim().toLowerCase();

    await sendPasswordResetEmail(auth, cleanEmail, {
      url: `${window.location.origin}/login`,
      handleCodeInApp: false,
    });
  }

  async function updateUserProfile(data) {
    if (!currentUser?.uid) {
      throw new Error('No hay usuario autenticado.');
    }

    const ref = doc(db, 'USERS', currentUser.uid);

    await updateDoc(ref, {
      ...data,
      fechaActualizacion: serverTimestamp(),
    });

    return await refreshUserProfile(currentUser.uid);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        const profile = await loadUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      userProfile,
      loading,
      register,
      login,
      logout,
      resetPassword,
      refreshUserProfile,
      updateUserProfile,
    }),
    [currentUser, userProfile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
