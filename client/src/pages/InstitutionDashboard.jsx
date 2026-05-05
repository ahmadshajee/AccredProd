import { Award, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import AlertMessage from '../components/AlertMessage';
import LoadingSpinner from '../components/LoadingSpinner';

const initialInstitutionForm = { name: '', domain: '' };
const initialCredentialForm = {
  studentEmail: '',
  studentName: '',
  degree: '',
  major: '',
  graduationDate: '',
};

function truncateToken(token) {
  return `${token.slice(0, 12)}...${token.slice(-8)}`;
}

export default function InstitutionDashboard({
  institution,
  issuedCredentials,
  loading,
  error,
  successMessage,
  onRegisterInstitution,
  onIssueCredential,
  onRevoke,
}) {
  const [institutionForm, setInstitutionForm] = useState(initialInstitutionForm);
  const [credentialForm, setCredentialForm] = useState(initialCredentialForm);
  const [submittingInstitution, setSubmittingInstitution] = useState(false);
  const [submittingCredential, setSubmittingCredential] = useState(false);

  async function handleInstitutionSubmit(event) {
    event.preventDefault();
    setSubmittingInstitution(true);
    try {
      await onRegisterInstitution(institutionForm);
      setInstitutionForm(initialInstitutionForm);
    } catch {
      // Error is surfaced by the parent DashboardPage via error state
    } finally {
      setSubmittingInstitution(false);
    }
  }

  async function handleCredentialSubmit(event) {
    event.preventDefault();
    setSubmittingCredential(true);
    try {
      await onIssueCredential(credentialForm);
      setCredentialForm(initialCredentialForm);
    } catch {
      // Error is surfaced by the parent DashboardPage via error state
    } finally {
      setSubmittingCredential(false);
    }
  }

  return (
    <div className="space-y-6">
      <AlertMessage message={successMessage} type="success" />
      <AlertMessage message={error} />

      {!institution ? (
        <form className="rounded-3xl border border-white/10 bg-white/5 p-6" onSubmit={handleInstitutionSubmit}>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-[#FA8112]" />
            <div>
              <h2 className="text-xl font-semibold text-white">Register your institution</h2>
              <p className="text-sm text-[#F5E7C6]/75">Submit your institution for admin approval.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <input className="field" placeholder="Institution name" value={institutionForm.name} onChange={(event) => setInstitutionForm((current) => ({ ...current, name: event.target.value }))} />
            <input className="field" placeholder="Institution domain" value={institutionForm.domain} onChange={(event) => setInstitutionForm((current) => ({ ...current, domain: event.target.value }))} />
          </div>
          <button className="primary-btn mt-6" disabled={submittingInstitution} type="submit">
            {submittingInstitution ? 'Submitting...' : 'Submit Institution'}
          </button>
        </form>
      ) : null}

      {institution?.status === 'pending' ? (
        <div className="rounded-3xl border border-[#FA8112]/30 bg-[#FA8112]/10 px-5 py-4 text-sm text-[#FAF3E1]">
          Your institution is pending admin approval
        </div>
      ) : null}

      {institution?.status === 'rejected' ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          Your institution registration was rejected.
        </div>
      ) : null}

      {institution?.status === 'approved' ? (
        <form className="rounded-3xl border border-white/10 bg-white/5 p-6" onSubmit={handleCredentialSubmit}>
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-[#FA8112]" />
            <div>
              <h2 className="text-xl font-semibold text-white">Issue New Credential</h2>
              <p className="text-sm text-[#F5E7C6]/75">Create a simulated NFT-based credential for a student.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <input className="field" placeholder="Student email" type="email" value={credentialForm.studentEmail} onChange={(event) => setCredentialForm((current) => ({ ...current, studentEmail: event.target.value }))} />
            <input className="field" placeholder="Student name" value={credentialForm.studentName} onChange={(event) => setCredentialForm((current) => ({ ...current, studentName: event.target.value }))} />
            <input className="field" placeholder="Degree" value={credentialForm.degree} onChange={(event) => setCredentialForm((current) => ({ ...current, degree: event.target.value }))} />
            <input className="field" placeholder="Major" value={credentialForm.major} onChange={(event) => setCredentialForm((current) => ({ ...current, major: event.target.value }))} />
            <input className="field md:col-span-2" type="date" value={credentialForm.graduationDate} onChange={(event) => setCredentialForm((current) => ({ ...current, graduationDate: event.target.value }))} />
          </div>
          <button className="primary-btn mt-6" disabled={submittingCredential} type="submit">
            {submittingCredential ? 'Issuing...' : 'Issue Credential'}
          </button>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Issued Credentials</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#F5E7C6]">
            <thead className="bg-black/20 text-xs uppercase tracking-[0.2em] text-[#FAF3E1]/70">
              <tr>
                <th className="px-5 py-4">Student</th>
                <th className="px-5 py-4">Degree</th>
                <th className="px-5 py-4">Token ID</th>
                <th className="px-5 py-4">Issued At</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-5 py-8" colSpan="6">
                    <LoadingSpinner label="Loading issued credentials..." />
                  </td>
                </tr>
              ) : issuedCredentials.length ? (
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
                        onClick={() => onRevoke(credential.id)}
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
                    {institution?.status === 'approved' ? 'No credentials issued yet.' : 'No credentials available.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
