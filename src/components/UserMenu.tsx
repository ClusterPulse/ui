import React, { useState } from 'react';
import {
  Button,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  MenuToggleElement,
  Divider,
  Label,
  Spinner,
} from '@patternfly/react-core';
import {
  UserIcon,
  UsersIcon,
  KeyIcon,
  SignOutAltIcon,
  SignInAltIcon,
} from '@patternfly/react-icons';
import { useQuery } from '@tanstack/react-query';
import { clusterAPI } from '../services/api';

export const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const { data: authStatus, isLoading: authLoading } = useQuery({
    queryKey: ['authStatus'],
    queryFn: () => clusterAPI.getAuthStatus(),
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  // Only fetch permissions if authenticated
  const { data: permissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => clusterAPI.getUserPermissions(),
    enabled: authStatus?.authenticated === true,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const handleLogout = async () => {
    await clusterAPI.logout();
  };

  const handleLogin = () => {
    clusterAPI.redirectToLogin();
  };

  if (authLoading) {
    return <Spinner size="md" />;
  }

  // Show login button for unauthenticated users
  if (!authStatus?.authenticated || !authStatus?.user) {
    return (
      <Button
        variant="primary"
        onClick={handleLogin}
        icon={<SignInAltIcon />}
      >
        Login
      </Button>
    );
  }

  const user = authStatus.user;

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          onClick={() => setIsOpen(!isOpen)}
          isExpanded={isOpen}
          icon={<UserIcon />}
        >
          {user.preferred_username || user.username}
        </MenuToggle>
      )}
    >
      <DropdownList>
        <DropdownItem key="username" isDisabled>
          <div className="pf-v5-u-font-weight-bold">
            <UserIcon className="pf-v5-u-mr-sm" />
            {user.username}
          </div>
          {user.email && (
            <div className="pf-v5-u-font-size-sm pf-v5-u-color-200">
              {user.email}
            </div>
          )}
        </DropdownItem>
        
        <Divider key="divider-1" />
        
        {user.groups && user.groups.length > 0 && (
          <>
            <DropdownItem key="groups" isDisabled>
              <div>
                <UsersIcon className="pf-v5-u-mr-sm" />
                <span className="pf-v5-u-font-weight-bold">Groups ({user.groups.length})</span>
              </div>
              <div className="pf-v5-u-mt-sm">
                {user.groups.slice(0, 3).map((group: string) => (
                  <Label key={group} isCompact className="pf-v5-u-mr-xs pf-v5-u-mb-xs">
                    {group}
                  </Label>
                ))}
                {user.groups.length > 3 && (
                  <Label isCompact>+{user.groups.length - 3} more</Label>
                )}
              </div>
            </DropdownItem>
            <Divider key="divider-2" />
          </>
        )}

        {permissions?.summary && (
          <>
            <DropdownItem key="permissions" isDisabled>
              <div>
                <KeyIcon className="pf-v5-u-mr-sm" />
                <span className="pf-v5-u-font-weight-bold">Access</span>
              </div>
              <div className="pf-v5-u-font-size-sm pf-v5-u-mt-xs">
                {permissions.summary.accessible_clusters} of {permissions.summary.total_clusters} clusters
              </div>
              {permissions.summary.applied_policies > 0 && (
                <div className="pf-v5-u-font-size-sm">
                  {permissions.summary.applied_policies} policies applied
                </div>
              )}
            </DropdownItem>
            <Divider key="divider-3" />
          </>
        )}

        <DropdownItem
          key="logout"
          icon={<SignOutAltIcon />}
          onClick={handleLogout}
        >
          Logout
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
};
