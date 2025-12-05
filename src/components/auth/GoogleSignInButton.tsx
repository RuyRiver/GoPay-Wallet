import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useGoogleAuth } from '@/context/GoogleAuthContext';
import { useToast } from '@/hooks/use-toast';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const GoogleSignInButton = ({ onSuccess, onError }: GoogleSignInButtonProps) => {
  const { login } = useGoogleAuth();
  const { toast } = useToast();

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }

      // Login with the ID token
      await login(credentialResponse.credential);

      toast({
        title: "Login successful",
        description: "Welcome to Movya Wallet",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('Google login error:', error);

      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });

      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const handleError = () => {
    const errorMessage = 'Google authentication failed';
    console.error(errorMessage);

    toast({
      title: "Authentication failed",
      description: errorMessage,
      variant: "destructive",
    });

    if (onError) {
      onError(errorMessage);
    }
  };

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        theme="filled_blue"
        size="large"
        text="signin_with"
        shape="rectangular"
      />
    </div>
  );
};
