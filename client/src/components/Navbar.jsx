import { ShieldCheck } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinkClass = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm transition ${isActive ? 'bg-white/10 text-white' : 'text-[#F5E7C6]/75 hover:text-white'}`;

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#222222]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link className="flex items-center gap-3 text-lg font-semibold text-white" to="/">
          <span className="rounded-2xl bg-[#FA8112]/15 p-2 text-[#FA8112]">
            <ShieldCheck className="h-5 w-5" />
          </span>
          AccredChain
        </Link>

        <nav className="flex items-center gap-2">

          <NavLink className={navLinkClass} to="/verify">
            Verify
          </NavLink>
          {user ? (
            <>
              <NavLink className={navLinkClass} to="/dashboard">
                Dashboard
              </NavLink>
              <button className="secondary-btn" onClick={logout} type="button">
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink className={navLinkClass} to="/login">
                Login
              </NavLink>
              <NavLink className={navLinkClass} to="/register">
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
