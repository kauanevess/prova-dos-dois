import "./FundoFotos.css";

function FundoFotos() {
  return (
    <div className="fundo-fotos" aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => (
        <div
          className={`bloco-foto bloco-foto-${index + 1}`}
          key={index}
        >
          <img
            src={`/fotos-fundo/foto-${index + 1}.jpg`}
            alt=""
          />
        </div>
      ))}

      <div className="fundo-overlay" />
    </div>
  );
}

export default FundoFotos;