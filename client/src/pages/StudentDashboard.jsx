import { GraduationCap, QrCode, X } from 'lucide-react';
import { useState } from 'react';
import QRCode from 'qrcode';
import AlertMessage from '../components/AlertMessage';
import LoadingSpinner from '../components/LoadingSpinner';

function statusClass(status) {
  return status === 'active'
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
    : 'border-rose-500/30 bg-rose-500/10 text-rose-200';
}

export default function StudentDashboard({ credentials, loading, error, successMessage }) {
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrImage, setQrImage] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');

  async function handleOpenQrModal(verificationKey) {
    setQrModalOpen(true);
    setQrLoading(true);
    setQrError('');
    setQrImage('');

    try {
      const verificationUrl = `${window.location.origin}/verify/${verificationKey}`;
      const image = await QRCode.toDataURL(verificationUrl, {
        width: 320,
        margin: 1,
        errorCorrectionLevel: 'M',
      });

      setQrImage(image);
    } catch {
      setQrError('Unable to generate QR code. Please try again.');
    } finally {
      setQrLoading(false);
    }
  }

  function handleCloseQrModal() {
    setQrModalOpen(false);
    setQrImage('');
    setQrLoading(false);
    setQrError('');
  }

  return (
    <div className="space-y-6">
      <AlertMessage message={successMessage} type="success" />
      <AlertMessage message={error} />

      {loading ? <LoadingSpinner label="Loading credentials..." /> : null}

      {!loading && !credentials.length ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-[#F5E7C6]/75">
          No credentials available yet.
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {credentials.map((credential) => {
          const verificationKey = credential.verificationKey || credential.txHash || credential.tokenId;

          return (
            <article className="rounded-3xl border border-white/10 bg-white/5 p-6" key={credential.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="rounded-2xl bg-[#FA8112]/15 p-3 text-[#FA8112]">
                    <GraduationCap className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold text-white">{credential.degree}</h2>
                    <p className="text-sm text-[#F5E7C6]/75">{credential.major}</p>
                  </div>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusClass(credential.status)}`}>
                  {credential.status}
                </span>
              </div>

              <div className="mt-6 grid gap-3 text-sm text-[#F5E7C6]">
                <p><span className="text-[#FAF3E1]/60">Institution:</span> {credential.institutionName}</p>
                <p><span className="text-[#FAF3E1]/60">Graduation Date:</span> {credential.graduationDate}</p>
                <p><span className="text-[#FAF3E1]/60">Issued Date:</span> {new Date(credential.issuedAt).toLocaleDateString()}</p>
                <p className="font-mono text-xs break-all"><span className="font-sans text-[#FAF3E1]/60">verificationKey:</span> {verificationKey}</p>
                <p className="font-mono text-xs break-all"><span className="font-sans text-[#FAF3E1]/60">txHash:</span> {credential.txHash}</p>
                <p className="font-mono text-xs break-all"><span className="font-sans text-[#FAF3E1]/60">tokenId:</span> {credential.tokenId}</p>
              </div>

              <button className="secondary-btn mt-6 inline-flex items-center gap-2" onClick={() => handleOpenQrModal(verificationKey)} type="button">
                <QrCode className="h-4 w-4" />
                Show Verification QR
              </button>
            </article>
          );
        })}
      </div>

      {qrModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Credential QR Code</h3>
              <button className="rounded-full border border-white/15 p-2 text-[#F5E7C6]/85 transition hover:text-white" onClick={handleCloseQrModal} type="button" aria-label="Close QR code popup">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-2 text-sm text-[#F5E7C6]/75">Scan this QR code in the verifier camera popup.</p>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white p-4">
              {qrLoading ? <LoadingSpinner label="Generating QR code..." /> : null}
              {!qrLoading && qrError ? <AlertMessage message={qrError} /> : null}
              {!qrLoading && !qrError && qrImage ? (
                <img alt="Credential verification QR code" className="mx-auto h-72 w-72 max-w-full object-contain" src={qrImage} />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
