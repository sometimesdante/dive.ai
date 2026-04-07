import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-4 text-center">
      <img
        src="/illustrations/404.png"
        alt="Page not found"
        className="w-full max-w-sm h-auto"
      />
      <div className="flex flex-col items-center gap-3">
        <h1 className="m-0">Page not found</h1>
        <p className="text-[#838383] text-lg max-w-sm">
          Looks like you&apos;ve dived too deep. This page doesn&apos;t exist.
        </p>
      </div>
      <Link
        href="/"
        className="bg-[#063530] text-white px-6 py-2.5 rounded no-underline hover:bg-[#0a4f47] transition-colors"
      >
        Back to surface
      </Link>
    </div>
  )
}
