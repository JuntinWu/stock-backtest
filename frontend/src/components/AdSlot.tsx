import { useEffect, useRef } from 'react'

type AdSlotProps = {
  slot: string
  format?: string
  layout?: string
  responsive?: boolean
  className?: string
}

declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

const ADSENSE_CLIENT = 'ca-pub-8070042586762523'

export default function AdSlot({
  slot,
  format = 'auto',
  layout,
  responsive = true,
  className = '',
}: AdSlotProps) {
  const pushed = useRef(false)

  useEffect(() => {
    if (pushed.current) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      pushed.current = true
    } catch (e) {
      // AdSense script not loaded yet or blocked
    }
  }, [])

  return (
    <div className={`ad-slot ${className}`}>
      <div className="ad-label">廣告 Advertisement</div>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-ad-layout={layout}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  )
}
