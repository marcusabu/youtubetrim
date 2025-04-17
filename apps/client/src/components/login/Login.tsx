import { FormEvent, useContext, useEffect, useState } from "react";
import { AuthContext } from "@/providers/AuthProvider";
import { trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";

const Login = () => {
  const { saveToken } = useContext(AuthContext);

  const [password, setPassword] = useState("");
  const { mutate: login, data } = useMutation(trpc.auth.login.mutationOptions());

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    login({ password });
  };

  useEffect(() => {
    if (data?.success && "secretKey" in data && data.secretKey) {
      saveToken(data.secretKey);
    }
  }, [data]);

  return (
    <div className="flex h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="w-72">
        <input
          type="password"
          placeholder="Password"
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded border p-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
        />
      </form>
    </div>
  );
};

export default Login;
