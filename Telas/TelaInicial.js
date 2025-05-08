import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Animated, ActivityIndicator, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';

const TelaInicial = ({ navigation }) => {
  // Estados para controle de exibição
  const [exibirLoginAdvogado, setExibirLoginAdvogado] = useState(false);
  const [exibirLoginCliente, setExibirLoginCliente] = useState(false);
  
  // Estados para dados de login
  const [emailAdvogado, setEmailAdvogado] = useState('');
  const [senhaAdvogado, setSenhaAdvogado] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [senhaCliente, setSenhaCliente] = useState('');
  
  // Estados para visibilidade de senha
  const [senhaAdvogadoVisivel, setSenhaAdvogadoVisivel] = useState(false);
  const [senhaClienteVisivel, setSenhaClienteVisivel] = useState(false);
  
  // Estados para loading e erros
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  
  // Animação dos botões
  const botaoLarguraInicial = 150;
  const botaoLarguraExpandida = 240;
  const botaoAdvogadoLargura = useRef(new Animated.Value(botaoLarguraInicial)).current;
  const botaoClienteLargura = useRef(new Animated.Value(botaoLarguraInicial)).current;
  const [exibirTrocarSenha, setExibirTrocarSenha] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [senhaTrocaVisivel, setSenhaTrocaVisivel] = useState({
    atual: false,
    nova: false,
    confirmar: false
  });
  const [trocaSenhaSucesso, setTrocaSenhaSucesso] = useState(false);

  const animarBotoes = (expandirAdvogado, expandirCliente) => {
    Animated.parallel([
      Animated.spring(botaoAdvogadoLargura, {
        toValue: expandirAdvogado ? botaoLarguraExpandida : botaoLarguraInicial,
        useNativeDriver: false,
      }),
      Animated.spring(botaoClienteLargura, {
        toValue: expandirCliente ? botaoLarguraExpandida : botaoLarguraInicial,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleLoginAdvogado = async () => {
    setLoginError(null);
    
    // Validações
    if (!emailAdvogado || !senhaAdvogado) {
      setLoginError('Por favor, preencha email e senha');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(emailAdvogado)) {
      setLoginError('Por favor, insira um email válido');
      return;
    }

    setLoading(true);
    
    try {
      const response = await axios.post('http://192.168.1.2:3000/login/advogado', {
        email: emailAdvogado,
        senha: senhaAdvogado
      });

      if (response.data.success) {
        navigation.navigate('TelaAdvogado', {
          advogado: response.data.advogado
        });
      } else {
        setLoginError(response.data.message || 'Email ou senha incorretos');
      }
    } catch (error) {
      console.error('Erro no login do advogado:', error);
      setLoginError('Erro ao conectar como advogado');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginCliente = async () => {
    setLoginError(null);
    
    // Validações
    if (!emailCliente || !senhaCliente) {
      setLoginError('Por favor, preencha email e senha');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(emailCliente)) {
      setLoginError('Por favor, insira um email válido');
      return;
    }

    setLoading(true);
    
    try {
      const response = await axios.post('http://192.168.1.2:3000/login/cliente', {
        email: emailCliente,
        senha: senhaCliente
      });

      if (response.data.success) {
        navigation.navigate('TelaCliente', {
          cliente: response.data.cliente
        });
      } else {
        setLoginError(response.data.message || 'Credenciais inválidas');
      }
    } catch (error) {
      console.error('Erro no login do cliente:', error);
      
      if (error.response) {
        setLoginError(error.response.data.message || 'Erro no servidor');
      } else if (error.request) {
        setLoginError('Sem resposta do servidor. Verifique sua conexão.');
      } else {
        setLoginError('Erro ao configurar a requisição');
      }
    } finally {
      setLoading(false);
    }
  };


  const handleTrocarSenha = async () => {
    setLoginError(null);
    
    // Validações
    if (!emailCliente || !senhaAtual || !novaSenha || !confirmarSenha) {
      setLoginError('Por favor, preencha todos os campos');
      return;
    }
  
    if (novaSenha !== confirmarSenha) {
      setLoginError('A nova senha e a confirmação não coincidem');
      return;
    }
  
    setLoading(true);
    
    try {
      const response = await axios.post('http://192.168.1.2:3000/cliente/trocar-senha', {
        email: emailCliente,
        senhaAtual: senhaAtual,
        novaSenha: novaSenha,
        confirmarSenha: confirmarSenha
      });
  
      if (response.data.success) {
        setTrocaSenhaSucesso(true);
        // Limpa os campos após sucesso
        setSenhaAtual('');
        setNovaSenha('');
        setConfirmarSenha('');
        // Volta para o login após 3 segundos
        setTimeout(() => {
          setExibirTrocarSenha(false);
          setTrocaSenhaSucesso(false);
        }, 3000);
      } else {
        setLoginError(response.data.message || 'Erro ao trocar senha');
      }
    } catch (error) {
      console.error('Erro ao trocar senha:', error);
      setLoginError(error.response?.data?.message || 'Erro ao trocar senha');
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.titulo}>LawBridge</Text>
        <Text style={styles.subtitulo}>Soluções Jurídicas Integradas</Text>
      </View>

      {/* Mensagem de boas-vindas */}
      <View style={styles.mensagemContainer}>
        <Text style={styles.mensagem}>
          Conectando clientes e advogados de forma eficiente e segura
        </Text>
      </View>

      {/* Botões de seleção */}
      <View style={styles.botoesContainer}>
        <Animated.View style={[styles.botaoWrapper, { width: botaoAdvogadoLargura }]}>
          <TouchableOpacity
            style={[styles.botao, styles.botaoAdvogado]}
            onPress={() => {
              setExibirLoginAdvogado(!exibirLoginAdvogado);
              setExibirLoginCliente(false);
              animarBotoes(!exibirLoginAdvogado, false);
              setLoginError(null);
            }}
          >
            <Text style={styles.textoBotao}>Advogado</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.botaoWrapper, { width: botaoClienteLargura }]}>
          <TouchableOpacity
            style={[styles.botao, styles.botaoCliente]}
            onPress={() => {
              setExibirLoginCliente(!exibirLoginCliente);
              setExibirLoginAdvogado(false);
              animarBotoes(false, !exibirLoginCliente);
              setLoginError(null);
            }}
          >
            <Text style={styles.textoBotao}>Cliente</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Formulário de Login Advogado */}
      {exibirLoginAdvogado && (
        <View style={styles.loginContainer}>
          <Text style={styles.loginTitulo}>Acesso Advogado</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor="#999"
              onChangeText={setEmailAdvogado}
              value={emailAdvogado}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Senha</Text>
            <View style={styles.senhaContainer}>
              <TextInput
                style={[styles.input, styles.senhaInput]}
                placeholder="Sua senha"
                placeholderTextColor="#999"
                secureTextEntry={!senhaAdvogadoVisivel}
                onChangeText={setSenhaAdvogado}
                value={senhaAdvogado}
              />
              <TouchableOpacity 
                style={styles.iconeSenha}
                onPress={() => setSenhaAdvogadoVisivel(!senhaAdvogadoVisivel)}
              >
                <Icon 
                  name={senhaAdvogadoVisivel ? 'visibility' : 'visibility-off'} 
                  size={24} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {loginError && <Text style={styles.errorText}>{loginError}</Text>}

          <TouchableOpacity
            style={[styles.botaoLogin, styles.botaoLoginAdvogado]}
            onPress={handleLoginAdvogado}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.textoBotaoLogin}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botaoVoltar}
            onPress={() => {
              setExibirLoginAdvogado(false);
              animarBotoes(false, false);
            }}
          >
            <Text style={styles.textoBotaoVoltar}>Voltar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Formulário de Login Cliente */}
      {exibirLoginCliente && (
      <View style={styles.loginContainer}>
        {exibirTrocarSenha ? (
        <ScrollView 
          style={styles.loginContainer}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.loginTitulo}>Trocar Senha</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor="#999"
              value={emailCliente}
              editable={false}
            />
          </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Senha Atual</Text>
              <View style={styles.senhaContainer}>
                <TextInput
                  style={[styles.input, styles.senhaInput]}
                  placeholder="Sua senha atual"
                  placeholderTextColor="#999"
                  secureTextEntry={!senhaTrocaVisivel.atual}
                  onChangeText={setSenhaAtual}
                  value={senhaAtual}
                />
                <TouchableOpacity 
                  style={styles.iconeSenha}
                  onPress={() => setSenhaTrocaVisivel({...senhaTrocaVisivel, atual: !senhaTrocaVisivel.atual})}
                >
                  <Icon 
                    name={senhaTrocaVisivel.atual ? 'visibility' : 'visibility-off'} 
                    size={24} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nova Senha</Text>
              <View style={styles.senhaContainer}>
                <TextInput
                  style={[styles.input, styles.senhaInput]}
                  placeholder="Nova senha"
                  placeholderTextColor="#999"
                  secureTextEntry={!senhaTrocaVisivel.nova}
                  onChangeText={setNovaSenha}
                  value={novaSenha}
                />
                <TouchableOpacity 
                  style={styles.iconeSenha}
                  onPress={() => setSenhaTrocaVisivel({...senhaTrocaVisivel, nova: !senhaTrocaVisivel.nova})}
                >
                  <Icon 
                    name={senhaTrocaVisivel.nova ? 'visibility' : 'visibility-off'} 
                    size={24} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirmar Nova Senha</Text>
              <View style={styles.senhaContainer}>
                <TextInput
                  style={[styles.input, styles.senhaInput]}
                  placeholder="Confirme a nova senha"
                  placeholderTextColor="#999"
                  secureTextEntry={!senhaTrocaVisivel.confirmar}
                  onChangeText={setConfirmarSenha}
                  value={confirmarSenha}
                />
                <TouchableOpacity 
                  style={styles.iconeSenha}
                  onPress={() => setSenhaTrocaVisivel({...senhaTrocaVisivel, confirmar: !senhaTrocaVisivel.confirmar})}
                >
                  <Icon 
                    name={senhaTrocaVisivel.confirmar ? 'visibility' : 'visibility-off'} 
                    size={24} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {loginError && <Text style={styles.errorText}>{loginError}</Text>}
            {trocaSenhaSucesso && <Text style={styles.successText}>Senha alterada com sucesso!</Text>}

            <TouchableOpacity
              style={[styles.botaoLogin, styles.botaoLoginCliente]}
              onPress={handleTrocarSenha}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.textoBotaoLogin}>Trocar Senha</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoVoltar}
              onPress={() => {
                setExibirTrocarSenha(false);
                setLoginError(null);
              }}
            >
              <Text style={styles.textoBotaoVoltar}>Voltar para Login</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <>
            <Text style={styles.loginTitulo}>Acesso Cliente</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>E-mail</Text>
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                placeholderTextColor="#999"
                onChangeText={setEmailCliente}
                value={emailCliente}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Senha</Text>
              <View style={styles.senhaContainer}>
                <TextInput
                  style={[styles.input, styles.senhaInput]}
                  placeholder="Sua senha"
                  placeholderTextColor="#999"
                  secureTextEntry={!senhaClienteVisivel}
                  onChangeText={setSenhaCliente}
                  value={senhaCliente}
                />
                <TouchableOpacity 
                  style={styles.iconeSenha}
                  onPress={() => setSenhaClienteVisivel(!senhaClienteVisivel)}
                >
                  <Icon 
                    name={senhaClienteVisivel ? 'visibility' : 'visibility-off'} 
                    size={24} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.botaoTrocarSenha}
              onPress={() => setExibirTrocarSenha(true)}
            >
              <Text style={styles.textoBotaoTrocarSenha}>Trocar minha senha</Text>
            </TouchableOpacity>

            {loginError && <Text style={styles.errorText}>{loginError}</Text>}

            <TouchableOpacity
              style={[styles.botaoLogin, styles.botaoLoginCliente]}
              onPress={handleLoginCliente}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.textoBotaoLogin}>Entrar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoVoltar}
              onPress={() => {
                setExibirLoginCliente(false);
                animarBotoes(false, false);
              }}
            >
              <Text style={styles.textoBotaoVoltar}>Voltar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    )}

      {/* Rodapé */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2023 LawBridge - Todos os direitos reservados</Text>
      </View>
    </View>
  );
};

