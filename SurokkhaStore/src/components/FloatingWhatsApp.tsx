import { MessageCircle } from 'lucide-react'

const WHATSAPP_URL = 'https://wa.me/8801600905774'

/** Always-visible chat shortcut, bottom-right. */
export function FloatingWhatsApp() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-4 z-40 flex items-center gap-3 sm:bottom-6 sm:right-6"
    >
      <span className="hidden rounded bg-card px-3 py-1.5 text-sm shadow ring-1 ring-border sm:inline">Chat with us</span>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success text-success-foreground shadow-lg transition-transform hover:scale-105">
        <MessageCircle className="h-6 w-6" />
      </span>
    </a>
  )
}
