import { Award, GraduationCap, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Tamper-Proof',
    description: 'Every credential gets a unique SHA-256 token ID and transaction hash for immutable-style proof.',
    icon: ShieldCheck,
  },
  {
    title: 'Instant Verification',
    description: 'Employers and verifiers can validate credentials publicly in seconds using the token ID.',
    icon: Award,
  },
  {
    title: 'Student Ownership',
    description: 'Students can access their credentials and share verification links directly from the dashboard.',
    icon: GraduationCap,
  },
];

export default function LandingPage() {
  return (
    <div className="page-shell space-y-12">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <span className="inline-flex rounded-full border border-[#FA8112]/30 bg-[#FA8112]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#FA8112]">
            Demo Credential Platform
          </span>
          <h1 className="text-5xl font-semibold tracking-tight text-white">
            AccredChain
          </h1>
          <p className="text-2xl text-[#F5E7C6]">
            Blockchain-Powered Academic Credential Verification
          </p>
          <p className="max-w-2xl text-base text-[#F5E7C6]/75 sm:text-lg">
            A full-stack demo for issuing, managing, and verifying academic credentials with simulated blockchain proofs.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="secondary-btn" to="/verify">
              Verify a Credential
            </Link>
            <Link className="primary-btn" to="/register">
              Get Started
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#FAF3E1] to-[#F5E7C6] p-8 text-[#222222] shadow-2xl shadow-black/20">
          <div className="rounded-[1.5rem] bg-[#FA8112] p-8 text-white">
            <ShieldCheck className="h-12 w-12" />
            <h2 className="mt-6 text-2xl font-semibold">Trusted academic verification</h2>
            <p className="mt-3 text-sm text-white/85">
              Institutions issue credentials, students own them, and verifiers confirm them instantly.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6" key={feature.title}>
            <span className="inline-flex rounded-2xl bg-[#FA8112]/15 p-3 text-[#FA8112]">
              <Icon className="h-6 w-6" />
            </span>
            <h3 className="mt-5 text-lg font-semibold text-white">{feature.title}</h3>
            <p className="mt-3 text-sm text-[#F5E7C6]/75">{feature.description}</p>
          </div>
          );
        })}
      </section>
    </div>
  );
}
