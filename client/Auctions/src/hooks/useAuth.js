import {
  useRegisterMutation,
  useLoginMutation,
  useVerifyEmailQuery,
  useGetCurrentUserQuery,
} from '../services/api';

export const useAuth = () => {
  const [register, { isLoading: isRegistering }] = useRegisterMutation();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const { data: currentUser, isLoading: isLoadingUser } = useGetCurrentUserQuery();
  const { data: verificationStatus, isLoading: isVerifying } = useVerifyEmailQuery();

  return {
    register,
    login,
    currentUser,
    verificationStatus,
    isLoading: isRegistering || isLoggingIn || isLoadingUser || isVerifying,
  };
}; 