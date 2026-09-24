type Registro = {
  contagem: number;
  expiraEm: number;
};

const JANELA_MS = 10 * 60 * 1000;
const MAXIMO_POR_JANELA = 1;

const registros = new Map<string, Registro>();

function limparExpirados(agora: number): void {
  for (const [chave, registro] of registros) {
    if (registro.expiraEm <= agora) {
      registros.delete(chave);
    }
  }
}

export function verificarLimite(chave: string): {
  permitido: boolean;
  segundosRestantes: number;
} {
  const agora = Date.now();

  if (registros.size > 5000) {
    limparExpirados(agora);
  }

  const registro = registros.get(chave);

  if (!registro || registro.expiraEm <= agora) {
    registros.set(chave, {
      contagem: 1,
      expiraEm: agora + JANELA_MS,
    });

    return {
      permitido: true,
      segundosRestantes: 0,
    };
  }

  if (registro.contagem >= MAXIMO_POR_JANELA) {
    return {
      permitido: false,
      segundosRestantes: Math.ceil(
        (registro.expiraEm - agora) / 1000,
      ),
    };
  }

  registro.contagem += 1;

  return {
    permitido: true,
    segundosRestantes: 0,
  };
}

export function reiniciarLimite(): void {
  registros.clear();
}