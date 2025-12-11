import React, {useState, useEffect} from "react";
import "./styles.css";
import axios from "axios";

function Companies() {
  // eslint-disable-next-line no-unused-vars
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [imoveis, setImoveis] = useState([]);
 
  const fetchImoveis = async () => {
    try {
      const response = await axios.get(
        "https://api-corretora-production.up.railway.app/imovel"
      );
      setImoveis(response.data); 
    } catch (error) {
      console.error("Erro ao buscar imóveis:", error);
    }
  };

  useEffect(() => {
    fetchImoveis();
  }, []);

  return (
    <div className="companies-container">
    

     <div className="call-imoveis-section">
      <p>Encontre os melhores imóveis selecionados para você!</p>
      <Link className="call-imoveis-button"to="/imovel-list">Confira</Link>
     </div>

 
    </div>
  );
}
export default Companies;