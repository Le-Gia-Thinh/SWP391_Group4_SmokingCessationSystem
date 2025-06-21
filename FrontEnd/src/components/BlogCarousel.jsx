import React, { useRef } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Card, Typography, Badge, Button } from "antd";
import { RightOutlined } from "@ant-design/icons";
import fitnessImg from "../assets/fitness.jpg";

const { Title, Paragraph } = Typography;

const posts = [
    { date: "20 May", title: "Healthy Habits", text: "Learn simple habits…", img: fitnessImg },
    { date: "05 Jun", title: "Nutrition Tips", text: "Top nutrition advice…", img: fitnessImg },
    { date: "10 Apr", title: "Diet, Fitness", text: "Get all the protein…", img: fitnessImg },
];

export default function BlogCarousel() {
    const sliderRef = useRef(null);
    const settings = {
        infinite: true,
        centerMode: true,
        slidesToShow: 3,
        initialSlide: 1,
        centerPadding: "0px",
        speed: 500,
        arrows: true,
        dots: false,
        responsive: [ /* … */],
    };

    const goToLast = () => {
        if (sliderRef.current) {
            sliderRef.current.slickGoTo(posts.length - 1);
        }
    };
    return (
        <section className="blog-section">
            <div className="container">
                <Title level={2} style={{ textAlign: "center" }}>
                    Bài viết nổi bật
                </Title>
                <Paragraph style={{ textAlign: "center", marginBottom: 48 }}>
                    Cập nhật những kiến thức và mẹo hay từ đội ngũ chuyên gia của chúng tôi.
                </Paragraph>

                <div className="blog-carousel">
                    <Slider ref={sliderRef} {...settings}>
                        {posts.map((post, idx) => (
                            <div key={idx} className="blog-slide">
                                <Badge.Ribbon text={post.date} color="red" placement="end">
                                    <Card
                                        hoverable
                                        cover={
                                            <img
                                                src={post.img}
                                                alt={post.title}
                                                style={{ height: 200, objectFit: "cover" }}
                                            />
                                        }
                                        actions={[
                                            <Button type="link" key="view">
                                                Xem chi tiết <RightOutlined />
                                            </Button>,
                                        ]}
                                    >
                                        <Card.Meta
                                            title={<strong>{post.title}</strong>}
                                            description={post.text}
                                        />
                                    </Card>
                                </Badge.Ribbon>
                            </div>
                        ))}
                    </Slider>
                </div>
            </div>
        </section>
    );
}