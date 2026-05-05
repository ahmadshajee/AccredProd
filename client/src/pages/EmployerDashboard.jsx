import { useState, useEffect } from 'react';
import { Search, Save, Trash2, CheckCircle, XCircle, Award } from 'lucide-react';
import { employerApi, verifyApi } from '../services/api';
import AlertMessage from '../components/AlertMessage';
import LoadingSpinner from '../components/LoadingSpinner';

export default function EmployerDashboard({ token, user }) {
  const [history, setHistory] = useState([]);
  const [issuedCredentials, setIssuedCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verifyTokenId, setVerifyTokenId] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [submittingCredential, setSubmittingCredential] = useState(false);
  const [issueForm, setIssueForm] = useState({
    studentEmail: '',
    studentName: '',
    position: '',
    department: '',
    employmentDate: '',
  });

  useEffect(() => {
    loadHistory();
    loadIssuedCredentials();
  }, [token]);

  async function loadIssuedCredentials() {
    try {
      const data = await employerApi.getIssuedCredentials(token);
      setIssuedCredentials(data.credentials || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadHistory() {
    try {
      setLoading(true);
      const data = await employerApi.getHistory(token);
      setHistory(data.history || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    if (!verifyTokenId) return;

    setVerifyLoading(true);
    setVerifyResult(null);
    setError('');
    setSuccess('');

    try {
      const data = await verifyApi.getByTokenId(verifyTokenId);
      setVerifyResult(data);
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleSaveVerification() {
    if (!verifyResult || !verifyResult.credential) return;

    try {
      await employerApi.saveVerification(verifyResult.credential.tokenId, token);
      setSuccess('Verification saved to history');
      await loadHistory();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemoveVerification(tokenId) {
    try {
      await employerApi.removeVerification(tokenId, token);
      setSuccess('Verification removed from history');
      await loadHistory();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleIssueSubmit(e) {
    e.preventDefault();
    setSubmittingCredential(true);
    setError('');
    setSuccess('');
    try {
      await employerApi.issueCredential(issueForm, token);
      setSuccess('Employment credential issued successfully.');
      setIssueForm({ studentEmail: '', studentName: '', position: '', department: '', employmentDate: '' });
      await loadIssuedCredentials();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingCredential(false);
    }
  }

  async function handleRevoke(id) {
    setError('');
    setSuccess('');
    try {
      await employerApi.revokeCredential(id, token);
      setSuccess('Credential revoked successfully.');
      await loadIssuedCredentials();
    } catch (err) {
      setError(err.message);
    }
  }

  function truncateToken(t) {
    return `${t.slice(0, 12)}...${t.slice(-8)}`;
  }

  return (
    <div className="space-y-8">
      <AlertMessage message={success} type="success" />
      <AlertMessage message={error} />

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-xl font-semibold text-white">Verify a Credential</h2>
        <form onSubmit={handleVerify} className="flex gap-4">
          <input
            className="field flex-1"
            placeholder="Enter Token ID or Verification Key..."
            value={verifyTokenId}
            onChange={(e) => setVerifyTokenId(e.target.value)}
          />
          <button type="submit" disabled={verifyLoading} className="primary-btn flex items-center gap-2">
            <Search className="h-4 w-4" />
            {verifyLoading ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        {verifyResult && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {verifyResult.isValid ? (
                  <CheckCircle className="h-8 w-8 text-emerald-400" />
                ) : (
                  <XCircle className="h-8 w-8 text-rose-400" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {verifyResult.isValid ? 'Valid Credential' : 'Invalid/Revoked Credential'}
                  </h3>
                  <p className="text-sm text-[#F5E7C6]/75">{verifyResult.message}</p>
                </div>
              </div>
              <button onClick={handleSaveVerification} className="secondary-btn flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save to History
              </button>
            </div>

            {verifyResult.credential && (
              <div className="mt-4 grid gap-2 text-sm text-[#F5E7C6]">
                <p><span className="text-[#FAF3E1]/60">Student/Employee:</span> {verifyResult.credential.studentName}</p>
                <p><span className="text-[#FAF3E1]/60">{verifyResult.credential.credentialType === 'employment' ? 'Position' : 'Degree'}:</span> {verifyResult.credential.degree}</p>
                <p><span className="text-[#FAF3E1]/60">{verifyResult.credential.credentialType === 'employment' ? 'Department' : 'Major'}:</span> {verifyResult.credential.major}</p>
                <p><span className="text-[#FAF3E1]/60">{verifyResult.credential.credentialType === 'employment' ? 'Employer' : 'Institution'}:</span> {verifyResult.credential.institutionName}</p>
              </div>
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-white">Verification History</h2>
        {loading ? (
          <LoadingSpinner label="Loading history..." />
        ) : history.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-[#F5E7C6]/75">
            No verifications saved in history.
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {history.map((credential) => (
              <article className="rounded-3xl border border-white/10 bg-white/5 p-6" key={credential.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{credential.degree}</h3>
                    <p className="text-sm text-[#F5E7C6]/75">{credential.major}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveVerification(credential.tokenId)}
                    className="rounded-full bg-rose-500/10 p-2 text-rose-400 transition hover:bg-rose-500/20"
                    title="Remove from history"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-[#F5E7C6]">
                  <p><span className="text-[#FAF3E1]/60">Student:</span> {credential.studentName}</p>
                  <p><span className="text-[#FAF3E1]/60">Institution:</span> {credential.institutionName}</p>
                  <p className="font-mono text-xs break-all mt-2">
                    <span className="font-sans text-[#FAF3E1]/60">Token ID:</span> {credential.tokenId}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        {user?.employerStatus === 'pending' ? (
          <div className="rounded-3xl border border-[#FA8112]/30 bg-[#FA8112]/10 px-5 py-4 text-sm text-[#FAF3E1]">
            Your employer account is pending admin approval. You cannot issue credentials yet.
          </div>
        ) : user?.employerStatus === 'rejected' ? (
          <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
            Your employer account was rejected.
          </div>
        ) : user?.employerStatus === 'approved' ? (
          <form className="rounded-3xl border border-white/10 bg-white/5 p-6" onSubmit={handleIssueSubmit}>
            <div className="flex items-center gap-3">
              <Award className="h-6 w-6 text-[#FA8112]" />
              <div>
                <h2 className="text-xl font-semibold text-white">Issue Employment Credential</h2>
                <p className="text-sm text-[#F5E7C6]/75">Create a credential for an employee's role/position.</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input className="field" required placeholder="Employee email" type="email" value={issueForm.studentEmail} onChange={(event) => setIssueForm((current) => ({ ...current, studentEmail: event.target.value }))} />
              <input className="field" required placeholder="Employee name" value={issueForm.studentName} onChange={(event) => setIssueForm((current) => ({ ...current, studentName: event.target.value }))} />
              <input className="field" required placeholder="Position/Role" value={issueForm.position} onChange={(event) => setIssueForm((current) => ({ ...current, position: event.target.value }))} />
              <input className="field" required placeholder="Department" value={issueForm.department} onChange={(event) => setIssueForm((current) => ({ ...current, department: event.target.value }))} />
              <input className="field md:col-span-2" required type="date" value={issueForm.employmentDate} onChange={(event) => setIssueForm((current) => ({ ...current, employmentDate: event.target.value }))} />
            </div>
            <button className="primary-btn mt-6" disabled={submittingCredential} type="submit">
              {submittingCredential ? 'Issuing...' : 'Issue Credential'}
            </button>
          </form>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Issued Credentials</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#F5E7C6]">
            <thead className="bg-black/20 text-xs uppercase tracking-[0.2em] text-[#FAF3E1]/70">
              <tr>
                <th className="px-5 py-4">Employee</th>
                <th className="px-5 py-4">Position</th>
                <th className="px-5 py-4">Token ID</th>
                <th className="px-5 py-4">Issued At</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {issuedCredentials.length > 0 ? (
                issuedCredentials.map((credential) => (
                  <tr className="border-t border-white/10" key={credential.id}>
                    <td className="px-5 py-4 text-white">{credential.studentName}</td>
                    <td className="px-5 py-4">{credential.degree}</td>
                    <td className="px-5 py-4 font-mono text-xs">{truncateToken(credential.tokenId)}</td>
                    <td className="px-5 py-4">{new Date(credential.issuedAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4 capitalize">{credential.status}</td>
                    <td className="px-5 py-4">
                      <button
                        className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={credential.status === 'revoked'}
                        onClick={() => handleRevoke(credential.id)}
                        type="button"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-8 text-center text-[#F5E7C6]/70" colSpan="6">
                    No credentials issued yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
