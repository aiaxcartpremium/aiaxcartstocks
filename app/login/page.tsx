'use client';

import { useFormStatus } from 'react-dom';
import { loginAsAdmin, loginAsOwner } from './actions';

function SubmitBtn({ children }: { children: React.ReactNode }) {
  // @ts-expect-error: using experimental hook for simple pending state
  const { pending } = useFormStatus?.() ?? { pending: false };
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded border px-4 py-2 text-base font-medium hover:bg-neutral-100 disabled:opacity-60"
    >
      {pending ? 'Signing in…' : children}
    </button>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-sm border rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Choose Login</h1>

        <form action={loginAsAdmin} className="mb-3">
          <SubmitBtn>Login as Admin</SubmitBtn>
        </form>

        <form action={loginAsOwner}>
          <SubmitBtn>Login as Owner</SubmitBtn>
        </form>

        {/* No tips / no supabase CLI text */}
      </div>
    </div>
  );
}