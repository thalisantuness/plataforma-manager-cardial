import React from "react";
import BannerPrimary from "../../components/BannerPrimary/index";
import ReactWhatsappButton from "react-whatsapp-button";
import "../../global.css";
import "./styles.css";

function Home() {
  return (
    <div className="home-container">
      <BannerPrimary />
      {/*   <OurSolutions />
        <Statistics />
        <Blog />
        <Companies /> */}
      <ReactWhatsappButton
        countryCode="55"
        phoneNumber="123456789"
        animated={true}
      />
    </div>
  );
}

export default Home;