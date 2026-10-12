import { api } from './api';

// For production or actual usage, Firebase can be initialized here.
// Since we are running in an environment without pre-configured keys,
// we will export a helper that supports using a user-provided idToken,
// or a mock authentication bypass mode for local UI development.

export const signInWithToken = async (idToken) => {
  try {
    const data = await api.syncUser(idToken);
    return data;
  } catch (error) {
    console.error("Auth sync failed:", error);
    throw error;
  }
};

export const completeUserProfile = async (idToken, firstName, lastName, email) => {
  try {
    const data = await api.updateUserProfile({ firstName, lastName, email });
    return data;
  } catch (error) {
    console.error("Profile completion failed:", error);
    throw error;
  }
};
