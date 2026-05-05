import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AlertMessage from '../components/AlertMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const initialState = {
  name: '',
  email: '',
  password: '',
  role: 'student',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState(initialState);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const data = await register(form);
      setMessage(data.message);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <form className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20" onSubmit={handleSubmit}>
        <div>
          <h1 className="text-2xl font-semibold text-white">Create an account</h1>
          <p className="mt-2 text-sm text-[#F5E7C6]/75">Choose a role and start using AccredChain.</p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <input className="field" placeholder="Full name" type="text" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <input className="field" placeholder="Email address" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          <input className="field" placeholder="Password" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          <select className="field" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
            <option value="student">Student</option>
            <option value="institution">Institution</option>
            <option value="employer">Employer</option>
            <option value="verifier">Verifier</option>
          </select>
        </div>

        <div className="mt-5 space-y-3">
          <AlertMessage message={message} type="success" />
          <AlertMessage message={error} />
        </div>

        <button className="primary-btn mt-5 w-full" disabled={loading} type="submit">
          {loading ? 'Submitting...' : 'Register'}
        </button>

        {loading ? <LoadingSpinner label="Creating account..." /> : null}

        <p className="mt-6 text-center text-sm text-[#F5E7C6]/75">
          Already have an account?{' '}
          <Link className="text-[#FA8112] hover:underline" to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
