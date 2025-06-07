import React, { useEffect } from "react";
import { Button, Row, Col, Typography, Card, Collapse, List, Avatar, Layout, Space, Tag } from "antd";
import { AimOutlined, SolutionOutlined, UserSwitchOutlined, CheckCircleOutlined } from "@ant-design/icons";
import Navbar from "../../layouts/Navbar";
import { Link } from "react-router-dom";

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;
const { Footer } = Layout;

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
        <div className="homepage" style={{ fontFamily: "Segoe UI, sans-serif" }}>
            <Navbar />

            {/* Hero Section */}
            <section style={{ padding: "80px 40px", background: "#f9fff9" }}>
                <Row gutter={[40, 40]} align="middle" justify="space-between">
                    <Col xs={24} md={12}>
                        <Title level={1}>
                            <span style={{ color: "#d22f2f" }}>Healthy</span> living
                        </Title>
                        <Title level={3} style={{ marginTop: -10 }}>made easy!!</Title>
                        <Paragraph>
                            Get your custom plans & one-on-one guidance from our experts.
                        </Paragraph>
                        <Link to="/login">
                            <Button type="primary" size="large" style={{ backgroundColor: "#4bac4f", borderColor: "#4bac4f" }}>
                                Sign in
                            </Button>
                        </Link>
                        <Paragraph type="secondary" style={{ marginTop: 8 }}>
                            Sign in & get started today
                        </Paragraph>
                    </Col>
                    <Col xs={24} md={10}>
                        <Card style={{ textAlign: "center", padding: "40px", border: "2px dashed #ccc" }}>
                            <Text strong>Add video</Text>
                        </Card>
                    </Col>
                </Row>
            </section>

            {/* Features Section */}
            <section style={{ padding: "60px 40px", background: "#fff" }}>
                <Title level={2} style={{ textAlign: "center" }}>Why Join Us?</Title>
                <Row gutter={[24, 24]} justify="center">
                    <Col xs={24} sm={12} md={8}>
                        <Card hoverable>
                            <AimOutlined style={{ fontSize: "32px", color: "#4bac4f" }} />
                            <Title level={4}>Track Your Smoking Habits</Title>
                            <Paragraph>Log the number of cigarettes, frequency, and daily costs easily.</Paragraph>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Card hoverable>
                            <SolutionOutlined style={{ fontSize: "32px", color: "#4bac4f" }} />
                            <Title level={4}>Create a Personalized Quit Plan</Title>
                            <Paragraph>Tailored based on your addiction level (FTND score) and lifestyle.</Paragraph>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Card hoverable>
                            <UserSwitchOutlined style={{ fontSize: "32px", color: "#4bac4f" }} />
                            <Title level={4}>Expert Coaching Support</Title>
                            <Paragraph>Connect with certified quit-smoking coaches for personalized help.</Paragraph>
                        </Card>
                    </Col>
                </Row>
            </section>

            {/* Leaderboard */}
            <section style={{ padding: "60px 40px", background: "#f9fff9" }}>
                <Title level={2} style={{ textAlign: "center" }}>Top Members Leaderboard</Title>
                <Paragraph style={{ textAlign: "center" }}>
                    Meet those who have successfully quit smoking and became inspirations!
                </Paragraph>
                <List
                    itemLayout="horizontal"
                    dataSource={[
                        { name: "Alex Johnson", days: 120 },
                        { name: "Maria Chen", days: 90 },
                        { name: "David Kim", days: 70 },
                    ]}
                    renderItem={(item) => (
                        <List.Item>
                            <List.Item.Meta
                                avatar={<Avatar icon={<CheckCircleOutlined style={{ color: "#4bac4f" }} />} />}
                                title={<Text strong>{item.name}</Text>}
                                description={`${item.days} days smoke-free`}
                            />
                        </List.Item>
                    )}
                />
            </section>

            {/* Membership Plans */}
            <section style={{ padding: "60px 40px", background: "#fff" }}>
                <Title level={2} style={{ textAlign: "center" }}>Membership Plans</Title>
                <Row gutter={[24, 24]} justify="center">
                    <Col xs={24} sm={12} md={8}>
                        <Card title="1 Month" bordered>
                            <Tag color="green">Beginner</Tag>
                            <Paragraph>Great for starting your smoke-free journey.</Paragraph>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Card title="3 Months" bordered>
                            <Tag color="cyan">Committed</Tag>
                            <Paragraph>Stay on track with coaching and tracking.</Paragraph>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Card title="12 Months" bordered>
                            <Tag color="blue">Full Program</Tag>
                            <Paragraph>Comprehensive long-term quit plan and support.</Paragraph>
                        </Card>
                    </Col>
                </Row>
            </section>

            {/* Blog Section */}
            <section style={{ padding: "60px 40px", background: "#f9fff9" }}>
                <Title level={2} style={{ textAlign: "center" }}>Success Stories & Tips</Title>
                <Paragraph style={{ textAlign: "center" }}>
                    Real experiences from ex-smokers and advice from certified professionals.
                </Paragraph>
                <Row justify="center">
                    <Link to="/blog">
                        <Button type="default">Read More</Button>
                    </Link>
                </Row>
            </section>

            {/* FAQ Section */}
            <section style={{ padding: "60px 40px", background: "#fff" }}>
                <Title level={2} style={{ textAlign: "center" }}>Frequently Asked Questions</Title>
                <Collapse accordion style={{ maxWidth: 800, margin: "0 auto" }}>
                    <Panel header="Is quitting painful?" key="1">
                        <Paragraph>It’s manageable with the right plan and support.</Paragraph>
                    </Panel>
                    <Panel header="What does the platform offer?" key="2">
                        <Paragraph>Progress tracking, personalized quit plans, and expert coaching.</Paragraph>
                    </Panel>
                    <Panel header="Can I upgrade my membership?" key="3">
                        <Paragraph>Yes, you can upgrade at any time.</Paragraph>
                    </Panel>
                </Collapse>
            </section>

            {/* Footer */}
            <Footer style={{ backgroundColor: "#4bac4f", color: "white", textAlign: "center" }}>
                <Space direction="vertical">
                    <Text>© 2025 QuitSmoking. All rights reserved.</Text>
                    <Space>
                        <Link to="/terms" style={{ color: "white" }}>Terms</Link>
                        <Link to="/privacy" style={{ color: "white" }}>Privacy Policy</Link>
                        <Link to="/contact" style={{ color: "white" }}>Contact</Link>
                    </Space>
                </Space>
            </Footer>
        </div>
    );
};

export default HomePage;
