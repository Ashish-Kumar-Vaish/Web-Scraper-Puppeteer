import React, { useState } from "react";
import "./Card.css";
import EmailPopup from "../emailPopup/EmailPopup";

const Card = ({ event }) => {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div className="card">
      <div
        className="cardImage"
        style={{ backgroundImage: `url(${event.image})` }}
      >
        <span>{event.date}</span>
      </div>

      <div className="cardContent">
        <div className="title">
          <h2>{event.title}</h2>
          <span>{event.location}</span>
        </div>

        <div className="descriptionAndLink">
          <span>{event.description}</span>

          <button type="button" onClick={() => setShowPopup(true)}>
            Get Tickets
          </button>
        </div>
      </div>

      {showPopup && (
        <EmailPopup eventUrl={event.link} onClose={() => setShowPopup(false)} />
      )}
    </div>
  );
};

export default Card;
