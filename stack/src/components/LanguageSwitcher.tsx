import { useState } from 'react';
import { useTranslation, SUPPORTED_LOCALES, Locale } from '@/lib/i18n';
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
  const [error, setError] = useState('');

  const currentLocale = SUPPORTED_LOCALES.find((l) => l.code === locale);

  const handleLanguageSelect = async (newLocale: Locale) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }

    // If user is logged in, require OTP verification for language change
    if (user && token) {
      setPendingLocale(newLocale);
      setLoading(true);
      setError('');

      try {
        await initiateLanguageChange(newLocale);
        setOtpSent(true);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to send OTP');
      } finally {
        setLoading(false);
      }
    } else {
      // Not logged in, just change the locale directly
      changeLocale(newLocale);
      setIsOpen(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!pendingLocale || !otp) return;

    setLoading(true);
    setError('');

    try {
      await confirmLanguageChange(pendingLocale, otp);
      changeLocale(pendingLocale);
      setIsOpen(false);
      resetState();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setPendingLocale(null);
    setOtp('');
    setOtpSent(false);
    setError('');
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
      <DialogContent className="sm:max-w-md">
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
                {pendingLocale === 'fr' 
                  ? '📧 OTP sent via Email' 
                  : '📱 OTP sent via SMS'}
              </p>
            </div>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-center text-lg tracking-widest"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => resetState()}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
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
                className="justify-start"
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
