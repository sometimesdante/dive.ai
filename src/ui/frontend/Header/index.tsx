import Link from 'next/link'

export default function Header() {
  return (
    //<div className="fixed top-0 left-0 right-0 z-50 w-full shadow-sm">
    <div className="default-margin flex items-center text-center justify-between py-4">
      <span className="w-1/3 hidden md:flex items-center gap-2">
        <Link href="/">
          <div className="bg-black p-2 w-2"></div>
        </Link>
      <Link href="/" className="emphasized-one">
        Dive.ai
      </Link>
      </span>
      <span className="w-1/3 flex justify-end gap-2">
        <Link href="/auth/login" className="hidden md:block">
          Login
        </Link><Link href="/auth/signup" className="hidden md:block">
          Sign up
        </Link>
      </span>
    </div>
    //</div>
  )
}
