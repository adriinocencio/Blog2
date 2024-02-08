const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const session = require('express-session');

const app = express();
const port = 3000;

const db = mysql.createConnection({
    host: 'localhost',
    user: 'phpmyadmin',
    password: 'aluno',
    database: 'mydb',
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        throw err;
    }
    console.log('Conexão com o banco de dados MySQL estabelecida.');
});

app.use(session({
    secret: 'sua_chave_secreta',
    resave: true,
    saveUninitialized: true,
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');


//AUTENTICAÇÃO LOGIN
function verificaAutenticacao(req, res, next) {
    if (req.session.loggedin) {
        next();
    } else {
        res.redirect('/login');
    }
}

app.post('/login', (req, res) => {
    const { email, senha } = req.body;
    const query = 'SELECT * FROM users WHERE email = ? AND senha = ?'; //procurando email e senha na tabela users

    db.query(query, [email, senha], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            req.session.loggedin = true;
            req.session.email = email;
            res.redirect('/admin');//deu certo vai para a pagina admin
        } else {
            res.send('Credenciais incorretas. <a href="/">Tente novamente</a>');
        }
    });
});

app.get('/admin', verificaAutenticacao, (req, res) => {//rota para a pagina admin
  db.query('SELECT * FROM postagens', (err, result) => {
      if (err) throw err;

      // Passar as postagens para o template 'admin'
      res.render('admin', { postagens: result });
  });
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/'); //faz logout
    });
});


//POSTAGENS
app.get('/postagens', (req, res) => {
    db.query('SELECT * FROM postagens', (err, result) => {
        if (err) throw err;
        res.render('postagens', { postagens: result });//listar postagens
    });
});

// Rota para exibir o formulário de criação de postagem
app.get('/criar-postagem', verificaAutenticacao, (req, res) => {
    res.render('criar-postagem');
});

// Rota para processar a criação de postagem
app.post('/criar-postagem', verificaAutenticacao, (req, res) => {
    const { titulo, conteudo, descricao, autor, imagemCapa } = req.body;

    // Adicione mais campos conforme necessário
    const query = 'INSERT INTO postagens (titulo, conteudo, descricao, autor, imagemCapa, data) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [titulo, conteudo, descricao, autor, imagemCapa, data], (err, result) => {
        if (err) {
            console.error('Erro ao criar a postagem:', err);
            res.send('Erro ao criar a postagem.');
        } else {
            console.log('Postagem criada com sucesso.');
            res.redirect('/admin');
        }
    });
});


//ARRUMANDO A DATA
const pt = require('date-fns/locale/pt-BR');

const data = new Date(); // Substitua isso pela sua data

const opcoesFormato = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
const dataFormatada = data.toLocaleDateString('pt-BR', opcoesFormato);

console.log(dataFormatada);


//ROTAS PÁGINAS
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/sobre', (req, res) => {
    res.render('sobre');
});

app.get('/contato', (req, res) => {
    res.render('contato');
});

app.get('/postagens', (req, res) => {
    res.render('postagens');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});