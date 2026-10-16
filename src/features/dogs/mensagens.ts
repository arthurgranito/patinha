// Textos de tela do cão, copiados de docs/flows.md (F08 a F12). Transversais em @/lib/mensagens.
export const MSG_NOME_CAO_PERGUNTA = 'Como seu cão se chama?';
export const MSG_NOME_CAO_INVALIDO = 'Use um nome de 1 a 30 caracteres.';
export const MSG_FOTO_FALHOU = 'Não conseguimos enviar a foto. Você pode tentar de novo depois.';
export const MSG_SEM_CAMERA = 'Sem acesso à câmera. Você pode escolher da galeria ou pular.';
export const MSG_LIMITE_GRATIS = 'No plano grátis você cadastra 1 cão. Com o Premium, até 5.';
export const MSG_LIMITE_PREMIUM =
  'Você chegou ao limite de 5 cães. Arquive um para adicionar outro.';
export const MSG_MAIS_CAES_PREMIUM = 'Mais cães no Premium';
export const MSG_INCOMODANDO = 'O que está te incomodando?';
export const MSG_TEMPO_POR_DIA = 'Quanto tempo você tem por dia?';
export const MSG_TRIAGEM_GRAVE =
  'Esse comportamento merece a ajuda de um adestrador presencial ou de um veterinário comportamentalista. Aqui no Patinha você pode treinar outras coisas enquanto isso, mas não vamos montar um plano para esse ponto.';
export const MSG_MES_FUTURO = 'Escolha um mês que já passou.';

// Sem o plano (Fase 5), no lugar de "O plano do Caramelo está pronto 🐾".
export const msgTudoPronto = (nome: string) => `Tudo pronto para treinar com ${nome} 🐾`;
export const msgArquivarConfirma = (nome: string) =>
  `Arquivar o ${nome}? O histórico fica guardado e você pode reativar depois.`;
export const msgExcluirConfirma = (nome: string) =>
  `Excluir para sempre o ${nome} e todo o histórico de treino?`;
export const msgPartiuOpcao = (nome: string) => `O ${nome} partiu 🌈`;
export const msgPartiuConfirma = (nome: string) =>
  `Sentimos muito pela partida de ${nome}. 🌈 O histórico fica guardado com carinho, e o Patinha não vai mais mandar lembretes nem cards de ${nome}.`;
export const msgPartiuGuardado = (nome: string) =>
  `${nome} está guardado com carinho e não pode ser reativado.`;
