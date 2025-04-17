import { createContext, PropsWithChildren, useEffect, useState } from "react";
import Login from "../components/login/Login";

interface AuthContext {
  token: null | string;
  saveToken: (token: string) => void;
}

export const AuthContext = createContext<AuthContext>({
  token: null,
  saveToken: () => {},
});

const AuthProvider = ({ children }: PropsWithChildren) => {
  const [token, setToken] = useState<null | string>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken !== null) {
      setToken(storedToken);
    }
  }, []);

  const saveToken = (token: string) => {
    localStorage.setItem("token", token);
    setToken(token);
  };

  return (
    <AuthContext.Provider value={{ token, saveToken }}>{token === null ? <Login /> : children}</AuthContext.Provider>
  );
};

export default AuthProvider;
