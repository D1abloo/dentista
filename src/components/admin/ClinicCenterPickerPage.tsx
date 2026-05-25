import { useEffect, useState } from 'react';
import { ClinicCenterPicker } from './ClinicCenterPicker';
import { RoleGate } from '@/components/auth/RoleGate';
import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo';

export function ClinicCenterPickerPage() {
  const [autoSingle, setAutoSingle] = useState(false);

  useEffect(() => {
    setAutoSingle(new URLSearchParams(window.location.search).get('auto') === '1');
  }, []);

  return (
    <RoleGate role="admin">
      <main className="clinic-center-page">
        <div className="clinic-center-page__shell">
          <a href="/" className="clinic-center-page__brand">
            <DentistaWebpLockup placement="header" context="clinic" />
          </a>
          <ClinicCenterPicker autoSingle={autoSingle} />
          <p className="clinic-center-page__foot">
            <a href="/">← Volver al inicio</a>
          </p>
        </div>
      </main>
    </RoleGate>
  );
}
