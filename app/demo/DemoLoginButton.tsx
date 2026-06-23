'use client'
import { Button } from '@/components/ui/Button'

export function DemoLoginButton() {
  return (
    <form action="/api/auth/login" method="POST" className="flex flex-col gap-3">
      <input type="hidden" name="email" value="demo@agencyleadradar.com" />
      <input type="hidden" name="password" value="demo123" />
      <Button type="submit" size="lg" className="w-full">Launch Demo Dashboard →</Button>
    </form>
  )
}
