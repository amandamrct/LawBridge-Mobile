import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';

const TelaCliente = ({ route, navigation }) => {
  if (!route.params?.cliente) {
    return (
      <View style={styles.container}>
        <Text>Dados do cliente não disponíveis</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { cliente } = route.params;
  const [infoCliente, setInfoCliente] = useState(cliente);
  const [processos, setProcessos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
  
      const response = await axios.get(
        `http://192.168.1.2:3000/cliente/${cliente.identificador}/processos`
      );
  
      if (!response.data.success) {
        throw new Error(response.data.message || "Erro ao carregar dados");
      }
  
      setProcessos(response.data.processos || []);
      setInfoCliente({
        ...response.data.cliente,
        nome: response.data.cliente?.nome || 'Não informado',
        sobrenome: response.data.cliente?.sobrenome || '',
        email: response.data.cliente?.email || 'Não informado',
        celular: response.data.cliente?.celular || null,
        data_nascimento: response.data.cliente?.data_nascimento || null,
        cpf: response.data.cliente?.cpf || null
      });
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setError(error.response?.data?.message || "Erro ao carregar dados");
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

  const formatarData = (dateString) => {
    if (!dateString) return "Não informada";
    
    // Se já estiver no formato brasileiro
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      return dateString;
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Não informada";
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Não informada";
    }
  };

  const formatarCPF = (cpf) => {
    if (!cpf) return "Não informado";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatarTelefone = (text) => {
    if (!text) return "Não informado";
    let formattedText = text.replace(/\D/g, '');
    
    if (formattedText.length > 0) {
      formattedText = '(' + formattedText.substring(0, 2) + ') ' + formattedText.substring(2);
    }
    if (formattedText.length > 10) {
      formattedText = formattedText.substring(0, 10) + '-' + formattedText.substring(10, 15);
    }
    
    return formattedText.substring(0, 15);
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#6495ed"]}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{infoCliente.nome} {infoCliente.sobrenome}</Text>
          <Text style={styles.userEmail}>{infoCliente.email}</Text>
          <Text style={styles.userCelular}>{formatarTelefone(infoCliente.celular)}</Text>
        </View>
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
        <Text style={styles.sectionTitle}>Informações Pessoais</Text>
        
        <View style={styles.infoItem}>
          <Icon name="person" size={20} color="#6495ed" style={styles.infoIcon} />
          <Text style={styles.infoText}>Nome: {infoCliente.nome} {infoCliente.sobrenome}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Icon name="cake" size={20} color="#6495ed" style={styles.infoIcon} />
          <Text style={styles.infoText}>Data Nasc.: {formatarData(infoCliente.data_nascimento)}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Icon name="assignment-ind" size={20} color="#6495ed" style={styles.infoIcon} />
          <Text style={styles.infoText}>CPF: {formatarCPF(infoCliente.cpf)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Processos Vinculados</Text>
        
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchData}
            >
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <ActivityIndicator size="large" color="#6495ed" />
        ) : processos.length === 0 ? (
          <Text style={styles.emptyMessage}>Nenhum processo encontrado</Text>
        ) : (
          processos.map((processo) => (
            <View key={`${processo.id}-${processo.numprocesso}`} style={styles.processContainer}>
              <View style={styles.processHeader}>
                <Text style={styles.processNumber}>Número do processo: {processo.numprocesso}</Text>
              </View>
              
              <View style={styles.processDetails}>
                <Text style={styles.processSubject}>Assunto: {processo.assunto}</Text>
                <Text style={styles.processDate}>Data: {processo.data_formatada || "Não informada"}</Text>
                <Text style={styles.processLawyer}>
                  Advogado: {processo.advogado_nome || 'Não vinculado'}
                  {processo.oab ? ` (OAB: ${processo.oab})` : ''}
                </Text>
                <View style={[
                  styles.statusBadge,
                  processo.status === 'Pendente' && styles.statusPending,
                  processo.status === 'Andamento' && styles.statusInProgress,
                  processo.status === 'Concluído' && styles.statusCompleted
                ]}>
                  <Text style={styles.statusText}>{processo.status}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#6495ed',
  },
  userInfo: {
    marginTop: 10,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
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
    color: '#6495ed',
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
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#555',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#666',
    padding: 10,
  },
  processContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  processHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
    marginBottom: 8,
  },
  processDetails: {
    paddingHorizontal: 4,
  },
  processNumber: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 16,
  },
  processSubject: {
    color: '#555',
    marginTop: 4,
    fontSize: 15,
  },
  processDate: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  processLawyer: {
    color: '#444',
    fontSize: 14,
    marginTop: 4,
    fontStyle: 'italic',
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
  errorContainer: {
    backgroundColor: '#fdecea',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6495ed',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default TelaCliente;