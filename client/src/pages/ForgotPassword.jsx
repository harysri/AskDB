// import React, { useEffect, useRef, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { motion, AnimatePresence } from "framer-motion";
// import { sendOtp, verifyOtp, resetPassword } from "../api/auth";

// const OTP_LENGTH = 6;
// const RESEND_SECONDS = 60;

// const ForgotPassword = () => {
//   const navigate = useNavigate();
//   const [step, setStep] = useState(1);
//   const [email, setEmail] = useState("");
//   const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
//   const [cooldown, setCooldown] = useState(0);
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [showNew, setShowNew] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [info, setInfo] = useState("");
//   const otpRefs = useRef([]);

//   // 60-second resend countdown
//   useEffect(() => {
//     if (step !== 2 || cooldown <= 0) return;
//     const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
//     return () => clearTimeout(t);
//   }, [step, cooldown]);

//   // Auto-redirect to login 3s after success
//   useEffect(() => {
//     if (step !== 4) return;
//     const t = setTimeout(() => navigate("/login"), 3000);
//     return () => clearTimeout(t);
//   }, [step, navigate]);

//   const handleSendOtp = async (e) => {
//     e?.preventDefault();
//     setError("");
//     setInfo("");
//     if (!email.trim()) {
//       setError("Please enter your email address.");
//       return;
//     }
//     setIsLoading(true);
//     try {
//       await sendOtp({ email: email.trim() });
//       setStep(2);
//       setCooldown(RESEND_SECONDS);
//       setInfo("Verification code sent. Check your inbox.");
//       setTimeout(() => otpRefs.current[0]?.focus(), 50);
//     } catch (err) {
//       setError(err.message || "Failed to send verification code.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleResend = async () => {
//     if (cooldown > 0 || isLoading) return;
//     setError("");
//     setIsLoading(true);
//     try {
//       await sendOtp({ email: email.trim() });
//       setOtp(Array(OTP_LENGTH).fill(""));
//       setCooldown(RESEND_SECONDS);
//       setInfo("A new code was sent to your email.");
//       setTimeout(() => otpRefs.current[0]?.focus(), 50);
//     } catch (err) {
//       setError(err.message || "Failed to resend code.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const setOtpAt = (index, value) => {
//     setOtp((prev) => {
//       const next = [...prev];
//       next[index] = value;
//       return next;
//     });
//   };

//   const handleOtpChange = (index, e) => {
//     const digit = e.target.value.replace(/\D/g, "").slice(-1);
//     setOtpAt(index, digit);
//     if (digit && index < OTP_LENGTH - 1) {
//       otpRefs.current[index + 1]?.focus();
//     }
//   };

//   const handleOtpKeyDown = (index, e) => {
//     if (e.key === "Backspace" && !otp[index] && index > 0) {
//       otpRefs.current[index - 1]?.focus();
//     }
//   };

//   const handleOtpPaste = (e) => {
//     e.preventDefault();
//     const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
//     if (!digits) return;
//     setOtp((prev) => prev.map((_, i) => digits[i] || ""));
//     otpRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
//   };

//   const handleVerifyOtp = async (e) => {
//     e.preventDefault();
//     setError("");
//     setInfo("");
//     const code = otp.join("");
//     if (code.length !== OTP_LENGTH) {
//       setError("Please enter the 6-digit code.");
//       return;
//     }
//     setIsLoading(true);
//     try {
//       await verifyOtp({ email: email.trim(), otp: code });
//       setStep(3);
//     } catch (err) {
//       setError(err.message || "Invalid or expired code.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleResetPassword = async (e) => {
//     e.preventDefault();
//     setError("");
//     if (newPassword.length < 8) {
//       setError("Password must be at least 8 characters.");
//       return;
//     }
//     if (newPassword !== confirmPassword) {
//       setError("Passwords do not match.");
//       return;
//     }
//     setIsLoading(true);
//     try {
//       await resetPassword({ email: email.trim(), otp: otp.join(""), newPassword });
//       setStep(4);
//     } catch (err) {
//       setError(err.message || "Failed to reset password.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const steps = ["Email", "Verify", "Reset", "Done"];

//   return (
//     <div className="min-h-screen bg-background text-on-surface flex items-center justify-center px-4 py-10">
//       <div className="w-full max-w-md">
//         <div className="rounded-2xl bg-surface-container-high border border-white/5 p-8 shadow-xl">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
//               <span className="material-symbols-outlined text-background text-2xl font-bold">
//                 lock_reset
//               </span>
//             </div>
//             <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
//           </div>
//           <p className="text-body-sm text-on-surface-variant mb-6">
//             {step === 1 && "Enter your account email to receive a verification code."}
//             {step === 2 && `Enter the 6-digit code sent to ${email}.`}
//             {step === 3 && "Create a new password for your account."}
//             {step === 4 && "Your password has been reset."}
//           </p>

