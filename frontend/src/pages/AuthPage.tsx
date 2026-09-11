import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button, Form } from "@heroui/react";
import { useGoogleLogin } from "@react-oauth/google";

import { GoogleIcon } from "@/assets/icons";
import { loginApi, registerApi, googleAuthApi } from "@/api/auth.api";
import { useAuth } from "@/contexts/AuthContext";

interface AuthPageProps {
  mode: "login" | "signup";
}

const AuthPage: React.FC<AuthPageProps> = ({ mode }) => {
  const isSignUp = mode === "signup";

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchParams] = useSearchParams();

  const { setCredentials } = useAuth();
  const navigate = useNavigate();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const validate = (): boolean => {
    if (!email.trim()) {
      setFormError("Email is required.");

      return false;
    }
    if (!password || password.length < 6) {
      setFormError("Password must be at least 6 characters.");

      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = isSignUp
        ? await registerApi({ email, password })
        : await loginApi({ email, password });

      setCredentials(result);
      navigate("/home", { replace: true });
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message ??
          "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    scope: "openid email profile",
    onSuccess: async (tokenResponse) => {
      setFormError(null);
      setIsLoading(true);
      try {
        const result = await googleAuthApi(tokenResponse.access_token);

        setCredentials(result);
        navigate("/home", { replace: true });
      } catch (err: any) {
        console.error("Google backend auth failed:", err);
        setFormError(
          err?.response?.data?.message ??
            "Google sign-in failed. Please try again or use email.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.error("Google OAuth failed:", errorResponse);
      setFormError(
        errorResponse.error_description ??
          "Google sign-in failed. Please try again or use email.",
      );
    },
    onNonOAuthError: (nonOAuthError) => {
      console.error("Google sign-in popup failed:", nonOAuthError);
      setFormError(
        nonOAuthError.type === "popup_closed"
          ? "Google sign-in was closed before it finished."
          : "Google sign-in popup could not open. Please disable popup blockers and try again.",
      );
    },
  });

  const startGoogleLogin = () => {
    setFormError(null);

    if (!googleClientId) {
      setFormError("Google sign-in is not configured for this app.");
      return;
    }

    handleGoogleLogin();
  };

  return (
    <main className="grid min-h-screen md:grid-cols-2">
      <section className="flex flex-col items-center justify-center px-8 py-12 bg-white">
        <div className="w-full max-w-sm mb-4">
          <div className="flex flex-col items-start justify-between">
            <video
              aria-label="Not-lify bee animation"
              className="h-8 w-8"
              src="/icons8-bee.gif"
            >
              <track default kind="captions" src="/icons8-bee.vtt" />
            </video>
            <h1 className="text-xl font-semibold text-gray-600">Not-lify</h1>
          </div>
        </div>

        <div className="flex flex-col items-start justify-start w-full max-w-sm">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            {isSignUp
              ? "Sign up and start taking notes — free forever."
              : "Sign in to continue to your notes."}
          </p>

          {searchParams.get("error") && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-5">
              <AlertCircle className="shrink-0" size={16} />
              Google sign-in failed. Please try again or use email.
            </div>
          )}

          <Button
            className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-xl bg-white text-gray-700 text-sm font-medium py-2.5 transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm cursor-pointer"
            isDisabled={isLoading}
            onPress={startGoogleLogin}
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          <div className="flex justify-center items-center my-6">
            <span className="text-sm text-gray-400 whitespace-nowrap">
              or continue with email
            </span>
          </div>

          {formError && (
            <div
              aria-live="polite"
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4 w-full"
            >
              <AlertCircle className="mt-0.5 shrink-0" size={16} />
              <span>{formError}</span>
            </div>
          )}

          <Form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="relative w-full">
              <label className="sr-only" htmlFor="email">
                Email
              </label>
              <input
                required
                className="w-full border border-gray-200 shadow-sm rounded-md bg-white hover:border-gray-300 focus:border-gray-500 focus:ring-1 focus:ring-gray-300 outline-none p-2"
                id="email"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFormError(null);
                  setEmail(e.target.value);
                }}
              />
            </div>

            <div className="relative w-full">
              <label className="sr-only" htmlFor="password">
                Password
              </label>
              <input
                required
                className="w-full border border-gray-200 shadow-sm rounded-md bg-white hover:border-gray-300 focus:border-gray-500 focus:ring-1 focus:ring-gray-300 outline-none p-2 pr-11"
                id="password"
                placeholder={
                  isSignUp ? "At least 6 characters" : "Your password"
                }
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFormError(null);
                  setPassword(e.target.value);
                }}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                type="button"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {!isSignUp && (
              <div className="text-right mt-1.5">
                <a
                  className="text-xs text-gray-500 hover:text-gray-800 hover:underline transition-colors"
                  href="mailto:support@not-lify.com?subject=Password reset"
                >
                  Forgot password?
                </a>
              </div>
            )}

            <Button
              className="w-full rounded-md py-2.5 bg-green-600 text-white text-sm font-semibold shadow-sm transition-all duration-150 hover:bg-green-600/85 hover:shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              isDisabled={isLoading}
              type="submit"
            >
              {isLoading && <Loader2 className="animate-spin" size={15} />}
              {isSignUp ? "Create account" : "Sign in"}
            </Button>
          </Form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <Link
              className="text-gray-800 font-semibold hover:underline"
              to={isSignUp ? "/auth/login" : "/auth/signup"}
            >
              {isSignUp ? "Sign in" : "Sign up free"}
            </Link>
          </p>

          {isSignUp && (
            <p className="text-center text-xs text-gray-400 leading-relaxed mt-4">
              By signing up you agree to our{" "}
              <Link className="underline hover:text-gray-600" to="/terms">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link className="underline hover:text-gray-600" to="/privacy">
                Privacy Policy
              </Link>
              .
            </p>
          )}
        </div>
      </section>

      <section className="hidden md:flex flex-col items-center justify-center bg-gray-50 px-12 py-16 border-l border-gray-100">
        <img
          alt="Illustration of a person organising notes"
          className="w-full max-w-md"
          src="/illustrations/login-illustration.svg"
        />
        <div className="mt-10 text-center max-w-sm">
          <h2 className="text-2xl font-bold text-gray-900 leading-snug">
            Your second mind, always ready.
          </h2>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            Capture thoughts, ideas, and tasks in seconds. Not-lify keeps
            everything organised so you never lose a good idea again.
          </p>
        </div>
      </section>
    </main>
  );
};

export default AuthPage;
