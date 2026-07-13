'use client';

import React from 'react';
import CustomerPortalClient from './CustomerPortalClient';

function ProfileSettingsClient() {
  return <CustomerPortalClient initialTab="profile" />;
}

export default React.memo(ProfileSettingsClient);
