import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { Shield } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { languageNames } from '../i18n/translations';

const debugLog = (hypothesisId, message, data = {}, runId = 'login-initial') => {
  // #region agent log
  fetch('http://127.0.0.1:7695/ingest/92344bf6-a0bf-478b-ad15-5d0e984edfef', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': 'f473cf',
    },
    body: JSON.stringify({
      sessionId: 'f473cf',
      runId,
      hypothesisId,
      location: 'src/pages/Login.jsx',
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
};

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
    const trimmedPhone = phone.trim();
    const normalizedPhone = trimmedPhone.startsWith('+91')
      ? trimmedPhone.slice(3).replace(/\D/g, '')
      : trimmedPhone.replace(/\D/g, '');
    const normalizedPin = pin.trim();

    if (trimmedPhone.includes('@')) {
      debugLog('H1', 'Rejected email entered in phone field', {
        hasAtSymbolInPhone: true,
        phoneLength: trimmedPhone.length,
      });
      setError('Use your registered phone number (10 digits), not email.');
      setLoading(false);
      return;
    }

    if (normalizedPhone.length !== 10) {
      debugLog('H1', 'Rejected invalid phone length before API call', {
        normalizedPhoneLength: normalizedPhone.length,
      });
      setError('Enter a valid 10-digit phone number.');
      setLoading(false);
      return;
    }

    if (normalizedPin.length !== 4) {
      debugLog('H1', 'Rejected invalid PIN length before API call', {
        pinLength: normalizedPin.length,
      });
      setError('PIN must be exactly 4 digits.');
      setLoading(false);
      return;
    }

    // #region agent log
    debugLog('H1', 'Login submit started', {
      phoneLength: normalizedPhone.length,
      hasAtSymbolInPhone: trimmedPhone.includes('@'),
      pinLength: normalizedPin.length,
    });
    // #endregion
    try {
      // #region agent log
      debugLog('H2', 'Calling /auth/login API', {
        payloadShape: {
          hasPhone: Boolean(normalizedPhone),
          hasPin: Boolean(normalizedPin),
        },
      });
      // #endregion
      const { data } = await api.post('/auth/login', { phone: normalizedPhone, pin: normalizedPin });
      // #region agent log
      debugLog('H3', 'Login API success', {
        hasAccessToken: Boolean(data?.access_token),
        hasWorkerId: Boolean(data?.worker_id),
      });
      // #endregion
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('worker_id', data.worker_id);
      navigate('/dashboard');
    } catch (err) {
      // #region agent log
      debugLog('H4', 'Login API failed', {
        status: err?.response?.status || null,
        errorMessage: err?.message || 'unknown',
        hasResponse: Boolean(err?.response),
        detail: err?.response?.data?.detail || null,
      });
      // #endregion
      const detail = err?.response?.data?.detail;
      if (detail) {
        setError(detail);
      } else {
        setError(t('invalidCredentials'));
      }
    } finally {
      // #region agent log
      debugLog('H5', 'Login submit finished', { loadingWillBeFalse: true });
      // #endregion
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
