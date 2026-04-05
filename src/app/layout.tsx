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
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.GA_MEASUREMENT_ID}`}
        ></Script>
        <Script
          strategy="afterInteractive"
          id="ga-tag"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', '${process.env.GA_MEASUREMENT_ID}');
              `,
          }}
        />
          <div>{children}</div>
      </body>
    </html>
  )
}
