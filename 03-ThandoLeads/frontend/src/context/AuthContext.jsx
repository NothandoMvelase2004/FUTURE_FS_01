import {
    createContext,
    useContext,
    useState
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(() => {
        try {
            const savedUser = sessionStorage.getItem("user");
            return savedUser ? JSON.parse(savedUser) : null;
        } catch {
            return null;
        }
    });

    const login = async (email, password) => {

        const response = await api.post("/auth/login", {
            email,
            password
        });

        const { token, user } = response.data;

        sessionStorage.setItem("token", token);
        sessionStorage.setItem("user", JSON.stringify(user));

        setUser(user);

        return response.data;
    };

    const register = async (
        username,
        email,
        password,
        registrationKey
    ) => {

        const response = await api.post("/auth/register", {
            username,
            email,
            password,
            registrationKey
        });

        return response.data;
    };

    const logout = () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                register,
                logout,
                isAuthenticated:
                    Boolean(user && sessionStorage.getItem("token"))
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
};