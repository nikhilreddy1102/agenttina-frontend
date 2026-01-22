import AuthCard from "../components/auth/AuthCard";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 px-4">
      <AuthCard variant="login" />
    </div>
  );
}
