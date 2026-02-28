export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  token?: string;
}

// Function to get user data from localStorage
export const getUserFromStorage = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userData = localStorage.getItem('userData');
    
    if (!userData) return null;
    
    const user = JSON.parse(userData);
    // Add the computed role to the user object
    return {
      ...user,
      role: user.role
    };
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
  const user = getUserFromStorage();
  console.log("Current user from localStorage:", user);
  return user;
};