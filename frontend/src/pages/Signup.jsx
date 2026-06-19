import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plane, Lock, Mail, User, Loader2, Eye, EyeOff, CheckCircle, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, signIn, signInWithGoogle, isAuthenticated } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    const { error: googleError } = await signInWithGoogle();
    setGoogleLoading(false);
    if (googleError) {
      setError(googleError.message || 'Google sign-in failed. Please try again.');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) { setError('Please enter your full name.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setSubmitting(true);
    const { data, error: signUpError } = await signUp({ email, password, fullName });

    if (signUpError) {
      setSubmitting(false);
      setError(signUpError.message || 'Unable to create your account. Please try again.');
      return;
    }

    if (data?.session) {
      navigate('/', { replace: true });
      return;
    }

    const { error: signInError } = await signIn({ email, password });
    setSubmitting(false);

    if (!signInError) {
      navigate('/', { replace: true });
      return;
    }

    setAwaitingConfirmation(true);
  };

  if (awaitingConfirmation) {
    return (
      <div className="login-container">
        <div className="login-content" style={{ justifyContent: 'center' }}>
          <div className="login-right" style={{ flex: '0 0 auto', maxWidth: 460 }}>
            <div className="login-card glass-card" style={{ textAlign: 'center', padding: '40px 32px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <div style={{
                  width: 68, height: 68, borderRadius: '50%',
                  background: 'rgba(157,78,221,0.15)',
                  border: '2px solid rgba(157,78,221,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Send size={28} color="var(--primary)" />
                </div>
              </div>

              <h3 style={{ fontSize: '1.3rem', marginBottom: 8 }}>Check your email</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 24 }}>
                We sent a confirmation link to<br />
                <strong style={{ color: 'white' }}>{email}</strong>
              </p>

              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, padding: '14px 18px', textAlign: 'left', marginBottom: 24,
              }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  What to do next
                </p>
                {[
                  'Open your email inbox',
                  'Click the confirmation link in the email from Manzil',
                  'You\'ll be redirected back here and logged in automatically',
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: i < 2 ? 8 : 0 }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'rgba(157,78,221,0.25)',
                      color: '#c8b6ff', fontSize: '0.7rem', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: 1,
                    }}>{i + 1}</span>
                    <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)' }}>{step}</span>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                Didn't receive an email? Check your spam folder or wait a minute.
              </p>

              <Link to="/login" className="btn-primary login-btn" style={{ display: 'flex', justifyContent: 'center' }}>
                <CheckCircle size={16} /> Go to Login
              </Link>

              <button
                style={{ marginTop: 12, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => { setAwaitingConfirmation(false); setError(''); }}
              >
                Try a different email
              </button>
            </div>
            <div className="secure-badge">Your data is secure with us</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-left">
          <div className="brand">
            <Plane className="brand-icon" size={32} />
            <h2>Manzil</h2>
          </div>

          <div className="hero-text">
            <h1>Create your<br/>account and<br/><span className="text-gradient">start exploring</span></h1>
            <p>Plan trips, manage itineraries, track expenses, and explore the world with confidence.</p>
          </div>

          <div className="features">
            <div className="feature">
              <div className="feature-icon"><BriefcaseIcon /></div>
              <div>
                <h4>Smart Itineraries</h4>
                <p>AI-powered trip planning</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon"><CardIcon /></div>
              <div>
                <h4>Track Expenses</h4>
                <p>Stay on budget</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon"><GlobeIcon /></div>
              <div>
                <h4>Explore More</h4>
                <p>Discover new places</p>
              </div>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-card glass-card">
            <div className="card-header">
              <div className="icon-wrapper">
                <Plane size={24} color="var(--primary)" />
              </div>
              <h3>Create your account</h3>
              <p>Sign up to start planning your trips</p>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button
              type="button"
              className="google-btn"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || submitting}
            >
              {googleLoading ? (
                <><Loader2 size={18} className="spin" /> Connecting to Google...</>
              ) : (
                <><GoogleIcon /> Continue with Google</>
              )}
            </button>

            <div className="divider">
              <span>or sign up with email</span>
            </div>

            <form onSubmit={handleSignup} className="login-form">
              <div className="input-group">
                <label>Full Name</label>
                <div className="input-wrapper">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Email</label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password (min 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>Confirm Password</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={submitting}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirm(!showConfirm)}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary login-btn" disabled={submitting || googleLoading}>
                {submitting ? (
                  <><Loader2 size={18} className="spin" /> Creating account...</>
                ) : (
                  <>Sign Up <ArrowRightIcon /></>
                )}
              </button>
            </form>

            <div className="divider"><span>already have an account?</span></div>

            <Link to="/login" className="btn-outline signup-btn">
              Login instead <ArrowRightIcon />
            </Link>
          </div>
          <div className="secure-badge">Your data is secure with us</div>
        </div>
      </div>
    </div>
  );
};

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const BriefcaseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>;
const CardIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>;
const GlobeIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>;
const ArrowRightIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>;

export default Signup;
