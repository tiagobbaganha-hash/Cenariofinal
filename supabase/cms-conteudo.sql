-- ============================================================
-- CENÁRIOX — CONTEÚDO CMS COMPLETO
-- Baseado em análise de Polymarket, Kalshi, VoxFi
-- Execute no SQL Editor
-- ============================================================

-- Limpar páginas existentes e inserir novas
DELETE FROM cms_pages WHERE slug IN ('termos','privacidade','ajuda','como-funciona','sobre','riscos','regras');

INSERT INTO cms_pages (slug, title, content, content_md, is_published, published, show_in_footer, sort_order) VALUES

('termos', 'Termos de Uso', '## Termos de Uso do CenárioX

Última atualização: Abril de 2026

### 1. Aceitação dos Termos
Ao acessar e utilizar a plataforma CenárioX, você concorda com estes Termos de Uso. Se não concordar, não utilize nossos serviços.

### 2. Descrição do Serviço
O CenárioX é uma plataforma de mercados preditivos que permite aos usuários negociar contratos baseados em eventos futuros. Os contratos são binários (SIM/NÃO) ou de múltipla escolha, com resolução baseada em fontes públicas verificáveis.

### 3. Elegibilidade
Para utilizar o CenárioX você deve: ter no mínimo 18 anos de idade; possuir CPF válido; residir no Brasil; completar o processo de verificação de identidade (KYC); concordar com estes Termos e a Política de Privacidade.

### 4. Conta do Usuário
Cada pessoa pode manter apenas uma conta. Você é responsável por manter a confidencialidade de suas credenciais. Qualquer atividade em sua conta é de sua responsabilidade. Compartilhamento de contas é proibido.

### 5. Funcionamento dos Mercados
Os mercados são criados pela equipe CenárioX ou por influenciadores parceiros aprovados. Cada mercado possui: título em formato de pergunta; descrição com critérios de resolução; fonte oficial para verificação; data de encerramento e resolução; opções de apostas com odds dinâmicas.

### 6. Depósitos e Saques
Depósitos são realizados via PIX e creditados após confirmação. Saques são processados em até 3 dias úteis via PIX para a conta bancária verificada do titular. Valor mínimo de saque: R$ 20,00. Pode haver retenção de impostos conforme legislação vigente.

### 7. Odds Dinâmicas (AMM)
O CenárioX utiliza um sistema de Market Maker Automatizado (AMM). As odds mudam conforme o volume de apostas em cada lado. Quanto mais pessoas apostam em uma opção, menor o retorno potencial daquela opção e maior o da opção contrária.

### 8. Resolução de Mercados
Os mercados são resolvidos com base nas fontes oficiais indicadas na descrição. A resolução é final e irrecorrível. Em caso de ambiguidade, a equipe CenárioX pode: declarar o mercado nulo e reembolsar todos os apostadores; ou aguardar clarificação da fonte oficial.

### 9. Responsabilidades do Usuário
O usuário reconhece que: mercados preditivos envolvem risco de perda total do valor apostado; resultados passados não garantem resultados futuros; deve apostar apenas valores que pode perder; não deve utilizar informações privilegiadas para obter vantagem indevida.

### 10. Proibições
É proibido: manipular mercados ou tentar influenciar resultados; criar múltiplas contas; utilizar bots ou automação não autorizada; apostar com informações privilegiadas; atividades de lavagem de dinheiro.

### 11. Programa de Influenciadores
Influenciadores parceiros podem criar mercados personalizados e receber comissão sobre o volume gerado por seus indicados. A comissão é definida individualmente e paga automaticamente.

### 12. Limitação de Responsabilidade
O CenárioX não se responsabiliza por: perdas financeiras decorrentes de apostas; indisponibilidade temporária da plataforma; erros em fontes oficiais de resolução; atos de terceiros que afetem o resultado de eventos.

### 13. Alterações
Reservamo-nos o direito de alterar estes Termos a qualquer momento, com aviso prévio de 15 dias aos usuários cadastrados.

### 14. Contato
Dúvidas sobre estes Termos: contato@cenariox.com.br', 
'Termos de Uso do CenárioX...', true, true, true, 1),

