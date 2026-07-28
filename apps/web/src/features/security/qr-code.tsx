'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Renders client-side only (qrcode never sends the otpauth URI - which
 * embeds the raw TOTP secret - anywhere over the network, unlike a
 * third-party "QR code API" would).
 */
export function QrCode({ value, size = 220 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, { width: size, margin: 1 }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!dataUrl) {
    return <Skeleton style={{ width: size, height: size }} />;
  }

  return <img src={dataUrl} width={size} height={size} alt="Scan this QR code with your authenticator app" />;
}