//           {/* Stepper */}
//           <div className="flex items-center gap-1 mb-6">
//             {steps.map((label, i) => (
//               <React.Fragment key={label}>
//                 <div className="flex flex-col items-center gap-1">
//                   <div
//                     className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
//                       step > i + 1
//                         ? "bg-primary text-on-primary"
//                         : step === i + 1
//                           ? "bg-primary-container text-on-primary-container"
//                           : "bg-surface-container-lowest text-on-surface-variant"
//                     }`}
//                   >
//                     {step > i + 1 ? "✓" : i + 1}
//                   </div>
//                   <span className="text-[10px] text-on-surface-variant">{label}</span>
//                 </div>
//                 {i < steps.length - 1 && (
//                   <div className={`flex-1 h-0.5 mb-4 rounded ${step > i + 1 ? "bg-primary" : "bg-outline-variant/30"}`} />
//                 )}
//               </React.Fragment>
//             ))}
//           </div>

//           {/* Messages */}
//           <AnimatePresence>
//             {error && (
//               <motion.div
//                 initial={{ opacity: 0, y: -10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -10 }}
//                 className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-error/10 border border-error/30"
//               >
//                 <span className="material-symbols-outlined text-error text-lg">error</span>
//                 <span className="text-body-sm text-error">{error}</span>
//               </motion.div>
//             )}
//           </AnimatePresence>
//           {info && !error && (
//             <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-primary/10 border border-primary/30">
//               <span className="material-symbols-outlined text-primary text-lg">info</span>
//               <span className="text-body-sm text-on-surface">{info}</span>
//             </div>
//           )}

//           {/* Step 1: Email */}
//           {step === 1 && (
//             <form onSubmit={handleSendOtp} className="space-y-4">
//               <div>
//                 <label htmlFor="fp-email" className="text-body-sm font-medium">
//                   Email address
//                 </label>
//                 <input
//                   id="fp-email"
//                   type="email"
//                   required
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   placeholder="you@example.com"
//                   className="mt-1 w-full h-12 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
//                 />
//               </div>
//               <button
//                 type="submit"
//                 disabled={isLoading}
//                 className="w-full h-12 rounded-xl font-bold bg-primary text-on-primary shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//               >
//                 {isLoading ? "Sending…" : "Send Verification Code"}
//               </button>
//             </form>
//           )}

//           {/* Step 2: OTP */}
//           {step === 2 && (
//             <form onSubmit={handleVerifyOtp} className="space-y-4">
//               <div className="flex items-center justify-center gap-2" onPaste={handleOtpPaste}>
//                 {otp.map((digit, i) => (
//                   <input
//                     key={i}
//                     ref={(el) => (otpRefs.current[i] = el)}
//                     type="text"
//                     inputMode="numeric"
//                     autoComplete="one-time-code"
//                     maxLength={1}
//                     value={digit}
//                     onChange={(e) => handleOtpChange(i, e)}
//                     onKeyDown={(e) => handleOtpKeyDown(i, e)}
//                     aria-label={`Digit ${i + 1}`}
//                     className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
//                   />
//                 ))}
//               </div>
//               <button
//                 type="submit"
//                 disabled={isLoading}
//                 className="w-full h-12 rounded-xl font-bold bg-primary text-on-primary shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//               >
//                 {isLoading ? "Verifying…" : "Verify Code"}
//               </button>
//               <div className="text-center text-body-sm text-on-surface-variant">
//                 {cooldown > 0 ? (
//                   <span>Resend code in {cooldown}s</span>
//                 ) : (
//                   <button
//                     type="button"
//                     onClick={handleResend}
//                     disabled={isLoading}
//                     className="text-primary font-medium hover:brightness-110 disabled:opacity-60"
//                   >
//                     Resend Code
//                   </button>
//                 )}
//               </div>
//               <div className="text-center">
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setStep(1);
//                     setError("");
//                     setInfo("");
//                   }}
//                   className="text-body-sm text-on-surface-variant hover:text-on-surface transition-colors"
//                 >
//                   Use a different email
//                 </button>
//               </div>
//             </form>
//           )}