('privacidade', 'Política de Privacidade', '## Política de Privacidade

Última atualização: Abril de 2026. Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).

### 1. Dados Coletados
Coletamos: dados cadastrais (nome, CPF, e-mail, telefone, endereço); dados de verificação (documentos de identidade para KYC); dados financeiros (histórico de depósitos, saques e apostas); dados de navegação (IP, dispositivo, cookies); dados de uso (mercados visitados, apostas realizadas).

### 2. Finalidade do Tratamento
Seus dados são utilizados para: criar e gerenciar sua conta; processar depósitos e saques; cumprir obrigações legais e regulatórias; prevenir fraudes e lavagem de dinheiro; melhorar a experiência na plataforma; enviar comunicações sobre seus mercados e apostas.

### 3. Base Legal
O tratamento dos seus dados é baseado em: consentimento (Art. 7º, I da LGPD); execução de contrato (Art. 7º, V); cumprimento de obrigação legal (Art. 7º, II); interesse legítimo (Art. 7º, IX).

### 4. Compartilhamento de Dados
Seus dados podem ser compartilhados com: prestadores de serviço de pagamento (processamento PIX); serviços de verificação de identidade (KYC/Veriff); autoridades governamentais quando exigido por lei; parceiros de análise de dados (de forma anonimizada).

### 5. Seus Direitos (LGPD)
Você tem direito a: confirmar a existência de tratamento de dados; acessar seus dados pessoais; corrigir dados incompletos ou desatualizados; solicitar anonimização ou eliminação de dados desnecessários; solicitar portabilidade dos dados; revogar consentimento a qualquer momento; solicitar exclusão de conta e dados.

### 6. Segurança
Utilizamos criptografia, controles de acesso e monitoramento contínuo para proteger seus dados. Entretanto, nenhum sistema é 100% seguro.

### 7. Retenção de Dados
Dados são mantidos enquanto sua conta estiver ativa e por 5 anos após o encerramento, conforme obrigações legais e fiscais.

### 8. Cookies
Utilizamos cookies para: manter sua sessão ativa; lembrar preferências; análise de uso da plataforma. Você pode desativar cookies no navegador, mas isso pode afetar funcionalidades.

### 9. Encarregado de Dados (DPO)
Para exercer seus direitos: privacidade@cenariox.com.br

### 10. Alterações
Esta política pode ser atualizada periodicamente. Notificaremos sobre mudanças significativas.', 
'Política de Privacidade...', true, true, true, 2),

('como-funciona', 'Como Funciona', '## Como Funciona o CenárioX

### O que é um mercado preditivo?
Um mercado preditivo é uma plataforma onde você pode negociar contratos baseados no resultado de eventos futuros. Pense como uma bolsa de valores, mas em vez de ações, o que se negocia são perguntas sobre o futuro.

### Como apostar?
1. Crie sua conta e complete a verificação
2. Deposite via PIX (mínimo R$ 10)
3. Explore os mercados disponíveis
4. Escolha SIM ou NÃO em um mercado
5. Defina o valor da aposta
6. Confirme e acompanhe

### Como as odds funcionam?
O CenárioX usa um sistema de AMM (Market Maker Automatizado). As odds mudam em tempo real conforme as pessoas apostam. Se muita gente aposta SIM, o preço do SIM sobe e do NÃO desce. Você está essencialmente comprando uma opinião sobre o futuro.

### Como ganhar?
Se você apostou SIM e o evento acontece, você recebe o valor da aposta multiplicado pelas odds no momento da aposta. Se o evento não acontece, você perde o valor apostado.

### Como os mercados são resolvidos?
Cada mercado tem uma fonte oficial de resolução (ex: TSE para eleições, IBGE para dados econômicos). Quando o evento acontece, a equipe CenárioX verifica a fonte e resolve o mercado. Apostadores do lado vencedor recebem automaticamente.

### Taxas
Atualmente não cobramos taxa sobre apostas. Pode haver taxa de saque em casos específicos.

### Programa de Influenciadores
Criadores de conteúdo podem ter mercados personalizados e ganhar comissão sobre o volume gerado por seus seguidores.', 
'Como Funciona...', true, true, true, 3),

