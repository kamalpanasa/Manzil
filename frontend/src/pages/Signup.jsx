import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plane, Lock, Mail, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, signIn, isAuthenticated } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    const { data, error: signUpError } = await signUp({ email, password, fullName });

    if (signUpError) {
      setSubmitting(false);
      console.error("Signup error details:", signUpError);
      let errMsg = signUpError.message;
      if (errMsg === '{}' || !errMsg) {
        errMsg = 'Unable to create account. Rate limit or configuration error in Supabase.';
      }
      setError(errMsg);
      return;
    }

    if (data?.session) {
      navigate('/', { replace: true });
      return;
    }

    // If Supabase requires email confirmation, try auto-login anyway
    const { error: signInError } = await signIn({ email, password });
    setSubmitting(false);

    if (!signInError) {
      navigate('/', { replace: true });
    } else {
      setInfo('Account created! Please check your email to confirm your address, then log in.');
    }
  };

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
            {info && <div className="auth-info">{info}</div>}

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

              <button type="submit" className="btn-primary login-btn" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={18} className="spin" /> Creating account...
                  </>
                ) : (
                  <>
                    Sign Up <ArrowRightIcon />
                  </>
                )}
              </button>
            </form>

            <div className="divider">
              <span>or</span>
            </div>

            <Link to="/login" className="btn-outline signup-btn">
              Already have an account? Login
            </Link>
          </div>
          <div className="secure-badge">
            Your data is secure with us
          </div>
        </div>
      </div>
    </div>
  );
};

const BriefcaseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>;
const CardIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>;
const GlobeIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>;
const ArrowRightIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>;

export default Signup;
