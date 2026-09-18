'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { schemaCadastro, VENDEDORES, type DadosCadastro } from '@/lib/schema';
import {
  mascararCep,
  mascararCpfOuCnpj,
  mascararEstado,
  mascararMoeda,
  mascararTelefone,
} from '@/lib/mascaras';
import CampoTexto from './CampoTexto';
import CampoRadio from './CampoRadio';
import Botao from './ui/Botao';
import Alerta from './ui/Alerta';

type RespostaApi = { mensagem: string; erros?: Record<string, string> };

export default function FormularioCadastro() {
  const router = useRouter();
  const [falha, setFalha] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DadosCadastro>({
    resolver: zodResolver(schemaCadastro),
    mode: 'onBlur',
  });

  /** Aplica a máscara enquanto a pessoa digita, sem perder o registro do campo. */
  const comMascara =
    (campo: keyof DadosCadastro, mascara: (valor: string) => string) =>
    (evento: React.ChangeEvent<HTMLInputElement>) => {
      setValue(campo, mascara(evento.target.value) as never, {
        shouldValidate: false,
      });
    };

  async function enviar(dados: DadosCadastro) {
    setFalha(null);

    try {
      const resposta = await fetch('/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });

      const corpo: RespostaApi = await resposta.json();

      if (resposta.ok) {
        router.push('/obrigado');
        return;
      }

      if (corpo.erros) {
        for (const [campo, mensagem] of Object.entries(corpo.erros)) {
          setError(campo as keyof DadosCadastro, { message: mensagem });
        }
      }
      setFalha(corpo.mensagem);
    } catch {
      setFalha(
        'Não foi possível falar com o servidor. Verifique sua conexão e tente de novo.',
      );
    }
  }

  return (
    <form className="formulario" onSubmit={handleSubmit(enviar)} noValidate>
      <p className="aviso-obrigatorio">
        Campos marcados com <span className="campo__obrigatorio">*</span> são
        obrigatórios.
      </p>

      <CampoTexto
        id="email"
        rotulo="E-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        obrigatorio
        erro={errors.email?.message}
        {...register('email')}
      />

      <CampoTexto
        id="nome"
        rotulo="Empresa / Pessoa Física"
        ajuda="Insira o nome da empresa para CNPJ ou o nome da pessoa para CPF."
        autoComplete="organization"
        obrigatorio
        erro={errors.nome?.message}
        {...register('nome')}
      />

      <CampoTexto
        id="documento"
        rotulo="CNPJ ou CPF"
        ajuda="O CNPJ pode conter letras nas 12 primeiras posições."
        obrigatorio
        erro={errors.documento?.message}
        {...register('documento', {
          onChange: comMascara('documento', mascararCpfOuCnpj),
        })}
      />

      <CampoTexto
        id="inscricaoEstadual"
        rotulo="Inscrição Estadual"
        ajuda="Se a empresa for isenta, escreva ISENTO."
        obrigatorio
        erro={errors.inscricaoEstadual?.message}
        {...register('inscricaoEstadual')}
      />

      <CampoTexto
        id="rg"
        rotulo="RG (Registro Geral)"
        ajuda="Preencha apenas no cadastro por CPF."
        erro={errors.rg?.message}
        {...register('rg')}
      />

      <CampoTexto
        id="telefone"
        rotulo="Telefone"
        ajuda="Um ou mais números para contato, separados por vírgula."
        inputMode="tel"
        autoComplete="tel"
        obrigatorio
        erro={errors.telefone?.message}
        {...register('telefone', {
          onChange: comMascara('telefone', mascararTelefone),
        })}
      />

      <CampoTexto
        id="endereco"
        rotulo="Endereço"
        ajuda="Rua, número, complemento e bairro."
        autoComplete="street-address"
        obrigatorio
        erro={errors.endereco?.message}
        {...register('endereco')}
      />

      <CampoTexto
        id="cidade"
        rotulo="Cidade"
        autoComplete="address-level2"
        obrigatorio
        erro={errors.cidade?.message}
        {...register('cidade')}
      />

      <CampoTexto
        id="estado"
        rotulo="Estado"
        ajuda="Sigla com duas letras, como MG."
        autoComplete="address-level1"
        erro={errors.estado?.message}
        {...register('estado', {
          onChange: comMascara('estado', mascararEstado),
        })}
      />

      <CampoTexto
        id="cep"
        rotulo="CEP"
        inputMode="numeric"
        autoComplete="postal-code"
        erro={errors.cep?.message}
        {...register('cep', { onChange: comMascara('cep', mascararCep) })}
      />

      <CampoRadio
        nome="vendedor"
        rotulo="Vendedor"
        opcoes={VENDEDORES}
        obrigatorio
        erro={errors.vendedor?.message}
        {...register('vendedor')}
      />

      <CampoTexto
        id="valorVenda"
        rotulo="Valor da Venda"
        inputMode="numeric"
        obrigatorio
        erro={errors.valorVenda?.message}
        {...register('valorVenda', {
          onChange: comMascara('valorVenda', mascararMoeda),
        })}
      />

      <CampoTexto
        id="referenciasComerciais"
        rotulo="Referências Comerciais"
        ajuda="No mínimo 3 referências, uma por linha, cada uma com telefone de contato."
        multilinha
        obrigatorio
        erro={errors.referenciasComerciais?.message}
        {...register('referenciasComerciais')}
      />

      {/* Honeypot: fica fora da vista e do foco. Bot preenche, pessoa não. */}
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Não preencha este campo</label>
        <input
          id="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register('website')}
        />
      </div>

      {falha && <Alerta tipo="erro">{falha}</Alerta>}

      <div className="rodape">
        <Botao enviando={isSubmitting}>Enviar cadastro</Botao>
      </div>

      <p className="privacidade">
        Os dados informados são usados apenas para abrir e manter seu cadastro
        comercial na Ferrasoldas. Eles são enviados por e-mail ao setor
        financeiro e não ficam armazenados neste site.
      </p>
    </form>
  );
}