('ajuda', 'Central de Ajuda', '## Central de Ajuda

### Conta
**Como criar minha conta?** Acesse cenariox.com.br, clique em Começar, informe seu e-mail e senha. Complete o onboarding com nome, CPF e aceite dos termos.

**Esqueci minha senha.** Na tela de login, clique em Esqueci a senha e siga as instruções enviadas por e-mail.

**Como verificar minha identidade?** Vá em Conta > Editar perfil e preencha seus dados. Para saques acima de R$ 1.000, será necessário enviar documentos.

### Depósitos e Saques
**Como depositar?** Vá em Carteira > Depositar. Informe o valor e faça o PIX para a chave informada. O crédito é processado em até 30 minutos.

**Como sacar?** Vá em Carteira > Sacar. Informe o valor e sua chave PIX. Saques são processados em até 3 dias úteis.

**Qual o valor mínimo?** Depósito mínimo: R$ 10. Saque mínimo: R$ 20.

### Apostas
**Como apostar?** Escolha um mercado, selecione SIM ou NÃO, defina o valor e confirme.

**Posso cancelar uma aposta?** Não. Apostas são finais e não podem ser canceladas após confirmação.

**O que acontece se o mercado for cancelado?** Todos os apostadores recebem o valor apostado de volta integralmente.

**As odds mudam?** Sim. O CenárioX usa AMM (odds dinâmicas). As odds mudam conforme o volume de apostas em cada lado.

### Problemas
**Minha aposta não foi registrada.** Verifique se tinha saldo suficiente e se o mercado estava aberto. Se o problema persistir, entre em contato.

**Não recebi meu saque.** Saques são processados em até 3 dias úteis. Se ultrapassar esse prazo, entre em contato.

**Contato:** contato@cenariox.com.br', 
'Central de Ajuda...', true, true, true, 4),

('sobre', 'Sobre o CenárioX', '## Sobre o CenárioX

O CenárioX é a plataforma brasileira de mercados preditivos onde sua opinião tem valor.

### Nossa Missão
Democratizar o acesso a mercados preditivos no Brasil, permitindo que qualquer pessoa possa expressar suas previsões sobre eventos futuros de forma segura, transparente e acessível.

### O que nos diferencia
Somos 100% brasileiros, com foco no que importa para o público do Brasil: eleições, economia, esportes, cultura e entretenimento nacionais. Aceitamos PIX, falamos português e entendemos o contexto brasileiro.

### Tecnologia
Utilizamos inteligência artificial para criar mercados relevantes, odds dinâmicas via AMM para precificação justa, e infraestrutura de nível bancário para segurança dos seus dados e fundos.

### Programa de Influenciadores
Trabalhamos com criadores de conteúdo que trazem sua audiência para a plataforma e ganham comissão sobre o volume gerado. Influenciadores podem criar mercados personalizados exclusivos.

### Contato
E-mail: contato@cenariox.com.br
Instagram: @cenariox
Twitter/X: @cenariox_br', 
'Sobre o CenárioX...', true, true, true, 5),

('riscos', 'Aviso de Riscos', '## Aviso de Riscos

### Risco de Perda
Mercados preditivos envolvem risco significativo. Você pode perder todo o valor apostado em um mercado. Nunca aposte mais do que pode perder.

### Natureza Especulativa
Os contratos negociados no CenárioX são de natureza especulativa. As odds refletem a opinião coletiva dos participantes e não garantem o resultado real do evento.

### Sem Garantias
O CenárioX não garante retornos financeiros. Resultados passados não indicam resultados futuros. As odds podem mudar rapidamente e sem aviso.

### Liquidez
Em mercados com baixo volume, pode ser difícil encontrar contraparte para sua aposta. As odds podem variar significativamente em mercados com pouca liquidez.

### Riscos Operacionais
A plataforma pode estar temporariamente indisponível por manutenção ou problemas técnicos. Durante esses períodos, não será possível realizar apostas ou saques.

### Responsabilidade
Aposte com responsabilidade. Se você sentir que está perdendo o controle sobre suas apostas, procure ajuda profissional. Proibido para menores de 18 anos.', 
'Aviso de Riscos...', true, true, true, 6);

SELECT COUNT(*) as paginas_criadas FROM cms_pages WHERE is_published = true;
