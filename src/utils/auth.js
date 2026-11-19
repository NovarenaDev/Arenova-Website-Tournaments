import { api } from './api';

export const signInWithToken = async (idToken) => {
  return api.syncUser(idToken);
};

export const completeUserProfile = async (idToken, firstName, lastName, email) => {
  return api.completeProfile({ firstName, lastName, email });
};

