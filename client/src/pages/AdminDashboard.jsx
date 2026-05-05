import { Building2, CheckCircle, Clock3, XCircle } from 'lucide-react';
import { useMemo } from 'react';
import AlertMessage from '../components/AlertMessage';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AdminDashboard({ institutions = [], employers = [], loading, error, successMessage, onApprove, onReject, onApproveEmployer, onRejectEmployer }) {
  const stats = useMemo(() => {
    const total = institutions.length + employers.length;
    const pending = institutions.filter((item) => item.status === 'pending').length + employers.filter((item) => item.employerStatus === 'pending').length;
    const approved = institutions.filter((item) => item.status === 'approved').length + employers.filter((item) => item.employerStatus === 'approved').length;
    return { total, pending, approved };
  }, [institutions, employers]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-3 text-[#F5E7C6]">
            <Building2 className="h-5 w-5 text-[#FA8112]" />
            <span className="text-sm">Total Institutions</span>
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{stats.total}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-3 text-[#F5E7C6]">
            <Clock3 className="h-5 w-5 text-[#FA8112]" />
            <span className="text-sm">Pending</span>
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{stats.pending}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-3 text-[#F5E7C6]">
            <CheckCircle className="h-5 w-5 text-[#FA8112]" />
            <span className="text-sm">Approved</span>
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{stats.approved}</p>
        </div>
      </div>

      <AlertMessage message={successMessage} type="success" />
      <AlertMessage message={error} />

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Institutions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#F5E7C6]">
            <thead className="bg-black/20 text-xs uppercase tracking-[0.2em] text-[#FAF3E1]/70">
              <tr>
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Domain</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-5 py-8" colSpan="4">
                    <LoadingSpinner label="Loading institutions..." />
                  </td>
                </tr>
              ) : institutions.length ? (
                institutions.map((institution) => (
                  <tr className="border-t border-white/10" key={institution.id}>
                    <td className="px-5 py-4 font-medium text-white">{institution.name}</td>
                    <td className="px-5 py-4">{institution.domain}</td>
                    <td className="px-5 py-4 capitalize">{institution.status}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={institution.status !== 'pending'}
                          onClick={() => onApprove(institution.id)}
                          type="button"
                        >
                          Approve
                        </button>
                        <button
                          className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={institution.status !== 'pending'}
                          onClick={() => onReject(institution.id)}
                          type="button"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-8 text-center text-[#F5E7C6]/70" colSpan="4">
                    No institutions registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 mt-8">
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Employers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-[#F5E7C6]">
            <thead className="bg-black/20 text-xs uppercase tracking-[0.2em] text-[#FAF3E1]/70">
              <tr>
                <th className="px-5 py-4">Employer Name</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-5 py-8" colSpan="4">
                    <LoadingSpinner label="Loading employers..." />
                  </td>
                </tr>
              ) : employers.length ? (
                employers.map((employer) => (
                  <tr className="border-t border-white/10" key={employer.id}>
                    <td className="px-5 py-4 font-medium text-white">{employer.name}</td>
                    <td className="px-5 py-4">{employer.email}</td>
                    <td className="px-5 py-4 capitalize">{employer.employerStatus}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={employer.employerStatus !== 'pending'}
                          onClick={() => onApproveEmployer(employer.id)}
                          type="button"
                        >
                          Approve
                        </button>
                        <button
                          className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={employer.employerStatus !== 'pending'}
                          onClick={() => onRejectEmployer(employer.id)}
                          type="button"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-8 text-center text-[#F5E7C6]/70" colSpan="4">
                    No employers registered yet.
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
