import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { register, login } from '../../services/authService';

const LandingPage = () => {
  const navigate = useNavigate();
  const { login: setAuthUser, isAuthenticated } = useAuth();
  
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    collegeName: '',
    department: '',
    participantId: '',
    participantPin: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;
      if (isLogin) {
        response = await login({ 
          participantId: formData.participantId, 
          participantPin: formData.participantPin 
        });
      } else {
        response = await register(formData);
      }
      
      if (response.success) {
        setAuthUser(response.participant);
        navigate('/lobby'); // In the next phase, we'll route to a lobby/instructions page
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="card max-w-lg w-full text-center">
        <h2 className="text-2xl font-bold mb-4">Welcome Back</h2>
        <p className="mb-6 text-gray-400">You are securely authenticated.</p>
        <button onClick={() => navigate('/lobby')} className="btn-primary w-full">
          Enter Competition Lobby
        </button>
      </div>
    );
  }

  return (
    <div className="card max-w-lg w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          {isLogin ? 'Resume Competition' : 'Participant Registration'}
        </h2>
        <p className="text-gray-400 text-sm">
          {isLogin 
            ? 'Enter your ID and PIN to securely resume your session.' 
            : 'Register with your college details to begin.'}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-900/50 p-4 border border-red-800 text-sm text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <>
            <div>
              <label className="label" htmlFor="fullName">Full Name</label>
              <input type="text" id="fullName" name="fullName" required={!isLogin} className="input-field" onChange={handleChange} value={formData.fullName} />
            </div>
            <div>
              <label className="label" htmlFor="collegeName">College Name</label>
              <input type="text" id="collegeName" name="collegeName" required={!isLogin} className="input-field" onChange={handleChange} value={formData.collegeName} />
            </div>
            <div>
              <label className="label" htmlFor="department">Department</label>
              <input type="text" id="department" name="department" required={!isLogin} className="input-field" onChange={handleChange} value={formData.department} />
            </div>
          </>
        )}
        
        <div>
          <label className="label" htmlFor="participantId">Participant ID (Roll No / Reg No)</label>
          <input type="text" id="participantId" name="participantId" required className="input-field" onChange={handleChange} value={formData.participantId} />
        </div>
        
        <div>
          <label className="label" htmlFor="participantPin">Security PIN (Create a 4-digit PIN)</label>
          <input type="password" id="participantPin" name="participantPin" required minLength="4" className="input-field" onChange={handleChange} value={formData.participantPin} />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-6">
          {loading ? 'Processing...' : isLogin ? 'Resume Session' : 'Register & Continue'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button 
          type="button" 
          onClick={() => { setIsLogin(!isLogin); setError(''); }}
          className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold"
        >
          {isLogin ? 'Need to register? Click here.' : 'Already registered? Resume session here.'}
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
