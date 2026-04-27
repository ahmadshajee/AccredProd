import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AlertMessage from '../components/AlertMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <form className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20" onSubmit={handleSubmit}>
        <div>
          <h1 className="text-2xl font-semibold text-white">Sign in</h1>
          <p className="mt-2 text-sm text-[#F5E7C6]/75">Access your AccredChain dashboard.</p>
        </div>

        <div className="mt-6 space-y-4">
          <input
            className="field"
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="Email"
            type="email"
            value={form.email}
          />
          <input
            className="field"
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            placeholder="Password"
            type="password"
            value={form.password}
          />
        </div>

        <div className="mt-5">
          <AlertMessage message={error} />
        </div>

        <button className="primary-btn mt-5 w-full" disabled={loading} type="submit">
          {loading ? 'Signing in...' : 'Login'}
        </button>

        {loading ? <LoadingSpinner label="Authenticating..." /> : null}
      </form>
    </div>
  );
}
