import React from "react";
import FormLogin from "../../components/FormLogin/index";
import "./styles.css"; // Importar o CSS específico da página

function LoginAdmin() {
  return (
    <div className="login-admin-container">
      <FormLogin />
    </div>
  );
}

export default LoginAdmin;