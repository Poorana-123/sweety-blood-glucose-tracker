import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    
const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    console.log("Login form data:", formData);

    try {
        const response = await API.post("/auth/login", formData);

        console.log("Login API response:", response.data);

        localStorage.setItem("token", response.data.token);

        if (response.data.user) {
            localStorage.setItem(
                "user",
                JSON.stringify(response.data.user)
            );
        }

        navigate("/dashboard");

    } catch (err) {
        console.log("Login error status:", err.response?.status);
        console.log("Login error response:", err.response?.data);

        setError(
            err.response?.data?.message ||
            "Login failed. Please check your credentials."
        );
    }
};


    return (
        <div className="auth-container">

            <div className="auth-card">

                <h1>Sweety</h1>

                <p className="subtitle">
                    Welcome back! Manage your glucose readings.
                </p>

                <h2>Login</h2>

                {error && <p className="error">{error}</p>}

                <form onSubmit={handleSubmit}>

                    <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <button type="submit">
                        Login
                    </button>

                </form>

                <p className="auth-link">
                    Don't have an account?
                    <Link to="/register"> Register</Link>
                </p>

            </div>

        </div>
    );
}

export default Login;