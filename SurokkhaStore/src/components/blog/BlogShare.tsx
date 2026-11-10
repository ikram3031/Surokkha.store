import { useEffect, useState, type ReactNode } from 'react'
import { Check, Link2, Share2 } from 'lucide-react'

type Svg = { className?: string }
const Icon = ({ className, children }: Svg & { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    {children}
  </svg>
)
const FacebookIcon = (p: Svg) => (
  <Icon {...p}>
    <path d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.6 1.6-1.6h1.7V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.2h2.8V22h3.4Z" />
  </Icon>
)
const MessengerIcon = (p: Svg) => (
  <Icon {...p}>
    <path d="M12 2C6.4 2 2 6.1 2 11.6c0 2.9 1.2 5.4 3.1 7.1v3.3l3-1.7c.9.3 1.9.4 2.9.4 5.6 0 10-4.1 10-9.6S17.6 2 12 2Zm1 12.9-2.5-2.7-5 2.7 5.5-5.8 2.6 2.7 4.9-2.7-5.5 5.8Z" />
  </Icon>
)
const WhatsAppIcon = (p: Svg) => (
  <Icon {...p}>
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s1 2.6 1.1 2.7c.1.2 1.9 2.9 4.6 4 1.7.7 2.4.8 3.2.6.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.5-.3Z" />
  </Icon>
)
const XIcon = (p: Svg) => (
  <Icon {...p}>
    <path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.3L5.3 21H2.2l7.2-8.3L2 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" />
  </Icon>
)
const LinkedInIcon = (p: Svg) => (
  <Icon {...p}>
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4V21H3V9.75Zm6.5 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4V9.75Z" />
  </Icon>
)

const btn =
  'grid h-10 w-10 place-items-center rounded-full border border-border bg-card transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40'

/** Share links for one blog post: social networks, copy link, and the phone's share sheet (covers Instagram, which has no web share URL). */
export function BlogShare({ title, url, className = '' }: { title: string; url: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
    setIsMobile(window.matchMedia('(pointer:coarse)').matches)
  }, [])

  const u = encodeURIComponent(url)
  const text = encodeURIComponent(title)
  const links: { label: string; href: string; icon: ReactNode; mobileOnly?: boolean }[] = [
    { label: 'Facebook-এ শেয়ার', href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, icon: <FacebookIcon className="h-5 w-5" /> },
    { label: 'Messenger-এ পাঠান', href: `fb-messenger://share/?link=${u}`, icon: <MessengerIcon className="h-5 w-5" />, mobileOnly: true },
    { label: 'WhatsApp-এ শেয়ার', href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`, icon: <WhatsAppIcon className="h-5 w-5" /> },
    { label: 'X-এ শেয়ার', href: `https://twitter.com/intent/tweet?text=${text}&url=${u}`, icon: <XIcon className="h-[18px] w-[18px]" /> },
    { label: 'LinkedIn-এ শেয়ার', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, icon: <LinkedInIcon className="h-[18px] w-[18px]" /> },
  ]

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked */
    }
  }

  const nativeShare = async () => {
    try {
      await navigator.share({ title, url })
    } catch {
      /* the reader cancelled the share sheet */
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} role="group" aria-label="শেয়ার করুন">
      {links
        .filter((l) => !l.mobileOnly || isMobile)
        .map((l) => (
          <a key={l.label} className={btn} aria-label={l.label} title={l.label} target="_blank" rel="noopener noreferrer" href={l.href}>
            {l.icon}
          </a>
        ))}
      <button type="button" className={btn} aria-label={copied ? 'কপি হয়েছে' : 'লিংক কপি করুন'} title="লিংক কপি করুন" onClick={copyLink}>
        {copied ? <Check className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
      </button>
      {canNativeShare && (
        <button type="button" className={btn} aria-label="অন্য অ্যাপে শেয়ার (Instagram সহ)" title="অন্য অ্যাপে শেয়ার (Instagram সহ)" onClick={nativeShare}>
          <Share2 className="h-5 w-5" />
        </button>
      )}
      {copied && (
        <span className="text-sm text-muted-foreground" role="status">
          লিংক কপি হয়েছে
        </span>
      )}
    </div>
  )
}
