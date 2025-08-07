import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'mobile' | 'otp' | 'password' | 'success';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [step, setStep] = useState<Step>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const resetModal = () => {
    setStep('mobile');
    setMobile('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setIsLoading(false);
  };

  const handleMobileSubmit = async () => {
    if (mobile.length !== 10) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    // Simulate OTP sending
    setTimeout(() => {
      toast({
        title: "OTP Sent",
        description: `OTP sent to ${mobile}. Please check your messages.`,
      });
      setStep('otp');
      setIsLoading(false);
    }, 1000);
  };

  const handleOtpSubmit = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit OTP.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    // Simulate OTP verification
    setTimeout(() => {
      toast({
        title: "OTP Verified",
        description: "Please set your new password.",
      });
      setStep('password');
      setIsLoading(false);
    }, 1000);
  };

  const handlePasswordSubmit = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    // Simulate password reset
    setTimeout(() => {
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset successfully.",
      });
      setStep('success');
      setIsLoading(false);
      setTimeout(() => {
        onOpenChange(false);
        resetModal();
      }, 2000);
    }, 1000);
  };

  const renderStep = () => {
    switch (step) {
      case 'mobile':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={mobile}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setMobile(value);
                }}
                className="rounded-xl border-2 focus:border-primary"
                maxLength={10}
              />
            </div>
            <Button
              onClick={handleMobileSubmit}
              disabled={mobile.length !== 10 || isLoading}
              className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold py-3 rounded-xl transition-all duration-300"
            >
              {isLoading ? 'Sending OTP...' : 'Next'}
            </Button>
          </div>
        );

      case 'otp':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(value);
                }}
                className="rounded-xl border-2 focus:border-primary text-center text-lg tracking-widest"
                maxLength={6}
              />
              <p className="text-sm text-muted-foreground">
                OTP sent to {mobile}
              </p>
            </div>
            <Button
              onClick={handleOtpSubmit}
              disabled={otp.length !== 6 || isLoading}
              className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold py-3 rounded-xl transition-all duration-300"
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </Button>
          </div>
        );

      case 'password':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-xl border-2 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`rounded-xl border-2 focus:border-primary ${
                  confirmPassword && newPassword !== confirmPassword
                    ? 'border-destructive animate-pulse'
                    : ''
                }`}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-destructive">Passwords do not match</p>
              )}
            </div>
            <Button
              onClick={handlePasswordSubmit}
              disabled={
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword ||
                isLoading
              }
              className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold py-3 rounded-xl transition-all duration-300"
            >
              {isLoading ? 'Saving...' : 'Save Password'}
            </Button>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <div className="text-success text-4xl">✓</div>
            <p className="text-lg font-semibold text-success">
              Password Reset Successful!
            </p>
            <p className="text-muted-foreground">
              You can now login with your new password.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (step) {
      case 'mobile':
        return 'Forgot Password';
      case 'otp':
        return 'Verify OTP';
      case 'password':
        return 'Set New Password';
      case 'success':
        return 'Success';
      default:
        return 'Forgot Password';
    }
  };

  const getDescription = () => {
    switch (step) {
      case 'mobile':
        return 'Enter your registered mobile number to receive an OTP';
      case 'otp':
        return 'Enter the OTP sent to your mobile number';
      case 'password':
        return 'Create a new password for your account';
      case 'success':
        return 'Your password has been reset successfully';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-primary">{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
};