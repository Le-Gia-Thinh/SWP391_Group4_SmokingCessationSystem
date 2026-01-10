import React, { useEffect, useRef } from 'react';
import $ from 'jquery';
import 'owl.carousel/dist/assets/owl.carousel.css';
import 'owl.carousel/dist/assets/owl.theme.default.css';
import AOS from 'aos';
import 'aos/dist/aos.css'; // Import AOS CSS
import './RoadmapCarousel.css';

const RoadmapCarousel = ({ roadmapItems }) => {
    const carouselRef = useRef(null);
    window.$ = window.jQuery = $;

    useEffect(() => {
        // Nạp plugin owl.carousel sau khi jQuery có sẵn
        import('owl.carousel').then(() => {
            const $carousel = $(carouselRef.current);

            $carousel.owlCarousel({
                autoplay: true,
                smartSpeed: 1000,
                center: false,
                margin: 25,
                loop: true,
                dots: false,
                nav: true,
                navText: ['<span class="bi bi-arrow-left"></span>', '<span class="bi bi-arrow-right"></span>'],
                responsive: {
                    0: { items: 1 },
                    576: { items: 2 },
                    768: { items: 3 },
                    992: { items: 4 },
                    1200: { items: 5 },
                },
            });
        });

        // Cleanup khi unmount
        return () => {
            const $carousel = $(carouselRef.current);
            if ($carousel.data('owl.carousel')) $carousel.trigger('destroy.owl.carousel');
        };
    }, []);

    // Khởi tạo AOS
    useEffect(() => {
        AOS.init({
            duration: 2000,
            once: true,
            offset: 100,
        });

        return () => {
            AOS.refresh();
        };
    }, []);

    return (
        <div className="container-xxl py-5">
            <div className="container">
                <div
                    className="text-center mx-auto aos-item"
                    data-aos="fade-up"
                    data-aos-delay="100"
                    style={{ maxWidth: 500 }}
                >
                    <h1 className="display-6 section-title bg-white text-center text-primary px-3">Roadmap</h1>
                    <p className="text-primary fs-5 mb-5">Chúng tôi sẽ luôn đồng hành cùng bạn</p>
                </div>

                <div ref={carouselRef} className="owl-carousel roadmap-carousel aos-item" data-aos="fade-up" data-aos-delay="1000">
                    {roadmapItems.map((item, index) => (
                        <div key={index} className="roadmap-item">
                            <div className="roadmap-point">
                                <span></span>
                            </div>
                            <h5>{item.title}</h5>
                            <span>{item.desc}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RoadmapCarousel;
