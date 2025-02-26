import { AuthForm } from "@/components/authForm";

const Login = () => {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <AuthForm register={false} />
      </div>
    </div>
  );
};

export default Login;
