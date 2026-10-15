// import React, { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";

// const Login = () => {
//   const navigate = useNavigate();
//   const { login } = useAuth();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setError("");
//     try {
//       await login(email, password);
//       navigate("/chat");
//     } catch (err) {
//       setError(err.message || "Invalid email or password");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-background text-on-surface font-body-md flex overflow-hidden">
//       {/* ─── Layer 1: Branding ─── */}
//       <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 xl:p-16 overflow-hidden">
//         {/* Ambient background */}
//         <div className="absolute inset-0 z-0">
//           <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(79,70,229,0.18),transparent_60%)]" />
//           <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-primary/8 rounded-full blur-[100px] animate-pulse-slow" />
//           <div
//             className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-secondary/8 rounded-full blur-[80px] animate-pulse-slow"
//             style={{ animationDelay: "2s" }}
//           />
//         </div>

//         {/* Top: Logo */}
//         <div className="relative z-10">
//           <button
//             type="button"
//             onClick={() => navigate(-1)}
//             className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-on-surface-variant"
//           >
//             <span className="material-symbols-outlined text-base">
//               arrow_back
//             </span>
//             <span>Back</span>
//           </button>
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
//               <span className="material-symbols-outlined text-background text-2xl font-bold">
//                 database
//               </span>
//             </div>
//             <span className="font-headline-md text-2xl font-bold tracking-tighter text-on-surface">
//               AskDB
//             </span>
//           </div>
//         </div>

//         {/* Center: Value prop */}
//         <div className="relative z-10 max-w-md">
//           <h1 className="font-display-lg text-5xl xl:text-6xl headline-tracking text-on-surface mb-6 leading-[1.05]">
//             Query Your Data in{" "}
//             <span className="text-primary italic">Plain English</span>
//           </h1>
//           <p className="text-lg text-on-surface-variant/80 leading-relaxed mb-10">
//             Transform natural language into read-only SQL. Secure, scalable
//             orchestration for modern data teams.
//           </p>
//           <div className="flex flex-col gap-4">
//             {[
//               { icon: "translate", label: "Natural Language to SQL" },
//               { icon: "verified_user", label: "Enterprise-Grade Security" },
//               { icon: "hub", label: "Multi-Agent Intelligence" },
//             ].map((item, i) => (
//               <div key={i} className="flex items-center gap-3">
//                 <div className="w-8 h-8 bg-primary-container/20 rounded-lg flex items-center justify-center border border-primary/20">
//                   <span className="material-symbols-outlined text-primary text-sm">
//                     {item.icon}
//                   </span>
//                 </div>
//                 <span className="text-sm font-medium text-on-surface-variant">
//                   {item.label}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Bottom: Status */}
//         <div className="relative z-10 flex items-center gap-2">
//           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
//           <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant/60">
//             All Systems Operational
//           </span>
//         </div>
//       </div>

//       {/* ─── Layer 2: Form ─── */}
//       <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
//         <div className="absolute inset-0 lg:hidden">
//           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,0.12),transparent_60%)]" />
//         </div>

//         <div className="w-full max-w-md relative z-10">
//           {/* Mobile logo */}
//           <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
//             <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
//               <span className="material-symbols-outlined text-background text-2xl font-bold">
//                 database
//               </span>
//             </div>
//             <span className="font-headline-md text-2xl font-bold tracking-tighter text-on-surface">
//               AskDB
//             </span>
//           </div>

//           <div className="glass-card p-8 md:p-10 rounded-[2rem] border-white/10 shadow-2xl">
//             <div className="mb-8">
//               <h2 className="font-headline-lg text-3xl headline-tracking text-on-surface mb-2">
//                 Welcome Back
//               </h2>
//               <p className="text-on-surface-variant text-sm">
//                 Enter your credentials to access your workspace.
//               </p>
//             </div>

//             <form onSubmit={handleSubmit} className="space-y-5">
//               {/* Email */}
//               <div className="space-y-2">
//                 <label className="block text-label-mono text-on-surface-variant ml-1 uppercase">
//                   Email ID
//                 </label>
//                 <div className="relative">
//                   <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">
//                     mail
//                   </span>
//                   <input
//                     type="email"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     placeholder="alex@company.com"
//                     required
//                     className="w-full h-12 bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary focus:border-transparent rounded-xl pl-12 pr-4 font-body-md text-on-surface placeholder-outline-variant transition-all"
//                   />
//                 </div>
//               </div>

