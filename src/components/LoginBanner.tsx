import React from 'react';
import {
  Banner,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import {
  InfoCircleIcon,
  LockIcon,
} from '@patternfly/react-icons';
import { motion } from 'framer-motion';

export const LoginBanner: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Banner
        style={{
          marginBottom: '1rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Flex
          alignItems={{ default: 'alignItemsCenter' }}
          spaceItems={{ default: 'spaceItemsSm' }}
        >
          <FlexItem>
            <InfoCircleIcon style={{ fontSize: '1.25rem' }} />
          </FlexItem>
          <FlexItem>
            <strong>Limited View</strong>
          </FlexItem>
          <FlexItem>
            <span style={{ color: 'var(--pf-v5-global--Color--200)' }}>•</span>
          </FlexItem>
          <FlexItem>
            <span style={{ fontSize: '0.875rem' }}>
              You're viewing basic cluster health. 
              <LockIcon style={{ 
                fontSize: '0.75rem', 
                marginLeft: '0.5rem', 
                marginRight: '0.25rem',
                opacity: 0.7 
              }} />
              Login in the header to access detailed metrics, nodes, operators, and more.
            </span>
          </FlexItem>
        </Flex>
      </Banner>
    </motion.div>
  );
}
