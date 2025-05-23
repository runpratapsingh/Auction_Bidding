import {
  useGetUsersQuery,
  useUpdateProfileMutation,
  useAssignRoleMutation,
  useDeleteUserMutation,
} from '../services/api';

export const useUsers = () => {
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [assignRole, { isLoading: isAssigningRole }] = useAssignRoleMutation();
  const [deleteUser, { isLoading: isDeletingUser }] = useDeleteUserMutation();

  const { data: users, isLoading: isLoadingUsers } = useGetUsersQuery();

  return {
    users,
    updateProfile,
    assignRole,
    deleteUser,
    isLoading: isUpdatingProfile || isAssigningRole || isDeletingUser || isLoadingUsers,
  };
}; 