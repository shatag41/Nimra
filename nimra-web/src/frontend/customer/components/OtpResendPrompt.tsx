'use client';

type Props = { seconds: number; isLoading?: boolean; disabled?: boolean; onResend: () => void };

/** The registration OTP resend treatment, shared by every OTP recovery flow. */
export default function OtpResendPrompt({ seconds, isLoading = false, disabled = false, onResend }: Props) {
  return <>
    <p className="registration-resend-prompt">
      <span>Didn&apos;t receive the code?</span>
      <button type="button" className="registration-resend" onClick={onResend} disabled={seconds > 0 || isLoading || disabled}>
        {isLoading ? 'Sending...' : seconds > 0 ? `Resend OTP in ${seconds}s` : 'Resend OTP'}
      </button>
    </p>
    <style jsx>{`
      .registration-resend-prompt { display:flex; align-items:center; justify-content:center; flex-wrap:nowrap; gap:.28rem; width:100%; margin:0; color:var(--text-secondary); font-size:.8rem; line-height:1.35; white-space:nowrap; }
      .registration-resend { appearance:none!important; -webkit-appearance:none!important; display:inline!important; width:auto!important; min-width:0!important; min-height:0!important; height:auto!important; margin:0!important; padding:0!important; color:var(--primary-color)!important; background:transparent!important; background-image:none!important; border:0!important; border-radius:0!important; box-shadow:none!important; font:inherit!important; font-size:.8rem!important; font-weight:700!important; line-height:1.35!important; text-decoration:none!important; cursor:pointer; white-space:nowrap; }
      .registration-resend:hover:not(:disabled), .registration-resend:focus-visible { color:var(--primary-color)!important; background:transparent!important; box-shadow:none!important; text-decoration:underline!important; outline:none; }
      .registration-resend:disabled { color:var(--text-muted)!important; background:transparent!important; box-shadow:none!important; opacity:1!important; cursor:not-allowed; }
    `}</style>
  </>;
}
