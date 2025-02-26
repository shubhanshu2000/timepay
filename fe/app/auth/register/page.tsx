import { AuthForm } from "@/components/authForm";

const Register = () => {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <AuthForm register={true} />
      </div>
    </div>
  );
};

export default Register;
