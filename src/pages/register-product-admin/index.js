import React from "react";
import { useParams } from "react-router-dom";
import SideBar from "../../components/SideBar/index";
import FormRegister from "../../components/FormRegister/index";
import "../../global.css";

function RegisterProduct() {
  const { id } = useParams(); // id será undefined para novo produto, ou o ID para edição

  return (
    <div className="container">
      <SideBar />
      <div className="main-content">
        <FormRegister productId={id} /> {/* Passe o ID para o FormRegister */}
      </div>
    </div>
  );
}

export default RegisterProduct;