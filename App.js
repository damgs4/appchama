import React, { useState, useEffect, createContext, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Switch, Button, Alert, Modal } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { TabView, SceneMap } from 'react-native-tab-view';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebase from 'firebase/app';
import 'firebase/firestore';

const AppContext = createContext();

// Dados fictícios dos militares
const militares = [
  { id: '1', nome: 'militar1', patente: 'Capitão' },
  { id: '2', nome: 'militar2', patente: 'Capitão' },
  { id: '3', nome: 'militar3', patente: '1º Tenente' },
  { id: '4', nome: 'militar4', patente: '1º Tenente' },
  { id: '5', nome: 'militar5', patente: '1º Tenente' },
  { id: '6', nome: 'militar6' , patente: '1º Tenente' },
  { id: '7', nome: 'militar7' , patente: 'Sub Tenente' },
  { id: '8', nome: 'militar8' , patente: 'Sub Tenente' },
  { id: '9', nome: 'militar9' , patente: '1º Sargento' },
  { id: '10', nome: 'militar10' , patente: '2º Sargento' },
];

// Dados fictícios dos administradores
const admins = [
  { username: 'admin', password: '123' },
  { username: 'criador', password: '321' }
];

const Stack = createStackNavigator();

const getCurrentDate = () => moment().format('YYYY-MM-DD');

const AppProvider = ({ children }) => {
  const [registros, setRegistros] = useState([]);
  const [ultimaData, setUltimaData] = useState('');

  useEffect(() => {
    const carregarDados = async () => {
      const registrosSalvos = await AsyncStorage.getItem('registros');
      const dataSalva = await AsyncStorage.getItem('ultimaData');

      if (registrosSalvos) setRegistros(JSON.parse(registrosSalvos));
      if (dataSalva) setUltimaData(dataSalva);

      reiniciarDiariamente();
    };
    carregarDados();
  }, []);

  useEffect(() => {
    const salvarDados = async () => {
      await AsyncStorage.setItem('registros', JSON.stringify(registros));
      await AsyncStorage.setItem('ultimaData', ultimaData);
    };
    salvarDados();
  }, [registros, ultimaData]);

  const reiniciarDiariamente = () => {
    const dataAtual = getCurrentDate();
    if (ultimaData !== dataAtual) {
      setRegistros([]);
      setUltimaData(dataAtual);
      AsyncStorage.removeItem('registros');
    }
  };

  const addOrUpdateRegistro = (registro) => {
    setRegistros((prev) => {
      const existingRegistro = prev.find((r) => r.id === registro.id);
      if (existingRegistro) return prev.map((r) => (r.id === registro.id ? registro : r));
      return [...prev, registro];
    });
  };

  return (
    <AppContext.Provider value={{ registros, addOrUpdateRegistro }}>
      {children}
    </AppContext.Provider>
  );
};

