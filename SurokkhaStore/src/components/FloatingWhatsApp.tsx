import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { L } from '@/lib/i18n'

const WHATSAPP_URL = 'https://wa.me/8801600905774'

/** Chat shortcut, bottom-right. Desktop only — on mobile the bottom nav carries WhatsApp contact. */
export function FloatingWhatsApp() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={L('Chat with us on WhatsApp', 'হোয়াটসঅ্যাপে আমাদের সাথে কথা বলুন')}
      className="fixed right-6 bottom-6 z-40 hidden items-center gap-3 md:flex"
    >
      <span className="rounded bg-card px-3 py-1.5 text-sm shadow ring-1 ring-border">{L('Chat with us', 'আমাদের সাথে কথা বলুন')}</span>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105">
        <WhatsAppIcon className="h-7 w-7" />
      </span>
    </a>
  )
}
