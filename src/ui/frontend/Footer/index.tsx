import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <div className="default-margin flex flex-col mb-2">
      <hr className="w-full" />
      <div className="w-full flex justify-between items-center mt-2">
        <Link href="/" className="emphasized-two">
          Made with ❤️ in SF © 2025
        </Link>
        <span className="flex justify-end items-center gap-2">
          <Link href="https://www.linkedin.com/in/sometimesdante/" target="_blank">
            <Image
              width="24"
              height="24"
              src="https://img.icons8.com/ios-glyphs/60/linkedin.png"
              alt="linkedin"
            />
          </Link>
          <Link href="https://github.com/sometimesdante" target="_blank">
            <Image
              width="24"
              height="24"
              src="https://img.icons8.com/ios-glyphs/30/github.png"
              alt="github"
            />
          </Link>
          <Link href="https://www.instagram.com/sometimesdante/" target="_blank">
            <Image
              width="24"
              height="24"
              src="https://img.icons8.com/ios-filled/50/instagram-new--v1.png"
              alt="instagram-new--v1"
            />
          </Link>
        </span>
      </div>
    </div>
  )
}
