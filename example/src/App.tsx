import React, { useEffect, useState } from 'react'
import { Appbar, DefaultTheme, IconButton, Provider as PaperProvider, Snackbar, TextInput } from 'react-native-paper';
import Catapush, { CatapushError, CatapushFile, CatapushMessage, CatapushMessageDelegate, CatapushMessageWidget, CatapushState, CatapushStateDelegate } from 'catapush-react-native'
import { AppState, FlatList, PermissionsAndroid, Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#50BFF7',
    accent: '#0A6994',
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingLeft: 16,
    paddingTop: 4,
    paddingRight: 0,
    paddingBottom: 4,
    backgroundColor: theme.colors.primary,
  },
  messageTextInput: {
    flexGrow: 1,
  }
})

const App = () => {
  const [catapushInited, setCatapushInited] = useState(false)
  const [catapushStarted, setCatapushStarted] = useState(false)
  const [catapushState, setCatapushState] = useState(CatapushState.DISCONNECTED.valueOf())
  const [stateSnackbarVisible, setStateSnackbarVisible] = React.useState(false);
  const [messages, setMessages] = useState([] as CatapushMessage[])
  const [lastError, setLastError] = useState(null as any)
  const [outboundMessage, setOutboundMessage] = React.useState('');

  var messageDelegate: CatapushMessageDelegate = {
    catapushMessageReceived(message: CatapushMessage) {
      getMessages()
    },
    catapushMessageSent(message: CatapushMessage) {
      getMessages()
    },
    catapushNotificationTapped(message: CatapushMessage) { }
  }

  var stateDelegate: CatapushStateDelegate = {
    catapushStateChanged(state: CatapushState) {
      setCatapushState(state)
    },
    catapushHandleError(error: CatapushError) {
      setLastError(error)
    }
  }

  async function startCatapush() {
    await Catapush.enableLog(true)
      .then((_) => {
        if (Platform.OS == 'ios')
          Catapush.setUser('ios', 'ios')
        else if (Platform.OS == 'android') {
          Catapush.setUser('android', 'android')

          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Catapush Notifications Permission',
              message:
                'Catapush need the notification permission to notify you about new messages when running in the background.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
        }
      })
      .then((_) => Catapush.init('YOUR CATAPUSH APP KEY'))
      .then((inited) => {
        setCatapushInited(inited)
        return Catapush.start()
      })
      .then((started) => {
        setCatapushStarted(started)
      })
      .catch((error) =>
        setLastError(error)
      )
  }

  async function getMessages() {
    await Catapush.allMessages()
      .then((messages) => {
        setMessages(messages)
      })
      .catch((error) =>
        setLastError(error)
      )
  }

  // Component mount callback
  useEffect(() => {
    const appStateSubscription = AppState.addEventListener("change", nextAppState => {
      if (nextAppState === "active") {
        Catapush.pauseNotifications()
      } else if (nextAppState === "background" || nextAppState === "inactive") {
        Catapush.resumeNotifications()
      }
    });

    Catapush.setCatapushMessageDelegate(messageDelegate)
    Catapush.setCatapushStateDelegate(stateDelegate)
    startCatapush().then((_) => getMessages())

    return () => {
      appStateSubscription.remove()
      Catapush.clearHandlers()
    }
  }, [])

  // Show a snackbar when the Catapush state changes
  useEffect(() => {
    setStateSnackbarVisible(true)
  }, [catapushState])

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title='Catapush React Native Example' color='white' />
          <Appbar.Action icon="logout" onPress={() => {
            Catapush.logout().then((success) => console.log('Logout successful'),
              (reason) => console.log('Logout failed, reason: ' + reason))
          }} color='white' />
        </Appbar.Header>
        <FlatList
          inverted
          data={messages}
          renderItem={(info) => {
            return <CatapushMessageWidget message={info.item} />
          }}
          keyExtractor={item => item.id}
        />
        <View style={styles.messageInputContainer}>
          <IconButton
            icon='camera'
            iconColor='white'
            size={34}
            onPress={async () => {
              const result = await launchImageLibrary({
                mediaType: 'photo',
              });
              console.log(result);
              const assets = result.assets
              if (assets != null) {
                const asset = assets[0];
                const type = asset.type
                const uri = asset.uri
                if (type != null && uri != null) {
                  Catapush.sendMessage(outboundMessage, null, null, new CatapushFile(type, uri))
                    .then((_) => setOutboundMessage(''))
                }
              }
            }} />
          <TextInput
            style={styles.messageTextInput}
            mode='outlined'
            placeholder='Type a message…'
            value={outboundMessage}
            onChangeText={text => setOutboundMessage(text)} />
          <IconButton
            icon='send'
            iconColor='white'
            size={34}
            onPress={() => {
              Catapush.sendMessage(outboundMessage, null, null, null)
                .then((_) => setOutboundMessage(''))
            }} />
        </View>
        <Snackbar
          visible={stateSnackbarVisible}
          duration={3000}
          onDismiss={() => setStateSnackbarVisible(false)}>
          {'Catapush state: ' + catapushState}
        </Snackbar>
      </SafeAreaView>
    </PaperProvider>
  )
}

export default App
