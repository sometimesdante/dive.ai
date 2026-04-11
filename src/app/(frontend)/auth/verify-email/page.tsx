import Link from "next/link";
import { Mail } from "lucide-react";

const EMAIL_CLIENTS = [
  {
    name: "Gmail",
    url: "https://mail.google.com",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <path d="M2 6l10 7 10-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    name: "Outlook",
    url: "https://outlook.live.com",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <path d="M2 6l10 7 10-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    name: "Apple Mail",
    url: "https://www.icloud.com/mail",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <path d="M2 6l10 7 10-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    name: "Proton Mail",
    url: "https://mail.proton.me",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <path d="M2 6l10 7 10-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    name: "Yahoo Mail",
    url: "https://mail.yahoo.com",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <path d="M2 6l10 7 10-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className="default-height flex items-center justify-center py-12">
      <div className="bg-[#f2f2f2] border border-[#e8e8e8] flex flex-col gap-6 p-6 w-[420px]">
        <div className="flex flex-col gap-2">
          <div className="w-10 h-10 bg-[#242424] flex items-center justify-center text-white">
            <Mail size={18} />
          </div>
          <h2>Check your email.</h2>
          <p className="text-[#666]">
            We sent a confirmation link to{" "}
            {email ? (
              <span className="text-[#242424] font-medium">{email}</span>
            ) : (
              "your email address"
            )}
            . Click it to activate your account.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-[#999]">Open your inbox</p>
          <div className="flex flex-col gap-1">
            {EMAIL_CLIENTS.map((client) => (
              <a
                key={client.name}
                href={client.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 bg-white border border-[#e8e8e8] hover:border-[#242424] transition-colors"
              >
                <span className="text-[#666]">{client.icon}</span>
                <span className="text-sm">{client.name}</span>
              </a>
            ))}
          </div>
        </div>

        <p className="text-sm text-[#999]">
          Wrong email?{" "}
          <Link href="/auth/signup" className="underline text-[#242424]">
            Sign up again
          </Link>{" "}
          or{" "}
          <Link href="/auth/login" className="underline text-[#242424]">
            log in
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
