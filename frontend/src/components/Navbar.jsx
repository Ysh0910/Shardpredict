import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../App';

export default function Navbar() {
  const { account, connect, walletError, score, isOwner } = useApp();
  const { pathname } = useLocation();
  const short = account ? `${account.slice(0, 6)}…${account.slice(-4)}` : null;

  return (
    <nav className="sticky top-0 z-50 bg-base/80 backdrop-blur-2xl border-b border-primary/15"
         style={{ boxShadow: '0 1px 0 rgba(91,110,245,0.2)' }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Left */}
        <div className="flex items-center gap-6">
          <motion.div whileHover={{ scale: 1.03 }}>
            <Link to="/" className="font-display text-lg font-bold flex items-center gap-1">
              <span className="text-gold">⚡</span>
              <span className="text-primary">Shard</span>
              <span className="text-white">Predict</span>
            </Link>
          </motion.div>

          <motion.div whileHover={{ y: -1 }}>
            <Link to="/"
              className={`text-sm px-3 py-1.5 rounded-lg transition-all duration-150 ${
                pathname === '/' ? 'bg-primary/15 text-white' : 'text-secondary hover:bg-primary/10 hover:text-white'
              }`}>
              Markets
            </Link>
          </motion.div>

          {isOwner && (
            <motion.div whileHover={{ y: -1 }}>
              <Link to="/create"
                className={`text-sm px-3 py-1.5 rounded-lg border transition-all duration-150 ${
                  pathname === '/create'
                    ? 'border-primary bg-primary/15 text-white'
                    : 'border-primary/40 text-primary hover:bg-primary/10'
                }`}>
                + Create
              </Link>
            </motion.div>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {walletError && <span className="text-no text-xs max-w-[180px] truncate">{walletError}</span>}

          {account && score !== null && (
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="bg-gold/10 border border-gold/30 rounded-full px-3 py-1 font-mono text-gold text-sm"
            >
              ⭐ {score} pts
            </motion.div>
          )}

          {account ? (
            <div className="bg-elevated border border-primary/20 rounded-full px-3 py-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yes animate-pulse" />
              <span className="font-mono text-xs text-secondary">{short}</span>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(91,110,245,0.5)' }}
              whileTap={{ scale: 0.98 }}
              onClick={connect}
              className="bg-gradient-to-r from-primary to-indigo-700 text-white font-display font-semibold text-sm px-5 py-2 rounded-xl transition-all duration-200"
            >
              Connect Wallet
            </motion.button>
          )}
        </div>
      </div>
    </nav>
  );
}
