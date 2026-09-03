import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  username?: string;
  photoURL?: string;
  role: 'participant' | 'admin';
  balance: number;
  totalEarned: number;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = undefined;
      }

      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Use onSnapshot to keep user data (like balance) updated in real-time
        unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: data.name || '',
              username: data.username,
              photoURL: data.photoURL,
              role: data.role || 'participant',
              balance: data.balance || 0,
              totalEarned: data.totalEarned || 0,
            });
          } else {
            // Handle edge case where auth exists but no doc
            setUser(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Auth snapshot error:", error);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
