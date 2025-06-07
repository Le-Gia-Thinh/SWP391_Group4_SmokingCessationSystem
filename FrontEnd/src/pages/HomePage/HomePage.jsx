// src/pages/HomePage.jsx
import React, { useEffect } from "react";
import Navbar from "../../layouts/Navbar";
import "./HomePage.css";
import { Button } from "antd";
import { Link } from "react-router-dom";

const HomePage = () => {
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (token) {
            localStorage.setItem("token", token);
            window.history.replaceState(null, "", "/home");
        }
    }, []);

    return (
        <div className="homepage">
            <Navbar />

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-text">
                    <h1><span className="highlight">Healthy</span> living</h1>
                    <p className="slogan">made easy!!</p>
                    <p className="subtext">
                        Get your custom plans &<br />
                        one-on-one guidance from our experts
                    </p>

                    <Link to="/login">
                        <Button className="hero-btn" type="primary" size="large">
                            Sign in
                        </Button>
                    </Link>

                    <p className="below-button-text">Sign in & get started today</p>
                </div>
                <div className="hero-video">
                    {/* Video placeholder */}
                    Add video here
                </div>
            </section>

            {/* Benefits Section */}
            <section className="benefits-section">
                <h2 className="section-title">Why cai nghiện</h2>
                <div className="benefits-container">
                    <ul className="benefits-list">
                        <li>Improved physical health</li>
                        <li>Better mental health</li>
                        <li>Increased longevity</li>
                        <li>Weight management</li>
                        <li>Improved self-confidence</li>
                        <li>Reduced stress</li>
                    </ul>
                    <div className="benefits-images">
                        {/* Khi có ảnh thật, đổi src="" thành đường dẫn */}
                        <img src="" alt="Meditation placeholder" className="benefits-img" />
                        <img src="" alt="Healthy Eating placeholder" className="benefits-img" />
                        <img src="" alt="Fitness placeholder" className="benefits-img" />
                    </div>
                </div>
            </section>

            {/* Plans Section */}
            <section className="plans-section">
                <h2 className="section-title">We have plans for</h2>
                <ul className="plans-list">
                    <li>co ban</li>
                    <li>nang cao</li>
                    <li>hard core</li>
                </ul>
            </section>

            {/* Steps Section */}
            <section className="steps-section">
                <h2 className="section-title">Your Quit Journey</h2>
                <ol className="steps-list">
                    <li><strong>Find your motivation to quit:</strong> Discover the personal reasons that matter most to you.</li>
                    <li><strong>Start a personalized quit plan:</strong> Create your 7-day Quit Plan tailored to your lifestyle.</li>
                    <li><strong>Track your smoke-free progress:</strong> Monitor your smoke-free days, money saved, and health gains.</li>
                    <li><strong>Build your own quit journey:</strong> Customize your journey by saving tips and rewards.</li>
                </ol>
            </section>

            {/* SignUp Banner */}
            <section className="signup-banner">
                <h3>Muốn kế hoạch cai thuốc ko?</h3>
                <Button className="signup-btn" type="primary" size="large">
                    Sign in today
                </Button>
            </section>

            {/* Category Section */}
            <section className="category-section">
                <h2 className="section-title">What is a phoi khoe for you?</h2>
                <ul className="category-list">
                    <li>Diet tracker</li>
                    <li>Best nutrition advice</li>
                    <li>Exercise portal</li>
                    <li>Meal planner</li>
                    <li>Recipes database</li>
                    <li>One stop shop for nutrition</li>
                    <li>Community</li>
                </ul>
            </section>

            {/* Footer */}
            <footer className="footer">
                <p>&copy; {new Date().getFullYear()} QuitSmoking. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default HomePage;
