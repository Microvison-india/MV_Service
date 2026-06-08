import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../api/axios';

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 10 * 60; // 10 minutes per GRD Section 3.3

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(OTP_EXPIRY_SECONDS);

  const inputRefs = useRef([]);

  // Countdown timer per TBP Phase 3 item 15
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleDigitChange = (index, value) => {
    // Accept only single digit
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError('');

    // Auto-focus next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted.length === OTP_LENGTH) {
      setDigits(pasted.split(''));
      inputRefs.current[OTP_LENGTH - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < OTP_LENGTH) {
      setError('Please enter all 6 digits.');
      return;
    }
    if (timeLeft <= 0) {
      setError('OTP has expired. Please request a new one.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/verify-otp', { email, code });
      // Pass email + code to reset password page
      navigate('/reset-password', { state: { email, code } });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Microvison</h1>
          <p className="text-muted-foreground mt-1 text-sm">Service Management System</p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-semibold text-foreground mb-1">Enter OTP</h2>
          <p className="text-sm text-muted-foreground mb-6">
            We sent a 6-digit code to <strong>{email || 'your email'}</strong>. Enter it below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 6 individual digit inputs per TBP Phase 3 item 15 */}
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {digits.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-digit-${index}`}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-11 h-12 rounded-lg border border-input bg-background text-center text-lg font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
              ))}
            </div>

            {/* Countdown timer */}
            <div className="text-center">
              {timeLeft > 0 ? (
                <span className="text-sm text-muted-foreground">
                  OTP expires in{' '}
                  <span className={timeLeft < 60 ? 'text-destructive font-medium' : 'font-medium'}>
                    {formatTime(timeLeft)}
                  </span>
                </span>
              ) : (
                <span className="text-sm text-destructive font-medium">OTP expired.</span>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              id="verify-otp-submit"
              type="submit"
              disabled={loading || timeLeft <= 0}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Didn't receive the code?{' '}
            <Link to="/forgot-password" className="text-primary font-medium hover:underline">
              Resend OTP
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
