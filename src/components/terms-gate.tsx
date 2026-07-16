'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

const TERMS_VERSION = '2026-07-16';

export default function TermsGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    let active = true;

    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Not logged in yet -> let the auth flow handle it.
      if (!user) {
        if (active) {
          setChecking(false);
          setAccepted(true);
        }
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('terms_accepted_version')
        .eq('id', user.id)
        .single();

      const hasAccepted = profile?.terms_accepted_version === TERMS_VERSION;

      if (active) {
        setAccepted(hasAccepted);
        setChecking(false);
      }
    }

    check();
    return () => {
      active = false;
    };
  }, []);

  async function acceptTerms() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ terms_accepted_version: TERMS_VERSION })
      .eq('id', user.id);

    if (!error) {
      setAccepted(true);
    }
  }

  if (checking) {
    return (
      <div className="terms-gate-loading">
        <p>Loading…</p>
      </div>
    );
  }

  if (accepted) {
    return <>{children}</>;
  }

  return (
    <div className="terms-gate">
      <div className="terms-gate-card">
        <h2>Updated Terms & Privacy</h2>
        <p>
          Before joining Plenux, please review our updated{' '}
          <a href="/terms" target="_blank" rel="noreferrer">
            Terms of Use & Privacy Policy
          </a>
          .
        </p>
        <button className="terms-accept-btn" onClick={acceptTerms}>
          I Accept & Continue
        </button>
        <a className="terms-review-link" href="/terms" target="_blank" rel="noreferrer">
          Read the full update
        </a>
      </div>
    </div>
  );
}
