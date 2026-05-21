import { useState } from 'react';
import type { PortalChoiceId, PortalChoiceOption } from '@/lib/auth/portalChoices';
import { loginUnified, loginWithPortalChoice } from '@/lib/session';

export function useLoginWithPortalChoice(forcedRole?: 'admin' | 'patient') {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState<PortalChoiceId | null>(null);
  const [portalChoice, setPortalChoice] = useState<{
    email: string;
    options: PortalChoiceOption[];
  } | null>(null);

  async function submitCredentials(nextEmail: string, nextPassword: string) {
    setLoading(true);
    setError(null);
    const result = await loginUnified(nextEmail, nextPassword, forcedRole);
    setLoading(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    if ('choosePortal' in result && result.choosePortal) {
      setEmail(nextEmail);
      setPassword(nextPassword);
      setPortalChoice({ email: result.email, options: result.options });
      return;
    }
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    await submitCredentials(email.trim(), password);
  }

  async function pickPortal(portal: PortalChoiceId) {
    if (!email || !password) return;
    setPortalLoading(portal);
    setError(null);
    const result = await loginWithPortalChoice(email.trim(), password, portal, forcedRole);
    setPortalLoading(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    if ('choosePortal' in result && result.choosePortal) return;
  }

  function resetChoice() {
    setPortalChoice(null);
    setError(null);
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    portalLoading,
    portalChoice,
    submitForm,
    pickPortal,
    resetChoice
  };
}
