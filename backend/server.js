const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

// Configurações do servidor
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware de log
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Configuração do pool de conexões MySQL
const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'kikoisa1',
  database: 'lawbridgem',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Funções utilitárias
function formatDateToMySQL(dateString) {
  if (!dateString) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
  
  const [day, month, year] = dateString.split('/');
  if (day && month && year) {
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return null;
}

function validateRequiredFields(fields, reqBody) {
  const missingFields = fields.filter(field => !reqBody[field]);
  return missingFields.length === 0;
}

// Rotas de autenticação
app.post('/login/advogado', async (req, res) => {
  let connection;
  try {
    const { email, senha } = req.body;
    
    if (!validateRequiredFields(['email', 'senha'], req.body)) {
      return res.status(400).json({ 
        success: false, 
        message: 'E-mail e senha são obrigatórios' 
      });
    }

    connection = await pool.getConnection();

    const [rows] = await connection.execute(
      `SELECT id, nome, sobrenome, email, oab, identificadorA 
       FROM advogado 
       WHERE email = ? AND senha = ?`,
      [email, senha]
    );

    if (rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciais inválidas' 
      });
    }

    return res.json({ 
      success: true, 
      message: 'Login bem-sucedido',
      advogado: rows[0]
    });

  } catch (error) {
    console.error('Erro no login do advogado:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor',
      error: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

app.post('/login/cliente', async (req, res) => {
  let connection;
  try {
    const { email, senha } = req.body;

    if (!validateRequiredFields(['email', 'senha'], req.body)) {
      return res.status(400).json({
        success: false,
        message: 'E-mail e senha são obrigatórios'
      });
    }

    connection = await pool.getConnection();

    // Query modificada - removido advogado_id
    const [clienteRows] = await connection.execute(
      `SELECT id, nome, sobrenome, email, identificador, 
       celular, data_nascimento, cpf, senha
       FROM cliente 
       WHERE email = ?`,
      [email]
    );

    if (clienteRows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'E-mail não encontrado'
      });
    }

    const cliente = clienteRows[0];
    
    // Verifica a senha
    if (senha !== cliente.senha) {
      return res.status(401).json({
        success: false,
        message: 'Senha incorreta'
      });
    }

    // Remove a senha antes de retornar
    const { senha: _, ...clienteSemSenha } = cliente;

    return res.json({
      success: true,
      message: 'Login bem-sucedido',
      cliente: clienteSemSenha
    });

  } catch (error) {
    console.error('Erro no login do cliente:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Rotas para processos do advogado
app.get('/advogado/:identificadorA/processos', async (req, res) => {
  let connection;
  try {
    const { identificadorA } = req.params;
    connection = await pool.getConnection();

    const [processos] = await connection.execute(
      `SELECT p.id, p.numprocesso, p.assunto, p.status, 
       DATE_FORMAT(p.dataP, '%d/%m/%Y') as data_formatada,
       c.id as cliente_id, CONCAT(c.nome, ' ', c.sobrenome) as cliente_nome
       FROM processo p
       LEFT JOIN cliente_processo cp ON p.id = cp.processo_id
       LEFT JOIN cliente c ON cp.cliente_id = c.id
       WHERE p.identificadorA = ?`,
      [identificadorA]
    );

    return res.json(processos);

  } catch (error) {
    console.error('Erro ao buscar processos do advogado:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar processos do advogado',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Rota para processos do cliente - Corrigida
app.get('/cliente/:identificador/processos', async (req, res) => {
  let connection;
  try {
    const { identificador } = req.params;
    connection = await pool.getConnection();

    // Busca os dados do cliente
    const [clienteRows] = await connection.execute(
      `SELECT id, nome, sobrenome, email, celular, 
       data_nascimento, 
       cpf, identificador
       FROM cliente 
       WHERE identificador = ?`,
      [identificador]
    );

    if (clienteRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cliente não encontrado' 
      });
    }

    const cliente = clienteRows[0];

    // Busca os processos com informações completas do advogado
    const [processos] = await connection.execute(
      `SELECT 
        p.id,
        p.numprocesso,
        p.assunto,
        p.status,
        DATE_FORMAT(p.dataP, '%d/%m/%Y') as data_formatada,
        a.identificadorA,
        CONCAT(a.nome, ' ', a.sobrenome) as advogado_nome,
        a.oab
       FROM processo p
       JOIN cliente_processo cp ON p.id = cp.processo_id
       JOIN cliente c ON cp.cliente_id = c.id
       LEFT JOIN advogado a ON p.identificadorA = a.identificadorA
       WHERE c.identificador = ?`,
      [identificador]
    );

    return res.json({
      success: true,
      cliente,
      processos
    });

  } catch (error) {
    console.error('Erro ao buscar processos do cliente:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar processos',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Rotas de CRUD para clientes
app.post('/clientes', async (req, res) => {
  let connection;
  try {
    const { nome, sobrenome, email, cpf, celular, data_nascimento, senha } = req.body;
    
    if (!validateRequiredFields(['nome', 'email', 'cpf', 'senha'], req.body)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Campos obrigatórios faltando' 
      });
    }

    connection = await pool.getConnection();

    // Verifica se email ou CPF já existem
    const [existing] = await connection.execute(
      `SELECT id FROM cliente 
       WHERE email = ? OR cpf = ?`,
      [email, cpf]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'E-mail ou CPF já cadastrados' 
      });
    }

    const dataNascimentoMySQL = formatDateToMySQL(data_nascimento);
    const identificador = `CLI-${Date.now()}`;

    const [result] = await connection.execute(
      `INSERT INTO cliente 
       (identificador, nome, sobrenome, email, cpf, celular, data_nascimento, senha) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [identificador, nome, sobrenome, email, cpf, celular, dataNascimentoMySQL, senha]
    );

    return res.json({ 
      success: true, 
      message: 'Cliente cadastrado com sucesso',
      clienteId: result.insertId 
    });

  } catch (error) {
    console.error('Erro ao cadastrar cliente:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao cadastrar cliente',
      error: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

app.get('/clientes', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [clientes] = await connection.execute(
      `SELECT id, nome, sobrenome, email, celular, 
       DATE_FORMAT(data_nascimento, '%d/%m/%Y') as data_nascimento, 
       cpf, identificador 
       FROM cliente`
    );

    return res.json(clientes);

  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar clientes' 
    });
  } finally {
    if (connection) connection.release();
  }
});

app.get('/cliente/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await pool.getConnection();

    const [cliente] = await connection.execute(
      `SELECT id, nome, sobrenome, email, celular, 
       DATE_FORMAT(data_nascimento, '%d/%m/%Y') as data_nascimento, 
       cpf, identificador
       FROM cliente 
       WHERE id = ?`,
      [id]
    );

    if (cliente.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cliente não encontrado' 
      });
    }

    return res.json({
      success: true,
      cliente: cliente[0]
    });

  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar cliente' 
    });
  } finally {
    if (connection) connection.release();
  }
});

// Rotas de CRUD para advogados
app.post('/advogados', async (req, res) => {
  let connection;
  try {
    const { nome, sobrenome, email, oab, senha } = req.body;
    
    if (!validateRequiredFields(['nome', 'email', 'oab', 'senha'], req.body)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Campos obrigatórios faltando' 
      });
    }

    connection = await pool.getConnection();

    // Verifica se email ou OAB já existem
    const [existing] = await connection.execute(
      `SELECT id FROM advogado 
       WHERE email = ? OR oab = ?`,
      [email, oab]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'E-mail ou OAB já cadastrados' 
      });
    }

    const identificadorA = `ADV-${Date.now()}`;

    const [result] = await connection.execute(
      `INSERT INTO advogado 
       (identificadorA, nome, sobrenome, email, oab, senha) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [identificadorA, nome, sobrenome, email, oab, senha]
    );

    return res.json({ 
      success: true, 
      message: 'Advogado cadastrado com sucesso',
      advogadoId: result.insertId 
    });

  } catch (error) {
    console.error('Erro ao cadastrar advogado:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao cadastrar advogado',
      error: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

// Rotas para processos
app.post('/processos', async (req, res) => {
  let connection;
  try {
    const { numprocesso, assunto, status, identificadorA, cliente_id, comarca, dataP } = req.body;
    
    // Campos obrigatórios
    if (!numprocesso || !assunto || !identificadorA) {
      return res.status(400).json({ 
        success: false, 
        message: 'Número do processo, assunto e identificador do advogado são obrigatórios' 
      });
    }

    connection = await pool.getConnection();

    // Verifica se advogado existe
    const [advogado] = await connection.execute(
      `SELECT id FROM advogado WHERE identificadorA = ?`,
      [identificadorA]
    );

    if (advogado.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Advogado não encontrado' 
      });
    }

    // Verifica se o processo já existe
    const [existingProcess] = await connection.execute(
      `SELECT id FROM processo WHERE numprocesso = ?`,
      [numprocesso]
    );

    if (existingProcess.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Número de processo já cadastrado' 
      });
    }

    // Insere o processo
    const [result] = await connection.execute(
      `INSERT INTO processo 
       (numprocesso, assunto, status, identificadorA, comarca, dataP) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        numprocesso,
        assunto,
        status || 'Pendente',
        identificadorA,
        comarca || null,
        dataP // Já deve vir formatado do frontend como YYYY-MM-DD ou null
      ]
    );

    // Se houver cliente_id, faz o vínculo
    if (cliente_id) {
      // Verifica se cliente existe
      const [cliente] = await connection.execute(
        `SELECT id FROM cliente WHERE id = ?`,
        [cliente_id]
      );

      if (cliente.length > 0) {
        await connection.execute(
          `INSERT INTO cliente_processo (cliente_id, processo_id) VALUES (?, ?)`,
          [cliente_id, result.insertId]
        );
      }
    }

    return res.json({ 
      success: true, 
      message: 'Processo cadastrado com sucesso',
      processoId: result.insertId 
    });

  } catch (error) {
    console.error('Erro detalhado no cadastro de processo:', {
      message: error.message,
      code: error.code,
      sql: error.sql,
      stack: error.stack
    });
    
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao cadastrar processo',
      error: error.message,
      details: error.code === 'ER_TRUNCATED_WRONG_VALUE' 
        ? 'Formato de data inválido. Use YYYY-MM-DD' 
        : null
    });
  } finally {
    if (connection) connection.release();
  }
});


// Rota para deletar processo
app.delete('/processos/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await pool.getConnection();

    // Primeiro deleta o vínculo na tabela cliente_processo
    await connection.execute(
      `DELETE FROM cliente_processo WHERE processo_id = ?`,
      [id]
    );

    // Depois deleta o processo
    const [result] = await connection.execute(
      `DELETE FROM processo WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Processo não encontrado' 
      });
    }

    return res.json({ 
      success: true, 
      message: 'Processo deletado com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao deletar processo:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao deletar processo',
      error: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});



// Rota para vincular cliente a advogado
app.post('/clientes/vincular-advogado', async (req, res) => {
  let connection;
  try {
    const { cliente_id, advogado_id } = req.body;
    
    if (!validateRequiredFields(['cliente_id', 'advogado_id'], req.body)) {
      return res.status(400).json({ 
        success: false, 
        message: 'IDs de cliente e advogado são obrigatórios' 
      });
    }

    connection = await pool.getConnection();

    // Atualiza o advogado_id na tabela cliente
    const [result] = await connection.execute(
      `UPDATE cliente 
       SET advogado_id = ? 
       WHERE id = ?`,
      [advogado_id, cliente_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cliente não encontrado' 
      });
    }

    return res.json({ 
      success: true, 
      message: 'Advogado vinculado com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao vincular advogado:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao vincular advogado',
      error: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

// Rota para atualizar processo
app.put('/processos/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { numprocesso, assunto, status, comarca, dataP, cliente_id } = req.body;
    
    if (!numprocesso || !assunto) {
      return res.status(400).json({ 
        success: false, 
        message: 'Número do processo e assunto são obrigatórios' 
      });
    }

    connection = await pool.getConnection();

    // Atualiza o processo
    const [result] = await connection.execute(
      `UPDATE processo 
       SET numprocesso = ?, assunto = ?, status = ?, comarca = ?, dataP = ?
       WHERE id = ?`,
      [numprocesso, assunto, status || 'Pendente', comarca || null, dataP, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Processo não encontrado' 
      });
    }

    // Se houver cliente_id, atualiza o vínculo
    if (cliente_id) {
      // Primeiro remove qualquer vínculo existente
      await connection.execute(
        `DELETE FROM cliente_processo WHERE processo_id = ?`,
        [id]
      );

      // Cria novo vínculo
      await connection.execute(
        `INSERT INTO cliente_processo (cliente_id, processo_id) VALUES (?, ?)`,
        [cliente_id, id]
      );
    }

    return res.json({ 
      success: true, 
      message: 'Processo atualizado com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao atualizar processo:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar processo',
      error: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

// Rota para buscar processo por número
app.get('/processos/buscar/:numero', async (req, res) => {
  let connection;
  try {
    const { numero } = req.params;
    connection = await pool.getConnection();

    const [processo] = await connection.execute(
      `SELECT p.id, p.numprocesso, p.assunto, p.status, 
       DATE_FORMAT(p.dataP, '%d/%m/%Y') as dataPFormatada,
       p.comarca, p.identificadorA,
       cp.cliente_id
       FROM processo p
       LEFT JOIN cliente_processo cp ON p.id = cp.processo_id
       WHERE p.numprocesso = ?`,
      [numero]
    );

    if (processo.length === 0) {
      return res.status(404).json(null);
    }

    return res.json(processo[0]);

  } catch (error) {
    console.error('Erro ao buscar processo:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar processo',
      error: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});


// Rota para obter processos do cliente
app.get('/cliente/:id/processos', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await pool.getConnection();

    const [processos] = await connection.execute(
      `SELECT p.id, p.numprocesso, p.assunto, p.status, 
       DATE_FORMAT(p.dataP, '%d/%m/%Y') as data_processo,
       a.nome as advogado_nome, a.sobrenome as advogado_sobrenome, a.oab
       FROM processo p
       JOIN cliente_processo cp ON p.id = cp.processo_id
       LEFT JOIN advogado a ON p.identificadorA = a.identificadorA
       WHERE cp.cliente_id = ?`,
      [id]
    );

    return res.json({
      success: true,
      processos: processos
    });

  } catch (error) {
    console.error('Erro ao buscar processos do cliente:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar processos',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Adicione esta rota no seu server.js, junto com as outras rotas de autenticação
app.post('/cliente/trocar-senha', async (req, res) => {
  console.log('Rota /cliente/trocar-senha acessada', req.body);
  let connection;
  try {
    const { email, senhaAtual, novaSenha, confirmarSenha } = req.body;
    
    // Validações
    if (!validateRequiredFields(['email', 'senhaAtual', 'novaSenha', 'confirmarSenha'], req.body)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos os campos são obrigatórios' 
      });
    }

    if (novaSenha !== confirmarSenha) {
      return res.status(400).json({ 
        success: false, 
        message: 'A nova senha e a confirmação não coincidem' 
      });
    }

    connection = await pool.getConnection();

    // Verifica se o cliente existe e a senha atual está correta
    const [clienteRows] = await connection.execute(
      `SELECT id, senha FROM cliente WHERE email = ?`,
      [email]
    );

    if (clienteRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cliente não encontrado' 
      });
    }

    const cliente = clienteRows[0];
    
    // Verifica a senha atual
    if (senhaAtual !== cliente.senha) {
      return res.status(401).json({ 
        success: false, 
        message: 'Senha atual incorreta' 
      });
    }

    // Atualiza a senha
    await connection.execute(
      `UPDATE cliente SET senha = ? WHERE id = ?`,
      [novaSenha, cliente.id]
    );

    return res.json({ 
      success: true, 
      message: 'Senha alterada com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao trocar senha:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao trocar senha',
      error: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});



// Iniciar servidor
app.listen(PORT, '192.168.1.2', () => {
  console.log(`Servidor LawBridge rodando em http://192.168.1.2:${PORT}`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
  console.error('Erro não tratado:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Exceção não capturada:', err);
});