import { Award, Database } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { credentialApi, healthApi, institutionApi } from '../services/api';
import AdminDashboard from './AdminDashboard';
import InstitutionDashboard from './InstitutionDashboard';
import StudentDashboard from './StudentDashboard';

export default function DashboardPage() {
  const { token, user, institution, refreshProfile } = useAuth();
  const [studentCredentials, setStudentCredentials] = useState([]);
  const [issuedCredentials, setIssuedCredentials] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [dbStatus, setDbStatus] = useState({
    state: 'checking',
    label: 'Checking MongoDB...',
  });

  useEffect(() => {
    let active = true;

    async function loadHealth() {
      try {
        const data = await healthApi.status();
        const databaseState = data?.database?.state || 'unknown';
        if (!active) {
          return;
        }

        setDbStatus({
          state: databaseState,
          label:
            databaseState === 'connected'
              ? `MongoDB connected (${data?.database?.dbName || 'accredchain'})`
              : `MongoDB ${databaseState}`,
        });
      } catch {
        if (!active) {
          return;
        }

        setDbStatus({
          state: 'disconnected',
          label: 'MongoDB disconnected',
        });
      }
    }

    loadHealth();

    return () => {
      active = false;
    };
  }, []);

  async function loadDashboardData() {
    if (!token || !user) {
      return;
    }

    setLoading(true);
    setSuccessMessage('');
    setError('');

    try {
      if (user.role === 'admin') {
        const data = await institutionApi.list(token);
        setInstitutions(data.institutions || []);
      }

      if (user.role === 'institution') {
        const data = await credentialApi.issued(token);
        setIssuedCredentials(data.credentials || []);
      }

      if (user.role === 'student') {
        const data = await credentialApi.my(token);
        setStudentCredentials(data.credentials || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, [token, user]);

  async function handleApprove(institutionId) {
    setSuccessMessage('');
    setError('');

    try {
      const data = await institutionApi.approve(institutionId, token);
      setSuccessMessage(data.message);
      await loadDashboardData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleReject(institutionId) {
    setSuccessMessage('');
    setError('');

    try {
      const data = await institutionApi.reject(institutionId, token);
      setSuccessMessage(data.message);
      await loadDashboardData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRegisterInstitution(payload) {
    setSuccessMessage('');
    setError('');

    try {
      const data = await institutionApi.register(payload, token);
      setSuccessMessage(data.message);
      await refreshProfile();
      await loadDashboardData();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function handleIssueCredential(payload) {
    setSuccessMessage('');
    setError('');

    try {
      const data = await credentialApi.issue(payload, token);
      setSuccessMessage(data.message);
      await loadDashboardData();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function handleRevokeCredential(id) {
    setSuccessMessage('');
    setError('');

    try {
      const data = await credentialApi.revoke(id, token);
      setSuccessMessage(data.message);
      await loadDashboardData();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <div className="page-shell space-y-8">
      <section className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-[#FA8112]">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Welcome, {user.name}</h1>
          <p className="mt-2 text-sm text-[#F5E7C6]/75">
            Role: <span className="capitalize text-white">{user.role}</span>
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-3 rounded-full border border-[#FA8112]/20 bg-[#FA8112]/10 px-4 py-2 text-sm text-[#FAF3E1]">
            <Award className="h-4 w-4 text-[#FA8112]" />
            Academic Credential Workspace
          </div>
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${
              dbStatus.state === 'connected'
                ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                : 'border-rose-400/40 bg-rose-500/10 text-rose-200'
            }`}
          >
            <Database className="h-4 w-4" />
            {dbStatus.label}
          </div>
        </div>
      </section>

      {user.role === 'admin' ? (
        <AdminDashboard
          error={error}
          institutions={institutions}
          loading={loading}
          onApprove={handleApprove}
          onReject={handleReject}
          successMessage={successMessage}
        />
      ) : null}

      {user.role === 'institution' ? (
        <InstitutionDashboard
          error={error}
          institution={institution}
          issuedCredentials={issuedCredentials}
          loading={loading}
          onIssueCredential={handleIssueCredential}
          onRegisterInstitution={handleRegisterInstitution}
          onRevoke={handleRevokeCredential}
          successMessage={successMessage}
        />
      ) : null}

      {user.role === 'student' ? (
        <StudentDashboard
          credentials={studentCredentials}
          error={error}
          loading={loading}
          successMessage={successMessage}
        />
      ) : null}
    </div>
  );
}