//               {/* Password */}
//               <div className="space-y-2">
//                 <label className="block text-label-mono text-on-surface-variant ml-1 uppercase">
//                   Password
//                 </label>
//                 <div className="relative">
//                   <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">
//                     lock
//                   </span>
//                   <input
//                     type={showPassword ? "text" : "password"}
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     placeholder="••••••••••••"
//                     required
//                     className="w-full h-12 bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary focus:border-transparent rounded-xl pl-12 pr-12 font-body-md text-on-surface placeholder-outline-variant transition-all"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
//                   >
//                     <span className="material-symbols-outlined text-lg">
//                       {showPassword ? "visibility_off" : "visibility"}
//                     </span>
//                   </button>
//                 </div>
//               </div>

//               {/* Options row */}
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-2">
//                   <input
//                     id="remember"
//                     type="checkbox"
//                     className="w-4 h-4 rounded border-outline-variant/50 text-primary-container focus:ring-primary bg-surface-container-lowest"
//                   />
//                   <label
//                     htmlFor="remember"
//                     className="text-body-sm text-on-surface-variant cursor-pointer"
//                   >
//                     Remember me
//                   </label>
//                 </div>
//                 <Link
//                   to="#"
//                   className="text-body-sm text-primary hover:text-on-primary-container transition-colors font-medium"
//                 >
//                   Forgot password?
//                 </Link>
//               </div>

//               {/* Error */}
//               {error && (
//                 <div className="flex items-center gap-2 p-3 rounded-xl bg-error/10 border border-error/30">
//                   <span className="material-symbols-outlined text-error text-lg">
//                     error
//                   </span>
//                   <span className="text-body-sm text-error">{error}</span>
//                 </div>
//               )}

//               {/* Submit */}
//               <button
//                 type="submit"
//                 disabled={isLoading}
//                 className="w-full h-12 rounded-xl font-bold bg-primary text-on-primary shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//               >
//                 {isLoading ? (
//                   <>
//                     <span className="material-symbols-outlined animate-spin">
//                       sync
//                     </span>
//                     Signing in...
//                   </>
//                 ) : (
//                   <>
//                     <span>Sign In</span>
//                     <span className="material-symbols-outlined text-lg">
//                       arrow_forward
//                     </span>
//                   </>
//                 )}
//               </button>
//             </form>
//           </div>

