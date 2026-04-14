import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { Shield } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { languageNames } from '../i18n/translations';

export default function Login() {
  const navigate = useNavigate();
  const { t, language, changeLanguage } = useLanguage();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/login', { phone, pin });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('worker_id', data.worker_id);
      navigate('/dashboard');
    } catch (err) {
      setError(t('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-4">
      <div className="bg-white max-w-sm w-full rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-8" role="form" aria-label="Login form">
        {/* Language Selector */}
        <div className="flex justify-end mb-4">
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-[#FF6B35] focus:outline-none"
            aria-label="Select language"
          >
            {Object.entries(languageNames).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>

        <div className="text-center mb-8">
          <div className="bg-[#1E3A5F] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" aria-hidden="true">
            <Shield className="w-8 h-8 text-[#FF6B35]" />
          </div>
          <h2 className="text-2xl font-bold text-[#1E3A5F]">{t('welcomeBack')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('loginSubtitle')}</p>
        </div>

        {error && (
          <div
            className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm text-center"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              {t('phoneNumber')}
            </label>
            <input
              id="phone"
              type="tel"
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-[#FF6B35] focus:outline-none"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="10-digit number"
              required
              aria-required="true"
              autoComplete="tel"
            />
          </div>
          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-1">
              {t('pin')}
            </label>
            <input
              id="pin"
              type="password"
              maxLength={4}
              className="w-full border border-gray-300 rounded-xl p-3 text-center tracking-widest text-lg focus:ring-2 focus:ring-[#FF6B35] focus:outline-none"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="••••"
              required
              aria-required="true"
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1E3A5F] text-white py-3 rounded-full font-medium shadow hover:bg-[#1E3A5F]/90 transition focus:ring-4 focus:ring-[#1E3A5F]/30 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t('submitForm')}
          >
            {loading ? t('processing') : t('loginButton')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('noAccount')}{' '}
          <Link to="/register" className="text-[#FF6B35] font-semibold hover:underline">
            {t('registerHere')}
          </Link>
        </p>
      </div>
    </div>
  );
}
