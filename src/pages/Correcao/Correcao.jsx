import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import "./Correcao.css";

function Correcao() {
  const navigate = useNavigate();

  const jogador = localStorage.getItem("jogador-atual");
  const partidaId = localStorage.getItem("partida-id");

  const [rodada, setRodada] = useState(0);
  const [perguntas, setPerguntas] = useState([]);
  const [respostas, setRespostas] = useState([]);
  const [correcoes, setCorrecoes] = useState([]);
  const [jogadores, setJogadores] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const nomeAtual =
    jogador === "kaua" ? "Kauã" : "Giovanna";

  const outroJogador =
    jogador === "kaua" ? "giovanna" : "kaua";

  const nomeOutro =
    outroJogador === "kaua" ? "Kauã" : "Giovanna";

  useEffect(() => {
    if (!jogador || !partidaId) {
      navigate("/", { replace: true });
      return;
    }

    let ativo = true;

    async function carregarTudo() {
      const [
        partidaResultado,
        perguntasResultado,
        respostasResultado,
        correcoesResultado,
        jogadoresResultado,
      ] = await Promise.all([
        supabase
          .from("partidas")
          .select("rodada_atual, fase")
          .eq("id", partidaId)
          .single(),

        supabase
          .from("perguntas")
          .select(
            "id, autor, numero, pergunta, tipo, alternativas"
          )
          .eq("partida_id", partidaId)
          .order("numero", { ascending: true }),

        supabase
          .from("respostas")
          .select("jogador, numero, resposta")
          .eq("partida_id", partidaId),

        supabase
          .from("correcoes")
          .select(
            "jogador_corrigido, numero, resultado"
          )
          .eq("partida_id", partidaId),

        supabase
          .from("jogadores")
          .select(
            "jogador, prova_lacrada, prova_respondida, correcao_finalizada, pronto_proxima"
          )
          .eq("partida_id", partidaId),
      ]);

      if (!ativo) return;

      const algumErro =
        partidaResultado.error ||
        perguntasResultado.error ||
        respostasResultado.error ||
        correcoesResultado.error ||
        jogadoresResultado.error;

      if (algumErro) {
        console.error(algumErro);

        setErro(
          "não consegui carregar a correção."
        );

        setCarregando(false);
        return;
      }

      // terminou a correção: manda os dois para o resultado
      if (
        partidaResultado.data?.fase ===
        "resultado"
      ) {
        navigate("/resultado", {
          replace: true,
        });

        return;
      }

      setRodada(
        partidaResultado.data?.rodada_atual ?? 0
      );

      setPerguntas(
        perguntasResultado.data || []
      );

      setRespostas(
        respostasResultado.data || []
      );

      setCorrecoes(
        correcoesResultado.data || []
      );

      setJogadores(
        jogadoresResultado.data || []
      );

      setCarregando(false);
    }

    carregarTudo();

    const canal = supabase
      .channel(`correcao-${partidaId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "correcoes",
          filter: `partida_id=eq.${partidaId}`,
        },
        () => {
          carregarTudo();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jogadores",
          filter: `partida_id=eq.${partidaId}`,
        },
        () => {
          carregarTudo();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "partidas",
          filter: `id=eq.${partidaId}`,
        },
        () => {
          carregarTudo();
        }
      )
      .subscribe();

    return () => {
      ativo = false;
      supabase.removeChannel(canal);
    };
  }, [jogador, partidaId, navigate]);

  if (!jogador || !partidaId) {
    return null;
  }

  if (carregando) {
    return (
      <main className="correcao">
        <section className="folha-correcao erro-correcao">
          <span className="correcao-etiqueta">
            correção dos dois
          </span>

          <h1>
            preparando
            <br />
            a correção.
          </h1>

          <p>
            carregando as perguntas e respostas...
          </p>
        </section>
      </main>
    );
  }

  const perguntasKaua = perguntas.filter(
    (item) => item.autor === "kaua"
  );

  const perguntasGiovanna = perguntas.filter(
    (item) => item.autor === "giovanna"
  );

  const respostasKaua = respostas.filter(
    (item) => item.jogador === "kaua"
  );

  const respostasGiovanna = respostas.filter(
    (item) => item.jogador === "giovanna"
  );

  const dadosValidos =
    perguntasKaua.length === 15 &&
    perguntasGiovanna.length === 15 &&
    respostasKaua.length === 15 &&
    respostasGiovanna.length === 15;

  if (!dadosValidos) {
    return (
      <main className="correcao">
        <section className="folha-correcao erro-correcao">
          <span className="correcao-etiqueta">
            correção indisponível
          </span>

          <h1>
            alguma coisa
            <br />
            ficou faltando.
          </h1>

          <p>
            as duas provas precisam estar criadas e
            respondidas antes da correção.
          </p>

          {erro && <p>{erro}</p>}

          <button
            type="button"
            className="correcao-botao-principal"
            onClick={() =>
              navigate("/aguardando")
            }
          >
            voltar
          </button>
        </section>
      </main>
    );
  }

  const questaoParaKaua =
    perguntasGiovanna.find(
      (item) => item.numero === rodada + 1
    );

  const questaoParaGiovanna =
    perguntasKaua.find(
      (item) => item.numero === rodada + 1
    );

  const respostaKaua =
    respostasKaua.find(
      (item) => item.numero === rodada + 1
    )?.resposta ?? null;

  const respostaGiovanna =
    respostasGiovanna.find(
      (item) => item.numero === rodada + 1
    )?.resposta ?? null;

  const correcaoKaua =
    correcoes.find(
      (item) =>
        item.jogador_corrigido === "kaua" &&
        item.numero === rodada + 1
    )?.resultado ?? null;

  const correcaoGiovanna =
    correcoes.find(
      (item) =>
        item.jogador_corrigido ===
          "giovanna" &&
        item.numero === rodada + 1
    )?.resultado ?? null;

  const minhaCorrecao =
    jogador === "kaua"
      ? correcaoGiovanna
      : correcaoKaua;

  const correcaoDoOutro =
    jogador === "kaua"
      ? correcaoKaua
      : correcaoGiovanna;

  const meusDados = jogadores.find(
    (item) => item.jogador === jogador
  );

  const dadosOutro = jogadores.find(
    (item) => item.jogador === outroJogador
  );

  const estouPronto =
    meusDados?.pronto_proxima === true;

  const outroPronto =
    dadosOutro?.pronto_proxima === true;

  const ambosJulgaram =
    minhaCorrecao !== null &&
    correcaoDoOutro !== null;

  const pontosKaua = correcoes.filter(
    (item) =>
      item.jogador_corrigido === "kaua" &&
      item.resultado === true
  ).length;

  const pontosGiovanna = correcoes.filter(
    (item) =>
      item.jogador_corrigido ===
        "giovanna" &&
      item.resultado === true
  ).length;

  function formatarResposta(
    questao,
    resposta
  ) {
    if (!questao) {
      return "sem resposta";
    }

    if (questao.tipo === "multipla") {
      if (typeof resposta !== "number") {
        return "sem resposta";
      }

      return (
        questao.alternativas?.[resposta] ||
        "sem resposta"
      );
    }

    if (questao.tipo === "vf") {
      if (resposta === true) {
        return "verdadeiro";
      }

      if (resposta === false) {
        return "falso";
      }

      return "sem resposta";
    }

    if (questao.tipo === "aberta") {
      if (
        typeof resposta !== "string" ||
        !resposta.trim()
      ) {
        return "sem resposta";
      }

      return resposta;
    }

    return "sem resposta";
  }

  async function corrigir(resultado) {
    if (salvando || estouPronto) {
      return;
    }

    setSalvando(true);
    setErro("");

    const jogadorCorrigido =
      jogador === "kaua"
        ? "giovanna"
        : "kaua";

    const { error } = await supabase
      .from("correcoes")
      .upsert(
        {
          partida_id: partidaId,
          jogador_corrigido:
            jogadorCorrigido,
          numero: rodada + 1,
          resultado,
        },
        {
          onConflict:
            "partida_id,jogador_corrigido,numero",
        }
      );

    if (error) {
      console.error(error);

      setErro(
        "não consegui salvar sua correção."
      );
    }

    setSalvando(false);
  }

  async function ficarPronto() {
    if (
      minhaCorrecao === null ||
      estouPronto ||
      salvando
    ) {
      return;
    }

    setSalvando(true);
    setErro("");

    const { error: erroPronto } =
      await supabase
        .from("jogadores")
        .update({
          pronto_proxima: true,
        })
        .eq("partida_id", partidaId)
        .eq("jogador", jogador);

    if (erroPronto) {
      console.error(erroPronto);

      setErro(
        "não consegui marcar você como pronto."
      );

      setSalvando(false);
      return;
    }

    const { error: erroAvanco } =
      await supabase.rpc(
        "avancar_rodada_correcao",
        {
          p_partida_id: partidaId,
        }
      );

    if (erroAvanco) {
      console.error(erroAvanco);

      setErro(
        "não consegui sincronizar a próxima rodada."
      );
    }

    setSalvando(false);
  }

  return (
    <main className="correcao">
      <section className="folha-correcao">
        <header className="correcao-topo">
          <div>
            <span className="correcao-etiqueta">
              correção dos dois
            </span>

            <h1>
              rodada{" "}
              {String(
                rodada + 1
              ).padStart(2, "0")}
            </h1>
          </div>

          <div className="correcao-contador">
            <strong>
              {String(
                rodada + 1
              ).padStart(2, "0")}
            </strong>

            <span>/ 15</span>
          </div>
        </header>

        <div className="correcao-usuario-atual">
          <span>corrigindo como</span>
          <strong>{nomeAtual}</strong>
        </div>

        <div className="correcao-barra">
          <div
            style={{
              width: `${
                ((rodada + 1) / 15) * 100
              }%`,
            }}
          />
        </div>

        <div className="placar-correcao">
          <div>
            <span>K</span>

            <p>
              Kauã
              <strong>
                {pontosKaua} pts
              </strong>
            </p>
          </div>

          <span className="placar-meio">
            rodada sincronizada
          </span>

          <div>
            <p>
              Giovanna
              <strong>
                {pontosGiovanna} pts
              </strong>
            </p>

            <span>G</span>
          </div>
        </div>

        <div className="duas-provas">
          <article
            className={`lado-correcao ${
              jogador !== "giovanna"
                ? "lado-bloqueado"
                : ""
            }`}
          >
            <div className="lado-topo">
              <div className="identidade">
                <span className="letra-jogador">
                  K
                </span>

                <div>
                  <strong>Kauã</strong>
                  <small>respondeu</small>
                </div>
              </div>

              <span className="quem-corrige">
                Giovanna corrige
              </span>
            </div>

            <div className="conteudo-correcao">
              <span className="autor-pergunta">
                pergunta da Giovanna
              </span>

              <h2>
                {questaoParaKaua?.pergunta}
              </h2>

              <div className="resposta-correcao">
                <span>
                  resposta do Kauã
                </span>

                <p>
                  {formatarResposta(
                    questaoParaKaua,
                    respostaKaua
                  )}
                </p>
              </div>
            </div>

            <div className="julgamento">
              {jogador === "giovanna" ? (
                <>
                  <span className="julgamento-label">
                    Giovanna, vale o ponto?
                  </span>

                  <div className="botoes-julgamento">
                    <button
                      type="button"
                      className={
                        correcaoKaua === false
                          ? "botao-errada selecionado"
                          : "botao-errada"
                      }
                      disabled={
                        salvando ||
                        estouPronto
                      }
                      onClick={() =>
                        corrigir(false)
                      }
                    >
                      <span>×</span>
                      errada
                    </button>

                    <button
                      type="button"
                      className={
                        correcaoKaua === true
                          ? "botao-certa selecionado"
                          : "botao-certa"
                      }
                      disabled={
                        salvando ||
                        estouPronto
                      }
                      onClick={() =>
                        corrigir(true)
                      }
                    >
                      <span>✓</span>
                      certa
                    </button>
                  </div>
                </>
              ) : (
                <div className="correcao-bloqueada">
                  <span className="cadeado">
                    🔒
                  </span>

                  <div>
                    <strong>
                      correção da Giovanna
                    </strong>

                    {correcaoKaua === null ? (
                      <p>
                        esperando Giovanna
                        julgar essa resposta.
                      </p>
                    ) : (
                      <p>
                        Giovanna marcou como{" "}
                        <strong>
                          {correcaoKaua
                            ? "certa"
                            : "errada"}
                        </strong>
                        .
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </article>

          <article
            className={`lado-correcao ${
              jogador !== "kaua"
                ? "lado-bloqueado"
                : ""
            }`}
          >
            <div className="lado-topo">
              <div className="identidade">
                <span className="letra-jogador">
                  G
                </span>

                <div>
                  <strong>Giovanna</strong>
                  <small>respondeu</small>
                </div>
              </div>

              <span className="quem-corrige">
                Kauã corrige
              </span>
            </div>

            <div className="conteudo-correcao">
              <span className="autor-pergunta">
                pergunta do Kauã
              </span>

              <h2>
                {questaoParaGiovanna?.pergunta}
              </h2>

              <div className="resposta-correcao">
                <span>
                  resposta da Giovanna
                </span>

                <p>
                  {formatarResposta(
                    questaoParaGiovanna,
                    respostaGiovanna
                  )}
                </p>
              </div>
            </div>

            <div className="julgamento">
              {jogador === "kaua" ? (
                <>
                  <span className="julgamento-label">
                    Kauã, vale o ponto?
                  </span>

                  <div className="botoes-julgamento">
                    <button
                      type="button"
                      className={
                        correcaoGiovanna ===
                        false
                          ? "botao-errada selecionado"
                          : "botao-errada"
                      }
                      disabled={
                        salvando ||
                        estouPronto
                      }
                      onClick={() =>
                        corrigir(false)
                      }
                    >
                      <span>×</span>
                      errada
                    </button>

                    <button
                      type="button"
                      className={
                        correcaoGiovanna ===
                        true
                          ? "botao-certa selecionado"
                          : "botao-certa"
                      }
                      disabled={
                        salvando ||
                        estouPronto
                      }
                      onClick={() =>
                        corrigir(true)
                      }
                    >
                      <span>✓</span>
                      certa
                    </button>
                  </div>
                </>
              ) : (
                <div className="correcao-bloqueada">
                  <span className="cadeado">
                    🔒
                  </span>

                  <div>
                    <strong>
                      correção do Kauã
                    </strong>

                    {correcaoGiovanna ===
                    null ? (
                      <p>
                        esperando Kauã julgar
                        essa resposta.
                      </p>
                    ) : (
                      <p>
                        Kauã marcou como{" "}
                        <strong>
                          {correcaoGiovanna
                            ? "certa"
                            : "errada"}
                        </strong>
                        .
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </article>
        </div>

        {erro && (
          <p className="aviso-correcao">
            {erro}
          </p>
        )}

        {minhaCorrecao === null && (
          <p className="aviso-correcao">
            {nomeAtual}, marque a resposta de{" "}
            {nomeOutro} como certa ou errada.
          </p>
        )}

        {minhaCorrecao !== null &&
          correcaoDoOutro === null && (
            <p className="aviso-correcao">
              sua decisão foi salva. esperando{" "}
              {nomeOutro} julgar a resposta desta
              rodada.
            </p>
          )}

        {ambosJulgaram && !estouPronto && (
          <div className="navegacao-correcao">
            <span />

            <button
              type="button"
              className="correcao-botao-principal"
              disabled={salvando}
              onClick={ficarPronto}
            >
              {rodada === 14
                ? "pronto para o resultado →"
                : "pronto para próxima →"}
            </button>
          </div>
        )}

        {estouPronto && !outroPronto && (
          <p className="aviso-correcao">
            você está pronto. esperando{" "}
            {nomeOutro}...
          </p>
        )}

        {estouPronto && outroPronto && (
          <p className="aviso-correcao">
            os dois estão prontos. avançando...
          </p>
        )}
      </section>
    </main>
  );
}

export default Correcao;