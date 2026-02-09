import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

// Define the User interface based on the API spec + our needs
export interface User {
    id: number;
    google_id: string;
    email: string;
    name: string;
    // We might store a derived picture URL if we get one, or just use initials
    picture?: string;
    isGuest?: boolean;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
    loginAsGuest: (nickname: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Check for existing session
        const storedToken = localStorage.getItem("sessionToken");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse stored user", e);
                localStorage.removeItem("sessionToken");
                localStorage.removeItem("user");
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (googleToken: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token: googleToken }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Login failed");
            }

            const data = await response.json();

            // Store user and token
            // The API returns { user: { ... }, sessionToken: "..." }
            if (data.user && data.sessionToken) {
                // Enhance user object with picture if included in the Google token (would need decoding)
                // For now, we rely on what the server sends back. 
                // If we want the picture, we might need to parse the ID token here on the client too,
                // or update the backend to send it. For now, let's stick to the server response.
                localStorage.setItem("sessionToken", data.sessionToken);
                localStorage.setItem("user", JSON.stringify(data.user));
                setUser(data.user);

                // Navigate to dashboard
                navigate("/coaches");
            } else {
                throw new Error("Invalid response from server");
            }

        } catch (error) {
            console.error("Login error:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };


    const loginAsGuest = async (nickname: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/guest-login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ nickname }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Guest login failed");
            }

            const data = await response.json();

            if (data.user && data.sessionToken) {
                const userWithGuestFlag = { ...data.user, isGuest: true };
                localStorage.setItem("sessionToken", data.sessionToken);
                localStorage.setItem("user", JSON.stringify(userWithGuestFlag));
                setUser(userWithGuestFlag);
                navigate("/coaches");
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (error) {
            console.error("Guest login error:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem("sessionToken");
        localStorage.removeItem("user");
        setUser(null);
        navigate("/");
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, loginAsGuest, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
