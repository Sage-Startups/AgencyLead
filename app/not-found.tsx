import Link from 'next/link'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Nav />
      <main className="flex-1 flex items-center justify-center px-4 py-20 text-center">
        <div className="max-w-md">
          <p className="text-blue-500 text-sm font-bold tracking-widest mb-3">404</p>
          <h1 className="text-3xl font-bold text-white mb-3">Page not found</h1>
          <p className="text-slate-400 mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has moved.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/"><Button size="lg">Back to Home</Button></Link>
            <Link href="/demo"><Button size="lg" variant="secondary">Try the Demo</Button></Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
