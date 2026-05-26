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
          <div className="clinic-center-page__brand">
            <DentistaWebpLockup placement="header" context="clinic" />
          </div>
          <ClinicCenterPicker autoSingle={autoSingle} />
          <p className="clinic-center-page__foot text-sm text-slate-500 m-0">
            Tras elegir centro, continúas en el panel de clínica.
          </p>
        </div>
      </main>
    </RoleGate>
  );
}