// Estilos completos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  titulo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2c3e50',
    fontFamily: 'serif',
  },
  subtitulo: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 5,
  },
  mensagemContainer: {
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  mensagem: {
    fontSize: 18,
    color: '#34495e',
    textAlign: 'center',
    lineHeight: 24,
  },
  botoesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 15,
  },
  botaoWrapper: {
    overflow: 'hidden',
    borderRadius: 8,
  },
  botao: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  botaoAdvogado: {
    backgroundColor: '#8e44ad',
  },
  botaoCliente: {
    backgroundColor: '#3498db',
  },
  textoBotao: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  loginTitulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 25,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 14,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  senhaContainer: {
    position: 'relative',
  },
  senhaInput: {
    paddingRight: 50,
  },
  iconeSenha: {
    position: 'absolute',
    right: 15,
    top: 14,
  },
  botaoLogin: {
    padding: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  botaoLoginAdvogado: {
    backgroundColor: '#9b59b6',
  },
  botaoLoginCliente: {
    backgroundColor: '#2980b9',
  },
  textoBotaoLogin: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  botaoVoltar: {
    marginTop: 15,
    padding: 10,
    alignItems: 'center',
  },
  textoBotaoVoltar: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    marginTop: -10,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerText: {
    color: '#95a5a6',
    fontSize: 12,
    textAlign: 'center',
  },
  // Adicione ao objeto styles
botaoTrocarSenha: {
  alignSelf: 'flex-end',
  marginBottom: 15,
},
textoBotaoTrocarSenha: {
  color: '#3498db',
  fontSize: 14,
  fontWeight: '500',
},
successText: {
  color: '#2ecc71',
  fontSize: 14,
  textAlign: 'center',
  marginBottom: 15,
  marginTop: -10,
},
scrollContainer: {
  padding: 25,
  paddingBottom: 40, // Espaço extra no final para o botão
},
loginContainer: {
  maxHeight: '80%', // Limita a altura máxima do container
},
});

export default TelaInicial;