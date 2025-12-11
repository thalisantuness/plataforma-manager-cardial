import SideBar from "../../components/SideBar/index";
import ImovelList from "../../components/ProductList";
import "./style.css";
import "../../global.css";

function ImovelListPage() {
  return (
    <div className="container">
      <SideBar />
      <div className="main-content">
        <ImovelList />
      </div>
    </div>
  );
}

export default ImovelListPage;
