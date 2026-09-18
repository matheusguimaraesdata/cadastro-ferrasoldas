import { describe, expect, it } from 'vitest';
import { schemaCadastro } from '@/lib/schema';

const base = {
  email: 'financeiro@empresa.com.br',
  nome: 'Metalúrgica Exemplo Ltda',
  documento: '11.222.333/0001-81', // CNPJ base válido
  inscricaoEstadual: 'ISENTO',
  rg: '',
  telefone: '(31) 3333-4444',
  endereco: 'Rua das Bigornas, 120, Galpão 3',
  cidade: 'Contagem',
  estado: 'MG',
  cep: '32000-000',
  vendedor: 'Leonardo Ferreira',
  valorVenda: 'R$ 12.500,00',
  referenciasComerciais: [
    'Alfa Ferramentas - (31) 3333-1111',
    'Beta Insumos - (31) 3333-2222',
    'Gama Aços - (31) 3333-3333',
  ].join('\n'),
  website: '',
};

function erroDe(dados: Record<string, unknown>, campo: string): string | undefined {
  const r = schemaCadastro.safeParse(dados);
  if (r.success) return undefined;
  return r.error.issues.find((i) => i.path[0] === campo)?.message;
}

describe('schemaCadastro', () => {
  it('aceita um cadastro completo e normaliza o documento', () => {
    const r = schemaCadastro.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.documento).toBe('11222333000181');
  });

  it('aceita cadastro de pessoa física com RG preenchido', () => {
    const r = schemaCadastro.safeParse({
      ...base,
      documento: '529.982.247-25', // CPF válido para teste
      rg: 'MG-12.345.678',
    });
    expect(r.success).toBe(true);
  });

  it('recusa documento com dígito verificador errado', () => {
    // CORRIGIDO: Passado o segundo argumento 'documento' e alterado para um final '23' estritamente inválido
    expect(erroDe({ ...base, documento: '11.222.333/0001-23' }, 'documento')).toBeTruthy();
  });

  it('exige no mínimo três referências comerciais com telefone', () => {
    const erro = erroDe(
      { ...base, referenciasComerciais: 'Alfa - (31) 3333-1111\nBeta' },
      'referenciasComerciais',
    );
    expect(erro).toMatch(/mínimo 3/i);
  });

  it('trata estado e CEP como opcionais', () => {
    const r = schemaCadastro.safeParse({ ...base, estado: '', cep: '' });
    expect(r.success).toBe(true);
  });

  it('recusa sigla de estado com formato errado', () => {
    expect(erroDe({ ...base, estado: 'M' }, 'estado')).toBeTruthy();
  });

  it('recusa vendedor fora da lista', () => {
    expect(erroDe({ ...base, vendedor: 'Fulano' }, 'vendedor')).toBeTruthy();
  });

  it('recusa e-mail inválido', () => {
    expect(erroDe({ ...base, email: 'financeiro@' }, 'email')).toBeTruthy();
  });

  it('recusa telefone sem DDD', () => {
    expect(erroDe({ ...base, telefone: '33334444' }, 'telefone')).toBeTruthy();
  });

  it('marca o honeypot preenchido como inválido', () => {
    expect(erroDe({ ...base, website: 'http://spam' }, 'website')).toBeTruthy();
  });
});
