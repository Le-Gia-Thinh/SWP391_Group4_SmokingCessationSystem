// src/pages/Payment/CreditCard.jsx
import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Cards from "react-credit-cards";
import "react-credit-cards/es/styles-compiled.css";
import "./CreditCard.css"; // nếu bạn có custom CSS thêm

const CreditCard = () => {
    const [number, setNumber] = useState("");
    const [name, setName] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");
    const [focused, setFocused] = useState("");

    const handleInputFocus = (e) => {
        setFocused(e.target.name);
    };

    return (
        <div className="credit-card-container">
            {/* Thư viện tự tạo thẻ, bạn chỉ cần đặt <Cards> ở đây */}
            <Cards
                number={number}
                name={name}
                expiry={expiry}
                cvc={cvc}
                focused={focused}
            />

            <form className="mt-4">
                <div className="mb-3">
                    <label htmlFor="number" className="form-label">
                        Card Number
                    </label>
                    <input
                        id="number"
                        name="number"
                        type="tel"
                        className="form-control"
                        placeholder="xxxx xxxx xxxx xxxx"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        onFocus={handleInputFocus}
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="name" className="form-label">
                        Cardholder Name
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        className="form-control"
                        placeholder="NGUYEN VAN A"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onFocus={handleInputFocus}
                    />
                </div>

                <div className="row">
                    <div className="col-6 mb-3">
                        <label htmlFor="expiry" className="form-label">
                            Expiration Date
                        </label>
                        <input
                            id="expiry"
                            name="expiry"
                            type="text"
                            className="form-control"
                            placeholder="MM/YY"
                            value={expiry}
                            onChange={(e) => setExpiry(e.target.value)}
                            onFocus={handleInputFocus}
                        />
                    </div>
                    <div className="col-6 mb-3">
                        <label htmlFor="cvc" className="form-label">
                            CVC
                        </label>
                        <input
                            id="cvc"
                            name="cvc"
                            type="tel"
                            className="form-control"
                            placeholder="123"
                            value={cvc}
                            onChange={(e) => setCvc(e.target.value)}
                            onFocus={handleInputFocus}
                        />
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreditCard;
