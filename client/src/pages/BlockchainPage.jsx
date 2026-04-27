import { Activity, Blocks, Landmark, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AlertMessage from '../components/AlertMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { blockchainApi } from '../services/api';

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-3 text-[#F5E7C6]">
        <Icon className="h-5 w-5 text-[#FA8112]" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

export default function BlockchainPage() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadTransactions() {
      setLoading(true);
      setError('');

      try {
        const data = await blockchainApi.listTransactions();
        setSummary(data.summary);
        setTransactions(data.transactions || []);
        setSelectedTransaction(data.transactions?.[0] || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, []);

  return (
    <div className="page-shell space-y-8">
      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="space-y-5">
          <span className="inline-flex rounded-full border border-[#FA8112]/30 bg-[#FA8112]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#FA8112]">
            Mock Blockchain Server
          </span>
          <h1 className="text-4xl font-semibold text-white">Simulated on-chain explorer for minted credentials</h1>
          <p className="max-w-2xl text-[#F5E7C6]/75">
            This page shows every issued credential as a mock minted transaction on AccredChain Mocknet.
            Each transaction is generated locally from your JSON data using SHA-256 token IDs and tx hashes.
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3 text-white">
            <span className="rounded-2xl bg-[#FA8112]/15 p-3 text-[#FA8112]">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-[#FA8112]">Network</p>
              <h2 className="mt-1 text-2xl font-semibold">{summary?.network || 'AccredChain Mocknet'}</h2>
            </div>
          </div>
          <p className="mt-4 text-sm text-[#F5E7C6]/75">
            No wallet, gas, or external blockchain login is required. Issuing a credential automatically appears here as a minted transaction.
          </p>
        </div>
      </section>

      <AlertMessage message={error} />
      {loading ? <LoadingSpinner label="Loading blockchain transactions..." /> : null}

      {!loading && summary ? (
        <section className="grid gap-4 md:grid-cols-4">
          <SummaryCard icon={Landmark} label="Latest Block" value={summary.latestBlock} />
          <SummaryCard icon={Blocks} label="Transactions" value={summary.totalTransactions} />
          <SummaryCard icon={Activity} label="Active Credentials" value={summary.activeCredentials} />
          <SummaryCard icon={ShieldCheck} label="Revoked Credentials" value={summary.revokedCredentials} />
        </section>
      ) : null}

      {!loading ? (
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
            <div className="border-b border-white/10 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">Minted Transactions</h2>
            </div>
            <div className="max-h-[640px] overflow-y-auto">
              {transactions.length ? (
                transactions.map((transaction) => {
                  const isSelected = selectedTransaction?.txHash === transaction.txHash;
                  return (
                    <button
                      className={`w-full border-b border-white/10 px-6 py-5 text-left transition hover:bg-white/5 ${isSelected ? 'bg-white/8' : ''}`}
                      key={transaction.txHash}
                      onClick={() => setSelectedTransaction(transaction)}
                      type="button"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm uppercase tracking-[0.18em] text-[#FA8112]">Block #{transaction.blockNumber}</p>
                          <h3 className="mt-2 text-lg font-semibold text-white">{transaction.studentName}</h3>
                          <p className="text-sm text-[#F5E7C6]/75">{transaction.degree} in {transaction.major}</p>
                          <p className="mt-2 text-sm text-[#F5E7C6]/65">{transaction.institutionName}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${transaction.status === 'active' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'}`}>
                          {transaction.status}
                        </span>
                      </div>
                      <p className="mt-4 break-all font-mono text-xs text-[#F5E7C6]/75">txHash: {transaction.txHash}</p>
                    </button>
                  );
                })
              ) : (
                <div className="px-6 py-10 text-sm text-[#F5E7C6]/75">No minted transactions yet.</div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-white">Transaction Details</h2>
            {selectedTransaction ? (
              <div className="mt-5 space-y-4 text-sm text-[#F5E7C6]">
                <div>
                  <p className="text-[#FAF3E1]/60">Block Number</p>
                  <p className="mt-1 text-white">#{selectedTransaction.blockNumber}</p>
                </div>
                <div>
                  <p className="text-[#FAF3E1]/60">Student</p>
                  <p className="mt-1 text-white">{selectedTransaction.studentName}</p>
                </div>
                <div>
                  <p className="text-[#FAF3E1]/60">Institution</p>
                  <p className="mt-1 text-white">{selectedTransaction.institutionName}</p>
                </div>
                <div>
                  <p className="text-[#FAF3E1]/60">Credential</p>
                  <p className="mt-1 text-white">{selectedTransaction.degree} in {selectedTransaction.major}</p>
                </div>
                <div>
                  <p className="text-[#FAF3E1]/60">Minted At</p>
                  <p className="mt-1 text-white">{new Date(selectedTransaction.minedAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[#FAF3E1]/60">Token ID</p>
                  <p className="mt-1 break-all font-mono text-xs">{selectedTransaction.tokenId}</p>
                </div>
                <div>
                  <p className="text-[#FAF3E1]/60">Verification Key</p>
                  <p className="mt-1 break-all font-mono text-xs">{selectedTransaction.verificationKey || selectedTransaction.txHash || selectedTransaction.tokenId}</p>
                </div>
                <div>
                  <p className="text-[#FAF3E1]/60">Transaction Hash</p>
                  <p className="mt-1 break-all font-mono text-xs">{selectedTransaction.txHash}</p>
                </div>
                <div className="pt-2">
                  <Link
                    className="secondary-btn"
                    to={`/verify/${selectedTransaction.verificationKey || selectedTransaction.txHash || selectedTransaction.tokenId}`}
                  >
                    Open Verification Page
                  </Link>
                </div>
              </div>
            ) : (
              <p className="mt-5 text-sm text-[#F5E7C6]/75">Select a transaction to inspect it.</p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}