//           {/* Footer link */}
//           <p className="text-center mt-8 text-body-sm text-on-surface-variant">
//             Don't have an account?{" "}
//             <Link
//               to="/signup"
//               className="text-primary font-bold hover:text-on-primary-container transition-colors"
//             >
//               Create one
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/chat");
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  const leftPanelVariants = {
    hidden: { x: -50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 30,
        delay: 0.1,
      },
    },
  };

  const rightPanelVariants = {
    hidden: { x: 50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 30,
        delay: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { y: 30, opacity: 0, scale: 0.95 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        delay: 0.3,
      },
    },
  };

  const floatingVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [0.3, 0.5, 0.3],
    },
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-background text-on-surface font-body-md flex overflow-hidden"
    >
      {/* ─── Layer 1: Branding ─── */}
      <motion.div
        variants={leftPanelVariants}
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 xl:p-16 overflow-hidden"
      >
        {/* Ambient background */}
        <motion.div {...pulseVariants} className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(79,70,229,0.18),transparent_60%)]" />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/3 right-1/4 w-80 h-80 bg-primary/8 rounded-full blur-[100px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
            className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-secondary/8 rounded-full blur-[80px]"
          />
        </motion.div>

        {/* Top: Logo */}
        <motion.div variants={itemVariants} className="relative z-10">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-base">
              arrow_back
            </span>
            <span>Back</span>
          </motion.button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-background text-2xl font-bold">
                database
              </span>
            </div>
            <span className="font-headline-md text-2xl font-bold tracking-tighter text-on-surface">
              AskDB
            </span>
          </div>
        </motion.div>

        {/* Center: Value prop */}
        <motion.div variants={itemVariants} className="relative z-10 max-w-md">
          <motion.h1
            variants={itemVariants}
            className="font-display-lg text-5xl xl:text-6xl headline-tracking text-on-surface mb-6 leading-[1.05]"
          >
            Query Your Data in{" "}
            <motion.span
              whileHover={{ scale: 1.02 }}
              className="text-primary italic inline-block"
            >
              Plain English
            </motion.span>
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-lg text-on-surface-variant/80 leading-relaxed mb-10"
          >
            Transform natural language into read-only SQL. Secure, scalable
            orchestration for modern data teams.
          </motion.p>
          <motion.div
            variants={containerVariants}
            className="flex flex-col gap-4"
          >
            {[
              { icon: "translate", label: "Natural Language to SQL" },
              { icon: "verified_user", label: "Enterprise-Grade Security" },
              { icon: "hub", label: "Multi-Agent Intelligence" },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ x: 4 }}
                className="flex items-center gap-3"
              >
                <motion.div
                  whileHover={{ rotate: 10 }}
                  className="w-8 h-8 bg-primary-container/20 rounded-lg flex items-center justify-center border border-primary/20"
                >
                  <span className="material-symbols-outlined text-primary text-sm">
                    {item.icon}
                  </span>
                </motion.div>
                <span className="text-sm font-medium text-on-surface-variant">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Bottom: Status */}
        <motion.div
          variants={itemVariants}
          className="relative z-10 flex items-center gap-2"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-2 h-2 bg-emerald-500 rounded-full"
          />
          <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant/60">
            All Systems Operational
          </span>
        </motion.div>
      </motion.div>

      {/* ─── Layer 2: Form ─── */}
      <motion.div
        variants={rightPanelVariants}
        className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative"
      >
        <motion.div
          animate={{
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 lg:hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,0.12),transparent_60%)]" />
        </motion.div>

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <motion.div
            variants={itemVariants}
            className="lg:hidden flex items-center justify-center gap-3 mb-10"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-background text-2xl font-bold">
                database
              </span>
            </motion.div>
            <span className="font-headline-md text-2xl font-bold tracking-tighter text-on-surface">
              AskDB
            </span>
          </motion.div>

          <motion.div
            variants={cardVariants}
            whileHover={{ boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}
            className="glass-card p-8 md:p-10 rounded-[2rem] border-white/10 shadow-2xl"
          >
            <motion.div variants={itemVariants} className="mb-8">
              <motion.h2
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="font-headline-lg text-3xl headline-tracking text-on-surface mb-2"
              >
                Welcome Back
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-on-surface-variant text-sm"
              >
                Enter your credentials to access your workspace.
              </motion.p>
            </motion.div>

            <motion.form
              variants={containerVariants}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Email */}
              <div className="space-y-2">
                <label className="block text-label-mono text-on-surface-variant ml-1 uppercase">
                  {" "}
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
                    placeholder="Email ID"
                    required
                    className="w-full h-12 bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary focus:border-transparent rounded-xl pl-12 pr-4 font-body-md text-on-surface placeholder-outline-variant transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-label-mono text-on-surface-variant ml-1 uppercase">
                  Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">
                    lock
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full h-12 bg-surface-container-lowest border border-outline-variant/50 focus:ring-2 focus:ring-primary focus:border-transparent rounded-xl pl-12 pr-12 font-body-md text-on-surface placeholder-outline-variant transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Options row */}
              <motion.div
                variants={itemVariants}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <motion.input
                    whileHover={{ scale: 1.1 }}
                    id="remember"
                    type="checkbox"
                    className="w-4 h-4 rounded border-outline-variant/50 text-primary-container focus:ring-primary bg-surface-container-lowest"
                  />
                  <label
                    htmlFor="remember"
                    className="text-body-sm text-on-surface-variant cursor-pointer"
                  >
                    Remember me
                  </label>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="#"
                    className="text-body-sm text-primary hover:text-on-primary-container transition-colors font-medium"
                  >
                    Forgot password?
                  </Link>
                </motion.div>
              </motion.div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-error/10 border border-error/30"
                  >
                    <span className="material-symbols-outlined text-error text-lg">
                      error
                    </span>
                    <span className="text-body-sm text-error">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl font-bold bg-primary text-on-primary shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="material-symbols-outlined"
                    >
                      sync
                    </motion.span>
                    Signing in...
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="material-symbols-outlined text-lg"
                    >
                      arrow_forward
                    </motion.span>
                  </>
                )}
              </motion.button>
            </motion.form>
          </motion.div>

          {/* Footer link */}
          <motion.p
            variants={itemVariants}
            className="text-center mt-8 text-body-sm text-on-surface-variant"
          >
            Don't have an account?{" "}
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block"
            >
              <Link
                to="/signup"
                className="text-primary font-bold hover:text-on-primary-container transition-colors"
              >
                Create one
              </Link>
            </motion.span>
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Login;
