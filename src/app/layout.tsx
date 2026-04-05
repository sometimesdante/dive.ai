import '@/styles/globals.scss'
import type { Metadata } from 'next'

import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Dive.ai',
  description: "Your favorite opinionated WorkspaceOS",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <Script
          async
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-H2Y4EMH8TB"
        ></Script>
        <Script
          strategy="afterInteractive"
          id="ga-tag"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              
              gtag('config', 'G-H2Y4EMH8TB');
              `,
          }}
        />
          <div>{children}</div>
      </body>
    </html>
  )
}
