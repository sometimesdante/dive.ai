import Footer from '@/ui/frontend/Footer'
import Header from '@/ui/frontend/Header'
import Smooth from '@/components/Smooth'

export default function FrontendLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <Header />
      <Smooth>
        <div className="default-margin">{children}</div>
      </Smooth>
      <Footer />
    </>
  )
}
