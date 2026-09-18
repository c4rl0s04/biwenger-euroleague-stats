import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { mapManagerDirectoryRow } from './manager-directory.mapper';

describe('manager directory mapper', () => {
  it('maps valid row and preserves exact fields', () => {
    const row = {
      id: 'mgr-101',
      name: 'Manager Name',
      icon: 'icon.png',
      color_index: 4,
    };
    const vm = mapManagerDirectoryRow(row);
    expect(vm).toEqual({
      id: 'mgr-101',
      name: 'Manager Name',
      icon: 'icon.png',
      color_index: 4,
    });
  });

  it('preserves null names and icons and string id representation', () => {
    const row = {
      id: '99',
      name: null,
      icon: null,
      color_index: 0,
    };
    const vm = mapManagerDirectoryRow(row);
    expect(vm.id).toBe('99');
    expect(vm.name).toBeNull();
    expect(vm.icon).toBeNull();
    expect(vm.color_index).toBe(0);
  });

  it('strictly strips sensitive fields and synthetic canaries', () => {
    const row = {
      id: 'canary-user',
      name: 'Agent',
      icon: null,
      color_index: 1,
      password: 'super-secret-password',
      credential: 'leaked-token',
      secret: 'secret-key',
    };
    const vm = mapManagerDirectoryRow(row as any);
    expect(vm).toEqual({
      id: 'canary-user',
      name: 'Agent',
      icon: null,
      color_index: 1,
    });
    expect((vm as any).password).toBeUndefined();
    expect((vm as any).credential).toBeUndefined();
    expect((vm as any).secret).toBeUndefined();
  });
});
