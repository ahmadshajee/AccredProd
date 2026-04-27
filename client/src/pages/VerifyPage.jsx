import { Camera, Search, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AlertMessage from '../components/AlertMessage';

const SCANNER_REGION_ID = 'verify-qr-reader';

function normalizeTokenInput(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  if (trimmed.includes('/verify/')) {
    const parts = trimmed.split('/verify/');
    return parts[parts.length - 1].split(/[?#]/)[0].trim().replace(/\s+/g, '');
  }

  return trimmed.replace(/\s+/g, '');
}

export default function VerifyPage() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const [lookupKey, setLookupKey] = useState('');
  const [error, setError] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [startingScanner, setStartingScanner] = useState(false);

  async function stopScanner() {
    const scanner = scannerRef.current;
    if (!scanner) {
      return;
    }

    try {
      await scanner.stop();
    } catch {
      // Ignore stop errors when scanner was not started.
    }

    try {
      await scanner.clear();
    } catch {
      // Ignore clear errors from partially initialized scanner.
    }

    scannerRef.current = null;
  }

  useEffect(
    () => () => {
      void stopScanner();
    },
    []
  );

  useEffect(() => {
    if (!scannerOpen) {
      return undefined;
    }

    let active = true;

    async function startScanner() {
      setStartingScanner(true);
      setScannerError('');

      const scanner = new Html5Qrcode(SCANNER_REGION_ID);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            const normalizedToken = normalizeTokenInput(decodedText);

            if (!normalizedToken) {
              return;
            }

            setLookupKey(normalizedToken);
            setScannerOpen(false);
            void stopScanner();
            navigate(`/verify/${normalizedToken}`);
          },
          () => {}
        );
      } catch {
        if (active) {
          setScannerError('Unable to access camera. Please allow camera permissions and try again.');
        }
      } finally {
        if (active) {
          setStartingScanner(false);
        }
      }
    }

    startScanner();

    return () => {
      active = false;
      void stopScanner();
    };
  }, [scannerOpen, navigate]);

  function handleSubmit(event) {
    event.preventDefault();
    const normalizedToken = normalizeTokenInput(lookupKey);

    if (!normalizedToken) {
      setError('Enter a verification key or paste a verification link.');
      return;
    }

    setError('');
    navigate(`/verify/${normalizedToken}`);
  }

  function handleOpenScanner() {
    setScannerError('');
    setScannerOpen(true);
  }

  function handleCloseScanner() {
    setScannerOpen(false);
    setScannerError('');
    void stopScanner();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/25">
        <p className="text-sm uppercase tracking-[0.35em] text-[#FA8112]">Public Verification</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Verify a Credential</h1>
        <p className="mt-4 text-[#F5E7C6]/75">
          Enter a credential verification key to validate its academic record.
        </p>
        <form className="mt-8 flex flex-col gap-4 sm:flex-row" onSubmit={handleSubmit}>
          <input
            className="field flex-1"
            onChange={(event) => setLookupKey(event.target.value)}
            placeholder="Enter Verification Key"
            value={lookupKey}
          />
          <button className="primary-btn inline-flex items-center justify-center gap-2" type="submit">
            <Search className="h-4 w-4" />
            Verify
          </button>
          <button className="secondary-btn inline-flex items-center justify-center gap-2" onClick={handleOpenScanner} type="button">
            <Camera className="h-4 w-4" />
            Scan QR
          </button>
        </form>
        <div className="mt-4 text-left">
          <AlertMessage message={error} />
        </div>
      </div>

      {scannerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Scan Verification QR</h2>
              <button className="rounded-full border border-white/15 p-2 text-[#F5E7C6]/85 transition hover:text-white" onClick={handleCloseScanner} type="button" aria-label="Close scanner popup">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-2 text-sm text-[#F5E7C6]/75">Point your camera at the QR code.</p>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-2">
              <div className="min-h-[300px]" id={SCANNER_REGION_ID} />
            </div>

            {startingScanner ? <p className="mt-3 text-sm text-[#F5E7C6]/70">Starting camera...</p> : null}

            <div className="mt-3 text-left">
              <AlertMessage message={scannerError} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
