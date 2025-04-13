import { FC, useState, useEffect } from 'react';
import { useWebSocketStore } from '@/lib/websocket';
import { PixelAvatar, PixelAvatarMap, RoleDescriptions } from '@/assets/svgs/pixel-avatars';
import backgroundImage from '@/assets/background.png';

// Storage keys for saving user preferences
const STORAGE_KEY_AVATAR = 'tavern_selected_avatar';
const STORAGE_KEY_AUTO_LOGIN = 'tavern_auto_login';
const STORAGE_KEY_USERNAME = 'tavern_username';

enum AuthMode {
  LOGIN = 'login',
  REGISTER = 'register',
}

const CharacterSelection: FC = () => {
  const { 
    user, 
    login, 
    register, 
    connect,
    socket,
    isLoggingIn, 
    isRegistering, 
    authError 
  } = useWebSocketStore();
  
  // Authentication states
  const [mode, setMode] = useState<AuthMode>(AuthMode.LOGIN);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(
    localStorage.getItem(STORAGE_KEY_AUTO_LOGIN) === 'true'
  );
  
  // Avatar selection
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    localStorage.getItem(STORAGE_KEY_AVATAR) || 'bard'
  );
  
  // Validation state
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Pre-fill the username if we have it stored
  useEffect(() => {
    const savedUsername = localStorage.getItem(STORAGE_KEY_USERNAME);
    if (savedUsername && savedUsername.trim()) {
      setUsername(savedUsername);
    }
  }, []);
  
  // Handle login/register form submission
  const handleSubmit = () => {
    setValidationError(null);
    
    if (!username.trim()) {
      setValidationError('Username is required');
      return;
    }
    
    if (!password) {
      setValidationError('Password is required');
      return;
    }
    
    // Save username preference if "Remember my username" is checked
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY_USERNAME, username);
    } else {
      localStorage.removeItem(STORAGE_KEY_USERNAME);
    }
    
    // Always save avatar and remember preferences
    localStorage.setItem(STORAGE_KEY_AVATAR, selectedAvatar);
    localStorage.setItem(STORAGE_KEY_AUTO_LOGIN, rememberMe.toString());
    
    // First connect to establish WebSocket connection (without authentication)
    console.log('Establishing WebSocket connection...');
    connect(username, selectedAvatar);
    
    // Small delay to allow connection to establish before authentication
    setTimeout(() => {
      if (mode === AuthMode.REGISTER) {
        performRegistration();
      } else {
        performLogin();
      }
    }, 500);
  };
  
  // Perform registration with validation
  const performRegistration = () => {
    // Validation for registration
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }
    
    if (email && !email.includes('@')) {
      setValidationError('Please enter a valid email address');
      return;
    }
    
    // Register
    console.log('Registering with:', username, 'avatar:', selectedAvatar);
    register(username, password, email, selectedAvatar);
  };
  
  // Perform login
  const performLogin = () => {
    console.log('Logging in with:', username);
    login(username, password);
  };
  
  // Update stored avatar when selection changes
  const handleAvatarSelect = (avatar: string) => {
    setSelectedAvatar(avatar);
    localStorage.setItem(STORAGE_KEY_AVATAR, avatar);
  };
  
  // Toggle between login and register modes
  const toggleMode = () => {
    setMode(mode === AuthMode.LOGIN ? AuthMode.REGISTER : AuthMode.LOGIN);
    setValidationError(null);
  };
  
  // Available patron avatars
  const avatarOptions = Object.keys(PixelAvatarMap);
  
  // Only show character selection if user is not connected
  // This prevents the patron screen from staying visible after connection
  return (
    <div 
      id="character-select"
      className={`${user ? 'hidden' : 'flex'} fixed inset-0 items-center justify-center z-50`}
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="character-modal w-5/6 max-w-3xl z-10 overflow-hidden
                      relative border-8 border-[#8B4513] rounded-lg"
           style={{
             backgroundImage: "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
             backgroundColor: "#2C1810",
             boxShadow: "0 0 20px 10px rgba(0,0,0,0.6)"
           }}>
        {/* Nails/studs in the corners */}
        <div className="absolute top-1 left-1 w-3 h-3 rounded-full bg-[#C0C0C0] border-2 border-[#8B4513]"></div>
        <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-[#C0C0C0] border-2 border-[#8B4513]"></div>
        <div className="absolute bottom-1 left-1 w-3 h-3 rounded-full bg-[#C0C0C0] border-2 border-[#8B4513]"></div>
        <div className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-[#C0C0C0] border-2 border-[#8B4513]"></div>
        
        {/* Header */}
        <div className="modal-header bg-gradient-to-r from-[#614119] via-[#8B4513] to-[#614119] p-3 border-b-4 border-[#2C1810] relative">
          <h2 className="font-['Press_Start_2P'] text-[#FFD700] text-center text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            {mode === AuthMode.LOGIN ? 'TAVERN LOGIN' : 'CREATE ACCOUNT'}
          </h2>
          
          {/* Decorative torch icons */}
          <div className="absolute top-3 left-4 text-orange-500">🔥</div>
          <div className="absolute top-3 right-4 text-orange-500">🔥</div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5">
          {/* Avatar selection */}
          <div className="avatar-selection bg-[#3A2419] rounded-lg p-4 border-2 border-[#8B4513] 
                         shadow-[inset_0_0_10px_rgba(0,0,0,0.6)]">
            <h3 className="font-['VT323'] text-[#FFD700] text-center text-xl mb-3 border-b border-[#8B4513] pb-2">
              Choose Your Avatar
            </h3>
            
            <div className="avatars-grid grid grid-cols-3 gap-3">
              {avatarOptions.map((avatar) => (
                <div 
                  key={avatar}
                  className={`avatar-option cursor-pointer p-2 flex flex-col items-center transition-all ${
                    selectedAvatar === avatar 
                    ? 'bg-gradient-to-b from-[#8B4513] to-[#6B3503] rounded-md scale-110 shadow-lg' 
                    : 'hover:bg-[#5A4439] rounded-md'
                  }`}
                  onClick={() => handleAvatarSelect(avatar)}
                >
                  <div className={`rounded-full p-1 mb-1 ${
                    selectedAvatar === avatar 
                    ? 'bg-[#FFD700] bg-opacity-20 scale-105 transition-all duration-300' 
                    : ''
                  }`}>
                    <PixelAvatar name={avatar} size={64} className="mb-1" />
                  </div>
                  <span className="font-['VT323'] text-[#FFD700] text-center capitalize font-bold">
                    {avatar}
                  </span>
                  {selectedAvatar === avatar && (
                    <span className="font-['VT323'] text-[#E8D6B3] text-xs text-center mt-1 max-w-32">
                      {RoleDescriptions[avatar as keyof typeof RoleDescriptions]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Auth form */}
          <div className="auth-form bg-[#3A2419] rounded-lg p-4 border-2 border-[#8B4513] 
                         shadow-[inset_0_0_10px_rgba(0,0,0,0.6)]">
            <h3 className="font-['VT323'] text-[#FFD700] text-center text-xl mb-3 border-b border-[#8B4513] pb-2">
              {mode === AuthMode.LOGIN ? 'Sign In' : 'Sign Up'}
            </h3>
            
            {/* Form fields */}
            <div className="space-y-3">
              <div>
                <label className="block mb-1 text-[#FFD700] font-['VT323']">Username:</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#2C1810] text-[#E8D6B3] border-2 border-[#8B4513] p-2 rounded font-['VT323']" 
                  placeholder="Enter your username"
                />
              </div>
              
              <div>
                <label className="block mb-1 text-[#FFD700] font-['VT323']">Password:</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#2C1810] text-[#E8D6B3] border-2 border-[#8B4513] p-2 rounded font-['VT323']" 
                  placeholder="Enter your password"
                />
              </div>
              
              {mode === AuthMode.REGISTER && (
                <>
                  <div>
                    <label className="block mb-1 text-[#FFD700] font-['VT323']">Confirm Password:</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#2C1810] text-[#E8D6B3] border-2 border-[#8B4513] p-2 rounded font-['VT323']" 
                      placeholder="Confirm your password"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-1 text-[#FFD700] font-['VT323']">Email (Optional):</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#2C1810] text-[#E8D6B3] border-2 border-[#8B4513] p-2 rounded font-['VT323']" 
                      placeholder="Enter your email"
                    />
                  </div>
                </>
              )}
              
              {/* Error messages */}
              {(validationError || authError) && (
                <div className="p-2 border border-red-700 bg-red-900 bg-opacity-30 text-red-300 rounded">
                  {validationError || authError}
                </div>
              )}
              
              {/* Remember me checkbox */}
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="remember-me"
                  className="w-4 h-4 bg-[#2C1810] border-2 border-[#8B4513] rounded focus:ring-[#8B4513]"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-[#E8D6B3] font-['VT323']">
                  Remember my username
                </label>
              </div>
              
              {/* Submit button */}
              <button 
                className="w-full bg-gradient-to-b from-[#8B4513] to-[#6B3503] text-[#FFD700] px-4 py-2 
                           font-['Press_Start_2P'] text-sm rounded border-2 border-[#614119]
                           hover:from-[#9B5523] hover:to-[#7B4503] 
                           active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed
                           shadow-md relative overflow-hidden"
                onClick={handleSubmit}
                disabled={isLoggingIn || isRegistering}
              >
                {/* Wood texture overlay */}
                <div className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundColor: "#8B4513"
                    }}
                ></div>
                
                <span className="relative z-10">
                  {isLoggingIn || isRegistering ? (
                    'WORKING...'
                  ) : (
                    mode === AuthMode.LOGIN ? 'ENTER TAVERN' : 'CREATE ACCOUNT'
                  )}
                </span>
              </button>
              
              {/* Mode toggle */}
              <div className="text-center mt-3">
                <button 
                  onClick={toggleMode}
                  className="font-['VT323'] text-[#FFD700] hover:underline"
                >
                  {mode === AuthMode.LOGIN 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="modal-footer bg-gradient-to-r from-[#614119] via-[#8B4513] to-[#614119] p-3 border-t-4 border-[#2C1810] text-center">
          <p className="font-['VT323'] text-[#E8D6B3] text-sm">
            Enter the Fantasy Tavern and embark on an adventure!
          </p>
        </div>
      </div>
    </div>
  );
};

export default CharacterSelection;