//           {/* Step 3: New password */}
//           {step === 3 && (
//             <form onSubmit={handleResetPassword} className="space-y-4">
//               <div>
//                 <label htmlFor="fp-new" className="text-body-sm font-medium">
//                   New password
//                 </label>
//                 <div className="relative mt-1">
//                   <input
//                     id="fp-new"
//                     type={showNew ? "text" : "password"}
//                     required
//                     minLength={8}
//                     value={newPassword}
//                     onChange={(e) => setNewPassword(e.target.value)}
//                     placeholder="Min. 8 characters"
//                     className="w-full h-12 px-4 pr-12 rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowNew((s) => !s)}
//                     aria-label={showNew ? "Hide password" : "Show password"}
//                     className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
//                   >
//                     <span className="material-symbols-outlined">
//                       {showNew ? "visibility_off" : "visibility"}
//                     </span>
//                   </button>
//                 </div>
//               </div>
//               <div>
//                 <label htmlFor="fp-confirm" className="text-body-sm font-medium">
//                   Confirm password
//                 </label>
//                 <div className="relative mt-1">
//                   <input
//                     id="fp-confirm"
//                     type={showConfirm ? "text" : "password"}
//                     required
//                     minLength={8}
//                     value={confirmPassword}
//                     onChange={(e) => setConfirmPassword(e.target.value)}
//                     placeholder="Repeat new password"
//                     className="w-full h-12 px-4 pr-12 rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowConfirm((s) => !s)}
//                     aria-label={showConfirm ? "Hide password" : "Show password"}
//                     className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
//                   >
//                     <span className="material-symbols-outlined">
//                       {showConfirm ? "visibility_off" : "visibility"}
//                     </span>
//                   </button>
//                 </div>
//               </div>
//               <button
//                 type="submit"
//                 disabled={isLoading}
//                 className="w-full h-12 rounded-xl font-bold bg-primary text-on-primary shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//               >
//                 {isLoading ? "Resetting…" : "Reset Password"}
//               </button>
//             </form>
//           )}

//           {/* Step 4: Success */}
//           {step === 4 && (
//             <div className="text-center py-4">
//               <motion.div
//                 initial={{ scale: 0 }}
//                 animate={{ scale: 1 }}
//                 transition={{ type: "spring", stiffness: 260, damping: 16 }}
//                 className="mx-auto w-20 h-20 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center mb-4"
//               >
//                 <motion.span
//                   initial={{ scale: 0 }}
//                   animate={{ scale: 1 }}
//                   transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 12 }}
//                   className="material-symbols-outlined text-primary text-5xl"
//                 >
//                   check_circle
//                 </motion.span>
//               </motion.div>
//               <h2 className="text-xl font-bold mb-1">Password reset successful</h2>
//               <p className="text-body-sm text-on-surface-variant mb-6">
//                 Redirecting to login in 3 seconds…
//               </p>
//               <button
//                 type="button"
//                 onClick={() => navigate("/login")}
//                 className="w-full h-12 rounded-xl font-bold bg-primary text-on-primary shadow-lg shadow-primary/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
//               >
//                 Go to Login
//               </button>
//             </div>
//           )}

//           <div className="mt-6 text-center text-body-sm text-on-surface-variant">
//             Remember your password?{" "}
//             <Link to="/login" className="text-primary font-medium hover:brightness-110">
//               Back to login
//             </Link>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ForgotPassword;

import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { sendOtp, verifyOtp, resetPassword } from "../api/auth";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

