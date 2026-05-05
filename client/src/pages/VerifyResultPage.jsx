import { CheckCircle, ShieldCheck, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AlertMessage from '../components/AlertMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { verifyApi } from '../services/api';

function resolveLookupKeyFromParams(params) {
  const directToken = params.tokenId?.trim();
  if (directToken) {
    return directToken;
  }

  const wildcardToken = params['*']?.split('/').filter(Boolean).pop();
  return wildcardToken ? wildcardToken.trim() : '';
}

export default function VerifyResultPage() {
  const params = useParams();
  const lookupKey = resolveLookupKeyFromParams(params);
  const [credential, setCredential] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCredential() {
      setLoading(true);
      setError('');

      if (!lookupKey) {
        setCredential(null);
        setError('No credential found with this key');
        setLoading(false);
        return;
      }

      try {
        const data = await verifyApi.getByTokenId(lookupKey);
        setCredential(data.credential);
      } catch (err) {
        setCredential(null);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadCredential();
  }, [lookupKey]);

  const isActive = credential?.status === 'active';

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/25">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-[#FA8112]/15 p-3 text-[#FA8112]">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-[#FA8112]">Verification Result</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">AccredChain Credential Check</h1>
            </div>
          </div>
          {credential ? (
            <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${isActive ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'}`}>
              {isActive ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {isActive ? 'Credential Active' : 'Credential Revoked'}
            </span>
          ) : null}
        </div>

        {loading ? <LoadingSpinner label="Verifying credential..." /> : null}

        {!loading && error ? (
          <AlertMessage message={error === 'Credential not found' ? 'No credential found with this key' : error} />
        ) : null}

        {!loading && credential ? (
          <div className="mt-8 space-y-6">
            {!isActive ? (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-100">
                This credential has been revoked
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2 text-sm text-[#F5E7C6]">
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4"><span className="text-[#FAF3E1]/60">Student/Employee</span><p className="mt-2 text-white">{credential.studentName}</p></div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4"><span className="text-[#FAF3E1]/60">{credential.credentialType === 'employment' ? 'Position' : 'Degree'}</span><p className="mt-2 text-white">{credential.degree}</p></div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4"><span className="text-[#FAF3E1]/60">{credential.credentialType === 'employment' ? 'Department' : 'Major'}</span><p className="mt-2 text-white">{credential.major}</p></div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4"><span className="text-[#FAF3E1]/60">{credential.credentialType === 'employment' ? 'Employer' : 'Institution'}</span><p className="mt-2 text-white">{credential.institutionName}</p></div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4"><span className="text-[#FAF3E1]/60">{credential.credentialType === 'employment' ? 'Employment Date' : 'Graduation Date'}</span><p className="mt-2 text-white">{credential.graduationDate}</p></div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4"><span className="text-[#FAF3E1]/60">Issued Date</span><p className="mt-2 text-white">{new Date(credential.issuedAt).toLocaleDateString()}</p></div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-[#F5E7C6]">
              <p className="font-semibold text-white">Blockchain Proof</p>
              <p className="mt-4 break-all font-mono text-xs">verificationKey: {credential.verificationKey || credential.txHash || credential.tokenId}</p>
              <p className="mt-4 break-all font-mono text-xs">txHash: {credential.txHash}</p>
              <p className="mt-2 break-all font-mono text-xs">tokenId: {credential.tokenId}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
