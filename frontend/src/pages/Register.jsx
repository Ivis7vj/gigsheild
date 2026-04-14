import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { languageNames } from '../i18n/translations';

export default function Register() {
  const navigate = useNavigate();
  const { t, language, changeLanguage } = useLanguage();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '', phone: '', aadhaar: '', city: 'Mumbai', zone: 'Zone 1', pincode: '',
    platform: 'Zomato', weekly_earnings: '', hours_per_day: '', days_per_week: '',
    experience_years: '', upi_id: '', pin: ''
  });

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        step1: {
          full_name: formData.full_name,
          phone: formData.phone,
          aadhaar: formData.aadhaar,
          city: formData.city,
          zone: formData.zone,
          pincode: formData.pincode
        },
        step2: {
          platform: formData.platform,
          weekly_earnings: parseFloat(formData.weekly_earnings),
          hours_per_day: parseFloat(formData.hours_per_day),
          days_per_week: parseFloat(formData.days_per_week),
          experience_years: parseFloat(formData.experience_years) || 0
        },
        step3: {
          upi_id: formData.upi_id,
          pin: formData.pin
        }
      };
      const { data } = await api.post('/auth/register', payload);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('worker_id', data.worker_id);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || t('error'));
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = [t('personalDetails'), t('workDetails'), t('payoutSetup'), t('confirmProfile')];

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-4">
      <div className="bg-white max-w-xl w-full rounded-3xl shadow-xl overflow-hidden border border-gray-100" role="form" aria-label="Registration form">
        {/* Language Selector */}
        <div className="bg-[#1E3A5F] p-4 flex justify-end">
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="text-sm border border-blue-300 rounded-lg px-2 py-1 bg-white/90 focus:ring-2 focus:ring-[#FF6B35] focus:outline-none"
            aria-label="Select language"
          >
            {Object.entries(languageNames).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>

        <div className="bg-[#1E3A5F] p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 transform translate-x-8 -translate-y-8">
            <CheckCircle2 className="w-48 h-48" aria-hidden="true" />
          </div>
          <h2 className="text-3xl font-bold relative z-10">{t('joinGigShield')}</h2>
          <p className="text-blue-100 mt-2 relative z-10">
            {t('step')} {step} {t('of')} 4: {stepLabels[step - 1]}
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                  <span aria-hidden="true">👤 </span>{t('fullName')}
                </label>
                <input
                  id="full_name"
                  type="text"
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-[#FF6B35] focus:outline-none"
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  required
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  <span aria-hidden="true">📱 </span>{t('phoneNumber')}
                </label>
                <input
                  id="phone"
                  type="tel"
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-[#FF6B35] focus:outline-none"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="10-digit number"
                  required
                  aria-required="true"
                  autoComplete="tel"
                />
              </div>
              <div>
                <label htmlFor="aadhaar" className="block text-sm font-medium text-gray-700 mb-1">
                  <span aria-hidden="true">🆔 </span>{t('aadhaar')}
                </label>
                <input
                  id="aadhaar"
                  type="password"
                  maxLength={12}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-[#FF6B35] focus:outline-none"
                  value={formData.aadhaar}
                  onChange={e => setFormData({ ...formData, aadhaar: e.target.value })}
                  placeholder="12-digit Aadhaar"
                  required
                  aria-required="true"
                />
                <p className="text-xs text-gray-400 mt-1">{t('aadhaarMasked')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    <span aria-hidden="true">🏙️ </span>{t('city')}
                  </label>
                  <select
                    id="city"
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-[#FF6B35] focus:outline-none"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                  >
                    {['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Hyderabad'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="zone" className="block text-sm font-medium text-gray-700 mb-1">
                    <span aria-hidden="true">📍 </span>{t('zone')}
                  </label>
                  <select
                    id="zone"
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-[#FF6B35] focus:outline-none"
                    value={formData.zone}
                    onChange={e => setFormData({ ...formData, zone: e.target.value })}
                  >
                    {['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5'].map(z => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-1">
                  <span aria-hidden="true">📮 </span>Pincode (Postal Code)
                </label>
                <input
                  id="pincode"
                  type="text"
                  pattern="[0-9]{6}"
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-[#FF6B35] focus:outline-none"
                  value={formData.pincode}
                  onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="e.g. 400001"
                  required
                  aria-required="true"
                />
                <p className="text-xs text-gray-400 mt-1">6-digit pincode for precise location tracking</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-1">
                  <span aria-hidden="true">🏢 </span>{t('platform')}
                </label>
                <select
                  id="platform"
                  className="w-full border border-gray-300 rounded-xl p-3 text-[#1E3A5F] focus:ring-2 focus:ring-[#FF6B35] focus:outline-none"
                  value={formData.platform}
                  onChange={e => setFormData({ ...formData, platform: e.target.value })}
                >
                  {['Zomato', 'Swiggy', 'Zepto', 'Amazon Flex', 'Dunzo', 'Other'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="weekly_earnings" className="block text-sm font-medium text-gray-700 mb-1">
                  <span aria-hidden="true">💰 </span>{t('weeklyEarnings')}
                </label>
                <input
                  id="weekly_earnings"
                  type="number"
                  className="w-full border border-gray-300 rounded-xl p-3 text-[#1E3A5F] focus:ring-2 focus:ring-[#FF6B35] focus:outline-none"
                  value={formData.weekly_earnings}
                  onChange={e => setFormData({ ...formData, weekly_earnings: e.target.value })}
                  placeholder="e.g. 4500"
                  required
                  aria-required="true"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="hours_per_day" className="block text-sm font-medium text-gray-700 mb-1">
                    <span aria-hidden="true">⏱️ </span>{t('hoursPerDay')}
                  </label>
                  <input
                    id="hours_per_day"
                    type="number"
                    className="w-full border border-gray-300 rounded-xl p-3 text-[#1E3A5F] focus:ring-2 focus:ring-[#FF6B35] focus:outline-none"
                    value={formData.hours_per_day}
                    onChange={e => setFormData({ ...formData, hours_per_day: e.target.value })}
                    placeholder="e.g. 8"
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="days_per_week" className="block text-sm font-medium text-gray-700 mb-1">
                    <span aria-hidden="true">📅 </span>{t('daysPerWeek')}
                  </label>
                  <input
                    id="days_per_week"
                    type="number"
                    className="w-full border border-gray-300 rounded-xl p-3 text-[#1E3A5F] focus:ring-2 focus:ring-[#FF6B35] focus:outline-none"
                    value={formData.days_per_week}
                    onChange={e => setFormData({ ...formData, days_per_week: e.target.value })}
                    placeholder="e.g. 6"
                    required
                    aria-required="true"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="experience_years" className="block text-sm font-medium text-gray-700 mb-1">
                  <span aria-hidden="true">🎯 </span>{t('experienceYears')}
                </label>
                <input
                  id="experience_years"
                  type="number"
                  step="0.5"
                  className="w-full border border-gray-300 rounded-xl p-3 text-[#1E3A5F] focus:ring-2 focus:ring-[#FF6B35] focus:outline-none"
                  value={formData.experience_years}
                  onChange={e => setFormData({ ...formData, experience_years: e.target.value })}
                  placeholder="e.g. 2.5"
                  aria-required="true"
                />
                <p className="text-xs text-[#FF6B35] mt-1 font-medium">{t('experienceDiscount')}</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="upi_id" className="block text-sm font-medium text-gray-700 mb-1">
                  <span aria-hidden="true">💳 </span>{t('upiId')}
                </label>
                <input
                  id="upi_id"
                  type="text"
                  className="w-full border border-gray-300 rounded-xl p-3 text-[#1E3A5F] focus:ring-2 focus:ring-[#FF6B35] focus:outline-none"
                  value={formData.upi_id}
                  onChange={e => setFormData({ ...formData, upi_id: e.target.value })}
                  placeholder="e.g. yourname@upi"
                  required
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-1">
                  <span aria-hidden="true">🔐 </span>{t('createPin')}
                </label>
                <input
                  id="pin"
                  type="password"
                  maxLength={4}
                  className="w-full border border-gray-300 rounded-xl p-3 text-[#1E3A5F] text-center tracking-widest text-lg focus:ring-2 focus:ring-[#FF6B35] focus:outline-none"
                  value={formData.pin}
                  onChange={e => setFormData({ ...formData, pin: e.target.value })}
                  placeholder="••••"
                  required
                  aria-required="true"
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <h3 className="text-[#1E3A5F] font-bold text-lg mb-4 border-b border-blue-200 pb-2">{t('profileSummary')}</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><span className="font-semibold text-[#1E3A5F]">{t('name')}:</span> {formData.full_name}</p>
                  <p><span className="font-semibold text-[#1E3A5F]">{t('location')}:</span> {formData.city}, {formData.zone} - {formData.pincode}</p>
                  <p><span className="font-semibold text-[#1E3A5F]">{t('platform')}:</span> {formData.platform}</p>
                  <p><span className="font-semibold text-[#1E3A5F]">{t('reportedEarnings')}:</span> ₹{formData.weekly_earnings}/wk</p>
                  <p><span className="font-semibold text-[#1E3A5F]">{t('payoutUpi')}:</span> {formData.upi_id}</p>
                </div>
                <div className="mt-4 bg-white p-4 rounded-xl border border-blue-100">
                  <div className="text-[#1E3A5F] text-sm font-bold mb-2">{t('exclusions')}:</div>
                  <ul className="text-xs text-gray-500 list-disc list-inside space-y-1">
                    <li>{t('war')}</li>
                    <li>{t('pandemic')}</li>
                    <li>{t('terrorism')}</li>
                    <li>{t('nuclear')}</li>
                  </ul>
                </div>
                <div className="mt-4 bg-[#22C55E]/10 p-4 rounded-xl border border-[#22C55E]/20 flex items-center justify-between">
                  <div className="text-gray-600 text-sm font-medium">{t('automatedTier')}</div>
                  <div className="bg-[#22C55E] text-white px-3 py-1 rounded-full text-xs font-bold">{t('standardRisk')}</div>
                </div>
                <p className="text-xs text-gray-400 text-center mt-4">{t('agreePolicy')}</p>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between items-center">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="text-gray-500 flex items-center text-sm font-medium hover:text-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#FF6B35] rounded-lg px-2 py-1"
                aria-label={t('back')}
              >
                <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" /> {t('back')}
              </button>
            ) : <div></div>}

            {step < 4 ? (
              <button
                onClick={handleNext}
                className="bg-[#FF6B35] text-white px-6 py-3 rounded-full font-medium flex items-center shadow shadow-[#FF6B35]/40 hover:shadow-lg transition focus:ring-4 focus:ring-[#FF6B35]/30 focus:outline-none"
                aria-label={t('continue')}
              >
                {t('continue')} <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-[#1E3A5F] text-white px-8 py-3 rounded-full font-medium flex items-center shadow hover:bg-[#1E3A5F]/90 transition focus:ring-4 focus:ring-[#1E3A5F]/30 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={t('submitForm')}
              >
                {loading ? t('processing') : t('completeActivate')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
