'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  schemaCadastro,
  VENDEDORES,
  ESTADOS_BRASIL,
  type DadosCadastro,
} from '@/lib/schema';
import {
  mascararCep,
  mascararCpfOuCnpj,
  mascararMoeda,
  mascararTelefone,
} from '@/lib/mascaras';
import CampoTexto from './CampoTexto';
import Alerta from './ui/Alerta';
import Botao from './ui/Botao';

type RespostaApi = { mensagem: string; erros?: Record<string, string> };
type Aba = 'cliente' | 'endereco' | 'comercial';

const DOMINIOS_EMAIL = [
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'yahoo.com',
  'icloud.com',
  'live.com',
  'bol.com.br',
  'uol.com.br',
];

const ABAS: { id: Aba; titulo: string; descricao: string }[] = [
  { id: 'cliente', titulo: 'Cliente', descricao: 'Identificação' },
  { id: 'endereco', titulo: 'Endereço e contato', descricao: 'Localização' },
  { id: 'comercial', titulo: 'Dados comerciais', descricao: 'Referências e venda' },
];

export default function FormularioCadastro() {
  const router = useRouter();
  const [falha, setFalha] = useState<string | null>(null);
  const [aba, setAba] = useState<Aba>('cliente');
  const [carregandoCep, setCarregandoCep] = useState(false);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [cidades, setCidades] = useState<{ id: number; nome: string }[]>([]);
  const [mostrarDominios, setMostrarDominios] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<DadosCadastro>({
    resolver: zodResolver(schemaCadastro),
    mode: 'onBlur',
    defaultValues: {
      tipoPessoa: 'PJ',
      razaoSocial: '',
      nome: '',
      cnpj: '',
      cpf: '',
      rg: '',
      inscricaoEstadual: '',
      email: '',
      telefone: '',
      cep: '',
      endereco: '',
      numero: '',
      complemento: '',
      bairro: '',
      estado: '',
      cidade: '',
      vendedor: '',
      valorVenda: '',
      referenciasComerciais: [
        { empresa: '', telefone: '' },
        { empresa: '', telefone: '' },
        { empresa: '', telefone: '' },
      ],
      website: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'referenciasComerciais',
  });

  const tipoPessoa = watch('tipoPessoa');
  const email = watch('email');
  const cep = watch('cep');
  const estado = watch('estado');

  const emailSugestoes = useMemo(() => {
    if (!email || email.includes('@')) return [];
    return DOMINIOS_EMAIL.map((dominio) => `${email}@${dominio}`);
  }, [email]);

  useEffect(() => {
    if (!estado) {
      setCidades([]);
      return;
    }

    let ativo = true;
    setCarregandoCidades(true);

    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios`)
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao consultar municípios');
        return res.json();
      })
      .then((dados: { id: number; nome: string }[]) => {
        if (ativo) setCidades(dados.sort((a, b) => a.nome.localeCompare(b.nome)));
      })
      .catch(() => {
        if (ativo) setCidades([]);
      })
      .finally(() => {
        if (ativo) setCarregandoCidades(false);
      });

    return () => {
      ativo = false;
    };
  }, [estado]);

  useEffect(() => {
    const numeros = cep?.replace(/\D/g, '') ?? '';
    if (numeros.length !== 8) return;

    let ativo = true;
    setCarregandoCep(true);

    fetch(`https://viacep.com.br/ws/${numeros}/json/`)
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao consultar CEP');
        return res.json();
      })
      .then((dados) => {
        if (!ativo || dados.erro) return;
        setValue('endereco', dados.logradouro ?? '', { shouldValidate: true });
        setValue('bairro', dados.bairro ?? '', { shouldValidate: true });
        setValue('estado', dados.uf ?? '', { shouldValidate: true });
        setValue('cidade', dados.localidade ?? '', { shouldValidate: true });
      })
      .catch(() => undefined)
      .finally(() => {
        if (ativo) setCarregandoCep(false);
      });

    return () => {
      ativo = false;
    };
  }, [cep, setValue]);

  function selecionarDominio(dominio: string) {
    setValue('email', `${email}@${dominio}`, { shouldValidate: true });
    setMostrarDominios(false);
  }

  function avancar() {
    const ordem: Aba[] = ['cliente', 'endereco', 'comercial'];
    const atual = ordem.indexOf(aba);
    if (atual < ordem.length - 1) setAba(ordem[atual + 1]);
  }

  async function irParaAba(destino: Aba) {
    const camposPorAba: Record<Aba, (keyof DadosCadastro)[]> = {
      cliente: ['tipoPessoa', 'razaoSocial', 'nome', 'cnpj', 'cpf', 'rg', 'inscricaoEstadual'],
      endereco: ['email', 'telefone', 'cep', 'endereco', 'numero', 'complemento', 'bairro', 'estado', 'cidade'],
      comercial: ['vendedor', 'valorVenda', 'referenciasComerciais'],
    };

    const valido = await trigger(camposPorAba[aba]);
    if (valido || ABAS.findIndex((item) => item.id === destino) < ABAS.findIndex((item) => item.id === aba)) {
      setAba(destino);
    }
  }

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
      setAba('cliente');
    } catch {
      setFalha('Não foi possível falar com o servidor. Verifique sua conexão e tente novamente.');
    }
  }

  return (
    <form className="formulario" onSubmit={handleSubmit(enviar)} noValidate>
      <div className="progresso" aria-label="Etapas do cadastro">
        {ABAS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`progresso__item ${aba === item.id ? 'progresso__item--ativo' : ''}`}
            onClick={() => irParaAba(item.id)}
          >
            <span className="progresso__numero">{index + 1}</span>
            <span>
              <strong>{item.titulo}</strong>
              <small>{item.descricao}</small>
            </span>
          </button>
        ))}
      </div>

      <p className="aviso-obrigatorio">
        Campos marcados com <span className="campo__obrigatorio">*</span> são obrigatórios.
      </p>

      {aba === 'cliente' && (
        <section className="secao">
          <div className="secao__cabecalho">
            <span className="secao__eyebrow">ETAPA 01</span>
            <h2>Identificação do cliente</h2>
            <p>Escolha o tipo de cadastro para exibirmos somente os campos necessários.</p>
          </div>

          <div className="tipo-pessoa">
            <label className={tipoPessoa === 'PJ' ? 'tipo-pessoa__opcao tipo-pessoa__opcao--ativo' : 'tipo-pessoa__opcao'}>
              <input type="radio" value="PJ" {...register('tipoPessoa')} />
              <span><strong>Pessoa Jurídica</strong><small>Empresa / CNPJ</small></span>
            </label>
            <label className={tipoPessoa === 'PF' ? 'tipo-pessoa__opcao tipo-pessoa__opcao--ativo' : 'tipo-pessoa__opcao'}>
              <input type="radio" value="PF" {...register('tipoPessoa')} />
              <span><strong>Pessoa Física</strong><small>Cliente / CPF</small></span>
            </label>
          </div>

          {tipoPessoa === 'PJ' ? (
            <>
              <CampoTexto
                id="razaoSocial"
                rotulo="Razão Social"
                autoComplete="organization"
                obrigatorio
                erro={errors.razaoSocial?.message}
                {...register('razaoSocial')}
              />
              <div className="grade grade--2">
                <CampoTexto
                  id="cnpj"
                  rotulo="CNPJ"
                  inputMode="text"
                  obrigatorio
                  erro={errors.cnpj?.message}
                  {...register('cnpj', {
                    onChange: (e) => setValue('cnpj', mascararCpfOuCnpj(e.target.value), { shouldValidate: false }),
                  })}
                />
                <CampoTexto
                  id="inscricaoEstadual"
                  rotulo="Inscrição Estadual"
                  ajuda="Se for isento, informe ISENTO."
                  obrigatorio
                  erro={errors.inscricaoEstadual?.message}
                  {...register('inscricaoEstadual')}
                />
              </div>
            </>
          ) : (
            <>
              <CampoTexto
                id="nome"
                rotulo="Nome completo"
                autoComplete="name"
                obrigatorio
                erro={errors.nome?.message}
                {...register('nome')}
              />
              <div className="grade grade--2">
                <CampoTexto
                  id="rg"
                  rotulo="RG"
                  autoComplete="off"
                  obrigatorio
                  erro={errors.rg?.message}
                  {...register('rg')}
                />
                <CampoTexto
                  id="cpf"
                  rotulo="CPF"
                  inputMode="numeric"
                  obrigatorio
                  erro={errors.cpf?.message}
                  {...register('cpf', {
                    onChange: (e) => setValue('cpf', mascararCpfOuCnpj(e.target.value), { shouldValidate: false }),
                  })}
                />
              </div>
            </>
          )}

          <div className="navegacao">
            <span />
            <button type="button" className="botao botao--primario" onClick={avancar}>
              Continuar
            </button>
          </div>
        </section>
      )}

      {aba === 'endereco' && (
        <section className="secao">
          <div className="secao__cabecalho">
            <span className="secao__eyebrow">ETAPA 02</span>
            <h2>Endereço e contato</h2>
            <p>Informe o CEP para preencher automaticamente rua, bairro, estado e município.</p>
          </div>

          <div className="grade grade--cep">
            <CampoTexto
              id="cep"
              rotulo="CEP"
              inputMode="numeric"
              autoComplete="postal-code"
              obrigatorio
              erro={errors.cep?.message}
              {...register('cep', {
                onChange: (e) => setValue('cep', mascararCep(e.target.value), { shouldValidate: false }),
              })}
            />
            <div className="cep-status">
              {carregandoCep ? 'Consultando CEP…' : 'Preenchimento automático'}
            </div>
          </div>

          <div className="grade grade--endereco">
            <CampoTexto id="endereco" rotulo="Rua / Logradouro" autoComplete="street-address" obrigatorio erro={errors.endereco?.message} {...register('endereco')} />
            <CampoTexto id="numero" rotulo="Número" inputMode="numeric" obrigatorio erro={errors.numero?.message} {...register('numero')} />
          </div>

          <div className="grade grade--2">
            <CampoTexto id="bairro" rotulo="Bairro" autoComplete="address-level3" obrigatorio erro={errors.bairro?.message} {...register('bairro')} />
            <CampoTexto id="complemento" rotulo="Complemento" autoComplete="address-line2" erro={errors.complemento?.message} {...register('complemento')} />
          </div>

          <div className="grade grade--2">
            <div className="campo">
              <label className="campo__rotulo" htmlFor="estado">Estado<span className="campo__obrigatorio">*</span></label>
              <select className="campo__entrada" id="estado" {...register('estado')}>
                <option value="">Selecione o estado</option>
                {ESTADOS_BRASIL.map((item) => <option key={item.sigla} value={item.sigla}>{item.nome} ({item.sigla})</option>)}
              </select>
              {errors.estado?.message && <span className="campo__erro">{errors.estado.message}</span>}
            </div>

            <div className="campo">
              <label className="campo__rotulo" htmlFor="cidade">Município<span className="campo__obrigatorio">*</span></label>
              <select className="campo__entrada" id="cidade" disabled={!estado || carregandoCidades} {...register('cidade')}>
                <option value="">{carregandoCidades ? 'Carregando municípios…' : 'Selecione o município'}</option>
                {cidades.map((cidade) => <option key={cidade.id} value={cidade.nome}>{cidade.nome}</option>)}
              </select>
              {errors.cidade?.message && <span className="campo__erro">{errors.cidade.message}</span>}
            </div>
          </div>

          <div className="grade grade--2">
            <div className="campo campo--email">
              <label className="campo__rotulo" htmlFor="email">E-mail<span className="campo__obrigatorio">*</span></label>
              <div className="email-autocomplete">
                <input
                  id="email"
                  className="campo__entrada"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  {...register('email', { onFocus: () => setMostrarDominios(true) })}
                />
                {mostrarDominios && emailSugestoes.length > 0 && (
                  <div className="email-autocomplete__lista">
                    {emailSugestoes.slice(0, 6).map((sugestao) => (
                      <button type="button" key={sugestao} onMouseDown={(e) => e.preventDefault()} onClick={() => selecionarDominio(sugestao.split('@').pop()!)}>
                        {sugestao}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.email?.message && <span className="campo__erro">{errors.email.message}</span>}
            </div>

            <CampoTexto
              id="telefone"
              rotulo="Telefone de contato"
              inputMode="tel"
              autoComplete="tel"
              obrigatorio
              erro={errors.telefone?.message}
              {...register('telefone', {
                onChange: (e) => setValue('telefone', mascararTelefone(e.target.value), { shouldValidate: false }),
              })}
            />
          </div>

          <div className="navegacao">
            <button type="button" className="botao botao--secundario" onClick={() => setAba('cliente')}>Voltar</button>
            <button type="button" className="botao botao--primario" onClick={avancar}>Continuar</button>
          </div>
        </section>
      )}

      {aba === 'comercial' && (
        <section className="secao">
          <div className="secao__cabecalho">
            <span className="secao__eyebrow">ETAPA 03</span>
            <h2>Dados comerciais</h2>
            <p>Informe o vendedor responsável e pelo menos três referências comerciais.</p>
          </div>

          <div className="grade grade--2">
            <div className="campo">
              <label className="campo__rotulo" htmlFor="vendedor">Vendedor de preferência<span className="campo__obrigatorio">*</span></label>
              <select className="campo__entrada" id="vendedor" {...register('vendedor')}>
                <option value="">Selecione o vendedor</option>
                {VENDEDORES.map((vendedor) => <option key={vendedor} value={vendedor}>{vendedor}</option>)}
              </select>
              {errors.vendedor?.message && <span className="campo__erro">{errors.vendedor.message}</span>}
            </div>

            <CampoTexto
              id="valorVenda"
              rotulo="Valor estimado da venda"
              inputMode="numeric"
              obrigatorio
              erro={errors.valorVenda?.message}
              {...register('valorVenda', {
                onChange: (e) => setValue('valorVenda', mascararMoeda(e.target.value), { shouldValidate: false }),
              })}
            />
          </div>

          <div className="referencias">
            <div className="referencias__cabecalho">
              <div>
                <h3>Referências comerciais</h3>
                <p>Começamos com 3. Você pode adicionar até 6 referências.</p>
              </div>
              <span>{fields.length}/6</span>
            </div>

            {fields.map((field, index) => (
              <div className="referencia" key={field.id}>
                <div className="referencia__numero">{String(index + 1).padStart(2, '0')}</div>
                <div className="referencia__campos">
                  <CampoTexto
                    id={`referenciasComerciais.${index}.empresa`}
                    rotulo="Empresa"
                    obrigatorio
                    erro={errors.referenciasComerciais?.[index]?.empresa?.message}
                    {...register(`referenciasComerciais.${index}.empresa`)}
                  />
                  <CampoTexto
                    id={`referenciasComerciais.${index}.telefone`}
                    rotulo="Telefone"
                    inputMode="tel"
                    obrigatorio
                    erro={errors.referenciasComerciais?.[index]?.telefone?.message}
                    {...register(`referenciasComerciais.${index}.telefone`, {
                      onChange: (e) => setValue(`referenciasComerciais.${index}.telefone`, mascararTelefone(e.target.value), { shouldValidate: false }),
                    })}
                  />
                </div>
                {fields.length > 3 && (
                  <button type="button" className="referencia__remover" onClick={() => remove(index)} aria-label={`Remover referência ${index + 1}`}>Remover</button>
                )}
              </div>
            ))}

            {fields.length < 6 && (
              <button type="button" className="adicionar-referencia" onClick={() => append({ empresa: '', telefone: '' })}>
                + Adicionar referência
              </button>
            )}

            {errors.referenciasComerciais?.message && (
              <span className="campo__erro" role="alert">{errors.referenciasComerciais.message}</span>
            )}
          </div>

          <div className="honeypot" aria-hidden="true">
            <label htmlFor="website">Não preencha este campo</label>
            <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
          </div>

          {falha && <Alerta tipo="erro">{falha}</Alerta>}

          <div className="navegacao">
            <button type="button" className="botao botao--secundario" onClick={() => setAba('endereco')}>Voltar</button>
            <Botao enviando={isSubmitting}>Enviar cadastro</Botao>
          </div>
        </section>
      )}

      <p className="privacidade">
        Os dados são usados para abertura e manutenção do cadastro comercial da Ferrasoldas
        e encaminhados ao setor financeiro. O site não mantém banco de dados próprio.
      </p>
    </form>
  );
}
