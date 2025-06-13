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

            // Optional: remove token from URL to make it clean
            window.history.replaceState(null, "", "/home");
        }
    }, []);

    return (
        <div className="homepage">
            <Navbar />

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
                    <h2>Add video</h2>
                    {/* You can embed <iframe> or <video> here later */}
                </div>
            </section>
        </div>
    );
};

export default HomePage;
