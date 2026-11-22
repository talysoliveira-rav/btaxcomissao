# Roteiro de teste — Florescer (antes do piloto)

Tempo estimado: **45 a 60 minutos**. Use um **computador** (painel da floricultura) e um **celular** (o cliente final).
Para cada passo, marque ✅ se deu certo. Se algo der errado, anote **o número do passo**, tire um **print** e me mande.

Site: https://florescer-ravit5.vercel.app

---

## 0. Preparação no Supabase (uma vez só)

No painel do Supabase, projeto **florescer**:

- [ ] **Authentication → URL Configuration**
  - Site URL: `https://florescer-ravit5.vercel.app`
  - Redirect URLs: `https://florescer-ravit5.vercel.app/auth/callback` e `http://localhost:3000/auth/callback`
- [ ] **Authentication → Providers → Email**: deixe "Confirm email" ligado (recomendado).
- [ ] **Authentication → Policies** (ou "Password security"): ligue a proteção contra senhas vazadas.

---

## 1. Conta e acesso

1. [ ] Em `/signup`, crie uma conta com um e-mail **novo** de teste. → Chega o e-mail de confirmação.
2. [ ] Clique no link do e-mail. → Cai na tela "Vamos configurar sua floricultura".
3. [ ] Dê um nome (ex.: "Floricultura Teste"). → Abre o Início com o checklist "Primeiros passos".
4. [ ] Clique em **Sair** e entre de novo em `/login`. → Volta para o Início.
5. [ ] Saia e clique em **Esqueci minha senha**. Informe o e-mail. → Mensagem "Se houver uma conta…".
6. [ ] Abra o link do e-mail **no mesmo navegador**. → Tela "Criar nova senha". Salve uma senha nova. → Volta ao Início com "Senha alterada com sucesso".
7. [ ] Saia e entre com a **senha nova**. → Funciona. Com a antiga, não.
8. [ ] Em **Configurações**, troque o tema para **Escuro** e recolha o menu (botão na borda ou Ctrl+B). Recarregue a página. → Continua escuro e recolhido.

## 2. Cadastros básicos

9. [ ] **Estoque → Insumos**: cadastre 3 flores, por exemplo:
   - Rosa vermelha — haste — custo 2,80 — mínimo 20 — validade 7 dias — **múltiplo 20**
   - Girassol — haste — custo 4,20 — validade **2** dias
   - Papel kraft — m — custo 1,50 — sem validade
10. [ ] Abra a **Rosa** e registre uma **Entrada** de 40 hastes, fornecedor "CEASA". → Saldo 40 e um lote com validade daqui a 7 dias. Registre também 10 m de **Papel kraft**.
11. [ ] Registre uma entrada de Girassol (10 hastes, fornecedor "Holambra") com validade **amanhã**.
12. [ ] **Catálogo → Novo produto**: "Buquê 12 rosas", R$ 189,90, categoria "Buquês". → Abre a página do produto.
13. [ ] Na **Ficha técnica**, adicione 12 Rosas + 1 Papel kraft. → Aparecem custo, margem e "Dá para montar: 3".
14. [ ] Envie **2 fotos pelo celular** (ou do computador). → Aparecem as miniaturas; a primeira tem a etiqueta "Capa". Troque a capa com a estrela.
15. [ ] Crie mais um produto, "Buquê de girassóis", com 6 Girassóis na ficha técnica e 1 foto.
16. [ ] **Clientes**: cadastre "Ana Teste", com WhatsApp **seu**, um endereço e uma data especial para daqui a 3 dias.
17. [ ] **Configurações → Entregadores**: adicione "João".

## 3. Pedido do começo ao fim

