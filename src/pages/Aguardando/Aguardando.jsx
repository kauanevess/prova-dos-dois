import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import "./Aguardando.css";

function Aguardando() {
  const navigate = useNavigate();

  const jogador = localStorage.getItem("jogador-atual");
  const partidaId = localStorage.getItem("partida-id");

  const [jogadores, setJogadores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const outroJogador =
    jogador === "kaua" ? "giovanna" : "kaua";

  const nome =
    jogador === "kaua" ? "Kauã" : "Giovanna";

  const nomeOutro =
    outroJogador === "kaua" ? "Kauã" : "Giovanna";

  useEffect(() => {
    if (!jogador || !partidaId) {
      navigate("/", { replace: true });
      return;
    }

    async function buscarEstado() {
      const { data, error } = await supabase
        .from("jogadores")
        .select("*")
        .eq("partida_id", partidaId);

      if (error) {
        console.error(error);
        setErro("não consegui carregar a partida.");
        setCarregando(false);
        return;
      }

      setJogadores(data || []);
      setCarregando(false);
    }

    buscarEstado();

    const canal = supabase
      .channel(`partida-${partidaId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jogadores",
          filter: `partida_id=eq.${partidaId}`,
        },
        () => {
          buscarEstado();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [jogador, partidaId, navigate]);

  if (!jogador || !partidaId) {
    return null;
  }

  if (carregando) {
    return (
      <main className="aguardando">
        <section className="folha-aguardando">
          <span className="etiqueta">
            prova dos dois
          </span>

          <h1>
            só um
            <br />
            segundo.
          </h1>

          <p className="texto-aguardando">
            carregando a partida...
          </p>
        </section>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="aguardando">
        <section className="folha-aguardando">
          <span className="etiqueta">
            opa
          </span>

          <h1>
            deu
            <br />
            ruim.
          </h1>

          <p className="texto-aguardando">
            {erro}
          </p>

          <button
            type="button"
            className="botao-principal"
            onClick={() => window.location.reload()}
          >
            tentar novamente →
          </button>
        </section>
      </main>
    );
  }

  const meusDados = jogadores.find(
    (item) => item.jogador === jogador
  );

  const dadosOutro = jogadores.find(
    (item) => item.jogador === outroJogador
  );

  const minhaProvaLacrada =
    meusDados?.prova_lacrada === true;

  const provaOutroLacrada =
    dadosOutro?.prova_lacrada === true;

  const euRespondi =
    meusDados?.prova_respondida === true;

  const outroRespondeu =
    dadosOutro?.prova_respondida === true;

  const minhaCorrecaoFinalizada =
    meusDados?.correcao_finalizada === true;

  const correcaoOutroFinalizada =
    dadosOutro?.correcao_finalizada === true;

  const ambasProvasLacradas =
    minhaProvaLacrada && provaOutroLacrada;

  const ambosResponderam =
    euRespondi && outroRespondeu;

  const ambosCorrigiram =
    minhaCorrecaoFinalizada &&
    correcaoOutroFinalizada;

  if (minhaProvaLacrada && !provaOutroLacrada) {
    return (
      <main className="aguardando">
        <section className="folha-aguardando">
          <span className="etiqueta">
            prova lacrada
          </span>

          <h1>
            agora é
            <br />
            com {nomeOutro}.
          </h1>

          <p className="texto-aguardando">
            sua prova já está pronta. agora falta{" "}
            <strong>{nomeOutro}</strong> terminar as
            15 perguntas.
          </p>

          <div className="status-jogadores">
            <div className="status-card concluido">
              <span>
                {jogador === "kaua" ? "K" : "G"}
              </span>

              <div>
                <strong>{nome}</strong>
                <small>prova lacrada ✓</small>
              </div>
            </div>

            <div className="status-card">
              <span>
                {outroJogador === "kaua" ? "K" : "G"}
              </span>

              <div>
                <strong>{nomeOutro}</strong>
                <small>
                  ainda está montando a prova
                </small>
              </div>
            </div>
          </div>

          <p className="esperando-texto">
            essa tela atualiza sozinha quando{" "}
            {nomeOutro} terminar.
          </p>
        </section>
      </main>
    );
  }

  if (ambasProvasLacradas && !euRespondi) {
    return (
      <main className="aguardando">
        <section className="folha-aguardando">
          <span className="etiqueta">
            hora da prova
          </span>

          <h1>
            sem
            <br />
            consulta.
          </h1>

          <p className="texto-aguardando">
            <strong>{nome}</strong>, a prova que{" "}
            {nomeOutro} preparou para você está
            pronta.
          </p>

          <div className="status-jogadores">
            <div className="status-card concluido">
              <span>K</span>

              <div>
                <strong>Kauã</strong>
                <small>prova criada ✓</small>
              </div>
            </div>

            <div className="status-card concluido">
              <span>G</span>

              <div>
                <strong>Giovanna</strong>
                <small>prova criada ✓</small>
              </div>
            </div>
          </div>

          <p className="esperando-texto">
            {nomeOutro} preparou 15 perguntas para
            você.
          </p>

          <button
            type="button"
            className="botao-principal"
            onClick={() => navigate("/responder")}
          >
            começar minha prova →
          </button>
        </section>
      </main>
    );
  }

  if (euRespondi && !outroRespondeu) {
    return (
      <main className="aguardando">
        <section className="folha-aguardando">
          <span className="etiqueta">
            prova entregue
          </span>

          <h1>
            agora
            <br />
            espera.
          </h1>

          <p className="texto-aguardando">
            você terminou suas 15 respostas. agora
            falta <strong>{nomeOutro}</strong>.
          </p>

          <div className="status-jogadores">
            <div className="status-card concluido">
              <span>
                {jogador === "kaua" ? "K" : "G"}
              </span>

              <div>
                <strong>{nome}</strong>
                <small>prova respondida ✓</small>
              </div>
            </div>

            <div className="status-card">
              <span>
                {outroJogador === "kaua" ? "K" : "G"}
              </span>

              <div>
                <strong>{nomeOutro}</strong>
                <small>ainda está respondendo</small>
              </div>
            </div>
          </div>

          <p className="esperando-texto">
            quando {nomeOutro} terminar, essa tela
            atualiza sozinha.
          </p>
        </section>
      </main>
    );
  }

  if (
    ambosResponderam &&
    !minhaCorrecaoFinalizada
  ) {
    return (
      <main className="aguardando">
        <section className="folha-aguardando">
          <span className="etiqueta">
            hora da correção
          </span>

          <h1>
            agora
            <br />
            julga.
          </h1>

          <p className="texto-aguardando">
            <strong>{nome}</strong>, agora você vai
            corrigir as respostas de{" "}
            <strong>{nomeOutro}</strong> às perguntas
            que você criou.
          </p>

          <div className="status-jogadores">
            <div className="status-card concluido">
              <span>K</span>

              <div>
                <strong>Kauã</strong>
                <small>prova respondida ✓</small>
              </div>
            </div>

            <div className="status-card concluido">
              <span>G</span>

              <div>
                <strong>Giovanna</strong>
                <small>prova respondida ✓</small>
              </div>
            </div>
          </div>

          <div className="chamada-correcao">
            <span>15 respostas</span>

            <strong>
              esperando sua correção.
            </strong>

            <p>
              você não poderá dar ponto para suas
              próprias respostas.
            </p>
          </div>

          <button
            type="button"
            className="botao-principal"
            onClick={() => navigate("/correcao")}
          >
            começar minha correção →
          </button>
        </section>
      </main>
    );
  }

  if (
    minhaCorrecaoFinalizada &&
    !correcaoOutroFinalizada
  ) {
    return (
      <main className="aguardando">
        <section className="folha-aguardando">
          <span className="etiqueta">
            correção concluída
          </span>

          <h1>
            falta
            <br />
            {nomeOutro}.
          </h1>

          <p className="texto-aguardando">
            você terminou sua parte. agora falta{" "}
            <strong>{nomeOutro}</strong> terminar a
            correção.
          </p>

          <div className="status-jogadores">
            <div className="status-card concluido">
              <span>
                {jogador === "kaua" ? "K" : "G"}
              </span>

              <div>
                <strong>{nome}</strong>
                <small>correção finalizada ✓</small>
              </div>
            </div>

            <div className="status-card">
              <span>
                {outroJogador === "kaua" ? "K" : "G"}
              </span>

              <div>
                <strong>{nomeOutro}</strong>
                <small>falta corrigir</small>
              </div>
            </div>
          </div>

          <p className="esperando-texto">
            essa tela atualiza quando {nomeOutro}{" "}
            terminar.
          </p>
        </section>
      </main>
    );
  }

  if (ambosCorrigiram) {
    return (
      <main className="aguardando">
        <section className="folha-aguardando">
          <span className="etiqueta">
            fim da prova
          </span>

          <h1>
            chegou
            <br />
            a hora.
          </h1>

          <p className="texto-aguardando">
            30 perguntas respondidas.
            <br />
            30 respostas julgadas.
            <br />
            agora não tem mais como fugir do
            resultado.
          </p>

          <div className="status-jogadores">
            <div className="status-card concluido">
              <span>K</span>

              <div>
                <strong>Kauã</strong>
                <small>correção concluída ✓</small>
              </div>
            </div>

            <div className="status-card concluido">
              <span>G</span>

              <div>
                <strong>Giovanna</strong>
                <small>correção concluída ✓</small>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="botao-principal"
            onClick={() => navigate("/resultado")}
          >
            revelar resultado →
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="aguardando">
      <section className="folha-aguardando">
        <span className="etiqueta">
          prova dos dois
        </span>

        <h1>
          esperando
          <br />
          vocês.
        </h1>

        <p className="texto-aguardando">
          aguardando o andamento da partida.
        </p>
      </section>
    </main>
  );
}

export default Aguardando;