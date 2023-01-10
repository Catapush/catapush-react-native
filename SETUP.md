# Setup Guide

In order to start sending push notifications and interacting with your mobile app users, follow the instructions below:

1. Create your account by [signing up](https://www.catapush.com/d/register) for Catapush services and register your app on our Private Panel
2. Generate a [iOS Push Certificate](https://www.catapush.com/docs-ios) and a [FCM Push Notification Key](https://github.com/Catapush/catapush-docs/blob/master/AndroidSDK/DOCUMENTATION_PLATFORM_GMS_FCM.md) or a [HMS Push Notification Key](https://github.com/Catapush/catapush-docs/blob/master/AndroidSDK/DOCUMENTATION_PLATFORM_HMS_PUSHKIT.md)
4. [Integrate React Native SDK](#Integrate_react_native_sdk)

## Integrate React Native SDK

### Add Catapush React SDK dependency


### [iOS] Add a Notification Service Extension
In order to process the push notification a Notification Service Extension is required.
Add a Notification Service Extension (in Xcode File -> New -> Target...) that extends ```CatapushNotificationServiceExtension```

```swift
import Foundation
import UserNotifications
import catapush_ios_sdk_pod

extension UNNotificationAttachment {
    static func create(identifier: String, image: UIImage, options: [NSObject : AnyObject]?) -> UNNotificationAttachment? {
        let fileManager = FileManager.default
        let tmpSubFolderName = ProcessInfo.processInfo.globallyUniqueString
        let tmpSubFolderURL = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(tmpSubFolderName, isDirectory: true)
        do {
            try fileManager.createDirectory(at: tmpSubFolderURL, withIntermediateDirectories: true, attributes: nil)
            let imageFileIdentifier = identifier+".png"
            let fileURL = tmpSubFolderURL.appendingPathComponent(imageFileIdentifier)
            let data = image.pngData()
            try data!.write(to: fileURL)
            let imageAttachment = try UNNotificationAttachment.init(identifier: imageFileIdentifier, url: fileURL, options: options)
            return imageAttachment
        } catch {
        }
        return nil
    }
}

class NotificationService: CatapushNotificationServiceExtension {
    
    var receivedRequest: UNNotificationRequest?
    
    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.receivedRequest = request;
        super.didReceive(request, withContentHandler: contentHandler)
    }

    override func handleMessage(_ message: MessageIP?, withContentHandler contentHandler: ((UNNotificationContent?) -> Void)?, withBestAttempt bestAttemptContent: UNMutableNotificationContent?) {
        if let contentHandler = contentHandler, let bestAttemptContent = bestAttemptContent {
            if (message != nil) {
                bestAttemptContent.body = message!.body;
                if message!.hasMediaPreview(), let image = message!.imageMediaPreview() {
                    let identifier = ProcessInfo.processInfo.globallyUniqueString
                    if let attachment = UNNotificationAttachment.create(identifier: identifier, image: image, options: nil) {
                        bestAttemptContent.attachments = [attachment]
                    }
                }
            }else{
                bestAttemptContent.body = NSLocalizedString("no_message", comment: "");
            }
            
            let request = NSFetchRequest<NSFetchRequestResult>(entityName: "MessageIP")
            request.predicate = NSPredicate(format: "status = %i", MESSAGEIP_STATUS.MessageIP_NOT_READ.rawValue)
            request.includesSubentities = false
            do {
                let msgCount = try CatapushCoreData.managedObjectContext().count(for: request)
                bestAttemptContent.badge = NSNumber(value: msgCount)
            } catch _ {
            }
            
            contentHandler(bestAttemptContent);
        }
    }

    override func handleError(_ error: Error, withContentHandler contentHandler: ((UNNotificationContent?) -> Void)?, withBestAttempt bestAttemptContent: UNMutableNotificationContent?) {
        if let contentHandler = contentHandler, let bestAttemptContent = bestAttemptContent{
            let errorCode = (error as NSError).code
            if (errorCode == CatapushCredentialsError) {
                bestAttemptContent.body = "Please login to receive messages"
            }
            if (errorCode == CatapushNetworkError) {
                bestAttemptContent.body = "Network problems"
            }
            if (errorCode == CatapushNoMessagesError) {
                if let request = self.receivedRequest, let catapushID = request.content.userInfo["catapushID"] as? String {
                    let predicate = NSPredicate(format: "messageId = %@", catapushID)
                    if let matches = Catapush.messages(with: predicate), matches.count > 0 {
                        let message = matches.first! as! MessageIP
                        if message.status.intValue == MESSAGEIP_STATUS.MessageIP_READ.rawValue{
                            bestAttemptContent.body = "Message already read: " + message.body;
                        }else{
                            bestAttemptContent.body = "Message already received: " + message.body;
                        }
                        if message.hasMediaPreview(), let image = message.imageMediaPreview() {
                            let identifier = ProcessInfo.processInfo.globallyUniqueString
                            if let attachment = UNNotificationAttachment.create(identifier: identifier, image: image, options: nil) {
                                bestAttemptContent.attachments = [attachment]
                            }
                        }
                    }else{
                        bestAttemptContent.body = "Open the application to verify the connection"
                    }
                }else{
                    bestAttemptContent.body = "Please open the app to read the message"
                }
            }
            if (errorCode == CatapushFileProtectionError) {
                bestAttemptContent.body = "Unlock the device at least once to receive the message"
            }
            if (errorCode == CatapushConflictErrorCode) {
                bestAttemptContent.body = "Connected from another resource"
            }
            if (errorCode == CatapushAppIsActive) {
                bestAttemptContent.body = "Please open the app to read the message"
            }
            contentHandler(bestAttemptContent);
        }
    }
    
}
```

### [iOS] App Groups
Catapush need that the Notification Service Extension and the main application can share resources.
In order to do that you have to create and enable a specific app group for both the application and the extension.
The app and the extension must be in the same app group.
<img src="https://github.com/Catapush/catapush-ios-sdk-pod/blob/master/images/appgroup_1.png">
<img src="https://github.com/Catapush/catapush-ios-sdk-pod/blob/master/images/appgroup_2.png">

You should also add this information in the App plist and the Extension plist (```group.example.group``` should match the one you used for example ```group.catapush.test``` in the screens):
```objectivec
    <key>Catapush</key>
    <dict>
        <key>AppGroup</key>
        <string>group.example.group</string>
    </dict>
```

### [iOS] AppDelegate setup
In order to allow Catapush to retrieve the device token you need to add this to the AppDelegate. By doing this Catapush can intercept the device token automatically.

```objectivec
  func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
      // Custom code (can be empty)
  }
```


### [Android] AndroidManifest.xml setup
Set your Catapush app key declaring this meta-data inside the application node of your `AndroidManifest.xml`:
```xml
<meta-data
    android:name="com.catapush.library.APP_KEY"
    android:value="YOUR_APP_KEY" />
```

_YOUR_APP_KEY_ is the _AppKey_ of your Catapush App (go to your [Catapush App configuration dashboard](https://www.catapush.com/panel/dashboard), select your App by clicking "View Panel" and then click on App details section)

Then you need to declare the Catapush broadcast receiver and a permission to secure its broadcasts.

### [Android] Application class customization

You must initialize Catapush in your class that extends `Application` implementing the `ICatapushInitializer` interface.

You also have to provide your customized notification style template here.

Your `Application.onCreate()` method should contain the following lines:

```java
public class MyApplication extends MultiDexApplication implements ReactApplication, ICatapushInitializer {

    private static final String NOTIFICATION_CHANNEL_ID = "your.app.package.CHANNEL_ID";

    @Override
    public void onCreate() {
        super.onCreate();
        initCatapush();
    }

    public void initCatapush() {
        // This is the notification template that the Catapush SDK uses to build
        // the status bar notification shown to the user.
        // Customize this template to fit your needs.
        final NotificationTemplate template = new NotificationTemplate.Builder(NOTIFICATION_CHANNEL_ID)
                .swipeToDismissEnabled(false)
                .title("Your notification title!")
                .iconId(R.drawable.ic_stat_notify_default)
                .vibrationEnabled(true)
                .vibrationPattern(new long[]{100, 200, 100, 300})
                .soundEnabled(true)
                .soundResourceUri(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM))
                .circleColor(ContextCompat.getColor(SampleApplication.this, R.color.primary))
                .ledEnabled(true)
                .ledColor(Color.BLUE)
                .ledOnMS(2000)
                .ledOffMS(1000)
                .build();

        // This is the Android system notification channel that will be used by the Catapush SDK
        // to notify the incoming messages since Android 8.0. It is important that the channel
        // is created before starting Catapush.
        // Customize this channel to fit your needs.
        // See https://developer.android.com/training/notify-user/channels
        NotificationManager nm = ((NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE));
        if (nm != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            String channelName = "Catapush messages";
            NotificationChannel channel = nm.getNotificationChannel(notificationTemplate.getNotificationChannelId());
            if (channel == null) {
                channel = new NotificationChannel(notificationTemplate.getNotificationChannelId(), channelName, NotificationManager.IMPORTANCE_HIGH);
                channel.enableVibration(notificationTemplate.isVibrationEnabled());
                channel.setVibrationPattern(notificationTemplate.getVibrationPattern());
                channel.enableLights(notificationTemplate.isLedEnabled());
                channel.setLightColor(notificationTemplate.getLedColor());
                if (notificationTemplate.isSoundEnabled()) {
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_COMMUNICATION_INSTANT)
                    .build();
                channel.setSound(notificationTemplate.getSoundResourceUri(), audioAttributes);
                }
            }
            nm.createNotificationChannel(channel);
        }

        Catapush.getInstance()
            .init(
                this,
                this,
                CatapushPluginModule.Companion.getEventDelegate(),
                Collections.singletonList(CatapushGms.INSTANCE),
                CatapushPluginIntentProvider(MainActivity.class),
                template,
                null, // You can pass more templates here if you want to support multiple notification channels
                new Callback() {
                    @Override
                    public void success(Boolean response) {
                        Log.d("MyApp", "Catapush has been successfully initialized");
                    }

                    @Override
                    public void failure(@NonNull Throwable t) {
                        Log.d("MyApp", "Catapush initialization error: " + t.getMessage());
                    }
                }
            );
    }
}
```

If you are defining a custom application class for your app for the first time, remember to add it to your `AndroidManifest.xml`:

```xml
<application
    android:name=".MyApplication"
    android:icon="@mipmap/ic_launcher"
    android:label="@string/app_name"
    android:theme="@style/AppTheme">
```

Please note that, to be used, the `MultiDexApplication` requires your app to depend on the `androidx.multidex:multidex` dependency.

### [Android] MainActivity class customization

Your `MainActivity` implementation must forward the received `Intent`s to make the `catapushNotificationTapped` callback work:

```java
public class MainActivity extends ReactActivity {

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        CatapushPluginIntentProvider.Companion.handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(@NonNull Intent intent) {
        super.onNewIntent(intent);
        CatapushPluginIntentProvider.Companion.handleIntent(intent);
    }

}
```

The `Intent` instances will be handled only if generated from a Catapush notification.

### [Android] Configure a push services provider

If you want to be able to receive the messages while your app is not running in the foreground you have to integrate one of the supported services providers: Google Mobile Services or Huawei Mobile Services.

- For GMS follow [this documentation section](https://github.com/Catapush/catapush-docs/blob/master/AndroidSDK/DOCUMENTATION_ANDROID_SDK.md#google-mobile-services-gms-module)

- For HMS follow [this documentation section](https://github.com/Catapush/catapush-docs/blob/master/AndroidSDK/DOCUMENTATION_ANDROID_SDK.md#huawei-mobile-services-hms-module)

### Initialize Catapush SDK
You can now initialize Catapush using the following code:

```js
Catapush.enableLog(true);

Catapush.init('YOUR_APP_KEY')
```

Register CatapushStateDelegate and CatapushMessageDelegate in order to recieve update regard the state of the connection and the state of the messages.

```js
    Catapush.setCatapushStateDelegate(stateDelegate)
    Catapush.setCatapushMessageDelegate(messageDelegate)
```

```js
export interface CatapushStateDelegate {
  catapushStateChanged(state: CatapushState): void
  catapushHandleError(error: CatapushError): void
}
```

```js
export interface CatapushMessageDelegate {
  catapushMessageReceived(message: CatapushMessage): void
  catapushMessageSent(message: CatapushMessage): void
}
```

### Basic usage
In order to start Catapush you have to set a user and call the start method.

```js
await Catapush.setUser('ios', 'ios')
Catapush.start()
```

To send a message:
```js
await Catapush.sendMessage(outboundMessage, null, null)
```

To receive a message check the catapushMessageReceived method of your CatapushMessageDelegate.
```js
catapushMessageReceived(message: CatapushMessage) {
    
}
```

To send read receipt:
```js
await Catapush.sendMessageReadNotificationWithId("id")
```


### Example project
The demo project is  in the `/example` folder of this repository.