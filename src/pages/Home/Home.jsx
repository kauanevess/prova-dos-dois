import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import JogadorCard from "../../components/JogadorCard";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  const [jogador, setJogador] = useState("");
  const [modo, setModo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const nome =
    jogador === "kaua" ? "Kauã" : "Giovanna";

  function escolherJogador(jogadorEscolhido) {
    setJogador(jogadorEscolhido);
    setModo("");
    setCodigo("");
    setErro("");
  }

  function gerarCodigo() {
    const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let novoCodigo = "";

    for (let i = 0; i < 6; i++) {
      novoCodigo +=
        caracteres[
          Math.floor(Math.random() * caracteres.length)
        ];
    }

    return novoCodigo;
  }

  async function criarSala() {
    if (!jogador || carregando) return;

    setCarregando(true);
    setErro("");

    try {
      let partida = null;

      for (let tentativa = 0; tentativa < 5; tentativa++) {
        const novoCodigo = gerarCodigo();

        const { data, error } = await supabase
          .from("partidas")
          .insert({
            codigo: novoCodigo,
            fase: "criacao",
            rodada_atual: 0,
          })
          .select()
          .single();

        if (!error) {
          partida = data;
          break;
        }

        if (error.code !== "23505") {
          throw error;
        }
      }

      if (!partida) {
        throw new Error(
          "não foi possível gerar um código para a sala."
        );
      }

      const { error: erroJogador } = await supabase
        .from("jogadores")
        .insert({
          partida_id: partida.id,
          jogador,
        });

      if (erroJogador) {
        throw erroJogador;
      }

      localStorage.setItem("jogador-atual", jogador);
      localStorage.setItem("partida-id", partida.id);
      localStorage.setItem("partida-codigo", partida.codigo);

      navigate("/sala");
    } catch (error) {
      console.error(error);

      setErro(
        "não consegui criar a sala. tenta novamente."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function entrarNaSala() {
    if (!jogador || carregando) return;

    const codigoLimpo = codigo
      .trim()
      .toUpperCase();

    if (!codigoLimpo) {
      setErro("digite o código da sala.");
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      const { data: partida, error: erroPartida } =
        await supabase
          .from("partidas")
          .select("*")
          .eq("codigo", codigoLimpo)
          .maybeSingle();

      if (erroPartida) {
        throw erroPartida;
      }

      if (!partida) {
        setErro("essa sala não foi encontrada.");
        return;
      }

      const { data: jogadorExistente, error: erroBusca } =
        await supabase
          .from("jogadores")
          .select("*")
          .eq("partida_id", partida.id)
          .eq("jogador", jogador)
          .maybeSingle();

      if (erroBusca) {
        throw erroBusca;
      }

      if (!jogadorExistente) {
        const { error: erroEntrada } = await supabase
          .from("jogadores")
          .insert({
            partida_id: partida.id,
            jogador,
          });

        if (erroEntrada) {
          throw erroEntrada;
        }
      }

      localStorage.setItem("jogador-atual", jogador);
      localStorage.setItem("partida-id", partida.id);
      localStorage.setItem("partida-codigo", partida.codigo);

      navigate("/criar");
    } catch (error) {
      console.error(error);

      setErro(
        "não consegui entrar na sala. tenta novamente."
      );
    } finally {
      setCarregando(false);
    }
  }

  function voltarJogadores() {
    setJogador("");
    setModo("");
    setCodigo("");
    setErro("");
  }

  function voltarModo() {
    setModo("");
    setCodigo("");
    setErro("");
  }

  return (
    <main className="home">
      <section className="folha">
        <header className="home-topo">
          <span className="numero-prova">01</span>
          <span>não vale colar</span>
        </header>

        <div className="home-conteudo">
          <p className="home-mini">
            uma prova extremamente séria
          </p>

          <h1>
            prova
            <br />
            dos dois.
          </h1>

          <p className="home-descricao">
            15 perguntas suas.
            <br />
            15 perguntas dela.
            <br />
            e a chance de descobrir quem realmente presta atenção.
          </p>

          <div className="home-linha" />

          {!jogador && (
            <>
              <p className="home-pergunta">
                quem está entrando?
              </p>

              <div className="jogadores">
                <JogadorCard
                  letra="K"
                  nome="Kauã"
                  descricao="entrar como jogador 1"
                  onClick={() =>
                    escolherJogador("kaua")
                  }
                />

                <JogadorCard
                  letra="G"
                  nome="Giovanna"
                  descricao="entrar como jogador 2"
                  onClick={() =>
                    escolherJogador("giovanna")
                  }
                />
              </div>
            </>
          )}

          {jogador && !modo && (
            <div className="sala-etapa">
              <button
                type="button"
                className="sala-voltar"
                onClick={voltarJogadores}
              >
                ← trocar jogador
              </button>

              <p className="home-pergunta">
                {nome}, como você vai entrar?
              </p>

              <div className="opcoes-sala">
                <button
                  type="button"
                  className="opcao-sala"
                  onClick={() =>
                    setModo("criar")
                  }
                >
                  <span className="opcao-sala-numero">
                    01
                  </span>

                  <div>
                    <strong>
                      criar uma sala
                    </strong>
                    <small>
                      gerar um código novo
                    </small>
                  </div>

                  <span>→</span>
                </button>

                <button
                  type="button"
                  className="opcao-sala"
                  onClick={() =>
                    setModo("entrar")
                  }
                >
                  <span className="opcao-sala-numero">
                    02
                  </span>

                  <div>
                    <strong>
                      entrar em uma sala
                    </strong>
                    <small>
                      usar o código recebido
                    </small>
                  </div>

                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {jogador && modo === "criar" && (
            <div className="sala-etapa">
              <button
                type="button"
                className="sala-voltar"
                onClick={voltarModo}
              >
                ← voltar
              </button>

              <p className="home-pergunta">
                criar uma nova prova
              </p>

              <p className="sala-texto">
                vamos gerar um código para vocês
                entrarem na mesma prova.
              </p>

              {erro && (
                <p className="sala-erro">
                  {erro}
                </p>
              )}

              <button
                type="button"
                className="sala-botao-principal"
                onClick={criarSala}
                disabled={carregando}
              >
                {carregando
                  ? "criando..."
                  : "criar sala →"}
              </button>
            </div>
          )}

          {jogador && modo === "entrar" && (
            <div className="sala-etapa">
              <button
                type="button"
                className="sala-voltar"
                onClick={voltarModo}
              >
                ← voltar
              </button>

              <p className="home-pergunta">
                código da prova
              </p>

              <p className="sala-texto">
                digite o código que a outra pessoa
                enviou para você.
              </p>

              <input
                type="text"
                className="sala-input"
                placeholder="EX: AMOR27"
                value={codigo}
                maxLength={6}
                onChange={(e) => {
                  setCodigo(
                    e.target.value
                      .toUpperCase()
                      .replace(
                        /[^A-Z0-9]/g,
                        ""
                      )
                  );

                  setErro("");
                }}
              />

              {erro && (
                <p className="sala-erro">
                  {erro}
                </p>
              )}

              <button
                type="button"
                className="sala-botao-principal"
                onClick={entrarNaSala}
                disabled={carregando}
              >
                {carregando
                  ? "entrando..."
                  : "entrar na sala →"}
              </button>
            </div>
          )}
        </div>

        <footer className="home-footer">
          <span>30 questões</span>
          <span>•</span>
          <span>2 candidatos</span>
          <span>•</span>
          <span>sem consulta</span>
        </footer>
      </section>
    </main>
  );
}

export default Home;