'use client';

import { forwardRef } from 'react';

type Props = {
  nome: string;
  rotulo: string;
  opcoes: readonly string[];
  erro?: string;
  obrigatorio?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>;

const CampoRadio = forwardRef<HTMLInputElement, Props>(function CampoRadio(
  { nome, rotulo, opcoes, erro, obrigatorio, ...resto },
  ref,
) {
  const idErro = erro ? `${nome}-erro` : undefined;

  return (
    <div className="campo">
      <fieldset
        className="opcoes"
        aria-invalid={Boolean(erro)}
        aria-describedby={idErro}
      >
        <legend className="opcoes__legenda">
          {rotulo}
          {obrigatorio && (
            <span className="campo__obrigatorio" aria-hidden="true">
              *
            </span>
          )}
        </legend>
        {opcoes.map((opcao, indice) => (
          <label className="opcao" key={opcao}>
            <input
              type="radio"
              value={opcao}
              ref={indice === 0 ? ref : undefined}
              {...resto}
              name={nome}
            />
            <span>{opcao}</span>
          </label>
        ))}
      </fieldset>
      {erro && (
        <span className="campo__erro" id={idErro} role="alert">
          {erro}
        </span>
      )}
    </div>
  );
});

export default CampoRadio;
