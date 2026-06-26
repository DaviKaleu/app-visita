-- Top Planejados V105 Online
-- Ajuste de estoque padrão: lista sem quantidade, sem estoque mínimo e sem custo.
-- Rode somente se seu banco já estiver atualizado até a V104.

-- Mantém a estrutura atual. Apenas limpa os valores dos itens padrão editáveis.
update public.inventory_items
set
  current_qty = 0,
  min_qty = 0,
  avg_cost = 0,
  notes = coalesce(nullif(notes, ''), 'Item padrão editável sem quantidade/mínimo/custo.')
where item_name in (
  'MDF Branco TX 15 mm',
  'MDF Branco TX 18 mm',
  'MDF Plomo 15 mm',
  'MDF Ópera Micro 15 mm',
  'MDF Chumbo 15 mm',
  'MDF Carvalho Treviso 15 mm',
  'MDF Roble Catedral 15 mm',
  'Fita Branco TX 22 mm',
  'Fita Plomo 22 mm',
  'Fita Ópera Micro 22 mm',
  'Fita Chumbo 22 mm',
  'Fita Carvalho Treviso 22 mm',
  'Fita Roble Catedral 22 mm',
  'Parafuso 4x16',
  'Parafuso 4x25',
  'Parafuso 4x40',
  'Dobradiça reta com amortecedor',
  'Dobradiça curva com amortecedor',
  'Dobradiça super curva com amortecedor',
  'Corrediça telescópica 400 mm',
  'Corrediça telescópica 450 mm',
  'Corrediça telescópica 500 mm',
  'Pistão 60N',
  'Pistão 80N',
  'Pistão 100N',
  'Perfil gola preto',
  'Perfil cava 45°',
  'Cabideiro cromado',
  'Suporte para cabideiro',
  'Bucha 6 mm',
  'Bucha 8 mm',
  'Silicone transparente',
  'PU branco',
  'Cola branca',
  'Cola instantânea',
  'Tapa Furo Branco TX',
  'Tapa Furo Plomo',
  'Tapa Furo Ópera Micro',
  'Tapa Furo Chumbo',
  'Tapa Furo Carvalho Treviso',
  'Tapa Furo Roble Catedral',
  'Pistão Inverso 60N',
  'Pistão Inverso 80N',
  'Pistão Inverso 100N'
)
and (
  notes ilike '%Item padrão%'
  or min_qty > 0
);
