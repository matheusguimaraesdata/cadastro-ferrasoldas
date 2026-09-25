type Registro = {
  contagem: number;
  expiraEm: number;
};

// Configuração ajustada para uso corporativo/intensivo:
// Permite até 50 envios por dia por IP (janela de 24 horas)
const JANELA_MS = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
const MAXIMO_POR_JANELA = 50;           // 50 envios por dia

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