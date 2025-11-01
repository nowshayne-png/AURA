import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { databaseService } from '../services/database';

export function AuthSync() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      const syncUserProfile = async () => {
        try {
          const existingProfile = await databaseService.getUserProfile(user.id);

          if (!existingProfile) {
            await databaseService.createUserProfile(
              user.id,
              user.primaryEmailAddress?.emailAddress || '',
              user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.firstName || 'User'
            );
          }
        } catch (error) {
          console.error('Error syncing user profile:', error);
        }
      };

      syncUserProfile();
    }
  }, [user, isLoaded]);

  return null;
}
