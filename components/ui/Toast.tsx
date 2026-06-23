'use client'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'

type ToastType = 'success' | 'error' | 'info'
interface Toast { id: string; message: string; type: ToastType }

let addToastFn: ((message: string, type?: ToastType) => void) | null = null

export function toast(message: string, type: ToastType = 'success') {
  addToastFn?.(message, type)
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    addToastFn = (message, type = 'success') => {
      const id = Math.random().toString(36).slice(2)
      setToasts(prev => [...prev, { id, message, type }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
    }
    return () => { addToastFn = null }
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={cn(
          'px-4 py-3 rounded-lg shadow-xl text-sm font-medium border max-w-sm',
          t.type === 'success' && 'bg-green-900/90 border-green-700 text-green-300',
          t.type === 'error' && 'bg-red-900/90 border-red-700 text-red-300',
          t.type === 'info' && 'bg-blue-900/90 border-blue-700 text-blue-300',
        )}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
