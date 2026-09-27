import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../lib/utils';

const ProfilePage = () => {
  const { user, refreshUser, logout } = useAuth();
  
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await authService.updateProfile({ name: profileForm.name, email: profileForm.email });
      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 8) {
      return toast.error('New password must be at least 8 characters');
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    setPasswordLoading(true);
    try {
      await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed. Please sign in again.');
      setTimeout(() => logout(), 1500);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Profile Settings</h1>
      
      <Card header={<h2 className="text-lg font-medium text-slate-100">Profile Information</h2>}>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <Input
            label="Name"
            value={profileForm.name}
            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={profileForm.email}
            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
            required
          />
          <div className="pt-2 flex justify-end">
            <Button type="submit" loading={profileLoading}>
              Update Profile
            </Button>
          </div>
        </form>
      </Card>

      <Card header={<h2 className="text-lg font-medium text-slate-100">Change Password</h2>}>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            required
          />
          <Input
            label="New Password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            required
            minLength={8}
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            required
            minLength={8}
          />
          <div className="pt-2 flex justify-end">
            <Button type="submit" variant="primary" loading={passwordLoading}>
              Change Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProfilePage;
