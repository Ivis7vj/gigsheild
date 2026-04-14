import { Link } from 'react-router-dom';
import { Shield, CloudRain, Sun, Wind, ChevronRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { languageNames } from '../i18n/translations';

export default function Home() {
  const { t, language, changeLanguage } = useLanguage();

  return (
    <div className="bg-white min-h-screen">
      {/* Navbar */}
      <nav className="border-b border-gray-100 flex justify-between items-center px-4 sm:px-6 py-4" role="navigation" aria-label={t('openMenu')}>
        <div className="text-xl sm:text-2xl font-bold text-[#1E3A5F] flex items-center gap-2">
          <Shield className="text-[#FF6B35] w-6 h-6 sm:w-8 sm:h-8" aria-hidden="true" />
          <span>GigShield</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Language Selector */}
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
          <Link
            to="/login"
            className="text-gray-600 font-medium hover:text-[#1E3A5F] text-sm sm:text-base"
            aria-label={t('goToLogin')}
          >
            {t('login')}
          </Link>
          <Link
            to="/register"
            className="bg-[#FF6B35] text-white px-4 sm:px-5 py-2 transition rounded-full font-medium shadow-md shadow-[#FF6B35]/30 hover:shadow-[#FF6B35]/50 text-sm sm:text-base"
            aria-label={t('goToRegister')}
          >
            {t('getProtected')}
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center" role="main">
        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold text-[#1E3A5F] tracking-tight mb-4 sm:mb-6">
          {t('tagline').split('. ')[0]}. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B35] to-[#FF8E5E]">
            {t('tagline').split('. ')[1]}
          </span>
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-gray-500 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
          {t('heroDescription')}
        </p>

        <div className="flex justify-center gap-4">
          <Link
            to="/register"
            className="bg-[#1E3A5F] text-white px-6 sm:px-8 py-3 rounded-full font-medium text-base sm:text-lg flex items-center justify-center gap-2 hover:bg-[#1E3A5F]/90 transition focus:ring-4 focus:ring-[#1E3A5F]/30 focus:outline-none"
            aria-label={t('startProtected')}
          >
            {t('startProtected')} <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
          </Link>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 mt-16 sm:mt-20" role="region" aria-label="Features">
          <div className="bg-[#f8f9fc] p-6 sm:p-8 rounded-3xl text-left shadow-sm border border-gray-100 hover:shadow-md transition focus-within:ring-2 focus-within:ring-[#1E3A5F]">
            <div className="bg-white w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-sm mb-6">
              <CloudRain className="w-6 h-6 sm:w-7 sm:h-7 text-[#1E3A5F]" aria-hidden="true" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#1E3A5F] mb-3">
              <span aria-hidden="true">🌧️</span> {t('zeroTouchClaims')}
            </h3>
            <p className="text-sm sm:text-base text-gray-500 leading-relaxed">{t('zeroTouchDescription')}</p>
          </div>

          <div className="bg-[#f8f9fc] p-6 sm:p-8 rounded-3xl text-left shadow-sm border border-gray-100 hover:shadow-md transition focus-within:ring-2 focus-within:ring-[#1E3A5F]">
            <div className="bg-white w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-sm mb-6">
              <Sun className="w-6 h-6 sm:w-7 sm:h-7 text-[#FF6B35]" aria-hidden="true" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#1E3A5F] mb-3">
              <span aria-hidden="true">💰</span> {t('dynamicPricing')}
            </h3>
            <p className="text-sm sm:text-base text-gray-500 leading-relaxed">{t('dynamicPricingDescription')}</p>
          </div>

          <div className="bg-[#f8f9fc] p-6 sm:p-8 rounded-3xl text-left shadow-sm border border-gray-100 hover:shadow-md transition focus-within:ring-2 focus-within:ring-[#1E3A5F]">
            <div className="bg-white w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-sm mb-6">
              <Wind className="w-6 h-6 sm:w-7 sm:h-7 text-[#22C55E]" aria-hidden="true" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#1E3A5F] mb-3">
              <span aria-hidden="true">🛡️</span> {t('broadCoverage')}
            </h3>
            <p className="text-sm sm:text-base text-gray-500 leading-relaxed">{t('broadCoverageDescription')}</p>
          </div>
        </div>
      </main>

      {/* Accessibility: Skip to content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-[#1E3A5F] text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to main content
      </a>
    </div>
  );
}
