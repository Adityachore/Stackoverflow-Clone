import { useEffect, useState } from 'react';
import { useTranslation, SUPPORTED_LOCALES, Locale, LOCALE_TO_LANGUAGE } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/AuthContext';
import { initiateLanguageChange, confirmLanguageChange } from '@/lib/api';

interface LanguageSwitcherProps {
  variant?: 'button' | 'icon' | 'dropdown';
}

export function LanguageSwitcher({ variant = 'button' }: LanguageSwitcherProps) {
  const { t, locale, changeLocale } = useTranslation();
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');

  const currentLocale = SUPPORTED_LOCALES.find((l) => l.code === locale);

  const handleLanguageSelect = async (newLocale: Locale) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }

    if (!user || !token) {
      changeLocale(newLocale);
      setIsOpen(false);
      return;
    }

    const languageName = LOCALE_TO_LANGUAGE[newLocale];
    if (!languageName) {
      setError('Unsupported language selected');
      return;
    }

    if (!user._id) {
      setError('Unable to find your account. Please re-login.');
      return;
    }
    if (languageName !== 'French' && !user.mobile) {
      setError('Add a phone number in your profile to change language.');
      return;
    }

    // Logged-in users must verify via OTP before changing language
    setPendingLocale(newLocale);
    setLoading(true);
    setError('');

    try {
      const response = await initiateLanguageChange(user._id, languageName);
      setDevOtp(response?.data?.devOtp || '');
      setOtpSent(true);
      setResendCooldown(30);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!resendCooldown) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const handleResendOtp = async () => {
    if (!pendingLocale || !user?._id) return;
    const languageName = LOCALE_TO_LANGUAGE[pendingLocale];
    if (!languageName) {
      setError('Unsupported language selected');
      return;
    }

    setResendLoading(true);
    setError('');

    try {
      const response = await initiateLanguageChange(user._id, languageName);
      setDevOtp(response?.data?.devOtp || '');
      setResendCooldown(30);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!pendingLocale || !otp) return;

    const languageName = LOCALE_TO_LANGUAGE[pendingLocale];
    if (!languageName) {
      setError('Unsupported language selected');
      return;
    }

    if (!user?._id) {
      setError('You must be logged in to verify language changes');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await confirmLanguageChange(user._id, languageName, otp);
      changeLocale(pendingLocale);
      setIsOpen(false);
      resetState();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setPendingLocale(null);
    setOtp('');
    setOtpSent(false);
    setError('');
    setDevOtp('');
    setResendCooldown(0);
    setResendLoading(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetState();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {variant === 'icon' ? (
          <Button variant="ghost" size="sm" className="text-sm">
            🌐 {currentLocale?.code.toUpperCase()}
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="text-sm">
            🌐 {currentLocale?.nativeName || 'English'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle>
            {otpSent ? 'Verify Language Change' : 'Choose Language'}
          </DialogTitle>
          <DialogDescription>
            {otpSent
              ? `Enter the OTP sent to your ${pendingLocale === 'fr' ? 'email' : 'phone'} to confirm the language change.`
              : 'Select your preferred language. Logged-in users will need to verify via OTP.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {otpSent ? (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">
                Changing to: <strong>{SUPPORTED_LOCALES.find(l => l.code === pendingLocale)?.nativeName}</strong>
              </p>
              <p className="text-xs text-gray-400">
                {pendingLocale === 'fr' ? '📧 OTP sent via Email' : '📱 OTP sent via SMS'}
              </p>
              {devOtp && (
                <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 inline-block">
                  Dev OTP: <strong>{devOtp}</strong>
                </p>
              )}
            </div>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder={pendingLocale === 'fr' ? 'Enter Email OTP' : 'Enter SMS OTP'}
              maxLength={6}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-center text-lg tracking-widest"
            />
            <p className="text-xs text-gray-500 text-center">
              {pendingLocale === 'fr'
                ? 'Check your email for the OTP.'
                : 'Check your mobile SMS for the OTP.'}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1 text-blue-600 hover:text-blue-700"
                onClick={handleResendOtp}
                disabled={resendLoading || resendCooldown > 0}
              >
                {resendLoading
                  ? 'Resending...'
                  : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend OTP'}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                onClick={() => resetState()}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {SUPPORTED_LOCALES.map((lang) => (
              <Button
                key={lang.code}
                variant={locale === lang.code ? 'default' : 'outline'}
                className={locale === lang.code
                  ? 'justify-start bg-blue-600 text-white hover:bg-blue-700'
                  : 'justify-start bg-white text-gray-800 border-gray-300 hover:bg-gray-50'}
                onClick={() => handleLanguageSelect(lang.code)}
                disabled={loading}
              >
                <span className="mr-2">
                  {lang.code === 'en' && '🇺🇸'}
                  {lang.code === 'es' && '🇪🇸'}
                  {lang.code === 'hi' && '🇮🇳'}
                  {lang.code === 'fr' && '🇫🇷'}
                  {lang.code === 'zh' && '🇨🇳'}
                  {lang.code === 'pt' && '🇧🇷'}
                </span>
                {lang.nativeName}
              </Button>
            ))}
          </div>
        )}

        {user && !otpSent && (
          <p className="text-xs text-center text-gray-400 mt-2">
            🔒 Language change requires OTP verification for security
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default LanguageSwitcher;
