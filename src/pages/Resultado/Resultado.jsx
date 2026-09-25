import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import "./Resultado.css";

function Resultado() {
  const navigate = useNavigate();

  const partidaId = localStorage.getItem("partida-id");
  const jogador = localStorage.getItem("jogador-atual");

  const [correcoes, setCorrecoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!partidaId || !jogador) {
      navigate("/", { replace: true });
      return;
    }

    async function carregarResultado() {
      setCarregando(true);

      const { data: partida, error: erroPartida } =
        await supabase
          .from("partidas")
          .select("fase")
          .eq("id", partidaId)
          .single();

      if (erroPartida) {
        console.error(erroPartida);
        setErro("não consegui carregar o resultado.");
        setCarregando(false);
        return;
      }

      if (partida?.fase !== "resultado") {
        navigate("/aguardando", {
          replace: true,
        });
        return;
      }

      const { data, error } = await supabase
        .from("correcoes")
        .select(
          "jogador_corrigido, numero, resultado"
        )
        .eq("partida_id", partidaId)
        .order("numero", {
          ascending: true,
        });

      if (error) {
        console.error(error);
        setErro("não consegui carregar o resultado.");
        setCarregando(false);
        return;
      }

      setCorrecoes(data || []);
      setCarregando(false);
    }

    carregarResultado();
  }, [partidaId, jogador, navigate]);

  if (carregando) {
    return (
      <main className="resultado">
        <section className="folha-resultado">
          <span className="resultado-mini">
            corrigindo a prova...
          </span>

          <h1>
            calculando
            <br />
            as notas.
          </h1>
        </section>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="resultado">
        <section className="folha-resultado">
          <span className="resultado-mini">
            deu ruim
          </span>

          <h1>
            cadê as
            <br />
            notas?
          </h1>

          <p>{erro}</p>
        </section>
      </main>
    );
  }

  const correcoesKaua = correcoes.filter(
    (item) => item.jogador_corrigido === "kaua"
  );

  const correcoesGiovanna = correcoes.filter(
    (item) =>
      item.jogador_corrigido === "giovanna"
  );

  const pontosKaua = correcoesKaua.filter(
    (item) => item.resultado === true
  ).length;

  const pontosGiovanna = correcoesGiovanna.filter(
    (item) => item.resultado === true
  ).length;

  function textoResultado() {
    if (pontosKaua === pontosGiovanna) {
      return "deu empate. conveniente demais.";
    }

    if (pontosKaua > pontosGiovanna) {
      return "dessa vez, Kauã prestou mais atenção.";
    }

    return "dessa vez, Giovanna prestou mais atenção.";
  }

  function resultadoQuestao(jogadorCorrigido, numero) {
    return correcoes.find(
      (item) =>
        item.jogador_corrigido ===
          jogadorCorrigido &&
        item.numero === numero
    )?.resultado;
  }

  return (
    <main className="resultado">
      <section className="folha-resultado">
        <header className="resultado-topo">
          <span>resultado oficial</span>
          <span>30 questões corrigidas</span>
        </header>

        <div className="resultado-intro">
          <span className="resultado-mini">
            acabou a prova
          </span>

          <h1>
            e aí,
            <br />
            quem sabe mais?
          </h1>

          <p>{textoResultado()}</p>
        </div>

        <div className="placar-final">
          <article className="resultado-jogador">
            <div className="resultado-identidade">
              <span>K</span>

              <div>
                <small>candidato 01</small>
                <strong>Kauã</strong>
              </div>
            </div>

            <div className="resultado-nota">
              <strong>{pontosKaua}</strong>
              <span>/15</span>
            </div>

            <p>
              {Math.round((pontosKaua / 15) * 100)}%
              de aproveitamento
            </p>
          </article>

          <div className="resultado-versus">
            vs
          </div>

          <article className="resultado-jogador">
            <div className="resultado-identidade">
              <span>G</span>

              <div>
                <small>candidata 02</small>
                <strong>Giovanna</strong>
              </div>
            </div>

            <div className="resultado-nota">
              <strong>{pontosGiovanna}</strong>
              <span>/15</span>
            </div>

            <p>
              {Math.round(
                (pontosGiovanna / 15) * 100
              )}
              % de aproveitamento
            </p>
          </article>
        </div>

        <section className="gabarito-final">
          <div className="gabarito-topo">
            <div>
              <span className="resultado-mini">
                questão por questão
              </span>

              <h2>o estrago.</h2>
            </div>

            <div className="gabarito-legenda">
              <span>
                <strong>✓</strong> acertou
              </span>

              <span>
                <strong>×</strong> errou
              </span>
            </div>
          </div>

          <div className="tabela-resultado">
            <div className="tabela-cabecalho">
              <span>questão</span>
              <span>Kauã</span>
              <span>Giovanna</span>
            </div>

            {Array.from(
              { length: 15 },
              (_, index) => {
                const numero = index + 1;

                const kaua =
                  resultadoQuestao(
                    "kaua",
                    numero
                  );

                const giovanna =
                  resultadoQuestao(
                    "giovanna",
                    numero
                  );

                return (
                  <div
                    className="tabela-linha"
                    key={numero}
                  >
                    <span>
                      {String(numero).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <span
                      className={
                        kaua === true
                          ? "acerto"
                          : kaua === false
                            ? "erro"
                            : "pendente"
                      }
                    >
                      {kaua === true
                        ? "✓"
                        : kaua === false
                          ? "×"
                          : "—"}
                    </span>

                    <span
                      className={
                        giovanna === true
                          ? "acerto"
                          : giovanna === false
                            ? "erro"
                            : "pendente"
                      }
                    >
                      {giovanna === true
                        ? "✓"
                        : giovanna === false
                          ? "×"
                          : "—"}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </section>

        <div className="resultado-final">
          <div>
            <span className="resultado-mini">
              fim da prova
            </span>

            <p>
              nota registrada. dignidade parcialmente
              preservada.
            </p>
          </div>

          <button
            type="button"
            className="resultado-continuar"
            onClick={() => navigate("/final")}
          >
            continuar →
          </button>
        </div>
      </section>
    </main>
  );
}

export default Resultado;