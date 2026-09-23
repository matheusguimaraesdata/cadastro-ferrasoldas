'use client';

import { forwardRef } from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    id: string;
    rotulo: string;
    ajuda?: string;
    obrigatorio?: boolean;
    erro?: string;
    multilinha?: boolean;
  };

const CampoTexto = forwardRef<HTMLInputElement & HTMLTextAreaElement, Props>(
  function CampoTexto(
    { id, rotulo, ajuda, obrigatorio, erro, multilinha, ...resto },
    ref,
  ) {
    const idAjuda = ajuda ? `${id}-ajuda` : undefined;
    const idErro = erro ? `${id}-erro` : undefined;
    const descritoPor = [idAjuda, idErro].filter(Boolean).join(' ') || undefined;

    const comuns = {
      id,
      ref,
      'aria-invalid': Boolean(erro),
      'aria-describedby': descritoPor,
      ...resto,
    };

    return (
      <div className="campo">
        <label className="campo__rotulo" htmlFor={id}>
          {rotulo}
          {obrigatorio && (
            <span className="campo__obrigatorio" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {ajuda && (
          <p className="campo__ajuda" id={idAjuda}>
            {ajuda}
          </p>
        )}
        {multilinha ? (
          <textarea className="campo__area" {...comuns} />
        ) : (
          <input className="campo__entrada" {...comuns} />
        )}
        {erro && (
          <span className="campo__erro" id={idErro} role="alert">
            {erro}
          </span>
        )}
      </div>
    );
  },
);

export default CampoTexto;
