import { api } from './api';

// For production or actual usage, Firebase can be initialized here.
// Since we are running in an environment without pre-configured keys,
// we will export a helper that supports using a user-provided idToken,
// or a mock authentication bypass mode for local UI development.

export const signInWithToken = async (idToken) => {
  return api.syncUser(idToken);
};

export const completeUserProfile = async (idToken, firstName, lastName, email) => {
  return api.updateUserProfile({ firstName, lastName, email });
};
