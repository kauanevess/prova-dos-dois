import { BrowserRouter, Routes, Route } from "react-router-dom";

import FundoFotos from "./components/FundoFotos";

import Home from "./pages/Home/Home";
import Sala from "./pages/Sala/Sala";
import CriarProva from "./pages/CriarProva/CriarProva";
import RevisarProva from "./pages/RevisarProva/RevisarProva";
import Aguardando from "./pages/Aguardando/Aguardando";
import ResponderProva from "./pages/ResponderProva/ResponderProva";
import Correcao from "./pages/Correcao/Correcao";
import Resultado from "./pages/Resultado/Resultado";
import Final from "./pages/Final/Final";

function App() {
  return (
    <BrowserRouter>
      <FundoFotos />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sala" element={<Sala />} />
        <Route path="/criar" element={<CriarProva />} />
        <Route path="/revisar" element={<RevisarProva />} />
        <Route path="/aguardando" element={<Aguardando />} />
        <Route path="/responder" element={<ResponderProva />} />
        <Route path="/correcao" element={<Correcao />} />
        <Route path="/resultado" element={<Resultado />} />
        <Route path="/final" element={<Final />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;