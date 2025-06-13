import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const PrevArrow = ({ onClick }) => (
    <button className="slick-arrow slick-prev" onClick={onClick}>‹</button>
);
const NextArrow = ({ onClick }) => (
    <button className="slick-arrow slick-next" onClick={onClick}>›</button>
);

const RegistrationCarousel = ({ images }) => {
    const settings = {
        infinite: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
        speed: 600,
        fade: true,                // cross-fade effect
        arrows: true,
        dots: true,
        prevArrow: <PrevArrow />,
        nextArrow: <NextArrow />,
    };

    return (
        <div className="registration-carousel">
            <Slider {...settings}>
                {images.map((src, idx) => (
                    <div key={idx}>
                        <img src={src}
                            alt={`Slide ${idx + 1}`}
                            className="carousel-img" />
                    </div>
                ))}
            </Slider>
        </div>
    );
};

export default RegistrationCarousel;
