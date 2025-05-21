import React from "react";
import "./Header.css";

const Header = () => {
  return (
    <div className="header">
      <div className="name">
        <img src="/assets/logo.png" alt="Event Radar Logo" />
        <h1>Event Radar</h1>
      </div>

      <div className="options">
        <img src="/assets/user.png" alt="Profile" />
        <img src="/assets/list.png" alt="Settings" />
      </div>
    </div>
  );
};

export default Header;
