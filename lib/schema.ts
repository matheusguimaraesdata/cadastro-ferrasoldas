import { z } from 'zod';
import {
  contarReferenciasComTelefone,
  limparDocumento,
  validarCep,
  validarCpfOuCnpj,
  validarTelefone,
} from './validadores';

export const VENDEDORES = [
  'João Paulo',
  'Leonardo Ferreira',
  'Anderson Lopes',
  'Marcos Paulo',
  'Ferrasoldas',
] as const;

const obrigatorio = (campo: string) => `Informe ${campo}.`;

export const schemaCadastro = z.object({
  email: z
    .string()
    .trim()
    .min(1, obrigatorio('o e-mail'))
    .email('E-mail inválido. Confira se falta algo depois do @.')
    .max(254),

  nome: z
    .string()
    .trim()
    .min(3, 'Informe o nome da empresa ou da pessoa física.')
    .max(150),

  documento: z
    .string()
    .trim()
    .min(1, obrigatorio('o CNPJ ou CPF'))
    .refine(validarCpfOuCnpj, 'Documento inválido. Confira os números digitados.')
    .transform(limparDocumento),

  inscricaoEstadual: z
    .string()
    .trim()
    .min(1, 'Informe a inscrição estadual. Se for isento, escreva ISENTO.')
    .max(30),

  rg: z.string().trim().max(30).optional().or(z.literal('')),

  telefone: z
    .string()
    .trim()
    .min(1, obrigatorio('ao menos um telefone'))
    .refine(
      (valor) =>
        valor
          .split(/[\n,;/]/)
          .map((t) => t.trim())
          .filter(Boolean)
          .every(validarTelefone),
      'Telefone inválido. Use DDD + número, por exemplo (31) 3333-4444.',
    ),

  endereco: z.string().trim().min(5, obrigatorio('o endereço')).max(200),

  cidade: z.string().trim().min(2, obrigatorio('a cidade')).max(80),

  estado: z
    .string()
    .trim()
    .max(2)
    .optional()
    .or(z.literal(''))
    .refine(
      (valor) => !valor || /^[A-Za-z]{2}$/.test(valor),
      'Use a sigla com duas letras, como MG.',
    ),

  cep: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((valor) => !valor || validarCep(valor), 'CEP deve ter 8 dígitos.'),

  vendedor: z.enum(VENDEDORES, {
    errorMap: () => ({ message: 'Selecione o vendedor responsável.' }),
  }),

  valorVenda: z
    .string()
    .trim()
    .min(1, obrigatorio('o valor da venda'))
    .refine(
      (valor) => valor.replace(/\D/g, '').length > 0,
      'Informe um valor numérico.',
    ),

  referenciasComerciais: z
    .string()
    .trim()
    .min(1, obrigatorio('as referências comerciais'))
    .refine(
      (valor) => contarReferenciasComTelefone(valor) >= 3,
      'Informe no mínimo 3 referências comerciais, cada uma em uma linha, com telefone de contato.',
    ),

  // Campo honeypot: invisível para pessoas, preenchido por bots.
  website: z.string().max(0, 'Envio bloqueado.').optional().or(z.literal('')),
});

export type DadosCadastro = z.infer<typeof schemaCadastro>;

export const ROTULOS: Record<string, string> = {
  email: 'E-mail',
  nome: 'Empresa / Pessoa Física',
  documento: 'CNPJ ou CPF',
  inscricaoEstadual: 'Inscrição Estadual',
  rg: 'RG',
  telefone: 'Telefone',
  endereco: 'Endereço',
  cidade: 'Cidade',
  estado: 'Estado',
  cep: 'CEP',
  vendedor: 'Vendedor',
  valorVenda: 'Valor da Venda',
  referenciasComerciais: 'Referências Comerciais',
};