18. [ ] **Novo pedido** para a Ana: 2× Buquê 12 rosas, entrega amanhã à tarde, use o **endereço salvo**, cartão com mensagem sugerida, pagamento Pix pendente. → Pedido #1 criado com total correto (itens + taxa).
19. [ ] **Produção**: escolha "Amanhã". → O pedido aparece em "Novo". Arraste para **Confirmado** e depois **Em produção**.
20. [ ] **Estoque → Rosa**: o saldo caiu **24 hastes** (2 × 12) e há uma movimentação "Consumo (pedido)".
21. [ ] Volte ao pedido e clique em **Cancelar pedido**. → O saldo da Rosa volta (+24). Reabra o pedido.
22. [ ] Avance até **Pronto**, atribua o entregador **João** e use **Imprimir**. → Sai a ficha de produção e o cartão.
23. [ ] **Entregas** (dia de amanhã): o pedido aparece na tarde com "cobrar R$ …". Marque "Saiu p/ entrega" e depois "Entregue".
24. [ ] No pedido, clique em **Marcar pago**. → Pagamento "Pago".

## 4. Estoque, perdas e compras

25. [ ] **Estoque → Perecibilidade**: o Girassol aparece em **"Vencem hoje ou amanhã"**, com valor em risco e "Use em: Buquê de girassóis".
26. [ ] Registre uma **perda parcial** de 2 girassóis. → A taxa de perda e "Maiores perdas" mudam.
27. [ ] O **menu** mostra o contador laranja ao lado de "Estoque".
28. [ ] **Estoque → Compras**: aparecem sugestões agrupadas por fornecedor (CEASA, Holambra), com o "Por quê?". A Rosa vem arredondada para múltiplos de 20.
29. [ ] Clique em **Enviar pedido** de um fornecedor. → Abre o WhatsApp com a lista pronta.
30. [ ] Clique em **Já comprei: registrar entradas** e confirme. → Os saldos aumentam e surgem lotes novos.

## 5. Vitrine online (use o celular como se fosse o cliente)

31. [ ] **Configurações → Vitrine online**: ative, use **Sugerir** na frase e no "Sobre", envie logo e capa, preencha o WhatsApp, use o atalho **Seg a sáb** e marque **Paraná → Curitiba** e "Toda a região de Curitiba". Salve. → "Vitrine salva."
32. [ ] Clique em **Enviar no WhatsApp** (link da vitrine) e mande para você mesmo. → A conversa mostra a **prévia com foto**.
33. [ ] Abra o link no **celular**. → Aparecem capa, "Aberto agora" ou "Fechado · abre…", categorias e produtos com foto.
34. [ ] Abra um produto e toque em **Pedir pelo WhatsApp**. → Abre a conversa com o produto, o preço e o link.
35. [ ] **Catálogo → Ofertas do dia**: o Buquê de girassóis aparece nas sugestões. Clique em **Ativar**. → Na vitrine, a seção "Ofertas do dia" mostra o preço riscado.
36. [ ] **Catálogo → Seleções → Nova seleção**: escolha os 2 produtos, dê um preço especial a um deles, coloque "Ana" e um recado. → Aparece o link.
37. [ ] Abra a seleção no celular e toque em **Quero a opção 2**. → O WhatsApp abre com "Escolhi a opção 2…".
38. [ ] **Catálogo → Desempenho**: aparecem as visitas, os produtos vistos e os cliques que você acabou de fazer.

## 6. Equipe e segurança

39. [ ] **Configurações → Equipe**: convide um **segundo e-mail** como "Equipe". Crie essa conta em outra janela anônima. → Ela entra direto na mesma floricultura.
40. [ ] Com a conta de Equipe, confirme que **não** dá para alterar os dados da floricultura (campos travados).
41. [ ] Com a conta de Equipe, crie uma **segunda floricultura** em "+ Nova floricultura". → Os dados das duas não se misturam: produtos e pedidos de uma não aparecem na outra.
42. [ ] Desative a vitrine e abra o link de novo. → "Vitrine não encontrada". Reative.

---

## Como me mandar o resultado

Para cada passo que falhou: **número do passo + print + o que esperava**. Exemplo:
> 14 — enviei 2 fotos pelo iPhone e apareceu "Não foi possível enviar".
