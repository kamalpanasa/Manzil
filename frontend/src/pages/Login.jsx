import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plane, Lock, Mail, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    const { error: signInError } = await signIn({ email, password });
    setSubmitting(false);

    if (signInError) {
      setError(signInError.message || 'Unable to log in. Please check your credentials.');
      return;
    }

    const redirectTo = location.state?.from?.pathname || '/';
    navigate(redirectTo, { replace: true });
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
            <h1>Start your<br/>journey with<br/><span className="text-gradient">smart planning</span></h1>
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
              <h3>Welcome back</h3>
              <p>Login to continue your journey</p>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleLogin} className="login-form">
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
                    placeholder="Enter your password"
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
                <a href="#" className="forgot-password" onClick={(e) => e.preventDefault()}>Forgot password?</a>
              </div>

              <button type="submit" className="btn-primary login-btn" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={18} className="spin" /> Logging in...
                  </>
                ) : (
                  <>
                    Login <ArrowRightIcon />
                  </>
                )}
              </button>
            </form>

            <div className="divider">
              <span>or</span>
            </div>

            <Link to="/signup" className="btn-outline signup-btn">
              Sign Up <UserAddIcon />
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
const UserAddIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>;

export default Login;
