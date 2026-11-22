/** Sugestões de texto para a vitrine: ponto de partida para a floricultura editar. */

type Ctx = { name: string; city?: string | null };

const at = (city?: string | null) => (city ? ` em ${city}` : "");
const pick = <T,>(list: T[], avoid?: T) => {
  const options = list.length > 1 ? list.filter((x) => x !== avoid) : list;
  return options[Math.floor(Math.random() * options.length)];
};

export function taglineOptions({ city }: Ctx): string[] {
  return [
    `Flores frescas entregues com carinho${at(city)}`,
    "Buquês e arranjos feitos à mão para cada momento",
    `Presentes que florescem${at(city)}`,
    "Flores colhidas no dia, montadas com cuidado",
    "Para dizer o que as palavras não conseguem",
    `A floricultura do seu bairro${at(city)}, agora a um toque`,
    "Do aniversário ao “me desculpa”: tem flor para tudo",
    "Entregamos emoção em forma de flores",
  ];
}

export function descriptionOptions({ name, city }: Ctx): string[] {
  return [
    `A ${name} nasceu do amor pelas flores. Trabalhamos com flores frescas, selecionadas todos os dias, e montamos cada buquê e arranjo à mão, com atenção aos detalhes. Entregamos${at(city)} e ajudamos você a escolher o presente ideal para cada ocasião.`,
    `Na ${name}, cada arranjo é pensado para emocionar. Aniversários, datas especiais, nascimentos, pedidos de desculpa ou só para alegrar o dia de alguém: escolha pelas fotos, chame no WhatsApp e cuidamos do resto, do cartão à entrega.`,
    `Somos uma floricultura${at(city)} que acredita que flores transformam momentos. Trabalhamos com flores da estação, buquês, arranjos, cestas e plantas, sempre com acabamento caprichado e entrega pontual.`,
    `Flores frescas, atendimento próximo e entrega no dia: é assim que a ${name} trabalha. Montamos tudo sob medida, com a sua mensagem no cartão, para o presente chegar do jeito que você imaginou.`,
  ];
}

export const nextSuggestion = (options: string[], current: string) => pick(options, current);
