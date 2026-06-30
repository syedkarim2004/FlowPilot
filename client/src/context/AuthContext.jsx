import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth, signInWithGoogle, logOut } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async () => {
    console.log('AuthContext signIn called');
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign-in error:', err.code, err.message);
      throw err;
    }
  };

  const signInWithEmail = async (email, password) => {
    console.log('AuthContext signInWithEmail called');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err) {
      console.error('Email sign-in error:', err.code, err.message);
      throw err;
    }
  };

  const signUpWithEmail = async (email, password) => {
    console.log('AuthContext signUpWithEmail called');
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err) {
      console.error('Email sign-up error:', err.code, err.message);
      throw err;
    }
  };

  const resetPassword = async (email) => {
    console.log('AuthContext resetPassword called');
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      console.error('Password reset error:', err.code, err.message);
      throw err;
    }
  };

  const signOutUser = async () => {
    try {
      await logOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signInWithEmail, 
      signUpWithEmail, 
      resetPassword, 
      signOut: signOutUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
