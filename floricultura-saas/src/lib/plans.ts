/**
 * Planos exibidos na landing page. Edite aqui para mudar preços e itens.
 * Obs.: os planos ainda não limitam funções dentro do sistema.
 */

export const CONTACT_WHATSAPP = "5541999689700";

export const waLink = (text: string) => `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(text)}`;

export const SETUP_FEE = 497;

export type Plan = {
  key: string;
  name: string;
  price: number;
  tagline: string;
  highlight?: boolean;
  setupIncluded?: boolean;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    key: "essencial",
    name: "Essencial",
    price: 97,
    tagline: "Para organizar o dia a dia da loja",
    features: [
      "Pedidos com cartão, destinatário e pagamento",
      "Quadro de produção e agenda de entregas",
      "Estoque com ficha técnica e baixa automática",
      "Clientes, endereços e datas especiais",
      "Relatórios de vendas",
      "Até 2 usuários",
    ],
  },
  {
    key: "profissional",
    name: "Profissional",
    price: 197,
    tagline: "Para vender mais e perder menos flores",
    highlight: true,
    features: [
      "Tudo do Essencial",
      "Aviso de perecibilidade e taxa de perda",
      "Lista de compras inteligente por fornecedor",
      "Vitrine online com fotos e pedido pelo WhatsApp",
      "Seleções personalizadas por cliente",
      "Ofertas do dia e desempenho da vitrine",
      "Até 5 usuários",
    ],
  },
  {
    key: "premium",
    name: "Premium",
    price: 347,
    tagline: "Para quem tem mais de uma loja ou quer tudo pronto",
    setupIncluded: true,
    features: [
      "Tudo do Profissional",
      "Várias lojas na mesma conta",
      "Usuários ilimitados",
      "Vitrine no seu próprio domínio",
      "Implantação completa inclusa",
      "Acompanhamento mensal de resultados",
    ],
  },
];