/* ─── Animation variants ─── */
const stepVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [cooldown, setCooldown] = useState(0);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const otpRefs = useRef([]);

  /* ─── 60-second resend countdown ─── */
  useEffect(() => {
    if (step !== 2 || cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [step, cooldown]);

  /* ─── Auto-redirect after success ─── */
  useEffect(() => {
    if (step !== 4) return;
    const t = setTimeout(() => navigate("/login"), 3000);
    return () => clearTimeout(t);
  }, [step, navigate]);

  /* ─── Step helpers ─── */
  const goToStep = (n) => {
    setError("");
    setInfo("");
    setStep(n);
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setIsLoading(true);
    try {
      await sendOtp({ email: email.trim() });
      goToStep(2);
      setCooldown(RESEND_SECONDS);
      setInfo("Verification code sent. Check your inbox.");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message || "Failed to send verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isLoading) return;
    setError("");
    setIsLoading(true);
    try {
      await sendOtp({ email: email.trim() });
      setOtp(Array(OTP_LENGTH).fill(""));
      setCooldown(RESEND_SECONDS);
      setInfo("A new code was sent to your email.");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setIsLoading(false);
    }
  };

  const setOtpAt = (index, value) => {
    setOtp((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleOtpChange = (index, e) => {
    const digit = e.target.value.replace(/\D/g, "").slice(-1);
    setOtpAt(index, digit);
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const digits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!digits) return;
    setOtp((prev) => prev.map((_, i) => digits[i] || ""));
    otpRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setIsLoading(true);
    try {
      await verifyOtp({ email: email.trim(), otp: code });
      goToStep(3);
    } catch (err) {
      setError(err.message || "Invalid or expired code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword({
        email: email.trim(),
        otp: otp.join(""),
        newPassword,
      });
      goToStep(4);
    } catch (err) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── Step labels for the header ─── */
  const stepTitle = () => {
    switch (step) {
      case 1:
        return "Forgot Password";
      case 2:
        return "Verify Identity";
      case 3:
        return "Create New Password";
      case 4:
        return "All Set";
      default:
        return "";
    }
  };

  const stepSubtitle = () => {
    switch (step) {
      case 1:
        return "Enter your account email to receive a verification code.";
      case 2:
        return `Enter the 6-digit code sent to ${email}`;
      case 3:
        return "Create a strong new password for your account.";
      case 4:
        return "Your password has been successfully reset.";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md flex overflow-hidden">
      {/* ════════════════════════════════════════════
          LAYER 1 — BRANDING (left 50% on desktop)
          ════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 xl:p-16 overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(79,70,229,0.18),transparent_60%)]" />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-primary/8 rounded-full blur-[100px] animate-pulse-slow" />
          <div
            className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-secondary/8 rounded-full blur-[80px] animate-pulse-slow"
            style={{ animationDelay: "2s" }}
          />
        </div>

        {/* Top: Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-background text-2xl font-bold">
                database
              </span>
            </div>
            <span className="font-headline-md text-2xl font-bold tracking-tighter text-on-surface">
              AskDB
            </span>
          </Link>
        </div>

        {/* Center: Value prop */}
        <div className="relative z-10 max-w-md">
          <h1 className="font-display-lg text-5xl xl:text-6xl headline-tracking text-on-surface mb-6 leading-[1.05]">
            Secure Your <span className="text-primary italic">Account</span>
          </h1>
          <p className="text-lg text-on-surface-variant/80 leading-relaxed mb-10">
            We will help you regain access to your workspace quickly and
            securely with email verification.
          </p>
          <div className="flex flex-col gap-4">
            {[
              { icon: "lock_reset", label: "Password Recovery" },
              { icon: "verified_user", label: "OTP-Verified Security" },
              { icon: "shield", label: "End-to-End Encrypted" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-container/20 rounded-lg flex items-center justify-center border border-primary/20">
                  <span className="material-symbols-outlined text-primary text-sm">
                    {item.icon}
                  </span>
                </div>
                <span className="text-sm font-medium text-on-surface-variant">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Status */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant/60">
            All Systems Operational
          </span>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          LAYER 2 — FORM (right 50% on desktop)
          ════════════════════════════════════════════ */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative overflow-y-auto">
        <div className="absolute inset-0 lg:hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,0.12),transparent_60%)]" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-background text-2xl font-bold">
                database
              </span>
            </div>
            <span className="font-headline-md text-2xl font-bold tracking-tighter text-on-surface">
              AskDB
            </span>
          </div>

          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            className="glass-card p-8 md:p-10 rounded-[2rem] border-white/10 shadow-2xl"
          >
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary-container/20 rounded-xl flex items-center justify-center border border-primary/20">
                  <span className="material-symbols-outlined text-primary text-xl">
                    {step === 1
                      ? "lock_reset"
                      : step === 2
                        ? "pin"
                        : step === 3
                          ? "password"
                          : "check_circle"}
                  </span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={stepTitle()}
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="font-headline-lg text-2xl headline-tracking text-on-surface"
                  >
                    {stepTitle()}
                  </motion.h2>
                </AnimatePresence>
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={stepSubtitle()}
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="text-on-surface-variant text-sm leading-relaxed"
                >
                  {stepSubtitle()}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="flex items-center gap-2 p-3 mb-5 rounded-xl bg-error/10 border border-error/30 overflow-hidden"
                >
                  <span className="material-symbols-outlined text-error text-lg">
                    error
                  </span>
                  <span className="text-body-sm text-error">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {info && !error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="flex items-center gap-2 p-3 mb-5 rounded-xl bg-primary/10 border border-primary/30 overflow-hidden"
                >
                  <span className="material-symbols-outlined text-primary text-lg">
                    info
                  </span>
                  <span className="text-body-sm text-on-surface">{info}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── STEP CONTENT ─── */}
            <AnimatePresence mode="wait">
              {/* ═══════ Step 1: Email ═══════ */}
              {step === 1 && (
                <motion.form
                  key="step1"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  onSubmit={handleSendOtp}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <label className="block text-label-mono text-on-surface-variant ml-1 uppercase">
                      Email ID
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">
                        mail
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@company.com"
                        required
                        className="w-full h-12 bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary focus:border-transparent rounded-xl pl-12 pr-4 font-body-md text-on-surface placeholder-outline-variant transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl font-bold bg-primary text-on-primary shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">
                          sync
                        </span>
                        Sending…
                      </>
                    ) : (
                      <>
                        <span>Send Verification Code</span>
                        <span className="material-symbols-outlined text-lg">
                          arrow_forward
                        </span>
                      </>
                    )}
                  </button>
                </motion.form>
              )}

              {/* ═══════ Step 2: OTP ═══════ */}
              {step === 2 && (
                <motion.form
                  key="step2"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  onSubmit={handleVerifyOtp}
                  className="space-y-5"
                >
                  <div
                    className="flex items-center justify-center gap-2"
                    onPaste={handleOtpPaste}
                  >
                    {otp.map((digit, i) => (
                      <motion.input
                        key={i}
                        ref={(el) => (otpRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        aria-label={`Digit ${i + 1}`}
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: i * 0.05, duration: 0.25 }}
                        className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary outline-none transition-colors text-on-surface"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl font-bold bg-primary text-on-primary shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">
                          sync
                        </span>
                        Verifying…
                      </>
                    ) : (
                      <>
                        <span>Verify Code</span>
                        <span className="material-symbols-outlined text-lg">
                          check
                        </span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between">
                    <div className="text-body-sm text-on-surface-variant">
                      {cooldown > 0 ? (
                        <span>
                          Resend in{" "}
                          <span className="text-primary font-bold">
                            {cooldown}s
                          </span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={isLoading}
                          className="text-primary font-medium hover:brightness-110 disabled:opacity-60 transition-all"
                        >
                          Resend Code
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      className="text-body-sm text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">
                        arrow_back
                      </span>
                      Different email
                    </button>
                  </div>
                </motion.form>
              )}

              {/* ═══════ Step 3: New Password ═══════ */}
              {step === 3 && (
                <motion.form
                  key="step3"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  onSubmit={handleResetPassword}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <label className="block text-label-mono text-on-surface-variant ml-1 uppercase">
                      New Password
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">
                        lock
                      </span>
                      <input
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        required
                        minLength={8}
                        className="w-full h-12 bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary focus:border-transparent rounded-xl pl-12 pr-12 font-body-md text-on-surface placeholder-outline-variant transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew((s) => !s)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {showNew ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                    <p className="text-[10px] text-on-surface-variant/50 ml-1">
                      Min 8 characters with a number and symbol
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-label-mono text-on-surface-variant ml-1 uppercase">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">
                        lock_reset
                      </span>
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        required
                        minLength={8}
                        className={`w-full h-12 bg-surface-container-lowest border focus:ring-2 focus:ring-primary focus:border-transparent rounded-xl pl-12 pr-12 font-body-md text-on-surface placeholder-outline-variant transition-all ${
                          confirmPassword && newPassword !== confirmPassword
                            ? "border-error/60 ring-1 ring-error/20"
                            : "border-outline-variant/50"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((s) => !s)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {showConfirm ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-[10px] text-error ml-1 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[12px]">
                          error
                        </span>
                        Passwords do not match
                      </motion.p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl font-bold bg-primary text-on-primary shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">
                          sync
                        </span>
                        Resetting…
                      </>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <span className="material-symbols-outlined text-lg">
                          arrow_forward
                        </span>
                      </>
                    )}
                  </button>
                </motion.form>
              )}

              {/* ═══════ Step 4: Success ═══════ */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center py-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 16 }}
                    className="mx-auto w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-5"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.15,
                        type: "spring",
                        stiffness: 300,
                        damping: 12,
                      }}
                      className="material-symbols-outlined text-emerald-400 text-5xl"
                    >
                      check_circle
                    </motion.span>
                  </motion.div>

                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl font-bold mb-1 text-on-surface"
                  >
                    Password reset successful
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-body-sm text-on-surface-variant mb-6"
                  >
                    Redirecting to login in 3 seconds…
                  </motion.p>

                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    type="button"
                    onClick={() => navigate("/login")}
                    className="w-full h-12 rounded-xl font-bold bg-primary text-on-primary shadow-lg shadow-primary/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Go to Login</span>
                    <span className="material-symbols-outlined text-lg">
                      arrow_forward
                    </span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Footer link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-8 text-body-sm text-on-surface-variant"
          >
            Remember your password?{" "}
            <Link
              to="/login"
              className="text-primary font-bold hover:text-on-primary-container transition-colors"
            >
              Back to login
            </Link>
          </motion.p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
