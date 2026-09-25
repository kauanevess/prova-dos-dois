import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import "./Sala.css";

function Sala() {
  const navigate = useNavigate();

  const codigo = localStorage.getItem("partida-codigo");
  const partidaId = localStorage.getItem("partida-id");
  const jogador = localStorage.getItem("jogador-atual");

  const nome = jogador === "kaua" ? "Kauã" : "Giovanna";
  const outro = jogador === "kaua" ? "Giovanna" : "Kauã";

  useEffect(() => {
    if (!partidaId) {
      navigate("/", { replace: true });
      return;
    }

    async function prepararFinal() {
      const { error } = await supabase
        .from("final_jogo")
        .upsert(
          {
            partida_id: partidaId,
          },
          {
            onConflict: "partida_id",
            ignoreDuplicates: true,
          }
        );

      if (error) {
        console.error(
          "erro ao preparar o final:",
          error
        );
      }
    }

    prepararFinal();
  }, [partidaId, navigate]);

  function copiarCodigo() {
    if (!codigo) return;

    navigator.clipboard.writeText(codigo);
  }

  function comecar() {
    navigate("/criar");
  }

  return (
    <main className="sala">
      <section className="folha-sala">
        <header className="sala-topo">
          <span className="numero-sala">02</span>
          <span>sala criada</span>
        </header>

        <div className="sala-conteudo">
          <p className="sala-mini">
            tudo certo, {nome}
          </p>

          <h1>
            agora chama
            <br />
            {outro}.
          </h1>

          <p className="sala-descricao">
            esse é o código da prova de vocês.
            <br />
            envie para {outro} entrar na mesma sala.
          </p>

          <div className="codigo-sala">
            {codigo || "------"}
          </div>

          <button
            type="button"
            className="botao-copiar"
            onClick={copiarCodigo}
          >
            copiar código
          </button>

          <div className="sala-linha" />

          <button
            type="button"
            className="botao-comecar"
            onClick={comecar}
          >
            começar minha prova →
          </button>
        </div>

        <footer className="sala-footer">
          <span>mesma sala</span>
          <span>•</span>
          <span>dois computadores</span>
          <span>•</span>
          <span>uma prova</span>
        </footer>
      </section>
    </main>
  );
}

export default Sala;