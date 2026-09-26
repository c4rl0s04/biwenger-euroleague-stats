export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResult {
  message: string;
}

export interface LinkBiwengerInput {
  password: string;
  email?: string;
}

export interface LinkBiwengerResult {
  message: string;
  status: 'linked';
  biwengerLinked: true;
}

export interface AccountSettingsViewModel {
  id: string;
  name: string | null;
  email: string | null;
  biwengerLinked: boolean;
}
