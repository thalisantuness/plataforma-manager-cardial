import React from "react";
import "./styles.css";
import { TypeAnimation } from 'react-type-animation';

function Highlights() {  
  return (
    <div className="page-container">
    
    <TypeAnimation
      sequence={[
       
     'Bem-vindo ao Seu Sistema de Vendas!',
1000,
'Mais agilidade e controle para o seu negócio!',
1000,
'Tudo pronto para um dia de grandes vendas!',
1000,
'Conte com a gente para impulsionar seu mercado!',
1000,
'Gestão fácil, vendas rápidas, resultados reais!',
1000,
'Simplifique sua rotina com tecnologia inteligente!',
1000,
'Transformando o seu ponto de venda em sucesso!',
1000,
'Estamos prontos para crescer junto com você!',
1000
      ]}
      wrapper="h1"
      speed={50}
      style={{ fontSize: '40px', display: 'inline-block' , color: 'white'}}
      repeat={Infinity}
    />

      <p> 
      Vamos manejar seu varejo?</p> 
      <button>Comece já</button>



    
    </div>
  );
}

export default Highlights;
