import React from 'react';
import {
  Banner,
  Button,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import {
  LockIcon,
  InfoCircleIcon,
} from '@patternfly/react-icons';
import { motion } from 'framer-motion';

interface LoginBannerProps {
  onLogin: () => void;
}

export const LoginBanner: React.FC<LoginBannerProps> = ({ onLogin }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Banner
        //variant="info"
        style={{
          marginBottom: '1rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Flex
          alignItems={{ default: 'alignItemsCenter' }}
          justifyContent={{ default: 'justifyContentSpaceBetween' }}
          flexWrap={{ default: 'nowrap' }}
        >
          <FlexItem>
            <Flex
              alignItems={{ default: 'alignItemsCenter' }}
              spaceItems={{ default: 'spaceItemsSm' }}
            >
              <FlexItem>
                <InfoCircleIcon style={{ fontSize: '1.25rem' }} />
              </FlexItem>
              <FlexItem>
                <strong>Limited View</strong>
                <span style={{ marginLeft: '0.5rem' }}>
                  You're viewing basic cluster health information. Login to access detailed metrics, nodes, operators, and more.
                </span>
              </FlexItem>
            </Flex>
          </FlexItem>
          <FlexItem>
            <Button
              variant="primary"
              onClick={onLogin}
              icon={<LockIcon />}
              style={{
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              Login for Full Access
            </Button>
          </FlexItem>
        </Flex>
      </Banner>
    </motion.div>
  );
};
