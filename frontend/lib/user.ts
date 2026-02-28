export type UserRole = 'super_admin' | 'owner' | 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  account_id: string;
  token?: string;
}

// Function to get user data from localStorage
export const getUserFromStorage = (): User | null => {
  if (typeof window === 'undefined') return null;

  try {
    const userData = localStorage.getItem('userData');

    if (!userData) return null;

    const user = JSON.parse(userData) as User;
    return user;
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    localStorage.removeItem('userData');
    return null;
  }
};

export const saveUserToStorage = (user: User | null): void => {
  if (typeof window === 'undefined') return;

  try {
    if (!user) {
      localStorage.removeItem('userData');
      return;
    }

    localStorage.setItem('userData', JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user to localStorage:', error);
  }
};

export const getCurrentUser = (): User | null => {
  return getUserFromStorage();
};
