import { z } from 'zod';
import {
  limparDocumento,
  validarCep,
  validarCpf,
  validarCnpj,
  validarTelefone,
} from './validadores';

export const VENDEDORES = [
  'Guilherme Resende',
  'Paulo Ferraz',
  'Otávio Oliveira',
  'João Paulo',
  'Leonardo Ferreira',
  'Anderson Lopes',
  'Marcos Paulo',
  'Ezequiel Lopes',
  'Ferrasoldas',
] as const;

export const ESTADOS_BRASIL = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
] as const;

const referenciaSchema = z.object({
  empresa: z
    .string()
    .trim()
    .min(2, 'Informe a empresa da referência.')
    .max(150),

  telefone: z
    .string()
    .trim()
    .refine(
      validarTelefone,
      'Telefone inválido. Use (31) 99999-9999.',
    ),
});

export const schemaCadastro = z
  .object({
    tipoPessoa: z.enum(['PF', 'PJ']),

    razaoSocial: z
      .string()
      .trim()
      .max(150)
      .optional()
      .or(z.literal('')),

    nome: z
      .string()
      .trim()
      .max(150)
      .optional()
      .or(z.literal('')),

    cnpj: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .default('')
      .transform(limparDocumento),

    cpf: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .default('')
      .transform((v) => v.replace(/\D/g, '')),

    rg: z
      .string()
      .trim()
      .max(30)
      .optional()
      .or(z.literal('')),

    inscricaoEstadual: z
      .string()
      .trim()
      .max(30)
      .optional()
      .or(z.literal('')),

    email: z
      .string()
      .trim()
      .email('E-mail inválido.')
      .max(254),

    telefone: z
      .string()
      .trim()
      .refine(
        validarTelefone,
        'Telefone inválido. Use (31) 99999-9999.',
      ),

    cep: z
      .string()
      .trim()
      .refine(validarCep, 'CEP deve ter 8 dígitos.'),

    endereco: z
      .string()
      .trim()
      .min(3, 'Informe o logradouro.')
      .max(200),

    numero: z
      .string()
      .trim()
      .min(1, 'Informe o número.')
      .max(20),

    complemento: z
      .string()
      .trim()
      .max(100)
      .optional()
      .or(z.literal('')),

    bairro: z
      .string()
      .trim()
      .min(2, 'Informe o bairro.')
      .max(100),

    estado: z.string().length(2, 'Selecione o estado.'),

    cidade: z
      .string()
      .trim()
      .min(2, 'Selecione o município.')
      .max(100),

    /*
     * O formulário começa com vendedor = ''.
     * Por isso o schema precisa aceitar '' durante a entrada.
     * O superRefine abaixo impede que o cadastro seja enviado
     * sem um vendedor selecionado.
     */
    vendedor: z.union([
      z.enum(VENDEDORES),
      z.literal(''),
    ]),

    valorVenda: z
      .string()
      .trim()
      .min(1, 'Informe o valor da venda.'),

    referenciasComerciais: z
      .array(referenciaSchema)
      .min(3, 'Informe pelo menos 3 referências.')
      .max(6, 'O limite é de 6 referências.'),

    website: z
      .string()
      .max(0)
      .optional()
      .or(z.literal('')),
  })
  .superRefine((dados, ctx) => {
    if (!dados.vendedor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['vendedor'],
        message: 'Selecione o vendedor responsável.',
      });
    }

    if (dados.tipoPessoa === 'PJ') {
      if (!dados.razaoSocial || dados.razaoSocial.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['razaoSocial'],
          message: 'Informe a razão social.',
        });
      }

      if (!validarCnpj(dados.cnpj)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cnpj'],
          message: 'CNPJ inválido.',
        });
      }

      if (!dados.inscricaoEstadual) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['inscricaoEstadual'],
          message: 'Informe a inscrição estadual ou ISENTO.',
        });
      }
    } else {
      if (!dados.nome || dados.nome.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['nome'],
          message: 'Informe o nome completo.',
        });
      }

      if (!dados.rg) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['rg'],
          message: 'Informe o RG.',
        });
      }

      if (!validarCpf(dados.cpf)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cpf'],
          message: 'CPF inválido.',
        });
      }
    }
  });

export type DadosCadastro = z.infer<typeof schemaCadastro>;

export const ROTULOS: Record<string, string> = {
  tipoPessoa: 'Tipo de pessoa',
  razaoSocial: 'Razão Social',
  nome: 'Nome completo',
  cnpj: 'CNPJ',
  cpf: 'CPF',
  rg: 'RG',
  inscricaoEstadual: 'Inscrição Estadual',
  email: 'E-mail',
  telefone: 'Telefone',
  cep: 'CEP',
  endereco: 'Rua / Logradouro',
  numero: 'Número',
  complemento: 'Complemento',
  bairro: 'Bairro',
  estado: 'Estado',
  cidade: 'Município',
  vendedor: 'Vendedor',
  valorVenda: 'Valor da Venda',
};