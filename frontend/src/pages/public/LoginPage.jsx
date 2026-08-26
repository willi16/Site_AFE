import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const fadeInUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

const loginSchema = z.object({
  username: z.string().min(1, "Nom d'utilisateur requis"),
  password: z.string().min(1, 'Mot de passe requis'),
});

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      const result = await login(data.username, data.password);
      navigate(result.dashboardPath);
    } catch (err) {
      setError("Identifiants incorrects. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center bg-surface-50 px-4">
      <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-surface-100">
          <div className="text-center mb-8">
            <img src="/logo-afe.jpg" alt="AFE Logo" className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-surface-900 font-[var(--font-display)]">Connexion</h1>
            <p className="text-sm text-surface-500 mt-1">Accédez à votre espace membre</p>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">{error}</div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">Nom d'utilisateur</label>
              <input {...register('username')} className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all" placeholder="votre_identifiant" />
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">Mot de passe</label>
              <div className="relative">
                <input {...register('password')} type={showPassword ? 'text' : 'password'} className="w-full px-4 py-3 pr-12 rounded-xl border border-surface-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
              <LogIn className="w-5 h-5 mr-2" />
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-surface-500">
              Pas encore membre ? <Link to="/adhesion" className="text-accent-500 font-semibold hover:underline">S'inscrire</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginPage;
