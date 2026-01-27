import { AccessType } from '@/constants';

/**
 * Checks that user has a certain access level on a given resource
 */
export function hasWriteAccess(resource) {
  return resource._accessLevel >= AccessType.WRITE;
}

export function hasAdminAccess(resource) {
  return resource._accessLevel >= AccessType.ADMIN;
}
