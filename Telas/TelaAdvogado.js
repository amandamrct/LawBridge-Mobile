import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Keyboard
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';

const TelaAdvogado = ({ route, navigation }) => {
  const { advogado } = route.params;
  const [processos, setProcessos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalClienteVisible, setModalClienteVisible] = useState(false);
  const [modalProcessoVisible, setModalProcessoVisible] = useState(false);
  const [modalEditarProcessoVisible, setModalEditarProcessoVisible] = useState(false);
  const [modalRelatoriosVisible, setModalRelatoriosVisible] = useState(false);
  const [numeroProcessoBusca, setNumeroProcessoBusca] = useState('');
  const [processoBuscado, setProcessoBuscado] = useState(null);
  const [clienteProcesso, setClienteProcesso] = useState(null);
  const [loadingBusca, setLoadingBusca] = useState(false);
  const [clienteData, setClienteData] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    cpf: '',
    celular: '',
    senha: '123456',
    data_nascimento: ''
  });
  
  const [processoData, setProcessoData] = useState({
    assunto: '',
    numprocesso: '',
    comarca: '',
    status: 'Pendente',
    cliente_id: '',
    dataP: ''
  });

  const [processoEditando, setProcessoEditando] = useState(null);

  // Função para abrir o modal de edição
  const abrirModalEdicao = (processo) => {
    setProcessoEditando(processo);
    setProcessoData({
      assunto: processo.assunto,
      numprocesso: processo.numprocesso,
      comarca: processo.comarca || '',
      status: processo.status,
      cliente_id: processo.cliente_id || '',
      dataP: processo.dataPFormatada || ''
    });
    setModalEditarProcessoVisible(true);
  };


  // Função para formatar data (DD/MM/AAAA) enquanto digita
  const formatarDataInput = (text) => {
    let formattedText = text.replace(/\D/g, '');
    
    if (formattedText.length > 2) {
      formattedText = formattedText.substring(0, 2) + '/' + formattedText.substring(2);
    }
    if (formattedText.length > 5) {
      formattedText = formattedText.substring(0, 5) + '/' + formattedText.substring(5, 9);
    }
    
    return formattedText.substring(0, 10);
  };

  // Função para formatar data do banco para exibição
  const formatarDataExibicao = (dateString) => {
    if (!dateString) return 'Não informada';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Função para formatar CPF (123.456.789-09)
  const formatarCPF = (text) => {
    let formattedText = text.replace(/\D/g, '');
    
    if (formattedText.length > 3) {
      formattedText = formattedText.substring(0, 3) + '.' + formattedText.substring(3);
    }
    if (formattedText.length > 7) {
      formattedText = formattedText.substring(0, 7) + '.' + formattedText.substring(7);
    }
    if (formattedText.length > 11) {
      formattedText = formattedText.substring(0, 11) + '-' + formattedText.substring(11);
    }
    
    return formattedText.substring(0, 14);
  };

  // Função para formatar telefone ((21) 98765-4321)
  const formatarTelefone = (text) => {
    let formattedText = text.replace(/\D/g, '');
    
    if (formattedText.length > 0) {
      formattedText = '(' + formattedText.substring(0, 2) + ') ' + formattedText.substring(2);
    }
    if (formattedText.length > 10) {
      formattedText = formattedText.substring(0, 10) + '-' + formattedText.substring(10);
    }
    
    return formattedText.substring(0, 15);
  };

  const fetchData = async () => {
    try {
      const [processosResponse, clientesResponse] = await Promise.all([
        axios.get(`http://192.168.1.2:3000/advogado/${advogado.identificadorA}/processos`),
        axios.get(`http://192.168.1.2:3000/clientes`)
      ]);
      
      // Formatar datas para exibição
      const processosFormatados = processosResponse.data.map(processo => ({
        ...processo,
        dataPFormatada: processo.data_formatada || 'Não informada'
      }));
      
      setProcessos(processosFormatados);
      setClientes(clientesResponse.data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados');
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCadastrarCliente = async () => {
    try {
      if (!clienteData.nome || !clienteData.email || !clienteData.cpf) {
        Alert.alert('Atenção', 'Preencha todos os campos obrigatórios');
        return;
      }
  
      const identificador = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Validar formato da data
      if (clienteData.data_nascimento && clienteData.data_nascimento.length !== 10) {
        Alert.alert('Atenção', 'Formato de data inválido. Use DD/MM/AAAA');
        return;
      }
  
      // Remover máscaras antes de enviar
      const cpfSemMascara = clienteData.cpf.replace(/\D/g, '');
      const celularSemMascara = clienteData.celular.replace(/\D/g, '');
      
      const response = await axios.post('http://192.168.1.2:3000/clientes', {
        ...clienteData,
        cpf: cpfSemMascara,
        celular: celularSemMascara,
        identificador
      });
  
      Alert.alert('Sucesso', 'Cliente cadastrado com sucesso');
      setModalClienteVisible(false);
      setClienteData({
        nome: '',
        sobrenome: '',
        email: '',
        cpf: '',
        celular: '',
        senha: '123456',
        data_nascimento: ''
      });
      fetchData();
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao cadastrar cliente');
    }
  };

  
  const handleCadastrarProcesso = async () => {
    try {
      // Validação mínima
      if (!processoData.numprocesso || !processoData.assunto) {
        Alert.alert('Atenção', 'Número do processo e assunto são obrigatórios');
        return;
      }
  
      // Formata a data para o padrão MySQL (YYYY-MM-DD)
      const formatarDataParaMySQL = (data) => {
        if (!data) return null;
        const [day, month, year] = data.split('/');
        return `${year}-${month}-${day}`;
      };
  
      // Dados que serão enviados
      const dadosProcesso = {
        numprocesso: processoData.numprocesso,
        assunto: processoData.assunto,
        status: processoData.status || 'Pendente',
        identificadorA: advogado.identificadorA,
        comarca: processoData.comarca || null,
        dataP: processoData.dataP ? formatarDataParaMySQL(processoData.dataP) : null,
        cliente_id: processoData.cliente_id || null
      };
  
      console.log('Dados enviados para o servidor:', dadosProcesso);
  
      const response = await axios.post('http://192.168.1.2:3000/processos', dadosProcesso);
  
      Alert.alert('Sucesso', 
        processoData.cliente_id 
          ? 'Processo cadastrado e vinculado ao cliente com sucesso!'
          : 'Processo cadastrado com sucesso!'
      );
      
      // Fecha o modal e recarrega os dados
      setModalProcessoVisible(false);
      setProcessoData({
        assunto: '',
        numprocesso: '',
        comarca: '',
        status: 'Pendente',
        cliente_id: '',
        dataP: ''
      });
      fetchData();
  
    } catch (error) {
      console.error('Erro detalhado:', {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      
      let errorMessage = 'Erro ao cadastrar processo';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Erro de conexão com o servidor';
      }
      
      Alert.alert('Erro', errorMessage);
    }
  };
  
  // Função auxiliar para formatar data
  const formatDateToBackend = (dateString) => {
    if (!dateString) return null;
    const [day, month, year] = dateString.split('/');
    return `${year}-${month}-${day}`;
  };

  const handleDeleteProcesso = async (processoId) => {
    try {
      await axios.delete(`http://192.168.1.2:3000/processos/${processoId}`);
      Alert.alert('Sucesso', 'Processo removido com sucesso');
      fetchData();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível remover o processo');
      console.error(error);
    }
  };


  const handleAtualizarProcesso = async () => {
    try {
      if (!processoData.numprocesso || !processoData.assunto) {
        Alert.alert('Atenção', 'Número do processo e assunto são obrigatórios');
        return;
      }
  
      const dadosProcesso = {
        numprocesso: processoData.numprocesso,
        assunto: processoData.assunto,
        status: processoData.status,
        comarca: processoData.comarca || null,
        dataP: processoData.dataP ? formatDateToBackend(processoData.dataP) : null,
        cliente_id: processoData.cliente_id || null
      };
  
      await axios.put(`http://192.168.1.2:3000/processos/${processoEditando.id}`, dadosProcesso);
  
      Alert.alert('Sucesso', 'Processo atualizado com sucesso');
      setModalEditarProcessoVisible(false);
      fetchData();
    } catch (error) {
      console.error('Erro ao atualizar processo:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o processo');
    }
  };

  const buscarProcessoECliente = async () => {
    if (!numeroProcessoBusca) {
      Alert.alert('Atenção', 'Digite um número de processo');
      return;
    }
  
    setLoadingBusca(true);
    try {
      // Busca o processo
      const responseProcesso = await axios.get(`http://192.168.1.2:3000/processos/buscar/${numeroProcessoBusca}`);
      
      if (!responseProcesso.data) {
        Alert.alert('Processo não encontrado');
        setProcessoBuscado(null);
        setClienteProcesso(null);
        return;
      }
  
      setProcessoBuscado(responseProcesso.data);
  
      // Se houver cliente associado, busca os dados do cliente
      if (responseProcesso.data.cliente_id) {
        const responseCliente = await axios.get(`http://192.168.1.2:3000/cliente/${responseProcesso.data.cliente_id}`);
        setClienteProcesso(responseCliente.data.cliente);
      } else {
        setClienteProcesso(null);
      }
  
    } catch (error) {
      console.error('Erro na busca:', error);
      Alert.alert('Erro', 'Não foi possível buscar o processo');
    } finally {
      setLoadingBusca(false);
    }
  };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          keyboardShouldPersistTaps="handled"
        >
          {/* Cabeçalho */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{advogado.nome} {advogado.sobrenome}</Text>
              <Text style={styles.userOab}>OAB: {advogado.oab}</Text>
              <Text style={styles.userEmail}>{advogado.email}</Text>
              <Text style={styles.userCelular}>{advogado.celular}</Text>
            </View>
          </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setModalClienteVisible(true)}
          >
            <Icon name="person-add" size={24} color="#fff" />
            <Text style={styles.actionText}>Novo Cliente</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setModalProcessoVisible(true)}
          >
            <Icon name="note-add" size={24} color="#fff" />
            <Text style={styles.actionText}>Novo Processo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setModalRelatoriosVisible(true)}
          >
            <Icon name="assessment" size={24} color="#fff" />
            <Text style={styles.actionText}>Informação Cliente</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            <Text style={styles.summaryNumber}>{processos.length}</Text> Processos
          </Text>
          <Text style={styles.summarySubText}>
            {processos.filter(p => p.status === 'Pendente').length} pendentes
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Processos Recentes</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#9370db" />
          ) : processos.length === 0 ? (
            <Text style={styles.emptyMessage}>Nenhum processo cadastrado</Text>
          ) : (
            processos.map((processo) => (
              <View key={processo.id} style={styles.processItem}>
                <View style={styles.processInfo}>
                  <Text style={styles.processNumber}>ID Processo: {processo.numprocesso}</Text>
                  <Text style={styles.processSubject}>Assunto: {processo.assunto}</Text>
                  <Text style={styles.processClient}>Cliente: {processo.cliente_nome || 'Cliente não associado'}</Text>
                  <Text style={styles.processDate}>Data inicial processo: {processo.dataPFormatada}</Text>
                  <View style={[
                    styles.statusBadge,
                    processo.status === 'Pendente' && styles.statusPending,
                    processo.status === 'Andamento' && styles.statusInProgress,
                    processo.status === 'Concluído' && styles.statusCompleted
                  ]}>
                    <Text style={styles.statusText}>{processo.status}</Text>
                  </View>
                </View>
                
                <View style={styles.processActions}>
                  <TouchableOpacity 
                    onPress={() => abrirModalEdicao(processo)}
                  >
                    <Icon name="edit" size={20} color="#9370db" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleDeleteProcesso(processo.id)}
                  >
                    <Icon name="delete" size={20} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
          
          <TouchableOpacity 
            style={styles.seeAllButton}
            onPress={() => navigation.navigate('ListaProcessos')}
          >
            <Text style={styles.seeAllText}>Ver todos os processos</Text>
            <Icon name="chevron-right" size={20} color="#9370db" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalRelatoriosVisible}
        onRequestClose={() => {
          setModalRelatoriosVisible(false);
          setNumeroProcessoBusca('');
          setProcessoBuscado(null);
          setClienteProcesso(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalContainer} onPress={Keyboard.dismiss}>
            <View style={[styles.modalContainerInner, {maxHeight: '80%'}]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Buscar Processo</Text>
                <TouchableOpacity onPress={() => {
                  setModalRelatoriosVisible(false);
                  setNumeroProcessoBusca('');
                  setProcessoBuscado(null);
                  setClienteProcesso(null);
                }}>
                  <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                style={styles.modalContent}
                contentContainerStyle={{paddingBottom: 70}}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.inputLabel}>Número do Processo</Text>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <TextInput
                    style={[styles.input, {flex: 1}]}
                    placeholder="Digite o número do processo"
                    value={numeroProcessoBusca}
                    onChangeText={setNumeroProcessoBusca}
                  />
                  <TouchableOpacity 
                    style={styles.searchButton}
                    onPress={buscarProcessoECliente}
                    disabled={loadingBusca}
                  >
                    {loadingBusca ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Icon name="search" size={20} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>

                {processoBuscado && (
                  <View style={styles.resultContainer}>
                    <Text style={styles.sectionTitle}>Informações do Processo</Text>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Número:</Text>
                      <Text style={styles.infoText}>{processoBuscado.numprocesso}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Assunto:</Text>
                      <Text style={styles.infoText}>{processoBuscado.assunto}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Status:</Text>
                      <Text style={styles.infoText}>{processoBuscado.status}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Data:</Text>
                      <Text style={styles.infoText}>
                        {processoBuscado.dataPFormatada || 'Não informada'}
                      </Text>
                    </View>

                    {clienteProcesso ? (
                      <>
                        <Text style={styles.sectionTitle}>Informações do Cliente</Text>
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Nome:</Text>
                          <Text style={styles.infoText}>
                            {clienteProcesso.nome} {clienteProcesso.sobrenome}
                          </Text>
                        </View>
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>CPF:</Text>
                          <Text style={styles.infoText}>
                            {clienteProcesso.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                          </Text>
                        </View>
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Email:</Text>
                          <Text style={styles.infoText}>{clienteProcesso.email}</Text>
                        </View>
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Celular:</Text>
                          <Text style={styles.infoText}>{clienteProcesso.celular}</Text>
                        </View>
                      </>
                    ) : (
                      <Text style={styles.warningText}>Nenhum cliente associado a este processo</Text>
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          </Pressable>
        </View>
      </Modal>


      <Modal
        animationType="slide"
        transparent={true}
        visible={modalClienteVisible}
        onRequestClose={() => setModalClienteVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalContainer} onPress={Keyboard.dismiss}>
            <View style={[styles.modalContainerInner, {maxHeight: '85%', minHeight: '60%'}]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Cadastrar Novo Cliente</Text>
                <TouchableOpacity onPress={() => setModalClienteVisible(false)}>
                  <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                style={styles.modalContent}
                contentContainerStyle={{paddingBottom: 20}}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.inputLabel}>Nome *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome do cliente"
                  value={clienteData.nome}
                  onChangeText={(text) => setClienteData({...clienteData, nome: text})}
                />
                
                <Text style={styles.inputLabel}>Sobrenome</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Sobrenome do cliente"
                  value={clienteData.sobrenome}
                  onChangeText={(text) => setClienteData({...clienteData, sobrenome: text})}
                />
                
                <Text style={styles.inputLabel}>Data de Nascimento (DD/MM/AAAA)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/AAAA"
                  value={clienteData.data_nascimento}
                  onChangeText={(text) => setClienteData({
                    ...clienteData, 
                    data_nascimento: formatarDataInput(text)
                  })}
                  keyboardType="numeric"
                  maxLength={10}
                />
                
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email do cliente"
                  keyboardType="email-address"
                  value={clienteData.email}
                  onChangeText={(text) => setClienteData({...clienteData, email: text})}
                />
                
                <Text style={styles.inputLabel}>CPF *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123.456.789-09"
                  value={clienteData.cpf}
                  onChangeText={(text) => setClienteData({
                    ...clienteData, 
                    cpf: formatarCPF(text)
                  })}
                  keyboardType="numeric"
                  maxLength={14}
                />
                
                <Text style={styles.inputLabel}>Celular</Text>
                <TextInput
                  style={styles.input}
                  placeholder="(21) 98765-4321"
                  value={clienteData.celular}
                  onChangeText={(text) => setClienteData({
                    ...clienteData, 
                    celular: formatarTelefone(text)
                  })}
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </ScrollView>
              
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setModalClienteVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleCadastrarCliente}
                >
                  <Text style={styles.saveButtonText}>Salvar Cliente</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </View>
      </Modal>
      
      <Modal
  animationType="slide"
  transparent={true}
  visible={modalEditarProcessoVisible}
  onRequestClose={() => setModalEditarProcessoVisible(false)}
>
  <View style={styles.modalOverlay}>
    <Pressable style={styles.modalContainer} onPress={Keyboard.dismiss}>
      <View style={[styles.modalContainerInner, {maxHeight: '70%'}]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Editar Processo</Text>
          <TouchableOpacity onPress={() => setModalEditarProcessoVisible(false)}>
            <Icon name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          style={styles.modalContent}
          contentContainerStyle={{paddingBottom: 20}}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.inputLabel}>Número do Processo *</Text>
          <TextInput
            style={styles.input}
            placeholder="Número do processo"
            value={processoData.numprocesso}
            onChangeText={(text) => setProcessoData({...processoData, numprocesso: text})}
          />
          
          <Text style={styles.inputLabel}>Assunto *</Text>
          <TextInput
            style={styles.input}
            placeholder="Assunto do processo"
            value={processoData.assunto}
            onChangeText={(text) => setProcessoData({...processoData, assunto: text})}
          />
          
          <Text style={styles.inputLabel}>Comarca</Text>
          <TextInput
            style={styles.input}
            placeholder="Comarca do processo"
            value={processoData.comarca}
            onChangeText={(text) => setProcessoData({...processoData, comarca: text})}
          />
          
          <Text style={styles.inputLabel}>Data do Processo (DD/MM/AAAA)</Text>
          <TextInput
            style={styles.input}
            placeholder="DD/MM/AAAA"
            value={processoData.dataP}
            onChangeText={(text) => setProcessoData({
              ...processoData, 
              dataP: formatarDataInput(text)
            })}
            keyboardType="numeric"
            maxLength={10}
          />
          
          <Text style={styles.inputLabel}>Cliente</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={processoData.cliente_id}
              onValueChange={(itemValue) => setProcessoData({...processoData, cliente_id: itemValue})}
              style={styles.picker}
            >
              <Picker.Item label="Selecione um cliente" value="" />
              {clientes.map(cliente => (
                <Picker.Item 
                  key={cliente.id} 
                  label={`${cliente.nome} ${cliente.sobrenome}`} 
                  value={cliente.id} 
                />
              ))}
            </Picker>
          </View>
          
          <Text style={styles.inputLabel}>Status</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity 
              style={styles.radioOption}
              onPress={() => setProcessoData({...processoData, status: 'Pendente'})}
            >
              <View style={styles.radioCircle}>
                {processoData.status === 'Pendente' && <View style={styles.radioChecked} />}
              </View>
              <Text style={styles.radioLabel}>Pendente</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.radioOption}
              onPress={() => setProcessoData({...processoData, status: 'Andamento'})}
            >
              <View style={styles.radioCircle}>
                {processoData.status === 'Andamento' && <View style={styles.radioChecked} />}
              </View>
              <Text style={styles.radioLabel}>Andamento</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.radioOption}
              onPress={() => setProcessoData({...processoData, status: 'Concluído'})}
            >
              <View style={styles.radioCircle}>
                {processoData.status === 'Concluído' && <View style={styles.radioChecked} />}
              </View>
              <Text style={styles.radioLabel}>Concluído</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        {/* CORREÇÃO: Footer com botões alinhados corretamente */}
        <View style={styles.modalFooter}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => setModalEditarProcessoVisible(false)}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleAtualizarProcesso}
          >
            <Text style={styles.saveButtonText}>Salvar Alterações</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  </View>
</Modal>


      <Modal
        animationType="slide"
        transparent={true}
        visible={modalProcessoVisible}
        onRequestClose={() => setModalProcessoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalContainer} onPress={Keyboard.dismiss}>
            <View style={[styles.modalContainerInner, {maxHeight: '70%'}]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Cadastrar Novo Processo</Text>
                <TouchableOpacity onPress={() => setModalProcessoVisible(false)}>
                  <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                style={styles.modalContent}
                contentContainerStyle={{paddingBottom: 20}}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.inputLabel}>Número do Processo *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Número do processo"
                  value={processoData.numprocesso}
                  onChangeText={(text) => setProcessoData({...processoData, numprocesso: text})}
                />
                
                <Text style={styles.inputLabel}>Assunto *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Assunto do processo"
                  value={processoData.assunto}
                  onChangeText={(text) => setProcessoData({...processoData, assunto: text})}
                />
                
                <Text style={styles.inputLabel}>Comarca</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Comarca do processo"
                  value={processoData.comarca}
                  onChangeText={(text) => setProcessoData({...processoData, comarca: text})}
                />
                
                <Text style={styles.inputLabel}>Data do Processo (DD/MM/AAAA)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/AAAA"
                  value={processoData.dataP}
                  onChangeText={(text) => setProcessoData({
                    ...processoData, 
                    dataP: formatarDataInput(text)
                  })}
                  keyboardType="numeric"
                  maxLength={10}
                />
                
                <Text style={styles.inputLabel}>Cliente</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={processoData.cliente_id}
                    onValueChange={(itemValue) => setProcessoData({...processoData, cliente_id: itemValue})}
                    style={styles.picker}
                  >
                    <Picker.Item label="Selecione um cliente" value="" />
                    {clientes.map(cliente => (
                      <Picker.Item 
                        key={cliente.id} 
                        label={`${cliente.nome} ${cliente.sobrenome}`} 
                        value={cliente.id} 
                      />
                    ))}
                  </Picker>
                </View>
                
                <Text style={styles.inputLabel}>Status</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity 
                    style={styles.radioOption}
                    onPress={() => setProcessoData({...processoData, status: 'Pendente'})}
                  >
                    <View style={styles.radioCircle}>
                      {processoData.status === 'Pendente' && <View style={styles.radioChecked} />}
                    </View>
                    <Text style={styles.radioLabel}>Pendente</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.radioOption}
                    onPress={() => setProcessoData({...processoData, status: 'Andamento'})}
                  >
                    <View style={styles.radioCircle}>
                      {processoData.status === 'Andamento' && <View style={styles.radioChecked} />}
                    </View>
                    <Text style={styles.radioLabel}>Andamento</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.radioOption}
                    onPress={() => setProcessoData({...processoData, status: 'Concluído'})}
                  >
                    <View style={styles.radioCircle}>
                      {processoData.status === 'Concluído' && <View style={styles.radioChecked} />}
                    </View>
                    <Text style={styles.radioLabel}>Concluído</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
              
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setModalProcessoVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleCadastrarProcesso}
                >
                  <Text style={styles.saveButtonText}>Salvar Processo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#9370db',
  },
  userInfo: {
    marginTop: 10,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  userOab: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#e0e0e0',
    marginTop: 5,
  },
  userCelular: {
    fontSize: 14,
    color: '#e0e0e0',
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: 15,
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#6495ed',
    padding: 12,
    borderRadius: 8,
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 18,
    color: '#333',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9370db',
  },
  summarySubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#666',
    padding: 10,
  },
  processItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  processInfo: {
    flex: 1,
  },
  processNumber: {
    fontWeight: 'bold',
    color: '#333',
  },
  processSubject: {
    color: '#555',
    marginTop: 3,
  },
  processClient: {
    color: '#666',
    fontSize: 14,
    marginTop: 3,
    fontStyle: 'italic',
  },
  processDate: {
    color: '#666',
    fontSize: 12,
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  statusPending: {
    backgroundColor: '#ff9800',
  },
  statusInProgress: {
    backgroundColor: '#2196f3',
  },
  statusCompleted: {
    backgroundColor: '#4caf50',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  processActions: {
    flexDirection: 'row',
    gap: 15,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    marginTop: 5,
  },
  seeAllText: {
    color: '#9370db',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20, // Adicionei padding para não colar nas bordas
  },
  modalContainer: {
    width: '90%',
    maxHeight: '90%', // Altura máxima do modal
  },
  modalContainerInner: {
    backgroundColor: '#fff',
    borderRadius: 10,
    maxHeight: '85%', // Aumentei a altura máxima
    minHeight: '60%', // Aumentei a altura mínima
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalContent: {
    paddingHorizontal: 15,
    paddingTop: 10,
    flexGrow: 1, // Permite expansão do conteúdo
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 8,
    fontSize: 14,
    marginBottom: 8,
    height: 40,
  },
  saveButton: {
    backgroundColor: '#9370db',
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#9370db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  radioChecked: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#9370db',
  },
  radioLabel: {
    fontSize: 14,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 8,
    height: 40,
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
  },
  reportItem: {
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  reportItem: {
  backgroundColor: '#f5f5f5',
  borderRadius: 5,
  padding: 10,
  marginBottom: 15,
},searchButton: {
  backgroundColor: '#9370db',
  padding: 10,
  borderRadius: 5,
  marginLeft: 10,
  justifyContent: 'center',
  alignItems: 'center',
},
resultContainer: {
  marginTop: 20,
  backgroundColor: '#f8f9fa',
  borderRadius: 8,
  padding: 15,
},
infoItem: {
  flexDirection: 'row',
  marginBottom: 8,
},
infoLabel: {
  fontWeight: 'bold',
  width: 100,
  color: '#555',
},
infoText: {
  flex: 1,
  color: '#333',
},
warningText: {
  color: '#ff9800',
  textAlign: 'center',
  marginTop: 15,
  fontStyle: 'italic',
},
sectionTitle: {
  fontSize: 16,
  fontWeight: 'bold',
  marginBottom: 10,
  marginTop: 15,
  color: '#333',
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
  paddingBottom: 5,
},
}); 

export default TelaAdvogado;