// Tela de Login
function LoginScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const handleLogin = () => {
    if (isAdmin) {
      const admin = admins.find(admin => admin.username === nome && admin.password === senha);
      if (admin) navigation.navigate('Admin');
      else alert('Administrador não encontrado!');
    } else {
      const militar = militares.find(m => m.nome.toLowerCase() === nome.toLowerCase());
      if (militar) navigation.navigate('Lista', { militarId: militar.id });
      else alert('Nome não encontrado!');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 30, paddingVertical: 40 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>Tiragem de Falta</Text>
      <TextInput
        style={{ marginBottom: 20, padding: 15, borderWidth: 1, borderRadius: 5 }}
        placeholder="Nome de guerra"
        value={nome}
        onChangeText={setNome}
      />
      {isAdmin && (
        <TextInput
          style={{ marginBottom: 20, padding: 15, borderWidth: 1, borderRadius: 5 }}
          placeholder="Senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <Text>Admin</Text>
        <Switch value={isAdmin} onValueChange={setIsAdmin} style={{ marginLeft: 10 }} />
      </View>
      <Button title="Entrar" onPress={handleLogin} />
    </View>
  );
}

// Tela de Lista de Registros
function ListaScreen({ route, navigation }) {
  const { militarId } = route.params;
  const { addOrUpdateRegistro, registros } = useContext(AppContext);
  const [justificativa, setJustificativa] = useState('');
  const [showLogout, setShowLogout] = useState(false);
  const [presenca, setPresenca] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const militar = militares.find(m => m.id === militarId);

  const handleSubmit = () => {
    const registro = { id: militar.id, justificativa, presenca, dataHora: moment().format('DD/MM/YYYY HH:mm:ss') };
    addOrUpdateRegistro(registro);
    setMensagem('Registro atualizado com sucesso.');
    setShowLogout(true);
    setJustificativa('');
    setPresenca(false);
  };

  const handleLogout = () => {
    setJustificativa('');
    setPresenca(false);
    setMensagem('');
    setShowLogout(false);
    navigation.navigate('Login');
  };

  const registroExistente = registros.find((r) => r.id === militarId && r.dataHora.startsWith(getCurrentDate()));

  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 30, paddingVertical: 40 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>{`Olá, ${militar.nome}`}</Text>
      {!registroExistente ? (
        <><Text style={{ marginLeft: 10 }}>Confirmar presença</Text>
          <Switch
            value={presenca}
            onValueChange={(value) => !justificativa && setPresenca(value)}
            style={{ marginBottom: 20 }}
          />
          <TextInput
            style={{ padding: 15, borderWidth: 1, borderRadius: 5, marginBottom: 20 }}
            placeholder="Justifique sua falta"
            value={justificativa}
            onChangeText={setJustificativa}
            editable={!presenca}
          />
          <Button title="Enviar" onPress={handleSubmit} />
        </>
      ) : (
        <Text style={{ marginTop: 20, fontSize: 16 }}>{`Registro já realizado para hoje: ${registroExistente.presenca ? 'Presente' : 'Justificado'}`}</Text>
      )}
      {mensagem !== '' && <Text style={{ marginTop: 20, color: 'green' }}>{mensagem}</Text>}
      {showLogout && <Button title="Logout" onPress={handleLogout} />}
    </View>
  );
}

// Tela do Administrador
function AdminScreen() {
  const { registros, addOrUpdateRegistro } = useContext(AppContext);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'confirmados', title: 'Confirmados' },
    { key: 'justificados', title: 'Justificados' },
    { key: 'ausentes', title: 'Ausentes' },
  ]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [militarSelecionado, setMilitarSelecionado] = useState(null);
  const [justificativaEditada, setJustificativaEditada] = useState('');
  const [presencaEditada, setPresencaEditada] = useState(false);

  const confirmados = registros.filter(r => r.presenca);
  const justificados = registros.filter(r => r.justificativa);
  const ausentes = militares.filter(m => !registros.some(r => r.id === m.id));

  const renderScene = SceneMap({
    confirmados: () => (
      <View>
        <Text>{`Total de Confirmados: ${confirmados.length}`}</Text>
        <FlatList
          data={confirmados}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={{ padding: 10, backgroundColor: '#e0e0e0', borderRadius: 5, marginBottom: 10 }}>
              <Text>{`Nome: ${militares.find(m => m.id === item.id)?.nome} - Patente: ${militares.find(m => m.id === item.id)?.patente}`}</Text>
              <Text>{`Data e Hora: ${item.dataHora}`}</Text>
            </View>
          )}
        />
      </View>
    ),
    justificados: () => (
      <View>
        <Text>{`Total de Justificados: ${justificados.length}`}</Text>
        <FlatList
          data={justificados}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={{ padding: 10, backgroundColor: '#e0e0e0', borderRadius: 5, marginBottom: 10 }}>
              <Text>{`Nome: ${militares.find(m => m.id === item.id)?.nome} - Patente: ${militares.find(m => m.id === item.id)?.patente}`}</Text>
              <Text>{`Justificativa: ${item.justificativa}`}</Text>
              <Text>{`Hora Enviada: ${item.dataHora}`}</Text>
            </View>
          )}
        />
      </View>
    ),
    ausentes: () => (
      <View>
        <Text>{`Total de Ausentes: ${ausentes.length}`}</Text>
        <FlatList
          data={ausentes}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={{ padding: 10, backgroundColor: '#e0e0e0', borderRadius: 5, marginBottom: 10 }}>
              <Text>{`Nome: ${item.nome} - Patente: ${item.patente}`}</Text>
              <Button
                title="Editar"
                onPress={() => {
                  setMilitarSelecionado(item);
                  setJustificativaEditada('');
                  setPresencaEditada(false);
                  setModalVisible(true);
                }}
              />
            </View>
          )}
        />
      </View>
    ),
  });

  const handleSaveEdit = () => {
    if (militarSelecionado) {
      const registroEditado = {
        id: militarSelecionado.id,
        justificativa: justificativaEditada,
        presenca: presencaEditada,
        dataHora: moment().format('DD/MM/YYYY HH:mm:ss')
      };
      addOrUpdateRegistro(registroEditado);
      Alert.alert("Sucesso", "Registro editado com sucesso.");
      setModalVisible(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: 400, height: 300 }}
      />
      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ width: 300, backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
            <Text style={{ fontSize: 18, marginBottom: 10 }}>{`Editar registro de ${militarSelecionado?.nome}`}</Text>
            <TextInput
              placeholder="Justificativa"
              value={justificativaEditada}
              onChangeText={setJustificativaEditada}
              style={{ padding: 10, borderWidth: 1, borderRadius: 5, marginBottom: 20 }}
            />
            <Switch
              value={presencaEditada}
              onValueChange={setPresencaEditada}
              style={{ marginBottom: 20 }}
            />
            <Button title="Salvar" onPress={handleSaveEdit} />
            <Button title="Cancelar" onPress={() => setModalVisible(false)} color="red" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Aplicação
export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
          <Stack.Screen name="Lista" component={ListaScreen} options={{ title: 'Lista de Presença' }} />
          <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Painel do Administrador' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}
