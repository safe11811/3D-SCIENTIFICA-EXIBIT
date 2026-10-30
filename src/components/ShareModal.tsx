import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, QrCode, Wifi, MapPin } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** When set, the QR deep-links straight to this room. */
  exhibitTitle?: string | null;
}

export default function ShareModal({ isOpen, onClose, exhibitTitle = null }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const shareUrl = (() => {
    if (typeof window === 'undefined') return 'https://scientifica2026.nps.edu';
    // App.tsx mirrors the active room into the hash, so the current URL is
    // already the deep link for what the visitor is looking at.
    return window.location.href;
  })();

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, shareUrl, {
      margin: 1,
      width: 176,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'M'
    }).catch(() => {
      // QR rendering failed — the copy-link fallback below still works
    });
  }, [isOpen, shareUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={exhibitTitle ? `Share ${exhibitTitle}` : 'Share the exhibition guide'}
        className="w-full max-w-md bg-[#F8F9FB] rounded-3xl border border-slate-300/90 shadow-2xl p-6 relative flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in-[0.96] duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-neutral-950 hover:bg-slate-200/70 rounded-xl transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-neutral-950 border border-neutral-900 flex items-center justify-center text-white shadow-xs">
          <QrCode className="w-6 h-6" />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-neutral-950 font-sans tracking-tight">
            {exhibitTitle ? 'Share this room' : 'Scan at entrance & share'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {exhibitTitle ? (
              <>
                The link opens the guide straight at{' '}
                <span className="font-bold text-slate-700">{exhibitTitle}</span>.
              </>
            ) : (
              'Scientifica Annual Science Exhibition 2026'
            )}
          </p>
        </div>

        {/* Scannable QR of the current deep link */}
        <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
          <canvas ref={canvasRef} width={176} height={176} aria-label="QR code linking to this exhibit" />
        </div>

        {/* Campus Info badges */}
        <div className="w-full grid grid-cols-2 gap-2.5 text-left text-xs">
          <div className="p-3 rounded-xl bg-[#F4F6F9] border border-slate-200/90 flex items-center gap-2.5">
            <Wifi className="w-4 h-4 text-neutral-800 shrink-0" />
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Guest Wi-Fi</div>
              <div className="text-slate-900 font-bold">NPS-Guest</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F4F6F9] border border-slate-200/90 flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-neutral-800 shrink-0" />
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Location</div>
              <div className="text-slate-900 font-bold truncate">Yeshwanthpur</div>
            </div>
          </div>
        </div>

        {/* Copy Link Button */}
        <button
          onClick={handleCopy}
          className="w-full min-h-[48px] flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-sm transition-all shadow-md active:scale-[0.97]"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Link copied to clipboard' : 'Copy link'}</span>
        </button>
      </div>
    </div>
  );
}
