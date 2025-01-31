import React, { useEffect, useState } from 'react'
import { Appbar, MD3LightTheme as DefaultTheme, IconButton, PaperProvider, Snackbar, TextInput } from 'react-native-paper';
import Catapush, { CatapushError, CatapushFile, CatapushMessage, CatapushMessageDelegate, CatapushMessageWidget, CatapushState, CatapushStateDelegate } from 'catapush-react-native'
import { AppState, FlatList, PermissionsAndroid, Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const theme = {
  ...DefaultTheme,
  mode: 'exact',
  colors: {
    ...DefaultTheme.colors,
    "primary": "rgb(0, 101, 139)",
    "onPrimary": "rgb(255, 255, 255)",
    "primaryContainer": "rgb(197, 231, 255)",
    "onPrimaryContainer": "rgb(0, 30, 45)",
    "secondary": "rgb(0, 101, 139)",
    "onSecondary": "rgb(255, 255, 255)",
    "secondaryContainer": "rgb(197, 231, 255)",
    "onSecondaryContainer": "rgb(0, 30, 45)",
    "tertiary": "rgb(0, 101, 143)",
    "onTertiary": "rgb(255, 255, 255)",
    "tertiaryContainer": "rgb(200, 230, 255)",
    "onTertiaryContainer": "rgb(0, 30, 46)",
    "error": "rgb(186, 26, 26)",
    "onError": "rgb(255, 255, 255)",
    "errorContainer": "rgb(255, 218, 214)",
    "onErrorContainer": "rgb(65, 0, 2)",
    "background": "rgb(251, 252, 255)",
    "onBackground": "rgb(25, 28, 30)",
    "surface": "rgb(251, 252, 255)",
    "onSurface": "rgb(25, 28, 30)",
    "surfaceVariant": "rgb(221, 227, 234)",
    "onSurfaceVariant": "rgb(65, 72, 77)",
    "outline": "rgb(113, 120, 126)",
    "outlineVariant": "rgb(193, 199, 205)",
    "shadow": "rgb(0, 0, 0)",
    "scrim": "rgb(0, 0, 0)",
    "inverseSurface": "rgb(46, 49, 51)",
    "inverseOnSurface": "rgb(240, 241, 243)",
    "inversePrimary": "rgb(126, 208, 255)",
    "elevation": {
      "level0": "transparent",
      "level1": "rgb(238, 244, 249)",
      "level2": "rgb(231, 240, 246)",
      "level3": "rgb(223, 235, 242)",
      "level4": "rgb(221, 234, 241)",
      "level5": "rgb(216, 231, 239)"
    },
    "surfaceDisabled": "rgba(25, 28, 30, 0.12)",
    "onSurfaceDisabled": "rgba(25, 28, 30, 0.38)",
    "backdrop": "rgba(42, 49, 54, 0.4)"
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
      .then((_: any) => {
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
      .then((_: any) => Catapush.init('YOUR CATAPUSH APP KEY'))
      .then((inited: boolean) => {
        setCatapushInited(inited)
        return Catapush.start()
      })
      .then((started: boolean) => {
        setCatapushStarted(started)
      })
      .catch((error: any) =>
        setLastError(error)
      )
  }

  async function getMessages() {
    await Catapush.allMessages()
      .then((messages: CatapushMessage[]) => {
        setMessages(messages)
      })
      .catch((error: any) =>
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
        <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
          <Appbar.Content title='Catapush React Native Example' color='white' />
          <Appbar.Action icon="logout" onPress={() => {
            Catapush.logout().then((success: boolean) => console.log('Logout successful'),
              (reason: any) => console.log('Logout failed, reason: ' + reason))
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
                    .then((_: any) => setOutboundMessage(''))
                }
              }
            }} />
          <TextInput
            style={styles.messageTextInput}
            mode='outlined'
            placeholder='Type a message…'
            value={outboundMessage}
            onChangeText={(text: string) => setOutboundMessage(text)} />
          <IconButton
            icon='send'
            iconColor='white'
            size={34}
            onPress={() => {
              Catapush.sendMessage(outboundMessage, null, null, null)
                .then((_: any) => setOutboundMessage(''))
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
