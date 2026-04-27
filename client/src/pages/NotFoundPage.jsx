import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-4xl font-bold text-white">404</h1>
      <p className="mt-3 text-[#F5E7C6]/75">The requested page could not be found.</p>
      <Link className="primary-btn mt-6" to="/">
        Back to home
      </Link>
    </div>
  );
}
